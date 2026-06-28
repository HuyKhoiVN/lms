$tok=((Invoke-WebRequest -Uri "http://localhost:5198/api/v1/auth/login" -Method Post -Body '{"userName":"admin","password":"123456"}' -ContentType "application/json" -UseBasicParsing).Content|ConvertFrom-Json).data.accessToken
$H=@{Authorization="Bearer $tok"}

function Req($method,$url,$body=$null){
    try {
        if($body){return Invoke-WebRequest -Uri $url -Method $method -Headers $H -Body $body -ContentType "application/json" -UseBasicParsing}
        else{return Invoke-WebRequest -Uri $url -Method $method -Headers $H -UseBasicParsing}
    } catch [System.Net.WebException]{
        $r=$_.Exception.Response;$s=[int]$r.StatusCode
        $rd=New-Object System.IO.StreamReader $r.GetResponseStream()
        return [PSCustomObject]@{StatusCode=$s;Content=$rd.ReadToEnd()}
    }
}

# 1. Create category + question for exam
$cat=(Req "POST" "http://localhost:5198/api/v1/question-categories" '{"name":"ExamCat"}').Content|ConvertFrom-Json
$catId=$cat.data.id; Write-Host "catId=$catId"

$qbody=[PSCustomObject]@{categoryId=$catId;content="Q1?";questionType="SingleChoice";difficulty="Easy";score=2.0;order=1;answerOptions=@([PSCustomObject]@{content="A";isCorrect=$false;order=1},[PSCustomObject]@{content="B";isCorrect=$true;order=2})}|ConvertTo-Json -Depth 5 -Compress
$q=(Req "POST" "http://localhost:5198/api/v1/questions" $qbody).Content|ConvertFrom-Json
$qId=$q.data.id; Write-Host "qId=$qId"

# 2. Create exam
Write-Host "==== POST /api/v1/exams ===="
$exBody='{"name":"Final Exam","durationMinutes":60,"passScore":50,"reviewMode":"FullReview"}'
$r=Req "POST" "http://localhost:5198/api/v1/exams" $exBody
$d=$r.Content|ConvertFrom-Json; $examId=$d.data.id
Write-Host "STATUS=$($r.StatusCode) examId=$examId isPublished=$($d.data.isPublished)"

# 3. Publish without questions → 422
Write-Host "==== Publish without questions (expect 422) ===="
$r=Req "POST" "http://localhost:5198/api/v1/exams/$examId/publish"
$d=$r.Content|ConvertFrom-Json; Write-Host "STATUS=$($r.StatusCode) msg=$($d.message)"

# 4. Add question to exam
Write-Host "==== POST /api/v1/exams/{id}/questions ===="
$aqBody=[PSCustomObject]@{questionId=$qId;order=1}|ConvertTo-Json -Compress
$r=Req "POST" "http://localhost:5198/api/v1/exams/$examId/questions" $aqBody
$d=$r.Content|ConvertFrom-Json; Write-Host "STATUS=$($r.StatusCode) qCount=$($d.data.questions.Count)"

# 5. Publish → 200
Write-Host "==== Publish with question (expect 200) ===="
$r=Req "POST" "http://localhost:5198/api/v1/exams/$examId/publish"
$d=$r.Content|ConvertFrom-Json; Write-Host "STATUS=$($r.StatusCode) msg=$($d.message)"

# 6. Get exam detail
Write-Host "==== GET /api/v1/exams/{id} ===="
$r=Req "GET" "http://localhost:5198/api/v1/exams/$examId"
$d=$r.Content|ConvertFrom-Json; Write-Host "STATUS=$($r.StatusCode) name=$($d.data.name) published=$($d.data.isPublished)"

# 7. Assign to admin user (id=1)
Write-Host "==== POST /api/v1/exams/{id}/assign ===="
$r=Req "POST" "http://localhost:5198/api/v1/exams/$examId/assign" '{"userIds":[1]}'
$d=$r.Content|ConvertFrom-Json; Write-Host "STATUS=$($r.StatusCode) msg=$($d.message)"

# 8. Duplicate assign → silent skip (already assigned)
Write-Host "==== Duplicate assign (silent skip) ===="
$r=Req "POST" "http://localhost:5198/api/v1/exams/$examId/assign" '{"userIds":[1]}'
$d=$r.Content|ConvertFrom-Json; Write-Host "STATUS=$($r.StatusCode) msg=$($d.message)"

# 9. List assignments
Write-Host "==== GET /api/v1/exam-assignments?examId={id} ===="
$r=Req "GET" "http://localhost:5198/api/v1/exam-assignments?examId=$examId&page=1&pageSize=10"
$d=$r.Content|ConvertFrom-Json; Write-Host "STATUS=$($r.StatusCode) total=$($d.data.total)"

# 10. Unpublish
Write-Host "==== POST /api/v1/exams/{id}/unpublish ===="
$r=Req "POST" "http://localhost:5198/api/v1/exams/$examId/unpublish"
$d=$r.Content|ConvertFrom-Json; Write-Host "STATUS=$($r.StatusCode) msg=$($d.message)"

# 11. Remove question → 204
Write-Host "==== DELETE /api/v1/exams/{id}/questions/{qId} ===="
$r=Req "DELETE" "http://localhost:5198/api/v1/exams/$examId/questions/$qId"
Write-Host "STATUS=$($r.StatusCode) (expect 204)"

# 12. Delete exam → 204
Write-Host "==== DELETE /api/v1/exams/{id} ===="
$r=Req "DELETE" "http://localhost:5198/api/v1/exams/$examId"
Write-Host "STATUS=$($r.StatusCode) (expect 204)"
