# Destiny Hostel - DSC_0324: artist-change cuts + Social 16:9 + 9:16
# Circle D Stages. Saves under D:\Wakungo_Content_Studio\Destiny Hostel\31July\002
param(
  [string]$Source = "F:\DCIM\106NZ502\DSC_0324.MOV",
  [string]$OutRoot = "D:\Wakungo_Content_Studio\Destiny Hostel\31July\002",
  [double]$MinSetSeconds = 45,
  [double]$SilenceDb = -38,
  [double]$SilenceDur = 2.5,
  [int]$ArtistStartIndex = 1
)

$ErrorActionPreference = "Continue"
$stem = [IO.Path]::GetFileNameWithoutExtension($Source)

# ONENESS roster (flyer + IG profiles) - sequential cut order until visually confirmed
$script:LineupOrder = @(
  'Wako_Kungo',
  'Nicke_Klein',
  'Mistah_Isaac',
  'Arpanito',
  'Elisa',
  'C-Riz',
  'Willpower',
  'Chris_Inacio',
  'July_Tilie',
  'Basseck_Mankabu',
  'Joao_Redondo',
  'Edoardo_Statuto',
  'Kreativlon',
  'Lobsthercraft_Sere'
)
$script:LineupMeta = @{
  'Wako_Kungo'         = 'Full band set. Tags: @wako.kungo @nickeklein @_edoardostatuto_ @mistah_isaac @joaoredondomaia @arpan.k_'
  'Nicke_Klein'        = 'Nicke Klein - vox @nickeklein'
  'Mistah_Isaac'       = 'Isaac Ignite / Mistah Isaac - guitar, @wako.kungo founder @mistah_isaac'
  'Arpanito'           = 'Arpan Khurana (Arpanito) - vox @arpan.k_ @arpanito'
  'Elisa'              = 'Elisa - vox @elisa.cas8'
  'C-Riz'              = 'C-Riz - rap @c_riz.official'
  'Willpower'          = 'WILLPOWER - BodyX @bodyxwillpower'
  'Chris_Inacio'       = 'Chris To Inacio - painter @1chriscreator chrisinacio.com'
  'July_Tilie'         = 'July Tilie @julytilie'
  'Basseck_Mankabu'    = 'Basseck Mankabu @basseck.mankabu'
  'Joao_Redondo'       = 'Joao Redondo Maia - drums @joaoredondomaia'
  'Edoardo_Statuto'    = 'Edoardo Statuto - guitar @_edoardostatuto_'
  'Kreativlon'         = 'Sarah Berger / Kreativlon - epoxy @kreativlon.art'
  'Lobsthercraft_Sere' = 'Sere / Lobsthercraft @lobsthercraft'
}

$stages = Join-Path $OutRoot "05_Format_Drafts\Circle_D_Stages"
$stagesFull = Join-Path $stages "00_full_takes"
$stagesCuts = Join-Path $stages "01_artist_cuts"
$stagesArtists = Join-Path $stages "02_Artists"
$social169 = Join-Path $stages "04_Social_16x9"
$social916 = Join-Path $stages "05_Social_9x16"
$driveStages = Join-Path $OutRoot "06_drive_ready\Circle_D_Stages"
$driveArtists = Join-Path $driveStages "Artists"
$drive169 = Join-Path $driveStages "Social_16x9"
$drive916 = Join-Path $driveStages "Social_9x16"
$logs = Join-Path $OutRoot "00_logs"

@($stagesFull,$stagesCuts,$stagesArtists,$social169,$social916,$driveArtists,$drive169,$drive916,$logs) | ForEach-Object {
  if (!(Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
}

$logFile = Join-Path $logs ("dsc0324_social_{0:yyyyMMdd_HHmmss}.log" -f (Get-Date))
function Write-Log([string]$msg) {
  $line = "[{0:HH:mm:ss}] {1}" -f (Get-Date), $msg
  Write-Host $line
  Add-Content -Path $logFile -Value $line
}

function Get-Dur([string]$path) {
  try {
    $r = & ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $path 2>$null
    if ([string]::IsNullOrWhiteSpace($r)) { return 0 }
    return [double]$r
  } catch { return 0 }
}

function Test-Ok([string]$path, [double]$exp) {
  if (-not (Test-Path $path)) { return $false }
  if ((Get-Item $path).Length -lt 500KB) { return $false }
  $d = Get-Dur $path
  if ($d -le 0) { return $false }
  if ($exp -gt 2 -and $d -lt ($exp * 0.88)) { return $false }
  return $true
}

function Run-FF([string[]]$a) {
  & ffmpeg @a
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg exit $LASTEXITCODE" }
}

function Get-ArtistCutPoints([string]$path, [double]$dur) {
  $ends = @()
  Write-Log "  silence/applause scan for artist changes..."
  $raw = & ffmpeg -hide_banner -hwaccel d3d11va -i $path -af "silencedetect=noise=${SilenceDb}dB:d=$SilenceDur" -f null - 2>&1
  foreach ($line in $raw) {
    if ("$line" -match 'silence_end:\s*([0-9.]+)') {
      $t = [double]$Matches[1]
      if ($t -gt 20 -and $t -lt ($dur - 20)) { $ends += $t }
    }
  }
  $merged = @()
  foreach ($t in ($ends | Sort-Object)) {
    if ($merged.Count -eq 0 -or ($t - $merged[-1]) -ge 45) { $merged += $t }
  }
  return ,$merged
}

function Get-LineupName([int]$num) {
  $idx = $num - 1
  if ($idx -ge 0 -and $idx -lt $script:LineupOrder.Count) { return $script:LineupOrder[$idx] }
  return ("Guest_{0:D2}" -f $num)
}

function New-ArtistFolder([int]$num) {
  $slug = Get-LineupName $num
  $name = "{0:D2}_{1}" -f $num, $slug
  $dir = Join-Path $stagesArtists $name
  $driveDir = Join-Path $driveArtists $name
  New-Item -ItemType Directory -Path $dir,$driveDir -Force | Out-Null
  $note = Join-Path $dir "ARTIST_INFO.txt"
  $meta = if ($script:LineupMeta.ContainsKey($slug)) { $script:LineupMeta[$slug] } else { 'Guest / confirm name from ONENESS flyer' }
  $body = @"
Event: Wako Kungo presents ONENESS - 31 July - Destination Hostels
Folder: $name
Source clip: $stem
$meta

Band tags: @nickeklein @_edoardostatuto_ @mistah_isaac @joaoredondomaia @arpan.k_
If this set is the wrong person, rename the folder to the correct artist.
"@
  Set-Content $note $body -Encoding UTF8
  return @{ Name = $name; Slug = $slug; Dir = $dir; Drive = $driveDir }
}

function Copy-Safe([string]$src, [string]$dest) {
  if (-not (Test-Path $src)) { return }
  if ([IO.Path]::GetFullPath($src) -eq [IO.Path]::GetFullPath($dest)) { return }
  try {
    $parent = Split-Path $dest -Parent
    if (!(Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    Copy-Item -LiteralPath $src -Destination $dest -Force
  } catch {
    Write-Log ("  copy WARN: {0}" -f $_.Exception.Message)
  }
}

# Stages grade + music audio (lighter for long encodes)
$grade = "eq=contrast=1.07:brightness=0.015:saturation=0.98:gamma=1.03"
$afMusic = "highpass=f=55,afftdn=nf=-22:nt=w:tn=1:om=o,equalizer=f=80:t=q:w=1:g=1.2,equalizer=f=2800:t=q:w=1:g=0.6,acompressor=threshold=-18dB:ratio=2:attack=20:release=240:makeup=2,alimiter=limit=0.96,loudnorm=I=-14:TP=-1.5:LRA=10"

function Export-16x9([string]$src, [double]$start, [double]$len, [string]$outPath) {
  if (Test-Ok $outPath $len) {
    Write-Log ("  skip 16x9: {0}" -f (Split-Path $outPath -Leaf))
    return
  }
  $fadeOut = [math]::Max(0, $len - 1.0)
  $ss = $start.ToString([Globalization.CultureInfo]::InvariantCulture)
  $tt = $len.ToString([Globalization.CultureInfo]::InvariantCulture)
  $fo = $fadeOut.ToString([Globalization.CultureInfo]::InvariantCulture)
  # Compress Stages 16:9 @ 1080p CRF19 (share-ready, not archive giant)
  $vf = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,$grade,fade=t=in:st=0:d=0.35,fade=t=out:st=${fo}:d=0.9,format=yuv420p"
  $preset = if ($len -ge 120) { "ultrafast" } else { "veryfast" }
  Write-Log ("  compress 16x9 {0:N0}s -> {1}" -f $len, (Split-Path $outPath -Leaf))
  Run-FF @(
    "-y","-hide_banner","-loglevel","error","-stats",
    "-hwaccel","d3d11va",
    "-fflags","+genpts+discardcorrupt","-err_detect","ignore_err","-max_error_rate","1.0",
    "-ss",$ss,
    "-i",$src,
    "-t",$tt,
    "-vf",$vf,
    "-af",$afMusic,
    "-c:v","libx264","-preset",$preset,"-crf","19","-pix_fmt","yuv420p",
    "-c:a","aac","-b:a","192k","-ar","48000",
    "-movflags","+faststart",
    $outPath
  )
}

function Export-9x16-FromMaster([string]$src169, [double]$len, [string]$outPath) {
  # Derive vertical from already-compressed 16:9 (fast; no second HEVC SD pass)
  if (Test-Ok $outPath $len) {
    Write-Log ("  skip 9x16: {0}" -f (Split-Path $outPath -Leaf))
    return
  }
  Write-Log ("  social 9x16 from master -> {0}" -f (Split-Path $outPath -Leaf))
  Run-FF @(
    "-y","-hide_banner","-loglevel","error","-stats",
    "-hwaccel","d3d11va",
    "-i",$src169,
    "-vf","scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p",
    "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",
    "-c:a","aac","-b:a","192k","-ar","48000",
    "-movflags","+faststart",
    $outPath
  )
}

# --- main ---
Write-Log "DSC_0324 Artist Social | Source=$Source"
if (-not (Test-Path $Source)) { throw "Missing source: $Source - keep SD F: connected" }

$dur = Get-Dur $Source
if ($dur -le 0) { throw "Could not read duration for $Source" }
Write-Log ("Duration: {0:N0}s ({1:N1} min)" -f $dur, ($dur / 60))

$cuts = @(Get-ArtistCutPoints $Source $dur)
Write-Log ("Cut points: {0}" -f ($(if ($cuts.Count) { ($cuts | ForEach-Object { [math]::Round($_,1) }) -join ', ' } else { '(none - single set)' })))

$bounds = @([double]0) + $cuts + @($dur)
$artistIndex = $ArtistStartIndex - 1
$segNum = 0
$made = 0

for ($i = 0; $i -lt ($bounds.Count - 1); $i++) {
  $start = $bounds[$i]
  $end = $bounds[$i + 1]
  $len = $end - $start
  if ($len -lt $MinSetSeconds) {
    Write-Log ("  skip tiny {0:N1}s" -f $len)
    continue
  }
  $segNum++
  $artistIndex++
  $artist = New-ArtistFolder $artistIndex
  Write-Log ("--- {0}: {1:N0}s-{2:N0}s ({3:N0}s) ---" -f $artist.Name, $start, $end, $len)

  $base = "performance_{0}_from_{1}_set{2:D2}" -f $artist.Name, $stem, $segNum
  $out169 = Join-Path $artist.Dir ("{0}_16x9.mp4" -f $base)
  $out916 = Join-Path $artist.Dir ("{0}_9x16.mp4" -f $base)

  try {
    Export-16x9 $Source $start $len $out169
    Export-9x16-FromMaster $out169 $len $out916

    # Flat overview + social folders + Drive
    $flat169 = "Stages_{0:D2}_{1}_set{2:D2}_16x9.mp4" -f $artistIndex, $stem, $segNum
    $flat916 = "Stages_{0:D2}_{1}_set{2:D2}_9x16.mp4" -f $artistIndex, $stem, $segNum
    Copy-Safe $out169 (Join-Path $stagesCuts $flat169)
    Copy-Safe $out916 (Join-Path $stagesCuts $flat916)
    Copy-Safe $out169 (Join-Path $social169 $flat169)
    Copy-Safe $out916 (Join-Path $social916 $flat916)
    Copy-Safe $out169 (Join-Path $artist.Drive ("{0}_16x9.mp4" -f $base))
    Copy-Safe $out916 (Join-Path $artist.Drive ("{0}_9x16.mp4" -f $base))
    Copy-Safe $out169 (Join-Path $drive169 $flat169)
    Copy-Safe $out916 (Join-Path $drive916 $flat916)
    $made++
  } catch {
    Write-Log ("  WARN: {0}" -f $_.Exception.Message)
  }
}

# Fallback: whole take as one artist if no sets
if ($made -eq 0) {
  $artistIndex++
  $artist = New-ArtistFolder $artistIndex
  Write-Log ("Fallback single artist {0} full {1:N0}s" -f $artist.Name, $dur)
  $base = "performance_{0}_from_{1}_full" -f $artist.Name, $stem
  $out169 = Join-Path $artist.Dir ("{0}_16x9.mp4" -f $base)
  $out916 = Join-Path $artist.Dir ("{0}_9x16.mp4" -f $base)
  Export-16x9 $Source 0 $dur $out169
  Export-9x16-FromMaster $out169 $dur $out916
  Copy-Safe $out169 (Join-Path $artist.Drive ("{0}_16x9.mp4" -f $base))
  Copy-Safe $out916 (Join-Path $artist.Drive ("{0}_9x16.mp4" -f $base))
  Copy-Safe $out169 (Join-Path $drive169 ("{0}_16x9.mp4" -f $base))
  Copy-Safe $out916 (Join-Path $drive916 ("{0}_9x16.mp4" -f $base))
  $made = 1
}

$readme = @"
# DSC_0324 - Circle D Stages (Artist cuts + Social)

Source: $Source
Processed: $(Get-Date -Format 'yyyy-MM-dd HH:mm')

## Output
- ``05_Format_Drafts/Circle_D_Stages/02_Artists/Artist_XX/`` - 16x9 + 9x16 per set
- ``05_Format_Drafts/Circle_D_Stages/04_Social_16x9/``
- ``05_Format_Drafts/Circle_D_Stages/05_Social_9x16/``
- ``06_drive_ready/Circle_D_Stages/{Artists,Social_16x9,Social_9x16}/``

Rename Artist_XX when names known.
"@
Set-Content (Join-Path $OutRoot "README_DSC_0324_SOCIAL.md") -Value $readme -Encoding UTF8
Write-Log ("DONE. artist_sets=$made")
New-Item -ItemType File -Path (Join-Path $logs "DSC0324_SOCIAL_COMPLETE.flag") -Force | Out-Null
Set-Content (Join-Path $logs "AGENT_LOOP_WAKE_dsc0324.txt") ("READY $(Get-Date -Format o)`nsets=$made")
