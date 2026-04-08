/**
 * AI秘書 - Googleカレンダー連携 (Google Apps Script)
 *
 * 設定方法:
 * 1. https://script.google.com で新規プロジェクト作成
 * 2. このコードを貼り付け
 * 3. CALENDAR_ID を自分のメールアドレスに変更
 * 4. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」
 *    - 実行するユーザー: 自分
 *    - アクセス: 全員
 * 5. 表示されたURLをコピーしてVercel環境変数 GAS_CALENDAR_URL に設定
 */

const CALENDAR_ID = 'salt.nabase@gmail.com';

// ===== GET: イベント取得 =====
function doGet(e) {
  try {
    const action = e.parameter.action || 'list';
    const days = parseInt(e.parameter.days || '7');

    if (action === 'list') {
      return jsonResponse(listEvents(days));
    }

    if (action === 'today') {
      return jsonResponse(listEvents(1));
    }

    if (action === 'month') {
      return jsonResponse(listEvents(30));
    }

    return jsonResponse({ error: 'Unknown action' });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// ===== POST: イベント作成・更新・削除 =====
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'create';

    if (action === 'create') {
      const result = createEvent(data);
      return jsonResponse(result);
    }

    if (action === 'update') {
      const result = updateEvent(data);
      return jsonResponse(result);
    }

    if (action === 'delete') {
      const result = deleteEvent(data.eventId);
      return jsonResponse(result);
    }

    if (action === 'search') {
      const result = searchEvents(data.query, data.days || 30);
      return jsonResponse(result);
    }

    return jsonResponse({ error: 'Unknown action' });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// ===== イベント一覧取得 =====
function listEvents(days) {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    return { error: 'Calendar not found', events: [] };
  }

  const now = new Date();
  const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const events = calendar.getEvents(now, endDate);

  return {
    status: 'ok',
    count: events.length,
    events: events.map(formatEvent)
  };
}

// ===== イベント作成 =====
function createEvent(data) {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    return { error: 'Calendar not found' };
  }

  let event;

  if (data.allDay) {
    // 終日イベント
    const date = new Date(data.date);
    event = calendar.createAllDayEvent(data.title, date);
  } else {
    // 時間指定イベント
    const start = new Date(data.start);
    const end = data.end ? new Date(data.end) : new Date(start.getTime() + 60 * 60 * 1000); // デフォルト1時間
    event = calendar.createEvent(data.title, start, end);
  }

  if (data.description) {
    event.setDescription(data.description);
  }

  if (data.location) {
    event.setLocation(data.location);
  }

  return {
    status: 'ok',
    event: formatEvent(event)
  };
}

// ===== イベント更新 =====
function updateEvent(data) {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    return { error: 'Calendar not found' };
  }

  const event = calendar.getEventById(data.eventId);
  if (!event) {
    return { error: 'Event not found' };
  }

  if (data.title) event.setTitle(data.title);
  if (data.description) event.setDescription(data.description);
  if (data.location) event.setLocation(data.location);
  if (data.start && data.end) {
    event.setTime(new Date(data.start), new Date(data.end));
  }

  return {
    status: 'ok',
    event: formatEvent(event)
  };
}

// ===== イベント削除 =====
function deleteEvent(eventId) {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    return { error: 'Calendar not found' };
  }

  const event = calendar.getEventById(eventId);
  if (!event) {
    return { error: 'Event not found' };
  }

  const title = event.getTitle();
  event.deleteEvent();

  return {
    status: 'ok',
    message: `「${title}」を削除しました`
  };
}

// ===== イベント検索 =====
function searchEvents(query, days) {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    return { error: 'Calendar not found', events: [] };
  }

  const now = new Date();
  const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const events = calendar.getEvents(now, endDate, { search: query });

  return {
    status: 'ok',
    query: query,
    count: events.length,
    events: events.map(formatEvent)
  };
}

// ===== イベントをJSON形式に変換 =====
function formatEvent(event) {
  return {
    id: event.getId(),
    title: event.getTitle(),
    start: event.getStartTime().toISOString(),
    end: event.getEndTime().toISOString(),
    allDay: event.isAllDayEvent(),
    description: event.getDescription() || '',
    location: event.getLocation() || '',
    creators: event.getCreators(),
  };
}

// ===== JSON レスポンス =====
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== テスト用 =====
function testListEvents() {
  const result = listEvents(7);
  Logger.log(JSON.stringify(result, null, 2));
}

function testCreateEvent() {
  const result = createEvent({
    title: 'テスト予定',
    start: new Date().toISOString(),
    end: new Date(Date.now() + 3600000).toISOString(),
    description: 'AI秘書から作成'
  });
  Logger.log(JSON.stringify(result, null, 2));
}
