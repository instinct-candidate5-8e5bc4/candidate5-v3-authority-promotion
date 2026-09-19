# REVIEWED TEMPLATE - DO NOT RUN UNTIL INDEPENDENT PASS AND OWNER CONFIRMATION.
# Windows PowerShell 5.1+, run as the dedicated offline Owner account.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
function Stop-Ceremony([string]$Code) { throw $Code }

# Owner sets these non-secret paths after mounting the BitLocker To Go drive.
$Sdk = "${env:ProgramFiles(x86)}\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe"
$CustodyDrive = 'X:\'
$Inbox = Join-Path $CustodyDrive 'signing-inbox'
$Outbox = Join-Path $CustodyDrive 'signing-outbox'
$Ledger = Join-Path $CustodyDrive 'consumed-request-ids.txt'
$Subject = 'CN=V3 GCP Successor UKI Secure Boot Authority'
if (-not (Test-Path -LiteralPath $Sdk -PathType Leaf)) { Stop-Ceremony 'E_SIGNER_IDENTITY' }
(Get-FileHash -Algorithm SHA256 -LiteralPath $Sdk).Hash.ToLowerInvariant()

# ONE-TIME GENERATION. Owner runs only after review + storage-policy confirmation.
# Confirm X: is the intended unlocked BitLocker To Go volume before continuing.
manage-bde -status $CustodyDrive
$confirm = Read-Host 'Type GENERATE NEW SOLE KEY to continue'
if ($confirm -eq 'GENERATE NEW SOLE KEY') {
  $notBefore = [DateTime]::SpecifyKind([DateTime]'2026-09-19T00:00:00', 'Utc')
  $notAfter = $notBefore.AddYears(10)
  $cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject $Subject `
    -KeyAlgorithm RSA -KeyLength 3072 -HashAlgorithm SHA256 `
    -KeyExportPolicy ExportableEncrypted -KeyProtection ProtectHigh `
    -Provider 'Microsoft Software Key Storage Provider' `
    -CertStoreLocation 'Cert:\CurrentUser\My' -NotBefore $notBefore -NotAfter $notAfter
  if (-not $cert.HasPrivateKey) { Stop-Ceremony 'E_KEY_GENERATION' }
  $pfxPassword = Read-Host 'Enter new PFX password (never record or send it)' -AsSecureString
  $pfx = Join-Path $CustodyDrive 'successor-secure-boot.pfx'
  $cer = Join-Path $CustodyDrive 'successor-secure-boot.cer'
  Export-PfxCertificate -Cert $cert -FilePath $pfx -Password $pfxPassword -CryptoAlgorithmOption AES256_SHA256 -ChainOption EndEntityCertOnly -NoProperties | Out-Null
  Export-Certificate -Cert $cert -FilePath $cer -Type CERT | Out-Null
  Write-Host ('CERT_DER_SHA256=' + (Get-FileHash -Algorithm SHA256 $cer).Hash.ToLowerInvariant())
  Write-Host ('CERT_THUMBPRINT=' + $cert.Thumbprint.ToLowerInvariant())
  certutil -dump $cer
  Remove-Item -LiteralPath ("Cert:\CurrentUser\My\" + $cert.Thumbprint) -Force
  if (Test-Path ("Cert:\CurrentUser\My\" + $cert.Thumbprint)) { Stop-Ceremony 'E_CUSTODY_RETURN' }
  Write-Host 'KEY EXPORTED ENCRYPTED; STORE COPY REMOVED; DISCONNECT AND SECURE DRIVE'
  exit 0
}

# RECURRING SIGNING. Inbox must contain exactly request.json and successor-uki-unsigned.efi.
$names = @(Get-ChildItem -LiteralPath $Inbox -Force | Sort-Object Name | ForEach-Object Name)
if (($names.Count -ne 2) -or ($names[0] -ne 'request.json') -or ($names[1] -ne 'successor-uki-unsigned.efi')) { Stop-Ceremony 'E_UNEXPECTED_INPUT' }
$requestPath = Join-Path $Inbox 'request.json'
$unsignedPath = Join-Path $Inbox 'successor-uki-unsigned.efi'
$requestBytes = [IO.File]::ReadAllBytes($requestPath)
if (($requestBytes.Length -eq 0) -or ($requestBytes[-1] -ne 10)) { Stop-Ceremony 'E_REQUEST_NONCANONICAL' }
& (Join-Path $PSScriptRoot 'Test-CeremonyContract.ps1') -RequestPath $requestPath -UnsignedUkiPath $unsignedPath -CertificateDerPath (Join-Path $CustodyDrive 'successor-secure-boot.cer')
if ($LASTEXITCODE -ne 0) { Stop-Ceremony 'E_REQUEST_CONTRACT' }
$request = Get-Content -Raw -LiteralPath $requestPath | ConvertFrom-Json
if ($request.schema -ne 'v3.successor-uki-signing-request.v1' -or $request.purpose -ne 'V3_GCP_MINIMAL_SUCCESSOR_UKI') { Stop-Ceremony 'E_REQUEST_SCHEMA' }
if ([DateTime]::UtcNow -gt [DateTime]::Parse($request.expiresAt).ToUniversalTime()) { Stop-Ceremony 'E_REQUEST_EXPIRED' }
if ((Test-Path $Ledger) -and (Select-String -SimpleMatch -Quiet -LiteralPath $Ledger -Pattern $request.requestId)) { Stop-Ceremony 'E_REQUEST_REPLAY' }
$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $unsignedPath).Hash.ToLowerInvariant()
$length = (Get-Item -LiteralPath $unsignedPath).Length
if ($hash -ne $request.unsignedUkiSha256 -or $length -ne [Int64]$request.unsignedUkiByteLength) { Stop-Ceremony 'E_UNSIGNED_DIGEST' }
$cer = Join-Path $CustodyDrive 'successor-secure-boot.cer'
if ((Get-FileHash -Algorithm SHA256 $cer).Hash.ToLowerInvariant() -ne $request.expectedSecureBootCertificateDerSha256) { Stop-Ceremony 'E_PUBLIC_IDENTITY' }
Write-Host "REQUEST VERIFIED: $($request.requestId) UKI=$hash BYTES=$length"
$approval = Read-Host 'Owner: type the full request ID to authorize exactly this signature'
if ($approval -ne $request.requestId) { Stop-Ceremony 'E_OWNER_APPROVAL' }

$pfxPassword = Read-Host 'Enter PFX password' -AsSecureString
$imported = Import-PfxCertificate -FilePath (Join-Path $CustodyDrive 'successor-secure-boot.pfx') -CertStoreLocation 'Cert:\CurrentUser\My' -Password $pfxPassword -Exportable:$false
try {
  $signedPath = Join-Path $Outbox 'successor-uki-signed.efi'
  Copy-Item -LiteralPath $unsignedPath -Destination $signedPath
  & $Sdk sign /fd SHA256 /sha1 $imported.Thumbprint /s My $signedPath
  if ($LASTEXITCODE -ne 0) { Stop-Ceremony 'E_SIGNATURE' }
  & $Sdk verify /pa /all /v $signedPath
  if ($LASTEXITCODE -ne 0) { Stop-Ceremony 'E_SIGNATURE' }
  Add-Content -LiteralPath $Ledger -Encoding ASCII -Value $request.requestId
  Copy-Item -LiteralPath $requestPath -Destination (Join-Path $Outbox 'request.json')
  Copy-Item -LiteralPath $cer -Destination (Join-Path $Outbox 'successor-secure-boot.cer')
  $evidence = [ordered]@{
    schema='v3.successor-uki-offline-signing-evidence.v1'; requestId=$request.requestId
    unsignedUkiSha256=$hash; unsignedUkiByteLength=$length
    signedUkiSha256=(Get-FileHash -Algorithm SHA256 $signedPath).Hash.ToLowerInvariant()
    signedUkiByteLength=(Get-Item $signedPath).Length
    certificateDerSha256=(Get-FileHash -Algorithm SHA256 $cer).Hash.ToLowerInvariant()
    signerSha256=(Get-FileHash -Algorithm SHA256 $Sdk).Hash.ToLowerInvariant()
    privateKeyExported=$false; networkPresent=$false; unexpectedInputCount=0
    outcome='SIGNED_PENDING_INDEPENDENT_REVIEW'
  }
  $coreJson = ($evidence | ConvertTo-Json -Compress)
  $coreBytes = [Text.Encoding]::UTF8.GetBytes($coreJson + "`n")
  $domainBytes = [Text.Encoding]::ASCII.GetBytes("V3-SUCCESSOR-UKI-SIGNING-EVIDENCE:v1`0")
  $joined = New-Object byte[] ($domainBytes.Length + $coreBytes.Length)
  [Array]::Copy($domainBytes,0,$joined,0,$domainBytes.Length); [Array]::Copy($coreBytes,0,$joined,$domainBytes.Length,$coreBytes.Length)
  $rsa = [Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($imported)
  $sig = $rsa.SignData($joined,[Security.Cryptography.HashAlgorithmName]::SHA256,[Security.Cryptography.RSASignaturePadding]::Pss)
  $evidence.evidenceSignatureDomain='V3-SUCCESSOR-UKI-SIGNING-EVIDENCE:v1'
  $evidence.evidenceSignatureAlgorithm='RSASSA-PSS-SHA256-MGF1-SHA256-SALT32'
  $evidence.evidenceSignerSpkiSha256=$request.expectedSecureBootSpkiSha256
  $evidence.evidenceSignature=[Convert]::ToBase64String($sig)
  (($evidence | ConvertTo-Json -Compress) + "`n") | Set-Content -NoNewline -Encoding UTF8 (Join-Path $Outbox 'signing-evidence.v1.json')
  Write-Host 'SIGNED ARTIFACT VERIFIED'
} finally {
  if ($imported) { Remove-Item -LiteralPath ("Cert:\CurrentUser\My\" + $imported.Thumbprint) -Force }
}
if (Test-Path ("Cert:\CurrentUser\My\" + $imported.Thumbprint)) { Stop-Ceremony 'E_CUSTODY_RETURN' }
Write-Host 'CUSTODY RETURN READY - disconnect and secure BitLocker drive'
