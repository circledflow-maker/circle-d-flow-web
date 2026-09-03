# Circle D Stages ONENESS — end credits 16x9 + 9x16 (corrected names + roles)
$ErrorActionPreference = 'Continue'
$OutRoot = 'D:\Wakungo_Content_Studio\Destiny Hostel\31July\003'
$creditsDir = Join-Path $OutRoot '04_videos_compressed\Credits'
$work = Join-Path $OutRoot '00_work\Credits'
$logs = Join-Path $OutRoot '00_logs'
$artistsRoot = Join-Path $OutRoot '04_videos_compressed\Artists'
$draftsRoot = Join-Path $OutRoot '05_Format_Drafts\Circle_D_Stages\02_Artists'
$driveRoot = Join-Path $OutRoot '06_drive_ready\Circle_D_Stages\Artists'

New-Item -ItemType Directory -Force -Path $creditsDir, $work, $logs | Out-Null

function Write-Log($m) {
  $line = "$(Get-Date -Format 'HH:mm:ss') $m"
  Write-Host $line
  Add-Content (Join-Path $logs 'credits_build.log') $line
}

function Esc([string]$s) {
  return ($s -replace '\\', '\\\\' -replace ':', '\:' -replace "'", '')
}

function New-CardClip {
  param([int]$W, [int]$H, [double]$Dur, [string]$OutFile, [string[]]$Lines, [int]$BaseSize)
  $y0 = [int]($H * 0.14)
  $gap = [int]($BaseSize * 1.42)
  $parts = @()
  for ($i = 0; $i -lt $Lines.Count; $i++) {
    $line = $Lines[$i]
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $isGold = $line.StartsWith('GOLD:')
    $isMuted = $line.StartsWith('MUTE:')
    $isTitle = $line.StartsWith('TITLE:')
    $text = $line -replace '^(GOLD|MUTE|TITLE):', ''
    $color = if ($isGold) { '#E8C547' } elseif ($isMuted) { 'white@0.72' } else { 'white' }
    $size = if ($isTitle) { [int]($BaseSize * 1.28) } elseif ($isGold) { [int]($BaseSize * 1.02) } else { [int]($BaseSize * 0.92) }
    $font = if ($isTitle -or $isGold) { 'C\:/Windows/Fonts/arialbd.ttf' } else { 'C\:/Windows/Fonts/arial.ttf' }
    $y = $y0 + ($i * $gap)
    $parts += "drawtext=fontfile='${font}':text='$(Esc $text)':fontsize=${size}:fontcolor=${color}:x=(w-text_w)/2:y=${y}"
  }
  $fadeOut = [math]::Max(0.1, $Dur - 0.5)
  $vf = ($parts -join ',') + ",fade=t=in:st=0:d=0.35,fade=t=out:st=${fadeOut}:d=0.4,format=yuv420p"
  & ffmpeg -y -hide_banner -loglevel error `
    -f lavfi -i "color=c=0x0A0A0F:s=${W}x${H}:d=${Dur}:r=30000/1001" `
    -f lavfi -i "anullsrc=r=48000:cl=stereo" -t $Dur `
    -vf $vf -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p `
    -c:a aac -ar 48000 -ac 2 -b:a 128k -shortest $OutFile
  if ($LASTEXITCODE -ne 0) { throw "card fail $OutFile" }
}

function New-CreditsPackage {
  param([int]$W, [int]$H, [string]$OutPath, [string]$Tag)
  # force rebuild
  if (Test-Path $OutPath) { Remove-Item $OutPath -Force }
  $dir = Join-Path $work $Tag
  if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $bs = if ($W -ge 1920) { 30 } else { 26 }

  $cards = @(
    @{ d = 4.2; lines = @(
        'TITLE:CIRCLE D STAGES'
        'MUTE:presents'
        'GOLD:ONENESS'
        'MUTE:Sunset Destination Hostel  |  Lisbon'
      ) }
    @{ d = 4.5; lines = @(
        'TITLE:THANK YOU'
        'MUTE:for an unforgettable day of music,'
        'MUTE:community, and shared energy.'
      ) }
    @{ d = 5.0; lines = @(
        'GOLD:HOST & VENUE'
        'Sunset Destination Hostel'
        'MUTE:Cais do Sodre, Lisboa'
        'GOLD:ORGANIZED BY'
        'Wako Kungo'
      ) }
    @{ d = 4.5; lines = @(
        'GOLD:PRODUCTION'
        'Circle D Flow'
        'MUTE:@circle.d.flow'
        'MUTE:Powered by Circle D Flow'
      ) }
    @{ d = 9.5; lines = @(
        'GOLD:PERFORMING ARTISTS'
        'Nicke Klein  |  Vocals  |  @nickeklein'
        'July Tilie  |  Vocals  |  @julytilie'
        'Mr. Isaac  |  Guitar  |  @mistah_isaac'
        'C-Riz  |  Rap  |  @c_riz.official'
        'Basseck  |  Performance  |  @basseck.mankabu'
        'Edoardo  |  Guitar  |  @_edoardostatuto_'
        'Joao  |  Drums  |  @joaoredondomaia'
        'Manu Allegro  |  Performance  |  @manuallegro'
        'Arpanito  |  Rap  |  @arpan.k_'
        'Elisa  |  Vocals  |  @elisa.cas8'
        'Willpower  |  Rap  |  @bodyxwillpower'
      ) }
    @{ d = 6.5; lines = @(
        'GOLD:ART MARKET'
        'Chris Inacio  |  Live Painting  |  @1chriscreator'
        'Kreativlon.Art  |  Creative Creations'
        'MUTE:Ashtrays & more  |  @kreativlon.art'
        'Sere / Lobsthercraft  |  Crochet Fashion'
        'MUTE:@lobsthercraft'
      ) }
    @{ d = 5.5; lines = @(
        'GOLD:BEHIND THE CAMERA'
        'Hope  |  @kyheart.lx'
        'Rayan  |  @_rayan.ztr'
        'GOLD:ON SET SUPPORT'
        'Allan  |  @al_kay99'
      ) }
    @{ d = 5.0; lines = @(
        'MUTE:and everyone who danced, listened,'
        'MUTE:created, and made this night possible.'
        'TITLE:A Circle D Flow Production'
        'MUTE:Category: Circle D Stages'
        'GOLD:ONENESS'
      ) }
  )

  $list = Join-Path $dir 'concat.txt'
  $i = 0
  $linesOut = @()
  foreach ($c in $cards) {
    $i++
    $clip = Join-Path $dir ("card_{0:D2}.mp4" -f $i)
    Write-Log "  $Tag card $i /$($cards.Count)"
    New-CardClip -W $W -H $H -Dur $c.d -OutFile $clip -Lines $c.lines -BaseSize $bs
    $linesOut += "file '$($clip.Replace('\','/'))'"
  }
  $linesOut | Set-Content $list -Encoding ascii
  Write-Log "concat $Tag"
  & ffmpeg -y -hide_banner -loglevel error -f concat -safe 0 -i $list -c:v libx264 -preset veryfast -crf 18 -c:a aac -b:a 128k $OutPath
  if ($LASTEXITCODE -ne 0) { throw "concat fail $Tag" }
  Write-Log ("READY {0} {1:N1} MB / {2:N0}s" -f $Tag, ((Get-Item $OutPath).Length / 1MB), ((& ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $OutPath)))
}

Write-Log 'Rebuilding ONENESS end credits (names + roles)...'
$out169 = Join-Path $creditsDir '99_ONENESS_EndCredits_16x9.mp4'
$out916 = Join-Path $creditsDir '99_ONENESS_EndCredits_9x16.mp4'
New-CreditsPackage -W 1920 -H 1080 -OutPath $out169 -Tag '16x9'
New-CreditsPackage -W 1080 -H 1920 -OutPath $out916 -Tag '9x16'

@"
Circle D Stages - ONENESS End Credits (updated)
Append to the end of each artist Stages cut.

Files:
  99_ONENESS_EndCredits_16x9.mp4
  99_ONENESS_EndCredits_9x16.mp4

Performing: Nicke Klein (Vocals), July (Vocals), Mr. Isaac (Guitar),
C-Riz (Rap), Basseck, Edoardo (Guitar), Joao (Drums), Manu Allegro,
Arpanito (Rap), Elisa (Vocals), Willpower (Rap)

Art Market: Chris Inacio (Live Painting), Kreativlon.Art, Sere/Lobsthercraft

Camera: Hope (@kyheart.lx), Rayan (@_rayan.ztr)
On set: Allan (@al_kay99)
Production: Circle D Flow (@circle.d.flow)
"@ | Set-Content (Join-Path $creditsDir 'CREDITS_INFO.txt') -Encoding UTF8

$slugs = @('Nicke_Klein','July_Tilie','Mistah_Isaac','C-Riz','Finale_Baseck','Basseck_Mankabu','Edoardo_Statuto','Joao_Redondo','Guest_Artist','Manu_Allegro')
$dirs = New-Object System.Collections.Generic.List[string]
foreach ($s in $slugs) {
  foreach ($root in @($artistsRoot, $draftsRoot, $driveRoot)) {
    $d = Join-Path $root $s
    New-Item -ItemType Directory -Force -Path $d | Out-Null
    $dirs.Add($d) | Out-Null
  }
}
if (Test-Path $artistsRoot) {
  Get-ChildItem $artistsRoot -Directory | ForEach-Object { $dirs.Add($_.FullName) | Out-Null }
}
$unique = $dirs | Select-Object -Unique
foreach ($d in $unique) {
  Copy-Item $out169, $out916, (Join-Path $creditsDir 'CREDITS_INFO.txt') $d -Force
}
Write-Log "Distributed to $($unique.Count) folders"
'READY' | Set-Content (Join-Path $logs 'CREDITS_READY.flag')
Write-Log 'DONE'
