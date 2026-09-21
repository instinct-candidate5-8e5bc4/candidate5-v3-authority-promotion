# V3-VerifyPackage.ps1 (package v6) - binds the CI run to the EXACT reviewed package bytes. Runs
# first, from the checkout (it trusts nothing): the operator supplies the reviewed package SHA-256
# and byte size as workflow_dispatch inputs taken from the accepted review; the committed zip must
# match them EXACTLY, then it is extracted to an ephemeral directory and every member is compared
# byte-for-byte against the reviewed source tree in the same commit. The compatibility proof then
# executes ONLY against these extracted, verified bytes - never against mutable branch-head content.
param(
  [Parameter(Mandatory=$true)][string]$ExpectedSha,
  [Parameter(Mandatory=$true)][long]$ExpectedSize,
  [string]$RepoRoot = '.',
  [string]$ZipPath = 'package\V3-PRODUCTION-SIGNING-PACKAGE-v6.zip',
  [string]$ExtractDir = (Join-Path $env:RUNNER_TEMP 'v3-pkg')
)
$ErrorActionPreference = 'Stop'
function Stop-Step($code, $msg) { throw ("STOP $code - $msg") }
function Check($cond, $code, $msg) { if (-not $cond) { Stop-Step $code $msg } }
function Write-Failure($err) {
  $m = $err.Exception.Message
  if ($m -match '^STOP ') { Write-Host $m }
  else {
    $safe = ($m -replace '[^\x20-\x7E]', ' ')
    if ($safe.Length -gt 400) { $safe = $safe.Substring(0, 400) }
    Write-Host "STOP E_UNEXPECTED - $safe"
  }
}
$script:ExitCode = 0
try {
  Check ($env:ACTIONS_STEP_DEBUG -ne 'true') 'E_DEBUG' 'ACTIONS_STEP_DEBUG is enabled on this run; rerun with step debugging disabled.'
  Write-Host '== V3 PACKAGE BINDING VERIFICATION (v6) =='
  Write-Host "Run URL: $env:GITHUB_SERVER_URL/$env:GITHUB_REPOSITORY/actions/runs/$env:GITHUB_RUN_ID"
  Write-Host "Source commit:   $env:GITHUB_SHA"
  Write-Host "Delivery commit: $env:GITHUB_SHA (the zip is committed on this same reviewed commit)"
  $wf = Join-Path $RepoRoot '.github\workflows\v3-windows-compat-proof.yml'
  Check (Test-Path -LiteralPath $wf) 'E_PACKAGE' "Workflow file missing: $wf"
  $blob = (& git -C $RepoRoot hash-object -- '.github/workflows/v3-windows-compat-proof.yml' 2>$null)
  Write-Host "WORKFLOW GIT BLOB $blob"
  Write-Host ("WORKFLOW SHA256 " + (Get-FileHash -Algorithm SHA256 -LiteralPath $wf).Hash.ToLower())

  $zip = Join-Path $RepoRoot $ZipPath
  Check (Test-Path -LiteralPath $zip) 'E_PACKAGE_MISSING' "Reviewed package zip not found at $ZipPath."
  $len = (Get-Item -LiteralPath $zip).Length
  Write-Host "PACKAGE FILE $ZipPath size $len bytes (reviewed: $ExpectedSize)"
  Check ($len -eq $ExpectedSize) 'E_PACKAGE_SIZE' "Package size $len != reviewed $ExpectedSize."
  $sha = (Get-FileHash -Algorithm SHA256 -LiteralPath $zip).Hash.ToLower()
  Write-Host "PACKAGE SHA256 $sha (reviewed: $($ExpectedSha.ToLower()))"
  Check ($sha -eq $ExpectedSha.ToLower()) 'E_PACKAGE_HASH' 'Package SHA-256 does not match the reviewed value.'

  if (Test-Path -LiteralPath $ExtractDir) { Remove-Item -LiteralPath $ExtractDir -Recurse -Force }
  New-Item -ItemType Directory -Path $ExtractDir | Out-Null
  Expand-Archive -LiteralPath $zip -DestinationPath $ExtractDir

  $expected = @(
    'OWNER_PRODUCTION_SIGNING_RUNBOOK_WINDOWS-v6.md',
    'scripts/V3-Part0-Preflight.ps1',
    'scripts/V3-Part1-KeyCreation.ps1',
    'scripts/V3-Part2-SignUKI.ps1',
    'scripts/V3-Part3-FinalizeAndDetachedSign.ps1',
    'scripts/V3-Part4-EvidenceAndCleanup.ps1',
    'ci/V3-VerifyPackage.ps1',
    'ci/V3-WindowsCompatProof.ps1',
    'ci/V3-WindowsCompatCleanup.ps1',
    '.github/workflows/v3-windows-compat-proof.yml',
    '.gitattributes'
  )
  foreach ($m in $expected) {
    $ex = Join-Path $ExtractDir ($m -replace '/', '\')
    $src = Join-Path $RepoRoot ($m -replace '/', '\')
    Check (Test-Path -LiteralPath $ex) 'E_MEMBER_SET' "Member missing from package: $m"
    Check (Test-Path -LiteralPath $src) 'E_MEMBER_SET' "Member missing from source tree: $m"
    $h = (Get-FileHash -Algorithm SHA256 -LiteralPath $ex).Hash.ToLower()
    Write-Host ("MEMBER SHA256 " + $m + " " + $h)
    $eb = [IO.File]::ReadAllBytes($ex)
    $sb = [IO.File]::ReadAllBytes($src)
    $equal = ($eb.Length -eq $sb.Length)
    if ($equal) { for ($i = 0; $i -lt $eb.Length; $i++) { if ($eb[$i] -ne $sb[$i]) { $equal = $false; break } } }
    Check ($equal) 'E_MEMBER_MISMATCH' "Member $m differs between the reviewed package and the source tree."
  }
  $actual = @(Get-ChildItem -LiteralPath $ExtractDir -Recurse -File -Force | ForEach-Object { $_.FullName.Substring($ExtractDir.Length + 1).Replace('\', '/') })
  $extra = @($actual | Where-Object { $expected -notcontains $_ })
  Check ($extra.Count -eq 0) 'E_MEMBER_SET' "Unexpected files in package: $($extra -join ', ')"
  Check ($actual.Count -eq $expected.Count) 'E_MEMBER_SET' "Package member count $($actual.Count) != expected $($expected.Count)."
  Write-Host "PACKAGE BINDING PASS - reviewed hash and size match; all $($expected.Count) members byte-identical to the reviewed source tree; proof will run against the extracted bytes at $ExtractDir."
} catch {
  Write-Failure $_
  $script:ExitCode = 1
}
exit $script:ExitCode
