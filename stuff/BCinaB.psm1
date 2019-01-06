function Start-BCinaB {
    param
    (
        [switch]
        $DockerEnterpriseEdition,
        [switch]
        $NavContainerHelper,
        [switch]
        $Debug
    )

    if (-not (Test-Path -Path "c:\programdata\bcinab" -PathType Container)) {
        Write-Host "I will create folder c:\programdata\bcinab and store data there. Please leave that folder in place while you use BCinaB."
        New-Item -Path "c:\programdata\bcinab" -ItemType Directory
        DownloadCurrentCompose
    }

    $command = "docker-compose -p bcinab -f c:\programdata\bcinab\docker-compose.yml";
    if ($DockerEnterpriseEdition) {
        $command = $command + " -f c:\programdata\bcinab\docker-compose.ee.yml"
    }
    if ($NavContainerHelper) {
        if (-not (Test-Path -Path "c:\programdata\navcontainerhelper" -PathType Container)) {
            Write-Host "Doesn't seem like NavContainerHelper is installed: I am looking for c:\programdata\navcontainerhelper and can't find it."
            return
        }
        else {
            $command = $command + " -f c:\programdata\bcinab\docker-compose.navcontainerhelper.yml"
        }
    }
    $command = $command + " up"
    if ($Debug) {
        Write-Host "running: <$command>"
    }
    invoke-expression $command
}

function Update-BCinaB {
    DownloadCurrentCompose
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