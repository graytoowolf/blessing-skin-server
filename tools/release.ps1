$manifest = Invoke-WebRequest 'http://bs.mcpifu.top/update.json' | ConvertFrom-Json
$last = $manifest.latest
$version = (Get-Content package.json | ConvertFrom-Json).version
$latest = $version + '-' + (Get-Date -Format 'yyyyMMdd')

(Get-Content -Path ./config/app.php) | ForEach-Object {$_ -Replace $version,$latest} | Set-Content -Path ./config/app.php

# Install dependencies
composer install --no-dev --prefer-dist --no-progress
Remove-Item vendor/bin -Recurse -Force
yarn
Write-Host "Dependencies have been installed." -ForegroundColor Green
./tools/build.ps1

$zip = "blessing-skin-server-$latest.zip"
zip -9 -r $zip app bootstrap config database plugins public resources/lang resources/views resources/misc/textures routes storage vendor .env.example artisan LICENSE README.md README-zh.md index.html
Write-Host "Zip archive is created." -ForegroundColor Green



New-Item dist -ItemType Directory
Set-Location dist
Copy-Item -Path "../$zip" -Destination $zip

$manifest.latest = $latest
$manifest.url = $manifest.url.Replace($last, $latest)
$manifest.php = '7.4.0'
ConvertTo-Json $manifest | Out-File -FilePath update.json
Write-Host "Update source is prepared." -ForegroundColor Green