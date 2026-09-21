# V3-Part1-KeyCreation.ps1 (package v5) - elevated Windows PowerShell. Creates the production signing identity
# per the certified design, asserts the CNG (RSACng) provider, and removes the temporary store copy
# TOGETHER WITH its persisted private-key container: the container's stable CNG unique name and provider
# (KeyName and UniqueName) are captured before removal, the container is explicitly deleted through the
# version-independent CNG API using its KeyName (CngKey.Delete; documented for .NET Framework 3.5-4.8.1,
# the Windows PowerShell 5.1 runtime), and BOTH absences - certificate thumbprint and exact CNG container
# (API check by KeyName, corroborated at store level by UniqueName) - are verified before any PASS.
# The PFX password is entered interactively and is NEVER printed, logged, or stored.
# Every failure path prints exactly one STOP line and exits nonzero - raw exceptions are impossible;
# a cleanup failure is always reported together with the original failure, never instead of it.
$ErrorActionPreference = 'Stop'
$Work = 'C:\v3-signing'
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
$cert = $null
$script:ContainerKeyName = $null
$script:ContainerUniqueName = $null
$script:ContainerProviderStr = $null
try {
  Write-Host '== V3 PART 1 KEY CREATION (v5) =='
  Check (Test-Path -LiteralPath "$Work\state\state.json") 'E_STATE' 'Run Part 0 first.'
  $state = Get-Content -LiteralPath "$Work\state\state.json" -Raw | ConvertFrom-Json
  $primary = Join-Path $state.PrimaryPfxDir 'successor-secure-boot.pfx'
  $backup  = Join-Path $state.BackupPfxDir  'successor-secure-boot.pfx'
  $public  = "$Work\public\successor-secure-boot.cer"
  Check (-not (Test-Path -LiteralPath $primary)) 'E_OUTPUT_EXISTS' "$primary already exists. Do not overwrite a retained key; report this code."
  Check (-not (Test-Path -LiteralPath $backup)) 'E_OUTPUT_EXISTS' "$backup already exists. Do not overwrite a retained key; report this code."
  Check (-not (Test-Path -LiteralPath $public)) 'E_OUTPUT_EXISTS' "$public already exists; report this code."

  Write-Host 'You will now be asked to invent and type a NEW password for the two encrypted key files.'
  Write-Host 'It is typed privately (not shown), never stored by these scripts, and never sent anywhere.'
  Write-Host 'You must be able to reproduce it to sign later phases - write it down and keep it with the two key files.'

  $thumb = $null
  $cerSha = $null
  try {
    $password = Read-Host 'New PFX password' -AsSecureString
    $subject = 'CN=V3 Successor UKI Secure Boot Authority'
    $notBefore = (Get-Date).ToUniversalTime().Date
    $notAfter = $notBefore.AddYears(10).AddSeconds(-1)
    $cert = New-SelfSignedCertificate `
      -Type Custom -Subject $subject `
      -KeyAlgorithm RSA -KeyLength 3072 -HashAlgorithm SHA256 `
      -KeyExportPolicy Exportable -KeyUsage DigitalSignature `
      -TextExtension @('2.5.29.19={critical}{text}ca=false','2.5.29.37={text}1.3.6.1.5.5.7.3.3') `
      -CertStoreLocation 'Cert:\CurrentUser\My' -NotBefore $notBefore -NotAfter $notAfter
    Check ($null -ne $cert) 'E_KEYGEN' 'Certificate creation failed.'

    # Exact mechanism assertion: the persisted private key must be CNG (RSACng) on the Microsoft software provider
    $k = [Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
    Check ($null -ne $k) 'E_KEYGEN' 'No private key on the new certificate; report this code.'
    Check ($k -is [System.Security.Cryptography.RSACng]) 'E_KEY_PROVIDER' 'The new private key is not a CNG key (RSACng). Report this code; do not continue with another provider.'
    Check ($k.Key.Provider.Provider -eq 'Microsoft Software Key Storage Provider') 'E_KEY_PROVIDER' "Unexpected key provider '$($k.Key.Provider.Provider)'. Report this code."
    Check ($k.KeySize -eq 3072) 'E_KEY_SIZE' "Key size is $($k.KeySize), expected 3072. Report this code."

    # Capture the stable CNG container identity BEFORE any removal (needed for verified deletion):
    # BOTH the KeyName (what CngKey.Exists/Open/Delete accept) and the UniqueName (corroborating
    # provider-level identifier; the software KSP names the persisted key file after it).
    $script:ContainerKeyName = $k.Key.KeyName
    $script:ContainerUniqueName = $k.Key.UniqueName
    $script:ContainerProviderStr = $k.Key.Provider.Provider
    Check ($script:ContainerKeyName -and $script:ContainerUniqueName) 'E_KEYGEN' 'Could not capture the CNG container KeyName/UniqueName; report this code.'
    try { $k.Dispose() } catch {}

    Export-PfxCertificate -Cert $cert.PSPath -FilePath $primary -Password $password -CryptoAlgorithmOption AES256_SHA256 -NoProperties
    Copy-Item -LiteralPath $primary -Destination $backup -Force
    Export-Certificate -Cert $cert.PSPath -FilePath $public -Type CERT

    $hP = (Get-FileHash -Algorithm SHA256 -LiteralPath $primary).Hash
    $hB = (Get-FileHash -Algorithm SHA256 -LiteralPath $backup).Hash
    Check ($hP -eq $hB) 'E_PFX_BACKUP_MISMATCH' 'The two encrypted key files differ. Delete neither; report this code.'

    $cerSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $public).Hash.ToLower()
    $thumb = $cert.Thumbprint
  } finally {
    $password = $null
    if ($cert -ne $null) {
      if (-not (Remove-CertAndCngKey $cert $script:ContainerKeyName $script:ContainerUniqueName $script:ContainerProviderStr)) { $script:CleanupFailed = $true }
      if (-not $script:CleanupFailed) { Write-Host 'CLEANUP PASS - certificate removed and CNG key container deleted; both absences independently verified.' }
    }
    [GC]::Collect()
  }
  if ($script:CleanupFailed) { Stop-Step 'E_CLEANUP_FAILED' 'could not remove the temporary certificate and/or its CNG key container. Do not delete anything manually; report this code.' }

  $state | Add-Member -NotePropertyName CertThumbprint -NotePropertyValue $thumb -Force
  $state | Add-Member -NotePropertyName CertDerSha256 -NotePropertyValue $cerSha -Force
  $state | Add-Member -NotePropertyName GeneratedKeyName -NotePropertyValue $script:ContainerKeyName -Force
  $state | Add-Member -NotePropertyName GeneratedKeyUniqueName -NotePropertyValue $script:ContainerUniqueName -Force
  $state | Add-Member -NotePropertyName GeneratedKeyProvider -NotePropertyValue $script:ContainerProviderStr -Force
  $state | ConvertTo-Json | Set-Content -LiteralPath "$Work\state\state.json" -Encoding ASCII

  Write-Host ''
  Write-Host "PUBLIC certificate thumbprint: $thumb"
  Write-Host "PUBLIC certificate file SHA-256: $cerSha"
  Write-Host 'PART 1 PASS - production identity created (CNG provider verified); two identical encrypted key files exist on two separate encrypted drives; temporary certificate AND CNG key container removed and verified absent.'
  Write-Host 'Continue to Part 2.'
} catch {
  Write-Failure $_
  if ($script:CleanupFailed -and ($_.Exception.Message -notmatch 'E_CLEANUP_FAILED')) {
    Write-Host 'STOP E_CLEANUP_FAILED - could not remove the temporary certificate and/or its CNG key container (this cleanup failure happened IN ADDITION to the failure printed above). Do not delete anything manually; report this code.'
  }
  $script:ExitCode = 1
}
exit $script:ExitCode
