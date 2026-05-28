# lock 파일 제거 후 git commit & push
$lockFile = ".git\index.lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force
    Write-Host "lock 파일 제거 완료" -ForegroundColor Yellow
}

git add exam_data.js exam_data_35.js exam_data_34.js exam_data_33.js exam_data_32.js exam_data_31.js exam_data_30.js app.js index.html about.html privacy.html sitemap.xml terms.html

git commit -m "30~36회 전체 데이터 + Supabase 로그인 연동"

git push origin main

Write-Host "`n완료! Cloudflare Pages가 자동 배포됩니다." -ForegroundColor Green
Read-Host "Enter"
