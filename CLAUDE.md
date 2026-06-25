# 기출허브 (gichulhub) — 프로젝트 가이드

공인중개사 기출문제 학습 사이트. Cloudflare Pages에 정적 SPA로 배포, GitHub에서 자동 배포.
사이트 주소: https://gichulhub.pages.dev

---

## 기술 스택

- **프론트엔드**: Vanilla JS (단일 `app.js`), HTML, CSS
- **배포**: Cloudflare Pages ← GitHub 자동 배포
- **버전 관리**: GitHub Desktop으로 commit & push
- **DB**: Supabase (PostgreSQL) — 문제 수정, 유저 진도, 학습일지 저장
- **인증**: Supabase Google OAuth

---

## 핵심 코드 규칙 (매우 중요!)

### app.js — 엄격한 규칙
- `var` 만 사용 (`let`, `const` 절대 금지)
- 문자열 연결만 사용 (`h += '...'` 방식)
- 백틱(template literal) 절대 금지
- `h +=` 방식으로 HTML 문자열 조립

### admin.html — 현대 JS 가능
- `const`, `let`, 화살표 함수, template literal 모두 OK

---

## 주요 파일 구조

```
gichulhub/
├── index.html          # 진입점, Supabase/exam_data 스크립트 로드
├── app.js              # 메인 앱 로직 (전체 기능)
├── admin.html          # 관리자 페이지 (문제 추가/수정/삭제)
├── exam_data_36.js     # 36회 기출 데이터
├── exam_data_35.js     # 35회 기출 데이터
├── exam_data_34.js     # 34회 기출 데이터
├── exam_data_33.js     # 33회 기출 데이터
├── exam_data_32.js     # 32회 기출 데이터
├── exam_data_31.js     # 31회 기출 데이터
├── exam_data_30.js     # 30회 기출 데이터
└── jijun_data.js       # 기출지문 데이터
```

---

## 주요 기능 목록

### 문제 풀기
- 회차(30~36회) × 과목별 문제 풀기
- 필터: 전체 / 오답만 / 북마크 / 시험모드
- 🔄 다시풀기 버튼 (필터바에 있음, 별표 유지하고 풀이 기록만 초기화)
- 소거 기능: 보기 오른쪽 체크박스로 선택지 지워가며 풀기

### 섞어풀기
- 사이드바에서 진입
- 과목 선택 → 30~36회 문제 랜덤 40문제 출제
- 문제마다 "제N회 N번" 표시
- 매번 다시풀기 시 문제 새로 섞임
- 관련 state: `_mixSubjName`, `_mixQuestions`, `_mixCurrentQ`, `_mixAnswers`
- `_navMode = 'mix'` / `'mixpicker'`

### 학습일지
- 문제 풀고 "📅 0회독" 버튼 누르면 기록
- 누적 횟수 표시: 0회독 → 1회독 → 2회독...
- 날짜별 그룹핑, 개별 삭제 가능
- **복습 리마인드**: 마지막 학습 후 14일 이상 지난 과목 상단에 표시 (오래된 순)
- **Supabase 동기화**: 로그인 시 `study_log` 테이블에 동기화 (다기기 지원)

### 기출지문
- `jijun_data.js` 데이터 기반
- OX 퀴즈 형식, 빈칸 모드 지원

### 어드민 (admin.html)
- 문제 추가/수정/삭제
- JS 데이터에 없는 DB 전용 문제: 보라색 "추가됨" 뱃지
- 번호 없는 깨진 JS 문제: 빨간 "Q⚠️ 번호없음" 표시
- 숨기기 기능 없음, 삭제만 있음

---

## localStorage 키

| 키 | 내용 |
|---|---|
| `gh_v2` | 답안/북마크/resolved/skip 상태 |
| `gh_nav` | 네비게이션 상태 (현재 회차, 과목, 문제번호 등) |
| `gh_log` | 학습일지 (Supabase와 동기화됨) |

---

## Supabase 테이블

| 테이블 | 용도 |
|---|---|
| `questions` | 관리자가 추가/수정한 문제 오버라이드 |
| `user_progress` | 유저 답안, 북마크 |
| `study_sessions` | 시험 기록 |
| `study_log` | 학습일지 (year, subject, study_date, ts, user_id) |

---

## 주요 전역 변수 (app.js)

```javascript
var _navMode = 'exam';        // 'exam' | 'jijun' | 'mix' | 'mixpicker'
var _studyLog = [];           // 학습일지 배열
var _eliminations = {};       // 소거 상태 { 'key_idx': true }
var _mixSubjName = '';        // 섞어풀기 선택 과목명
var _mixQuestions = [];       // 섞어풀기 문제 배열
var _mixCurrentQ = 0;         // 섞어풀기 현재 문제 인덱스
var _mixAnswers = {};         // 섞어풀기 답안
var _supa = null;             // Supabase 클라이언트
var _user = null;             // 로그인 유저
```

---

## 답안 키 형식

`year_subjectIdx_qnum` (예: `36_0_1` = 36회 1교시 첫과목 1번)

---

## 네비게이션 도트 CSS 클래스

- `qn` — 미풀이
- `qn current` — 현재 문제
- `qn answered` — 정답
- `qn wrong-q` — 오답

---

## 배포 흐름

1. 코드 수정 (app.js, admin.html, exam_data_*.js 등)
2. GitHub Desktop에서 commit → push
3. Cloudflare Pages 자동 배포 (1~3분 소요)
4. 배포 후 브라우저 강력 새로고침 (Ctrl+Shift+R) 또는 시크릿 창

---

## 과목 구성

**1교시**: 부동산학개론, 민법 및 민사특별법  
**2교시**: 공인중개사법령 및 실무, 부동산공법, 부동산공시법령 및 부동산세법
