/**
 * HEIM ERP — 접수 판정 이메일 발송 Apps Script
 * ------------------------------------------------------------
 * 시트: HEIM_접수_이메일_큐 (id: 1SPGdIsCG2CLJi49XKv_TLkpYmbwLg3rs5HkCc_VMiLA)
 * 배포: hello@heimvi.com 계정으로 Web App 배포 (액세스: "모든 사용자")
 *
 * 흐름:
 *   Vercel 판정 저장 서버 액션 → POST 이 스크립트의 웹앱 URL
 *   ├─ verify SHARED_SECRET
 *   ├─ 시트에 큐 행 append (접수번호, 판정, 기업명, 이메일, ...)
 *   ├─ Gmail 발송 (GO는 캘린더 링크, more_docs는 검토의견 그대로)
 *   └─ 결과 JSON 반환 → Vercel이 email_sent_at / email_error 업데이트
 *
 * 최초 세팅:
 *   1. 이 코드 전체를 시트의 확장 프로그램 → Apps Script 에 붙여넣기
 *   2. 스크립트 속성(Script properties)에 SHARED_SECRET 세팅
 *      - 프로젝트 설정 → 스크립트 속성 → 속성 추가 → SHARED_SECRET / 원하는 랜덤 문자열
 *      - 같은 값을 Vercel env `APPS_SCRIPT_SHARED_SECRET`에도 등록
 *   3. initSetup 함수 한 번 실행 (권한 승인 + 시트 헤더 생성)
 *   4. 배포 → 새 배포 → 유형 "웹 앱" → 실행: 나 / 액세스: 모든 사용자 → 배포
 *   5. 나오는 URL을 Vercel env `APPS_SCRIPT_WEBHOOK_URL` 에 등록
 *   6. 코드 수정 시: 저장 → 배포 → 배포 관리 → 편집 → 새 버전 → 배포
 */

// ============================================================
// 상수
// ============================================================
var SHEET_NAME = 'EmailQueue';
var HEADERS = [
  '시각',
  '접수번호',
  '판정',
  '기업명',
  '수신 이메일',
  '수신 이름',
  '제목',
  '본문 앞부분',
  '상태',
  '에러',
];

// GO 이메일 캘린더 링크 (사장님 세팅)
var CALENDAR_LINK = 'https://calendar.app.google/rPKpB6m3Bc7SPdjY8';

// ============================================================
// initSetup — 최초 1회 실행. 시트 헤더 자동 생성.
// ============================================================
function initSetup() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  // 헤더가 이미 있으면 유지, 없으면 세팅
  var firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var hasHeader = firstRow.some(function (c) { return c === HEADERS[0]; });
  if (!hasHeader) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#F5F1EA');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, HEADERS.length, 160);
    sheet.setColumnWidth(7, 320); // 제목
    sheet.setColumnWidth(8, 500); // 본문 앞부분
  }
  Logger.log('initSetup 완료. 시트: ' + SHEET_NAME);
}

// ============================================================
// doPost — Vercel 판정 저장 서버 액션이 호출하는 엔드포인트
// ============================================================
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);

    // 인증
    var expectedSecret = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
    if (!expectedSecret) {
      return jsonResponse({ ok: false, error: 'SHARED_SECRET not configured on script side' });
    }
    if (payload.secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: 'unauthorized' });
    }

    // 필수 필드
    var required = ['application_no', 'decision', 'company_name', 'to_email', 'to_name'];
    for (var i = 0; i < required.length; i++) {
      if (!payload[required[i]]) {
        return jsonResponse({ ok: false, error: 'missing field: ' + required[i] });
      }
    }
    if (payload.decision !== 'go' && payload.decision !== 'more_docs') {
      return jsonResponse({ ok: false, error: 'invalid decision (must be go|more_docs)' });
    }

    // 이메일 조립
    var mail = buildMail(payload);

    // 시트 append (발송 전 큐 기록)
    var sheet = getOrCreateSheet();
    var now = new Date();
    sheet.appendRow([
      now,
      payload.application_no,
      payload.decision,
      payload.company_name,
      payload.to_email,
      payload.to_name,
      mail.subject,
      mail.body.substring(0, 200),
      '발송중',
      '',
    ]);
    var lastRow = sheet.getLastRow();

    // Gmail 발송
    try {
      GmailApp.sendEmail(payload.to_email, mail.subject, mail.body, {
        name: '하임벤처투자',
        replyTo: 'hello@heimvi.com',
      });
      sheet.getRange(lastRow, 9).setValue('발송완료');
      return jsonResponse({ ok: true, sent_at: now.toISOString() });
    } catch (mailErr) {
      sheet.getRange(lastRow, 9).setValue('실패');
      sheet.getRange(lastRow, 10).setValue(String(mailErr));
      return jsonResponse({ ok: false, error: 'gmail send failed: ' + mailErr });
    }
  } catch (err) {
    return jsonResponse({ ok: false, error: 'exception: ' + err });
  }
}

// GET 확인용 (배포 후 브라우저로 열어서 살아있는지 확인)
function doGet() {
  return jsonResponse({ ok: true, msg: 'HEIM 접수 판정 메일러 alive' });
}

// ============================================================
// 이메일 본문 조립
// ============================================================
function buildMail(p) {
  var greeting = '안녕하세요, ' + p.company_name + ' ' + p.to_name + '님.\n하임벤처투자입니다.\n\n';
  var footer =
    '\n\n————————————\n' +
    '하임벤처투자\n' +
    '문의: hello@heimvi.com | 02-2038-4118\n' +
    'https://heim-erp.vercel.app';

  if (p.decision === 'go') {
    return {
      subject: '[하임벤처투자] ' + p.company_name + ' 님, 프로젝트 진행 확정 안내 (' + p.application_no + ')',
      body:
        greeting +
        '제출해주신 신청서를 검토한 결과, 함께 프로젝트를 진행하기로 결정했습니다.\n\n' +
        '아래 링크에서 초도 미팅 일정을 잡아주세요.\n' +
        CALENDAR_LINK + '\n\n' +
        (p.notes ? '검토 의견:\n' + p.notes + '\n\n' : '') +
        '접수번호: ' + p.application_no +
        footer,
    };
  }

  // more_docs: 검토의견 그대로 본문에 삽입
  return {
    subject: '[하임벤처투자] ' + p.company_name + ' 님, 추가 자료 요청 (' + p.application_no + ')',
    body:
      greeting +
      '제출해주신 신청서를 검토했습니다. 판단을 위해 아래 자료가 추가로 필요합니다.\n\n' +
      (p.notes || '(자료 목록 미기재)') + '\n\n' +
      '준비되시면 이 이메일에 회신으로 첨부 부탁드립니다.\n\n' +
      '접수번호: ' + p.application_no +
      footer,
  };
}

// ============================================================
// 헬퍼
// ============================================================
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#F5F1EA');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// 로컬 테스트 (Apps Script 편집기에서 직접 실행 가능)
// ============================================================
function testGo() {
  var mail = buildMail({
    application_no: 'HEIM-APP-2026-9999',
    decision: 'go',
    company_name: '테스트회사',
    to_email: 'hello@heimvi.com',
    to_name: '홍길동',
    notes: '초도 미팅에서 시장 규모 근거 재확인 필요',
  });
  Logger.log('=== 제목 ===\n' + mail.subject);
  Logger.log('=== 본문 ===\n' + mail.body);
}

function testMoreDocs() {
  var mail = buildMail({
    application_no: 'HEIM-APP-2026-9999',
    decision: 'more_docs',
    company_name: '테스트회사',
    to_email: 'hello@heimvi.com',
    to_name: '홍길동',
    notes: '- 최근 3개월 매출 자료\n- 주주명부\n- 특허/인증 사본',
  });
  Logger.log('=== 제목 ===\n' + mail.subject);
  Logger.log('=== 본문 ===\n' + mail.body);
}
