param(
  [string]$Source = "D:\D Circle on tour\week27\DCIM\105NZ502\Wakungo",
  [string]$OutRoot = "D:\Wakungo_Content_Studio\week27_wakungo"
)

$ErrorActionPreference = "Stop"

$photoOut = Join-Path $OutRoot "02_photo_enhanced"
$videoOut = Join-Path $OutRoot "03_video_enhanced"
$artistOut = Join-Path $OutRoot "04_artist_clips"
$ytOut = Join-Path $OutRoot "05_youtube_master"
$exportOut = Join-Path $OutRoot "06_exports"

@($photoOut, $videoOut, $artistOut, $ytOut, $exportOut) | ForEach-Object {
  if (!(Test-Path $_)) { New-Item -ItemType Directory -Path $_ | Out-Null }
}

function Run-FFMpeg([string[]]$FfmpegArgs) {
  & ffmpeg @FfmpegArgs
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed: $($FfmpegArgs -join ' ')" }
}

function Find-SourceVideo([string]$Pattern) {
  $mov = Get-ChildItem -Path $Source -Filter *.MOV -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "*$Pattern*" } | Sort-Object Length -Descending | Select-Object -First 1
  if ($mov) { return $mov }
  return Get-ChildItem -Path $Source -Filter *.mp4 -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "*$Pattern*" } | Sort-Object Length -Descending | Select-Object -First 1
}

Write-Host "1) Enhancing JPG photos..."
Get-ChildItem -Path $Source -Filter *.JPG | ForEach-Object {
  $out = Join-Path $photoOut "$($_.BaseName)_enhanced.jpg"
  Run-FFMpeg @(
    "-y","-hide_banner","-loglevel","error",
    "-i",$_.FullName,
    "-vf","hqdn3d=3:2:6:4,eq=contrast=1.08:brightness=0.015:saturation=1.12:gamma=1.03,unsharp=5:5:0.8:5:5:0.0",
    "-q:v","2",
    $out
  )
}

Write-Host "2) Enhancing master videos (named artists first)..."
$artistRules = @(
  @{ key = "Mr_Isaac";      pattern = "*Mr Isaac*";           title = "Mr Isaac" },
  @{ key = "Caiou";         pattern = "*Caiou*";              title = "Caiou" },
  @{ key = "Caiu";          pattern = "Caiu.MOV";             title = "Caiu" },
  @{ key = "OGFlow";        pattern = "*OGFlow*";             title = "OGFlow" },
  @{ key = "OG";            pattern = "OG.MOV";               title = "OG Session" },
  @{ key = "Drums_Ferreira";pattern = "*Drums*";              title = "Ferreira Drums" },
  @{ key = "Solos";         pattern = "Solos.MOV";            title = "Solos" },
  @{ key = "Ending";        pattern = "Ending.MOV";           title = "Wakungo Finale" },
  @{ key = "Groove";        pattern = "*groove*";             title = "The Groove" },
  @{ key = "Do_it_good";    pattern = "Do it good.MOV";       title = "Do It Good" },
  @{ key = "SaburaGroove";  pattern = "*Sabura*";             title = "Sabura Groove" },
  @{ key = "Short_entry";   pattern = "Short entry.MOV";      title = "Short Entry" }
)

$processed = @{}
foreach ($rule in $artistRules) {
  $src = Get-ChildItem -Path $Source -Include *.MOV,*.mp4 -Recurse:$false |
    Where-Object { $_.Name -like $rule.pattern } | Sort-Object Length -Descending | Select-Object -First 1
  if (-not $src) { continue }
  if ($processed.ContainsKey($src.FullName)) { continue }
  $processed[$src.FullName] = $true

  $out = Join-Path $videoOut "$($rule.key)_enhanced.mp4"
  Run-FFMpeg @(
    "-y","-hide_banner","-loglevel","error",
    "-i",$src.FullName,
    "-vf","hqdn3d=2.8:2.2:4.5:3.5,eq=contrast=1.07:brightness=0.02:saturation=1.10:gamma=1.02,unsharp=5:5:0.7:5:5:0.0",
    "-af","highpass=f=120,lowpass=f=12000,acompressor=threshold=-16dB:ratio=3:attack=20:release=250",
    "-c:v","libx264","-preset","slow","-crf","18","-pix_fmt","yuv420p",
    "-c:a","aac","-b:a","192k",
    "-movflags","+faststart",
    $out
  )
}

Write-Host "3) Building artist short clips..."
$clipListPath = Join-Path $ytOut "youtube_concat_list.txt"
if (Test-Path $clipListPath) { Remove-Item $clipListPath -Force }

foreach ($rule in $artistRules) {
  $src = Get-ChildItem -Path $videoOut -Filter "$($rule.key)_enhanced.mp4" | Select-Object -First 1
  if (-not $src) { continue }

  $artistDir = Join-Path $artistOut $rule.key
  if (!(Test-Path $artistDir)) { New-Item -ItemType Directory -Path $artistDir | Out-Null }

  $clip = Join-Path $artistDir ($rule.key + "_short.mp4")
  $title = $rule.title -replace "'", ""
  Run-FFMpeg @(
    "-y","-hide_banner","-loglevel","error",
    "-ss","00:00:06","-t","24",
    "-i",$src.FullName,
    "-vf","crop='if(gte(iw/ih,9/16),ih*9/16,iw)':'if(gte(iw/ih,9/16),ih,iw*16/9)',scale=1080:1920:flags=lanczos,fade=t=in:st=0:d=0.8,fade=t=out:st=22:d=1.2,drawbox=x=0:y=h-150:w=iw:h=150:color=black@0.42:t=fill,drawtext=text='$title':x=40:y=h-95:fontcolor=white:fontsize=48:box=0",
    "-c:v","libx264","-preset","slow","-crf","20","-pix_fmt","yuv420p",
    "-c:a","aac","-b:a","160k",
    "-movflags","+faststart",
    $clip
  )
  Add-Content -Path $clipListPath -Value ("file '" + ($clip -replace "\\","/") + "'")
}

Write-Host "4) Building YouTube master..."
$ytMaster = Join-Path $exportOut "wakungo_youtube_master.mp4"
if (Test-Path $clipListPath) {
  Run-FFMpeg @(
    "-y","-hide_banner","-loglevel","error",
    "-f","concat","-safe","0","-i",$clipListPath,
    "-vf","scale=1920:1080:flags=lanczos,format=yuv420p",
    "-c:v","libx264","-preset","slow","-crf","18",
    "-c:a","aac","-b:a","192k",
    "-movflags","+faststart",
    $ytMaster
  )
}

Write-Host "Done."
Write-Host " - Photos: $photoOut"
Write-Host " - Videos: $videoOut"
Write-Host " - Artist clips: $artistOut"
Write-Host " - YouTube: $ytMaster"
