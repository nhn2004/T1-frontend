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

    # Zustand empaqueta su middleware `devtools` en el mismo archivo que `persist` (el
    # único que usamos) — ese código trae `import.meta.env`, sintaxis pensada para
    # bundlers tipo Vite. Metro (el bundler de Expo) no la transforma, así que queda
    # literal en el bundle exportado; el navegador la rechaza como error de sintaxis al
    # cargar el <script> normal (no como módulo ES), dejando la página en blanco. Ese
    # código de devtools nunca se ejecuta en esta app (no llamamos a `devtools()`), así
    # que reemplazar el token por un objeto vacío es seguro — solo evita el crash de
    # sintaxis, no cambia ningún comportamiento real.
    Write-Host "Parcheando 'import.meta' en el bundle exportado (bug de Zustand + Metro)..." -ForegroundColor Cyan
    $jsDir = Join-Path $distPath '_expo\static\js'
    if (Test-Path $jsDir) {
        Get-ChildItem -Path $jsDir -Filter '*.js' -Recurse | ForEach-Object {
            (Get-Content $_.FullName -Raw) -replace 'import\.meta', 'self' |
                Set-Content -NoNewline -Encoding utf8 $_.FullName
        }
    }

    # PWA: public/manifest.json y los íconos ya se copiaron solos a dist/ (Expo copia
    # public/ tal cual), pero el <head> del index.html generado no los referencia — hay
    # que inyectar el link al manifest y las meta tags que iOS/Safari exige para
    # permitir "Agregar a inicio" como app standalone (con su propio ícono, sin barra
    # de Safari).
    Write-Host "Agregando meta tags de PWA al index.html..." -ForegroundColor Cyan
    $indexPath = Join-Path $distPath 'index.html'
    $pwaTags = '<link rel="manifest" href="/manifest.json"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="FireHealth"><meta name="theme-color" content="#E85D27"></head>'
    (Get-Content $indexPath -Raw) -replace '</head>', $pwaTags |
        Set-Content -NoNewline -Encoding utf8 $indexPath

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
