$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $root ".server.pid"
$logFile = Join-Path $root ".server.log"

if (Test-Path $pidFile) {
  try {
    $existingPid = Get-Content $pidFile | Select-Object -First 1
    if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) {
      Write-Host "Server is already running at http://localhost:8080"
      exit 0
    }
  } catch {
  }

  Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

$serverScript = @'
$ErrorActionPreference = "Stop"
$root = "__ROOT__"
$pidFile = "__PIDFILE__"
$logFile = "__LOGFILE__"

Add-Type -AssemblyName System.Web

function Get-ContentType {
  param([string] $path)

  switch ([IO.Path]::GetExtension($path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8" }
    ".css" { "text/css; charset=utf-8" }
    ".js" { "application/javascript; charset=utf-8" }
    ".json" { "application/json; charset=utf-8" }
    ".png" { "image/png" }
    ".jpg" { "image/jpeg" }
    ".jpeg" { "image/jpeg" }
    ".svg" { "image/svg+xml" }
    ".ico" { "image/x-icon" }
    default { "application/octet-stream" }
  }
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()

Set-Content -LiteralPath $pidFile -Value $PID -NoNewline
"[$(Get-Date -Format s)] Server started on http://localhost:8080" | Add-Content -LiteralPath $logFile

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $requestPath = [System.Web.HttpUtility]::UrlDecode($context.Request.Url.AbsolutePath)

    if ([string]::IsNullOrWhiteSpace($requestPath) -or $requestPath -eq "/") {
      $requestPath = "/index.html"
    }

    $relativePath = $requestPath.TrimStart("/") -replace "/", "\"
    $fullPath = [IO.Path]::GetFullPath((Join-Path $root $relativePath))

    if (-not $fullPath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
      $context.Response.StatusCode = 403
      $context.Response.Close()
      continue
    }

    if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
      $context.Response.StatusCode = 404
      $buffer = [Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $context.Response.ContentType = "text/plain; charset=utf-8"
      $context.Response.OutputStream.Write($buffer, 0, $buffer.Length)
      $context.Response.Close()
      continue
    }

    $bytes = [IO.File]::ReadAllBytes($fullPath)
    $context.Response.ContentType = Get-ContentType -path $fullPath
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $context.Response.Close()
  }
}
finally {
  $listener.Stop()
  $listener.Close()
  Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
  "[$(Get-Date -Format s)] Server stopped" | Add-Content -LiteralPath $logFile
}
'@

$serverScript = $serverScript.Replace("__ROOT__", $root.Replace("\", "\\"))
$serverScript = $serverScript.Replace("__PIDFILE__", $pidFile.Replace("\", "\\"))
$serverScript = $serverScript.Replace("__LOGFILE__", $logFile.Replace("\", "\\"))

$serverFile = Join-Path $root ".local-server.ps1"
Set-Content -LiteralPath $serverFile -Value $serverScript

$process = Start-Process powershell -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-File", $serverFile
) -WorkingDirectory $root -WindowStyle Hidden -PassThru

Start-Sleep -Milliseconds 800

if (Get-Process -Id $process.Id -ErrorAction SilentlyContinue) {
  Write-Host "Server started at http://localhost:8080"
  Write-Host "Run .\\stop-server.ps1 to stop it."
} else {
  Write-Error "Server failed to start. Check .server.log for details."
}
