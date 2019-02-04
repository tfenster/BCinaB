function Start-BCinaB {
    param
    (
        [switch]
        $Debug,
        [switch]
        $WhatIf
    )
    
    $pre_ErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"

    $pipe_windows = $true
    try {
        $ps = (docker -H npipe:////./pipe/docker_engine_windows ps) | Out-Null
        if ($LASTEXITCODE -ne 0) {
            $pipe_windows = $false
        }
    } catch{
        $pipe_windows = $false
    }

    if (-not $pipe_windows) {
        $pipe_non_windows = $true
        try {
            $ps = (docker -H npipe:////./pipe/docker_engine ps) | Out-Null
            if ($LASTEXITCODE -ne 0) {
                $pipe_non_windows = $false
            }
        } catch{
            $pipe_non_windows = $false
        }
    }
    
    if (-not $pipe_windows -and -not $pipe_non_windows) {
        Write-Host "Unable to reach the Docker engine. Are your sure Docker is running and reachable?"
        return
    }
    
    if ($pipe_non_windows) {
        $DockerEnterpriseEdition = $true
    }

    $ErrorActionPreference = $pre_ErrorActionPreference

    if (-not (Test-Path -Path "c:\programdata\bcinab" -PathType Container)) {
        Write-Host "I will create folder c:\programdata\bcinab and store data there. Please leave that folder in place while you use BCinaB."
        New-Item -Path "c:\programdata\bcinab" -ItemType Directory
        DownloadCurrentCompose
    }
    
    if (-not (Test-Path -Path "c:\programdata\bcinab\licenses" -PathType Container)) {
        New-Item -Path "c:\programdata\bcinab\licenses" -ItemType Directory
    }

    $command = "docker-compose -p bcinab -f c:\programdata\bcinab\docker-compose.yml";
    if ($DockerEnterpriseEdition) {
        $command = $command + " -f c:\programdata\bcinab\docker-compose.ee.yml"
    }
    if (Test-Path -Path "c:\programdata\navcontainerhelper" -PathType Container) {
        $command = $command + " -f c:\programdata\bcinab\docker-compose.navcontainerhelper.yml"
    }
    
    $command = $command + " up"
    if ($Debug -or $Whatif) {
        Write-Host "command: $command"
    }
    if (-not $Whatif) {
        invoke-expression $command
    }
}

function Update-BCinaB {
    Stop-BCinaB
    DownloadCurrentCompose
    Start-BCinaB
}

function Stop-BCinaB {
    param
    (
        [switch]
        $Debug
    )
    $command = "docker-compose -f c:\programdata\bcinab\docker-compose.yml down"
    if ($Debug) {
        Write-Host "running: <$command>"
    }
    invoke-expression $command

}

function DownloadCurrentCompose {

    Write-Host "Downloading current definitions from github.com/tfenster/BCinaB"
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/tfenster/BCinaB/master/stuff/docker-compose.yml" -UseBasicParsing -OutFile "c:\programdata\bcinab\docker-compose.yml"
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/tfenster/BCinaB/master/stuff/docker-compose.ee.yml" -UseBasicParsing -OutFile "c:\programdata\bcinab\docker-compose.ee.yml"
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/tfenster/BCinaB/master/stuff/docker-compose.navcontainerhelper.yml" -UseBasicParsing -OutFile "c:\programdata\bcinab\docker-compose.navcontainerhelper.yml"
}

Export-ModuleMember -Function Start-BCinaB
Export-ModuleMember -Function Update-BCinaB
Export-ModuleMember -Function Stop-BCinaB
