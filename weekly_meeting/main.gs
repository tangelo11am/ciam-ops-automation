/**
 * CIAM 주간회의 운영 자동화
 *
 * ─────────────────────────────────────────────
 * [실행 순서 가이드]
 *
 * ① 최초 1회 (트리거 등록)
 *    step1_setupTrigger()
 *    → 매주 금요일 오전 8시 자동 실행 등록
 *
 * ② 테스트 실행 (TEST_USER_ONLY: true 확인 후)
 *    step2_testRun()
 *    → 나에게만 캘린더 초대, 공유 캘린더에 반영
 *
 * ③ 실제 운영 (TEST_USER_ONLY: false 변경 후 자동 실행)
 *    main()
 *    → 전체 참석자에게 캘린더 초대 및 캘린더 반영
 *
 * ─────────────────────────────────────────────
 * [디버그 함수]
 *    debug_calendarEvents() → 캘린더 이벤트 제목/시간 확인
 *    debug_pageContent()    → Confluence 페이지 Storage Format 확인
 *
 * ─────────────────────────────────────────────
 * [서면 대체 설정]
 *    CONFIG.WRITTEN_SUBSTITUTE_DATES 배열에 날짜 추가 (형식: "YYYY-MM-DD")
 * ─────────────────────────────────────────────
 */

const CONFIG = {
  DEBUG_MODE: false,
  TEST_USER_ONLY: true, // ⚠️ 테스트 완료 후 false로 바꾸세요.
  CONFLUENCE: {
    BASE_URL: "https://wiki.coway.com",
    ROOT_ID: "111706891", // '01. 주간 회의' ID
    SPACE_KEY: "CWIDWKS"
  },
  CALENDAR: {
    ID: "c_3e052dac82d4cdcf8d71ceafede059acfbac8b7b0b26f556d5bbf868e7848594@group.calendar.google.com",
    KEYWORD: "[통합회원] 주간회의"
  },
  // 연도별 폴더 ID (새 연도가 되면 직접 업데이트)
  YEAR_FOLDER_ID: "249247515", // _2026년 주간회의
  // 서면 대체 날짜 목록 (형식: "YYYY-MM-DD")
  // 해당 날짜 주간회의는 캘린더에 서면 대체 안내가 추가됩니다.
  WRITTEN_SUBSTITUTE_DATES: [
    "2026-04-27"
  ],
  // 구글 공휴일 캘린더에 없는 사내 휴일 (형식: "YYYY-MM-DD")
  // 해당 날짜는 공휴일로 처리되어 다음날로 일정이 이동됩니다.
  EXTRA_HOLIDAYS: [
    "2026-05-04" // 창립기념일 대체휴무
  ]
};

// ─────────────────────────────────────────────
// ① 트리거 등록 (최초 1회만 실행)
// ─────────────────────────────────────────────
function step1_setupTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'main')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('main')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.FRIDAY)
    .atHour(8)
    .create();

  console.log("✅ 매주 금요일 오전 8시 트리거 등록 완료");
}

// ─────────────────────────────────────────────
// ② 테스트 실행 (TEST_USER_ONLY: true 상태에서 실행)
// ─────────────────────────────────────────────
function step2_testRun() {
  console.log("🧪 테스트 모드로 main() 실행합니다.");
  main();
}

// ─────────────────────────────────────────────
// ③ 메인 함수 (트리거에 의해 매주 금요일 자동 실행)
// ─────────────────────────────────────────────
function main() {
  try {
    const token = PropertiesService.getScriptProperties().getProperty('CIAM_Weekly_Report');
    if (!token) throw new Error("토큰을 등록해주세요.");

    // 1. 날짜 결정
    let targetDate = getNextMonday();
    while (isHoliday(targetDate)) { targetDate.setDate(targetDate.getDate() + 1); }

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;
    const week = getMonthWeekNumber(targetDate);

    const newTitle = `[${year}.${month}.${week}주] 통합회원 주간회의`;
    const yearFolderName = `_${year}년 주간회의`;

    console.log(`📋 실행 목표: ${newTitle} (${targetDate.toLocaleDateString('ko-KR')})`);

    // 2. 연도별 폴더 ID 확보 (CONFIG.YEAR_FOLDER_ID 직접 사용)
    const yearPageId = CONFIG.YEAR_FOLDER_ID;

    // 3. 이전 페이지 복사 (폴더 내부 우선, 없으면 루트에서 검색)
    let latestPage = getLatestChildPage(yearPageId, token) || getLatestChildPage(CONFIG.CONFLUENCE.ROOT_ID, token);

    let finalContent = "";
    if (latestPage) {
      console.log(`📄 복사 원본 발견: ${latestPage.title}`);
      const originalContent = getPageStorageContent(latestPage.id, token);
      finalContent = replaceDatesInContent(originalContent, latestPage.title, newTitle, targetDate);
    } else {
      finalContent = "<p>이전 문서를 찾지 못해 새 본문을 생성했습니다.</p>";
    }

    // 4. 실행
    if (CONFIG.DEBUG_MODE) {
      console.log(`[DRY-RUN] 제목: ${newTitle} 생성 예정`);
    } else {
      const pageUrl = createConfluencePage(newTitle, yearPageId, finalContent, token);
      console.log("🔗 컨플루언스 페이지 생성 완료: " + pageUrl);

      const attendeeEmails = CONFIG.TEST_USER_ONLY ? [Session.getActiveUser().getEmail()] : getAttendeesFromLastEvent();

      // 서면 대체 여부 확인
      const dateKey = `${year}-${String(month).padStart(2,'0')}-${String(targetDate.getDate()).padStart(2,'0')}`;
      const isWrittenSubstitute = CONFIG.WRITTEN_SUBSTITUTE_DATES.includes(dateKey);

      updateSmartCalendarEvent(targetDate, newTitle, pageUrl, attendeeEmails, isWrittenSubstitute);
    }
  } catch (e) {
    console.error("❌ 에러: " + e.message);
  }
}

// ─────────────────────────────────────────────
// [디버그 함수]
// ─────────────────────────────────────────────
function debug_calendarEvents() {
  const cal = CalendarApp.getCalendarById(CONFIG.CALENDAR.ID);
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(start.getDate() + 14);
  cal.getEvents(start, end).forEach(e => {
    console.log(`제목: "${e.getTitle()}" | 시작: ${e.getStartTime()}`);
  });
}

function debug_latestPage() {
  const token = PropertiesService.getScriptProperties().getProperty('CIAM_Weekly_Report');

  // YEAR_FOLDER_ID로 직접 하위 페이지 조회
  const folderData = confluenceGet(
    `/rest/api/content/${CONFIG.YEAR_FOLDER_ID}/child/page?limit=50&orderby=history.createdDate+desc`, token
  );
  console.log(`연도 폴더(${CONFIG.YEAR_FOLDER_ID}) 내 페이지 목록 (${folderData.results.length}개):`);
  folderData.results.forEach(p => console.log(`  - ${p.title} (${p.id})`));

  const pages = folderData.results.filter(p => /\[?\d+\.\d+(?:\.\d+)?주\]?/.test(p.title));
  console.log(`주간회의 형식 페이지: ${pages.length > 0 ? pages[0].title : '없음'}`);
}

function debug_pageContent() {
  const token = PropertiesService.getScriptProperties().getProperty('CIAM_Weekly_Report');
  const pageId = "312348540";
  const data = JSON.parse(UrlFetchApp.fetch(
    `https://wiki.coway.com/rest/api/content/${pageId}?expand=body.storage`,
    { headers: { 'Authorization': 'Bearer ' + token } }
  ).getContentText());
  console.log(data.body.storage.value);
}

// ─────────────────────────────────────────────
// [보조 함수: 날짜 치환]
// ─────────────────────────────────────────────
function replaceDatesInContent(content, oldTitle, newTitle, newDate) {
  // [YYYY.M.N주], [YYYY.M주], YYYY.M.N주, YYYY.M주 형식 모두 매칭
  const m = oldTitle.match(/\[?(\d+)\.(\d+)(?:\.(\d+))?주\]?/);
  let result = content;

  const newYear = newDate.getFullYear();
  const newMonth = newDate.getMonth() + 1;
  const newWeek = getMonthWeekNumber(newDate);
  const newAttr = `${newYear}-${String(newMonth).padStart(2,'0')}-${String(newDate.getDate()).padStart(2,'0')}`;

// 1) 타이틀: "YYYY.M.N주" 또는 "YYYY.M주" 형식 모두 치환 (대괄호 유무 무관)
  result = result.replace(/\[?\d{4}\.\d{1,2}(?:\.\d+)?주\]?/g,
    `[${newYear}.${newMonth}.${newWeek}주]`
  );

  // 2) 일시: <time datetime="YYYY-MM-DD" /> self-closing 태그 치환
  result = result.replace(/<time\s+datetime="\d{4}-\d{2}-\d{2}"\s*\/>/g,
    `<time datetime="${newAttr}" />`
  );

  // 3) 회의 주제: "YYYY.M월 N주차" 형식 치환 (연도/월 무관하게 모두 치환)
  result = result.replace(/\d{4}\.\d{1,2}월\s*\d+주차/g,
    `${newYear}.${newMonth}월 ${newWeek}주차`
  );

  return result;
}

// ─────────────────────────────────────────────
// [보조 함수: 캘린더 업데이트]
// ─────────────────────────────────────────────
function updateSmartCalendarEvent(start, title, url, attendees, isWrittenSubstitute) {
  const cal = CalendarApp.getCalendarById(CONFIG.CALENDAR.ID);

  // 월요일은 오후 3시, 공휴일로 밀린 날(화요일 이후)은 오전 10시
  const startHour = start.getDay() === 1 ? 15 : 9;
  const startTime = new Date(start); startTime.setHours(startHour, 0, 0, 0);
  const endTime = new Date(start); endTime.setHours(startHour + 1, 0, 0, 0);

  // 해당 날짜 기존 이벤트 검색
  const dayStart = new Date(start); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(start); dayEnd.setHours(23, 59, 59, 999);
  const existing = cal.getEvents(dayStart, dayEnd).filter(e =>
    e.getTitle().includes(CONFIG.CALENDAR.KEYWORD)
  );

  const writtenNotice = isWrittenSubstitute ? "📢 이번 주 회의는 서면으로 대체합니다.\n\n" : "";
  const holidayNotice = start.getDay() !== 1 ? "\n\n(참고: 공휴일로 인해 일정이 변경되었습니다. 회의실 예약을 확인해주세요.)" : "";
  const desc = `${writtenNotice}${title} : ${url}${holidayNotice}`;

  let event;
  if (existing.length > 0) {
    event = existing[0];
    event.setDescription(desc);
    console.log(`📅 기존 일정 설명 업데이트: ${event.getTitle()}`);
  } else {
    event = cal.createEvent(CONFIG.CALENDAR.KEYWORD, startTime, endTime, {
      description: desc,
      location: "회의실 미정"
    });
    console.log(`📅 새 일정 생성: ${title}`);
  }

  // 캘린더 이벤트 URL 가져오기 (Calendar 고급 서비스)
  let eventUrl = "";
  try {
    const calId = CONFIG.CALENDAR.ID;
    const eventDetail = Calendar.Events.get(calId, event.getId().replace('@google.com', ''));
    eventUrl = eventDetail.htmlLink || "";
  } catch(e) {
    console.error(`⚠️ 이벤트 URL 조회 실패: ${e.message}`);
  }

  // 참석자 목록
  const recipients = CONFIG.TEST_USER_ONLY ? [Session.getActiveUser().getEmail()] : attendees;

  // 일시 포맷
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
  const dateStr = startTime.toLocaleDateString('ko-KR', dateOptions);
  const timeStr = startHour < 12 ? `오전 ${startHour}:00 ~ ${startHour + 1}:00` : `오후 ${startHour}:00 ~ ${startHour + 1}:00`;
  const location = existing.length > 0 ? (existing[0].getLocation() || "회의실 미정") : "회의실 미정";

  // 메일 본문 작성
  let subject, body;
  if (isWrittenSubstitute) {
    subject = `[통합회원 주간회의] ${title} 서면 대체 안내`;
    body = `안녕하세요.

다음 주 통합회원 주간회의는 서면으로 대체됩니다.
회의록 링크에서 내용을 확인해 주세요.

[일시] ${dateStr}
[회의록] ${url}

감사합니다.
글로벌IT기획팀`;
  } else {
    subject = `[통합회원 주간회의] ${title} 안내 및 참석 여부 확인 요청`;
    body = `안녕하세요.

다음 주 통합회원 주간회의 일정을 안내드립니다.

[일시] ${dateStr} ${timeStr}
[장소] ${location}
[회의록] ${url}

--------------------------------------------------
참석 여부를 아래 캘린더 링크에서 업데이트해 주세요.
회의 전날까지 응답해 주시면 감사하겠습니다.

캘린더 일정 확인 및 참석 여부 업데이트: ${eventUrl}
--------------------------------------------------

감사합니다.
글로벌IT기획팀`;
  }

  try {
    recipients.forEach(email => GmailApp.sendEmail(email, subject, body));
    console.log(`📧 참석자 ${recipients.length}명에게 안내 메일 발송 완료.`);
  } catch(mailErr) {
    console.error(`⚠️ 메일 발송 중 오류: ${mailErr.message}`);
  }
}

// ─────────────────────────────────────────────
// [날짜 유틸 함수]
// ─────────────────────────────────────────────
function getNextMonday() {
  // 금요일에 실행되므로 다음 주 월요일(+3일)을 대상 날짜로 반환
  const today = new Date();
  const day = today.getDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  const next = new Date(today);
  next.setDate(today.getDate() + daysUntilMonday);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isHoliday(date) {
  // 사내 추가 휴일 체크
  const dateKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  if (CONFIG.EXTRA_HOLIDAYS.includes(dateKey)) return true;

  // 구글 한국 공휴일 캘린더 체크
  const holidayCal = CalendarApp.getCalendarById('ko.south_korea#holiday@group.v.calendar.google.com');
  if (!holidayCal) return false;
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
  return holidayCal.getEvents(dayStart, dayEnd).length > 0;
}

function getMonthWeekNumber(date) {
  // 해당 월에서 date까지 월요일이 몇 번 나왔는지 카운트
  let count = 0;
  const temp = new Date(date.getFullYear(), date.getMonth(), 1);
  while (temp <= date) {
    if (temp.getDay() === 1) count++;
    temp.setDate(temp.getDate() + 1);
  }
  return count;
}

// ─────────────────────────────────────────────
// [Confluence API 함수]
// ─────────────────────────────────────────────
function confluenceGet(path, token) {
  const res = UrlFetchApp.fetch(`${CONFIG.CONFLUENCE.BASE_URL}${path}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) {
    throw new Error(`Confluence GET 실패 (${res.getResponseCode()}): ${path}`);
  }
  return JSON.parse(res.getContentText());
}

function confluencePost(path, payload, token) {
  const res = UrlFetchApp.fetch(`${CONFIG.CONFLUENCE.BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) {
    throw new Error(`Confluence POST 실패 (${res.getResponseCode()}): ${path}\n${res.getContentText()}`);
  }
  return JSON.parse(res.getContentText());
}

function getOrCreateYearFolder(rootId, folderName, token) {
  const data = confluenceGet(`/rest/api/content/${rootId}/child/page?limit=50`, token);
  const found = data.results.find(p => p.title === folderName);
  if (found) {

    
    console.log(`📁 연도 폴더 발견: ${folderName} (${found.id})`);
    return found.id;
  }
  const newPage = confluencePost('/rest/api/content', {
    type: 'page',
    title: folderName,
    ancestors: [{ id: rootId }],
    space: { key: CONFIG.CONFLUENCE.SPACE_KEY },
    body: { storage: { value: '', representation: 'storage' } }
  }, token);
  console.log(`📁 연도 폴더 생성: ${folderName} (${newPage.id})`);
  return newPage.id;
}

function getLatestChildPage(parentId, token) {
  const data = confluenceGet(
    `/rest/api/content/${parentId}/child/page?limit=50`, token
  );

  // 제목에서 연.월.주차 파싱하여 정렬값 계산
  function parseTitleScore(title) {
    const m = title.match(/(\d{4})\.(\d{1,2})(?:\.(\d+))?주/);
    if (!m) return -1;
    const year = parseInt(m[1]);
    const month = parseInt(m[2]);
    const week = m[3] ? parseInt(m[3]) : 0;
    return year * 10000 + month * 100 + week;
  }

  const pages = data.results
    .filter(p => parseTitleScore(p.title) > 0)
    .sort((a, b) => parseTitleScore(b.title) - parseTitleScore(a.title));

  return pages.length > 0 ? pages[0] : null;
}

function getPageStorageContent(pageId, token) {
  const data = confluenceGet(`/rest/api/content/${pageId}?expand=body.storage`, token);
  return data.body.storage.value;
}

function createConfluencePage(title, parentId, content, token) {
  // 동일 제목 페이지가 있으면 업데이트, 없으면 신규 생성
  const search = confluenceGet(
    `/rest/api/content?title=${encodeURIComponent(title)}&spaceKey=${CONFIG.CONFLUENCE.SPACE_KEY}&expand=version`, token
  );

  if (search.results && search.results.length > 0) {
    const existing = search.results[0];
    const res = UrlFetchApp.fetch(`${CONFIG.CONFLUENCE.BASE_URL}/rest/api/content/${existing.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        id: existing.id,
        type: 'page',
        title: title,
        version: { number: existing.version.number + 1 },
        body: { storage: { value: content, representation: 'storage' } }
      }),
      muteHttpExceptions: true
    });
    const pageData = JSON.parse(res.getContentText());
    console.log(`📄 기존 페이지 업데이트: ${title}`);
    return `${CONFIG.CONFLUENCE.BASE_URL}${pageData._links.tinyui}`;
  }

  const newPage = confluencePost('/rest/api/content', {
    type: 'page',
    title: title,
    ancestors: [{ id: parentId }],
    space: { key: CONFIG.CONFLUENCE.SPACE_KEY },
    body: { storage: { value: content, representation: 'storage' } }
  }, token);
  console.log(`📄 새 페이지 생성: ${title}`);
  return `${CONFIG.CONFLUENCE.BASE_URL}${newPage._links.tinyui}`;
}

// ─────────────────────────────────────────────
// [캘린더 참석자 함수]
// ─────────────────────────────────────────────
function getAttendeesFromLastEvent() {
  const cal = CalendarApp.getCalendarById(CONFIG.CALENDAR.ID);
  const now = new Date();
  const past = new Date(now);
  past.setDate(now.getDate() - 14);
  const events = cal.getEvents(past, now)
    .filter(e => e.getTitle().includes(CONFIG.CALENDAR.KEYWORD))
    .sort((a, b) => b.getStartTime() - a.getStartTime());

  if (events.length === 0) {
    console.log("⚠️ 이전 캘린더 이벤트를 찾지 못했습니다. 참석자 없이 진행합니다.");
    return [];
  }
  return events[0].getGuestList().map(g => g.getEmail());
}

// 4/27 문서의 잘못된 날짜(1월) 수정
function once_fixApr27PageDate() {
  const token = PropertiesService.getScriptProperties().getProperty('CIAM_Weekly_Report');
  const pageId = "312348540";
  const baseUrl = CONFIG.CONFLUENCE.BASE_URL;

  // 1. 페이지 내용 및 버전 조회
  const getRes = UrlFetchApp.fetch(`${baseUrl}/rest/api/content/${pageId}?expand=body.storage,version`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    muteHttpExceptions: true
  });

  console.log(`GET 응답 코드: ${getRes.getResponseCode()}`);
  if (getRes.getResponseCode() !== 200) {
    console.error("❌ 페이지 조회 실패: " + getRes.getContentText());
    return;
  }

  const data = JSON.parse(getRes.getContentText());
  let content = data.body.storage.value;
  const version = data.version.number;
  console.log(`현재 버전: ${version}, 제목: ${data.title}`);

  // 2. 날짜 수정
  const before = content;
  content = content.replace(/<time\s+datetime="\d{4}-\d{2}-\d{2}"\s*\/>/g, '<time datetime="2026-04-27" />');
  content = content.replace(/2026\.\d+월\s*\d+주차/g, '2026.4월 4주차');
  console.log(`내용 변경 여부: ${before !== content}`);

  // 3. 페이지 업데이트
  const putRes = UrlFetchApp.fetch(`${baseUrl}/rest/api/content/${pageId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    payload: JSON.stringify({
      id: pageId,
      type: 'page',
      title: data.title,
      version: { number: version + 1 },
      body: { storage: { value: content, representation: 'storage' } }
    }),
    muteHttpExceptions: true
  });

  console.log(`PUT 응답 코드: ${putRes.getResponseCode()}`);
  if (putRes.getResponseCode() === 200) {
    console.log("✅ 4/27 문서 날짜 수정 완료 (1월 → 4월)");
  } else {
    console.error("❌ 수정 실패: " + putRes.getContentText());
  }
}

//end of file
