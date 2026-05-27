# lock 파일 제거 후 git commit & push
$lockFile = ".git\index.lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force
    Write-Host "lock 파일 제거 완료" -ForegroundColor Yellow
}

git add index.html app.js exam_data_35.js exam_data_33.js exam_data_34.js

git commit -m "모바일 UX 수정 + 35회·34회·33회 데이터 추가

- index.html: 햄버거 메뉴 추가, 데이터 스크립트를 body 하단으로 이동 (블로킹 로딩 제거)
- app.js: toggleMenu/closeMenu 추가, 과목·회차 선택 시 메뉴 자동 닫힘
- exam_data_35.js: 35회 전 과목 완성 (6과목 200문제)
- exam_data_34.js: 34회 전 과목 완성 (6과목 200문제)
- exam_data_33.js: 33회 민법 추가 (40문제, 부분)"

git push origin main

Write-Host "`n완료! Cloudflare Pages가 자동 배포됩니다." -ForegroundColor Green
Read-Host "엔터를 누르면 창이 닫힙니다"
