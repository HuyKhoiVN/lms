$base="http://localhost:5198"
function Req($method,$url,$h,$body=$null){
    try{if($body){return Invoke-WebRequest -Uri $url -Method $method -Headers $h -Body $body -ContentType "application/json" -UseBasicParsing}else{return Invoke-WebRequest -Uri $url -Method $method -Headers $h -UseBasicParsing}}
    catch [System.Net.WebException]{$r=$_.Exception.Response;if($r){$s=[int]$r.StatusCode;$rd=New-Object System.IO.StreamReader $r.GetResponseStream();return [PSCustomObject]@{StatusCode=$s;Content=$rd.ReadToEnd()}};throw}
}

# Admin setup (reuse exam from Phase 6)
$adminTok=((Req "POST" "$base/api/v1/auth/login" @{} '{"userName":"admin","password":"123456"}').Content|ConvertFrom-Json).data.accessToken
$A=@{Authorization="Bearer $adminTok"}

# Create fresh student + exam to control test
$sr=Req "POST" "$base/api/v1/users" $A '{"userName":"stu7","fullName":"Stu7","email":"stu7@test.com","role":"Student","password":"123456"}'
$studentId=($sr.Content|ConvertFrom-Json).data.id; Write-Host "studentId=$studentId"

$catR=Req "POST" "$base/api/v1/question-categories" $A '{"name":"P7Cat"}'
$catId=($catR.Content|ConvertFrom-Json).data.id
$qBody='{"categoryId":'+$catId+',"content":"5*5=?","questionType":"SingleChoice","difficulty":"Medium","score":20,"order":1,"answerOptions":[{"content":"20","isCorrect":false,"order":1},{"content":"25","isCorrect":true,"order":2}]}'
$qId=((Req "POST" "$base/api/v1/questions" $A $qBody).Content|ConvertFrom-Json).data.id

$examId=((Req "POST" "$base/api/v1/exams" $A '{"name":"P7Exam","durationMinutes":10,"passScore":15,"reviewMode":"FullReview"}').Content|ConvertFrom-Json).data.id
Req "POST" "$base/api/v1/exams/$examId/questions" $A ('{"questionId":'+$qId+',"order":1}') | Out-Null
Req "POST" "$base/api/v1/exams/$examId/publish" $A | Out-Null
Req "POST" "$base/api/v1/exams/$examId/assign" $A ('{"userIds":['+$studentId+']}') | Out-Null
Write-Host "Setup done: examId=$examId"

# Student login + start + submit correct answer
$stuTok=((Req "POST" "$base/api/v1/auth/login" @{} '{"userName":"stu7","password":"123456"}').Content|ConvertFrom-Json).data.accessToken
$S=@{Authorization="Bearer $stuTok"}

$startR=(Req "POST" "$base/api/v1/exam-attempts/start" $S ('{"examId":'+$examId+'}')).Content|ConvertFrom-Json
$attemptId=$startR.data.attemptId
$optId=($startR.data.questions[0].options|Where-Object{$_.content -eq "25"}).answerOptionId
Write-Host "attemptId=$attemptId correctOptId=$optId"

# Submit with correct answer
$subBody='{"answers":[{"questionId":'+$qId+',"selectedOptionIds":['+$optId+']}]}'
$subR=(Req "POST" "$base/api/v1/exam-attempts/$attemptId/submit" $S $subBody).Content|ConvertFrom-Json
Write-Host "Submit: score=$($subR.data.score) passed=$($subR.data.passed)"

# GET /api/v1/results/my
Write-Host "`n==== GET /api/v1/results/my ===="
$r=Req "GET" "$base/api/v1/results/my?page=1&pageSize=5" $S
$d=$r.Content|ConvertFrom-Json
Write-Host "STATUS=$($r.StatusCode) total=$($d.data.total) score=$($d.data.items[0].score)"

# GET /api/v1/results/{id}
$resultId=$d.data.items[0].id
Write-Host "`n==== GET /api/v1/results/{id} ===="
$r=Req "GET" "$base/api/v1/results/$resultId" $S
$d=$r.Content|ConvertFrom-Json
Write-Host "STATUS=$($r.StatusCode) passed=$($d.data.passed) detailCount=$($d.data.details.Count)"

# GET /api/v1/results/{id}/review (FullReview)
Write-Host "`n==== GET /api/v1/results/{id}/review (FullReview) ===="
$r=Req "GET" "$base/api/v1/results/$resultId/review" $S
$d=$r.Content|ConvertFrom-Json
Write-Host "STATUS=$($r.StatusCode) reviewMode=$($d.data.reviewMode) qCount=$($d.data.questions.Count)"
$q0=$d.data.questions[0]
Write-Host "q0: isCorrect=$($q0.isCorrect) scoreEarned=$($q0.scoreEarned)"
$correctOpt=$q0.options|Where-Object{$_.isCorrect -eq $true}
Write-Host "correctOpt content=$($correctOpt.content) wasSelected=$($correctOpt.wasSelected)"

# Admin query all results
Write-Host "`n==== GET /api/v1/results (Admin) ===="
$r=Req "GET" "$base/api/v1/results?page=1&pageSize=5" $A
$d=$r.Content|ConvertFrom-Json
Write-Host "STATUS=$($r.StatusCode) total=$($d.data.total)"
