# lock 파일 제거 후 git commit & push
$lockFile = ".git\index.lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force
    Write-Host "lock 파일 제거 완료" -ForegroundColor Yellow
}

# 변경된 파일 전부 스테이징
git add exam_data.js exam_data_35.js exam_data_34.js exam_data_33.js exam_data_32.js exam_data_31.js exam_data_30.js app.js index.html about.html privacy.html sitemap.xml terms.html

# 커밋
git commit -m "30~36회 전체 데이터 정리 및 구조 개편 완성"

# push
git push origin main

Write-Host "`n완료! Cloudflare Pages가 자동 배포됩니다." -ForegroundColor Green
Read-Host "엔터를 누르면 창이 닫힙니다"
