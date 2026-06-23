# Check for Administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    Exit
}

# Compile FluxoraService
Write-Host "Compiling FluxoraService.cs..." -ForegroundColor Cyan
& C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /r:System.ServiceProcess.dll /out:c:\Users\rajaj\Projects\Fluxora_SocialMediaBlast\FluxoraService.exe c:\Users\rajaj\Projects\Fluxora_SocialMediaBlast\FluxoraService.cs

# Check if service already exists
$service = Get-Service -Name "FluxoraPlatformService" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "Service already exists. Stopping and removing old service..." -ForegroundColor Yellow
    & sc.exe stop FluxoraPlatformService | Out-Null
    Start-Sleep -Seconds 1
    & sc.exe delete FluxoraPlatformService | Out-Null
    Start-Sleep -Seconds 2
}

# Register the service
Write-Host "Registering FluxoraPlatformService..." -ForegroundColor Green
& sc.exe create FluxoraPlatformService binPath= "c:\Users\rajaj\Projects\Fluxora_SocialMediaBlast\FluxoraService.exe" start= auto DisplayName= "Fluxora Platform Service"

# Set Description
& sc.exe description FluxoraPlatformService "Manages the Docker-based production services for Fluxora Social Media Blast Ecosystem."

# Configure recovery options: restart on first, second and subsequent failures after 1 minute
Write-Host "Configuring crash recovery options..." -ForegroundColor Green
& sc.exe failure FluxoraPlatformService reset= 86400 actions= restart/60000/restart/60000/restart/60000

# Start the service
Write-Host "Starting FluxoraPlatformService..." -ForegroundColor Green
& sc.exe start FluxoraPlatformService

Write-Host "Done! FluxoraPlatformService has been installed and started." -ForegroundColor Green
Start-Sleep -Seconds 5
