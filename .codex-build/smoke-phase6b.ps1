$base="http://localhost:5198"

function Req($method,$url,$h,$body=$null){
    try{
        if($body){return Invoke-WebRequest -Uri $url -Method $method -Headers $h -Body $body -ContentType "application/json" -UseBasicParsing}
        else{return Invoke-WebRequest -Uri $url -Method $method -Headers $h -UseBasicParsing}
    }catch [System.Net.WebException]{
        $r=$_.Exception.Response
        if($r){$s=[int]$r.StatusCode;$rd=New-Object System.IO.StreamReader $r.GetResponseStream();return [PSCustomObject]@{StatusCode=$s;Content=$rd.ReadToEnd()}}
        throw
    }
}

# Admin setup
$adminTok=((Req "POST" "$base/api/v1/auth/login" @{} '{"userName":"admin","password":"123456"}').Content|ConvertFrom-Json).data.accessToken
$A=@{Authorization="Bearer $adminTok"}

# Create student
$sr=Req "POST" "$base/api/v1/users" $A '{"userName":"stu6","fullName":"Stu6","email":"stu6@test.com","role":"Student","password":"123456"}'
$studentId=($sr.Content|ConvertFrom-Json).data.id
Write-Host "studentId=$studentId"
if(-not $studentId){Write-Host "FAILED to create student"; Write-Host $sr.Content; exit 1}

# Create category + question
$catR=Req "POST" "$base/api/v1/question-categories" $A '{"name":"P6Cat2"}'
$catId=($catR.Content|ConvertFrom-Json).data.id
$qBody='{"categoryId":'+$catId+',"content":"3+3=?","questionType":"SingleChoice","difficulty":"Easy","score":10,"order":1,"answerOptions":[{"content":"5","isCorrect":false,"order":1},{"content":"6","isCorrect":true,"order":2}]}'
$qId=((Req "POST" "$base/api/v1/questions" $A $qBody).Content|ConvertFrom-Json).data.id
Write-Host "catId=$catId qId=$qId"

# Create exam + add question + publish + assign
$examId=((Req "POST" "$base/api/v1/exams" $A '{"name":"P6TestExam","durationMinutes":30,"passScore":5}').Content|ConvertFrom-Json).data.id
Req "POST" "$base/api/v1/exams/$examId/questions" $A ('{"questionId":'+$qId+',"order":1}') | Out-Null
Req "POST" "$base/api/v1/exams/$examId/publish" $A | Out-Null
Req "POST" "$base/api/v1/exams/$examId/assign" $A ('{"userIds":['+$studentId+']}') | Out-Null
Write-Host "examId=$examId published+assigned"

# Student login
$stuTok=((Req "POST" "$base/api/v1/auth/login" @{} '{"userName":"stu6","password":"123456"}').Content|ConvertFrom-Json).data.accessToken
$S=@{Authorization="Bearer $stuTok"}
Write-Host "Student token obtained"

# Start exam
Write-Host "`n==== START ===="
$r=Req "POST" "$base/api/v1/exam-attempts/start" $S ('{"examId":'+$examId+'}')
$d=$r.Content|ConvertFrom-Json
$attemptId=$d.data.attemptId
Write-Host "STATUS=$($r.StatusCode) attemptId=$attemptId qCount=$($d.data.questions.Count)"

if(-not $attemptId){Write-Host "FAILED start"; Write-Host $r.Content; exit 1}

# Check no IsCorrect
$opts=$d.data.questions[0].options
$hasCorrect=$opts[0].PSObject.Properties.Name -contains "isCorrect"
Write-Host "hasIsCorrect=$hasCorrect (expect False)"

# Get correct optionId (2nd option from snapshot; we know order may shuffle)
# We select the option with content "6"
$correctOpt=$opts|Where-Object{$_.content -eq "6"}
$optionId=$correctOpt.answerOptionId
Write-Host "Selecting optionId=$optionId (content=6)"

# Autosave
Write-Host "`n==== AUTOSAVE ===="
$saveBody='{"answers":[{"questionId":'+$qId+',"selectedOptionIds":['+$optionId+']}]}'
$r=Req "POST" "$base/api/v1/exam-attempts/$attemptId/autosave" $S $saveBody
$d=$r.Content|ConvertFrom-Json
Write-Host "STATUS=$($r.StatusCode) savedCount=$($d.data.savedCount)"

# Submit
Write-Host "`n==== SUBMIT ===="
$r=Req "POST" "$base/api/v1/exam-attempts/$attemptId/submit" $S '{"answers":[]}'
$d=$r.Content|ConvertFrom-Json
Write-Host "STATUS=$($r.StatusCode) status=$($d.data.status) score=$($d.data.score) passed=$($d.data.passed)"

# Idempotent submit
Write-Host "`n==== SUBMIT AGAIN (idempotent) ===="
$r=Req "POST" "$base/api/v1/exam-attempts/$attemptId/submit" $S '{"answers":[]}'
$d=$r.Content|ConvertFrom-Json
Write-Host "STATUS=$($r.StatusCode) msg=$($d.message)"
