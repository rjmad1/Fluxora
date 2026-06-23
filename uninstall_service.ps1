# Check for Administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    Exit
}

Write-Host "Stopping and deleting FluxoraPlatformService..." -ForegroundColor Yellow
& sc.exe stop FluxoraPlatformService | Out-Null
Start-Sleep -Seconds 1
& sc.exe delete FluxoraPlatformService | Out-Null

Write-Host "Service uninstalled successfully." -ForegroundColor Green
Start-Sleep -Seconds 5
