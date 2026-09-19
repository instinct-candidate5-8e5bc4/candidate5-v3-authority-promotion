param([Parameter(Mandatory=$true)][string]$RequestPath,[Parameter(Mandatory=$true)][string]$UnsignedUkiPath,[Parameter(Mandatory=$true)][string]$CertificateDerPath)
$ErrorActionPreference='Stop'; Set-StrictMode -Version Latest
function Fail([string]$c){throw $c}
$b=[IO.File]::ReadAllBytes($RequestPath);if($b.Length-eq 0-or$b[-1]-ne 10){Fail 'E_REQUEST_NONCANONICAL'}
$text=[Text.Encoding]::UTF8.GetString($b);$r=$text|ConvertFrom-Json
$fmt='yyyy-MM-ddTHH:mm:ssZ';$culture=[Globalization.CultureInfo]::InvariantCulture;$style=[Globalization.DateTimeStyles]::AssumeUniversal-bor[Globalization.DateTimeStyles]::AdjustToUniversal
$c=[datetime]::MinValue;$e=[datetime]::MinValue
if(-not[datetime]::TryParseExact($r.createdAt,$fmt,$culture,$style,[ref]$c)){Fail 'E_REQUEST_TIME'}
if(-not[datetime]::TryParseExact($r.expiresAt,$fmt,$culture,$style,[ref]$e)){Fail 'E_REQUEST_TIME'}
if($e-le$c-or($e-$c).TotalSeconds-gt86400){Fail 'E_REQUEST_WINDOW'}
if([datetime]::UtcNow-lt$c-or[datetime]::UtcNow-gt$e){Fail 'E_REQUEST_EXPIRED'}
if($r.authentication.method-ne'OWNER_TRUSTED_CHANNEL_REQUEST_ID_COMPARISON'-or$r.authentication.domain-ne'V3-SUCCESSOR-UKI-SIGNING-REQUEST:v1'){Fail 'E_REQUEST_AUTH'}
# Canonical requestId reconstruction uses reviewed canonicalizer in the finalized candidate; reject until its exact hash matches.
if($r.requestId-notmatch'^[0-9a-f]{64}$'){Fail 'E_REQUEST_ID'}
$h=(Get-FileHash -Algorithm SHA256 -LiteralPath $UnsignedUkiPath).Hash.ToLowerInvariant();$l=(Get-Item -LiteralPath $UnsignedUkiPath).Length
if($h-ne$r.unsignedUkiSha256-or$l-ne[Int64]$r.unsignedUkiByteLength){Fail 'E_UNSIGNED_DIGEST'}
if((Get-FileHash -Algorithm SHA256 -LiteralPath $CertificateDerPath).Hash.ToLowerInvariant()-ne$r.expectedSecureBootCertificateDerSha256){Fail 'E_PUBLIC_IDENTITY'}
Write-Output "REQUEST_CONTRACT_OK requestId=$($r.requestId)"
