# 🛡️ CIAM Operations Automation (CIAM 운영 자동화)

CIAM(Customer Identity and Access Management) 서비스의 반복적인 수동 업무를 자동화하는 도구 모음입니다.

---

## 📂 프로젝트 구조 (Modules)

본 저장소는 여러 자동화 과제를 폴더별로 관리하는 **모노레포(Monorepo)** 구조입니다.

| 모듈 | 상태 | 설명 |
|---|---|---|
| [weekly_meeting](./weekly_meeting/) | ✅ 운영 중 | 주간회의록 자동 생성, 캘린더 업데이트, 참석자 안내 메일 발송 |
| release-notes | 📋 백로그 | Jira 이슈 기반 릴리즈 노트 자동 생성 및 배포 공지 |
| translation-sync | 📋 백로그 | 다국어 번역 메시지 키 관리 및 싱크 자동화 |

---

## 🚀 주간회의 자동화 요약

매주 금요일 오전 8시 자동 실행:

1. 차주 주간회의 날짜 결정 (공휴일 자동 스킵)
2. Confluence 직전 주 회의록 복사 → 날짜/제목 치환 → 새 페이지 생성
3. Google 캘린더 이벤트에 회의록 링크 업데이트
4. 참석자 전체에게 안내 메일 발송

자세한 설정 방법은 **[weekly_meeting/README.md](./weekly_meeting/README.md)** 를 참조하세요.

---

## 🛠️ 공통 환경 설정

### 기술 스택
- **Language:** Google Apps Script (JavaScript)
- **Platform:** Google Workspace (Calendar, Gmail), Atlassian Confluence

### 보안 원칙
모든 API 토큰 및 민감 정보는 각 실행 환경(GAS 스크립트 속성)에 저장하며, **코드 및 GitHub에 직접 입력하지 않습니다.**

---

## 📎 참고 자료

- [아이디어 노트 (Google Docs)](https://docs.google.com/document/d/1DEiaBZHri8-I8dVtkorwzTfA91HSv-B1mEcdujbRWXY/edit?tab=t.9j46cxllq1hn#heading=h.9mrnbv4ifk6v)

---

## ✍️ 담당자

- **Lead:** 박규림 (글로벌IT기획팀)
