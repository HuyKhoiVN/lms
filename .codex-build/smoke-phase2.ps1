$ErrorActionPreference = 'Continue'

function Test {
    param([string]$Name, [scriptblock]$Action)
    Write-Host "==== $Name ===="
    try { & $Action }
    catch [System.Net.WebException] {
        $resp = $_.Exception.Response
        if ($resp) {
            $s = [int]$resp.StatusCode
            $r = New-Object System.IO.StreamReader $resp.GetResponseStream()
            Write-Host "STATUS=$s"; Write-Host $r.ReadToEnd()
        } else { Write-Host $_.Exception.Message }
    }
    catch { Write-Host "Error: $($_.Exception.Message)" }
    Write-Host ""
}

# Get token
$loginBody = '{"userName":"admin","password":"123456"}'
$loginRes = Invoke-WebRequest -Uri "http://localhost:5198/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -UseBasicParsing
$token = ($loginRes.Content | ConvertFrom-Json).data.accessToken
$H = @{ Authorization = "Bearer $token" }

Test "GET /api/v1/auth/me" {
    $r = Invoke-WebRequest -Uri "http://localhost:5198/api/v1/auth/me" -Headers $H -UseBasicParsing
    Write-Host "STATUS=$($r.StatusCode)"; Write-Host $r.Content
}

Test "GET /api/v1/audit-logs (page=1)" {
    $r = Invoke-WebRequest -Uri "http://localhost:5198/api/v1/audit-logs?page=1&pageSize=5" -Headers $H -UseBasicParsing
    Write-Host "STATUS=$($r.StatusCode)"
    $d = $r.Content | ConvertFrom-Json
    Write-Host "success=$($d.success) total=$($d.data.total)"
}

Test "POST /api/v1/courses/{id}/publish (course 1)" {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:5198/api/v1/courses/1/publish" -Method Post -Headers $H -UseBasicParsing
        Write-Host "STATUS=$($r.StatusCode)"; Write-Host $r.Content
    } catch [System.Net.WebException] {
        $resp = $_.Exception.Response
        $s = [int]$resp.StatusCode
        $rd = New-Object System.IO.StreamReader $resp.GetResponseStream()
        Write-Host "STATUS=$s"; Write-Host $rd.ReadToEnd()
    }
}

Test "GET /api/v1/files" {
    $r = Invoke-WebRequest -Uri "http://localhost:5198/api/v1/files?page=1&pageSize=5" -Headers $H -UseBasicParsing
    Write-Host "STATUS=$($r.StatusCode)"; Write-Host $r.Content
}

Test "GET /api/v1/courses with Student-filter" {
    $r = Invoke-WebRequest -Uri "http://localhost:5198/api/v1/courses?page=1&pageSize=5" -Headers $H -UseBasicParsing
    Write-Host "STATUS=$($r.StatusCode)"
    $d = $r.Content | ConvertFrom-Json
    Write-Host "success=$($d.success) total=$($d.data.total)"
}
