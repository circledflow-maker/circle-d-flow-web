$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "Listening on http://localhost:8080/"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = "d:\circle-d-flow-web" + $request.Url.LocalPath.Replace("/", "\")
        if ($localPath -eq "d:\circle-d-flow-web\") { $localPath = "d:\circle-d-flow-web\Index.html" }
        
        if (Test-Path $localPath -PathType Leaf) {
            if ($localPath.EndsWith(".js")) {
                $response.ContentType = "application/javascript"
            } elseif ($localPath.EndsWith(".html")) {
                $response.ContentType = "text/html"
            } elseif ($localPath.EndsWith(".css")) {
                $response.ContentType = "text/css"
            } elseif ($localPath.EndsWith(".png")) {
                $response.ContentType = "image/png"
            } elseif ($localPath.EndsWith(".jpg") -or $localPath.EndsWith(".jpeg")) {
                $response.ContentType = "image/jpeg"
            }
            $content = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    } catch {
        Write-Host "Error serving request"
    }
}
