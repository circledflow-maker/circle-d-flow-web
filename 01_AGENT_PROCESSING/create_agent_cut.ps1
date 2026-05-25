$destDir = "d:\circle-d-flow-web\01_AGENT_PROCESSING\Rui_Reel"
$output = Join-Path $destDir "CircleDFlow_AgentCut_Splitscreen.mp4"
$audio = Join-Path $destDir "Rui_Session_Master_Audio.mp3"

# Source Clips
$c0 = Join-Path $destDir "00_Morning_Garden.mp4"
$c1 = Join-Path $destDir "01_Start_Rui.mp4"
$c2 = Join-Path $destDir "02_Miradouro_Atmosphere.mp4"
$c3 = Join-Path $destDir "03_Miradouro_Jam.mp4"
$c5 = Join-Path $destDir "05_Jam_Climax.mp4"

Write-Host "Generating Splitscreen Agent Cut..."

# Complex Filter for Segment 1: Garden (Left) vs Jam (Right)
# We crop to 960x1080 for each side
ffmpeg -i $c0 -i $c3 -i $audio -filter_complex `
"[0:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080[left]; `
 [1:v]scale=960:1080:force_original_aspect_ratio=increase,crop=960:1080[right]; `
 [left][right]hstack[v]" `
-map "[v]" -map 2:a -t 00:00:30 -c:v libx264 -crf 21 -preset fast -c:a aac -b:a 192k -y $output

Write-Host "Agent Cut Complete: $output"
