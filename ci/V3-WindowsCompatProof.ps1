# V3-WindowsCompatProof.ps1 (package v10) - bounded disposable compatibility proof on a GitHub Actions
# windows-latest runner, under Windows PowerShell 5.1 ONLY. It runs ONLY against the extracted,
# hash-verified reviewed package bytes (see V3-VerifyPackage.ps1): every helper function is pulled out
# of the shipped production scripts through the PowerShell parser (AST), and the inline verification
# blocks are pulled out by asserted unique markers, hashed, and executed. Nothing is reimplemented.
#
# THREE REAL CLEANUP LIFETIMES, each closed by the exact shipped helper plus the 5-way absence set:
#   1. the generated fixture key (cleanup-1);
#   2. the FIRST non-exportable PFX import, used for SignTool + Authenticode (cleanup-2);
#   3. a SECOND non-exportable PFX import, used for the detached-signature path (cleanup-3).
# EPOCH MODEL (owner ruling): a PFX carries its keypair AND its container name, so the second import
# may recreate a container under the SAME KeyName. Safety is proved TEMPORALLY, never from name
# equality: lifetime 2's full absence is re-asserted immediately before the import (epoch markers
# bracket it), the container is then proved LIVE (cert, Exists/Open, RSACng, RSA-3072, provider,
# modulus/exponent/thumbprint match, ExportPolicy None, UniqueName store evidence), a fresh post-import
# nonce digest is signed by the imported private key and verified with the public certificate, and an
# OVERLAP NEGATIVE FIXTURE proves the precondition stops on a live prior container before the positive
# flow. Both outcomes - "SEQUENTIAL NAME REUSE OBSERVED - prior lifetime proved absent before
# recreation" and "DISTINCT IMPORT NAME OBSERVED" - proceed through identical assertions.
# The Part 4 positive fixture uses the three recorded lifetimes (identifiers may repeat across
# non-overlapping lifetimes; records are never dropped); the negative fixture uses a LIVE decoy and
# must produce E_KEY_CONTAINER_REMAINS.
#
# Safety: a sentinel + cleanup manifest are written BEFORE any key exists; every resource is
# registered the moment it is created; a nested finally performs best-effort cleanup; the workflow's
# if:always() cleanup step is the outer net and FAILS the job on any remnant. -SimulateFailureAfterKeyCreation
# exercises a controlled premature stop right after fixture key creation (in-process cleanup skipped)
# so the always-cleanup step is proven against a real leftover. The ephemeral PFX password is built
# from RandomNumberGenerator bytes appended char-by-char directly into a SecureString: no plaintext
# string ever exists, nothing maskable is ever created, the byte buffer is cleared; tracing/verbose/
# debug output is disabled and the run refuses ACTIONS_STEP_DEBUG. DISPOSABLE FIXTURES ONLY.
param(
  [Parameter(Mandatory=$true)][string]$PkgRoot,
  [string]$WorkDir = (Join-Path $env:RUNNER_TEMP 'v3-compat'),
  [switch]$SimulateFailureAfterKeyCreation
)
$ErrorActionPreference = 'Stop'
$VerbosePreference = 'SilentlyContinue'
$DebugPreference = 'SilentlyContinue'
Set-PSDebug -Off
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

# --- Exact-bytes extraction from the shipped production scripts -------------------------------------
function Get-ShippedFunctionText([string]$path, [string]$name) {
  $tokens = $null; $errors = $null
  $ast = [System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$tokens, [ref]$errors)
  if ($errors -and $errors.Count -gt 0) { Stop-Step 'E_EXTRACT' "Parse errors in $path" }
  $fn = $ast.Find({ param($a) $a -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $a.Name -eq $name }, $false)
  if (-not $fn) { Stop-Step 'E_EXTRACT' "Function $name not found in $path" }
  return $fn.Extent.Text
}
function Get-ShippedBlockText([string]$path, [string]$startMarker, [string]$endMarker, [int]$indent, [bool]$includeEnd) {
  $raw = [IO.File]::ReadAllText($path)
  $first = $raw.IndexOf($startMarker)
  Check ($first -ge 0) 'E_EXTRACT' "Start marker not found in ${path}: $startMarker"
  Check ($raw.IndexOf($startMarker, $first + 1) -lt 0) 'E_EXTRACT' "Start marker not unique in ${path}: $startMarker"
  $end = $raw.IndexOf($endMarker, $first)
  Check ($end -ge 0) 'E_EXTRACT' "End marker not found in ${path}: $endMarker"
  if ($includeEnd) { $nl = $raw.IndexOf("`n", $end); if ($nl -lt 0) { $nl = $raw.Length }; $end = $nl }
  $block = $raw.Substring($first, $end - $first).TrimEnd()
  $pad = (' ' * $indent)
  $lines = $block -split "`r?`n" | ForEach-Object { if ($_.StartsWith($pad)) { $_.Substring($indent) } else { $_ } }
  return ($lines -join "`n")
}

# --- 5-way absence assertion: thumbprint, Exists(KeyName), Open(KeyName), store enumeration by ------
# --- KeyName AND UniqueName, Open(UniqueName). All must show absence. -------------------------------
function Assert-FullAbsence([string]$thumb, [string]$kn, [string]$un, [string]$provStr, [string]$label) {
  $certThere = [bool](Get-ChildItem 'Cert:\CurrentUser\My' | Where-Object Thumbprint -eq $thumb)
  Write-Host "  [$label] certificate thumbprint present in store: $certThere (must be False)"
  $prov = New-Object System.Security.Cryptography.CngProvider($provStr)
  $ex = [System.Security.Cryptography.CngKey]::Exists($kn, $prov)
  Write-Host "  [$label] CngKey.Exists(KeyName, provider): $ex (must be False)"
  $opened = $false
  try { $k2 = [System.Security.Cryptography.CngKey]::Open($kn, $prov); $k2.Dispose(); $opened = $true } catch { $opened = $false }
  Write-Host "  [$label] CngKey.Open(KeyName, provider) succeeded: $opened (must be False)"
  $kspDir = Join-Path $env:APPDATA 'Microsoft\Crypto\Keys'
  $fsKn = $false; $fsUn = $false
  if (Test-Path -LiteralPath $kspDir) {
    $files = Get-ChildItem -LiteralPath $kspDir -File
    $fsKn = [bool]($files | Where-Object Name -eq $kn)
    $fsUn = [bool]($files | Where-Object Name -eq $un)
  }
  Write-Host "  [$label] key-store file named KeyName present: $fsKn; named UniqueName present: $fsUn (both must be False)"
  $opUn = $false
  try { $k3 = [System.Security.Cryptography.CngKey]::Open($un, $prov); $k3.Dispose(); $opUn = $true } catch { $opUn = $false }
  Write-Host "  [$label] CngKey.Open(UniqueName, provider) succeeded: $opUn (must be False)"
  if ($certThere -or $ex -or $opened -or $fsKn -or $fsUn -or $opUn) { Stop-Step 'E_CLEANUP_FAILED' "[$label] absence verification failed; report this code." }
  Write-Host "  [$label] FULL ABSENCE PASS (thumbprint; Exists(KeyName); Open(KeyName); store enumeration by KeyName and UniqueName; Open(UniqueName))"
}

# --- Liveness assertion (owner ruling): prove the freshly imported lifetime-3 container is LIVE. ----
function Assert-FullyLive([string]$thumb, $ids, $certObj, [string]$cerFile, [string]$label) {
  $present = [bool](Get-ChildItem 'Cert:\CurrentUser\My' | Where-Object Thumbprint -eq $thumb)
  Write-Host "  [$label] matching certificate present in store: $present (must be True)"
  $prov = New-Object System.Security.Cryptography.CngProvider($ids.Provider)
  $ex = [System.Security.Cryptography.CngKey]::Exists($ids.KeyName, $prov)
  Write-Host "  [$label] CngKey.Exists(KeyName, provider): $ex (must be True)"
  $opened = $false
  try { $k2 = [System.Security.Cryptography.CngKey]::Open($ids.KeyName, $prov); $k2.Dispose(); $opened = $true } catch { $opened = $false }
  Write-Host "  [$label] CngKey.Open(KeyName, provider) succeeded: $opened (must be True)"
  $isCng = ($null -ne $ids.Rsa) -and ($ids.Rsa -is [System.Security.Cryptography.RSACng])
  $provOk = ($ids.Provider -eq 'Microsoft Software Key Storage Provider')
  $sizeOk = ($ids.Rsa.KeySize -eq 3072)
  $nonExp = ($ids.Rsa.Key.ExportPolicy -eq [System.Security.Cryptography.CngExportPolicies]::None)
  Write-Host "  [$label] RSACng available: $isCng; provider Microsoft Software KSP: $provOk; RSA-3072: $sizeOk; ExportPolicy None: $nonExp (all must be True)"
  $cerCert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($cerFile)
  $cerPub = [Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPublicKey($cerCert)
  $expP = $cerPub.ExportParameters($false)
  $gotP = $ids.Rsa.ExportParameters($false)
  $modOk = ((Sha256Hex $expP.Modulus) -eq (Sha256Hex $gotP.Modulus))
  $expOk = ((Sha256Hex $expP.Exponent) -eq (Sha256Hex $gotP.Exponent))
  try { $cerPub.Dispose() } catch {}
  try { $cerCert.Dispose() } catch {}
  $thumbOk = ($certObj.Thumbprint -eq $thumb)
  Write-Host "  [$label] public modulus matches fixture: $modOk; public exponent matches fixture: $expOk; thumbprint matches fixture: $thumbOk (all must be True)"
  $unPresent = $false
  $kspDir = Join-Path $env:APPDATA 'Microsoft\Crypto\Keys'
  if (Test-Path -LiteralPath $kspDir) { $unPresent = [bool](Get-ChildItem -LiteralPath $kspDir -File | Where-Object Name -eq $ids.UniqueName) }
  Write-Host "  [$label] UniqueName store evidence present (software KSP exposes it): $unPresent (must be True on this provider)"
  if (-not ($present -and $ex -and $opened -and $isCng -and $provOk -and $sizeOk -and $nonExp -and $modOk -and $expOk -and $thumbOk -and $unPresent)) { Stop-Step 'E_LIVE_PROOF' "[$label] liveness proof failed; report this code." }
  Write-Host "  [$label] LIFETIME-3 LIVE PASS (certificate present; Exists/Open by KeyName; RSACng RSA-3072 software-KSP; modulus/exponent/thumbprint match; ExportPolicy None; UniqueName store evidence)"
}

# --- Static free-variable contract for an extracted shipped block (owner ruling): enumerate every ---
# --- variable the block READS but never ASSIGNS (AST-based; helper-local assignments, function     ---
# --- parameters and loop variables are bound inside the block) and require the exact expected set.  ---
function Assert-BlockFreeVariables([string]$blockText, [string[]]$expectedFree, [string]$label) {
  $tokens = $null; $parseErrs = $null
  $ast = [System.Management.Automation.Language.Parser]::ParseInput($blockText, [ref]$tokens, [ref]$parseErrs)
  Check ($parseErrs.Count -eq 0) 'E_TEST_CONTEXT' "[$label] shipped block text failed to parse in the harness; report this code."
  $assigned = @{}
  foreach ($node in $ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.AssignmentStatementAst] }, $true)) {
    $lhs = $node.Left
    while ($lhs -is [System.Management.Automation.Language.AttributedExpressionAst]) { $lhs = $lhs.Child }
    if ($lhs -is [System.Management.Automation.Language.VariableExpressionAst]) { $assigned[$lhs.VariablePath.UserPath.ToLowerInvariant()] = $true }
  }
  foreach ($node in $ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] }, $true)) {
    if ($node.Parameters) {
      foreach ($pr in $node.Parameters) { $assigned[$pr.Name.VariablePath.UserPath.ToLowerInvariant()] = $true }
    }
    if ($node.Body.ParamBlock -and $node.Body.ParamBlock.Parameters) {
      foreach ($pr in $node.Body.ParamBlock.Parameters) { $assigned[$pr.Name.VariablePath.UserPath.ToLowerInvariant()] = $true }
    }
  }
  foreach ($node in $ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.ForEachStatementAst] }, $true)) {
    $assigned[$node.Variable.VariablePath.UserPath.ToLowerInvariant()] = $true
  }
  $automatic = @('true','false','null','_','psitem','args','input','this','matches','error','erroractionpreference','executioncontext','host','home','pid','psculture','psversiontable','shellid','pwd','foreach','switch','consolefilename')
  $referenced = @{}
  foreach ($node in $ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.VariableExpressionAst] }, $true)) {
    if ($node.IsConstantVariable()) { continue }
    if ($node.VariablePath.IsQualified -or $node.VariablePath.IsScript -or $node.VariablePath.IsGlobal -or $node.VariablePath.IsLocal -or $node.VariablePath.IsPrivate) { continue }
    $name = $node.VariablePath.UserPath
    if ([string]::IsNullOrEmpty($name)) { continue }
    $referenced[$name.ToLowerInvariant()] = $true
  }
  $free = @($referenced.Keys | Where-Object { -not $assigned.ContainsKey($_) -and $automatic -notcontains $_ } | Sort-Object)
  $expected = @($expectedFree | ForEach-Object { $_.ToLowerInvariant() } | Sort-Object)
  $freeStr = ($free -join ','); $expStr = ($expected -join ',')
  Write-Host "  [$label] static free-variable contract: expected {$expStr}; observed {$freeStr}"
  Check ($freeStr -eq $expStr) 'E_TEST_CONTEXT' "[$label] free-variable contract drift: expected {$expStr}, observed {$freeStr}; an implicit-name binding mismatch would otherwise go unnoticed. Report this code."
  Write-Host "  [$label] FREE-VARIABLE CONTRACT PASS - the shipped block reads exactly the asserted production names."
}

# --- Decode-block context adapter (owner ruling): the shipped PSS structural decode block runs      ---
# --- byte-exact, but only under an explicit binding of its production free variables ($imported,    ---
# --- $digest, $sig). Context is checked BEFORE any block execution; completion is proved by the     ---
# --- block's own exact PASS marker, never inferred from the absence of an exception.                ---
function Invoke-PssDecodeBlock($importedCert, [string]$expectedThumb, [byte[]]$digestBytes, [byte[]]$sigBytes, [string]$blockText) {
  Check ($null -ne $importedCert) 'E_TEST_CONTEXT' 'PSS decode block invoked with a null certificate context; the harness failed to bind the lifetime-3 import. Report this code.'
  Check ($importedCert.Thumbprint -eq $expectedThumb) 'E_TEST_CONTEXT' 'PSS decode block certificate context does not match the lifetime-3 import thumbprint; report this code.'
  # Bind the extracted block's contract explicitly (production variable names).
  $imported = $importedCert
  $digest = $digestBytes
  $sig = $sigBytes
  try {
    $blkOut = @(. ([ScriptBlock]::Create($blockText)) 6>&1)
  } finally {
    $imported = $null
  }
  foreach ($line in $blkOut) { Write-Host ("$line") }
  $marker = [bool]($blkOut | Where-Object { ("$_") -match 'PSS STRUCTURAL PROOF PASS' })
  Check ($marker) 'E_TEST' 'PSS structural decode block ended without emitting its exact PSS STRUCTURAL PROOF PASS marker; completion is never inferred from the absence of an exception. Report this code.'
  Write-Host 'PSS DECODE ADAPTER PASS - shipped block bytes executed under the explicit binding; the block-s own completion marker was observed.'
}

# --- Cleanup manifest (non-secret identifiers only), saved BEFORE any key exists --------------------
$script:Manifest = @{ thumbprints = @(); containers = @(); files = @(); dirs = @($WorkDir) }
function Save-Manifest { ($script:Manifest | ConvertTo-Json -Depth 4) | Set-Content -LiteralPath "$WorkDir\cleanup-manifest.json" -Encoding ASCII }
# Records may repeat across non-overlapping lifetimes (sequential name reuse); cleanup stays
# idempotent (Exists before delete) and verifies final absence per recorded lifetime. No record is
# ever dropped; deduplication, if any, is display-only.
function Add-ManifestContainer($kn, $un, $prov) { $script:Manifest.containers += @{ keyName = $kn; uniqueName = $un; provider = $prov } }

# --- Nested best-effort cleanup (the workflow's if:always() step is the outer, verifying net) -------
function Invoke-BestEffortCleanup {
  foreach ($t in @($script:Manifest.thumbprints)) {
    foreach ($h in @(Get-ChildItem 'Cert:\CurrentUser\My' | Where-Object Thumbprint -eq $t)) {
      try { Remove-Item -LiteralPath $h.PSPath -Force } catch {}
    }
  }
  foreach ($c in @($script:Manifest.containers)) {
    try {
      $prov = New-Object System.Security.Cryptography.CngProvider($c.provider)
      if ([System.Security.Cryptography.CngKey]::Exists($c.keyName, $prov)) {
        $k = [System.Security.Cryptography.CngKey]::Open($c.keyName, $prov); $k.Delete(); $k.Dispose()
      }
    } catch {}
  }
  foreach ($f in @($script:Manifest.files)) { try { if ($f -and (Test-Path -LiteralPath $f)) { Remove-Item -LiteralPath $f -Force } } catch {} }
}

# --- New fixture certificate helper (same parameters everywhere) ------------------------------------
function New-FixtureCert([string]$subject, [bool]$exportable) {
  $policy = 'NonExportable'
  if ($exportable) { $policy = 'Exportable' }
  return New-SelfSignedCertificate `
    -Type Custom -Subject $subject `
    -KeyAlgorithm RSA -KeyLength 3072 -HashAlgorithm SHA256 `
    -KeyExportPolicy $policy -KeyUsage DigitalSignature `
    -TextExtension @('2.5.29.19={critical}{text}ca=false','2.5.29.37={text}1.3.6.1.5.5.7.3.3') `
    -CertStoreLocation 'Cert:\CurrentUser\My' -NotBefore (Get-Date).ToUniversalTime().Date -NotAfter (Get-Date).ToUniversalTime().Date.AddDays(2)
}
function Capture-KeyIds($cert, [string]$code) {
  $r = [Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
  Check ($null -ne $r) $code 'No private key on fixture certificate.'
  Check ($r -is [System.Security.Cryptography.RSACng]) 'E_KEY_PROVIDER' 'Fixture key is not CNG (RSACng).'
  Check ($r.Key.Provider.Provider -eq 'Microsoft Software Key Storage Provider') 'E_KEY_PROVIDER' "Unexpected provider '$($r.Key.Provider.Provider)'."
  Check ($r.KeySize -eq 3072) 'E_KEY_SIZE' "Key size $($r.KeySize), expected 3072."
  $ids = @{ KeyName = $r.Key.KeyName; UniqueName = $r.Key.UniqueName; Provider = $r.Key.Provider.Provider; Rsa = $r }
  Check ($ids.KeyName -and $ids.UniqueName) $code 'Could not capture fixture KeyName/UniqueName.'
  return $ids
}

$script:ExitCode = 0
$pw = $null
try {
  Check ($PSVersionTable.PSVersion.Major -eq 5) 'E_PLATFORM' "This proof must run under Windows PowerShell 5.1; got $($PSVersionTable.PSVersion)."
  Check ($env:ACTIONS_STEP_DEBUG -ne 'true') 'E_DEBUG' 'ACTIONS_STEP_DEBUG is enabled on this run; rerun with step debugging disabled.'
  if (-not (Test-Path -LiteralPath $WorkDir)) { New-Item -ItemType Directory -Path $WorkDir | Out-Null }
  if (-not (Test-Path -LiteralPath "$WorkDir\work")) { New-Item -ItemType Directory -Path "$WorkDir\work" | Out-Null }
  Set-Content -LiteralPath "$WorkDir\PROOF-BEGAN.sentinel" -Value 'proof began' -Encoding ASCII
  Save-Manifest
  Write-Host '== V3 WINDOWS POWERSHELL 5.1 COMPATIBILITY PROOF (package v6, disposable fixtures only) =='

  # ---- Platform facts ----
  $ci = Get-ComputerInfo
  $ubr = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion').UBR
  Write-Host "PSVersion: $($PSVersionTable.PSVersion.ToString())  PSEdition: $($PSVersionTable.PSEdition)  (must be 5.x / Desktop)"
  Write-Host "OSVersion (Environment): $([Environment]::OSVersion.VersionString)"
  Write-Host "Get-ComputerInfo: OsName=$($ci.OsName); OsVersion=$($ci.OsVersion); OsBuildNumber=$($ci.OsBuildNumber).$ubr; WindowsVersion=$($ci.WindowsVersion); WindowsDisplayVersion=$($ci.WindowsDisplayVersion)"
  Write-Host "RuntimeInformation FrameworkDescription: $([System.Runtime.InteropServices.RuntimeInformation]::FrameworkDescription)"
  $fxRel = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full').Release
  Write-Host ".NET Framework release dword: $fxRel"

  # ---- Controlled early-failure mode: create the fixture key, register it, then stop with only ----
  # ---- the manifest surviving (in-process cleanup skipped); the if:always() step must remove it. ----
  if ($SimulateFailureAfterKeyCreation) {
    $cert = New-FixtureCert 'CN=V3 CONTROLLED-FAILURE FIXTURE (DISPOSABLE)' $true
    $ids = Capture-KeyIds $cert 'E_KEYGEN'
    try { $ids.Rsa.Dispose() } catch {}
    Write-Host "CONTROLLED-FAILURE fixture thumbprint: $($cert.Thumbprint); KeyName: $($ids.KeyName); UniqueName: $($ids.UniqueName)"
    $script:Manifest.thumbprints += $cert.Thumbprint
    Add-ManifestContainer $ids.KeyName $ids.UniqueName $ids.Provider
    Save-Manifest
    Stop-Step 'E_CONTROLLED_FAILURE' 'Controlled premature stop immediately after fixture key creation; only the cleanup manifest survives and in-process cleanup was skipped. The if:always() cleanup step must remove the fixture and verify absence.'
  }

  # ---- Extract the EXACT shipped bytes under test ----
  $p1 = Join-Path $PkgRoot 'scripts\V3-Part1-KeyCreation.ps1'
  $p2 = Join-Path $PkgRoot 'scripts\V3-Part2-SignUKI.ps1'
  $p3 = Join-Path $PkgRoot 'scripts\V3-Part3-FinalizeAndDetachedSign.ps1'
  $p4 = Join-Path $PkgRoot 'scripts\V3-Part4-EvidenceAndCleanup.ps1'
  foreach ($pp in @($p1, $p2, $p3, $p4)) { Check (Test-Path -LiteralPath $pp) 'E_PACKAGE' "Shipped script missing: $pp" }
  $fnHelper = Get-ShippedFunctionText $p1 'Remove-CertAndCngKey'
  $fnToHex = Get-ShippedFunctionText $p2 'ToHex'
  $fnX500 = Get-ShippedFunctionText $p2 'Get-X500Field'
  $fnDigest = Get-ShippedFunctionText $p2 'Get-AuthenticodeDigest'
  $fnTlv = Get-ShippedFunctionText $p2 'Read-DerTlv'
  $fnPkcs7 = Get-ShippedFunctionText $p2 'Get-EmbeddedPkcs7'
  $blkVerify = Get-ShippedBlockText $p2 '    # Mathematical Authenticode verification' "    Write-Host 'Authenticode mathematical verification PASS" 4 $false
  $blkDecode = Get-ShippedBlockText $p3 '    # Independent verification (2)' "    Write-Host 'PSS STRUCTURAL PROOF PASS" 4 $true
  $blkPart4 = Get-ShippedBlockText $p4 '  # None of the recorded CNG key containers' "  Write-Host 'Key-hygiene PASS" 2 $true
  foreach ($nb in @(@('Remove-CertAndCngKey',$fnHelper),@('ToHex',$fnToHex),@('Get-X500Field',$fnX500),@('Get-AuthenticodeDigest',$fnDigest),@('Read-DerTlv',$fnTlv),@('Get-EmbeddedPkcs7',$fnPkcs7),@('AuthenticodeVerificationBlock',$blkVerify),@('PssStructuralDecodeBlock',$blkDecode),@('Part4ContainerAbsenceBlock',$blkPart4))) {
    Write-Host ("EXTRACTED " + $nb[0] + " SHA256 " + (Sha256Hex ([Text.Encoding]::UTF8.GetBytes($nb[1]))))
  }
  foreach ($ft in @($fnHelper, $fnToHex, $fnX500, $fnDigest, $fnTlv, $fnPkcs7)) { . ([ScriptBlock]::Create($ft)) }
  Write-Host 'Extraction PASS - shipped helper bytes parsed, hashed, and loaded for execution.'
  Assert-BlockFreeVariables $blkDecode @('digest','imported','sig') 'PssStructuralDecodeBlock'

  # ---- SignTool identity via the shipped parsed-exact X.500 comparison ----
  $binRoot = "${env:ProgramFiles(x86)}\Windows Kits\10\bin"
  $signtool = $null
  if (Test-Path -LiteralPath $binRoot) {
    foreach ($d in (Get-ChildItem -LiteralPath $binRoot -Directory | Sort-Object Name -Descending)) {
      $cand = Join-Path $d.FullName 'x64\signtool.exe'
      if (Test-Path -LiteralPath $cand) { $signtool = $cand; break }
    }
  }
  Check ($null -ne $signtool) 'E_SIGNTOOL_MISSING' 'signtool.exe not found on this runner.'
  Write-Host "SignTool: $signtool"
  $sigs = Get-AuthenticodeSignature -FilePath $signtool
  Check ($sigs.Status -eq 'Valid') 'E_SIGNTOOL_SIGNATURE' 'signtool.exe signature is not Valid.'
  $subCN = Get-X500Field $sigs.SignerCertificate.Subject 'CN'
  $subO  = Get-X500Field $sigs.SignerCertificate.Subject 'O'
  $issO  = Get-X500Field $sigs.SignerCertificate.Issuer 'O'
  Write-Host "SignTool signer Subject: $($sigs.SignerCertificate.Subject)"
  Write-Host "SignTool signer Issuer:  $($sigs.SignerCertificate.Issuer)"
  Check (($subCN -eq 'Microsoft Corporation') -and ($subO -eq 'Microsoft Corporation') -and ($issO -eq 'Microsoft Corporation')) 'E_SIGNTOOL_SIGNER' 'Parsed-exact SignTool identity check failed.'
  Write-Host 'SIGNTOOL IDENTITY PASS - parsed-exact X.500 comparison (shipped Get-X500Field)'

  # ---- LIFETIME 1: generated fixture key ----
  $pfx = "$WorkDir\fixture.pfx"
  $pfxCopy = "$WorkDir\fixture-copy.pfx"
  $cerF = "$WorkDir\fixture.cer"
  $cert = New-FixtureCert 'CN=V3 DRY-RUN FIXTURE (DISPOSABLE)' $true
  $gen = Capture-KeyIds $cert 'E_KEYGEN'
  try { $gen.Rsa.Dispose() } catch {}
  $thumbprint = $cert.Thumbprint
  Write-Host "FIXTURE thumbprint: $thumbprint"
  Write-Host "FIXTURE provider:   $($gen.Provider)"
  Write-Host "FIXTURE KeyName:    $($gen.KeyName)"
  Write-Host "FIXTURE UniqueName: $($gen.UniqueName)"
  $script:Manifest.thumbprints += $thumbprint
  Add-ManifestContainer $gen.KeyName $gen.UniqueName $gen.Provider
  Save-Manifest

  # ---- NEGATIVE FIXTURE: UniqueName must never substitute for KeyName in the CngKey API ----
  $prov = New-Object System.Security.Cryptography.CngProvider($gen.Provider)
  $existsByKeyName = [System.Security.Cryptography.CngKey]::Exists($gen.KeyName, $prov)
  Write-Host "CngKey.Exists(KeyName, provider) with the live fixture key present: $existsByKeyName (must be True)"
  Check ($existsByKeyName) 'E_DRYRUN_KEYNAME' 'Exists(KeyName) did not find the live fixture key - report this code.'
  if ($gen.UniqueName -ne $gen.KeyName) {
    $existsByUnique = [System.Security.Cryptography.CngKey]::Exists($gen.UniqueName, $prov)
    Write-Host "CngKey.Exists(UniqueName, provider) with the live fixture key present: $existsByUnique"
    if (-not $existsByUnique) {
      Write-Host 'NEGATIVE FIXTURE CONFIRMED: substituting UniqueName into the KeyName API reports ABSENCE for a key that exists - a UniqueName query is NOT absence evidence.'
    } else {
      Write-Host 'NOTE: on this runner Exists(UniqueName) also located the key; KeyName remains the documented API identifier and the only one the shipped scripts use for absence.'
    }
  } else {
    Write-Host 'NOTE: KeyName and UniqueName coincide for this fixture on this runner; the substitution difference is not observable here. KeyName remains the documented API identifier and the only one the shipped scripts use; UniqueName is corroborated at key-store file level.'
  }
  Write-Host 'ABSENCE PROOF RULE: only KeyName-based Exists/Open results are accepted as API absence evidence; UniqueName is corroboration, never the absence proof.'

  # ---- Export PFX (RNG-built SecureString password, no plaintext ever) + real copy comparison ----
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $pw = New-Object System.Security.SecureString
  $buf = New-Object byte[] 24
  $rng.GetBytes($buf)
  foreach ($bb in $buf) { $pw.AppendChar([char](33 + ($bb % 94))) }
  [Array]::Clear($buf, 0, $buf.Length)
  $rng.Dispose()
  # The password now exists only as SecureString contents: it was assembled character-by-character
  # from CSPRNG bytes, never as a string or character array, so no maskable plaintext ever exists.
  Export-PfxCertificate -Cert $cert.PSPath -FilePath $pfx -Password $pw -CryptoAlgorithmOption AES256_SHA256 -NoProperties | Out-Null
  Export-Certificate -Cert $cert.PSPath -FilePath $cerF -Type CERT | Out-Null
  Copy-Item -LiteralPath $pfx -Destination $pfxCopy
  $b1 = [IO.File]::ReadAllBytes($pfx)
  $b2 = [IO.File]::ReadAllBytes($pfxCopy)
  Check (($b1.Length -eq $b2.Length) -and ((Get-FileHash -Algorithm SHA256 -LiteralPath $pfx).Hash -eq (Get-FileHash -Algorithm SHA256 -LiteralPath $pfxCopy).Hash)) 'E_PFX_CHANGED' 'PFX copy is not byte-identical to the export; report this code.'
  Write-Host "PFX EXPORT PASS - exported once under an ephemeral CSPRNG password; distinct copy file is byte-identical (length $($b1.Length), matching SHA-256); bytes and password never logged."
  $script:Manifest.files += @($pfx, $pfxCopy, $cerF)
  Save-Manifest

  # ---- CLEANUP 1: exact shipped helper + 5-way absence ----
  $ok1 = Remove-CertAndCngKey $cert $gen.KeyName $gen.UniqueName $gen.Provider
  Write-Host "CLEANUP 1 (generated fixture key, shipped Remove-CertAndCngKey): $(if ($ok1) {'PASS'} else {'FAIL'})"
  Check ($ok1) 'E_CLEANUP_FAILED' 'Shipped helper reported failure on the generated fixture key; report this code.'
  Assert-FullAbsence $thumbprint $gen.KeyName $gen.UniqueName $gen.Provider 'cleanup-1'
  $cert = $null

  # ---- LIFETIME 2: FIRST non-exportable import - SignTool + Authenticode path ----
  $imported1 = Import-PfxCertificate -FilePath $pfx -CertStoreLocation 'Cert:\CurrentUser\My' -Password $pw -Exportable:$false
  $imp1 = Capture-KeyIds $imported1 'E_PRIVATE_KEY'
  Check ($imp1.Rsa.Key.ExportPolicy -eq [System.Security.Cryptography.CngExportPolicies]::None) 'E_KEY_EXPORTABLE' 'First imported fixture key is exportable.'
  Write-Host "IMPORT 1 KeyName: $($imp1.KeyName); UniqueName: $($imp1.UniqueName) (provider $($imp1.Provider)); ExportPolicy: $($imp1.Rsa.Key.ExportPolicy)"
  Add-ManifestContainer $imp1.KeyName $imp1.UniqueName $imp1.Provider
  Save-Manifest

  $staged = "$WorkDir\fixture-app.exe"
  Copy-Item -LiteralPath 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' -Destination $staged
  $script:Manifest.files += $staged
  Save-Manifest
  & $signtool sign /fd SHA256 /s My /sha1 $thumbprint $staged | Out-String | Set-Content -LiteralPath "$WorkDir\work\signtool-sign.txt" -Encoding ASCII
  Check ($LASTEXITCODE -eq 0) 'E_SIGNTOOL_SIGN' "SignTool sign failed (exit $LASTEXITCODE)."
  Write-Host 'SIGNTOOL SIGN PASS - disposable PE fixture signed with import 1.'

  $Work = $WorkDir
  . ([ScriptBlock]::Create($blkVerify))
  Write-Host 'Authenticode mathematical verification PASS (shipped block, windows-latest, PS 5.1)'

  try { $imp1.Rsa.Dispose() } catch {}
  $ok2 = Remove-CertAndCngKey $imported1 $imp1.KeyName $imp1.UniqueName $imp1.Provider
  Write-Host "CLEANUP 2 (first import, shipped Remove-CertAndCngKey): $(if ($ok2) {'PASS'} else {'FAIL'})"
  Check ($ok2) 'E_CLEANUP_FAILED' 'Shipped helper reported failure on the first import; report this code.'
  Assert-FullAbsence $thumbprint $imp1.KeyName $imp1.UniqueName $imp1.Provider 'cleanup-2'
  $imported1 = $null

  # ---- OVERLAP NEGATIVE FIXTURE (owner ruling): a LIVE prior-lifetime container at the boundary ----
  # ---- must STOP the lifetime-3 precondition BEFORE any second import; cleaned immediately after, ----
  # ---- with absence proved BEFORE the positive sequential flow runs.                             ----
  $overlap = Import-PfxCertificate -FilePath $pfx -CertStoreLocation 'Cert:\CurrentUser\My' -Password $pw -Exportable:$false
  $ov = Capture-KeyIds $overlap 'E_PRIVATE_KEY'
  Write-Host "OVERLAP FIXTURE live container: KeyName $($ov.KeyName); UniqueName $($ov.UniqueName)"
  Add-ManifestContainer $ov.KeyName $ov.UniqueName $ov.Provider
  Save-Manifest
  $caught = $null
  try { Assert-FullAbsence $thumbprint $ov.KeyName $ov.UniqueName $ov.Provider 'overlap-negative' } catch { $caught = $_.Exception.Message }
  if ($caught -match '^STOP E_CLEANUP_FAILED') {
    Write-Host "OVERLAP NEGATIVE FIXTURE PASS - the lifetime-3 precondition stopped on a live prior-lifetime container: $caught"
  } else {
    Stop-Step 'E_TEST' "Overlap negative fixture failed: expected STOP E_CLEANUP_FAILED, got: $caught"
  }
  $okO = Remove-CertAndCngKey $overlap $ov.KeyName $ov.UniqueName $ov.Provider
  Check ($okO) 'E_CLEANUP_FAILED' 'Overlap fixture cleanup failed; report this code.'
  Assert-FullAbsence $thumbprint $ov.KeyName $ov.UniqueName $ov.Provider 'overlap-negative-cleanup'
  $overlap = $null
  Write-Host 'OVERLAP NEGATIVE FIXTURE CLEANED - absence proved before the positive sequential flow.'

  # ---- LIFETIME 3: second non-exportable import from the retained PFX - detached-signature path ----
  # ---- EPOCH MODEL: safety is the proved pre/post state transition, never name equality. The PFX ----
  # ---- intentionally carries the same RSA keypair; what must be new is the persisted container    ----
  # ---- instance/lifetime.                                                                          ----
  Write-Host 'PRE-IMPORT-2 BOUNDARY - re-asserting lifetime 2 FULL absence (certificate absent; Exists/Open by KeyName fail; UniqueName store file absent) before creating lifetime 3.'
  Assert-FullAbsence $thumbprint $imp1.KeyName $imp1.UniqueName $imp1.Provider 'pre-import-2-boundary'
  $epochPre = [DateTime]::UtcNow.ToString('o')
  Write-Host "EPOCH MARKER pre-import-2:  $epochPre"
  $imported2 = Import-PfxCertificate -FilePath $pfx -CertStoreLocation 'Cert:\CurrentUser\My' -Password $pw -Exportable:$false
  Check ($null -ne $imported2) 'E_PRIVATE_KEY' 'Second import did not return a certificate.'
  $epochPost = [DateTime]::UtcNow.ToString('o')
  Write-Host "EPOCH MARKER post-import-2: $epochPost (import command succeeded from the retained PFX)"
  $pw = $null
  [GC]::Collect()
  $imp2 = Capture-KeyIds $imported2 'E_PRIVATE_KEY'
  Write-Host "IMPORT 2 KeyName: $($imp2.KeyName); UniqueName: $($imp2.UniqueName) (provider $($imp2.Provider)); ExportPolicy: $($imp2.Rsa.Key.ExportPolicy)"
  Assert-FullyLive $thumbprint $imp2 $imported2 $cerF 'lifetime-3-live'
  if ($imp2.KeyName -eq $imp1.KeyName) {
    Write-Host 'SEQUENTIAL NAME REUSE OBSERVED - prior lifetime proved absent before recreation'
    Write-Host '  (same keypair by design; the persisted container instance/lifetime is new, proven temporally: absence at the pre-import boundary, then a live container after the import - never inferred from name equality.)'
  } else {
    Write-Host 'DISTINCT IMPORT NAME OBSERVED'
  }
  Add-ManifestContainer $imp2.KeyName $imp2.UniqueName $imp2.Provider
  Save-Manifest

  # ---- Fresh nonce challenge: a NEW digest constructed after import, signed with the imported ----
  # ---- private key, verified with the public certificate. ----
  $rsa = $imp2.Rsa
  $rngN = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $nonce = New-Object byte[] 32
  $rngN.GetBytes($nonce)
  $rngN.Dispose()
  $noncePre = [Text.Encoding]::UTF8.GetBytes('V3-LIFETIME-3-NONCE:v1') + [byte]0 + $nonce
  $nonceDigest = ([Security.Cryptography.SHA256]::Create()).ComputeHash($noncePre)
  $nonceSig = $rsa.SignHash($nonceDigest, [Security.Cryptography.HashAlgorithmName]::SHA256, [Security.Cryptography.RSASignaturePadding]::Pss)
  $pubN = [Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPublicKey($imported2)
  $nonceOk = $pubN.VerifyHash($nonceDigest, $nonceSig, [Security.Cryptography.HashAlgorithmName]::SHA256, [Security.Cryptography.RSASignaturePadding]::Pss)
  Check ($nonceOk) 'E_LIVE_PROOF' 'Lifetime-3 nonce challenge failed: the imported private key could not sign a fresh digest verifiable by the public certificate.'
  Write-Host 'LIFETIME-3 NONCE CHALLENGE PASS - fresh post-import digest signed by the imported private key, verified with the public certificate (bound to lifetime 3).'
  try { $pubN.Dispose() } catch {}

  $pre = [Text.Encoding]::UTF8.GetBytes('V3-WINDOWS-COMPAT-PROOF:v1') + [byte]0 + [IO.File]::ReadAllBytes($staged)
  $digest = ([Security.Cryptography.SHA256]::Create()).ComputeHash($pre)
  $sig = $rsa.SignHash($digest, [Security.Cryptography.HashAlgorithmName]::SHA256, [Security.Cryptography.RSASignaturePadding]::Pss)
  Check ($sig.Length -eq 384) 'E_SIG_LENGTH' "Signature $($sig.Length) bytes, expected 384."
  $selfOk = $rsa.VerifyHash($digest, $sig, [Security.Cryptography.HashAlgorithmName]::SHA256, [Security.Cryptography.RSASignaturePadding]::Pss)
  Check ($selfOk) 'E_DETACHED_VERIFY' 'RSACng VerifyHash self-check failed.'
  Write-Host 'DETACHED SIGN PASS - RSACng SignHash/VerifyHash (RSA-PSS-SHA256) with import 2 under PS 5.1; digest freshly constructed AFTER import 2 and explicitly bound to lifetime 3.'

  # ---- Negative fixture: a null certificate context must produce the controlled E_TEST_CONTEXT ----
  # ---- BEFORE any decode-block execution - never a raw E_UNEXPECTED. ----
  $negCtx = $null
  try { Invoke-PssDecodeBlock $null $imported2.Thumbprint $digest $sig $blkDecode } catch { $negCtx = $_.Exception.Message }
  if ($negCtx -match '^STOP E_TEST_CONTEXT') {
    Write-Host "DECODE NULL-CONTEXT NEGATIVE PASS - null certificate context produced the controlled stop: $negCtx"
  } else {
    Stop-Step 'E_TEST' "Decode null-context negative fixture failed: expected STOP E_TEST_CONTEXT, got: $negCtx"
  }

  Invoke-PssDecodeBlock $imported2 $imported2.Thumbprint $digest $sig $blkDecode

  try { $rsa.Dispose() } catch {}
  $ok3 = Remove-CertAndCngKey $imported2 $imp2.KeyName $imp2.UniqueName $imp2.Provider
  Write-Host "CLEANUP 3 (second import, shipped Remove-CertAndCngKey): $(if ($ok3) {'PASS'} else {'FAIL'})"
  Check ($ok3) 'E_CLEANUP_FAILED' 'Shipped helper reported failure on the second import; report this code.'
  Assert-FullAbsence $thumbprint $imp2.KeyName $imp2.UniqueName $imp2.Provider 'cleanup-3'
  $imported2 = $null

  # ---- PART 4 BLOCK: negative (LIVE decoy) and positive (three ACTUAL deleted identities) ----
  $decoy = New-FixtureCert 'CN=V3 PART4 DECOY (DISPOSABLE)' $false
  $dec = Capture-KeyIds $decoy 'E_KEYGEN'
  try { $dec.Rsa.Dispose() } catch {}
  $script:Manifest.thumbprints += $decoy.Thumbprint
  Add-ManifestContainer $dec.KeyName $dec.UniqueName $dec.Provider
  Save-Manifest

  $state = [pscustomobject]@{
    GeneratedKeyName = $dec.KeyName; GeneratedKeyUniqueName = $dec.UniqueName; GeneratedKeyProvider = $dec.Provider
    Part2KeyName = $imp1.KeyName; Part2KeyUniqueName = $imp1.UniqueName; Part2KeyProvider = $imp1.Provider
    Part3KeyName = $imp2.KeyName; Part3KeyUniqueName = $imp2.UniqueName; Part3KeyProvider = $imp2.Provider
  }
  $caught = $null
  try { . ([ScriptBlock]::Create($blkPart4)) } catch { $caught = $_.Exception.Message }
  if ($caught -match '^STOP E_KEY_CONTAINER_REMAINS') {
    Write-Host "PART4 NEGATIVE FIXTURE PASS - live decoy KeyName in state produced: $caught"
  } else {
    Stop-Step 'E_TEST' "Part 4 negative fixture failed: expected STOP E_KEY_CONTAINER_REMAINS, got: $caught"
  }

  $state = [pscustomobject]@{
    GeneratedKeyName = $gen.KeyName; GeneratedKeyUniqueName = $gen.UniqueName; GeneratedKeyProvider = $gen.Provider
    Part2KeyName = $imp1.KeyName; Part2KeyUniqueName = $imp1.UniqueName; Part2KeyProvider = $imp1.Provider
    Part3KeyName = $imp2.KeyName; Part3KeyUniqueName = $imp2.UniqueName; Part3KeyProvider = $imp2.Provider
  }
  . ([ScriptBlock]::Create($blkPart4))
  Write-Host 'PART4 POSITIVE PASS - three recorded lifetimes (generated key, import 1, import 2) verified absent by the shipped block; identifiers may repeat across non-overlapping lifetimes; every record kept, deduplication is display-only.'

  $okd = Remove-CertAndCngKey $decoy $dec.KeyName $dec.UniqueName $dec.Provider
  Check ($okd) 'E_CLEANUP_FAILED' 'Decoy cleanup failed; report this code.'
  Assert-FullAbsence $decoy.Thumbprint $dec.KeyName $dec.UniqueName $dec.Provider 'decoy-cleanup'
  $decoy = $null

  # ---- Remove every fixture artifact; the run log is the only transcript ----
  foreach ($f in @($pfx, $pfxCopy, $cerF, $staged)) { if (Test-Path -LiteralPath $f) { Remove-Item -LiteralPath $f -Force } }
  Write-Host 'Fixture PFX files/CER/signed fixture deleted (ephemeral CSPRNG password never logged; no production material was ever present).'
  Write-Host ''
  Write-Host 'SANITIZATION NOTE: this log contains OS/PowerShell/.NET facts, source and extracted-block hashes,'
  Write-Host 'the signtool identity, public identifiers (thumbprints, providers, KeyNames, UniqueNames) of DELETED'
  Write-Host 'throwaway keys, and PASS/STOP states only. It contains no private key, no password, no PFX,'
  Write-Host 'no SecureString conversion, no state or work folder, no production path or output.'
  Write-Host 'COMPAT PROOF PASS - THREE real cleanup lifetimes, each closed by the shipped helper plus the 5-way absence set.'
} catch {
  Write-Failure $_
  $script:ExitCode = 1
} finally {
  $pw = $null
  [GC]::Collect()
  if (-not $SimulateFailureAfterKeyCreation) { try { Invoke-BestEffortCleanup } catch {} }
  try { Save-Manifest } catch {}
}
exit $script:ExitCode
