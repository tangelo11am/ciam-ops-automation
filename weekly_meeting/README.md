# 🗓️ 주간회의 자동화 (Weekly Meeting Automation)

매주 금요일 오전 8시, 차주 주간회의 준비를 자동으로 마칩니다.

---

## ✅ 주요 기능

- **Confluence 회의록 자동 생성:** 직전 주 회의록을 복사해 날짜/제목을 자동 치환하여 새 페이지 생성
- **Google 캘린더 업데이트:** 해당 날짜 기존 이벤트에 회의록 링크 자동 삽입 (없으면 신규 생성)
- **참석자 안내 메일 발송:** 전 주 캘린더 이벤트의 참석자 목록 기준으로 회의 안내 메일 자동 발송
- **공휴일 자동 처리:** 구글 한국 공휴일 캘린더 + 사내 추가 휴일(`EXTRA_HOLIDAYS`) 반영, 다음 영업일로 자동 이동
- **서면 대체 안내:** `WRITTEN_SUBSTITUTE_DATES`에 날짜 등록 시 서면 대체 안내 메일 및 캘린더 설명 자동 추가

---

## 🏁 1단계: 준비하기 (Setup)

1. **Confluence 토큰 발급:** 프로필 설정 → `API 토큰`에서 발급
2. **부모 페이지 ID 확인:** 연도별 폴더 페이지 주소창의 `pageId=숫자` 메모 → `CONFIG.YEAR_FOLDER_ID`에 입력
3. **Google 캘린더 ID 확인:** 대상 캘린더 설정에서 `c_...`로 시작하는 ID 복사 → `CONFIG.CALENDAR.ID`에 입력

---

## 🛠 2단계: 코드 설치 (Implementation)

1. [script.google.com](https://script.google.com)에서 새 프로젝트 생성
2. `설정(⚙️)` → `스크립트 속성`에 키 `CIAM_Weekly_Report`, 값은 Confluence 토큰 저장
3. `weekly_meeting/main.gs` 전체 내용을 GAS 에디터에 붙여넣기
4. 왼쪽 `서비스 +` → `Google Calendar API` 추가

---

## ⚙️ 3단계: 자동 실행 설정 (Automation)

GAS 에디터에서 `step1_setupTrigger()`를 **최초 1회** 직접 실행합니다.  
→ 매주 금요일 오전 8시에 `main()`이 자동 실행되도록 트리거가 등록됩니다.

| 설정 항목 | 값 |
|---|---|
| 실행 함수 | `main` |
| 이벤트 소스 | 시간 기반 |
| 타이머 유형 | 주간 타이머 |
| 요일/시간 | 매주 금요일 / 오전 8시 |

---

## 🧪 테스트 실행

```
1. CONFIG.TEST_USER_ONLY = true 확인 (기본값)
2. GAS 에디터에서 step2_testRun() 직접 실행
   → 나(실행자)에게만 캘린더 초대 및 안내 메일 발송
3. 결과 확인 후 이상 없으면 CONFIG.TEST_USER_ONLY = false 로 변경
```

---

## 🔧 CONFIG 설정 항목

| 항목 | 설명 |
|---|---|
| `DEBUG_MODE` | `true`로 설정 시 실제 생성/메일 없이 로그만 출력 (dry-run) |
| `TEST_USER_ONLY` | `true`면 실행자 본인에게만 캘린더·메일 적용 |
| `CONFLUENCE.BASE_URL` | Confluence 도메인 주소 |
| `CONFLUENCE.ROOT_ID` | 주간회의 루트 페이지 ID |
| `CONFLUENCE.SPACE_KEY` | Confluence 스페이스 키 |
| `CALENDAR.ID` | 대상 Google 캘린더 ID |
| `CALENDAR.KEYWORD` | 캘린더 이벤트 제목 키워드 (기존 이벤트 검색용) |
| `YEAR_FOLDER_ID` | 연도별 폴더 페이지 ID (새 연도마다 직접 업데이트) |
| `WRITTEN_SUBSTITUTE_DATES` | 서면 대체 날짜 목록 (`"YYYY-MM-DD"` 형식) |
| `EXTRA_HOLIDAYS` | 구글 공휴일 캘린더에 없는 사내 추가 휴일 목록 |

---

## 🐛 디버그 함수

| 함수 | 설명 |
|---|---|
| `debug_calendarEvents()` | 향후 2주 캘린더 이벤트 제목/시간 출력 |
| `debug_latestPage()` | 연도 폴더 내 최신 회의록 페이지 목록 확인 |
| `debug_pageContent()` | 특정 Confluence 페이지 Storage Format 본문 출력 |

---

## ⚠️ 주의사항

1. **보안:** API 토큰은 반드시 **스크립트 속성**에만 저장. 코드/GitHub에 직접 입력 금지.
2. **내부망:** 사내 Confluence API가 Google 서버(외부)에서 호출 가능한지 사전 확인 필요.
3. **공휴일 이동:** 월요일이 공휴일인 경우 화요일 오전 9시로 자동 변경되며, 캘린더 설명에 안내 문구 추가됨. (월요일은 오후 3시, 화요일 이후는 오전 9시)
4. **연도 폴더:** 새 연도가 되면 `CONFIG.YEAR_FOLDER_ID`를 신규 연도 폴더 ID로 직접 업데이트 필요.

---

## ✍️ 담당자

- **Lead:** 박규림
- **Stack:** Google Apps Script, Confluence REST API, Google Calendar API, Gmail API
