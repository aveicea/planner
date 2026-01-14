# Notion Planner Widget

노션 PLANNER 데이터베이스를 위한 바탕화면 위젯

## 🚀 사용법

### 웹 버전
https://handy0125.github.io/notion-planner

### 로컬 실행

**중요**: `index.html`을 직접 브라우저에서 여는 방식(`file://` 프로토콜)은 CORS 정책으로 인해 **작동하지 않습니다**.

**올바른 실행 방법**:

1. **VS Code Live Server** (권장)
   - VS Code에서 Live Server 확장 설치
   - `index.html` 우클릭 → "Open with Live Server"

2. **Python HTTP 서버**
   ```bash
   # Python 3
   python -m http.server 8000
   # 브라우저에서 http://localhost:8000 접속
   ```

3. **Node.js http-server**
   ```bash
   npx http-server -p 8000
   # 브라우저에서 http://localhost:8000 접속
   ```

4. **Electron 앱** (CORS 제한 없음)
   ```bash
   npm install
   npm start
   ```

## ⚙️ 설정

`widget.js` 파일에서 API Key와 Database ID가 설정되어 있습니다.

## 📋 기능

- ⏰ **TIME TABLE 뷰**: 시간대별 일정 관리
  - 시작/끝 시간 입력
  - 집중도 평가 (별점)
  - 목표/실제/계획 시간 추적
  
- 📋 **TASK 뷰**: 우선순위별 할일 관리
  - 드래그로 우선순위 변경
  - 날짜별 필터링
  
- ✅ **기본 기능**
  - 체크박스로 완료 표시
  - 📅 달력으로 날짜 변경 시 자동 복제 (제목에 ' 추가)
  - 🔄 5분 자동 새로고침
  - ⭐️ 집중도 평가 (..., ⭐️, ⭐️⭐️, ⭐️⭐️⭐️, 🌟🌟🌟)
  - 🎯 목표 대비 실제 시간 차이 표시

- 📝 **할일 편집**
  - 제목 클릭하여 상세 편집
  - 복제 버튼으로 할일 복제 (제목에 (2), (3) 추가)
  - 삭제 기능
  - 책 연결 및 목표 시간 설정

## 🔧 문제 해결

### ❌ "Failed to fetch" 오류가 나타날 때

이 오류는 다음과 같은 이유로 발생할 수 있습니다:

1. **CORS 문제** (가장 흔한 원인)
   - 증상: `file://` 프로토콜로 index.html을 직접 열었을 때
   - 해결: 위의 "로컬 실행" 섹션의 방법대로 로컬 서버 사용

2. **인터넷 연결 문제**
   - 증상: 네트워크 연결이 끊김
   - 해결: 인터넷 연결 확인, 자동으로 3회까지 재시도됩니다

3. **API 키 만료**
   - 증상: HTTP 401 오류
   - 해결: Notion에서 새 API 키 발급 후 `widget.js` 업데이트

4. **데이터베이스 ID 오류**
   - 증상: HTTP 404 오류
   - 해결: `widget.js`의 `DATABASE_ID` 확인

5. **API 요청 한도 초과**
   - 증상: HTTP 429 오류
   - 해결: 잠시 후 다시 시도

### 🔍 개발자 도구로 확인하기

1. 브라우저에서 F12 눌러 개발자 도구 열기
2. Console 탭에서 자세한 오류 메시지 확인
3. Network 탭에서 API 요청 상태 확인

## 🔒 보안 주의

**⚠️ 중요: CORS 프록시 사용 중**

현재 GitHub Pages에서 작동하도록 **CORS 프록시**(corsproxy.io)를 사용하고 있습니다.

**보안 위험:**
- API 키가 프록시 서버를 통과합니다
- 제3자 서비스를 통해 모든 요청이 라우팅됩니다
- **개인 사용만 권장합니다**

**더 안전한 대안:**
1. **Electron 앱 사용** (CORS 제한 없음, 가장 안전)
   ```bash
   npm install
   npm start
   ```

2. **로컬 서버 사용** (Live Server, Python 등)
   - API 키가 프록시를 거치지 않음

3. **백엔드 서버 구축** (프로덕션용)
   - Cloudflare Workers
   - Vercel/Netlify Functions
   - 자체 백엔드 서버

**API Key 노출:**
- API 키가 코드에 하드코딩되어 있습니다
- 공개 배포 시 환경 변수 사용 필요

## 📦 Electron 앱 버전

로컬에서 데스크톱 앱으로 실행:
```bash
npm install
npm start
```

## 🛠 기술 스택

- Vanilla JavaScript
- Notion API
- Electron (데스크톱 버전)

## 📱 노션 임베드

노션 페이지에서:
```
/embed https://handy0125.github.io/notion-planner
```

## 🎨 주요 화면

### TIME TABLE 뷰
- 날짜별 일정 확인
- 시간대별 정렬
- 완료 안 한 일이 먼저 표시

### TASK 뷰  
- 우선순위별 정렬
- 드래그로 순서 변경
- 날짜 필터링

## 📝 업데이트 내역

### v1.1.0 (2026-01-14)
- 🔧 **CORS 문제 해결**: corsproxy.io를 통한 GitHub Pages 지원
- 🔄 **재시도 로직 추가**: 네트워크 오류 시 자동 재시도 (3회, exponential backoff)
- 📊 **상세 오류 메시지**: 각 오류 유형별 구체적인 안내
- 📚 **README 업데이트**: 문제 해결 가이드 및 보안 주의사항 추가

### v1.0.0 (2026-01-14)
- 초기 릴리즈
- TIME TABLE / TASK 뷰
- 할일 추가/편집/삭제/복제
- 날짜 변경 시 자동 복제
- 집중도 평가
- 실시간 노션 동기화
