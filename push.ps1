# lock 파일 제거 후 git commit & push
$lockFile = ".git\index.lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force
    Write-Host "lock 파일 제거 완료" -ForegroundColor Yellow
}

# app.js (try-catch 에러 핸들러 포함) 추가 커밋
git add app.js
git commit -m "모바일 에러 핸들러 추가 (try-catch)"

# 밀린 커밋 2개 한 번에 push
git push origin main

Write-Host "`n완료! Cloudflare Pages가 자동 배포됩니다." -ForegroundColor Green
Read-Host "엔터를 누르면 창이 닫힙니다"
