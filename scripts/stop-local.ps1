$ErrorActionPreference = "Stop"
$stateDirectory = Join-Path $env:LOCALAPPDATA "AWEMA\SocialBrandStudio"
$pidFile = Join-Path $stateDirectory "local-server.pid"

if (-not (Test-Path $pidFile)) {
  Write-Host "Aucun serveur local SocialBrand Studio n'est enregistré."
  exit 0
}

$savedPid = (Get-Content $pidFile -Raw).Trim()
if ($savedPid -match '^\d+$') {
  $server = Get-Process -Id ([int]$savedPid) -ErrorAction SilentlyContinue
  if ($server) {
    Stop-Process -Id $server.Id -Force
    Write-Host "Serveur local SocialBrand Studio arrêté (PID $savedPid)."
  }
}

Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
