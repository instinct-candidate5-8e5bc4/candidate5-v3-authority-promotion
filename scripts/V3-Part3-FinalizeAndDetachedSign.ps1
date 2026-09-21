# V3-Part3-FinalizeAndDetachedSign.ps1 (package v5) - elevated Windows PowerShell.
# Finalizes the canonical external binding record (frozen format), produces the detached
# RSA-PSS-SHA256 production signature over UTF8(domain) || 0x00 || finalized record,
# then verifies it by TWO independent implementations, both built into Windows - NO third-party
# executable anywhere in the detached-signature trust path:
#   (1) RSACng VerifyHash self-check (Microsoft CNG), and
#   (2) a full EMSA-PSS structural decode implemented in this script as pure public-key math
#       (s^e mod n, MGF1-SHA256, salt recovery) which PROVES the actual parameters:
#       hash = SHA-256, mask generation = MGF1-SHA256, salt length = EXACTLY 32 bytes.
# Temporary-key cleanup captures BOTH CNG container identifiers (KeyName and UniqueName) before removal,
# deletes the container explicitly through the version-independent CNG API using its KeyName after
# certificate removal, and independently verifies BOTH the certificate thumbprint and the exact container
# are absent (API check by KeyName, corroborated at store level by UniqueName).
# Imported-key lifetime is exception-safe; every failure prints exactly one STOP line and exits
# nonzero; cleanup failures are reported together with the original failure, never instead of it.
$ErrorActionPreference = 'Stop'
$Work = 'C:\v3-signing'
$Domain = 'V3-SUCCESSOR-UKI-EXTERNAL-BINDING:v1'
$GitCommit = '92741cbdefaa78adc33bc3c74935a45f9558b88c'
$GitTree   = '9cc2e40fab25c2231d5a6cefa285d2e3e65a7bee'
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

# Removes the certificate from the store, explicitly deletes its persisted CNG key container through
# the CNG API using the container's KEY NAME (the identifier CngKey.Exists/Open/Delete actually take -
# UniqueName is a different provider-generated value and is NEVER substituted for KeyName), then
# independently verifies BOTH absences: the certificate thumbprint is gone AND CngKey.Exists(KeyName,
# provider) is false, corroborated at store level: for the Microsoft software KSP a user key's persisted
# file under %APPDATA%\Microsoft\Crypto\Keys is named by the key's UniqueName, so that exact file
# must be gone too. Returns $true only when every check passes.
function Remove-CertAndCngKey($certItem, [string]$keyName, [string]$uniqueName, [string]$providerName) {
  $thumb = $certItem.Thumbprint
  try { Remove-Item -LiteralPath $certItem.PSPath -Force -ErrorAction Stop } catch {}
  $certGone = $true
  try { if (Get-ChildItem 'Cert:\CurrentUser\My' -ErrorAction Stop | Where-Object Thumbprint -eq $thumb) { $certGone = $false } } catch { $certGone = $false }
  try { $certItem.Dispose() } catch {}
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
  $keyGone = $true
  if ($keyName -and $providerName) {
    $keyGone = $false
    $prov = New-Object System.Security.Cryptography.CngProvider($providerName)
    try {
      if ([System.Security.Cryptography.CngKey]::Exists($keyName, $prov)) {
        $kk = [System.Security.Cryptography.CngKey]::Open($keyName, $prov)
        $kk.Delete()
        $kk.Dispose()
      }
    } catch {}
    [GC]::Collect(); [GC]::WaitForPendingFinalizers()
    $apiGone = $false
    try { $apiGone = -not [System.Security.Cryptography.CngKey]::Exists($keyName, $prov) } catch { $apiGone = $false }
    $fsGone = $true
    if ($uniqueName) {
      $kspDir = Join-Path $env:APPDATA 'Microsoft\Crypto\Keys'
      try { if ((Test-Path -LiteralPath $kspDir) -and (Get-ChildItem -LiteralPath $kspDir -File -ErrorAction Stop | Where-Object Name -eq $uniqueName)) { $fsGone = $false } } catch { $fsGone = $false }
    }
    $keyGone = ($apiGone -and $fsGone)
  }
  return ($certGone -and $keyGone)
}

$script:ExitCode = 0
$script:CleanupFailed = $false
$imported = $null
$script:ContainerKeyName = $null
$script:ContainerUniqueName = $null
$script:ContainerProviderStr = $null
try {
  Write-Host '== V3 PART 3 FINALIZE BINDING RECORD AND DETACHED SIGNATURE (v5) =='
  Check (Test-Path -LiteralPath "$Work\state\state.json") 'E_STATE' 'Run Part 0 first.'
  $state = Get-Content -LiteralPath "$Work\state\state.json" -Raw | ConvertFrom-Json
  Check ($state.SignedUkiSha256 -and $state.CertDerSha256) 'E_STATE' 'Run Parts 1 and 2 first.'

  # Recompute both public hashes from disk (never trust state alone)
  $signed = "$Work\public\successor-signed.efi"
  $cerFile = "$Work\public\successor-secure-boot.cer"
  $signedSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $signed).Hash.ToLower()
  $cerSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $cerFile).Hash.ToLower()
  Check ($signedSha -eq $state.SignedUkiSha256) 'E_SIGNED_MISMATCH' 'Signed UKI changed since Part 2; report this code.'
  Check ($cerSha -eq $state.CertDerSha256) 'E_CERT_MISMATCH' 'Certificate file changed since Part 1; report this code.'

  # 1. Finalize the canonical record (frozen deterministic surgery; verified by round-trip)
  $srcPath = "$Work\public\successor-authority-record.v1.json"
  $finPath = "$Work\public\successor-authority-record-final.v1.json"
  Check (-not (Test-Path -LiteralPath $finPath)) 'E_OUTPUT_EXISTS' "$finPath already exists; report this code."
  $raw = [IO.File]::ReadAllBytes($srcPath)
  Check (($raw.Length -ge 2) -and ($raw[$raw.Length-2] -eq 0x7d) -and ($raw[$raw.Length-1] -eq 0x0a)) 'E_RECORD_FORMAT' 'Canonical record does not end with }+LF as required.'
  $body = [Text.Encoding]::UTF8.GetString($raw, 0, $raw.Length - 2)
  Check ($body.StartsWith('{"certification":')) 'E_RECORD_FORMAT' 'Canonical record does not start with the expected first key.'
  $out = '{"certificateDerSha256":"' + $cerSha + '",' + $body.Substring(1)
  $m1 = '"records":'
  Check (($out.IndexOf($m1) -ge 0) -and ($out.IndexOf($m1, $out.IndexOf($m1) + 1) -lt 0)) 'E_RECORD_FORMAT' 'records marker not unique.'
  $out = $out.Replace($m1, '"gitCommit":"' + $GitCommit + '","gitTree":"' + $GitTree + '","records":')
  $m2 = '"signingRule":'
  Check (($out.IndexOf($m2) -ge 0) -and ($out.IndexOf($m2, $out.IndexOf($m2) + 1) -lt 0)) 'E_RECORD_FORMAT' 'signingRule marker not unique.'
  $out = $out.Replace($m2, '"signedUkiSha256":"' + $signedSha + '","signingRule":')
  $finalStr = $out + '}' + "`n"
  try { $null = ($finalStr | ConvertFrom-Json) } catch { Stop-Step 'E_FINAL_JSON' 'Finalized record is not valid JSON; report this code.' }
  $back = $finalStr.Replace('"certificateDerSha256":"' + $cerSha + '",', '')
  $back = $back.Replace('"gitCommit":"' + $GitCommit + '","gitTree":"' + $GitTree + '",', '')
  $back = $back.Replace('"signedUkiSha256":"' + $signedSha + '",', '')
  $backBytes = [Text.Encoding]::UTF8.GetBytes($back)
  Check ($backBytes.Length -eq $raw.Length) 'E_FINAL_ROUNDTRIP' 'Round-trip length mismatch; report this code.'
  for ($i = 0; $i -lt $raw.Length; $i++) { if ($backBytes[$i] -ne $raw[$i]) { Stop-Step 'E_FINAL_ROUNDTRIP' "Round-trip byte mismatch at $i; report this code." } }
  $finBytes = [Text.Encoding]::UTF8.GetBytes($finalStr)
  [IO.File]::WriteAllBytes($finPath, $finBytes)
  $finSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $finPath).Hash.ToLower()
  Write-Host "Finalized binding record: $finPath"
  Write-Host "Finalized record SHA-256: $finSha"

  # 2. Detached RSA-PSS-SHA256 signature over UTF8(domain) || 0x00 || finalized record
  $thumbprint = $state.CertThumbprint
  Check (-not (Get-ChildItem 'Cert:\CurrentUser\My' | Where-Object Thumbprint -eq $thumbprint)) 'E_CERTIFICATE_ALREADY_PRESENT' 'Production certificate already in store; report this code.'

  $sigPath = "$Work\public\successor-authority-record-final.v1.sig"
  try {
    $password = Read-Host 'PFX password' -AsSecureString
    $primary = Join-Path $state.PrimaryPfxDir 'successor-secure-boot.pfx'
    $imported = Import-PfxCertificate -FilePath $primary -CertStoreLocation 'Cert:\CurrentUser\My' -Password $password -Exportable:$false
    $password = $null
    Check ($imported.Thumbprint -eq $thumbprint) 'E_CERTIFICATE_IDENTITY' 'Imported certificate mismatch; report this code.'

    $rsa = [Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($imported)
    Check ($null -ne $rsa) 'E_PRIVATE_KEY' 'Could not access the private key; report this code.'
    Check ($rsa -is [System.Security.Cryptography.RSACng]) 'E_KEY_PROVIDER' 'The imported private key is not CNG (RSACng). Report this code.'
    Check ($rsa.Key.ExportPolicy -eq [Security.Cryptography.CngExportPolicies]::None) 'E_KEY_EXPORTABLE' 'The imported key is exportable; the design requires a non-exportable temporary import. Report this code.'
    Check ($rsa.KeySize -eq 3072) 'E_KEY_SIZE' "Key size is $($rsa.KeySize), expected 3072. Report this code."

    # Capture the stable CNG container identity BEFORE any removal (needed for verified deletion):
    # BOTH the KeyName (what CngKey.Exists/Open/Delete accept) and the UniqueName (corroborating
    # provider-level identifier; the software KSP names the persisted key file after it).
    $script:ContainerKeyName = $rsa.Key.KeyName
    $script:ContainerUniqueName = $rsa.Key.UniqueName
    $script:ContainerProviderStr = $rsa.Key.Provider.Provider
    Check ($script:ContainerKeyName -and $script:ContainerUniqueName) 'E_PRIVATE_KEY' 'Could not capture the CNG container KeyName/UniqueName; report this code.'

    $domainBytes = [Text.Encoding]::UTF8.GetBytes($Domain)
    $preimage = New-Object byte[] ($domainBytes.Length + 1 + $finBytes.Length)
    [Array]::Copy($domainBytes, 0, $preimage, 0, $domainBytes.Length)
    $preimage[$domainBytes.Length] = 0
    [Array]::Copy($finBytes, 0, $preimage, $domainBytes.Length + 1, $finBytes.Length)
    $sha = [Security.Cryptography.SHA256]::Create()
    $digest = $sha.ComputeHash($preimage)
    [IO.File]::WriteAllBytes("$Work\work\detached-preimage.sha256", $digest)

    $sig = $rsa.SignHash($digest, [Security.Cryptography.HashAlgorithmName]::SHA256, [Security.Cryptography.RSASignaturePadding]::Pss)
    Check ($sig.Length -eq 384) 'E_SIG_LENGTH' "Signature is $($sig.Length) bytes, expected 384 for RSA-3072; report this code."

    # Independent verification (1): Microsoft CNG VerifyHash
    $selfOk = $rsa.VerifyHash($digest, $sig, [Security.Cryptography.HashAlgorithmName]::SHA256, [Security.Cryptography.RSASignaturePadding]::Pss)
    Check ($selfOk) 'E_DETACHED_VERIFY' 'Immediate VerifyHash self-check failed; report this code.'
    [IO.File]::WriteAllBytes($sigPath, $sig)

    # Independent verification (2): full EMSA-PSS structural decode as pure public-key math
    Add-Type -AssemblyName System.Numerics | Out-Null
    function ToBI([byte[]]$be) { $le = [byte[]]$be.Clone(); [Array]::Reverse($le); $le += ([byte]0); [System.Numerics.BigInteger]::new([byte[]]$le) }
    function ToBE([System.Numerics.BigInteger]$x, [int]$len) {
      $b = $x.ToByteArray()
      if (($b.Length -eq ($len + 1)) -and ($b[$len] -eq 0)) { $t = New-Object byte[] $len; [Array]::Copy($b, $t, $len); $b = $t }
      if ($b.Length -gt $len) { throw 'STOP E_PSS_INTERNAL - internal length error; report this code.' }
      $p = New-Object byte[] $len; [Array]::Copy($b, 0, $p, 0, $b.Length); [Array]::Reverse($p); return [byte[]]$p
    }
    function MGF1([byte[]]$seed, [int]$len) {
      $sha2 = [Security.Cryptography.SHA256]::Create()
      $ms = New-Object System.IO.MemoryStream
      $c = [uint32]0
      while ($ms.Length -lt $len) { $ctr = [BitConverter]::GetBytes($c); [Array]::Reverse($ctr); $ms.Write($sha2.ComputeHash(($seed + $ctr)), 0, 32); $c++ }
      $bytes = $ms.ToArray(); $r = New-Object byte[] $len; [Array]::Copy($bytes, $r, $len); return [byte[]]$r
    }
    $pub = [Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPublicKey($imported)
    $params = $pub.ExportParameters($false)
    $n = ToBI $params.Modulus
    $e = ToBI $params.Exponent
    $s = ToBI $sig
    $modBits = $params.Modulus.Length * 8
    $emBits = $modBits - 1
    $emLen = [math]::Ceiling($emBits / 8)
    Check ($emLen -eq $sig.Length) 'E_PSS_LENGTH' 'Encoded-message length mismatch; report this code.'
    $EM = ToBE ([System.Numerics.BigInteger]::ModPow($s, $e, $n)) $emLen
    $hLen = 32
    $dbLen = $emLen - $hLen - 1
    Check ($EM[$emLen - 1] -eq 0xbc) 'E_PSS_TRAILER' 'EMSA-PSS trailer byte missing; report this code.'
    $H = $EM[$dbLen..($emLen - 2)]
    $maskedDB = $EM[0..($dbLen - 1)]
    $mask = MGF1 $H $dbLen
    $DB = New-Object byte[] $dbLen
    for ($i = 0; $i -lt $dbLen; $i++) { $DB[$i] = $maskedDB[$i] -bxor $mask[$i] }
    $DB[0] = $DB[0] -band (0xFF -shr (8 * $emLen - $emBits))
    $i = 0; while (($i -lt $dbLen) -and ($DB[$i] -eq 0)) { $i++ }
    Check (($i -lt $dbLen) -and ($DB[$i] -eq 1)) 'E_PSS_SEPARATOR' 'EMSA-PSS 0x01 separator missing; report this code.'
    $saltLen = $dbLen - $i - 1
    Check ($saltLen -eq 32) 'E_PSS_SALTLEN' "Measured PSS salt length is $saltLen bytes, not exactly 32. Do not retry or adjust anything; report this code."
    $salt = $DB[($i + 1)..($dbLen - 1)]
    $mp = New-Object byte[] (8 + 32 + $saltLen)
    [Array]::Copy($digest, 0, $mp, 8, 32)
    [Array]::Copy($salt, 0, $mp, 40, $saltLen)
    $Hp = ([Security.Cryptography.SHA256]::Create()).ComputeHash($mp)
    $psLen = $emLen - $saltLen - $hLen - 2
    $DBp = New-Object byte[] $dbLen
    $DBp[$psLen] = 1
    [Array]::Copy($salt, 0, $DBp, $psLen + 1, $saltLen)
    $mask2 = MGF1 $Hp $dbLen
    for ($j = 0; $j -lt $dbLen; $j++) { $DBp[$j] = $DBp[$j] -bxor $mask2[$j] }
    $DBp[0] = $DBp[0] -band (0xFF -shr (8 * $emLen - $emBits))
    $EMp = New-Object byte[] $emLen
    [Array]::Copy($DBp, 0, $EMp, 0, $dbLen)
    [Array]::Copy($Hp, 0, $EMp, $dbLen, 32)
    $EMp[$emLen - 1] = 0xbc
    $proofOk = $true
    for ($k = 0; $k -lt $emLen; $k++) { if ($EMp[$k] -ne $EM[$k]) { $proofOk = $false } }
    Check ($proofOk) 'E_PSS_PROOF' 'Structural EMSA-PSS proof failed; report this code.'
    Write-Host 'PSS STRUCTURAL PROOF PASS - independent pure-math decode confirms: RSA-PSS, SHA-256, MGF1-SHA256, salt length EXACTLY 32 bytes'
  } finally {
    $password = $null
    if ($imported -ne $null) {
      try { $rsa.Dispose() } catch {}
      try { $pub.Dispose() } catch {}
      if (-not (Remove-CertAndCngKey $imported $script:ContainerKeyName $script:ContainerUniqueName $script:ContainerProviderStr)) { $script:CleanupFailed = $true }
      if (-not $script:CleanupFailed) { Write-Host 'CLEANUP PASS - certificate removed and CNG key container deleted; both absences independently verified.' }
    }
    $imported = $null; $rsa = $null; $pub = $null
    [GC]::Collect()
  }
  if ($script:CleanupFailed) { Stop-Step 'E_CLEANUP_FAILED' 'could not remove the temporary imported certificate and/or its CNG key container. Do not delete anything manually; report this code.' }

  $state | Add-Member -NotePropertyName FinalRecordSha256 -NotePropertyValue $finSha -Force
  $state | Add-Member -NotePropertyName DetachedSigSha256 -NotePropertyValue ((Get-FileHash -Algorithm SHA256 -LiteralPath $sigPath).Hash.ToLower()) -Force
  $state | Add-Member -NotePropertyName PssSaltLength -NotePropertyValue 32 -Force
  $state | Add-Member -NotePropertyName PssStructuralProof -NotePropertyValue 'PASS' -Force
  $state | Add-Member -NotePropertyName Part3KeyName -NotePropertyValue $script:ContainerKeyName -Force
  $state | Add-Member -NotePropertyName Part3KeyUniqueName -NotePropertyValue $script:ContainerUniqueName -Force
  $state | Add-Member -NotePropertyName Part3KeyProvider -NotePropertyValue $script:ContainerProviderStr -Force
  $state | ConvertTo-Json | Set-Content -LiteralPath "$Work\state\state.json" -Encoding ASCII

  Write-Host ''
  Write-Host "Detached signature SHA-256: $($state.DetachedSigSha256)"
  Write-Host 'PART 3 PASS - binding record finalized and signed; signature verified by CNG VerifyHash AND an independent structural proof (salt length exactly 32); temporary certificate AND CNG key container removed and verified absent. Continue to Part 4.'
} catch {
  Write-Failure $_
  if ($script:CleanupFailed -and ($_.Exception.Message -notmatch 'E_CLEANUP_FAILED')) {
    Write-Host 'STOP E_CLEANUP_FAILED - could not remove the temporary imported certificate and/or its CNG key container (this cleanup failure happened IN ADDITION to the failure printed above). Do not delete anything manually; report this code.'
  }
  $script:ExitCode = 1
}
exit $script:ExitCode
