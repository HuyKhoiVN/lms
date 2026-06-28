$ErrorActionPreference = 'Continue'

function Req {
    param([string]$Method, [string]$Url, $H, [string]$Body=$null)
    try {
        if ($Body) {
            return Invoke-WebRequest -Uri $Url -Method $Method -Headers $H -Body $Body -ContentType "application/json" -UseBasicParsing
        } else {
            return Invoke-WebRequest -Uri $Url -Method $Method -Headers $H -UseBasicParsing
        }
    } catch [System.Net.WebException] {
        $r = $_.Exception.Response
        if ($r) {
            $rd = New-Object System.IO.StreamReader $r.GetResponseStream()
            return [PSCustomObject]@{ StatusCode = [int]$r.StatusCode; Content = $rd.ReadToEnd() }
        }
        throw
    }
}

# Login
$tok = ((Req "POST" "http://localhost:5198/api/v1/auth/login" @{} '{"userName":"admin","password":"123456"}').Content | ConvertFrom-Json).data.accessToken
$H = @{ Authorization = "Bearer $tok" }

# 1. List empty
Write-Host "==== GET /api/v1/learning-materials (empty) ===="
$r = Req "GET" "http://localhost:5198/api/v1/learning-materials?page=1&pageSize=5" $H
$d = $r.Content | ConvertFrom-Json
Write-Host "STATUS=$($r.StatusCode) success=$($d.success) total=$($d.data.total)"; Write-Host ""

# 2. Create course
Write-Host "==== POST /api/v1/courses ===="
$r = Req "POST" "http://localhost:5198/api/v1/courses" $H '{"name":"Phase3 Course","code":"P3C","isPublished":true}'
$d = $r.Content | ConvertFrom-Json
$cid = $d.data.id
Write-Host "STATUS=$($r.StatusCode) courseId=$cid"; Write-Host ""

# 3. Create Text material
Write-Host "==== POST /api/v1/learning-materials (Text) ===="
$matBody = [PSCustomObject]@{ courseId=$cid; title="Bài 1"; contentType="Text"; textContent="Nội dung"; order=1 } | ConvertTo-Json -Compress
$r = Req "POST" "http://localhost:5198/api/v1/learning-materials" $H $matBody
$d = $r.Content | ConvertFrom-Json
$mid = $d.data.id
Write-Host "STATUS=$($r.StatusCode) materialId=$mid contentType=$($d.data.contentType)"; Write-Host ""

# 4. Get by id
Write-Host "==== GET /api/v1/learning-materials/{id} ===="
$r = Req "GET" "http://localhost:5198/api/v1/learning-materials/$mid" $H
$d = $r.Content | ConvertFrom-Json
Write-Host "STATUS=$($r.StatusCode) title=$($d.data.title) files=$($d.data.files.Count)"; Write-Host ""

# 5. Link type missing ExternalLink → expect 400
Write-Host "==== POST /api/v1/learning-materials (Link - missing ExternalLink) ===="
$badBody = [PSCustomObject]@{ courseId=$cid; title="Video"; contentType="Link"; order=2 } | ConvertTo-Json -Compress
$r = Req "POST" "http://localhost:5198/api/v1/learning-materials" $H $badBody
$d = $r.Content | ConvertFrom-Json
Write-Host "STATUS=$($r.StatusCode) (expect 400) msg=$($d.message)"; Write-Host ""

# 6. Course progress summary
Write-Host "==== GET /api/v1/courses/{courseId}/progress ===="
$r = Req "GET" "http://localhost:5198/api/v1/courses/$cid/progress" $H
$d = $r.Content | ConvertFrom-Json
Write-Host "STATUS=$($r.StatusCode) totalMaterials=$($d.data.totalMaterials) overallPercent=$($d.data.overallPercent)"; Write-Host ""

# 7. Update material
Write-Host "==== PUT /api/v1/learning-materials/{id} ===="
$upd = [PSCustomObject]@{ title="Bài 1 (updated)"; textContent="Nội dung mới"; order=1 } | ConvertTo-Json -Compress
$r = Req "PUT" "http://localhost:5198/api/v1/learning-materials/$mid" $H $upd
$d = $r.Content | ConvertFrom-Json
Write-Host "STATUS=$($r.StatusCode) title=$($d.data.title)"; Write-Host ""

# 8. Delete → 204
Write-Host "==== DELETE /api/v1/learning-materials/{id} → 204 ===="
$r = Req "DELETE" "http://localhost:5198/api/v1/learning-materials/$mid" $H
Write-Host "STATUS=$($r.StatusCode) (expect 204)"; Write-Host ""

# 9. Get after delete → 404
Write-Host "==== GET after delete → 404 ===="
$r = Req "GET" "http://localhost:5198/api/v1/learning-materials/$mid" $H
Write-Host "STATUS=$($r.StatusCode) (expect 404)"; Write-Host ""
