$destDir = "d:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel"
$output = Join-Path $destDir "CircleDFlow_Full_90s_AgentCut.mp4"
$audio = Join-Path $destDir "Rui_Session_Master_Audio.mp3"

# Source Clips
$c0 = Join-Path $destDir "00_Morning_Garden.mp4"
$c1 = Join-Path $destDir "01_Start_Rui.mp4"
$c2 = Join-Path $destDir "02_Miradouro_Atmosphere.mp4"
$c3 = Join-Path $destDir "03_Miradouro_Jam.mp4"
$c5 = Join-Path $destDir "05_Jam_Climax.mp4"

Write-Host "Production Phase: Generating 90-second Full Agent Cut..."

# We generate 3 main segments and then concatenate them
$seg1 = Join-Path $destDir "seg1.mp4"
$seg2 = Join-Path $destDir "seg2.mp4"
$seg3 = Join-Path $destDir "seg3.mp4"

# Segment 1: Garden vs Jam (20s)
ffmpeg -i $c0 -i $c3 -filter_complex `
"[0:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080[l]; `
 [1:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080[r]; `
 [l][r]hstack[v]" -map "[v]" -t 20 -y $seg1

# Segment 2: Walking vs Jam (20s)
ffmpeg -i $c1 -i $c3 -filter_complex `
"[0:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080[l]; `
 [1:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080[r]; `
 [l][r]hstack[v]" -map "[v]" -t 20 -y $seg2

# Segment 3: Atmosphere vs Climax (50s)
ffmpeg -i $c2 -i $c5 -filter_complex `
"[0:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080[l]; `
 [1:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080[r]; `
 [l][r]hstack[v]" -map "[v]" -t 50 -y $seg3

# Final Concatenation with Master Audio
$listFile = Join-Path $destDir "concat_list.txt"
"file 'seg1.mp4'`nfile 'seg2.mp4'`nfile 'seg3.mp4'" | Out-File $listFile -Encoding ascii

ffmpeg -f concat -safe 0 -i $listFile -i $audio -c:v libx264 -crf 18 -preset fast -map 0:v -map 1:a -shortest -y $output

# Cleanup segments
Remove-Item $seg1, $seg2, $seg3, $listFile

Write-Host "Full 90s Agent Cut Ready: $output"
