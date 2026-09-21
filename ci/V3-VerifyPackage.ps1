# V3-VerifyPackage.ps1 (package v7) - binds the CI run to the EXACT reviewed package bytes. Runs
# first, from the checkout, and trusts nothing mutable: the operator supplies the reviewed commit,
# package SHA-256 and byte size as workflow_dispatch inputs from the accepted review; HEAD must BE
# the reviewed commit; the committed zip must match the reviewed hash/size EXACTLY; the zip is
# extracted to an ephemeral directory; and every member is compared byte-for-byte against the
# CANONICAL COMMITTED BLOB at the reviewed HEAD (git ls-tree + git cat-file) - never against the
# working tree, whose bytes autocrlf or any checkout transformation may rewrite. No newline
# normalization, no excluded member. A deterministic verifier fixture then proves (a) a CRLF-mutated
# working tree does NOT affect the canonical comparison and (b) a one-byte mutation of an extracted
# member still fails. The proof executes ONLY against these extracted, verified bytes.
param(
  [Parameter(Mandatory=$true)][string]$ExpectedCommit,
  [Parameter(Mandatory=$true)][string]$ExpectedSha,
  [Parameter(Mandatory=$true)][long]$ExpectedSize,
  [string]$RepoRoot = '.',
  [string]$ZipPath = 'package\V3-PRODUCTION-SIGNING-PACKAGE-v7.zip',
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
function Sha256Hex([byte[]]$bytes) { ([BitConverter]::ToString(([Security.Cryptography.SHA256]::Create()).ComputeHash($bytes))).Replace('-','').ToLower() }

# --- Canonical committed-blob bytes at HEAD (binary-safe: raw process stdout stream, never the -----
# --- PowerShell pipeline and never the working-tree file). ------------------------------------------
function Get-GitBlobOid([string]$gitPath) {
  $lt = (& git -C $RepoRoot ls-tree HEAD -- $gitPath 2>$null)
  Check ($lt) 'E_GIT' "git ls-tree found no committed blob for $gitPath at HEAD."
  return ($lt -split '\s+')[2]
}
function Get-GitBlobBytes([string]$oid) {
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = 'git'
  $psi.Arguments = '-C "' + $RepoRoot + '" cat-file blob ' + $oid
  $psi.RedirectStandardOutput = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $p = [System.Diagnostics.Process]::Start($psi)
  $ms = New-Object System.IO.MemoryStream
  $p.StandardOutput.BaseStream.CopyTo($ms)
  $p.WaitForExit()
  if ($p.ExitCode -ne 0) { Stop-Step 'E_GIT' "git cat-file blob $oid failed (exit $($p.ExitCode))." }
  return $ms.ToArray()
}

# --- Compare one extracted member byte-for-byte against its canonical committed blob; log everything.
function Compare-MemberToBlob([string]$member, [string]$extractedPath) {
  $gitPath = $member.Replace('\', '/')
  $oid = Get-GitBlobOid $gitPath
  $blobBytes = Get-GitBlobBytes $oid
  $exBytes = [IO.File]::ReadAllBytes($extractedPath)
  $bh = Sha256Hex $blobBytes
  $eh = Sha256Hex $exBytes
  $equal = ($blobBytes.Length -eq $exBytes.Length)
  if ($equal) { for ($i = 0; $i -lt $blobBytes.Length; $i++) { if ($blobBytes[$i] -ne $exBytes[$i]) { $equal = $false; break } } }
  Write-Host ("MEMBER " + $member + " blob " + $oid + " srclen " + $blobBytes.Length + " srcsha " + $bh + " extlen " + $exBytes.Length + " extsha " + $eh + " equal " + $equal)
  return $equal
}

$script:ExitCode = 0
try {
  Check ($env:ACTIONS_STEP_DEBUG -ne 'true') 'E_DEBUG' 'ACTIONS_STEP_DEBUG is enabled on this run; rerun with step debugging disabled.'
  Write-Host '== V3 PACKAGE BINDING VERIFICATION (v7, canonical committed-blob comparison) =='
  Write-Host "Run URL: $env:GITHUB_SERVER_URL/$env:GITHUB_REPOSITORY/actions/runs/$env:GITHUB_RUN_ID"
  $head = (& git -C $RepoRoot rev-parse HEAD 2>$null)
  Check ($head) 'E_GIT' 'git rev-parse HEAD failed.'
  $head = $head.Trim().ToLower()
  Write-Host "Source commit (HEAD):   $head"
  Write-Host "Reviewed commit (input): $($ExpectedCommit.ToLower())"
  Check ($head -eq $ExpectedCommit.ToLower()) 'E_COMMIT' 'HEAD is not the reviewed commit.'
  Write-Host "Delivery commit: $head (the reviewed zip is committed on this same reviewed commit)"
  $wfOid = Get-GitBlobOid '.github/workflows/v3-windows-compat-proof.yml'
  $wfBytes = Get-GitBlobBytes $wfOid
  Write-Host "WORKFLOW GIT BLOB $wfOid"
  Write-Host ("WORKFLOW BLOB SHA256 " + (Sha256Hex $wfBytes))

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
    'OWNER_PRODUCTION_SIGNING_RUNBOOK_WINDOWS-v7.md',
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
    Check (Test-Path -LiteralPath $ex) 'E_MEMBER_SET' "Member missing from package: $m"
    $eq = Compare-MemberToBlob $m $ex
    Check ($eq) 'E_MEMBER_MISMATCH' "Member $m differs between the extracted package and the canonical committed blob at the reviewed HEAD."
  }
  $actual = @(Get-ChildItem -LiteralPath $ExtractDir -Recurse -File -Force | ForEach-Object { $_.FullName.Substring($ExtractDir.Length + 1).Replace('\', '/') })
  $extra = @($actual | Where-Object { $expected -notcontains $_ })
  Check ($extra.Count -eq 0) 'E_MEMBER_SET' "Unexpected files in package: $($extra -join ', ')"
  Check ($actual.Count -eq $expected.Count) 'E_MEMBER_SET' "Package member count $($actual.Count) != expected $($expected.Count)."
  Write-Host "PACKAGE BINDING PASS - reviewed commit/hash/size match; all $($expected.Count) members byte-identical to their canonical committed blobs at the reviewed HEAD."

  # ---- Deterministic verifier fixture -------------------------------------------------------------
  # (a) CRLF-mutate the WORKING-TREE copy of .gitattributes: the canonical comparison must be UNAFFECTED.
  $wtAttr = Join-Path $RepoRoot '.gitattributes'
  $wtBytes = [IO.File]::ReadAllBytes($wtAttr)
  $wtText = [Text.Encoding]::UTF8.GetString($wtBytes) -replace "`r`n", "`n" -replace "`n", "`r`n"
  [IO.File]::WriteAllBytes($wtAttr, [Text.Encoding]::UTF8.GetBytes($wtText))
  $eqA = Compare-MemberToBlob '.gitattributes' (Join-Path $ExtractDir '.gitattributes')
  Check ($eqA) 'E_TEST' 'Verifier fixture (a) failed: CRLF-mutated working tree affected the canonical-blob comparison.'
  Write-Host 'VERIFIER FIXTURE (a) PASS - CRLF-mutated working-tree file does NOT affect canonical committed-blob comparison.'
  # restore the working-tree file from the canonical blob (runner is ephemeral; restore anyway)
  [IO.File]::WriteAllBytes($wtAttr, (Get-GitBlobBytes (Get-GitBlobOid '.gitattributes')))
  # (b) Flip one byte in a COPY of an extracted member: the comparison must FAIL.
  $mutCopy = Join-Path $env:RUNNER_TEMP 'v3-mutated-member.bin'
  $mutBytes = [IO.File]::ReadAllBytes((Join-Path $ExtractDir 'scripts\V3-Part0-Preflight.ps1'))
  $mutBytes[0] = ($mutBytes[0] -bxor 0xFF)
  [IO.File]::WriteAllBytes($mutCopy, $mutBytes)
  $eqB = Compare-MemberToBlob 'scripts/V3-Part0-Preflight.ps1' $mutCopy
  Check (-not $eqB) 'E_TEST' 'Verifier fixture (b) failed: a one-byte extracted-member mutation was not detected.'
  Write-Host 'VERIFIER FIXTURE (b) PASS - one-byte mutation of an extracted member correctly compares unequal (E_MEMBER_MISMATCH would fire).'
  Remove-Item -LiteralPath $mutCopy -Force
  Write-Host 'VERIFIER FIXTURE PASS - the binding detects byte mutations and is immune to checkout transformations.'
} catch {
  Write-Failure $_
  $script:ExitCode = 1
}
exit $script:ExitCode
