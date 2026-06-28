# Phase 6 smoke: start exam → autosave → submit → idempotent submit
$base="http://localhost:5198"

function Req($method,$url,$h,$body=$null){
    try{
        if($body){return Invoke-WebRequest -Uri $url -Method $method -Headers $h -Body $body -ContentType "application/json" -UseBasicParsing}
        else{return Invoke-WebRequest -Uri $url -Method $method -Headers $h -UseBasicParsing}
    }catch [System.Net.WebException]{
        $r=$_.Exception.Response;$s=[int]$r.StatusCode
        $rd=New-Object System.IO.StreamReader $r.GetResponseStream()
        return [PSCustomObject]@{StatusCode=$s;Content=$rd.ReadToEnd()}
    }
}

# Admin login + setup
$adminTok=((Req "POST" "$base/api/v1/auth/login" @{} '{"userName":"admin","password":"123456"}').Content|ConvertFrom-Json).data.accessToken
$A=@{Authorization="Bearer $adminTok"}

# Create student user
$stuBody='{"userName":"student1","fullName":"Student 1","email":"s1@lms.com","role":"Student","password":"123456"}'
$stuRes=(Req "POST" "$base/api/v1/users" $A $stuBody).Content|ConvertFrom-Json
$studentId=$stuRes.data.id; Write-Host "studentId=$studentId"

# Create category + question
Req "POST" "$base/api/v1/question-categories" $A '{"name":"P6Cat"}' | Out-Null
$catId=((Req "GET" "$base/api/v1/question-categories?page=1&pageSize=1" $A).Content|ConvertFrom-Json).data.items[-1].id
$qBody=[PSCustomObject]@{categoryId=$catId;content="2+2=?";questionType="SingleChoice";difficulty="Easy";score=10.0;order=1;answerOptions=@([PSCustomObject]@{content="3";isCorrect=$false;order=1},[PSCustomObject]@{content="4";isCorrect=$true;order=2},[PSCustomObject]@{content="5";isCorrect=$false;order=3})}|ConvertTo-Json -Depth 5 -Compress
$qId=((Req "POST" "$base/api/v1/questions" $A $qBody).Content|ConvertFrom-Json).data.id
Write-Host "qId=$qId"

# Create exam + add question + publish + assign student
$examId=((Req "POST" "$base/api/v1/exams" $A '{"name":"P6Exam","durationMinutes":30,"passScore":5}').Content|ConvertFrom-Json).data.id
$aqBody=[PSCustomObject]@{questionId=$qId;order=1}|ConvertTo-Json -Compress
Req "POST" "$base/api/v1/exams/$examId/questions" $A $aqBody | Out-Null
Req "POST" "$base/api/v1/exams/$examId/publish" $A | Out-Null
$asBody=[PSCustomObject]@{userIds=@($studentId)}|ConvertTo-Json -Compress
Req "POST" "$base/api/v1/exams/$examId/assign" $A $asBody | Out-Null
Write-Host "examId=$examId assigned to studentId=$studentId"

# Student login
$stuTok=((Req "POST" "$base/api/v1/auth/login" @{} '{"userName":"student1","password":"123456"}').Content|ConvertFrom-Json).data.accessToken
$S=@{Authorization="Bearer $stuTok"}

# Start exam
Write-Host "==== POST /api/v1/exam-attempts/start ===="
$startBody=[PSCustomObject]@{examId=$examId}|ConvertTo-Json -Compress
$r=Req "POST" "$base/api/v1/exam-attempts/start" $S $startBody
$d=$r.Content|ConvertFrom-Json; $attemptId=$d.data.attemptId
Write-Host "STATUS=$($r.StatusCode) attemptId=$attemptId qCount=$($d.data.questions.Count)"

# Verify no IsCorrect in response
$hasCorrect=($d.data.questions[0].options|Get-Member -Name "isCorrect" -MemberType NoteProperty) -ne $null
Write-Host "hasIsCorrect=$hasCorrect (expect False)"

# Get active attempt
Write-Host "==== GET /api/v1/exam-attempts/{attemptId} ===="
$r=Req "GET" "$base/api/v1/exam-attempts/$attemptId" $S
$d=$r.Content|ConvertFrom-Json; Write-Host "STATUS=$($r.StatusCode) status=$($d.data.status) savedCount=$($d.data.savedAnswers.Count)"

# Get the correct answer optionId from options
$optionId=$d.data.questions[0].options[1].answerOptionId
Write-Host "Will select optionId=$optionId"

# Autosave
Write-Host "==== POST /api/v1/exam-attempts/{attemptId}/autosave ===="
$saveBody=[PSCustomObject]@{answers=@([PSCustomObject]@{questionId=$qId;selectedOptionIds=@($optionId)})}|ConvertTo-Json -Depth 5 -Compress
$r=Req "POST" "$base/api/v1/exam-attempts/$attemptId/autosave" $S $saveBody
$d=$r.Content|ConvertFrom-Json; Write-Host "STATUS=$($r.StatusCode) savedCount=$($d.data.savedCount)"

# Submit
Write-Host "==== POST /api/v1/exam-attempts/{attemptId}/submit ===="
$subBody='{"answers":[]}'
$r=Req "POST" "$base/api/v1/exam-attempts/$attemptId/submit" $S $subBody
$d=$r.Content|ConvertFrom-Json
Write-Host "STATUS=$($r.StatusCode) status=$($d.data.status) score=$($d.data.score) passed=$($d.data.passed)"

# Idempotent submit
Write-Host "==== Submit again (idempotent) ===="
$r=Req "POST" "$base/api/v1/exam-attempts/$attemptId/submit" $S $subBody
$d=$r.Content|ConvertFrom-Json
Write-Host "STATUS=$($r.StatusCode) msg=$($d.message) score=$($d.data.score)"

# Start again → should count second attempt
Write-Host "==== Start 2nd attempt ===="
$r=Req "POST" "$base/api/v1/exam-attempts/start" $S $startBody
$d=$r.Content|ConvertFrom-Json; Write-Host "STATUS=$($r.StatusCode) attemptId=$($d.data.attemptId)"
