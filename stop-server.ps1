$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $root ".server.pid"

if (-not (Test-Path $pidFile)) {
  Write-Host "No running local server found."
  exit 0
}

$serverPid = Get-Content $pidFile | Select-Object -First 1

if ($serverPid) {
  Stop-Process -Id $serverPid -Force -ErrorAction SilentlyContinue
}

Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
Write-Host "Local server stopped."
