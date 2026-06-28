$tok = ((Invoke-WebRequest -Uri "http://localhost:5198/api/v1/auth/login" -Method Post -Body '{"userName":"admin","password":"123456"}' -ContentType "application/json" -UseBasicParsing).Content | ConvertFrom-Json).data.accessToken
$H = @{Authorization="Bearer $tok"; "Content-Type"="application/json"}

function Req($method, $url, $body=$null) {
    try {
        if ($body) { return Invoke-WebRequest -Uri $url -Method $method -Headers $H -Body $body -ContentType "application/json" -UseBasicParsing }
        else { return Invoke-WebRequest -Uri $url -Method $method -Headers $H -UseBasicParsing }
    } catch [System.Net.WebException] {
        $r=$_.Exception.Response; $s=[int]$r.StatusCode
        $rd=New-Object System.IO.StreamReader $r.GetResponseStream()
        return [PSCustomObject]@{StatusCode=$s;Content=$rd.ReadToEnd()}
    }
}

# 1. Create category
Write-Host "==== POST /api/v1/question-categories ===="
$r=Req "POST" "http://localhost:5198/api/v1/question-categories" '{"name":"Math","description":"Toan hoc"}'
$d=$r.Content|ConvertFrom-Json; $catId=$d.data.id
Write-Host "STATUS=$($r.StatusCode) catId=$catId"

# 2. List categories
Write-Host "==== GET /api/v1/question-categories ===="
$r=Req "GET" "http://localhost:5198/api/v1/question-categories?page=1&pageSize=5"
$d=$r.Content|ConvertFrom-Json; Write-Host "STATUS=$($r.StatusCode) total=$($d.data.total)"

# 3. Create SingleChoice question (valid)
Write-Host "==== POST /api/v1/questions (SingleChoice valid) ===="
$qbody=[PSCustomObject]@{
    categoryId=$catId; content="1+1=?"; questionType="SingleChoice"
    difficulty="Easy"; score=1.0; order=1
    answerOptions=@(
        [PSCustomObject]@{content="1";isCorrect=$false;order=1}
        [PSCustomObject]@{content="2";isCorrect=$true;order=2}
        [PSCustomObject]@{content="3";isCorrect=$false;order=3}
    )
}|ConvertTo-Json -Depth 5 -Compress
$r=Req "POST" "http://localhost:5198/api/v1/questions" $qbody
$d=$r.Content|ConvertFrom-Json; $qId=$d.data.id
Write-Host "STATUS=$($r.StatusCode) qId=$qId type=$($d.data.questionType) answers=$($d.data.answerOptions.Count)"

# 4. Create question - SingleChoice 2 correct → 400
Write-Host "==== POST /api/v1/questions (SingleChoice 2 correct - expect 400) ===="
$qbad=[PSCustomObject]@{
    categoryId=$catId; content="bad?"; questionType="SingleChoice"
    difficulty="Easy"; score=1.0; order=2
    answerOptions=@(
        [PSCustomObject]@{content="A";isCorrect=$true;order=1}
        [PSCustomObject]@{content="B";isCorrect=$true;order=2}
    )
}|ConvertTo-Json -Depth 5 -Compress
$r=Req "POST" "http://localhost:5198/api/v1/questions" $qbad
$d=$r.Content|ConvertFrom-Json; Write-Host "STATUS=$($r.StatusCode) (expect 400) msg=$($d.message)"

# 5. Create MultipleChoice question (valid)
Write-Host "==== POST /api/v1/questions (MultipleChoice valid) ===="
$qmc=[PSCustomObject]@{
    categoryId=$catId; content="Which are even?"; questionType="MultipleChoice"
    difficulty="Medium"; score=2.0; order=3
    answerOptions=@(
        [PSCustomObject]@{content="2";isCorrect=$true;order=1}
        [PSCustomObject]@{content="3";isCorrect=$false;order=2}
        [PSCustomObject]@{content="4";isCorrect=$true;order=3}
    )
}|ConvertTo-Json -Depth 5 -Compress
$r=Req "POST" "http://localhost:5198/api/v1/questions" $qmc
$d=$r.Content|ConvertFrom-Json; $q2Id=$d.data.id
Write-Host "STATUS=$($r.StatusCode) qId=$q2Id correctCount=$(($d.data.answerOptions|Where-Object{$_.isCorrect}).Count)"

# 6. Get question detail (has IsCorrect)
Write-Host "==== GET /api/v1/questions/{id} ===="
$r=Req "GET" "http://localhost:5198/api/v1/questions/$qId"
$d=$r.Content|ConvertFrom-Json; Write-Host "STATUS=$($r.StatusCode) content=$($d.data.content) score=$($d.data.score)"

# 7. Delete category with questions → expect 409
Write-Host "==== DELETE /api/v1/question-categories/{id} with questions (expect 409) ===="
$r=Req "DELETE" "http://localhost:5198/api/v1/question-categories/$catId"
$d=$r.Content|ConvertFrom-Json; Write-Host "STATUS=$($r.StatusCode) (expect 409) msg=$($d.message)"

# 8. Delete question → 204
Write-Host "==== DELETE /api/v1/questions/{id} ===="
$r=Req "DELETE" "http://localhost:5198/api/v1/questions/$qId"
Write-Host "STATUS=$($r.StatusCode) (expect 204)"

# 9. Delete category after removing question → 204
Write-Host "==== DELETE /api/v1/questions/{q2Id} ===="
Req "DELETE" "http://localhost:5198/api/v1/questions/$q2Id" | Out-Null
$r=Req "DELETE" "http://localhost:5198/api/v1/question-categories/$catId"
Write-Host "STATUS=$($r.StatusCode) (expect 204)"
