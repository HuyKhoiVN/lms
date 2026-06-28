$tok = ((Invoke-WebRequest -Uri "http://localhost:5198/api/v1/auth/login" -Method Post -Body '{"userName":"admin","password":"123456"}' -ContentType "application/json" -UseBasicParsing).Content | ConvertFrom-Json).data.accessToken
$H = @{Authorization="Bearer $tok"}

# Create first
$cr = Invoke-WebRequest -Uri "http://localhost:5198/api/v1/learning-materials" -Method Post -Headers $H -Body '{"courseId":2,"title":"DeleteTest","contentType":"Text","textContent":"x","order":99}' -ContentType "application/json" -UseBasicParsing
$mid = ($cr.Content | ConvertFrom-Json).data.id
Write-Host "Created materialId=$mid"

# Delete
$dr = Invoke-WebRequest -Uri "http://localhost:5198/api/v1/learning-materials/$mid" -Method Delete -Headers $H -UseBasicParsing
Write-Host "DELETE STATUS=$($dr.StatusCode) (expect 204)"

# Get after delete
try {
    $gr = Invoke-WebRequest -Uri "http://localhost:5198/api/v1/learning-materials/$mid" -Headers $H -UseBasicParsing
    Write-Host "GET STATUS=$($gr.StatusCode)"
} catch [System.Net.WebException] {
    $rr = $_.Exception.Response
    $rd = New-Object System.IO.StreamReader $rr.GetResponseStream()
    Write-Host "GET STATUS=$([int]$rr.StatusCode) (expect 404)"
    Write-Host $rd.ReadToEnd()
}

# Course progress
$pr = Invoke-WebRequest -Uri "http://localhost:5198/api/v1/courses/2/progress" -Headers $H -UseBasicParsing
$pd = $pr.Content | ConvertFrom-Json
Write-Host "PROGRESS totalMaterials=$($pd.data.totalMaterials)"
