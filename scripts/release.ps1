$manifest = Invoke-WebRequest 'https://dev.azure.com/graytoowolf/b31f3ddc-31f9-44b4-a216-f4a129ef91e7/_apis/git/repositories/e285d1f1-6f31-4b37-9768-5d7d62b1d80f/items?path=%2Fupdate.json' | ConvertFrom-Json
$last = $manifest.latest
$latest=(Get-Content package.json | ConvertFrom-Json).version+'-'+(git rev-parse HEAD).Substring(0,7)

# Install dependencies
composer install --no-dev --prefer-dist --no-suggest --no-progress
Remove-Item vendor/bin -Recurse -Force
yarn
Write-Host "Dependencies have been installed." -ForegroundColor Green
./scripts/build.ps1

$zip = "blessing-skin-server-$latest.zip"
zip -9 -r $zip app bootstrap config database plugins public resources/lang resources/views resources/misc/textures routes storage vendor .env.example artisan LICENSE README.md README_EN.md index.html
Write-Host "Zip archive is created." -ForegroundColor Green



New-Item dist -ItemType Directory
Set-Location dist
Copy-Item -Path "../$zip" -Destination $zip

$manifest.latest = $latest
$manifest.url = $manifest.url.Replace($last, $latest)
$manifest.php = '7.4.0'
ConvertTo-Json $manifest | Out-File -FilePath update.json
Write-Host "Update source is prepared." -ForegroundColor Green

$azureToken = $env:AZURE_TOKEN
git config --global user.email 'graytoowolf'
git config --global user.name 'graywolf'
git init
git add .
git commit -m "Publish"
git push -f "https://anything:$azureToken@dev.azure.com/graytoowolf/xz/_git/xz" master
Write-Host "Update source is pushed to Azure Repos." -ForegroundColor Green
