# V3-WindowsCompatCleanup.ps1 (package v6) - guaranteed if:always() cleanup for the compatibility
# proof. Sentinel rule: the proof writes PROOF-BEGAN.sentinel and an initial cleanup manifest BEFORE
# any key/certificate exists. If the manifest is missing while the sentinel is present, the proof
# began and its manifest was lost - that is a CLEANUP FAILURE (exit 1), never a silent pass. Only a
# missing sentinel proves fixture creation never began. Otherwise this reads the non-secret manifest,
# removes any leftover disposable certificates, CNG containers (by KeyName through the CNG API), and
# fixture files, verifies absence, and exits NONZERO if anything remains.
param([string]$WorkDir = (Join-Path $env:RUNNER_TEMP 'v3-compat'))
$ErrorActionPreference = 'Continue'
$failed = $false
$sentinel = Join-Path $WorkDir 'PROOF-BEGAN.sentinel'
$manifestPath = Join-Path $WorkDir 'cleanup-manifest.json'
if (-not (Test-Path -LiteralPath $manifestPath)) {
  if (Test-Path -LiteralPath $sentinel) {
    Write-Host 'CLEANUP FAILURE: the proof began (sentinel present) but the cleanup manifest is missing; disposable material state is unknown.'
    exit 1
  }
  Write-Host 'CLEANUP: sentinel absent - fixture creation never began; nothing to do.'
  exit 0
}
$m = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
foreach ($t in @($m.thumbprints)) {
  $hits = @(Get-ChildItem 'Cert:\CurrentUser\My' | Where-Object Thumbprint -eq $t)
  foreach ($h in $hits) {
    try { Remove-Item -LiteralPath $h.PSPath -Force; Write-Host "CLEANUP: removed leftover certificate $t" } catch { Write-Host "CLEANUP FAILURE: certificate $t could not be removed"; $failed = $true }
  }
  if (Get-ChildItem 'Cert:\CurrentUser\My' | Where-Object Thumbprint -eq $t) { Write-Host "CLEANUP FAILURE: certificate $t still present"; $failed = $true }
}
foreach ($c in @($m.containers)) {
  $prov = New-Object System.Security.Cryptography.CngProvider($c.provider)
  $exists = $false
  try { $exists = [System.Security.Cryptography.CngKey]::Exists($c.keyName, $prov) } catch { $exists = $false }
  if ($exists) {
    try { $k = [System.Security.Cryptography.CngKey]::Open($c.keyName, $prov); $k.Delete(); $k.Dispose(); Write-Host "CLEANUP: deleted leftover container $($c.keyName)" } catch { Write-Host "CLEANUP FAILURE: container $($c.keyName) could not be deleted"; $failed = $true }
  }
  $still = $false
  try { $still = [System.Security.Cryptography.CngKey]::Exists($c.keyName, $prov) } catch { $still = $true }
  if ($still) { Write-Host "CLEANUP FAILURE: container $($c.keyName) still exists"; $failed = $true }
  $kspDir = Join-Path $env:APPDATA 'Microsoft\Crypto\Keys'
  if (Test-Path -LiteralPath $kspDir) {
    if (Get-ChildItem -LiteralPath $kspDir -File | Where-Object Name -eq $c.uniqueName) { Write-Host "CLEANUP FAILURE: key-store file named $($c.uniqueName) still present"; $failed = $true }
  }
}
foreach ($f in @($m.files)) { if ($f -and (Test-Path -LiteralPath $f)) { try { Remove-Item -LiteralPath $f -Force; Write-Host "CLEANUP: removed file $f" } catch { Write-Host "CLEANUP FAILURE: file $f could not be removed"; $failed = $true } } }
foreach ($d in @($m.dirs)) { if ($d -and (Test-Path -LiteralPath $d)) { try { Remove-Item -LiteralPath $d -Recurse -Force; Write-Host "CLEANUP: removed directory $d" } catch { Write-Host "CLEANUP FAILURE: directory $d could not be removed"; $failed = $true } } }
if ($failed) { Write-Host 'CLEANUP RESULT: FAILURE - disposable material remains on the runner; failing the job.'; exit 1 }
Write-Host 'CLEANUP RESULT: PASS - no disposable certificate, container, key file, fixture file, or work directory remains.'
exit 0
