$ErrorActionPreference = 'Continue'

Write-Host "==== login to get token ===="
$loginBody = '{"userName":"admin","password":"123456"}'
$loginRes = Invoke-WebRequest -Uri "http://localhost:5198/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -UseBasicParsing
$token = ($loginRes.Content | ConvertFrom-Json).data.accessToken
Write-Host "Got token: $($token.Substring(0, 40))..."
Write-Host ""

Write-Host "==== users with token (expect 200 envelope) ===="
try {
    $r = Invoke-WebRequest -Uri "http://localhost:5198/api/v1/users?page=1&pageSize=5" -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing
    Write-Host "STATUS=$($r.StatusCode)"
    Write-Host $r.Content
} catch [System.Net.WebException] {
    $resp = $_.Exception.Response
    if ($resp) {
        $status = [int]$resp.StatusCode
        $reader = New-Object System.IO.StreamReader $resp.GetResponseStream()
        Write-Host "STATUS=$status"
        Write-Host $reader.ReadToEnd()
    }
}
