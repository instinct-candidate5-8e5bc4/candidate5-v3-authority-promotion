# V3-Part0-Preflight.ps1 (package v5) - run in elevated Windows PowerShell (Run as administrator)
# Non-secret preflight only. Generates nothing secret. Downloads and verifies the three public inputs,
# installs the zero-cost Windows SDK (SignTool, a Microsoft-signed binary). NO third-party executables:
# the detached-signature verification is a pure-PowerShell structural proof inside Part 3 itself.
# Every failure path prints exactly one STOP line and exits nonzero - raw exceptions are impossible.
$ErrorActionPreference = 'Stop'
$Work = 'C:\v3-signing'

################ EDIT THESE TWO LINES ONLY (per certified design: two DISTINCT, ENCRYPTED, owner-controlled volumes) ################
$PrimaryPfxDir = 'E:\v3-secure-boot-primary'
$BackupPfxDir  = 'F:\v3-secure-boot-backup'
#################################################################################################################################

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
  Write-Host '== V3 PART 0 PREFLIGHT (v5) =='

  # 1. Administrator
  $principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
  Check ($principal.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)) 'E_NOT_ADMIN' 'Close this window. Right-click Windows PowerShell and choose Run as administrator, then rerun this script.'

  # 2. 64-bit Windows, PowerShell 5.1+
  Check ([Environment]::Is64BitOperatingSystem) 'E_NOT_64BIT' 'A 64-bit edition of Windows is required.'
  Check ($PSVersionTable.PSVersion.Major -ge 5) 'E_POWERSHELL' 'Windows PowerShell 5.1 or newer is required.'

  # 3. Folders
  foreach ($d in @($Work, "$Work\public", "$Work\work", "$Work\state", "$Work\REVIEW-EVIDENCE")) {
    if (-not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Path $d | Out-Null }
  }

  # 4. The two PFX volumes: exist, distinct volumes, distinct physical disks, encryption proven
  Check (Test-Path -LiteralPath $PrimaryPfxDir) 'E_PRIMARY_DIR' "Folder $PrimaryPfxDir does not exist. Create it on an encrypted drive you control, edit the two lines at the top of this script, then rerun."
  Check (Test-Path -LiteralPath $BackupPfxDir) 'E_BACKUP_DIR' "Folder $BackupPfxDir does not exist. Create it on a DIFFERENT encrypted drive you control, edit the two lines at the top of this script, then rerun."
  $drvP = (Get-Item -LiteralPath $PrimaryPfxDir).PSDrive.Name
  $drvB = (Get-Item -LiteralPath $BackupPfxDir).PSDrive.Name
  Check ($drvP -ne $drvB) 'E_SAME_VOLUME' 'The two folders are on the same drive. The design requires two DISTINCT volumes on two distinct physical devices.'
  $diskP = (Get-Partition -DriveLetter $drvP | Get-Disk).Number
  $diskB = (Get-Partition -DriveLetter $drvB | Get-Disk).Number
  Check ($diskP -ne $diskB) 'E_SAME_DISK' 'The two folders resolve to the same physical disk. Use two different physical devices (for example the internal drive plus an encrypted USB drive).'
  function Test-Encrypted($letter) {
    try { $v = Get-BitLockerVolume -MountPoint "${letter}:" -ErrorAction Stop; if ($v.ProtectionStatus -eq 'On' -or $v.VolumeStatus -eq 'FullyEncrypted') { return $true } } catch {}
    try { $w = Get-CimInstance -Namespace 'root\CIMv2\Security\MicrosoftVolumeEncryption' -ClassName Win32_EncryptableVolume -Filter "DriveLetter='${letter}:'" -ErrorAction Stop; if ($w.ProtectionStatus -eq 1) { return $true } } catch {}
    return $false
  }
  Check (Test-Encrypted $drvP) 'E_ENCRYPTION_UNPROVEN' "Drive ${drvP}: is not encrypted (BitLocker/Device Encryption) or encryption cannot be determined. Per the certified design: STOP. Do not buy hardware or a Windows upgrade; report this code."
  Check (Test-Encrypted $drvB) 'E_ENCRYPTION_UNPROVEN' "Drive ${drvB}: is not encrypted (BitLocker/Device Encryption) or encryption cannot be determined. Per the certified design: STOP. Do not buy hardware or a Windows upgrade; report this code."

  # 5. SignTool via the pinned Windows SDK (zero cost, Microsoft) - the ONLY executable used by this ceremony
  $binRoot = "${env:ProgramFiles(x86)}\Windows Kits\10\bin"
  function Find-SignTool {
    if (-not (Test-Path -LiteralPath $binRoot)) { return $null }
    $dirs = Get-ChildItem -LiteralPath $binRoot -Directory | Sort-Object Name -Descending
    foreach ($d in $dirs) { $p = Join-Path $d.FullName 'x64\signtool.exe'; if (Test-Path -LiteralPath $p) { return $p } }
    return $null
  }
  $signtool = Find-SignTool
  if (-not $signtool) {
    $winget = Get-Command winget.exe -ErrorAction SilentlyContinue
    if (-not $winget) {
      Stop-Step 'E_WINGET_MISSING' 'winget is not available. Manual step: in your browser go ONLY to https://learn.microsoft.com/en-us/windows/apps/windows-sdk/downloads and install the Windows 11 SDK 10.0.26100 Installer from that Microsoft page. Use no other site. Then rerun this script.'
    }
    Write-Host 'Installing Windows SDK 10.0.26100 (zero cost, from Microsoft) - this can take several minutes...'
    & winget.exe install --id Microsoft.WindowsSDK.10.0.26100 --exact --silent --accept-package-agreements --accept-source-agreements
    Check ($LASTEXITCODE -eq 0) 'E_SDK_INSTALL' "Windows SDK install failed (exit $LASTEXITCODE). Report this code; do not download the SDK from any other site."
    $signtool = Find-SignTool
  }
  Check ($null -ne $signtool) 'E_SIGNTOOL_MISSING' 'signtool.exe was not found under Windows Kits after install. Report this code.'

  # 6. SignTool identity validation: package-controlled expected publisher signature (never a self-learned hash alone)
  $sigs = Get-AuthenticodeSignature -FilePath $signtool
  Check ($sigs.Status -eq 'Valid') 'E_SIGNTOOL_SIGNATURE' 'signtool.exe does not carry a valid Authenticode signature. Report this code.'
  # Parsed EXACT identity comparison against the nominated publisher (no wildcard/substring matching):
  # signer Subject CN and O must each equal exactly 'Microsoft Corporation', and the Issuer O likewise.
  function Get-X500Field($x500, $name) {
    foreach ($part in ($x500 -split ', ')) { if ($part.StartsWith("$name=")) { return $part.Substring($name.Length + 1) } }
    return $null
  }
  $subCN = Get-X500Field $sigs.SignerCertificate.Subject 'CN'
  $subO  = Get-X500Field $sigs.SignerCertificate.Subject 'O'
  $issO  = Get-X500Field $sigs.SignerCertificate.Issuer 'O'
  Check (($subCN -eq 'Microsoft Corporation') -and ($subO -eq 'Microsoft Corporation') -and ($issO -eq 'Microsoft Corporation')) 'E_SIGNTOOL_SIGNER' "signtool.exe signer identity does not exactly match the nominated publisher (Subject: '$($sigs.SignerCertificate.Subject)'; Issuer: '$($sigs.SignerCertificate.Issuer)'). Report this code."
  $stHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $signtool).Hash.ToLower()
  $stVer = (Get-Item -LiteralPath $signtool).VersionInfo.FileVersion
  Write-Host "SignTool: $signtool"
  Write-Host "SignTool version: $stVer"
  Write-Host "SignTool SHA-256: $stHash"
  Write-Host "SignTool signer: $($sigs.SignerCertificate.Subject)"

  # 7. Download and verify the three public inputs (pinned commit URLs, full SHA-256 checks)
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $base = 'https://raw.githubusercontent.com/instinct-candidate5-8e5bc4/candidate5-v3-authority-promotion/92741cbdefaa78adc33bc3c74935a45f9558b88c/docs/verified-architecture-phase2-v3/successor-uki-candidate'
  $inputs = @(
    @{ Name = 'successor-unsigned.efi';                  Size = 21164544; Sha = 'ed5d9d72be40592af3b14bd1fd9dc91a5976b14f350f9124ea414b975464d536' },
    @{ Name = 'successor-authority-record.v1.json';      Size = 46963;    Sha = 'c09245ae3b60db34f050e29fd9f457a83fde95bd44efc70e9afda14fcbee0e88' },
    @{ Name = 'inventory.v1.json';                       Size = 52390;    Sha = 'a34edbf31bdacca8b2f836d496d01da5d57a8e8a1f46fcc7d63a9ab0dc297236' }
  )
  foreach ($f in $inputs) {
    $dst = Join-Path "$Work\public" $f.Name
    Invoke-WebRequest -Uri "$base/$($f.Name)" -OutFile $dst -UseBasicParsing
    $len = (Get-Item -LiteralPath $dst).Length
    Check ($len -eq $f.Size) 'E_INPUT_SIZE' "$($f.Name): downloaded $len bytes, expected $($f.Size). Do not retry from another source; report this code."
    $h = (Get-FileHash -Algorithm SHA256 -LiteralPath $dst).Hash.ToLower()
    Check ($h -eq $f.Sha) 'E_INPUT_HASH' "$($f.Name): SHA-256 mismatch. Got $h expected $($f.Sha). Report this code; the file has been left in place for inspection."
    Write-Host "VERIFIED $($f.Name) ($len bytes, SHA-256 match)"
  }

  # 8. Persist non-secret state
  @{ PrimaryPfxDir = $PrimaryPfxDir; BackupPfxDir = $BackupPfxDir;
     SignToolPath = $signtool; SignToolVersion = $stVer; SignToolSha256 = $stHash } |
    ConvertTo-Json | Set-Content -LiteralPath "$Work\state\state.json" -Encoding ASCII

  Write-Host ''
  Write-Host 'PART 0 PASS - all non-secret preflight checks succeeded. You may continue to Part 1.'
} catch {
  Write-Failure $_
  $script:ExitCode = 1
}
exit $script:ExitCode
