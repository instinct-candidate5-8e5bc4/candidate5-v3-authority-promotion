# V3-WindowsCompatProof.ps1 (package v5) - bounded disposable compatibility proof on a GitHub Actions
# windows-latest runner, under Windows PowerShell 5.1 ONLY. It exercises the Windows-only ceremony path
# using the EXACT helper/verification bytes shipped in this package: functions are pulled out of the
# shipped production scripts through the PowerShell parser (AST), and the inline verification blocks are
# pulled out by asserted unique markers, then hashed and executed. Nothing is reimplemented for CI.
# DISPOSABLE FIXTURES ONLY: no production subject, PFX, password, path, or signing output appears here.
# The ephemeral PFX password is generated in-process as a SecureString, never printed, never converted.
param(
  [string]$RepoRoot = (Split-Path $PSScriptRoot -Parent),
  [string]$WorkDir = (Join-Path $env:RUNNER_TEMP 'v3-compat')
)
$ErrorActionPreference = 'Stop'
$VerbosePreference = 'SilentlyContinue'
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

# --- Full absence assertion (owner condition 5): thumbprint, Exists(KeyName), Open(KeyName), store ---
# --- enumeration by KeyName AND UniqueName, Open(UniqueName). All must show absence.               ---
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

# --- Cleanup manifest (non-secret identifiers only) for the guaranteed if:always() cleanup step -----
$script:Manifest = @{ thumbprints = @(); containers = @(); files = @(); dirs = @($WorkDir) }
function Save-Manifest { ($script:Manifest | ConvertTo-Json -Depth 4) | Set-Content -LiteralPath "$WorkDir\cleanup-manifest.json" -Encoding ASCII }
function Add-ManifestContainer($kn, $un, $prov) { $script:Manifest.containers += @{ keyName = $kn; uniqueName = $un; provider = $prov } }

$script:ExitCode = 0
$pw = $null
try {
  Check ($PSVersionTable.PSVersion.Major -eq 5) 'E_PLATFORM' "This proof must run under Windows PowerShell 5.1; got $($PSVersionTable.PSVersion)."
  if (-not (Test-Path -LiteralPath $WorkDir)) { New-Item -ItemType Directory -Path $WorkDir | Out-Null }
  if (-not (Test-Path -LiteralPath "$WorkDir\work")) { New-Item -ItemType Directory -Path "$WorkDir\work" | Out-Null }
  Write-Host '== V3 WINDOWS POWERSHELL 5.1 COMPATIBILITY PROOF (package v5, disposable fixtures only) =='

  # ---- Platform facts (owner condition 1) ----
  $ci = Get-ComputerInfo
  $ubr = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion').UBR
  Write-Host "PSVersion: $($PSVersionTable.PSVersion.ToString())  PSEdition: $($PSVersionTable.PSEdition)  (must be 5.x / Desktop)"
  Write-Host "OSVersion (Environment): $([Environment]::OSVersion.VersionString)"
  Write-Host "Get-ComputerInfo: OsName=$($ci.OsName); OsVersion=$($ci.OsVersion); OsBuildNumber=$($ci.OsBuildNumber).$ubr; WindowsVersion=$($ci.WindowsVersion); WindowsDisplayVersion=$($ci.WindowsDisplayVersion)"
  Write-Host "RuntimeInformation FrameworkDescription: $([System.Runtime.InteropServices.RuntimeInformation]::FrameworkDescription)"
  $fxRel = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full').Release
  Write-Host ".NET Framework release dword: $fxRel"

  # ---- Submission binding (owner condition 9) ----
  Write-Host "Run URL: $env:GITHUB_SERVER_URL/$env:GITHUB_REPOSITORY/actions/runs/$env:GITHUB_RUN_ID"
  Write-Host "Commit: $env:GITHUB_SHA"
  $wfPath = Join-Path $RepoRoot '.github\workflows\v3-windows-compat-proof.yml'
  if (Test-Path -LiteralPath $wfPath) { Write-Host ("WORKFLOW SHA256 " + (Get-FileHash -Algorithm SHA256 -LiteralPath $wfPath).Hash.ToLower()) }
  foreach ($mf in @('scripts\V3-Part0-Preflight.ps1','scripts\V3-Part1-KeyCreation.ps1','scripts\V3-Part2-SignUKI.ps1','scripts\V3-Part3-FinalizeAndDetachedSign.ps1','scripts\V3-Part4-EvidenceAndCleanup.ps1','ci\V3-WindowsCompatProof.ps1','ci\V3-WindowsCompatCleanup.ps1')) {
    $fp = Join-Path $RepoRoot $mf
    Check (Test-Path -LiteralPath $fp) 'E_PACKAGE' "Package member missing from checkout: $mf"
    Write-Host ("MEMBER SHA256 " + $mf + " " + (Get-FileHash -Algorithm SHA256 -LiteralPath $fp).Hash.ToLower())
  }

  # ---- Extract the EXACT shipped bytes under test (owner condition 3) ----
  $p1 = Join-Path $RepoRoot 'scripts\V3-Part1-KeyCreation.ps1'
  $p2 = Join-Path $RepoRoot 'scripts\V3-Part2-SignUKI.ps1'
  $p3 = Join-Path $RepoRoot 'scripts\V3-Part3-FinalizeAndDetachedSign.ps1'
  $p4 = Join-Path $RepoRoot 'scripts\V3-Part4-EvidenceAndCleanup.ps1'
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

  # ---- Disposable fixture identity (owner condition 2) ----
  $pfx = "$WorkDir\fixture.pfx"
  $cerF = "$WorkDir\fixture.cer"
  $cert = New-SelfSignedCertificate `
    -Type Custom -Subject 'CN=V3 DRY-RUN FIXTURE (DISPOSABLE)' `
    -KeyAlgorithm RSA -KeyLength 3072 -HashAlgorithm SHA256 `
    -KeyExportPolicy Exportable -KeyUsage DigitalSignature `
    -TextExtension @('2.5.29.19={critical}{text}ca=false','2.5.29.37={text}1.3.6.1.5.5.7.3.3') `
    -CertStoreLocation 'Cert:\CurrentUser\My' -NotBefore (Get-Date).ToUniversalTime().Date -NotAfter (Get-Date).ToUniversalTime().Date.AddDays(2)
  $k = [Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
  Check ($null -ne $k) 'E_KEYGEN' 'No private key on fixture certificate.'
  Check ($k -is [System.Security.Cryptography.RSACng]) 'E_KEY_PROVIDER' 'Fixture key is not CNG (RSACng).'
  Check ($k.Key.Provider.Provider -eq 'Microsoft Software Key Storage Provider') 'E_KEY_PROVIDER' "Unexpected provider '$($k.Key.Provider.Provider)'."
  Check ($k.KeySize -eq 3072) 'E_KEY_SIZE' "Key size $($k.KeySize), expected 3072."
  $genKeyName = $k.Key.KeyName
  $genUniqueName = $k.Key.UniqueName
  $genProvider = $k.Key.Provider.Provider
  Check ($genKeyName -and $genUniqueName) 'E_KEYGEN' 'Could not capture fixture KeyName/UniqueName.'
  try { $k.Dispose() } catch {}
  $thumbprint = $cert.Thumbprint
  Write-Host "FIXTURE thumbprint: $thumbprint"
  Write-Host "FIXTURE provider:   $genProvider"
  Write-Host "FIXTURE KeyName:    $genKeyName"
  Write-Host "FIXTURE UniqueName: $genUniqueName"
  $script:Manifest.thumbprints += $thumbprint
  Add-ManifestContainer $genKeyName $genUniqueName $genProvider
  $script:Manifest.files += @($pfx, $cerF)
  Save-Manifest

  # ---- NEGATIVE FIXTURE (owner condition 5): UniqueName must never substitute for KeyName ----
  $prov = New-Object System.Security.Cryptography.CngProvider($genProvider)
  $existsByKeyName = [System.Security.Cryptography.CngKey]::Exists($genKeyName, $prov)
  Write-Host "CngKey.Exists(KeyName, provider) with the live fixture key present: $existsByKeyName (must be True)"
  Check ($existsByKeyName) 'E_DRYRUN_KEYNAME' 'Exists(KeyName) did not find the live fixture key - report this code.'
  if ($genUniqueName -ne $genKeyName) {
    $existsByUnique = [System.Security.Cryptography.CngKey]::Exists($genUniqueName, $prov)
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

  # ---- Export PFX (random in-process password, never printed/converted) + identical-copy check ----
  $pw = New-Object System.Security.SecureString
  -join ((33..126) | Get-Random -Count 24 | ForEach-Object {[char]$_}) | ForEach-Object { $pw.AppendChar($_) }
  Export-PfxCertificate -Cert $cert.PSPath -FilePath $pfx -Password $pw -CryptoAlgorithmOption AES256_SHA256 -NoProperties | Out-Null
  Export-Certificate -Cert $cert.PSPath -FilePath $cerF -Type CERT | Out-Null
  $pfxSha1 = (Get-FileHash -Algorithm SHA256 -LiteralPath $pfx).Hash
  $pfxSha2 = (Get-FileHash -Algorithm SHA256 -LiteralPath $pfx).Hash
  Check ($pfxSha1 -eq $pfxSha2) 'E_PFX_CHANGED' 'Exported PFX changed on disk between reads; report this code.'
  Write-Host 'PFX EXPORT PASS - exported once under an ephemeral in-process password; identical-copy check passed (PFX bytes and password never logged).'

  # ---- CLEANUP 1: exact shipped helper, then owner condition 5 absence assertions ----
  $ok1 = Remove-CertAndCngKey $cert $genKeyName $genUniqueName $genProvider
  Write-Host "CLEANUP 1 (generated fixture key, shipped Remove-CertAndCngKey): $(if ($ok1) {'PASS'} else {'FAIL'})"
  Check ($ok1) 'E_CLEANUP_FAILED' 'Shipped helper reported failure on the generated fixture key; report this code.'
  Assert-FullAbsence $thumbprint $genKeyName $genUniqueName $genProvider 'cleanup-1'
  $cert = $null

  # ---- Non-exportable import (production Parts 2/3 path) ----
  $imported = Import-PfxCertificate -FilePath $pfx -CertStoreLocation 'Cert:\CurrentUser\My' -Password $pw -Exportable:$false
  $pw = $null
  [GC]::Collect()
  $rsa = [Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($imported)
  Check ($null -ne $rsa) 'E_PRIVATE_KEY' 'No private key on imported fixture.'
  Check ($rsa -is [System.Security.Cryptography.RSACng]) 'E_KEY_PROVIDER' 'Imported fixture key is not CNG.'
  Check ($rsa.Key.ExportPolicy -eq [System.Security.Cryptography.CngExportPolicies]::None) 'E_KEY_EXPORTABLE' 'Imported fixture key is exportable.'
  Check ($rsa.KeySize -eq 3072) 'E_KEY_SIZE' 'Imported fixture key size mismatch.'
  $impKeyName = $rsa.Key.KeyName
  $impUniqueName = $rsa.Key.UniqueName
  $impProvider = $rsa.Key.Provider.Provider
  Check ($impKeyName -and $impUniqueName) 'E_PRIVATE_KEY' 'Could not capture imported fixture identifiers.'
  Write-Host "IMPORTED fixture KeyName:    $impKeyName"
  Write-Host "IMPORTED fixture UniqueName: $impUniqueName (provider $impProvider)"
  Write-Host "IMPORTED fixture ExportPolicy: $($rsa.Key.ExportPolicy) (must be None)"
  Add-ManifestContainer $impKeyName $impUniqueName $impProvider
  Save-Manifest

  # ---- SignTool signing of a disposable PE fixture ----
  $staged = "$WorkDir\fixture-app.exe"
  Copy-Item -LiteralPath 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' -Destination $staged
  $script:Manifest.files += $staged
  & $signtool sign /fd SHA256 /s My /sha1 $thumbprint $staged | Out-String | Set-Content -LiteralPath "$WorkDir\work\signtool-sign.txt" -Encoding ASCII
  Check ($LASTEXITCODE -eq 0) 'E_SIGNTOOL_SIGN' "SignTool sign failed (exit $LASTEXITCODE)."
  Write-Host 'SIGNTOOL SIGN PASS - disposable PE fixture signed.'

  # ---- Mathematical Authenticode verification: exact shipped block ----
  $Work = $WorkDir
  . ([ScriptBlock]::Create($blkVerify))
  Write-Host 'Authenticode mathematical verification PASS (shipped block, windows-latest, PS 5.1)'

  # ---- Detached RSA-PSS-SHA256 sign + VerifyHash + structural salt=32 proof (shipped block) ----
  $pre = [Text.Encoding]::UTF8.GetBytes('V3-WINDOWS-COMPAT-PROOF:v1') + [byte]0 + [IO.File]::ReadAllBytes($staged)
  $digest = ([Security.Cryptography.SHA256]::Create()).ComputeHash($pre)
  $sig = $rsa.SignHash($digest, [Security.Cryptography.HashAlgorithmName]::SHA256, [Security.Cryptography.RSASignaturePadding]::Pss)
  Check ($sig.Length -eq 384) 'E_SIG_LENGTH' "Signature $($sig.Length) bytes, expected 384."
  $selfOk = $rsa.VerifyHash($digest, $sig, [Security.Cryptography.HashAlgorithmName]::SHA256, [Security.Cryptography.RSASignaturePadding]::Pss)
  Check ($selfOk) 'E_DETACHED_VERIFY' 'RSACng VerifyHash self-check failed.'
  Write-Host 'DETACHED SIGN PASS - RSACng SignHash/VerifyHash (RSA-PSS-SHA256) under PS 5.1.'
  . ([ScriptBlock]::Create($blkDecode))

  # ---- CLEANUP 2: imported fixture key, shipped helper + condition 5 assertions ----
  try { $rsa.Dispose() } catch {}
  $ok2 = Remove-CertAndCngKey $imported $impKeyName $impUniqueName $impProvider
  Write-Host "CLEANUP 2 (imported fixture key, shipped Remove-CertAndCngKey): $(if ($ok2) {'PASS'} else {'FAIL'})"
  Check ($ok2) 'E_CLEANUP_FAILED' 'Shipped helper reported failure on the imported fixture key; report this code.'
  Assert-FullAbsence $thumbprint $impKeyName $impUniqueName $impProvider 'cleanup-2'
  $imported = $null

  # ---- PART 4 BLOCK: positive and fail-closed negative tests (owner condition 6) ----
  $decoy = New-SelfSignedCertificate `
    -Type Custom -Subject 'CN=V3 PART4 DECOY (DISPOSABLE)' `
    -KeyAlgorithm RSA -KeyLength 3072 -HashAlgorithm SHA256 `
    -KeyExportPolicy NonExportable -KeyUsage DigitalSignature `
    -CertStoreLocation 'Cert:\CurrentUser\My' -NotBefore (Get-Date).ToUniversalTime().Date -NotAfter (Get-Date).ToUniversalTime().Date.AddDays(2)
  $dk = [Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($decoy)
  $decoyKeyName = $dk.Key.KeyName; $decoyUniqueName = $dk.Key.UniqueName; $decoyProvider = $dk.Key.Provider.Provider
  try { $dk.Dispose() } catch {}
  $script:Manifest.thumbprints += $decoy.Thumbprint
  Add-ManifestContainer $decoyKeyName $decoyUniqueName $decoyProvider
  Save-Manifest

  # Negative: mutate the recorded Part 1 KeyName to the LIVE decoy - the shipped Part 4 block must STOP.
  $stateNeg = [pscustomobject]@{
    GeneratedKeyName = $decoyKeyName; GeneratedKeyUniqueName = $decoyUniqueName; GeneratedKeyProvider = $decoyProvider
    Part2KeyName = $impKeyName; Part2KeyUniqueName = $impUniqueName; Part2KeyProvider = $impProvider
    Part3KeyName = $genKeyName; Part3KeyUniqueName = $genUniqueName; Part3KeyProvider = $genProvider
  }
  $state = $stateNeg
  $caught = $null
  try { . ([ScriptBlock]::Create($blkPart4)) } catch { $caught = $_.Exception.Message }
  if ($caught -match '^STOP E_KEY_CONTAINER_REMAINS') {
    Write-Host "PART4 NEGATIVE FIXTURE PASS - live decoy KeyName in state produced: $caught"
  } else {
    Stop-Step 'E_TEST' "Part 4 negative fixture failed: expected STOP E_KEY_CONTAINER_REMAINS, got: $caught"
  }

  # Positive: all three recorded containers deleted - the shipped block must print Key-hygiene PASS.
  $statePos = [pscustomobject]@{
    GeneratedKeyName = $genKeyName; GeneratedKeyUniqueName = $genUniqueName; GeneratedKeyProvider = $genProvider
    Part2KeyName = $impKeyName; Part2KeyUniqueName = $impUniqueName; Part2KeyProvider = $impProvider
    Part3KeyName = $genKeyName; Part3KeyUniqueName = $genUniqueName; Part3KeyProvider = $genProvider
  }
  $state = $statePos
  . ([ScriptBlock]::Create($blkPart4))

  # Decoy cleanup through the shipped helper + full absence assertions.
  $okd = Remove-CertAndCngKey $decoy $decoyKeyName $decoyUniqueName $decoyProvider
  Check ($okd) 'E_CLEANUP_FAILED' 'Decoy cleanup failed; report this code.'
  Assert-FullAbsence $decoy.Thumbprint $decoyKeyName $decoyUniqueName $decoyProvider 'decoy-cleanup'
  $decoy = $null

  # ---- Remove every fixture artifact; the run log is the only transcript ----
  foreach ($f in @($pfx, $cerF, $staged)) { if (Test-Path -LiteralPath $f) { Remove-Item -LiteralPath $f -Force } }
  Write-Host 'Fixture PFX/CER/signed fixture deleted (ephemeral password never logged; no production material was ever present).'
  Write-Host ''
  Write-Host 'SANITIZATION NOTE: this log contains OS/PowerShell/.NET facts, source and extracted-block hashes,'
  Write-Host 'the signtool identity, public identifiers (thumbprints, providers, KeyNames, UniqueNames) of DELETED'
  Write-Host 'throwaway keys, and PASS/STOP states only. It contains no private key, no password, no PFX,'
  Write-Host 'no SecureString conversion, no state or work folder, no production path or output.'
  Write-Host 'COMPAT PROOF PASS - all ceremony steps executed under Windows PowerShell 5.1 on windows-latest.'
} catch {
  Write-Failure $_
  $script:ExitCode = 1
} finally {
  $pw = $null
  [GC]::Collect()
  try { Save-Manifest } catch {}
}
exit $script:ExitCode
