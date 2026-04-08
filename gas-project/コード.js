var CALENDAR_ID = 'salt.nbase@gmail.com';

// ========================================
// 環境変数（スクリプトプロパティ）
// ========================================
var PROPS = PropertiesService.getScriptProperties();
var SUPABASE_URL = PROPS.getProperty('SUPABASE_URL') || 'https://cgfkzlsndrnwoczinstt.supabase.co';
var SUPABASE_KEY = PROPS.getProperty('SUPABASE_KEY') || '';
var LINE_TOKEN = PROPS.getProperty('LINE_TOKEN') || '';
var GEMINI_KEY = PROPS.getProperty('GEMINI_KEY') || '';
var OWNER_EMAIL = PROPS.getProperty('OWNER_EMAIL') || 'salt.nbase@gmail.com';

// ========================================
// Supabase / LINE ヘルパー
// ========================================
function supabaseQuery(table, params) {
  var url = SUPABASE_URL + '/rest/v1/' + table;
  if (params) url += '?' + params;
  var res = UrlFetchApp.fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
    },
    muteHttpExceptions: true
  });
  return JSON.parse(res.getContentText());
}

function supabaseRpc(functionName, body) {
  var url = SUPABASE_URL + '/rest/v1/rpc/' + functionName;
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify(body || {}),
    muteHttpExceptions: true
  });
  return JSON.parse(res.getContentText());
}

function linePush(userId, text) {
  if (!userId || !LINE_TOKEN) return;
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + LINE_TOKEN,
    },
    payload: JSON.stringify({
      to: userId,
      messages: [{ type: 'text', text: String(text).substring(0, 4999) }]
    }),
    muteHttpExceptions: true
  });
}

function getOwner() {
  var users = supabaseQuery('users', 'role=eq.owner&is_active=eq.true&limit=1');
  return (users && users.length > 0) ? users[0] : null;
}

function getActiveStaff() {
  var users = supabaseQuery('users', 'is_active=eq.true&role=neq.pending&select=id,line_user_id,display_name,role');
  return users || [];
}

function todayStr() {
  var d = new Date();
  return Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd');
}

function lastMonthRange() {
  var now = new Date();
  var y = now.getFullYear();
  var m = now.getMonth(); // 0-indexed, so this is last month
  if (m === 0) { y--; m = 12; }
  var start = Utilities.formatDate(new Date(y, m - 1, 1), 'Asia/Tokyo', 'yyyy-MM-dd');
  var end = Utilities.formatDate(new Date(y, m, 0), 'Asia/Tokyo', 'yyyy-MM-dd');
  var label = y + '年' + m + '月';
  return { start: start, end: end, label: label, year: y, month: m };
}

// ========================================
// 1. 日報未提出リマインド（毎日17:00）
// ========================================
function dailyReportReminder() {
  var today = todayStr();
  var staff = getActiveStaff();
  var owner = getOwner();
  if (!staff.length) return;

  // 今日の日報を取得
  var reports = supabaseQuery('daily_reports',
    'date=eq.' + today + '&select=user_id');
  var submittedIds = {};
  (reports || []).forEach(function(r) { submittedIds[r.user_id] = true; });

  var submitted = 0;
  var notSubmitted = [];

  staff.forEach(function(u) {
    if (submittedIds[u.id]) {
      submitted++;
    } else {
      notSubmitted.push(u);
    }
  });

  // 未提出者にリマインド
  notSubmitted.forEach(function(u) {
    if (u.line_user_id) {
      linePush(u.line_user_id,
        '【日報リマインド】\n' + u.display_name + 'さん、本日の日報がまだ提出されていません。\n\n「日報」と送信して作成できます。');
    }
  });

  // 社長に報告
  if (owner && owner.line_user_id) {
    var msg = '【日報提出状況 ' + today + '】\n'
      + submitted + '名提出済 / ' + notSubmitted.length + '名未提出\n';
    if (notSubmitted.length > 0) {
      msg += '\n未提出:\n';
      notSubmitted.forEach(function(u) {
        msg += '  - ' + u.display_name + '\n';
      });
    }
    linePush(owner.line_user_id, msg);
  }
}

// ========================================
// 2. タスク期限リマインド（毎朝9:00）
// ========================================
function taskDeadlineReminder() {
  var today = todayStr();
  var owner = getOwner();

  // 今日期限のタスク
  var dueTodayTasks = supabaseQuery('tasks',
    'due_date=eq.' + today + '&status=neq.done&select=id,title,assigned_to,due_date');

  // 期限超過のタスク
  var overdueTasks = supabaseQuery('tasks',
    'due_date=lt.' + today + '&status=neq.done&select=id,title,assigned_to,due_date');

  var staff = getActiveStaff();
  var staffMap = {};
  staff.forEach(function(u) { staffMap[u.id] = u; });

  // 今日期限: 担当者にリマインド
  (dueTodayTasks || []).forEach(function(t) {
    var u = staffMap[t.assigned_to];
    if (u && u.line_user_id) {
      linePush(u.line_user_id,
        '【タスク期限: 本日】\n「' + t.title + '」\n\n期限は今日です。完了したら「タスク」から更新してください。');
    }
  });

  // 期限超過: 担当者にリマインド
  (overdueTasks || []).forEach(function(t) {
    var u = staffMap[t.assigned_to];
    if (u && u.line_user_id) {
      linePush(u.line_user_id,
        '【タスク期限超過】\n「' + t.title + '」（期限: ' + t.due_date + '）\n\n期限を過ぎています。対応をお願いします。');
    }
  });

  // 社長に報告
  if (owner && owner.line_user_id) {
    var dueCount = (dueTodayTasks || []).length;
    var overdueCount = (overdueTasks || []).length;

    if (dueCount === 0 && overdueCount === 0) return; // 報告不要

    var msg = '【タスク期限アラート ' + today + '】\n';
    if (dueCount > 0) {
      msg += '\n本日期限: ' + dueCount + '件\n';
      (dueTodayTasks || []).slice(0, 10).forEach(function(t) {
        var name = staffMap[t.assigned_to] ? staffMap[t.assigned_to].display_name : '未割当';
        msg += '  - ' + t.title + '（' + name + '）\n';
      });
    }
    if (overdueCount > 0) {
      msg += '\n期限超過: ' + overdueCount + '件\n';
      (overdueTasks || []).slice(0, 10).forEach(function(t) {
        var name = staffMap[t.assigned_to] ? staffMap[t.assigned_to].display_name : '未割当';
        msg += '  - ' + t.title + '（' + name + ', 期限: ' + t.due_date + '）\n';
      });
    }
    linePush(owner.line_user_id, msg);
  }
}

// ========================================
// 3. 行政書類リマインド（毎月1日 9:00）
// ========================================
function adminDocReminder() {
  var owner = getOwner();
  if (!owner) return;

  var now = new Date();
  var y = now.getFullYear();
  var m = now.getMonth() + 1;
  var monthStr = y + '-' + (m < 10 ? '0' + m : m);

  // 今月の行政書類レコードを取得
  var records = supabaseQuery('admin_document_records',
    'target_period=like.' + monthStr + '*&status=neq.submitted&status=neq.cancelled'
    + '&select=id,due_date,status,document_id,admin_documents(name,importance,frequency)');

  // レコードがなければ、アクティブな月次書類を確認
  if (!records || records.length === 0) {
    var docs = supabaseQuery('admin_documents',
      'is_active=eq.true&frequency=eq.monthly&select=id,name,due_day_of_month,importance');
    if (docs && docs.length > 0) {
      var msg = '【行政書類 ' + monthStr + '】\n\n今月の書類レコードが未作成です。\n登録済み月次書類:\n';
      docs.forEach(function(d) {
        msg += '  - ' + d.name + '（毎月' + d.due_day_of_month + '日）\n';
      });
      msg += '\n「行政」と送信して確認・作成できます。';
      linePush(owner.line_user_id, msg);
    }
    return;
  }

  // 未提出書類の一覧
  var critical = [];
  var high = [];
  var other = [];

  records.forEach(function(r) {
    var doc = r.admin_documents || {};
    var item = {
      name: doc.name || '不明',
      dueDate: r.due_date || '未定',
      status: r.status,
      importance: doc.importance || 'medium'
    };
    if (item.importance === 'critical') critical.push(item);
    else if (item.importance === 'high') high.push(item);
    else other.push(item);
  });

  var msg = '【行政書類リマインド ' + monthStr + '】\n'
    + '未提出: ' + records.length + '件\n';

  if (critical.length > 0) {
    msg += '\n[重要] 報酬影響あり:\n';
    critical.forEach(function(i) {
      msg += '  - ' + i.name + '（期限: ' + i.dueDate + '）\n';
    });
  }
  if (high.length > 0) {
    msg += '\n[高] 加算影響あり:\n';
    high.forEach(function(i) {
      msg += '  - ' + i.name + '（期限: ' + i.dueDate + '）\n';
    });
  }
  if (other.length > 0) {
    msg += '\nその他:\n';
    other.forEach(function(i) {
      msg += '  - ' + i.name + '（期限: ' + i.dueDate + '）\n';
    });
  }
  msg += '\n「行政」と送信して詳細を確認できます。';

  linePush(owner.line_user_id, msg);
}

// ========================================
// 4. 月次レポート（毎月1日 10:00）
// ========================================
function monthlyReport() {
  var owner = getOwner();
  if (!owner) return;

  var range = lastMonthRange();
  var staff = getActiveStaff();
  var staffCount = staff.length;

  // --- データ収集 ---

  // 日報提出率
  var reports = supabaseQuery('daily_reports',
    'date=gte.' + range.start + '&date=lte.' + range.end + '&select=id,user_id,date');
  var reportCount = (reports || []).length;

  // 営業日数（簡易計算: 土日除外）
  var bizDays = 0;
  var d = new Date(range.start + 'T00:00:00+09:00');
  var endD = new Date(range.end + 'T00:00:00+09:00');
  while (d <= endD) {
    var dow = d.getDay();
    if (dow !== 0 && dow !== 6) bizDays++;
    d.setDate(d.getDate() + 1);
  }
  var expectedReports = bizDays * staffCount;
  var reportRate = expectedReports > 0 ? Math.round(reportCount / expectedReports * 100) : 0;

  // タスク完了率
  var allTasks = supabaseQuery('tasks',
    'created_at=gte.' + range.start + 'T00:00:00&created_at=lte.' + range.end + 'T23:59:59&select=id,status');
  var totalTasks = (allTasks || []).length;
  var doneTasks = (allTasks || []).filter(function(t) { return t.status === 'done'; }).length;
  var taskRate = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0;

  // 経費合計（カテゴリ別）
  var expenses = supabaseQuery('expenses',
    'date=gte.' + range.start + '&date=lte.' + range.end + '&select=amount,category');
  var expenseTotal = 0;
  var byCategory = {};
  (expenses || []).forEach(function(e) {
    var amt = e.amount || 0;
    expenseTotal += amt;
    var cat = e.category || 'その他';
    byCategory[cat] = (byCategory[cat] || 0) + amt;
  });

  // 金庫の入出金
  var cashbox = supabaseQuery('cashbox_transactions',
    'date=gte.' + range.start + '&date=lte.' + range.end + '&select=amount,type');
  var cashIn = 0, cashOut = 0;
  (cashbox || []).forEach(function(c) {
    if (c.type === 'in' || c.type === 'deposit') cashIn += (c.amount || 0);
    else cashOut += (c.amount || 0);
  });

  // 出席率
  var attendance = supabaseQuery('attendance',
    'date=gte.' + range.start + '&date=lte.' + range.end + '&select=id,status');
  var totalAttendance = (attendance || []).length;
  var presentCount = (attendance || []).filter(function(a) {
    return a.status === 'present' || a.status === 'late';
  }).length;
  var attendanceRate = totalAttendance > 0 ? Math.round(presentCount / totalAttendance * 100) : 0;

  // --- テキスト生成 ---
  var summaryText = range.label + ' 月次サマリー\n\n'
    + '■ 日報提出率: ' + reportRate + '%（' + reportCount + '/' + expectedReports + '件）\n'
    + '■ タスク完了率: ' + taskRate + '%（' + doneTasks + '/' + totalTasks + '件）\n'
    + '■ 出席率: ' + attendanceRate + '%（' + presentCount + '/' + totalAttendance + '回）\n'
    + '■ 経費合計: ¥' + expenseTotal.toLocaleString() + '\n';

  var catKeys = Object.keys(byCategory).sort(function(a, b) { return byCategory[b] - byCategory[a]; });
  if (catKeys.length > 0) {
    summaryText += '  内訳:\n';
    catKeys.forEach(function(cat) {
      summaryText += '    ' + cat + ': ¥' + byCategory[cat].toLocaleString() + '\n';
    });
  }

  summaryText += '■ 金庫: 入金 ¥' + cashIn.toLocaleString() + ' / 出金 ¥' + cashOut.toLocaleString() + '\n'
    + '■ スタッフ数: ' + staffCount + '名\n';

  // --- Gemini API で要約生成 ---
  var aiSummary = '';
  if (GEMINI_KEY) {
    try {
      var prompt = '以下は就労支援事業所の月次データです。社長向けに3〜5行の簡潔な振り返りコメントを日本語で生成してください。'
        + '改善提案があれば1点だけ含めてください。\n\n' + summaryText;
      var geminiRes = UrlFetchApp.fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_KEY, {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
          }),
          muteHttpExceptions: true
        });
      var geminiData = JSON.parse(geminiRes.getContentText());
      var candidates = geminiData.candidates || [];
      if (candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
        aiSummary = candidates[0].content.parts[0].text || '';
      }
    } catch (e) {
      Logger.log('Gemini error: ' + e.message);
    }
  }

  // --- スプレッドシート作成 ---
  var ssTitle = range.label + ' 月次レポート - さくら映像研';
  var ss = SpreadsheetApp.create(ssTitle);

  // サマリーシート
  var sheet = ss.getActiveSheet();
  sheet.setName('サマリー');
  var summaryRows = [
    ['項目', '数値', '備考'],
    ['日報提出率', reportRate + '%', reportCount + '/' + expectedReports + '件'],
    ['タスク完了率', taskRate + '%', doneTasks + '/' + totalTasks + '件'],
    ['出席率', attendanceRate + '%', presentCount + '/' + totalAttendance + '回'],
    ['経費合計', expenseTotal, ''],
    ['金庫入金', cashIn, ''],
    ['金庫出金', cashOut, ''],
    ['スタッフ数', staffCount, '名']
  ];
  summaryRows.forEach(function(row, i) {
    for (var j = 0; j < row.length; j++) {
      sheet.getRange(i + 1, j + 1).setValue(row[j]);
    }
  });
  var hdr = sheet.getRange(1, 1, 1, 3);
  hdr.setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
  sheet.getRange(5, 2, 3, 1).setNumberFormat('#,##0');
  for (var c = 1; c <= 3; c++) sheet.autoResizeColumn(c);

  // 経費カテゴリ別シート
  if (catKeys.length > 0) {
    var catSheet = ss.insertSheet('経費カテゴリ別');
    catSheet.getRange(1, 1).setValue('カテゴリ');
    catSheet.getRange(1, 2).setValue('金額');
    catSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
    catKeys.forEach(function(cat, i) {
      catSheet.getRange(i + 2, 1).setValue(cat);
      catSheet.getRange(i + 2, 2).setValue(byCategory[cat]);
    });
    catSheet.getRange(2, 2, catKeys.length, 1).setNumberFormat('#,##0');
    catSheet.autoResizeColumn(1);
    catSheet.autoResizeColumn(2);
  }

  // AI要約シート
  if (aiSummary) {
    var aiSheet = ss.insertSheet('AI分析');
    aiSheet.getRange(1, 1).setValue('AI分析コメント');
    aiSheet.getRange(1, 1).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
    aiSheet.getRange(2, 1).setValue(aiSummary);
    aiSheet.setColumnWidth(1, 600);
    aiSheet.getRange(2, 1).setWrap(true);
  }

  // --- LINE通知 ---
  var lineMsg = '【月次レポート ' + range.label + '】\n\n' + summaryText;
  if (aiSummary) {
    lineMsg += '\n💡 AI分析:\n' + aiSummary.substring(0, 500);
  }
  lineMsg += '\n📊 詳細レポート:\n' + ss.getUrl();
  linePush(owner.line_user_id, lineMsg);

  // --- メール送信 ---
  var emailTo = OWNER_EMAIL;
  var emailSubject = '[AI秘書] ' + range.label + ' 月次レポート';
  var emailBody = ssTitle + '\n\n' + summaryText;
  if (aiSummary) emailBody += '\n--- AI分析 ---\n' + aiSummary;
  emailBody += '\n\nスプレッドシート: ' + ss.getUrl();
  emailBody += '\n\n---\nさくら映像研 AI秘書より自動送信';

  var emailHtml = '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">'
    + '<div style="background:#4f46e5;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">'
    + '<h2 style="margin:0;font-size:18px">' + ssTitle + '</h2></div>'
    + '<div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px">'
    + '<table style="width:100%;border-collapse:collapse;margin-bottom:16px">'
    + '<tr><td style="padding:8px 0;color:#6b7280">日報提出率</td><td style="padding:8px 0;font-weight:600">' + reportRate + '%</td></tr>'
    + '<tr><td style="padding:8px 0;color:#6b7280">タスク完了率</td><td style="padding:8px 0;font-weight:600">' + taskRate + '%</td></tr>'
    + '<tr><td style="padding:8px 0;color:#6b7280">出席率</td><td style="padding:8px 0;font-weight:600">' + attendanceRate + '%</td></tr>'
    + '<tr><td style="padding:8px 0;color:#6b7280">経費合計</td><td style="padding:8px 0;font-weight:700;color:#4f46e5">&yen;' + expenseTotal.toLocaleString() + '</td></tr>'
    + '<tr><td style="padding:8px 0;color:#6b7280">金庫</td><td style="padding:8px 0">入金 &yen;' + cashIn.toLocaleString() + ' / 出金 &yen;' + cashOut.toLocaleString() + '</td></tr>'
    + '</table>';
  if (aiSummary) {
    emailHtml += '<div style="background:#f5f3ff;padding:16px;border-radius:8px;margin-bottom:16px">'
      + '<div style="font-weight:600;color:#4f46e5;margin-bottom:8px">AI分析</div>'
      + '<div style="color:#374151;line-height:1.6">' + aiSummary.replace(/\n/g, '<br>') + '</div></div>';
  }
  emailHtml += '<a href="' + ss.getUrl() + '" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">スプレッドシートを開く</a>'
    + '<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px">さくら映像研 AI秘書より自動送信</div>'
    + '</div></div>';

  GmailApp.sendEmail(emailTo, emailSubject, emailBody, {
    htmlBody: emailHtml,
    name: 'さくら映像研 AI秘書'
  });

  Logger.log('月次レポート完了: ' + ss.getUrl());
}

// ========================================
// トリガー設定（1回だけ手動実行）
// ========================================
function setupTriggers() {
  // 既存のトリガーを削除
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }

  // 日報リマインド: 毎日17:00
  ScriptApp.newTrigger('dailyReportReminder')
    .timeBased()
    .atHour(17)
    .everyDays(1)
    .create();

  // タスク期限リマインド: 毎日9:00
  ScriptApp.newTrigger('taskDeadlineReminder')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .create();

  // 行政書類リマインド: 毎月1日 9:00
  ScriptApp.newTrigger('adminDocReminder')
    .timeBased()
    .onMonthDay(1)
    .atHour(9)
    .create();

  // 月次レポート: 毎月1日 10:00
  ScriptApp.newTrigger('monthlyReport')
    .timeBased()
    .onMonthDay(1)
    .atHour(10)
    .create();

  Logger.log('トリガー設定完了: dailyReportReminder(17:00), taskDeadlineReminder(9:00), adminDocReminder(毎月1日), monthlyReport(毎月1日)');
}

// ========================================
// 既存機能: カレンダー / スプレッドシート
// ========================================

function doGet(e) {
  var action = e.parameter.action || 'list';
  var days = parseInt(e.parameter.days || '7');
  if (action === 'list') return jsonResponse(listEvents(days));
  if (action === 'today') return jsonResponse(listEvents(1));
  return jsonResponse({error: 'Unknown action'});
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var action = data.action || 'create';
  if (action === 'create') return jsonResponse(createEvent(data));
  if (action === 'create_spreadsheet') return jsonResponse(createSpreadsheet(data));
  if (action === 'create_spreadsheet_and_email') return jsonResponse(createSpreadsheetAndEmail(data));
  return jsonResponse({error: 'Unknown action'});
}

function createSpreadsheet(data) {
  var ss = SpreadsheetApp.create(data.title || '経費一覧');
  var sheet = ss.getActiveSheet();

  var rows = data.csv.split('\n');
  for (var i = 0; i < rows.length; i++) {
    var cols = rows[i].split(',');
    for (var j = 0; j < cols.length; j++) {
      sheet.getRange(i + 1, j + 1).setValue(cols[j]);
    }
  }

  // ヘッダー行の書式設定
  var headerRange = sheet.getRange(1, 1, 1, 6);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');

  // 列幅自動調整
  for (var k = 1; k <= 6; k++) {
    sheet.autoResizeColumn(k);
  }

  // 金額列を数値フォーマット
  if (rows.length > 1) {
    var amountRange = sheet.getRange(2, 3, rows.length - 1, 1);
    amountRange.setNumberFormat('#,##0');
  }

  // 合計行追加
  var totalRow = rows.length + 1;
  sheet.getRange(totalRow, 2).setValue('合計');
  sheet.getRange(totalRow, 2).setFontWeight('bold');
  sheet.getRange(totalRow, 3).setFormula('=SUM(C2:C' + rows.length + ')');
  sheet.getRange(totalRow, 3).setFontWeight('bold');
  sheet.getRange(totalRow, 3).setNumberFormat('#,##0');

  return {status: 'ok', url: ss.getUrl(), id: ss.getId()};
}

function createSpreadsheetAndEmail(data) {
  var result = createSpreadsheet(data);
  if (result.status !== 'ok') return result;

  var to = data.email || 'salt.nbase@gmail.com';
  var subject = '[AI秘書] ' + (data.title || '経費レポート');
  var total = 0;
  var rows = data.csv.split('\n');
  for (var i = 1; i < rows.length; i++) {
    var cols = rows[i].split(',');
    if (cols[2]) total += parseInt(cols[2]) || 0;
  }
  var count = rows.length - 1;

  // HTML メール本文
  var html = '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">'
    + '<div style="background:#4f46e5;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">'
    + '<h2 style="margin:0;font-size:18px">' + (data.title || '経費レポート') + '</h2>'
    + '</div>'
    + '<div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px">'
    + '<table style="width:100%;border-collapse:collapse;margin-bottom:16px">'
    + '<tr><td style="padding:8px 0;color:#6b7280;width:80px">件数</td><td style="padding:8px 0;font-weight:600">' + count + '件</td></tr>'
    + '<tr><td style="padding:8px 0;color:#6b7280">合計</td><td style="padding:8px 0;font-weight:700;font-size:20px;color:#4f46e5">&yen;' + total.toLocaleString() + '</td></tr>'
    + '</table>'
    + '<a href="' + result.url + '" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:20px">スプレッドシートを開く</a>'
    + '<h3 style="font-size:14px;color:#374151;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:24px">明細</h3>'
    + '<table style="width:100%;border-collapse:collapse;font-size:13px">'
    + '<tr style="background:#f9fafb"><th style="padding:8px;text-align:left;color:#6b7280">日付</th><th style="padding:8px;text-align:left;color:#6b7280">店舗</th><th style="padding:8px;text-align:right;color:#6b7280">金額</th><th style="padding:8px;text-align:left;color:#6b7280">カテゴリ</th></tr>';

  for (var j = 1; j < rows.length && j <= 30; j++) {
    var c = rows[j].split(',');
    var bg = j % 2 === 0 ? '#f9fafb' : '#fff';
    html += '<tr style="background:' + bg + '">'
      + '<td style="padding:8px">' + (c[0] || '') + '</td>'
      + '<td style="padding:8px">' + (c[1] || '') + '</td>'
      + '<td style="padding:8px;text-align:right;font-weight:600">&yen;' + (parseInt(c[2]) || 0).toLocaleString() + '</td>'
      + '<td style="padding:8px"><span style="background:#eef2ff;color:#4f46e5;padding:2px 8px;border-radius:4px;font-size:12px">' + (c[3] || '') + '</span></td>'
      + '</tr>';
  }
  if (rows.length > 31) html += '<tr><td colspan="4" style="padding:8px;color:#6b7280;text-align:center">...他' + (rows.length - 31) + '件</td></tr>';

  html += '</table>'
    + '<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px">'
    + 'さくら映像研 AI秘書より自動送信'
    + '</div></div></div>';

  // プレーンテキスト版（フォールバック）
  var plain = (data.title || '経費レポート') + '\n\n'
    + '件数: ' + count + '件\n'
    + '合計: \\' + total.toLocaleString() + '\n\n'
    + 'スプレッドシート: ' + result.url + '\n\n'
    + '--- 明細 ---\n';
  for (var k = 1; k < rows.length && k <= 20; k++) {
    var d = rows[k].split(',');
    plain += d[0] + '  ' + (d[1] || '') + '  \\' + (d[2] || '0') + '  ' + (d[3] || '') + '\n';
  }
  plain += '\n---\nさくら映像研 AI秘書より自動送信';

  GmailApp.sendEmail(to, subject, plain, {
    htmlBody: html,
    name: 'さくら映像研 AI秘書'
  });

  return {status: 'ok', url: result.url, id: result.id, emailSent: true, emailTo: to};
}

function getCalendar() {
  var cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (cal) return cal;
  cal = CalendarApp.getOwnedCalendarById(CALENDAR_ID);
  if (cal) return cal;
  var cals = CalendarApp.getAllCalendars();
  for (var i = 0; i < cals.length; i++) {
    if (cals[i].getId() === CALENDAR_ID) return cals[i];
  }
  return CalendarApp.getDefaultCalendar();
}

function listEvents(days) {
  var calendar = getCalendar();
  var now = new Date();
  var end = new Date(now.getTime() + days * 86400000);
  var events = calendar.getEvents(now, end);
  return {status: 'ok', calendarId: calendar.getId(), count: events.length, events: events.map(fmtEvent)};
}

function createEvent(data) {
  var calendar = getCalendar();
  var start = new Date(data.start);
  var end = data.end ? new Date(data.end) : new Date(start.getTime() + 3600000);
  var event = calendar.createEvent(data.title, start, end);
  if (data.description) event.setDescription(data.description);
  return {status: 'ok', event: fmtEvent(event)};
}

function fmtEvent(event) {
  return {
    id: event.getId(),
    title: event.getTitle(),
    start: event.getStartTime().toISOString(),
    end: event.getEndTime().toISOString(),
    allDay: event.isAllDayEvent(),
    description: event.getDescription() || ''
  };
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function testAuth() {
  var ss = SpreadsheetApp.create('テスト認証');
  Logger.log('スプレッドシート作成OK: ' + ss.getUrl());
  GmailApp.sendEmail('salt.nbase@gmail.com', 'AI秘書テスト', 'テストメールです', {name: 'AI秘書'});
  Logger.log('メール送信OK');
  DriveApp.getFileById(ss.getId()).setTrashed(true);
  Logger.log('テスト完了・ファイル削除済み');
}
