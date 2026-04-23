# ciam-ops-automation
ciam(Customer Identity and Access Management) 자동화 
# 🛡️ CIAM Operations Automation (CIAM 운영 자동화)

CIAM(Customer Identity and Access Management) 서비스의 운영 효율화를 위한 자동화 도구 모음입니다. 
분산된 운영 데이터를 통합하고, 반복되는 수동 프로세스를 자동화하여 업무 생산성을 높이는 것을 목표로 합니다.

---

## 📂 프로젝트 구조 (Modules)

본 저장소는 여러 자동화 과제를 폴더별로 관리하는 **모노레포(Monorepo)** 구조입니다.

### 1. [Weekly Meeting](./weekly-meeting/) (진행 중)
- **목적:** 주간회의록 자동 생성 및 구글 캘린더 연동
- **도구:** Google Apps Script, Confluence API, Calendar API
- **상태:** Phase 2 - 코드 구현 중

### 2. Release Notes (예정)
- **목적:** Jira 이슈 기반 릴리즈 노트 자동 생성 및 배포 공지
- **상태:** 백로그

### 3. Translation Management (예정)
- **목적:** 다국어 번역 메시지 키 관리 및 싱크 자동화
- **상태:** 백로그

---

## 🛠️ 공통 환경 설정 (Global Setup)

### 1. 인증 및 보안
모든 스크립트의 API 토큰 및 민감 정보는 각 실행 환경(GAS 스크립트 속성 등)에 저장하며, **절대 코드 내에 하드코딩하지 않습니다.**

### 2. 주요 기술 스택
- **Language:** Google Apps Script (JavaScript), Python
- **Platform:** GitHub, Google Workspace, Atlassian (Jira/Confluence)

---

## 📖 사용 방법 (How to Use)
각 하위 폴더의 README를 참조하여 개별 모듈 설정을 진행하세요.

1. 이 저장소를 클론합니다.
   ```bash
   git clone [https://github.com/사용자계정/ciam-ops-automation.git](https://github.com/사용자계정/ciam-ops-automation.git)


ciam-ops-automation/
├── README.md                # 프로젝트 전체 개요 및 가이드
├── .gitignore               # 업로드 제외 설정
├── weekly-meeting/          # [과제 1] 주간회의 자동화 (현재 진행 중)
│   ├── main.gs
│   └── calendar.gs
├── release-notes/           # [과제 2] 릴리즈 노트 자동 생성 (예정)
│   └── jira-sync.gs
└── translation-management/  # [과제 3] 번역 메시지 관리 (예정)
    └── sheet-api.gs
    

### 💡 PM의 팁: 마크다운(Markdown) 꿀팁
* `#`: 제목 (개수가 많아질수록 하위 제목)
* `*` 또는 `-`: 불렛 포인트
* `` `코드` ``: 짧은 코드 강조
* `[텍스트](경로)`: 하이퍼링크
