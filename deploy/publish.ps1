<#
.SYNOPSIS
  Genera el build web de producción y (opcional) lo copia a la carpeta que sirve IIS.

.DESCRIPTION
  Corre `npx expo export --platform web`, que automáticamente usa .env.production en
  vez de .env (así que apunta al backend real del servidor, no a localhost). El
  resultado queda en .\dist — listo para copiar tal cual a un sitio de IIS.

.PARAMETER SitePath
  Si se indica, copia el contenido de dist\ directamente ahí (ej. la carpeta física
  del sitio de IIS) en vez de dejarlo solo en .\dist.

.EXAMPLE
  .\deploy\publish.ps1
  .\deploy\publish.ps1 -SitePath 'C:\inetpub\wwwroot\bomberos'
#>
param(
    [string]$SitePath
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot

try {
    Write-Host "Instalando dependencias..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install falló" }

    if (-not (Test-Path (Join-Path $repoRoot '.env.production'))) {
        throw ".env.production no existe. Revisa DEPLOY.md — hace falta antes de publicar."
    }
    $envContent = Get-Content (Join-Path $repoRoot '.env.production') -Raw
    if ($envContent -match 'CAMBIAR-ESTO') {
        Write-Warning ".env.production todavía tiene el placeholder sin editar (CAMBIAR-ESTO). El build va a apuntar a una URL que no existe."
    }

    Write-Host "Generando build web de producción..." -ForegroundColor Cyan
    npx expo export --platform web
    if ($LASTEXITCODE -ne 0) { throw "expo export falló" }

    $distPath = Join-Path $repoRoot 'dist'

    if ($SitePath) {
        Write-Host "Copiando dist\ -> $SitePath" -ForegroundColor Cyan
        New-Item -ItemType Directory -Force -Path $SitePath | Out-Null
        Copy-Item -Path (Join-Path $distPath '*') -Destination $SitePath -Recurse -Force
        Write-Host "Listo. El sitio de IIS en '$SitePath' ya tiene el build nuevo." -ForegroundColor Green
    } else {
        Write-Host "Listo. Build en: $distPath" -ForegroundColor Green
        Write-Host "Cópialo (o vuelve a correr este script con -SitePath) a la carpeta física del sitio de IIS."
    }
} finally {
    Pop-Location
}
