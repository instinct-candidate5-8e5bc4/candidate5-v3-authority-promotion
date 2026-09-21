# V3-Part2-SignUKI.ps1 (package v5) - elevated Windows PowerShell. Signs the exact certified unsigned UKI
# with Microsoft SignTool, then verifies the Authenticode signature MATHEMATICALLY (documented mode):
# PE/COFF Authenticode digest per the Microsoft PE specification + PKCS#7 signature check via
# SignedCms.CheckSignature(verifySignatureOnly=$true). This needs NO trusted root and adds nothing to
# any persistent trust store - the production certificate is never placed in Root/CA stores.
# signtool verify /pa is intentionally NOT used: it verifies chain-of-trust against a trusted root,
# which a self-signed identity does not have, and the only workaround would be a prohibited trust-store change.
# Temporary-key cleanup captures BOTH CNG container identifiers (KeyName and UniqueName) before removal,
# deletes the container explicitly through the version-independent CNG API using its KeyName after
# certificate removal, and independently verifies BOTH the certificate thumbprint and the exact container
# are absent (API check by KeyName, corroborated at store level by UniqueName).
# Every failure path prints exactly one STOP line and exits nonzero; cleanup failures are reported
# together with the original failure, never instead of it.
$ErrorActionPreference = 'Stop'
$Work = 'C:\v3-signing'
$ExpectedUnsigned = 'ed5d9d72be40592af3b14bd1fd9dc91a5976b14f350f9124ea414b975464d536'
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
# Parse one RDN field out of an X.500 name string for EXACT equality comparison
function Get-X500Field($x500, $name) {
  foreach ($part in ($x500 -split ', ')) { if ($part.StartsWith("$name=")) { return $part.Substring($name.Length + 1) } }
  return $null
}

function ToHex([byte[]]$bytes) { return ($bytes | ForEach-Object { $_.ToString('x2') }) -join '' }

# Windows PE/COFF Authenticode digest (current algorithm, as fixed by Microsoft Security Bulletin
# MS12-024 and used by SignTool, osslsigncode and independent verifiers): hash the ENTIRE file
# contiguously EXCEPT exactly three regions - the 4-byte CheckSum field, the 8-byte Certificate
# Table data-directory entry, and the Attribute Certificate Table itself (which holds the signature).
# No section sorting, no gap exclusion: every other byte, including inter-section gaps, is hashed.
function Get-AuthenticodeDigest([string]$path) {
  $b = [IO.File]::ReadAllBytes($path)
  Check ($b.Length -gt 0x100) 'E_AUTHENTICODE_PARSE' 'File too small to be a PE image; report this code.'
  $peOff = [BitConverter]::ToInt32($b, 0x3C)
  Check (($peOff -ge 0x40) -and (($peOff + 24) -le $b.Length)) 'E_AUTHENTICODE_PARSE' 'PE header offset out of range; report this code.'
  Check (($b[$peOff] -eq 0x50) -and ($b[$peOff+1] -eq 0x45) -and ($b[$peOff+2] -eq 0) -and ($b[$peOff+3] -eq 0)) 'E_AUTHENTICODE_PARSE' 'Not a PE file (missing PE signature); report this code.'
  $optSize = [BitConverter]::ToUInt16($b, $peOff + 20)
  $optOff = $peOff + 24
  Check (($optSize -ge 120) -and (($optOff + $optSize) -le $b.Length)) 'E_AUTHENTICODE_PARSE' 'Optional header missing or extends past end of file; report this code.'
  $magic = [BitConverter]::ToUInt16($b, $optOff)
  if ($magic -eq 0x10B) { $ddBase = $optOff + 96; $numRvaOff = $optOff + 92 }
  elseif ($magic -eq 0x20B) { $ddBase = $optOff + 112; $numRvaOff = $optOff + 108 }
  else { Stop-Step 'E_AUTHENTICODE_PARSE' "Unknown PE optional-header magic $magic; report this code." }
  Check (([BitConverter]::ToUInt32($b, $numRvaOff)) -ge 5) 'E_AUTHENTICODE_PARSE' 'Fewer than 5 data directories - no certificate-table entry; report this code.'
  $checksumOff = $optOff + 64
  $certEntryOff = $ddBase + (8 * 4)
  Check (($certEntryOff + 8) -le ($optOff + $optSize)) 'E_AUTHENTICODE_PARSE' 'Certificate Table entry outside the optional header; report this code.'
  $certTableOff = [BitConverter]::ToUInt32($b, $certEntryOff)
  $certTableSize = [BitConverter]::ToUInt32($b, $certEntryOff + 4)
  Check (($certTableOff -ge ($certEntryOff + 8)) -and ($certTableSize -ge 8)) 'E_AUTHENTICODE_TABLE' 'File has no attribute certificate table - it is not signed; report this code.'
  # SignTool layout invariant: the certificate table is the last thing in the file. Anything else
  # (trailing bytes after the table, or a table running past EOF) is a controlled STOP, never a guess.
  Check (($certTableOff + $certTableSize) -eq $b.Length) 'E_AUTHENTICODE_TABLE' 'The certificate table is not exactly at end of file (expected SignTool layout); report this code.'
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $null = $sha.TransformBlock($b, 0, $checksumOff, $null, 0)
  $null = $sha.TransformBlock($b, $checksumOff + 4, $certEntryOff - ($checksumOff + 4), $null, 0)
  $null = $sha.TransformBlock($b, $certEntryOff + 8, [int]$certTableOff - ($certEntryOff + 8), $null, 0)
  $null = $sha.TransformFinalBlock($b, 0, 0)
  return ,$sha.Hash
}

# Minimal DER TLV walker used to navigate the signed content
function Read-DerTlv([byte[]]$d, [int]$off) {
  Check (($off + 2) -le $d.Length) 'E_AUTHENTICODE_PKCS7' 'Truncated DER structure; report this code.'
  $tag = $d[$off]
  $lenByte = $d[$off + 1]
  if (($lenByte -band 0x80) -eq 0) { $len = $lenByte; $hLen = 2 }
  else {
    $n = $lenByte -band 0x7F
    Check (($n -ge 1) -and ($n -le 4) -and (($off + 2 + $n) -le $d.Length)) 'E_AUTHENTICODE_PKCS7' 'Malformed DER length; report this code.'
    $len = 0
    for ($i = 0; $i -lt $n; $i++) { $len = ($len -shl 8) + [int]$d[$off + 2 + $i] }
    $hLen = 2 + $n
  }
  Check (($off + $hLen + $len) -le $d.Length) 'E_AUTHENTICODE_PKCS7' 'DER value extends past end of content; report this code.'
  return @{ Tag = [int]$tag; Len = [int]$len; HeadLen = $hLen; ValueOff = $off + $hLen; Total = $hLen + $len }
}

# Extract the embedded PKCS#7 (WIN_CERTIFICATE, revision 0x0200, type 0x0002)
function Get-EmbeddedPkcs7([string]$path) {
  $b = [IO.File]::ReadAllBytes($path)
  Check ($b.Length -gt 0x100) 'E_AUTHENTICODE_PARSE' 'File too small to be a PE image; report this code.'
  $peOff = [BitConverter]::ToInt32($b, 0x3C)
  Check (($peOff -ge 0x40) -and (($peOff + 24) -le $b.Length)) 'E_AUTHENTICODE_PARSE' 'PE header offset out of range; report this code.'
  $optOff = $peOff + 24
  $magic = [BitConverter]::ToUInt16($b, $optOff)
  if ($magic -eq 0x10B) { $ddBase = $optOff + 96 } else { $ddBase = $optOff + 112 }
  $certEntryOff = $ddBase + (8 * 4)
  Check (($certEntryOff + 8) -le $b.Length) 'E_AUTHENTICODE_PARSE' 'Certificate Table entry out of range; report this code.'
  $certTableOff = [BitConverter]::ToUInt32($b, $certEntryOff)
  $certTableSize = [BitConverter]::ToUInt32($b, $certEntryOff + 4)
  Check (($certTableOff -ge ($certEntryOff + 8)) -and ($certTableSize -ge 8) -and (($certTableOff + $certTableSize) -eq $b.Length)) 'E_AUTHENTICODE_TABLE' 'Certificate table missing or not exactly at end of file; report this code.'
  $dwLen = [BitConverter]::ToUInt32($b, [int]$certTableOff)
  $wRev = [BitConverter]::ToUInt16($b, [int]$certTableOff + 4)
  $wType = [BitConverter]::ToUInt16($b, [int]$certTableOff + 6)
  Check (($wRev -eq 0x0200) -and ($wType -eq 0x0002)) 'E_AUTHENTICODE_TABLE' "Unexpected WIN_CERTIFICATE revision $wRev / type $wType; report this code."
  Check (($dwLen -gt 8) -and (($certTableOff + $dwLen) -le $b.Length)) 'E_AUTHENTICODE_TABLE' 'Malformed certificate table length; report this code.'
  $pkcs7 = New-Object byte[] ($dwLen - 8)
  [Array]::Copy($b, [int]$certTableOff + 8, $pkcs7, 0, $pkcs7.Length)
  return ,$pkcs7
}

$script:ExitCode = 0
$script:CleanupFailed = $false
$imported = $null
$script:ContainerKeyName = $null
$script:ContainerUniqueName = $null
$script:ContainerProviderStr = $null
try {
  Write-Host '== V3 PART 2 SIGN THE SUCCESSOR UKI (v5) =='
  Check (Test-Path -LiteralPath "$Work\state\state.json") 'E_STATE' 'Run Part 0 first.'
  $state = Get-Content -LiteralPath "$Work\state\state.json" -Raw | ConvertFrom-Json
  Check ($state.CertThumbprint) 'E_STATE' 'Run Part 1 first.'

  $signtool = $state.SignToolPath
  Check (Test-Path -LiteralPath $signtool) 'E_SIGNTOOL_MISSING' 'signtool.exe missing; rerun Part 0.'
  $stNow = (Get-FileHash -Algorithm SHA256 -LiteralPath $signtool).Hash.ToLower()
  Check ($stNow -eq $state.SignToolSha256) 'E_SIGNTOOL_IDENTITY' 'signtool.exe changed since Part 0. Report this code.'

  $unsigned = "$Work\public\successor-unsigned.efi"
  $staged   = "$Work\work\successor.efi"
  $signed   = "$Work\public\successor-signed.efi"
  Check (-not (Test-Path -LiteralPath $signed)) 'E_OUTPUT_EXISTS' "$signed already exists; report this code."
  Check ((Get-FileHash -Algorithm SHA256 -LiteralPath $unsigned).Hash.ToLower() -eq $ExpectedUnsigned) 'E_UNSIGNED_UKI_IDENTITY' 'The unsigned UKI on disk does not match the certified SHA-256 ed5d9d72be40592af3b14bd1fd9dc91a5976b14f350f9124ea414b975464d536. Report this code.'
  if (Test-Path -LiteralPath $staged) { Remove-Item -LiteralPath $staged -Force }
  Copy-Item -LiteralPath $unsigned -Destination $staged
  Check ((Get-FileHash -Algorithm SHA256 -LiteralPath $staged).Hash.ToLower() -eq $ExpectedUnsigned) 'E_STAGED_UKI_IDENTITY' 'Staging copy mismatch; report this code.'

  $thumbprint = $state.CertThumbprint
  Check (-not (Get-ChildItem 'Cert:\CurrentUser\My' | Where-Object Thumbprint -eq $thumbprint)) 'E_CERTIFICATE_ALREADY_PRESENT' 'The production certificate is already in the store. Report this code; do not delete it manually.'

  try {
    $password = Read-Host 'PFX password' -AsSecureString
    $primary = Join-Path $state.PrimaryPfxDir 'successor-secure-boot.pfx'
    $imported = Import-PfxCertificate -FilePath $primary -CertStoreLocation 'Cert:\CurrentUser\My' -Password $password -Exportable:$false
    $password = $null
    Check ($imported.Thumbprint -eq $thumbprint) 'E_CERTIFICATE_IDENTITY' 'Imported certificate does not match the Part 1 thumbprint. Report this code.'

    # Exact mechanism assertion: CNG (RSACng), non-exportable, RSA-3072
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

    & $signtool sign /fd SHA256 /s My /sha1 $thumbprint $staged | Out-String | Set-Content -LiteralPath "$Work\work\signtool-sign.txt" -Encoding ASCII
    Check ($LASTEXITCODE -eq 0) 'E_SIGNTOOL_SIGN' "SignTool sign failed (exit $LASTEXITCODE). Report this code with $Work\work\signtool-sign.txt."

    # Mathematical Authenticode verification (documented, trust-free) - replaces signtool verify /pa
    Add-Type -AssemblyName System.Security | Out-Null
    $computed = Get-AuthenticodeDigest $staged
    $pkcs7 = Get-EmbeddedPkcs7 $staged
    $cms = New-Object System.Security.Cryptography.Pkcs.SignedCms
    try { $cms.Decode($pkcs7) } catch { Stop-Step 'E_AUTHENTICODE_PKCS7' 'Could not decode the embedded PKCS#7 signature block; report this code.' }
    Check ($cms.SignerInfos.Count -ge 1) 'E_AUTHENTICODE_PKCS7' 'The embedded signature has no signer; report this code.'
    $si = $cms.SignerInfos[0]
    Check ($si.DigestAlgorithm.Value -eq '2.16.840.1.101.3.4.2.1') 'E_AUTHENTICODE_SIGNER' "Signer digest algorithm '$($si.DigestAlgorithm.Value)' is not SHA-256; report this code."
    Check ($si.Certificate.Thumbprint -eq $thumbprint) 'E_AUTHENTICODE_SIGNER' 'Embedded signer certificate does not match the production certificate thumbprint; report this code.'
    # The signed PE digest lives in the SpcIndirectDataContent inside the CMS content:
    # SpcIndirectDataContent ::= SEQUENCE { data SpcAttributeTypeAndOptionalValue, messageDigest DigestInfo }
    # DigestInfo ::= SEQUENCE { digestAlgorithm AlgorithmIdentifier, digest OCTET STRING }.
    # (The PKCS#9 messageDigest authenticated attribute is the hash of THIS content and is validated by
    # SignedCms.CheckSignature below; here we compare the PE digest inside the DigestInfo itself.)
    $content = [byte[]]$cms.ContentInfo.Content
    if (($content.Length -gt 2) -and ($content[0] -eq 0x04)) {
      $t0 = Read-DerTlv $content 0
      $content = $content[$t0.ValueOff..($t0.ValueOff + $t0.Len - 1)]
    }
    $outer = Read-DerTlv $content 0
    Check ($outer.Tag -eq 0x30) 'E_AUTHENTICODE_PKCS7' 'Signed content is not the expected SpcIndirectData SEQUENCE; report this code.'
    $dataField = Read-DerTlv $content $outer.ValueOff
    $diOff = $outer.ValueOff + $dataField.Total
    $di = Read-DerTlv $content $diOff
    Check ($di.Tag -eq 0x30) 'E_AUTHENTICODE_PKCS7' 'No DigestInfo inside the signed content; report this code.'
    $alg = Read-DerTlv $content $di.ValueOff
    Check ($alg.Tag -eq 0x30) 'E_AUTHENTICODE_PKCS7' 'Malformed DigestInfo algorithm field; report this code.'
    $oidTlv = Read-DerTlv $content $alg.ValueOff
    Check (($oidTlv.Tag -eq 0x06) -and ($oidTlv.Len -eq 9)) 'E_AUTHENTICODE_SIGNER' 'DigestInfo algorithm OID is not the expected length; report this code.'
    $oidBytes = $content[$oidTlv.ValueOff..($oidTlv.ValueOff + 8)]
    $sha256Oid = @(0x60,0x86,0x48,0x01,0x65,0x03,0x04,0x02,0x01)
    $oidOk = $true; for ($q = 0; $q -lt 9; $q++) { if ($oidBytes[$q] -ne $sha256Oid[$q]) { $oidOk = $false } }
    Check ($oidOk) 'E_AUTHENTICODE_SIGNER' 'DigestInfo algorithm is not SHA-256; report this code.'
    $octOff = $di.ValueOff + $alg.Total
    $oct = Read-DerTlv $content $octOff
    Check (($oct.Tag -eq 0x04) -and ($oct.Len -eq 32)) 'E_AUTHENTICODE_DIGEST' 'DigestInfo digest is not a 32-byte OCTET STRING; report this code.'
    $embedded = $content[$oct.ValueOff..($oct.ValueOff + 31)]
    Check ((ToHex $computed) -eq (ToHex $embedded)) 'E_AUTHENTICODE_DIGEST' "Computed PE digest does not match the digest inside the signed content.`nComputed: $((ToHex $computed))`nEmbedded: $((ToHex $embedded))`nReport this code."
    try { $cms.CheckSignature($true) } catch { Stop-Step 'E_AUTHENTICODE_SIGNATURE' 'Cryptographic PKCS#7 signature verification failed (covers the messageDigest attribute and the signer signature); report this code.' }

    $verLog = @(
      'Authenticode verification transcript (documented trust-free mode)'
      'Method: Windows PE/COFF Authenticode digest (current algorithm, MS12-024: whole file except CheckSum, the Certificate Table entry, and the certificate table itself) compared with the DigestInfo inside the signed SpcIndirectData content, + PKCS#7 SignedCms.CheckSignature(verifySignatureOnly=True).'
      'signtool verify /pa intentionally NOT used: /pa verifies chain-of-trust to a trusted root; a self-signed'
      'identity has none, and the design prohibits adding the production certificate to any persistent trust store.'
      "PE SHA-256 digest (computed): $((ToHex $computed))"
      "Signed-content DigestInfo digest (embedded): $((ToHex $embedded))"
      "Signer certificate thumbprint: $($si.Certificate.Thumbprint) (matches production certificate: True)"
      'Signer digest algorithm: 2.16.840.1.101.3.4.2.1 (SHA-256)'
      'SignedCms.CheckSignature(verifySignatureOnly=True): PASS (signature over authenticated attributes valid; messageDigest attribute consistent)'
      'RESULT: PASS'
    )
    ($verLog -join "`r`n") | Set-Content -LiteralPath "$Work\work\authenticode-verify.txt" -Encoding ASCII
    Write-Host 'Authenticode mathematical verification PASS (PE digest matches the signed messageDigest; PKCS#7 signature valid)'

    Move-Item -LiteralPath $staged -Destination $signed
    $signedSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $signed).Hash.ToLower()
  } finally {
    $password = $null
    if ($imported -ne $null) {
      try { $rsa.Dispose() } catch {}
      if (-not (Remove-CertAndCngKey $imported $script:ContainerKeyName $script:ContainerUniqueName $script:ContainerProviderStr)) { $script:CleanupFailed = $true }
      if (-not $script:CleanupFailed) { Write-Host 'CLEANUP PASS - certificate removed and CNG key container deleted; both absences independently verified.' }
    }
    $imported = $null; $rsa = $null
    [GC]::Collect()
  }
  if ($script:CleanupFailed) { Stop-Step 'E_CLEANUP_FAILED' 'could not remove the temporary imported certificate and/or its CNG key container. Do not delete anything manually; report this code.' }

  $state | Add-Member -NotePropertyName SignedUkiSha256 -NotePropertyValue $signedSha -Force
  $state | Add-Member -NotePropertyName Part2KeyName -NotePropertyValue $script:ContainerKeyName -Force
  $state | Add-Member -NotePropertyName Part2KeyUniqueName -NotePropertyValue $script:ContainerUniqueName -Force
  $state | Add-Member -NotePropertyName Part2KeyProvider -NotePropertyValue $script:ContainerProviderStr -Force
  $state | ConvertTo-Json | Set-Content -LiteralPath "$Work\state\state.json" -Encoding ASCII

  Write-Host ''
  Write-Host "SIGNED UKI SHA-256: $signedSha"
  Write-Host 'PART 2 PASS - successor UKI signed and mathematically verified; temporary certificate AND CNG key container removed and verified absent. Continue to Part 3.'
} catch {
  Write-Failure $_
  if ($script:CleanupFailed -and ($_.Exception.Message -notmatch 'E_CLEANUP_FAILED')) {
    Write-Host 'STOP E_CLEANUP_FAILED - could not remove the temporary imported certificate and/or its CNG key container (this cleanup failure happened IN ADDITION to the failure printed above). Do not delete anything manually; report this code.'
  }
  $script:ExitCode = 1
}
exit $script:ExitCode
