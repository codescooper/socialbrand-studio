param(
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$stateDirectory = Join-Path $env:LOCALAPPDATA "AWEMA\SocialBrandStudio"
$pidFile = Join-Path $stateDirectory "local-server.pid"
$stdoutLog = Join-Path $stateDirectory "local-server.out.log"
$stderrLog = Join-Path $stateDirectory "local-server.err.log"
$url = "http://127.0.0.1:1420/"

New-Item -ItemType Directory -Force -Path $stateDirectory | Out-Null

if (Test-Path $pidFile) {
  $savedPid = (Get-Content $pidFile -Raw).Trim()
  if ($savedPid -match '^\d+$' -and (Get-Process -Id ([int]$savedPid) -ErrorAction SilentlyContinue)) {
    Write-Host "SocialBrand Studio est déjà lancé sur $url (PID $savedPid)."
    if (-not $NoBrowser) { Start-Process $url }
    exit 0
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

$existingListener = Get-NetTCPConnection -LocalPort 1420 -State Listen -ErrorAction SilentlyContinue
if ($existingListener) {
  throw "Le port 1420 est déjà utilisé par le processus $($existingListener.OwningProcess)."
}

$node = Join-Path $env:ProgramFiles "nodejs\node.exe"
$vite = Join-Path $root "node_modules\vite\bin\vite.js"
if (-not (Test-Path $node)) { throw "Node.js est introuvable. Installez Node.js 22 puis réessayez." }
if (-not (Test-Path $vite)) { throw "Les dépendances sont absentes. Exécutez npm ci puis réessayez." }

$server = Start-Process `
  -FilePath $node `
  -ArgumentList @($vite, "--host", "127.0.0.1", "--port", "1420", "--strictPort") `
  -WorkingDirectory $root `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog `
  -PassThru

Set-Content -Path $pidFile -Value $server.Id -Encoding ascii

$ready = $false
for ($attempt = 0; $attempt -lt 20; $attempt++) {
  Start-Sleep -Milliseconds 250
  if (Get-NetTCPConnection -LocalPort 1420 -State Listen -ErrorAction SilentlyContinue) {
    $ready = $true
    break
  }
  if ($server.HasExited) { break }
}

if (-not $ready) {
  if (-not $server.HasExited) { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
  $details = if (Test-Path $stderrLog) { (Get-Content $stderrLog -Raw).Trim() } else { "Aucun journal disponible." }
  throw "Le serveur n'a pas démarré. $details"
}

Write-Host "SocialBrand Studio reste actif indépendamment du terminal : $url"
Write-Host "PID : $($server.Id)"
Write-Host "Arrêt : npm run local:stop"
if (-not $NoBrowser) { Start-Process $url }
