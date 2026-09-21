# V3-Part4-EvidenceAndCleanup.ps1 (package v5) - elevated Windows PowerShell.
# Assembles the NON-SECRET review evidence folder against an EXACT allowlist (anything else = STOP),
# writes the manifest (hashes of every OTHER evidence file), verifies the final set, prints return instructions.
# Every failure path prints exactly one STOP line and exits nonzero - raw exceptions are impossible.
$ErrorActionPreference = 'Stop'
$Work = 'C:\v3-signing'
$Ev = "$Work\REVIEW-EVIDENCE"
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
  Write-Host '== V3 PART 4 EVIDENCE AND CLEANUP (v5) =='
  Check (Test-Path -LiteralPath "$Work\state\state.json") 'E_STATE' 'Run Part 0 first.'
  $state = Get-Content -LiteralPath "$Work\state\state.json" -Raw | ConvertFrom-Json
  Check ($state.DetachedSigSha256) 'E_STATE' 'Run Part 3 first.'

  # Store must not contain the production certificate anymore
  Check (-not (Get-ChildItem 'Cert:\CurrentUser\My' | Where-Object Thumbprint -eq $state.CertThumbprint)) 'E_STORE_KEY_REMAINS' 'The production certificate is still in the certificate store. Report this code; do not delete it manually.'

  # None of the recorded CNG key containers (Part 1 generated key, Part 2 and Part 3 imports) may still
  # exist. The API check uses each container's KeyName (the identifier CngKey.Exists actually takes);
  # the store-level corroboration uses its UniqueName (the software KSP names the persisted key file
  # after it under %APPDATA%\Microsoft\Crypto\Keys). BOTH must show absence.
  $containers = @()
  if ($state.GeneratedKeyName) { $containers += @{ N = $state.GeneratedKeyName; U = $state.GeneratedKeyUniqueName; P = $state.GeneratedKeyProvider } }
  if ($state.Part2KeyName)     { $containers += @{ N = $state.Part2KeyName;     U = $state.Part2KeyUniqueName;     P = $state.Part2KeyProvider } }
  if ($state.Part3KeyName)     { $containers += @{ N = $state.Part3KeyName;     U = $state.Part3KeyUniqueName;     P = $state.Part3KeyProvider } }
  Check ($containers.Count -eq 3) 'E_STATE' 'Container identities from Parts 1-3 are missing from state; report this code.'
  foreach ($c in $containers) {
    Check ($c.U) 'E_STATE' 'A recorded container is missing its UniqueName; report this code.'
    $prov = New-Object System.Security.Cryptography.CngProvider($c.P)
    $stillThere = $true
    try { $stillThere = [System.Security.Cryptography.CngKey]::Exists($c.N, $prov) } catch { $stillThere = $true }
    Check (-not $stillThere) 'E_KEY_CONTAINER_REMAINS' "A production CNG key container (KeyName '$($c.N)') still exists in provider '$($c.P)'. Report this code; do not delete it manually."
    $kspDir = Join-Path $env:APPDATA 'Microsoft\Crypto\Keys'
    $fsThere = $false
    try { if ((Test-Path -LiteralPath $kspDir) -and (Get-ChildItem -LiteralPath $kspDir -File -ErrorAction Stop | Where-Object Name -eq $c.U)) { $fsThere = $true } } catch { $fsThere = $true }
    Check (-not $fsThere) 'E_KEY_CONTAINER_REMAINS' "A persisted key file named by the recorded UniqueName ('$($c.U)') still exists under the user CNG key store. Report this code; do not delete it manually."
  }
  Write-Host 'Key-hygiene PASS - no production certificate in the store; all three recorded CNG key containers verified absent by KeyName (API) and UniqueName (key-store file).'

  # Exact public evidence allowlist: name -> source subfolder
  $allowed = [ordered]@{
    'successor-secure-boot.cer'                    = 'public'
    'successor-unsigned.efi'                       = 'public'
    'successor-signed.efi'                         = 'public'
    'successor-authority-record.v1.json'           = 'public'
    'successor-authority-record-final.v1.json'     = 'public'
    'successor-authority-record-final.v1.sig'      = 'public'
    'inventory.v1.json'                            = 'public'
    'signtool-sign.txt'                            = 'work'
    'authenticode-verify.txt'                      = 'work'
    'detached-preimage.sha256'                     = 'work'
  }
  $prohibitedExt = @('.pfx', '.p12', '.pvk', '.key')

  # Pre-scan: the evidence folder must contain nothing unexpected before assembly
  if (Test-Path -LiteralPath $Ev) {
    Get-ChildItem -LiteralPath $Ev -Recurse -File | ForEach-Object {
      Check (($allowed.Contains($_.Name)) -or ($_.Name -eq 'EVIDENCE-MANIFEST.json')) 'E_UNEXPECTED_EVIDENCE' "Unexpected file in the evidence folder: $($_.Name). Remove nothing manually; report this code."
      Check ($prohibitedExt -notcontains $_.Extension.ToLower()) 'E_SECRET_IN_EVIDENCE' "Prohibited file type in the evidence folder: $($_.Name). Remove nothing manually; report this code."
      Check ($_.Name -notmatch 'password|secret|private') 'E_SECRET_IN_EVIDENCE' "Suspicious filename in the evidence folder: $($_.Name). Remove nothing manually; report this code."
    }
  } else {
    New-Item -ItemType Directory -Path $Ev | Out-Null
  }

  # Copy EXACTLY the allowlist (every entry mandatory - no copy-if-present)
  foreach ($name in $allowed.Keys) {
    $src = Join-Path (Join-Path $Work $allowed[$name]) $name
    Check (Test-Path -LiteralPath $src) 'E_EVIDENCE_MISSING' "$src is missing; report this code."
    Copy-Item -LiteralPath $src -Destination $Ev -Force
  }

  # Verify the assembled set is exactly the allowlist
  $now = Get-ChildItem -LiteralPath $Ev -Recurse -File | Where-Object Name -ne 'EVIDENCE-MANIFEST.json'
  $names = @($now | ForEach-Object Name | Sort-Object)
  $want = @($allowed.Keys | Sort-Object)
  Check (($names.Count -eq $want.Count) -and (-not (Compare-Object $names $want))) 'E_EVIDENCE_SET' 'The assembled evidence set does not exactly equal the expected public set. Remove nothing manually; report this code.'

  # Manifest: SHA-256 of every OTHER evidence file (a manifest never hashes itself)
  $manifest = [ordered]@{}
  $manifest.schema = 'v3.production-signing-evidence.v3'
  $manifest.note = 'This manifest records the SHA-256 and byte length of every OTHER evidence file. It does not hash itself.'
  $manifest.createdUtc = (Get-Date).ToUniversalTime().ToString('o')
  $manifest.gitCommit = '92741cbdefaa78adc33bc3c74935a45f9558b88c'
  $manifest.gitTree = '9cc2e40fab25c2231d5a6cefa285d2e3e65a7bee'
  $manifest.domain = 'V3-SUCCESSOR-UKI-EXTERNAL-BINDING:v1'
  $manifest.signtoolPath = $state.SignToolPath
  $manifest.signtoolVersion = $state.SignToolVersion
  $manifest.signtoolSha256 = $state.SignToolSha256
  $manifest.certificateThumbprint = $state.CertThumbprint
  $manifest.certificateDerSha256 = $state.CertDerSha256
  $manifest.unsignedUkiSha256 = 'ed5d9d72be40592af3b14bd1fd9dc91a5976b14f350f9124ea414b975464d536'
  $manifest.signedUkiSha256 = $state.SignedUkiSha256
  $manifest.finalRecordSha256 = $state.FinalRecordSha256
  $manifest.detachedSignatureSha256 = $state.DetachedSigSha256
  $manifest.pssSaltLengthBytes = 32
  $manifest.pssStructuralProof = 'PASS'
  $manifest.authenticodeMathematicalVerify = 'PASS'
  $manifest.keyContainersAbsent = $true
  $manifest.twoEncryptedPfxCopiesIdentical = $true
  $files = [ordered]@{}
  foreach ($name in $allowed.Keys) {
    $fi = Get-Item -LiteralPath (Join-Path $Ev $name)
    $files[$name] = (@{ bytes = $fi.Length; sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $fi.FullName).Hash.ToLower() })
  }
  $manifest.files = $files
  ($manifest | ConvertTo-Json -Depth 5) | Set-Content -LiteralPath "$Ev\EVIDENCE-MANIFEST.json" -Encoding ASCII

  # Final sweep: allowlist + manifest only, no prohibited material
  Get-ChildItem -LiteralPath $Ev -Recurse -File | ForEach-Object {
    Check (($allowed.Contains($_.Name)) -or ($_.Name -eq 'EVIDENCE-MANIFEST.json')) 'E_UNEXPECTED_EVIDENCE' "Unexpected file in the final evidence folder: $($_.Name). Remove nothing manually; report this code."
    Check ($prohibitedExt -notcontains $_.Extension.ToLower()) 'E_SECRET_IN_EVIDENCE' "Prohibited file type in the final evidence folder: $($_.Name). Remove nothing manually; report this code."
  }

  [GC]::Collect()
  Write-Host ''
  Write-Host '================ RETURN INSTRUCTIONS ================'
  Write-Host "SAFE TO RETURN FOR REVIEW: the entire folder $Ev (everything in it is public evidence)."
  Write-Host 'NEVER SHARE / KEEP PRIVATE - never put these in Git, GitHub, any repository, any CI system,'
  Write-Host 'email, chat, or cloud storage, and never transfer them to any agent or assistant:'
  Write-Host '  - the two successor-secure-boot.pfx files on your two encrypted drives (keep them safe; later phases need them)'
  Write-Host '  - the PFX password'
  Write-Host '  - the C:\v3-signing\state and C:\v3-signing\work folders'
  Write-Host '====================================================='
  Write-Host 'PART 4 PASS - evidence ready. Return ONLY the REVIEW-EVIDENCE folder.'
} catch {
  Write-Failure $_
  $script:ExitCode = 1
}
exit $script:ExitCode
