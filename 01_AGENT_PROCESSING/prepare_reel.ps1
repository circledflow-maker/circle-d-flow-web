$srcDir = "d:\tag mit rui\105NZ502"
$srcDir2 = "d:\tag mit rui\105NZ502\105NZ502"
$destDir = "d:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel"

# Ensure dest dir exists
if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir }

# Define clips to extract (Path, StartTime, Duration, OutputName)
$clips = @(
    @("$srcDir\DSC_5245.MOV", "00:00:00", "00:00:10", "01_Start_Rui.mp4"),
    @("$srcDir\DSC_5264.MOV", "00:00:05", "00:00:15", "02_Miradouro_Atmosphere.mp4"),
    @("$srcDir\DSC_5273.MOV", "00:00:02", "00:00:15", "03_Miradouro_Jam.mp4"),
    @("$srcDir2\DSC_5289.MOV", "00:00:10", "00:00:20", "04_Evening_Vibe.mp4"),
    @("$srcDir2\DSC_5321.MOV", "00:00:00", "00:00:20", "05_Jam_Climax.mp4"),
    @("$srcDir\DSC_5349.MOV", "00:00:00", "00:00:10", "06_Outro_Rui.mp4")
)

foreach ($c in $clips) {
    $input = $c[0]
    $output = Join-Path $destDir $c[3]
    Write-Host "Processing $output..."
    # Using -c copy for speed and quality retention
    ffmpeg -ss $c[1] -t $c[2] -i $input -c copy -y $output
}

# Extract high quality audio from climax
Write-Host "Extracting Audio..."
$audioSrc = "$srcDir2\DSC_5321.MOV"
$audioDest = Join-Path $destDir "Rui_Session_Master_Audio.mp3"
ffmpeg -i $audioSrc -vn -acodec libmp3lame -ab 192k -y $audioDest

Write-Host "Preparation Complete!"
