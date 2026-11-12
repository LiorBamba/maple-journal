/**
 * ==============================================================================
 * Maple Journal - Backend Google Apps Script (Code.gs)
 * ==============================================================================
 * Zero GCP, Zero external server. Container-bound first with standalone fallback.
 * Spreadsheet ID: 1URUI3gpIa2wx_gQdEawCDRp8Tw4h20gun2zeegC-Oz8
 * Timezone: Asia/Jerusalem
 * ==============================================================================
 */

var SPREADSHEET_ID = '1URUI3gpIa2wx_gQdEawCDRp8Tw4h20gun2zeegC-Oz8';
var TIMEZONE = 'Asia/Jerusalem';

/**
 * Returns the target Google Spreadsheet instance.
 * Checks container-bound first, then falls back to openById.
 */
function getSpreadsheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      return ss;
    }
  } catch (e) {
    // If not running in container-bound context, fallback below
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Automatically creates custom menu in Google Sheets upon opening.
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('🐾 יומן מייפל')
      .addItem('📱 פתח את אפליקציית הרשת (Web App)', 'openWebAppUrl')
      .addItem('📲 קוד QR להתקנה בטלפון', 'showAppUrlDialog')
      .addSeparator()
      .addItem('🔄 בדיקת תקינות גיליונות', 'checkAndInitSheets')
      .addToUi();
  } catch (e) {
    // Might not have UI context if running standalone
  }
}

/**
 * Shows a modal dialog with QR code and link for instant mobile access.
 */
function showAppUrlDialog() {
  var url = ScriptApp.getService().getUrl();
  var html;
  if (!url || url.indexOf('macros/s') === -1) {
    html = '<div dir="rtl" style="font-family: system-ui, sans-serif; padding: 20px; text-align: center;">' +
      '<h3 style="color: #4f46e5; margin-top: 0;">📲 פריסת האפליקציה ב-2 קליקים</h3>' +
      '<p style="color: #475569; font-size: 14px; line-height: 1.6;">כדי לקבל את קישור האפליקציה וקוד ה-QR לטלפון, יש לבצע פריסה חד-פעמית:</p>' +
      '<ol style="text-align: right; color: #334155; font-size: 13px; line-height: 1.8; padding-right: 20px;">' +
      '<li>לחץ על <b>פריסה (Deploy)</b> &larr; <b>פריסה חדשה (New deployment)</b></li>' +
      '<li>לחץ על גלגל השיניים ⚙️ ובחר <b>יישום אינטרנט (Web app)</b></li>' +
      '<li>הגדר "למי יש גישה" &larr; <b>כל אחד (Anyone)</b></li>' +
      '<li>לחץ <b>פריסה (Deploy)</b> ואשר את ההרשאות.</li>' +
      '</ol>' +
      '</div>';
  } else {
    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(url);
    html = '<div dir="rtl" style="font-family: system-ui, sans-serif; padding: 16px; text-align: center;">' +
      '<h3 style="color: #4f46e5; margin-top: 0; margin-bottom: 6px;">🐕 היומן של מייפל בנייד</h3>' +
      '<p style="color: #64748b; font-size: 13px; margin-bottom: 14px;">סרוק עם מצלמת הטלפון כדי לפתוח את האפליקציה מיד:</p>' +
      '<div style="margin: 0 auto 14px; padding: 10px; background: white; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: inline-block;">' +
      '<img src="' + qrUrl + '" width="180" height="180" alt="QR Code" style="display: block; border-radius: 8px;" />' +
      '</div>' +
      '<p><a href="' + url + '" target="_blank" style="display: inline-block; padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px;">פתח אפליקציה בדפדפן 🔗</a></p>' +
      '<p style="color: #94a3b8; font-size: 11px; margin-top: 10px;">טיפ: לאחר הפתיחה בנייד, לחץ על שתף &larr; "הוסף למסך הבית"</p>' +
      '</div>';
  }
  var htmlOutput = HtmlService.createHtmlOutput(html).setWidth(360).setHeight(430);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '📱 יומן מייפל');
}

/**
 * Direct launch helper for Web App from spreadsheet menu.
 */
function openWebAppUrl() {
  var url = ScriptApp.getService().getUrl();
  if (url && url.indexOf('macros/s') !== -1) {
    var html = '<div dir="rtl" style="font-family: system-ui, sans-serif; padding: 20px; text-align: center;">' +
      '<p style="font-size: 15px; font-weight: bold; color: #1e293b; margin-bottom: 16px;">פותח את יומן מייפל...</p>' +
      '<a href="' + url + '" target="_blank" style="display: inline-block; padding: 10px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 10px; font-weight: bold;">פתח בחלון חדש 🔗</a>' +
      '<script>window.open("' + url + '", "_blank");</script>' +
      '</div>';
    var htmlOutput = HtmlService.createHtmlOutput(html).setWidth(320).setHeight(160);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'פותח אפליקציה...');
  } else {
    showAppUrlDialog();
  }
}

/**
 * Main Web App Entrypoint.
 * Serves Index.html with bootstrapped data for instant 0ms client-side initial load.
 */
function doGet(e) {
  try {
    checkAndInitSheets();
  } catch (errInit) {
    Logger.log('Warning in checkAndInitSheets: ' + errInit.toString());
  }
  
  var template = null;
  var candidateNames = ['Index', 'index', 'Index.html', 'index.html'];
  for (var i = 0; i < candidateNames.length; i++) {
    try {
      template = HtmlService.createTemplateFromFile(candidateNames[i]);
      if (template) break;
    } catch (errFind) {}
  }

  if (!template && typeof getEmbeddedHtml === 'function') {
    try {
      template = HtmlService.createTemplate(getEmbeddedHtml());
    } catch (errEmb) {
      Logger.log('Error creating template from embedded HTML: ' + errEmb.toString());
    }
  }

  if (!template) {
    return HtmlService.createHtmlOutput(
      '<div dir="rtl" style="font-family: system-ui, sans-serif; padding: 24px; max-width: 600px; margin: 40px auto; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 16px; color: #9f1239; line-height: 1.6;">' +
      '<h2 style="margin-top: 0;">⚠️ קובץ הממשק (Index.html) לא נמצא</h2>' +
      '<p>בעורך ה-Apps Script, יש לוודא שנוצר קובץ <b>HTML</b> (על ידי לחיצה על <b>+ -> HTML</b>) בשם <b>Index</b> ושהודבק בתוכו קוד הממשק.</p>' +
      '<p style="font-size: 13px; color: #64748b;">(לחלופין, ניתן להשתמש בקובץ המאוחד <b>SingleFile_Code.gs</b> שאינו דורש קבצים נוספים כלל).</p>' +
      '</div>'
    ).setTitle('שגיאת התקנה - היומן של מייפל');
  }
  
  try {
    template.initialData = getInitialData();
  } catch (err) {
    Logger.log('Error bootstrapping initial data: ' + err.toString());
    template.initialData = {
      training: [],
      awayLog: [],
      feeding: [],
      tasks: [],
      taskLogs: [],
      defaultDuration: 2.5,
      error: err.toString()
    };
  }

  return template.evaluate()
    .setTitle('Maple Journal - מעקב מייפל')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Ensures all required sheets exist with correct column headers.
 * Supports backward compatibility for 'StressLevel' and legacy 'Stress'.
 */
function checkAndInitSheets() {
  var ss = getSpreadsheet();
  var sheetDefinitions = [
    {
      name: 'Training',
      headers: ['Date', 'Time', 'Duration', 'StressLevel', 'Notes']
    },
    {
      name: 'Away_Log',
      headers: ['Start_Date', 'End_Date', 'Location', 'Days_Count', 'Notes']
    },
    {
      name: 'Feeding',
      headers: ['Date', 'Time', 'Type', 'Amount', 'Finished', 'Notes']
    },
    {
      name: 'Tasks',
      headers: ['TaskName', 'Frequency', 'Description', 'Status']
    },
    {
      name: 'TaskLogs',
      headers: ['Date', 'TaskName', 'Success', 'Notes']
    }
  ];

  sheetDefinitions.forEach(function(def) {
    var sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
      sheet.appendRow(def.headers);
      sheet.getRange(1, 1, 1, def.headers.length).setFontWeight('bold');
    } else {
      // If sheet exists but is empty, initialize headers
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(def.headers);
        sheet.getRange(1, 1, 1, def.headers.length).setFontWeight('bold');
      }
    }
  });
}

/**
 * Helper to format date cells safely in Israel timezone (YYYY-MM-DD).
 */
function formatDateCell(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, TIMEZONE, 'yyyy-MM-dd');
  }
  var str = String(val).trim();
  if (str.indexOf('T') !== -1) {
    str = str.split('T')[0];
  }
  return str;
}

/**
 * Helper to format time cells safely in Israel timezone (HH:mm).
 */
function formatTimeCell(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, TIMEZONE, 'HH:mm');
  }
  var str = String(val).trim();
  // Handle formats like "14:30:00" -> "14:30" or "4:30" -> "04:30"
  var match = str.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    var h = ('0' + match[1]).slice(-2);
    var m = match[2];
    return h + ':' + m;
  }
  return str.substring(0, 5);
}

/**
 * Returns all bootstrapped data across all 5 sheets.
 */
function getInitialData() {
  checkAndInitSheets();
  var ss = getSpreadsheet();

  var trainingData = getTrainingData(ss);
  var awayData = getAwayData(ss);
  var feedingData = getFeedingData(ss);
  var tasksData = getTasksData(ss);
  var taskLogsData = getTaskLogsData(ss);

  // Dynamic default training duration: round(max_dur / 2 * 4) / 4
  var defaultDuration = 2.5;
  if (trainingData && trainingData.length > 0) {
    var maxDur = 0;
    for (var i = 0; i < trainingData.length; i++) {
      var d = Number(trainingData[i].duration);
      if (!isNaN(d) && d > maxDur) {
        maxDur = d;
      }
    }
    if (maxDur > 0) {
      defaultDuration = Math.round((maxDur / 2.0) * 4) / 4;
    }
  }

  return {
    training: trainingData,
    awayLog: awayData,
    feeding: feedingData,
    tasks: tasksData,
    taskLogs: taskLogsData,
    defaultDuration: defaultDuration
  };
}

/**
 * Reads Training sheet data.
 */
function getTrainingData(optionalSs) {
  var ss = optionalSs || getSpreadsheet();
  var sheet = ss.getSheetByName('Training');
  if (!sheet) return [];
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var values = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var headers = values[0];
  
  // Find column indices
  var dateIdx = headers.indexOf('Date');
  var timeIdx = headers.indexOf('Time');
  var durIdx = headers.indexOf('Duration');
  var stressIdx = headers.indexOf('StressLevel');
  if (stressIdx === -1) {
    stressIdx = headers.indexOf('Stress'); // legacy fallback
  }
  var notesIdx = headers.indexOf('Notes');

  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[dateIdx] && !row[durIdx]) continue; // Skip empty rows
    
    var dur = parseFloat(row[durIdx]);
    var stress = parseInt(row[stressIdx], 10);
    if (isNaN(stress) || stress < 1 || stress > 5) stress = 3;

    list.push({
      rowIndex: i + 1, // Sheet row number (1-indexed)
      date: formatDateCell(row[dateIdx]),
      time: formatTimeCell(row[timeIdx]),
      duration: isNaN(dur) ? 0 : Number(dur.toFixed(2)),
      stressLevel: stress,
      notes: row[notesIdx] ? String(row[notesIdx]).trim() : ''
    });
  }

  return list;
}

/**
 * Reads Away_Log sheet data.
 */
function getAwayData(optionalSs) {
  var ss = optionalSs || getSpreadsheet();
  var sheet = ss.getSheetByName('Away_Log');
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var values = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var headers = values[0];

  var startIdx = headers.indexOf('Start_Date');
  var endIdx = headers.indexOf('End_Date');
  var locIdx = headers.indexOf('Location');
  var daysIdx = headers.indexOf('Days_Count');
  if (daysIdx === -1) {
    daysIdx = headers.indexOf('Total_Days');
  }
  var notesIdx = headers.indexOf('Notes');

  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[startIdx] && !row[endIdx]) continue;

    var days = parseInt(row[daysIdx], 10);
    if (isNaN(days)) {
      var d1 = new Date(row[startIdx]);
      var d2 = new Date(row[endIdx]);
      days = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
    }

    list.push({
      rowIndex: i + 1,
      startDate: formatDateCell(row[startIdx]),
      endDate: formatDateCell(row[endIdx]),
      location: row[locIdx] ? String(row[locIdx]).trim() : 'אחר ✨',
      daysCount: days,
      notes: row[notesIdx] ? String(row[notesIdx]).trim() : ''
    });
  }

  return list;
}

/**
 * Reads Feeding sheet data.
 */
function getFeedingData(optionalSs) {
  var ss = optionalSs || getSpreadsheet();
  var sheet = ss.getSheetByName('Feeding');
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var values = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var headers = values[0];

  var dateIdx = headers.indexOf('Date');
  var timeIdx = headers.indexOf('Time');
  var typeIdx = headers.indexOf('Type');
  var amountIdx = headers.indexOf('Amount');
  var finishedIdx = headers.indexOf('Finished');
  var notesIdx = headers.indexOf('Notes');

  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[dateIdx] && !row[amountIdx]) continue;

    var amt = parseFloat(row[amountIdx]);
    var finRaw = String(row[finishedIdx]).trim();
    var fin = (finRaw === 'כן' || finRaw === 'true' || finRaw === 'TRUE') ? 'כן' : 'לא';

    list.push({
      rowIndex: i + 1,
      date: formatDateCell(row[dateIdx]),
      time: formatTimeCell(row[timeIdx]),
      type: row[typeIdx] ? String(row[typeIdx]).trim() : 'בוקר',
      amount: isNaN(amt) ? 0 : Number(amt.toFixed(2)),
      finished: fin,
      notes: row[notesIdx] ? String(row[notesIdx]).trim() : ''
    });
  }

  return list;
}

/**
 * Reads Tasks catalog.
 */
function getTasksData(optionalSs) {
  var ss = optionalSs || getSpreadsheet();
  var sheet = ss.getSheetByName('Tasks');
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var values = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var headers = values[0];

  var nameIdx = headers.indexOf('TaskName');
  var freqIdx = headers.indexOf('Frequency');
  var descIdx = headers.indexOf('Description');
  var statusIdx = headers.indexOf('Status');

  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[nameIdx]) continue;

    var status = row[statusIdx] ? String(row[statusIdx]).trim() : 'Active';

    list.push({
      rowIndex: i + 1,
      taskName: String(row[nameIdx]).trim(),
      frequency: row[freqIdx] ? String(row[freqIdx]).trim() : '',
      description: row[descIdx] ? String(row[descIdx]).trim() : '',
      status: status
    });
  }

  return list;
}

/**
 * Reads TaskLogs sheet data.
 */
function getTaskLogsData(optionalSs) {
  var ss = optionalSs || getSpreadsheet();
  var sheet = ss.getSheetByName('TaskLogs');
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var values = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var headers = values[0];

  var dateIdx = headers.indexOf('Date');
  var taskIdx = headers.indexOf('TaskName');
  var successIdx = headers.indexOf('Success');
  var notesIdx = headers.indexOf('Notes');

  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[taskIdx]) continue;

    var success = parseInt(row[successIdx], 10);
    if (isNaN(success) || success < 1 || success > 5) success = 3;

    list.push({
      rowIndex: i + 1,
      date: formatDateCell(row[dateIdx]),
      taskName: String(row[taskIdx]).trim(),
      success: success,
      notes: row[notesIdx] ? String(row[notesIdx]).trim() : ''
    });
  }

  return list;
}

/* ==============================================================================
 * MUTATION ENDPOINTS (Protected with LockService)
 * ============================================================================== */

/**
 * Appends a new separation training session.
 */
function addTrainingSession(record) {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(10000)) {
    return { success: false, error: 'המערכת תפוסה על ידי פעולה אחרת. נסה שוב בעוד כמה שניות.' };
  }

  try {
    if (!record) {
      return { success: false, error: 'נתוני אימון חסרים!', message: 'Missing record' };
    }

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Training');
    if (!sheet) {
      checkAndInitSheets();
      sheet = ss.getSheetByName('Training');
    }

    var dur = parseFloat(record.duration);
    if (isNaN(dur) || dur <= 0) {
      return { success: false, error: 'משך האימון חייב להיות גדול מ-0!', message: 'Duration must be greater than 0' };
    }

    if (record.date && isNaN(Date.parse(record.date))) {
      return { success: false, error: 'תאריך אימון לא תקין!', message: 'Invalid date' };
    }

    var stress = parseInt(record.stressLevel, 10);
    if (isNaN(stress) || stress < 1 || stress > 5) {
      stress = 2; // Default
    }

    var row = [
      String(record.date || '').trim(),
      String(record.time || '').trim(),
      Number(dur.toFixed(2)),
      stress,
      String(record.notes || '').trim()
    ];

    sheet.appendRow(row);
    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'האימון נשמר בהצלחה! (' + row[1] + ', ' + row[2] + ' שעות)',
      newRowIndex: sheet.getLastRow(),
      record: {
        rowIndex: sheet.getLastRow(),
        date: row[0],
        time: row[1],
        duration: row[2],
        stressLevel: row[3],
        notes: row[4]
      }
    };
  } catch (err) {
    return { success: false, error: 'שגיאה בשמירת אימון: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Appends a new away log entry.
 */
function addAwayLog(record) {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(10000)) {
    return { success: false, error: 'המערכת תפוסה. נסה שוב בעוד מספר שניות.' };
  }

  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Away_Log');
    if (!sheet) {
      checkAndInitSheets();
      sheet = ss.getSheetByName('Away_Log');
    }

    if (!record || !record.startDate || !record.endDate || isNaN(Date.parse(record.startDate)) || isNaN(Date.parse(record.endDate))) {
      return { success: false, error: 'חובה להזין תאריך התחלה ותאריך סיום תקינים!', message: 'Invalid start or end date' };
    }

    var dStart = new Date(record.startDate);
    var dEnd = new Date(record.endDate);
    var diffTime = dEnd - dStart;
    var daysCount = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (isNaN(daysCount) || daysCount <= 0) {
      return { success: false, error: 'תאריך החזרה חייב להיות מאוחר מתאריך ההתחלה.', message: 'End date must be after start date' };
    }

    var row = [
      String(record.startDate || '').trim(),
      String(record.endDate || '').trim(),
      String(record.location || 'אחר ✨').trim(),
      daysCount,
      String(record.notes || '').trim()
    ];

    sheet.appendRow(row);
    SpreadsheetApp.flush();

    return {
      success: true,
      daysCount: daysCount,
      message: 'תקופת ההיעדרות (' + daysCount + ' ימים) נשמרה בהצלחה!',
      newRowIndex: sheet.getLastRow(),
      record: {
        rowIndex: sheet.getLastRow(),
        startDate: row[0],
        endDate: row[1],
        location: row[2],
        daysCount: row[3],
        notes: row[4]
      }
    };
  } catch (err) {
    return { success: false, error: 'שגיאה בשמירת היעדרות: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Appends a new feeding entry.
 */
function addFeeding(record) {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(10000)) {
    return { success: false, error: 'המערכת תפוסה. נסה שוב בעוד מספר שניות.' };
  }

  try {
    if (!record) {
      return { success: false, error: 'נתוני האכלה חסרים!', message: 'Missing record' };
    }

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Feeding');
    if (!sheet) {
      checkAndInitSheets();
      sheet = ss.getSheetByName('Feeding');
    }

    if (record.date && isNaN(Date.parse(record.date))) {
      return { success: false, error: 'תאריך האכלה לא תקין!', message: 'Invalid date' };
    }

    var amt = parseFloat(record.amount);
    if (isNaN(amt) || amt < 0) {
      amt = 1.0;
    }

    var fin = (record.finished === true || record.finished === 'כן' || record.finished === 'true') ? 'כן' : 'לא';

    var row = [
      String(record.date || '').trim(),
      String(record.time || '').trim(),
      String(record.type || 'בוקר').trim(),
      Number(amt.toFixed(2)),
      fin,
      String(record.notes || '').trim()
    ];

    sheet.appendRow(row);
    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'הארוחה נשמרה!',
      newRowIndex: sheet.getLastRow(),
      record: {
        rowIndex: sheet.getLastRow(),
        date: row[0],
        time: row[1],
        type: row[2],
        amount: row[3],
        finished: row[4],
        notes: row[5]
      }
    };
  } catch (err) {
    return { success: false, error: 'שגיאה בשמירת האכלה: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Appends a new task to catalog.
 */
function addTask(record) {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(10000)) {
    return { success: false, error: 'המערכת תפוסה. נסה שוב בעוד מספר שניות.' };
  }

  try {
    if (!record) {
      return { success: false, error: 'נתוני תרגיל חסרים!', message: 'Missing record' };
    }

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Tasks');
    if (!sheet) {
      checkAndInitSheets();
      sheet = ss.getSheetByName('Tasks');
    }

    var name = String(record.taskName || '').trim();
    if (!name) {
      return { success: false, error: 'שם התרגיל אינו יכול להיות ריק.', message: 'Task name cannot be empty' };
    }

    var row = [
      name,
      String(record.frequency || '').trim(),
      String(record.description || '').trim(),
      'Active'
    ];

    sheet.appendRow(row);
    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'התרגיל נוסף לרשימה!',
      newRowIndex: sheet.getLastRow(),
      record: {
        rowIndex: sheet.getLastRow(),
        taskName: row[0],
        frequency: row[1],
        description: row[2],
        status: row[3]
      }
    };
  } catch (err) {
    return { success: false, error: 'שגיאה ביצירת תרגיל: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Appends a new task execution log.
 */
function logTaskExecution(record) {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(10000)) {
    return { success: false, error: 'המערכת תפוסה. נסה שוב בעוד מספר שניות.' };
  }

  try {
    if (!record) {
      return { success: false, error: 'נתוני תיעוד ביצוע חסרים!', message: 'Missing record' };
    }

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('TaskLogs');
    if (!sheet) {
      checkAndInitSheets();
      sheet = ss.getSheetByName('TaskLogs');
    }

    var taskName = String(record.taskName || '').trim();
    if (!taskName) {
      return { success: false, error: 'חובה לבחור תרגיל לתיעוד.', message: 'Task name is required' };
    }

    if (record.date && isNaN(Date.parse(record.date))) {
      return { success: false, error: 'תאריך ביצוע לא תקין!', message: 'Invalid date' };
    }

    var success = parseInt(record.success, 10);
    if (isNaN(success) || success < 1 || success > 5) {
      success = 3;
    }

    var row = [
      String(record.date || '').trim(),
      taskName,
      success,
      String(record.notes || '').trim()
    ];

    sheet.appendRow(row);
    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'הביצוע תועד בהצלחה!',
      newRowIndex: sheet.getLastRow(),
      record: {
        rowIndex: sheet.getLastRow(),
        date: row[0],
        taskName: row[1],
        success: row[2],
        notes: row[3]
      }
    };
  } catch (err) {
    return { success: false, error: 'שגיאה בתיעוד תרגיל: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Updates a single row atomically.
 * @param {string} sheetName
 * @param {number} rowIndex (1-based row number in Google Sheet, >= 2)
 * @param {Array} rowData
 */
function updateRow(sheetName, rowIndex, rowData) {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(10000)) {
    return { success: false, error: 'המערכת תפוסה. נסה שוב בעוד מספר שניות.' };
  }

  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return { success: false, error: 'הגיליון ' + sheetName + ' לא נמצא.', message: 'Sheet not found' };
    }

    var parsedRow = parseInt(rowIndex, 10);
    if (!Number.isInteger(parsedRow) || isNaN(parsedRow) || parsedRow < 2 || parsedRow > sheet.getLastRow()) {
      return { success: false, error: 'מספר שורה לא תקין: ' + rowIndex, message: 'Invalid rowIndex' };
    }

    if (!Array.isArray(rowData) || rowData.length === 0) {
      return { success: false, error: 'נתוני שורה לא תקינים.', message: 'Invalid rowData' };
    }

    var range = sheet.getRange(parsedRow, 1, 1, rowData.length);
    range.setValues([rowData]);
    SpreadsheetApp.flush();

    return { success: true, message: 'שורה ' + parsedRow + ' עודכנה!' };
  } catch (err) {
    return { success: false, error: 'שגיאה בעדכון שורה: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Updates multiple rows atomically in a single lock acquisition.
 * Fixes the Streamlit smart_update bug where only the 1st row change was committed!
 * @param {string} sheetName
 * @param {Array<{rowIndex: number, rowData: Array}>} updates
 */
function updateRows(sheetName, updates) {
  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return { success: true, count: 0, message: 'לא זוהו שינויים.' };
  }

  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(10000)) {
    return { success: false, error: 'המערכת תפוסה. נסה שוב בעוד מספר שניות.' };
  }

  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return { success: false, error: 'הגיליון ' + sheetName + ' לא נמצא.', message: 'Sheet not found' };
    }

    var lastRow = sheet.getLastRow();
    var updatedCount = 0;
    for (var i = 0; i < updates.length; i++) {
      var u = updates[i];
      if (!u) continue;
      var parsedRow = parseInt(u.rowIndex, 10);
      if (Number.isInteger(parsedRow) && !isNaN(parsedRow) && parsedRow >= 2 && parsedRow <= lastRow && Array.isArray(u.rowData) && u.rowData.length > 0) {
        var range = sheet.getRange(parsedRow, 1, 1, u.rowData.length);
        range.setValues([u.rowData]);
        updatedCount++;
      }
    }
    SpreadsheetApp.flush();

    return {
      success: true,
      count: updatedCount,
      message: 'עודכנו בהצלחה ' + updatedCount + ' שורות!'
    };
  } catch (err) {
    return { success: false, error: 'שגיאה בעדכון שורות: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Deletes a row safely with DocumentLock.
 * @param {string} sheetName
 * @param {number} rowIndex (1-based row number >= 2)
 */
function deleteRow(sheetName, rowIndex) {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(10000)) {
    return { success: false, error: 'המערכת תפוסה. נסה שוב בעוד מספר שניות.' };
  }

  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return { success: false, error: 'הגיליון ' + sheetName + ' לא נמצא.', message: 'Sheet not found' };
    }

    var parsedRow = parseInt(rowIndex, 10);
    if (!Number.isInteger(parsedRow) || isNaN(parsedRow) || parsedRow < 2 || parsedRow > sheet.getLastRow()) {
      return { success: false, error: 'מספר שורה לא תקין למחיקה: ' + rowIndex, message: 'Invalid rowIndex' };
    }

    sheet.deleteRow(parsedRow);
    SpreadsheetApp.flush();

    return { success: true, message: 'שורה ' + parsedRow + ' נמחקה!' };
  } catch (err) {
    return { success: false, error: 'שגיאה במחיקת שורה: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Integration Test suite runnable inside Apps Script editor or test runner.
 */
function runAllTests() {
  Logger.log('=== התחלת בדיקות אינטגרציה למערכת Maple Journal ===');
  checkAndInitSheets();
  
  var ss = getSpreadsheet();
  var requiredSheets = ['Training', 'Away_Log', 'Feeding', 'Tasks', 'TaskLogs'];
  requiredSheets.forEach(function(s) {
    var sh = ss.getSheetByName(s);
    if (!sh) throw new Error('Missing sheet: ' + s);
    Logger.log('✅ גיליון ' + s + ' קיים ותקין');
  });

  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(1000)) {
    throw new Error('LockService failed');
  }
  lock.releaseLock();
  Logger.log('✅ LockService תקין');

  var initData = getInitialData();
  Logger.log('✅ getInitialData הוחזר בהצלחה עם ' + initData.training.length + ' אימונים');
  Logger.log('=== כל הבדיקות הושלמו בהצלחה! ===');
  return { success: true };
}
