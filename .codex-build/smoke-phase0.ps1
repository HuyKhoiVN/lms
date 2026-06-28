$ErrorActionPreference = 'Continue'

function Invoke-Test {
    param([string]$Name, [scriptblock]$Action)
    Write-Host "==== $Name ===="
    try {
        & $Action
    } catch [System.Net.WebException] {
        $resp = $_.Exception.Response
        if ($resp) {
            $status = [int]$resp.StatusCode
            $reader = New-Object System.IO.StreamReader $resp.GetResponseStream()
            $body = $reader.ReadToEnd()
            Write-Host "STATUS=$status"
            Write-Host $body
        } else {
            Write-Host $_.Exception.Message
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
    }
    Write-Host ""
}

Invoke-Test "login OK" {
    $body = '{"userName":"admin","password":"123456"}'
    $r = Invoke-WebRequest -Uri "http://localhost:5198/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "STATUS=$($r.StatusCode)"
    Write-Host $r.Content
}

Invoke-Test "login WRONG password (expect 401)" {
    $body = '{"userName":"admin","password":"wrong"}'
    $r = Invoke-WebRequest -Uri "http://localhost:5198/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "STATUS=$($r.StatusCode)"
    Write-Host $r.Content
}

Invoke-Test "users without token (expect 401)" {
    $r = Invoke-WebRequest -Uri "http://localhost:5198/api/v1/users" -UseBasicParsing
    Write-Host "STATUS=$($r.StatusCode)"
    Write-Host $r.Content
}

Invoke-Test "swagger json" {
    $r = Invoke-WebRequest -Uri "http://localhost:5198/swagger/v1/swagger.json" -UseBasicParsing
    Write-Host "STATUS=$($r.StatusCode)"
    $info = ($r.Content | ConvertFrom-Json).info
    Write-Host ("title={0} version={1}" -f $info.title, $info.version)
}
