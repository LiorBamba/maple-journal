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

/**
 * Embedded representation of Index.html for Single-File zero-friction deployment.
 * Generated automatically from gas/Index.html.
 */
function getEmbeddedHtml() {
  var b64Parts = [
    "PCFET0NUWVBFIGh0bWw+DQo8aHRtbCBsYW5nPSJoZSIgZGlyPSJydGwiPg0KPGhlYWQ+DQogIDxtZXRhIGNoYXJzZXQ9IlVURi04Ij4NCiAgPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjAsIG1heGltdW0tc2NhbGU9MS4wLCB1c2VyLXNjYWxhYmxlPW5vIj4NCiAgPG1ldGEgbmFtZT0iYXBwbGUtbW9iaWxlLXdlYi1hcHAtY2FwYWJsZSIgY29udGVudD0ieWVzIj4NCiAgPG1ldGEgbmFtZT0iYXBwbGUtbW9iaWxlLXdlYi1hcHAtc3RhdHVzLWJhci1zdHlsZSIgY29udGVudD0iZGVmYXVsdCI+DQogIDxtZXRhIG5hbWU9ImFwcGxlLW1vYmlsZS13ZWItYXBwLXRpdGxlIiBjb250ZW50PSLXnteZ15nXpNecIj4NCiAgPGxpbmsgcmVsPSJhcHBsZS10b3VjaC1pY29uIiBocmVmPSJodHRwczovL2Vtb2ppY2RuLmVsay5zaC/wn5CVP3NpemU9MTgwIj4NCiAgPGxpbmsgcmVsPSJtYW5pZmVzdCIgaHJlZj0iZGF0YTphcHBsaWNhdGlvbi9tYW5pZmVzdCtqc29uO3V0Zi04LCU3QiUyMm5hbWUlMjIlM0ElMjIlRDclOTQlRDclOTklRDclOTUlRDclOUUlRDclOUYlMjAlRDclQTklRDclOUMlMjAlRDclOUUlRDclOTklRDclOTklRDclQTQlRDclOUMlMjIlMkMlMjJzaG9ydF9uYW1lJTIyJTNBJTIyJUQ3JTlFJUQ3JTk5JUQ3JTk5JUQ3JUE0JUQ3JTlDJTIyJTJDJTIyc3RhcnRfdXJsJTIyJTNBJTIyLiUyMiUyQyUyMmRpc3BsYXklMjIlM0ElMjJzdGFuZGFsb25l",
    "JTIyJTJDJTIyYmFja2dyb3VuZF9jb2xvciUyMiUzQSUyMiUyM2Y4ZmFmYyUyMiUyQyUyMnRoZW1lX2NvbG9yJTIyJTNBJTIyJTIzNGY0NmU1JTIyJTdEIj4NCg0KICA8dGl0bGU+TWFwbGUgSm91cm5hbCAtINee16LXp9eRINee15nXmdek15w8L3RpdGxlPg0KDQogIDwhLS0gR29vZ2xlIEZvbnRzOiBSdWJpayAtLT4NCiAgPGxpbmsgcmVsPSJwcmVjb25uZWN0IiBocmVmPSJodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tIj4NCiAgPGxpbmsgcmVsPSJwcmVjb25uZWN0IiBocmVmPSJodHRwczovL2ZvbnRzLmdzdGF0aWMuY29tIiBjcm9zc29yaWdpbj4NCiAgPGxpbmsgaHJlZj0iaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbS9jc3MyP2ZhbWlseT1SdWJpazppdGFsLHdnaHRAMCwzMDA7MCw0MDA7MCw1MDA7MCw2MDA7MCw3MDA7MSw0MDAmZGlzcGxheT1zd2FwIiByZWw9InN0eWxlc2hlZXQiPg0KDQogIDwhLS0gVGFpbHdpbmQgQ1NTIENETiAtLT4NCiAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vY2RuLnRhaWx3aW5kY3NzLmNvbSI+PC9zY3JpcHQ+DQogIDxzY3JpcHQ+DQogICAgdGFpbHdpbmQuY29uZmlnID0gew0KICAgICAgZGFya01vZGU6ICdjbGFzcycsDQogICAgICB0aGVtZTogew0KICAgICAgICBleHRlbmQ6IHsNCiAgICAgICAgICBmb250RmFtaWx5OiB7DQogICAgICAgICAgICBydWJpazogWydSdWJpaycsICdzYW5zLXNlcmlmJ10sDQogICAgICAgICAgfSwNCiAgICAgICAgICBjb2xvcnM6IHsNCiAgICAg",
    "ICAgICAgIGJyYW5kOiB7DQogICAgICAgICAgICAgIDUwOiAnI2VlZjJmZicsDQogICAgICAgICAgICAgIDEwMDogJyNlMGU3ZmYnLA0KICAgICAgICAgICAgICA1MDA6ICcjNjM2NmYxJywNCiAgICAgICAgICAgICAgNjAwOiAnIzRmNDZlNScsDQogICAgICAgICAgICAgIDcwMDogJyM0MzM4Y2EnLA0KICAgICAgICAgICAgfQ0KICAgICAgICAgIH0NCiAgICAgICAgfQ0KICAgICAgfQ0KICAgIH0NCiAgPC9zY3JpcHQ+DQoNCiAgPCEtLSBMdWNpZGUgSWNvbnMgLS0+DQogIDxzY3JpcHQgc3JjPSJodHRwczovL3VucGtnLmNvbS9sdWNpZGVAbGF0ZXN0Ij48L3NjcmlwdD4NCg0KICA8IS0tIENoYXJ0LmpzIDQuNCArIEx1eG9uICsgUGx1Z2lucyAtLT4NCiAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vY2hhcnQuanNANC40LjEvZGlzdC9jaGFydC51bWQubWluLmpzIj48L3NjcmlwdD4NCiAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vbHV4b25AMy40LjQvZGlzdC9sdXhvbi5taW4uanMiPjwvc2NyaXB0Pg0KICA8c2NyaXB0IHNyYz0iaHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L25wbS9jaGFydGpzLWFkYXB0ZXItbHV4b25AMS4zLjEvZGlzdC9jaGFydGpzLWFkYXB0ZXItbHV4b24udW1kLm1pbi5qcyI+PC9zY3JpcHQ+DQogIDxzY3JpcHQgc3JjPSJodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvbnBtL2NoYXJ0anMtcGx1Z2luLWFubm90YXRpb25AMy4wLjEvZGlz",
    "dC9jaGFydGpzLXBsdWdpbi1hbm5vdGF0aW9uLm1pbi5qcyI+PC9zY3JpcHQ+DQoNCiAgPHN0eWxlPg0KICAgICogew0KICAgICAgZm9udC1mYW1pbHk6ICdSdWJpaycsIHNhbnMtc2VyaWY7DQogICAgICAtd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3I6IHRyYW5zcGFyZW50Ow0KICAgIH0NCiAgICBib2R5IHsNCiAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmOGZhZmM7DQogICAgICBjb2xvcjogIzFlMjkzYjsNCiAgICB9DQogICAgLyogTFRSIHN0cmljdGx5IGVuZm9yY2VkIGZvciBUaW1lICYgRHVyYXRpb24gaW5wdXRzIHRvIHByZXZlbnQgZGlnaXQgcmV2ZXJzYWwgKi8NCiAgICAuaW5wdXQtdGltZSwgLmlucHV0LWx0ciB7DQogICAgICBkaXJlY3Rpb246IGx0ciAhaW1wb3J0YW50Ow0KICAgICAgdGV4dC1hbGlnbjogY2VudGVyICFpbXBvcnRhbnQ7DQogICAgICB1bmljb2RlLWJpZGk6IGJpZGktb3ZlcnJpZGU7DQogICAgfQ0KICAgIC8qIFNsaWRlcnMgbXVzdCByZW1haW4gTFRSOiAxIG9uIHRoZSBsZWZ0LCA1IG9uIHRoZSByaWdodCAqLw0KICAgIC5zbGlkZXItbHRyIHsNCiAgICAgIGRpcmVjdGlvbjogbHRyICFpbXBvcnRhbnQ7DQogICAgfQ0KICAgIC8qIFNtb290aCB0YWIgc3dpdGNoaW5nIHRyYW5zaXRpb25zICovDQogICAgLnRhYi1jb250ZW50IHsNCiAgICAgIGRpc3BsYXk6IG5vbmU7DQogICAgICBhbmltYXRpb246IGZhZGVJbiAwLjJzIGVhc2UtaW4tb3V0Ow0KICAgIH0NCiAgICAudGFiLWNvbnRl",
    "bnQuYWN0aXZlIHsNCiAgICAgIGRpc3BsYXk6IGJsb2NrOw0KICAgIH0NCiAgICBAa2V5ZnJhbWVzIGZhZGVJbiB7DQogICAgICBmcm9tIHsgb3BhY2l0eTogMDsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDRweCk7IH0NCiAgICAgIHRvIHsgb3BhY2l0eTogMTsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDApOyB9DQogICAgfQ0KICAgIC8qIEN1c3RvbSBzY3JvbGxiYXIgZm9yIG1vYmlsZSBsaXN0cyAqLw0KICAgIDo6LXdlYmtpdC1zY3JvbGxiYXIgew0KICAgICAgd2lkdGg6IDZweDsNCiAgICAgIGhlaWdodDogNnB4Ow0KICAgIH0NCiAgICA6Oi13ZWJraXQtc2Nyb2xsYmFyLXRyYWNrIHsNCiAgICAgIGJhY2tncm91bmQ6ICNmMWY1Zjk7DQogICAgfQ0KICAgIDo6LXdlYmtpdC1zY3JvbGxiYXItdGh1bWIgew0KICAgICAgYmFja2dyb3VuZDogI2NiZDVlMTsNCiAgICAgIGJvcmRlci1yYWRpdXM6IDk5OTlweDsNCiAgICB9DQogIDwvc3R5bGU+DQo8L2hlYWQ+DQo8Ym9keSBjbGFzcz0ibWluLWgtc2NyZWVuIGZsZXggZmxleC1jb2wgcGItMjAgbWQ6cGItOCI+DQoNCiAgPCEtLSBUb3AgQXBwIEJhciAtLT4NCiAgPGhlYWRlciBjbGFzcz0ic3RpY2t5IHRvcC0wIHotNDAgYmctd2hpdGUvOTAgYmFja2Ryb3AtYmx1ci1tZCBib3JkZXItYiBib3JkZXItc2xhdGUtMjAwIHNoYWRvdy1zbSI+DQogICAgPGRpdiBjbGFzcz0ibWF4LXctNXhsIG14LWF1dG8gcHgtNCBoLTE2IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2Vl",
    "biI+DQogICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTMgc3BhY2UteC1yZXZlcnNlIj4NCiAgICAgICAgPHNwYW4gY2xhc3M9InRleHQtM3hsIHNlbGVjdC1ub25lIiByb2xlPSJpbWciIGFyaWEtbGFiZWw9ImRvZyI+8J+QlTwvc3Bhbj4NCiAgICAgICAgPGRpdj4NCiAgICAgICAgICA8aDEgY2xhc3M9InRleHQteGwgZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIGxlYWRpbmctdGlnaHQiPteU157Xoten15Eg16nXnCDXnteZ15nXpNecPC9oMT4NCiAgICAgICAgICA8cCBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTUwMCBmb250LW1lZGl1bSI+15nXldee158g15DXmdee15XXoNeZ150sINeU15DXm9ec15XXqiDXldee16nXmdee15XXqjwvcD4NCiAgICAgICAgPC9kaXY+DQogICAgICA8L2Rpdj4NCg0KICAgICAgPCEtLSBTeW5jIC8gUmVmcmVzaCBCdXR0b24gLS0+DQogICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTIgc3BhY2UteC1yZXZlcnNlIj4NCiAgICAgICAgPGJ1dHRvbiBpZD0iYnRuUmVmcmVzaCIgb25jbGljaz0icmVmcmVzaEFsbERhdGEoKSIgdGl0bGU9Iteo16LXoNefINeg16rXldeg15nXnSINCiAgICAgICAgICBjbGFzcz0icC0yIHJvdW5kZWQteGwgdGV4dC1zbGF0ZS02MDAgaG92ZXI6dGV4dC1pbmRpZ28tNjAwIGhvdmVyOmJnLXNsYXRlLTEwMCB0cmFuc2l0aW9uIGFjdGl2ZTpzY2FsZS05NSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41",
    "IHRleHQtc20gZm9udC1tZWRpdW0iPg0KICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPSJyZWZyZXNoLWN3IiBjbGFzcz0idy00IGgtNCI+PC9pPg0KICAgICAgICAgIDxzcGFuIGNsYXNzPSJoaWRkZW4gc206aW5saW5lIj7XqNei16DXldefPC9zcGFuPg0KICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgPGEgaHJlZj0iaHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvMVVSVUkzZ3BJYTJ3eF9nUWRFYXdDRFJwOFR3NGgyMGd1bjJ6ZWVnQy1PejgiIHRhcmdldD0iX2JsYW5rIg0KICAgICAgICAgIHRpdGxlPSLXpNeq15cg15LXmdec15nXldefINeS15XXktecIg0KICAgICAgICAgIGNsYXNzPSJwLTIgcm91bmRlZC14bCB0ZXh0LXNsYXRlLTYwMCBob3Zlcjp0ZXh0LWVtZXJhbGQtNjAwIGhvdmVyOmJnLXNsYXRlLTEwMCB0cmFuc2l0aW9uIGFjdGl2ZTpzY2FsZS05NSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHRleHQtc20gZm9udC1tZWRpdW0iPg0KICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPSJzaGVldCIgY2xhc3M9InctNCBoLTQiPjwvaT4NCiAgICAgICAgICA8c3BhbiBjbGFzcz0iaGlkZGVuIHNtOmlubGluZSI+15LXldeS15wg16nXmdeY16E8L3NwYW4+DQogICAgICAgIDwvYT4NCiAgICAgIDwvZGl2Pg0KICAgIDwvZGl2Pg0KDQogICAgPCEtLSBEZXNrdG9wIE5hdmlnYXRpb24gVGFicyAtLT4NCiAgICA8ZGl2IGNsYXNzPSJoaWRkZW4gbWQ6YmxvY2sgYm9yZGVyLXQgYm9yZGVyLXNsYXRl",
    "LTEwMCBiZy1zbGF0ZS01MC81MCI+DQogICAgICA8ZGl2IGNsYXNzPSJtYXgtdy01eGwgbXgtYXV0byBweC00IGZsZXggc3BhY2UteC0yIHNwYWNlLXgtcmV2ZXJzZSI+DQogICAgICAgIDxidXR0b24gb25jbGljaz0ic3dpdGNoVGFiKCd0cmFpbmluZycpIiBpZD0iZGVza3RvcC10YWItdHJhaW5pbmciDQogICAgICAgICAgY2xhc3M9Im5hdi10YWItYnRuIHB5LTMgcHgtNCB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgYm9yZGVyLWItMiBib3JkZXItaW5kaWdvLTYwMCB0ZXh0LWluZGlnby02MDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIiPg0KICAgICAgICAgIDxzcGFuPvCfj4M8L3NwYW4+INeU15nXqdeQ16jXldeqINec15HXkw0KICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJzd2l0Y2hUYWIoJ2ZlZWRpbmcnKSIgaWQ9ImRlc2t0b3AtdGFiLWZlZWRpbmciDQogICAgICAgICAgY2xhc3M9Im5hdi10YWItYnRuIHB5LTMgcHgtNCB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgYm9yZGVyLWItMiBib3JkZXItdHJhbnNwYXJlbnQgdGV4dC1zbGF0ZS02MDAgaG92ZXI6dGV4dC1zbGF0ZS05MDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIiPg0KICAgICAgICAgIDxzcGFuPvCfprQ8L3NwYW4+INeU15DXm9ec15XXqg0KICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJzd2l0Y2hUYWIoJ3Rhc2tzJykiIGlkPSJkZXNrdG9wLXRhYi10YXNrcyINCiAgICAgICAgICBjbGFzcz0i",
    "bmF2LXRhYi1idG4gcHktMyBweC00IHRleHQtc20gZm9udC1zZW1pYm9sZCBib3JkZXItYi0yIGJvcmRlci10cmFuc3BhcmVudCB0ZXh0LXNsYXRlLTYwMCBob3Zlcjp0ZXh0LXNsYXRlLTkwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+DQogICAgICAgICAgPHNwYW4+8J+Okzwvc3Bhbj4g157XqdeZ157XldeqDQogICAgICAgIDwvYnV0dG9uPg0KICAgICAgICA8YnV0dG9uIG9uY2xpY2s9InN3aXRjaFRhYignaGlzdG9yeScpIiBpZD0iZGVza3RvcC10YWItaGlzdG9yeSINCiAgICAgICAgICBjbGFzcz0ibmF2LXRhYi1idG4gcHktMyBweC00IHRleHQtc20gZm9udC1zZW1pYm9sZCBib3JkZXItYi0yIGJvcmRlci10cmFuc3BhcmVudCB0ZXh0LXNsYXRlLTYwMCBob3Zlcjp0ZXh0LXNsYXRlLTkwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+DQogICAgICAgICAgPHNwYW4+8J+Tijwvc3Bhbj4g15TXmdeh15jXldeo15nXlCDXldeZ15XXntefDQogICAgICAgIDwvYnV0dG9uPg0KICAgICAgPC9kaXY+DQogICAgPC9kaXY+DQogIDwvaGVhZGVyPg0KDQogIDwhLS0gTWFpbiBDb250YWluZXIgLS0+DQogIDxtYWluIGNsYXNzPSJtYXgtdy01eGwgbXgtYXV0byBweC00IHB5LTYgdy1mdWxsIGZsZXgtMSI+DQoNCiAgICA8IS0tID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLS0+DQogICAgPCEtLSBUQUIgMTog15TXmdep15DXqNeV16og",
    "15zXkdeTIChTZXBhcmF0aW9uIFRyYWluaW5nICYgQXdheSBTdGF5cykgLS0+DQogICAgPCEtLSA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC0tPg0KICAgIDxzZWN0aW9uIGlkPSJ0YWItdHJhaW5pbmciIGNsYXNzPSJ0YWItY29udGVudCBhY3RpdmUgc3BhY2UteS02Ij4NCiAgICAgIA0KICAgICAgPCEtLSBTZWN0aW9uIFRpdGxlIC0tPg0KICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIj4NCiAgICAgICAgPGRpdj4NCiAgICAgICAgICA8aDIgY2xhc3M9InRleHQteGwgZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIj7XqteZ16LXldeTINeX16nXmdek15Qg15XXoNeY15nXqdeV16o8L2gyPg0KICAgICAgICAgIDxwIGNsYXNzPSJ0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIj7XkNeZ157Xldeg15kg16TXqNeZ15PXlCDXlNeT16jXkteq15nXmdedLCDXntei16fXkSDXoteV157XoSDXldeU15nXoteT16jXldeZ15XXqjwvcD4NCiAgICAgICAgPC9kaXY+DQogICAgICA8L2Rpdj4NCg0KICAgICAgPCEtLSBBZGQgVHJhaW5pbmcgU2Vzc2lvbiBGb3JtIENhcmQgLS0+DQogICAgICA8ZGl2IGNsYXNzPSJiZy13aGl0ZSByb3VuZGVkLTJ4bCBwLTUgc2hhZG93LXNtIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIj4NCiAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbWItNCBw",
    "Yi0yIGJvcmRlci1iIGJvcmRlci1zbGF0ZS0xMDAiPg0KICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPSJwbHVzLWNpcmNsZSIgY2xhc3M9InctNSBoLTUgdGV4dC1pbmRpZ28tNjAwIj48L2k+DQogICAgICAgICAgPGgzIGNsYXNzPSJmb250LWJvbGQgdGV4dC1zbGF0ZS04MDAgdGV4dC1iYXNlIj7wn5OdINeU15XXodek16og15DXmdee15XXnyDXl9eT16k8L2gzPg0KICAgICAgICA8L2Rpdj4NCg0KICAgICAgICA8Zm9ybSBpZD0iZm9ybVRyYWluaW5nIiBvbnN1Ym1pdD0iaGFuZGxlVHJhaW5pbmdTdWJtaXQoZXZlbnQpIiBjbGFzcz0ic3BhY2UteS00Ij4NCiAgICAgICAgICA8ZGl2IGNsYXNzPSJncmlkIGdyaWQtY29scy0xIHNtOmdyaWQtY29scy0yIGdhcC00Ij4NCiAgICAgICAgICAgIDwhLS0gRGF0ZSAtLT4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPvCfk4Ug16rXkNeo15nXmjwvbGFiZWw+DQogICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJkYXRlIiBpZD0idHJhaW5EYXRlIiByZXF1aXJlZA0KICAgICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0zIHB5LTIuNSB0ZXh0LXNtIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWluZGlnby01MDAgZm9jdXM6b3V0bGluZS1ub25lIHRyYW5zaXRpb24iPg0K",
    "ICAgICAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgICAgIDwhLS0gU3RhcnQgVGltZSAoTFRSIENlbnRlcmVkKSAtLT4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPuKPsCDXqdei16og15TXqteX15zXlCAo15nXpteZ15DXlCk8L2xhYmVsPg0KICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0idGltZSIgaWQ9InRyYWluVGltZSIgcmVxdWlyZWQNCiAgICAgICAgICAgICAgICBjbGFzcz0iaW5wdXQtdGltZSB3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0zIHB5LTIuNSB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgdHJhY2tpbmctd2lkZXIgZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgdHJhbnNpdGlvbiI+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8L2Rpdj4NCg0KICAgICAgICAgIDwhLS0gRHVyYXRpb24gKGhvdXJzLCAwLjI1IHN0ZXApIC0tPg0KICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gbWItMSI+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0idGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIj7ij7Mg157XqdeaINeW157XnyAo16nXoteV16opPC9sYWJlbD4NCiAg",
    "ICAgICAgICAgICAgPHNwYW4gaWQ9InRyYWluRHVyYXRpb25EaXNwbGF5IiBjbGFzcz0idGV4dC14cyBmb250LWJvbGQgdGV4dC1pbmRpZ28tNjAwIGJnLWluZGlnby01MCBweC0yIHB5LTAuNSByb3VuZGVkLW1kIj4yLjUwINep16LXldeqPC9zcGFuPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyI+DQogICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJyYW5nZSIgaWQ9InRyYWluRHVyYXRpb25TbGlkZXIiIG1pbj0iMC4yNSIgbWF4PSIxMi4wIiBzdGVwPSIwLjI1IiB2YWx1ZT0iMi41Ig0KICAgICAgICAgICAgICAgIGNsYXNzPSJzbGlkZXItbHRyIHctZnVsbCBoLTIgYmctc2xhdGUtMjAwIHJvdW5kZWQtbGcgYXBwZWFyYW5jZS1ub25lIGN1cnNvci1wb2ludGVyIGFjY2VudC1pbmRpZ28tNjAwIg0KICAgICAgICAgICAgICAgIG9uaW5wdXQ9InN5bmNUcmFpbkR1cmF0aW9uKHRoaXMudmFsdWUsICdzbGlkZXInKSI+DQogICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJudW1iZXIiIGlkPSJ0cmFpbkR1cmF0aW9uTnVtIiBtaW49IjAuMjUiIG1heD0iMTIuMCIgc3RlcD0iMC4yNSIgdmFsdWU9IjIuNSINCiAgICAgICAgICAgICAgICBjbGFzcz0iaW5wdXQtbHRyIHctMjQgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0yLjUgcHktMS41IHRleHQtc20gZm9udC1ib2xkIHRleHQtY2VudGVyIGZvY3VzOnJp",
    "bmctMiBmb2N1czpyaW5nLWluZGlnby01MDAgZm9jdXM6b3V0bGluZS1ub25lIg0KICAgICAgICAgICAgICAgIG9uaW5wdXQ9InN5bmNUcmFpbkR1cmF0aW9uKHRoaXMudmFsdWUsICdudW1iZXInKSI+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8L2Rpdj4NCg0KICAgICAgICAgIDwhLS0gRHluYW1pYyBJbmZvIEhlbHBlciBCYW5uZXIgLS0+DQogICAgICAgICAgPGRpdiBpZD0idHJhaW5DYWxjQmFubmVyIiBjbGFzcz0iYmctaW5kaWdvLTUwIGJvcmRlciBib3JkZXItaW5kaWdvLTEwMCByb3VuZGVkLXhsIHAtMyB0ZXh0LXhzIHRleHQtaW5kaWdvLTkwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+DQogICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC1iYXNlIHNlbGVjdC1ub25lIj7wn5KhPC9zcGFuPg0KICAgICAgICAgICAgPGRpdiBpZD0idHJhaW5DYWxjVGV4dCIgY2xhc3M9ImZvbnQtbWVkaXVtIj4NCiAgICAgICAgICAgICAg15nXpteZ15DXlDogPGIgaWQ9ImNhbGNTdGFydCI+LS06LS08L2I+IHwg15fXlteo15Qg157XqdeV16LXqNeqOiA8YiBpZD0iY2FsY0VuZCI+LS06LS08L2I+IHwg16HXlNe015s6IDxiIGlkPSJjYWxjRHVyIj4yLjUwINep16LXldeqPC9iPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgICA8IS0tIFN0cmVzcyBMZXZlbCBTZWxlY3RvciAoMS01KSAtLT4NCiAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgPGRpdiBjbGFzcz0i",
    "ZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIG1iLTEuNSI+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0idGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIj7wn5iwINee15PXkyDXnNeX16U8L2xhYmVsPg0KICAgICAgICAgICAgICA8c3BhbiBpZD0ic3RyZXNzU2VsZWN0ZWRMYWJlbCIgY2xhc3M9InRleHQteHMgZm9udC1ib2xkIHRleHQtZW1lcmFsZC03MDAgYmctZW1lcmFsZC01MCBweC0yIHB5LTAuNSByb3VuZGVkLW1kIj4yIC0g15DXmS3Xqden15gg16fXnCDwn5+hPC9zcGFuPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICANCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImdyaWQgZ3JpZC1jb2xzLTUgZ2FwLTEuNSI+DQogICAgICAgICAgICAgIDxidXR0b24gdHlwZT0iYnV0dG9uIiBvbmNsaWNrPSJzZWxlY3RTdHJlc3MoMSkiIGlkPSJzdHJlc3MtYnRuLTEiDQogICAgICAgICAgICAgICAgY2xhc3M9InN0cmVzcy1idG4gcHktMiBweC0xIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgYmctd2hpdGUgaG92ZXI6Ymctc2xhdGUtNTAgdGV4dC1jZW50ZXIgdHJhbnNpdGlvbiBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciI+DQogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQtbGciPvCfn6I8L3NwYW4+DQogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQtWzEwcHhdIGZvbnQtYm9sZCBtdC0wLjUiPjEg16jXkteV16LXlDwvc3Bh",
    "bj4NCiAgICAgICAgICAgICAgPC9idXR0b24+DQogICAgICAgICAgICAgIDxidXR0b24gdHlwZT0iYnV0dG9uIiBvbmNsaWNrPSJzZWxlY3RTdHJlc3MoMikiIGlkPSJzdHJlc3MtYnRuLTIiDQogICAgICAgICAgICAgICAgY2xhc3M9InN0cmVzcy1idG4gcHktMiBweC0xIHJvdW5kZWQteGwgYm9yZGVyLTIgYm9yZGVyLXllbGxvdy01MDAgYmcteWVsbG93LTUwIHRleHQtY2VudGVyIHRyYW5zaXRpb24gZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgc2hhZG93LXNtIj4NCiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC1sZyI+8J+foTwvc3Bhbj4NCiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC1bMTBweF0gZm9udC1ib2xkIG10LTAuNSI+MiDXp9ecPC9zcGFuPg0KICAgICAgICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPSJidXR0b24iIG9uY2xpY2s9InNlbGVjdFN0cmVzcygzKSIgaWQ9InN0cmVzcy1idG4tMyINCiAgICAgICAgICAgICAgICBjbGFzcz0ic3RyZXNzLWJ0biBweS0yIHB4LTEgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBiZy13aGl0ZSBob3ZlcjpiZy1zbGF0ZS01MCB0ZXh0LWNlbnRlciB0cmFuc2l0aW9uIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIj4NCiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC1sZyI+8J+foDwvc3Bhbj4NCiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC1bMTBweF0g",
    "Zm9udC1ib2xkIG10LTAuNSI+MyDXkdeZ16DXldeg15k8L3NwYW4+DQogICAgICAgICAgICAgIDwvYnV0dG9uPg0KICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgb25jbGljaz0ic2VsZWN0U3RyZXNzKDQpIiBpZD0ic3RyZXNzLWJ0bi00Ig0KICAgICAgICAgICAgICAgIGNsYXNzPSJzdHJlc3MtYnRuIHB5LTIgcHgtMSByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIGJnLXdoaXRlIGhvdmVyOmJnLXNsYXRlLTUwIHRleHQtY2VudGVyIHRyYW5zaXRpb24gZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIiPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LWxnIj7wn5S0PC9zcGFuPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgbXQtMC41Ij40INee16bXlden15Q8L3NwYW4+DQogICAgICAgICAgICAgIDwvYnV0dG9uPg0KICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgb25jbGljaz0ic2VsZWN0U3RyZXNzKDUpIiBpZD0ic3RyZXNzLWJ0bi01Ig0KICAgICAgICAgICAgICAgIGNsYXNzPSJzdHJlc3MtYnRuIHB5LTIgcHgtMSByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIGJnLXdoaXRlIGhvdmVyOmJnLXNsYXRlLTUwIHRleHQtY2VudGVyIHRyYW5zaXRpb24gZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIiPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LWxnIj7wn5qoPC9zcGFu",
    "Pg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgbXQtMC41Ij41INek15DXoNeZ16fXlDwvc3Bhbj4NCiAgICAgICAgICAgICAgPC9idXR0b24+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJoaWRkZW4iIGlkPSJ0cmFpblN0cmVzcyIgdmFsdWU9IjIiPg0KICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgPCEtLSBOb3RlcyAtLT4NCiAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAgbWItMSI+8J+TnSDXlNei16jXldeqPC9sYWJlbD4NCiAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJ0ZXh0IiBpZD0idHJhaW5Ob3RlcyINCiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9Itee15Qg16LXqdeq15Q/INei150g157XlCDXlNeV16nXkNeo15Q/ICjXnNee16nXnDog16DXqdeQ16jXlCDXqNeS15XXoteUINeR157XmdeY15QpIg0KICAgICAgICAgICAgICBjbGFzcz0idy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMyBweS0yLjUgdGV4dC1zbSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1pbmRpZ28tNTAwIGZvY3VzOm91dGxpbmUtbm9uZSB0cmFuc2l0aW9uIj4NCiAgICAgICAgICA8L2Rpdj4NCg0KICAgICAgICAgIDwhLS0gU3VibWl0IEJ1dHRvbiAtLT4NCiAgICAgICAgICA8YnV0dG9u",
    "IHR5cGU9InN1Ym1pdCIgaWQ9ImJ0blN1Ym1pdFRyYWluaW5nIg0KICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1pbmRpZ28tNjAwIGhvdmVyOmJnLWluZGlnby03MDAgdGV4dC13aGl0ZSBmb250LWJvbGQgcHktMyBweC00IHJvdW5kZWQteGwgc2hhZG93LW1kIHRyYW5zaXRpb24gdHJhbnNmb3JtIGFjdGl2ZTpzY2FsZS1bMC45OV0gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTIiPg0KICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9InNhdmUiIGNsYXNzPSJ3LTUgaC01Ij48L2k+DQogICAgICAgICAgICA8c3Bhbj7Xqdee15XXqCDXkNeZ157XldefIPCfkr48L3NwYW4+DQogICAgICAgICAgPC9idXR0b24+DQogICAgICAgIDwvZm9ybT4NCiAgICAgIDwvZGl2Pg0KDQogICAgICA8IS0tIENvbXBvc2l0ZSBUcmFpbmluZyAmIEF3YXkgSW50ZW5zaXR5IENoYXJ0IC0tPg0KICAgICAgPGRpdiBjbGFzcz0iYmctd2hpdGUgcm91bmRlZC0yeGwgcC01IHNoYWRvdy1zbSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBzcGFjZS15LTQiPg0KICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IHNtOml0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTMgcGItMiBib3JkZXItYiBib3JkZXItc2xhdGUtMTAwIj4NCiAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+DQogICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC14bCI+8J+QlTwv",
    "c3Bhbj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxoMyBjbGFzcz0iZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIHRleHQtYmFzZSI+16DXmdeq15XXlyDXoteV157XoSDXldeU16rXp9eT157XldeqINep15wg157XmdeZ16TXnDwvaDM+DQogICAgICAgICAgICAgIDxwIGNsYXNzPSJ0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIj7Xotem15nXnteV16og157XqdeV16fXnNec16ogKNeT16LXmdeb15Qg16nXnCA3INeZ157XmdedKSwg15DXlteV16jXmSDXkNeX15XXlteV16DXmdedINeV16nXmdeQ15nXnTwvcD4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgPCEtLSBUaW1lIFJhbmdlIFNlbGVjdG9yIC0tPg0KICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIGJnLXNsYXRlLTEwMCBwLTEgcm91bmRlZC14bCBzZWxmLXN0YXJ0IHNtOnNlbGYtYXV0byB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQiPg0KICAgICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJzZXRDaGFydFRpbWVSYW5nZSg3KSIgaWQ9InJhbmdlLWJ0bi03IiBjbGFzcz0iY2hhcnQtcmFuZ2UtYnRuIHB4LTIuNSBweS0xIHJvdW5kZWQtbGcgdGV4dC1zbGF0ZS02MDAgdHJhbnNpdGlvbiI+NyDXmdee15nXnTwvYnV0dG9uPg0KICAgICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJzZXRDaGFydFRpbWVSYW5nZSgzMCkiIGlkPSJyYW5nZS1idG4tMzAiIGNsYXNzPSJjaGFydC1yYW5n",
    "ZS1idG4gcHgtMi41IHB5LTEgcm91bmRlZC1sZyB0ZXh0LXNsYXRlLTYwMCB0cmFuc2l0aW9uIj4zMCDXmdeV1508L2J1dHRvbj4NCiAgICAgICAgICAgIDxidXR0b24gb25jbGljaz0ic2V0Q2hhcnRUaW1lUmFuZ2UoNjApIiBpZD0icmFuZ2UtYnRuLTYwIiBjbGFzcz0iY2hhcnQtcmFuZ2UtYnRuIHB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctd2hpdGUgc2hhZG93LXNtIHRleHQtaW5kaWdvLTYwMCBmb250LWJvbGQgdHJhbnNpdGlvbiI+15fXldeT16nXmdeZ1508L2J1dHRvbj4NCiAgICAgICAgICAgIDxidXR0b24gb25jbGljaz0ic2V0Q2hhcnRUaW1lUmFuZ2UoMCkiIGlkPSJyYW5nZS1idG4tMCIgY2xhc3M9ImNoYXJ0LXJhbmdlLWJ0biBweC0yLjUgcHktMSByb3VuZGVkLWxnIHRleHQtc2xhdGUtNjAwIHRyYW5zaXRpb24iPteU15vXnDwvYnV0dG9uPg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICA8L2Rpdj4NCg0KICAgICAgICA8IS0tIENoYXJ0IENhbnZhcyBDb250YWluZXIgLS0+DQogICAgICAgIDxkaXYgY2xhc3M9InJlbGF0aXZlIHctZnVsbCBoLTgwIHNtOmgtOTYiPg0KICAgICAgICAgIDxjYW52YXMgaWQ9InRyYWluaW5nQ2hhcnQiPjwvY2FudmFzPg0KICAgICAgICA8L2Rpdj4NCg0KICAgICAgICA8IS0tIExlZ2VuZCBFeHBsYW5hdGlvbnMgLS0+DQogICAgICAgIDxkaXYgY2xhc3M9ImdyaWQgZ3JpZC1jb2xzLTIgc206Z3JpZC1jb2xzLTQgZ2FwLTIgcHQtMiB0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRl",
    "LTYwMCBib3JkZXItdCBib3JkZXItc2xhdGUtMTAwIj4NCiAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41Ij4NCiAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ3LTMgaC0zIHJvdW5kZWQtZnVsbCBiZy1bIzFmMjkzN10iPjwvc3Bhbj4NCiAgICAgICAgICAgIDxzcGFuPtei16bXmdee15XXqiDXntep15XXp9ec15zXqjwvc3Bhbj4NCiAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41Ij4NCiAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ3LTMgaC0zIHJvdW5kZWQtc20gYmctYmx1ZS00MDAvNDAgYm9yZGVyIGJvcmRlci1ibHVlLTQwMCI+PC9zcGFuPg0KICAgICAgICAgICAgPHNwYW4+16LXldee16Eg16fXnCAo15DXl9eV15bXldefIDMzKTwvc3Bhbj4NCiAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41Ij4NCiAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ3LTMgaC0zIHJvdW5kZWQtc20gYmctZ3JlZW4tNTAwLzQwIGJvcmRlciBib3JkZXItZ3JlZW4tNTAwIj48L3NwYW4+DQogICAgICAgICAgICA8c3Bhbj7XmNeV15XXlyDXkNeZ15PXmdeQ15zXmSAo15DXl9eV15bXldefIDkwKTwvc3Bhbj4NCiAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41Ij4NCiAgICAgICAgICAgIDxzcGFuIGNsYXNz",
    "PSJ3LTMgaC0zIHJvdW5kZWQtc20gYmctcmVkLTUwMC80MCBib3JkZXIgYm9yZGVyLXJlZC01MDAiPjwvc3Bhbj4NCiAgICAgICAgICAgIDxzcGFuPtei15XXntehINeZ16rXqCAvINep15nXkDwvc3Bhbj4NCiAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgPC9kaXY+DQogICAgICA8L2Rpdj4NCg0KICAgICAgPCEtLSBBd2F5IExvZyBGb3JtIChBY2NvcmRpb24gLyBDYXJkKSAtLT4NCiAgICAgIDxkaXYgY2xhc3M9ImJnLXdoaXRlIHJvdW5kZWQtMnhsIHAtNSBzaGFkb3ctc20gYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAiPg0KICAgICAgICA8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgb25jbGljaz0idG9nZ2xlQWNjb3JkaW9uKCdhd2F5TG9nQ2FyZENvbnRlbnQnLCAnYXdheUNoZXZyb24nKSINCiAgICAgICAgICBjbGFzcz0idy1mdWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB0ZXh0LXJpZ2h0Ij4NCiAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+DQogICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC14bCI+8J+PoTwvc3Bhbj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxoMyBjbGFzcz0iZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIHRleHQtYmFzZSI+16rXmdei15XXkyDXlNeZ16LXk9eo15XXqiDXntee15XXqdeb16ogKNeY15nXldecIC8g15DXmdeo15XXlyDXnteX15XXpSDXnNeR15nXqik8L2gzPg0KICAgICAgICAgICAgICA8cCBjbGFzcz0i",
    "dGV4dC14cyB0ZXh0LXNsYXRlLTUwMCI+157Xodee158g16jXp9eiINem15HXoteV16DXmSDXkdeS16jXoyDXnteR15zXmSDXnNeU15jXldeqINeQ16og157Xk9eTINeU16LXpteZ157XldeqPC9wPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPGkgZGF0YS1sdWNpZGU9ImNoZXZyb24tZG93biIgaWQ9ImF3YXlDaGV2cm9uIiBjbGFzcz0idy01IGgtNSB0ZXh0LXNsYXRlLTQwMCB0cmFuc2l0aW9uLXRyYW5zZm9ybSBkdXJhdGlvbi0yMDAiPjwvaT4NCiAgICAgICAgPC9idXR0b24+DQoNCiAgICAgICAgPGRpdiBpZD0iYXdheUxvZ0NhcmRDb250ZW50IiBjbGFzcz0iaGlkZGVuIG10LTQgcHQtNCBib3JkZXItdCBib3JkZXItc2xhdGUtMTAwIHNwYWNlLXktNCI+DQogICAgICAgICAgPHAgY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS02MDAgbGVhZGluZy1yZWxheGVkIj4NCiAgICAgICAgICAgINee16nXqtee16nXmdedINeR15fXnNenINeW15Qg15zXqteZ16LXldeTINeU15nXoteT16jXldeZ15XXqiDXkNeo15XXm9eV16og15vXk9eZINep15TXltee158g15nXodeV157XnyDXkdem15HXoiDXlNee16rXkNeZ150g16LXnCDXlNeS16jXoyDXldec15Ag15nXmNeUINeQ16og157Xk9eTINeU16LXpteZ157XldeqLg0KICAgICAgICAgIDwvcD4NCg0KICAgICAgICAgIDxmb3JtIGlkPSJmb3JtQXdheSIgb25zdWJtaXQ9ImhhbmRsZUF3YXlTdWJtaXQoZXZlbnQpIiBjbGFzcz0ic3Bh",
    "Y2UteS00Ij4NCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImdyaWQgZ3JpZC1jb2xzLTEgc206Z3JpZC1jb2xzLTIgZ2FwLTQiPg0KICAgICAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPvCfk4Ug16rXkNeo15nXmiDXqteX15nXnNeqINeU15nXoteT16jXldeqPC9sYWJlbD4NCiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0iZGF0ZSIgaWQ9ImF3YXlTdGFydCIgcmVxdWlyZWQgb25jaGFuZ2U9ImNhbGNBd2F5RGF5cygpIg0KICAgICAgICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTMgcHktMi41IHRleHQtc20gZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUiPg0KICAgICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7wn5OFINeq15DXqNeZ15og15fXlteo15Q8L2xhYmVsPg0KICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJkYXRlIiBpZD0iYXdheUVuZCIgcmVxdWlyZWQgb25jaGFuZ2U9ImNhbGNBd2F5RGF5cygpIg0KICAgICAgICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01",
    "MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTMgcHktMi41IHRleHQtc20gZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUiPg0KICAgICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7wn5ONINeQ15nXpNeUINee15nXmdek15wg16rXqdeU15Q/PC9sYWJlbD4NCiAgICAgICAgICAgICAgPHNlbGVjdCBpZD0iYXdheUxvY2F0aW9uIg0KICAgICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0zIHB5LTIuNSB0ZXh0LXNtIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWluZGlnby01MDAgZm9jdXM6b3V0bGluZS1ub25lIj4NCiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSLXkNem15wg15nXkNeZ16gg15HXntep16cg8J+anCI+15DXptecINeZ15DXmdeoINeR157XqdenIPCfmpwgKNeh15LXldecKTwvb3B0aW9uPg0KICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IteQ16bXnCDXoNeZ16fXldecINeR15TXqNem15zXmdeUIPCfj5bvuI8iPteQ16bXnCDXoNeZ16fXldecINeR15TXqNem15zXmdeUIPCfj5bvuI8gKNeY15XXqNen15nXlik8L29wdGlvbj4NCiAgICAg",
    "ICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSLXkNem15wg15fXkdeo15nXnSDXkdeq15wg15DXkdeZ15Eg8J+Pme+4jyI+15DXptecINeX15HXqNeZ150g15HXqtecINeQ15HXmdeRIPCfj5nvuI8gKNeb15fXldecKTwvb3B0aW9uPg0KICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IteR15HXmdeqINeb16nXnteZ16nXlNeVINep15XXnteoINei15zXmdeUIPCfj6AiPteR15HXmdeqINeb16nXnteZ16nXlNeVINep15XXnteoINei15zXmdeUIPCfj6AgKNeb16rXldedKTwvb3B0aW9uPg0KICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9Itek16DXodeZ15XXnyDwn5C+Ij7XpNeg16HXmdeV158g8J+QviAo15XXqNeV15MpPC9vcHRpb24+DQogICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0i15DXl9eoIOKcqCIgc2VsZWN0ZWQ+15DXl9eoIOKcqCAo15DXmdeg15PXmdeS15UpPC9vcHRpb24+DQogICAgICAgICAgICAgIDwvc2VsZWN0Pg0KICAgICAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPvCfk50g15TXoteo15XXqiDXotecINeU16rXp9eV16TXlDwvbGFiZWw+DQogICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJ0ZXh0IiBpZD0iYXdheU5vdGVzIiBwbGFjZWhvbGRlcj0i15DXmdeaINeU15LXmdeR15Q/INeU15DXnSDXlNeZ15Ug16nXmdeg15XXmdeZ",
    "150g15TXqteg15TXkteV16rXmdeZ150/Ig0KICAgICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0zIHB5LTIuNSB0ZXh0LXNtIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWluZGlnby01MDAgZm9jdXM6b3V0bGluZS1ub25lIj4NCiAgICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgICA8IS0tIER5bmFtaWMgRGF5cyBWYWxpZGF0aW9uIEJhbm5lciAtLT4NCiAgICAgICAgICAgIDxkaXYgaWQ9ImF3YXlEYXlzQmFubmVyIiBjbGFzcz0icC0zIHJvdW5kZWQteGwgdGV4dC14cyBmb250LW1lZGl1bSBiZy1pbmRpZ28tNTAgYm9yZGVyIGJvcmRlci1pbmRpZ28tMTAwIHRleHQtaW5kaWdvLTkwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+DQogICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LWJhc2UiPvCfkqE8L3NwYW4+DQogICAgICAgICAgICAgIDxzcGFuIGlkPSJhd2F5RGF5c1RleHQiPteh15TXtNebINeW157XnyDXlNeZ16LXk9eo15XXqiDXnteq15XXm9eg1586IDxiPjE0INeZ157XmdedPC9iPjwvc3Bhbj4NCiAgICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgICA8YnV0dG9uIHR5cGU9InN1Ym1pdCIgaWQ9ImJ0blN1Ym1pdEF3YXkiDQogICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgYmctaW5kaWdvLTYwMCBob3ZlcjpiZy1pbmRpZ28tNzAwIHRleHQtd2hpdGUgZm9udC1ib2xkIHB5LTMgcHgtNCByb3Vu",
    "ZGVkLXhsIHNoYWRvdy1tZCB0cmFuc2l0aW9uIHRyYW5zZm9ybSBhY3RpdmU6c2NhbGUtWzAuOTldIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0yIj4NCiAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9InNhdmUiIGNsYXNzPSJ3LTUgaC01Ij48L2k+DQogICAgICAgICAgICAgIDxzcGFuPtep157XldeoINeU15nXoteT16jXldeqIPCfkr48L3NwYW4+DQogICAgICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgICA8L2Zvcm0+DQogICAgICAgIDwvZGl2Pg0KICAgICAgPC9kaXY+DQoNCiAgICA8L3NlY3Rpb24+DQoNCiAgICA8IS0tID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLS0+DQogICAgPCEtLSBUQUIgMjog15TXkNeb15zXldeqIChGZWVkaW5nIFRyYWNrZXIpIC0tPg0KICAgIDwhLS0gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAtLT4NCiAgICA8c2VjdGlvbiBpZD0idGFiLWZlZWRpbmciIGNsYXNzPSJ0YWItY29udGVudCBzcGFjZS15LTYiPg0KICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIj4NCiAgICAgICAgPGRpdj4NCiAgICAgICAgICA8aDIgY2xhc3M9InRleHQteGwgZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIj7XmdeV157XnyDXkNeb15nXnNeUPC9oMj4NCiAg",
    "ICAgICAgICA8cCBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTUwMCI+16rXmdei15XXkyDXkNeo15XXl9eV16og15nXldee15nXldeqLCDXntei16fXkSDXm9ee15XXqiDXldeh15nXldedINee16DXlDwvcD4NCiAgICAgICAgPC9kaXY+DQogICAgICA8L2Rpdj4NCg0KICAgICAgPCEtLSBBZGQgRmVlZGluZyBGb3JtIENhcmQgLS0+DQogICAgICA8ZGl2IGNsYXNzPSJiZy13aGl0ZSByb3VuZGVkLTJ4bCBwLTUgc2hhZG93LXNtIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIj4NCiAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgbWItNCBwYi0yIGJvcmRlci1iIGJvcmRlci1zbGF0ZS0xMDAiPg0KICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPSJ1dGVuc2lscyIgY2xhc3M9InctNSBoLTUgdGV4dC1pbmRpZ28tNjAwIj48L2k+DQogICAgICAgICAgPGgzIGNsYXNzPSJmb250LWJvbGQgdGV4dC1zbGF0ZS04MDAgdGV4dC1iYXNlIj7wn42WINeU15XXodek16og15DXqNeV15fXlDwvaDM+DQogICAgICAgIDwvZGl2Pg0KDQogICAgICAgIDxmb3JtIGlkPSJmb3JtRmVlZGluZyIgb25zdWJtaXQ9ImhhbmRsZUZlZWRpbmdTdWJtaXQoZXZlbnQpIiBjbGFzcz0ic3BhY2UteS00Ij4NCiAgICAgICAgICA8ZGl2IGNsYXNzPSJncmlkIGdyaWQtY29scy0xIHNtOmdyaWQtY29scy0zIGdhcC00Ij4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBm",
    "b250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPteq15DXqNeZ15o8L2xhYmVsPg0KICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0iZGF0ZSIgaWQ9ImZlZWREYXRlIiByZXF1aXJlZA0KICAgICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0zIHB5LTIuNSB0ZXh0LXNtIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWluZGlnby01MDAgZm9jdXM6b3V0bGluZS1ub25lIj4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAgbWItMSI+16nXoteUPC9sYWJlbD4NCiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9InRpbWUiIGlkPSJmZWVkVGltZSIgcmVxdWlyZWQNCiAgICAgICAgICAgICAgICBjbGFzcz0iaW5wdXQtdGltZSB3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0zIHB5LTIuNSB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgdHJhY2tpbmctd2lkZXIgZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUiPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNs",
    "YXRlLTYwMCBtYi0xIj7XodeV15Ig15DXqNeV15fXlDwvbGFiZWw+DQogICAgICAgICAgICAgIDxzZWxlY3QgaWQ9ImZlZWRUeXBlIg0KICAgICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0zIHB5LTIuNSB0ZXh0LXNtIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWluZGlnby01MDAgZm9jdXM6b3V0bGluZS1ub25lIj4NCiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSLXkdeV16fXqCIgc2VsZWN0ZWQ+15HXlden16gg4piA77iPPC9vcHRpb24+DQogICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0i16LXqNeRIj7Xoteo15Eg8J+MmTwvb3B0aW9uPg0KICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IteQ15fXqCI+15DXl9eoIOKcqDwvb3B0aW9uPg0KICAgICAgICAgICAgICA8L3NlbGVjdD4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgPCEtLSBBbW91bnQgaW4gQ3VwcyB3aXRoIEdyYW1zIENvbnZlcnRlciAoMSBjdXAgPSA0MDBnKSAtLT4NCiAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIG1iLTEiPg0KICAgICAgICAgICAgICA8bGFiZWwgY2xhc3M9InRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCI+15vXnteV16ogKNeb15XXodeV16opPC9sYWJlbD4NCiAgICAg",
    "ICAgICAgICAgPHNwYW4gaWQ9ImZlZWRHcmFtc1RleHQiIGNsYXNzPSJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LWluZGlnby02MDAgYmctaW5kaWdvLTUwIHB4LTIgcHktMC41IHJvdW5kZWQtbWQiPg0KICAgICAgICAgICAgICAgIDEuMDAg15vXldehID0gNDAwINeS16jXnSAoMSDXm9eV16EgPSA0MDAg15LXqNedKQ0KICAgICAgICAgICAgICA8L3NwYW4+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0zIj4NCiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9InJhbmdlIiBpZD0iZmVlZEFtb3VudFNsaWRlciIgbWluPSIwLjI1IiBtYXg9IjQuMCIgc3RlcD0iMC4yNSIgdmFsdWU9IjEuMCINCiAgICAgICAgICAgICAgICBjbGFzcz0ic2xpZGVyLWx0ciB3LWZ1bGwgaC0yIGJnLXNsYXRlLTIwMCByb3VuZGVkLWxnIGFwcGVhcmFuY2Utbm9uZSBjdXJzb3ItcG9pbnRlciBhY2NlbnQtaW5kaWdvLTYwMCINCiAgICAgICAgICAgICAgICBvbmlucHV0PSJzeW5jRmVlZEFtb3VudCh0aGlzLnZhbHVlLCAnc2xpZGVyJykiPg0KICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0ibnVtYmVyIiBpZD0iZmVlZEFtb3VudE51bSIgbWluPSIwLjI1IiBtYXg9IjQuMCIgc3RlcD0iMC4yNSIgdmFsdWU9IjEuMCINCiAgICAgICAgICAgICAgICBjbGFzcz0iaW5wdXQtbHRyIHctMjQgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0y",
    "LjUgcHktMS41IHRleHQtc20gZm9udC1ib2xkIHRleHQtY2VudGVyIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWluZGlnby01MDAgZm9jdXM6b3V0bGluZS1ub25lIg0KICAgICAgICAgICAgICAgIG9uaW5wdXQ9InN5bmNGZWVkQW1vdW50KHRoaXMudmFsdWUsICdudW1iZXInKSI+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8L2Rpdj4NCg0KICAgICAgICAgIDwhLS0gRmluaXNoZWQgQ2hlY2tib3ggLyBUb2dnbGUgLS0+DQogICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHAtMyBiZy1zbGF0ZS01MCByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIj4NCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIj4NCiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQtbGciPvCfpaM8L3NwYW4+DQogICAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgICAgPGxhYmVsIGZvcj0iZmVlZEZpbmlzaGVkIiBjbGFzcz0idGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS04MDAgY3Vyc29yLXBvaW50ZXIiPteU15DXnSDXodeZ15nXnteUINeU15vXnD88L2xhYmVsPg0KICAgICAgICAgICAgICAgIDxwIGNsYXNzPSJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTUwMCI+16HXnteg15UgJ9ec15AnINeQ150g16DXqdeQ16gg15DXldeb15wg15HXp9ei16jXlDwvcD4NCiAgICAgICAgICAgICAgPC9kaXY+DQogICAgICAg",
    "ICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0icmVsYXRpdmUgaW5saW5lLWZsZXggaXRlbXMtY2VudGVyIGN1cnNvci1wb2ludGVyIj4NCiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9ImNoZWNrYm94IiBpZD0iZmVlZEZpbmlzaGVkIiBjaGVja2VkIGNsYXNzPSJzci1vbmx5IHBlZXIiPg0KICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJ3LTExIGgtNiBiZy1zbGF0ZS0zMDAgcGVlci1mb2N1czpvdXRsaW5lLW5vbmUgcm91bmRlZC1mdWxsIHBlZXIgcGVlci1jaGVja2VkOmFmdGVyOnRyYW5zbGF0ZS14LWZ1bGwgcnRsOnBlZXItY2hlY2tlZDphZnRlcjotdHJhbnNsYXRlLXgtZnVsbCBwZWVyLWNoZWNrZWQ6YWZ0ZXI6Ym9yZGVyLXdoaXRlIGFmdGVyOmNvbnRlbnQtWycnXSBhZnRlcjphYnNvbHV0ZSBhZnRlcjp0b3AtWzJweF0gYWZ0ZXI6c3RhcnQtWzJweF0gYWZ0ZXI6Ymctd2hpdGUgYWZ0ZXI6Ym9yZGVyLXNsYXRlLTMwMCBhZnRlcjpib3JkZXIgYWZ0ZXI6cm91bmRlZC1mdWxsIGFmdGVyOmgtNSBhZnRlcjp3LTUgYWZ0ZXI6dHJhbnNpdGlvbi1hbGwgcGVlci1jaGVja2VkOmJnLWVtZXJhbGQtNTAwIj48L2Rpdj4NCiAgICAgICAgICAgIDwvbGFiZWw+DQogICAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgICA8IS0tIE5vdGVzIC0tPg0KICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0x",
    "Ij7XlNei16jXldeqINeg15XXodek15XXqjwvbGFiZWw+DQogICAgICAgICAgICA8aW5wdXQgdHlwZT0idGV4dCIgaWQ9ImZlZWROb3RlcyIgcGxhY2Vob2xkZXI9Iteq15nXkNeR15XXnywg16rXldeh16TXldeqLCDXqdeZ16DXldeZ15nXnSINCiAgICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTMgcHktMi41IHRleHQtc20gZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUiPg0KICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgPGJ1dHRvbiB0eXBlPSJzdWJtaXQiIGlkPSJidG5TdWJtaXRGZWVkaW5nIg0KICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1pbmRpZ28tNjAwIGhvdmVyOmJnLWluZGlnby03MDAgdGV4dC13aGl0ZSBmb250LWJvbGQgcHktMyBweC00IHJvdW5kZWQteGwgc2hhZG93LW1kIHRyYW5zaXRpb24gdHJhbnNmb3JtIGFjdGl2ZTpzY2FsZS1bMC45OV0gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTIiPg0KICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9InNhdmUiIGNsYXNzPSJ3LTUgaC01Ij48L2k+DQogICAgICAgICAgICA8c3Bhbj7Xqdee15XXqCDXkNeo15XXl9eUIPCfkr48L3NwYW4+DQogICAgICAgICAgPC9idXR0b24+DQogICAgICAgIDwvZm9ybT4NCiAgICAgIDwvZGl2Pg0KDQogICAgICA8IS0tIEZlZWRpbmcgRGFpbHkgU3Rh",
    "Y2tlZCBCYXIgQ2hhcnQgLS0+DQogICAgICA8ZGl2IGNsYXNzPSJiZy13aGl0ZSByb3VuZGVkLTJ4bCBwLTUgc2hhZG93LXNtIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIHNwYWNlLXktNCI+DQogICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwYi0yIGJvcmRlci1iIGJvcmRlci1zbGF0ZS0xMDAiPg0KICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICA8aDMgY2xhc3M9ImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTgwMCB0ZXh0LWJhc2UiPtee16LXp9eRINeQ15vXmdec15QgKNeZ16jXldenPdeh15nXmdee15QsINeQ15PXldedPdec15Ag16HXmdeZ157XlCk8L2gzPg0KICAgICAgICAgICAgPHAgY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS01MDAiPvCfk4og15vXnteV16og15DXldeb15wg15nXldee15nXqiAo15vXldeh15XXqik8L3A+DQogICAgICAgICAgPC9kaXY+DQogICAgICAgIDwvZGl2Pg0KDQogICAgICAgIDxkaXYgY2xhc3M9InJlbGF0aXZlIHctZnVsbCBoLTcyIHNtOmgtODAiPg0KICAgICAgICAgIDxjYW52YXMgaWQ9ImZlZWRpbmdDaGFydCI+PC9jYW52YXM+DQogICAgICAgIDwvZGl2Pg0KICAgICAgPC9kaXY+DQogICAgPC9zZWN0aW9uPg0KDQogICAgPCEtLSA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC0tPg0KICAgIDwhLS0gVEFCIDM6INee16nXmdee15XXqiAoVGFz",
    "a3MgJiBFeGVjdXRpb24gTG9ncykgLS0+DQogICAgPCEtLSA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC0tPg0KICAgIDxzZWN0aW9uIGlkPSJ0YWItdGFza3MiIGNsYXNzPSJ0YWItY29udGVudCBzcGFjZS15LTYiPg0KICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIj4NCiAgICAgICAgPGRpdj4NCiAgICAgICAgICA8aDIgY2xhc3M9InRleHQteGwgZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIj7XoNeZ15TXldecINee16nXmdee15XXqjwvaDI+DQogICAgICAgICAgPHAgY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS01MDAiPteq16jXkteZ15zXmSDXkNeZ15zXldejLCDXqteT15nXqNeV16og15XXntei16fXkSDXkdeZ16bXldei15nXnTwvcD4NCiAgICAgICAgPC9kaXY+DQogICAgICA8L2Rpdj4NCg0KICAgICAgPCEtLSBOZXcgVGFzayBEZWZpbml0aW9uIEZvcm0gKEFjY29yZGlvbikgLS0+DQogICAgICA8ZGl2IGNsYXNzPSJiZy13aGl0ZSByb3VuZGVkLTJ4bCBwLTUgc2hhZG93LXNtIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIj4NCiAgICAgICAgPGJ1dHRvbiB0eXBlPSJidXR0b24iIG9uY2xpY2s9InRvZ2dsZUFjY29yZGlvbignbmV3VGFza0NhcmRDb250ZW50JywgJ3Rhc2tDaGV2cm9uJykiDQogICAgICAgICAgY2xhc3M9InctZnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5",
    "LWJldHdlZW4gdGV4dC1yaWdodCI+DQogICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIiPg0KICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQteGwiPuKelTwvc3Bhbj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxoMyBjbGFzcz0iZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIHRleHQtYmFzZSI+15nXpteZ16jXqiDXqteo15LXmdecINeX15PXqSDXkdee16LXqNeb16o8L2gzPg0KICAgICAgICAgICAgICA8cCBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTUwMCI+15TXldeh16TXqiDXqteo15LXmdecL9ee16nXmdee15Qg15zXp9eY15zXldeSPC9wPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPGkgZGF0YS1sdWNpZGU9ImNoZXZyb24tZG93biIgaWQ9InRhc2tDaGV2cm9uIiBjbGFzcz0idy01IGgtNSB0ZXh0LXNsYXRlLTQwMCB0cmFuc2l0aW9uLXRyYW5zZm9ybSBkdXJhdGlvbi0yMDAiPjwvaT4NCiAgICAgICAgPC9idXR0b24+DQoNCiAgICAgICAgPGRpdiBpZD0ibmV3VGFza0NhcmRDb250ZW50IiBjbGFzcz0iaGlkZGVuIG10LTQgcHQtNCBib3JkZXItdCBib3JkZXItc2xhdGUtMTAwIj4NCiAgICAgICAgICA8Zm9ybSBpZD0iZm9ybU5ld1Rhc2siIG9uc3VibWl0PSJoYW5kbGVOZXdUYXNrU3VibWl0KGV2ZW50KSIgY2xhc3M9InNwYWNlLXktNCI+DQogICAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgICA8bGFi",
    "ZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7XqdedINeU16rXqNeS15nXnCAqPC9sYWJlbD4NCiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9InRleHQiIGlkPSJ0YXNrTmFtZUlucHV0IiByZXF1aXJlZCBwbGFjZWhvbGRlcj0i15zXntep15w6INeU15nXqdeQ16jXldeqINeR157XmdeY15QiDQogICAgICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTMgcHktMi41IHRleHQtc20gZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUiPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7XqteT15nXqNeV16ogKNec157XqdecOiDXpNei157XmdeZ150g15HXmdeV150pPC9sYWJlbD4NCiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9InRleHQiIGlkPSJ0YXNrRnJlcUlucHV0IiBwbGFjZWhvbGRlcj0i16TXotee15nXmdedINeR15nXldedLCDXm9ecINeR15XXp9eoLCDXldeb15UnIg0KICAgICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0zIHB5LTIuNSB0ZXh0LXNtIGZvY3VzOnJpbmctMiBm",
    "b2N1czpyaW5nLWluZGlnby01MDAgZm9jdXM6b3V0bGluZS1ub25lIj4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAgbWItMSI+15PXktep15nXnSDXnNeR15nXpteV16I8L2xhYmVsPg0KICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0idGV4dCIgaWQ9InRhc2tEZXNjSW5wdXQiIHBsYWNlaG9sZGVyPSLXqdeX16jXldeoINeo16cg15HXpNen15XXk9eULCDXnteo15fXpyAzINee15jXqNeZ150uLi4iDQogICAgICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTMgcHktMi41IHRleHQtc20gZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUiPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICA8YnV0dG9uIHR5cGU9InN1Ym1pdCIgaWQ9ImJ0blN1Ym1pdE5ld1Rhc2siDQogICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtODAwIGhvdmVyOmJnLXNsYXRlLTkwMCB0ZXh0LXdoaXRlIGZvbnQtYm9sZCBweS0yLjUgcHgtNCByb3VuZGVkLXhsIHNoYWRvdyB0cmFuc2l0aW9uIj4NCiAgICAgICAgICAgICAg16bXldeoINeq16jXkteZ15wg4p6VDQogICAgICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgICA8L2Zvcm0+DQog",
    "ICAgICAgIDwvZGl2Pg0KICAgICAgPC9kaXY+DQoNCiAgICAgIDwhLS0gTG9nIFRhc2sgRXhlY3V0aW9uIEZvcm0gQ2FyZCAtLT4NCiAgICAgIDxkaXYgY2xhc3M9ImJnLXdoaXRlIHJvdW5kZWQtMnhsIHAtNSBzaGFkb3ctc20gYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAiPg0KICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtYi00IHBiLTIgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTEwMCI+DQogICAgICAgICAgPGkgZGF0YS1sdWNpZGU9ImNoZWNrLWNpcmNsZSIgY2xhc3M9InctNSBoLTUgdGV4dC1pbmRpZ28tNjAwIj48L2k+DQogICAgICAgICAgPGgzIGNsYXNzPSJmb250LWJvbGQgdGV4dC1zbGF0ZS04MDAgdGV4dC1iYXNlIj7inIUg16rXmdei15XXkyDXkdeZ16bXldeiINeq16jXkteZ15w8L2gzPg0KICAgICAgICA8L2Rpdj4NCg0KICAgICAgICA8Zm9ybSBpZD0iZm9ybUxvZ1Rhc2siIG9uc3VibWl0PSJoYW5kbGVMb2dUYXNrU3VibWl0KGV2ZW50KSIgY2xhc3M9InNwYWNlLXktNCI+DQogICAgICAgICAgPGRpdiBpZD0ibm9UYXNrc0FsZXJ0IiBjbGFzcz0iaGlkZGVuIHAtMyByb3VuZGVkLXhsIGJnLWFtYmVyLTUwIGJvcmRlciBib3JkZXItYW1iZXItMjAwIHRleHQtYW1iZXItODAwIHRleHQteHMiPg0KICAgICAgICAgICAg15DXmdefINeq16jXkteZ15zXmdedINek16LXmdec15nXnSDXkdee16LXqNeb16ouINem15XXqCDXqteo15LXmdecINeX15PXqSDXnNee16LXnNeULg0KICAg",
    "ICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgPGRpdiBpZD0ibG9nVGFza0ZpZWxkcyIgY2xhc3M9InNwYWNlLXktNCI+DQogICAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7XkdeX16gg16rXqNeS15nXnCDXnNeq15nXoteV15M6PC9sYWJlbD4NCiAgICAgICAgICAgICAgPHNlbGVjdCBpZD0ic2VsVGFza05hbWUiIHJlcXVpcmVkDQogICAgICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTMgcHktMi41IHRleHQtc20gZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUiPg0KICAgICAgICAgICAgICAgIDwhLS0gRHluYW1pY2FsbHkgcG9wdWxhdGVkIC0tPg0KICAgICAgICAgICAgICA8L3NlbGVjdD4NCiAgICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgICA8ZGl2IGNsYXNzPSJncmlkIGdyaWQtY29scy0xIHNtOmdyaWQtY29scy0yIGdhcC00Ij4NCiAgICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7XqteQ16jXmdeaINeR15nXpteV16I8L2xhYmVsPg0KICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJkYXRlIiBpZD0idGFza0V4ZWNE",
    "YXRlIiByZXF1aXJlZA0KICAgICAgICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTMgcHktMi41IHRleHQtc20gZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUiPg0KICAgICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gbWItMSI+DQogICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3M9InRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCI+15DXmdeaINeU15zXmj8gKDE915TXqteX15zXlCwgNT3Xqdec15nXmNeUINee15zXkNeUKTwvbGFiZWw+DQogICAgICAgICAgICAgICAgICA8c3BhbiBpZD0idGFza1Njb3JlRGlzcGxheSIgY2xhc3M9InRleHQteHMgZm9udC1ib2xkIHRleHQtaW5kaWdvLTYwMCBiZy1pbmRpZ28tNTAgcHgtMiBweS0wLjUgcm91bmRlZC1tZCI+MyAtINeR15nXoNeV16DXmTwvc3Bhbj4NCiAgICAgICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgICAgICA8ZGl2IGRpcj0ibHRyIiBjbGFzcz0ibXQtMSI+DQogICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0icmFuZ2UiIGlkPSJ0YXNrU2NvcmVTbGlkZXIiIG1pbj0iMSIgbWF4PSI1IiBzdGVwPSIxIiB2YWx1ZT0iMyINCiAgICAgICAgICAgICAgICAgICAg",
    "Y2xhc3M9InNsaWRlci1sdHIgdy1mdWxsIGgtMiBiZy1zbGF0ZS0yMDAgcm91bmRlZC1sZyBhcHBlYXJhbmNlLW5vbmUgY3Vyc29yLXBvaW50ZXIgYWNjZW50LWluZGlnby02MDAiDQogICAgICAgICAgICAgICAgICAgIG9uaW5wdXQ9InVwZGF0ZVRhc2tTY29yZUxhYmVsKHRoaXMudmFsdWUpIj4NCiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXgganVzdGlmeS1iZXR3ZWVuIHRleHQtWzEwcHhdIHRleHQtc2xhdGUtNTAwIHB4LTEgbXQtMSIgZGlyPSJsdHIiPg0KICAgICAgICAgICAgICAgICAgICA8c3Bhbj4xICjXlNeq15fXnNeUKTwvc3Bhbj4NCiAgICAgICAgICAgICAgICAgICAgPHNwYW4+Mjwvc3Bhbj4NCiAgICAgICAgICAgICAgICAgICAgPHNwYW4+Mzwvc3Bhbj4NCiAgICAgICAgICAgICAgICAgICAgPHNwYW4+NDwvc3Bhbj4NCiAgICAgICAgICAgICAgICAgICAgPHNwYW4+NSAo16nXnNeZ15jXlCDXntec15DXlCk8L3NwYW4+DQogICAgICAgICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICA8L2Rpdj4NCg0KICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAgbWItMSI+15TXoteo15XXqiDXotecINeU15HXmdem15XXojwvbGFiZWw+DQogICAgICAgICAgICAgIDx0ZXh0YXJlYSBpZD0idGFza0V4ZWNO",
    "b3RlcyIgcm93cz0iMiIgcGxhY2Vob2xkZXI9IteQ15nXmiDXlNeS15nXkdeUPyDXm9ee15Qg16TXotee15nXnSDXlNem15zXmdeX15Q/Ig0KICAgICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0zIHB5LTIgdGV4dC1zbSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1pbmRpZ28tNTAwIGZvY3VzOm91dGxpbmUtbm9uZSI+PC90ZXh0YXJlYT4NCiAgICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgICA8YnV0dG9uIHR5cGU9InN1Ym1pdCIgaWQ9ImJ0blN1Ym1pdFRhc2tMb2ciDQogICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgYmctaW5kaWdvLTYwMCBob3ZlcjpiZy1pbmRpZ28tNzAwIHRleHQtd2hpdGUgZm9udC1ib2xkIHB5LTMgcHgtNCByb3VuZGVkLXhsIHNoYWRvdy1tZCB0cmFuc2l0aW9uIHRyYW5zZm9ybSBhY3RpdmU6c2NhbGUtWzAuOTldIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0yIj4NCiAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9InNhdmUiIGNsYXNzPSJ3LTUgaC01Ij48L2k+DQogICAgICAgICAgICAgIDxzcGFuPteq15nXoteV15Mg15HXmdem15XXoiDwn5K+PC9zcGFuPg0KICAgICAgICAgICAgPC9idXR0b24+DQogICAgICAgICAgPC9kaXY+DQogICAgICAgIDwvZm9ybT4NCiAgICAgIDwvZGl2Pg0KDQogICAgICA8IS0tIFRhc2sgRXhlY3V0aW9uIFNjYXR0ZXIgUGxvdCAtLT4N",
    "CiAgICAgIDxkaXYgY2xhc3M9ImJnLXdoaXRlIHJvdW5kZWQtMnhsIHAtNSBzaGFkb3ctc20gYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgc3BhY2UteS00Ij4NCiAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHBiLTIgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTEwMCI+DQogICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgIDxoMyBjbGFzcz0iZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIHRleHQtYmFzZSI+157Xoten15Eg15TXptec15fXlCDXnNek15kg16rXqNeS15nXnDwvaDM+DQogICAgICAgICAgICA8cCBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTUwMCI+16bXmdeV158g15DXmdeb15XXqiAoMS01KSDXnNeQ15XXqNeaINem15nXqCDXlNeW157XnzwvcD4NCiAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgPGRpdiBjbGFzcz0icmVsYXRpdmUgdy1mdWxsIGgtNzIgc206aC04MCI+DQogICAgICAgICAgPGNhbnZhcyBpZD0idGFza3NDaGFydCI+PC9jYW52YXM+DQogICAgICAgIDwvZGl2Pg0KICAgICAgPC9kaXY+DQogICAgPC9zZWN0aW9uPg0KDQogICAgPCEtLSA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC0tPg0KICAgIDwhLS0gVEFCIDQ6INeU15nXodeY15XXqNeZ15Qg15XXmdeV157XnyAoSGlzdG9yeSAmIEZ1bGwgQ1JVRCBNYW5hZ2VtZW50KSAt",
    "LT4NCiAgICA8IS0tID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLS0+DQogICAgPHNlY3Rpb24gaWQ9InRhYi1oaXN0b3J5IiBjbGFzcz0idGFiLWNvbnRlbnQgc3BhY2UteS02Ij4NCiAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiI+DQogICAgICAgIDxkaXY+DQogICAgICAgICAgPGgyIGNsYXNzPSJ0ZXh0LXhsIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTgwMCI+15TXmdeh15jXldeo15nXlCDXldeZ15XXntefINee15zXkDwvaDI+DQogICAgICAgICAgPHAgY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS01MDAiPtem16TXmdeZ15Qg15HXqNep15XXnteV16osINei16jXmdeb15Qg15vXmdeo15XXqNeS15nXqiDXldee15fXmden16og16nXldeo15XXqjwvcD4NCiAgICAgICAgPC9kaXY+DQogICAgICA8L2Rpdj4NCg0KICAgICAgPCEtLSBTdWItTmF2aWdhdGlvbiBmb3IgSGlzdG9yeSBEb21haW5zIC0tPg0KICAgICAgPGRpdiBjbGFzcz0iZmxleCBvdmVyZmxvdy14LWF1dG8gZ2FwLTIgcGItMSBuby1zY3JvbGxiYXIiPg0KICAgICAgICA8YnV0dG9uIG9uY2xpY2s9InN3aXRjaEhpc3RvcnlEb21haW4oJ3RyYWluaW5nJykiIGlkPSJoZG9tLWJ0bi10cmFpbmluZyINCiAgICAgICAgICBjbGFzcz0iaGRvbS1idG4gcHgtMy41IHB5LTEuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIGJn",
    "LWluZGlnby02MDAgdGV4dC13aGl0ZSBzaGFkb3ctc20gd2hpdGVzcGFjZS1ub3dyYXAiPg0KICAgICAgICAgIPCfj4Mg15DXmdee15XXoNeZ150NCiAgICAgICAgPC9idXR0b24+DQogICAgICAgIDxidXR0b24gb25jbGljaz0ic3dpdGNoSGlzdG9yeURvbWFpbignZmVlZGluZycpIiBpZD0iaGRvbS1idG4tZmVlZGluZyINCiAgICAgICAgICBjbGFzcz0iaGRvbS1idG4gcHgtMy41IHB5LTEuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1zZW1pYm9sZCBiZy13aGl0ZSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCB0ZXh0LXNsYXRlLTYwMCBob3ZlcjpiZy1zbGF0ZS01MCB3aGl0ZXNwYWNlLW5vd3JhcCI+DQogICAgICAgICAg8J+mtCDXlNeQ15vXnNeV16oNCiAgICAgICAgPC9idXR0b24+DQogICAgICAgIDxidXR0b24gb25jbGljaz0ic3dpdGNoSGlzdG9yeURvbWFpbignYXdheScpIiBpZD0iaGRvbS1idG4tYXdheSINCiAgICAgICAgICBjbGFzcz0iaGRvbS1idG4gcHgtMy41IHB5LTEuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1zZW1pYm9sZCBiZy13aGl0ZSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCB0ZXh0LXNsYXRlLTYwMCBob3ZlcjpiZy1zbGF0ZS01MCB3aGl0ZXNwYWNlLW5vd3JhcCI+DQogICAgICAgICAg8J+PoSDXlNeZ16LXk9eo15XXmdeV16oNCiAgICAgICAgPC9idXR0b24+DQogICAgICAgIDxidXR0b24gb25jbGljaz0ic3dpdGNoSGlzdG9yeURvbWFpbigndGFza3MnKSIgaWQ9Imhkb20tYnRuLXRh",
    "c2tzIg0KICAgICAgICAgIGNsYXNzPSJoZG9tLWJ0biBweC0zLjUgcHktMS41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LXNlbWlib2xkIGJnLXdoaXRlIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIHRleHQtc2xhdGUtNjAwIGhvdmVyOmJnLXNsYXRlLTUwIHdoaXRlc3BhY2Utbm93cmFwIj4NCiAgICAgICAgICDwn46TINeR15nXpteV16LXmSDXntep15nXnteV16oNCiAgICAgICAgPC9idXR0b24+DQogICAgICA8L2Rpdj4NCg0KICAgICAgPCEtLSBIaXN0b3J5IFRhYmxlIC8gQ2FyZCBDb250YWluZXIgLS0+DQogICAgICA8ZGl2IGNsYXNzPSJiZy13aGl0ZSByb3VuZGVkLTJ4bCBzaGFkb3ctc20gYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgb3ZlcmZsb3ctaGlkZGVuIj4NCiAgICAgICAgPGRpdiBjbGFzcz0icC00IGJvcmRlci1iIGJvcmRlci1zbGF0ZS0xMDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGJnLXNsYXRlLTUwLzUwIj4NCiAgICAgICAgICA8ZGl2IGNsYXNzPSJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTcwMCIgaWQ9Imhpc3RvcnlEb21haW5IZWFkZXIiPg0KICAgICAgICAgICAg16jXqdeZ157XqiDXkNeZ157Xldeg15nXnSDXkNeX16jXldeg15nXnQ0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIGZvbnQtbWVkaXVtIiBpZD0iaGlzdG9yeUNvdW50QmFkZ2UiPjAg16jXqdeV157XldeqPC9zcGFuPg0KICAgICAg",
    "ICA8L2Rpdj4NCg0KICAgICAgICA8ZGl2IGlkPSJoaXN0b3J5VGFibGVDb250YWluZXIiIGNsYXNzPSJkaXZpZGUteSBkaXZpZGUtc2xhdGUtMTAwIG92ZXJmbG93LXgtYXV0byI+DQogICAgICAgICAgPCEtLSBEeW5hbWljYWxseSBwb3B1bGF0ZWQgZW50cmllcyAtLT4NCiAgICAgICAgPC9kaXY+DQogICAgICA8L2Rpdj4NCiAgICA8L3NlY3Rpb24+DQoNCiAgPC9tYWluPg0KDQogIDwhLS0gRWRpdCBJdGVtIE1vZGFsIC0tPg0KICA8ZGl2IGlkPSJlZGl0TW9kYWwiIGNsYXNzPSJmaXhlZCBpbnNldC0wIHotNTAgYmctc2xhdGUtOTAwLzUwIGJhY2tkcm9wLWJsdXItc20gaGlkZGVuIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTQiPg0KICAgIDxkaXYgY2xhc3M9ImJnLXdoaXRlIHJvdW5kZWQtMnhsIHNoYWRvdy0yeGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgbWF4LXctbGcgdy1mdWxsIG92ZXJmbG93LWhpZGRlbiBhbmltYXRlLWZhZGVJbiI+DQogICAgICA8ZGl2IGNsYXNzPSJwLTQgYmctc2xhdGUtNTAgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTIwMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4iPg0KICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+DQogICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQtbGciPuKcj++4jzwvc3Bhbj4NCiAgICAgICAgICA8aDMgaWQ9ImVkaXRNb2RhbFRpdGxlIiBjbGFzcz0iZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIHRleHQt",
    "c20iPtei16jXmdeb16og16jXqdeV157XlDwvaDM+DQogICAgICAgIDwvZGl2Pg0KICAgICAgICA8YnV0dG9uIG9uY2xpY2s9ImNsb3NlRWRpdE1vZGFsKCkiIGNsYXNzPSJ0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXNsYXRlLTYwMCBwLTEgcm91bmRlZC1sZyI+DQogICAgICAgICAgPGkgZGF0YS1sdWNpZGU9IngiIGNsYXNzPSJ3LTUgaC01Ij48L2k+DQogICAgICAgIDwvYnV0dG9uPg0KICAgICAgPC9kaXY+DQoNCiAgICAgIDxmb3JtIGlkPSJmb3JtRWRpdFJlY29yZCIgb25zdWJtaXQ9ImhhbmRsZUVkaXRNb2RhbFN1Ym1pdChldmVudCkiIGNsYXNzPSJwLTUgc3BhY2UteS00Ij4NCiAgICAgICAgPGlucHV0IHR5cGU9ImhpZGRlbiIgaWQ9ImVkaXRTaGVldE5hbWUiPg0KICAgICAgICA8aW5wdXQgdHlwZT0iaGlkZGVuIiBpZD0iZWRpdFJvd0luZGV4Ij4NCiAgICAgICAgDQogICAgICAgIDxkaXYgaWQ9ImVkaXRGaWVsZHNDb250YWluZXIiIGNsYXNzPSJzcGFjZS15LTMiPg0KICAgICAgICAgIDwhLS0gRHluYW1pYyBGb3JtIEZpZWxkcyAtLT4NCiAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBnYXAtMiBwdC0yIj4NCiAgICAgICAgICA8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgb25jbGljaz0iY2xvc2VFZGl0TW9kYWwoKSINCiAgICAgICAgICAgIGNsYXNzPSJmbGV4LTEgcHktMi41IHB4LTQgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCB0ZXh0LXNsYXRlLTcwMCBmb250",
    "LWJvbGQgaG92ZXI6Ymctc2xhdGUtNTAgdHJhbnNpdGlvbiI+DQogICAgICAgICAgICDXkdeZ15jXldecDQogICAgICAgICAgPC9idXR0b24+DQogICAgICAgICAgPGJ1dHRvbiB0eXBlPSJzdWJtaXQiIGlkPSJidG5TYXZlRWRpdCINCiAgICAgICAgICAgIGNsYXNzPSJmbGV4LTEgcHktMi41IHB4LTQgcm91bmRlZC14bCBiZy1pbmRpZ28tNjAwIGhvdmVyOmJnLWluZGlnby03MDAgdGV4dC13aGl0ZSBmb250LWJvbGQgc2hhZG93LW1kIHRyYW5zaXRpb24iPg0KICAgICAgICAgICAg16nXnteV16gg16nXmdeg15XXmdeZ150g8J+Svg0KICAgICAgICAgIDwvYnV0dG9uPg0KICAgICAgICA8L2Rpdj4NCiAgICAgIDwvZm9ybT4NCiAgICA8L2Rpdj4NCiAgPC9kaXY+DQoNCiAgPCEtLSBEZWxldGUgQ29uZmlybSBEaWFsb2cgTW9kYWwgLS0+DQogIDxkaXYgaWQ9ImRlbGV0ZU1vZGFsIiBjbGFzcz0iZml4ZWQgaW5zZXQtMCB6LTUwIGJnLXNsYXRlLTkwMC81MCBiYWNrZHJvcC1ibHVyLXNtIGhpZGRlbiBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00Ij4NCiAgICA8ZGl2IGNsYXNzPSJiZy13aGl0ZSByb3VuZGVkLTJ4bCBzaGFkb3ctMnhsIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIG1heC13LXNtIHctZnVsbCBwLTUgc3BhY2UteS00Ij4NCiAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0zIj4NCiAgICAgICAgPGRpdiBjbGFzcz0idy0xMCBoLTEwIHJvdW5kZWQtZnVsbCBiZy1yZWQtMTAwIGZs",
    "ZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtcmVkLTYwMCI+DQogICAgICAgICAgPGkgZGF0YS1sdWNpZGU9ImFsZXJ0LXRyaWFuZ2xlIiBjbGFzcz0idy01IGgtNSI+PC9pPg0KICAgICAgICA8L2Rpdj4NCiAgICAgICAgPGRpdj4NCiAgICAgICAgICA8aDQgY2xhc3M9ImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTgwMCI+15DXmdep15XXqCDXnteX15nXp9eUPC9oND4NCiAgICAgICAgICA8cCBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTUwMCI+16TXoteV15zXlCDXlteVINeq157Xl9enINeQ16og15TXqdeV16jXlCDXnNem157Xmdeq15XXqiDXnteU15LXmdec15nXldefLjwvcD4NCiAgICAgICAgPC9kaXY+DQogICAgICA8L2Rpdj4NCiAgICAgIA0KICAgICAgPHAgaWQ9ImRlbGV0ZU1vZGFsTWVzc2FnZSIgY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS02MDAgYmctc2xhdGUtNTAgcC0zIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0xMDAiPjwvcD4NCg0KICAgICAgPGRpdiBjbGFzcz0iZmxleCBnYXAtMiI+DQogICAgICAgIDxidXR0b24gb25jbGljaz0iY2xvc2VEZWxldGVNb2RhbCgpIg0KICAgICAgICAgIGNsYXNzPSJmbGV4LTEgcHktMiBweC0zIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgdGV4dC1zbGF0ZS03MDAgdGV4dC14cyBmb250LWJvbGQgaG92ZXI6Ymctc2xhdGUtNTAiPg0KICAgICAgICAgINeR15nXmNeV15wNCiAgICAgICAgPC9idXR0b24+DQogICAgICAg",
    "IDxidXR0b24gaWQ9ImJ0bkNvbmZpcm1EZWxldGUiIG9uY2xpY2s9ImV4ZWN1dGVEZWxldGVSZWNvcmQoKSINCiAgICAgICAgICBjbGFzcz0iZmxleC0xIHB5LTIgcHgtMyByb3VuZGVkLXhsIGJnLXJlZC02MDAgaG92ZXI6YmctcmVkLTcwMCB0ZXh0LXdoaXRlIHRleHQteHMgZm9udC1ib2xkIHNoYWRvdyI+DQogICAgICAgICAg15vXnywg157Xl9enIPCfl5HvuI8NCiAgICAgICAgPC9idXR0b24+DQogICAgICA8L2Rpdj4NCiAgICA8L2Rpdj4NCiAgPC9kaXY+DQoNCiAgPCEtLSBUb2FzdCBOb3RpZmljYXRpb24gQ29udGFpbmVyIC0tPg0KICA8ZGl2IGlkPSJ0b2FzdENvbnRhaW5lciIgY2xhc3M9ImZpeGVkIGJvdHRvbS0yMCBtZDpib3R0b20tNiBzdGFydC00IGVuZC00IG1kOnN0YXJ0LWF1dG8gbWQ6ZW5kLTYgei01MCBwb2ludGVyLWV2ZW50cy1ub25lIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIG1kOml0ZW1zLWVuZCBnYXAtMiI+PC9kaXY+DQoNCiAgPCEtLSBHbG9iYWwgTG9hZGluZyBTcGlubmVyIE92ZXJsYXkgLS0+DQogIDxkaXYgaWQ9ImxvYWRpbmdPdmVybGF5IiBjbGFzcz0iZml4ZWQgaW5zZXQtMCB6LTUwIGJnLXNsYXRlLTkwMC8zMCBiYWNrZHJvcC1ibHVyLVsycHhdIGhpZGRlbiBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIiPg0KICAgIDxkaXYgY2xhc3M9ImJnLXdoaXRlIHJvdW5kZWQtMnhsIHAtNCBzaGFkb3cteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0xMDAgZmxleCBpdGVtcy1jZW50ZXIg",
    "Z2FwLTMiPg0KICAgICAgPHN2ZyBjbGFzcz0iYW5pbWF0ZS1zcGluIHctNSBoLTUgdGV4dC1pbmRpZ28tNjAwIiBmaWxsPSJub25lIiB2aWV3Qm94PSIwIDAgMjQgMjQiPg0KICAgICAgICA8Y2lyY2xlIGNsYXNzPSJvcGFjaXR5LTI1IiBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjQiPjwvY2lyY2xlPg0KICAgICAgICA8cGF0aCBjbGFzcz0ib3BhY2l0eS03NSIgZmlsbD0iY3VycmVudENvbG9yIiBkPSJNNCAxMmE4IDggMCAwMTgtOFYwQzUuMzczIDAgMCA1LjM3MyAwIDEyaDR6bTIgNS4yOTFBNy45NjIgNy45NjIgMCAwMTQgMTJIMGMwIDMuMDQyIDEuMTM1IDUuODI0IDMgNy45MzhsMy0yLjY0N3oiPjwvcGF0aD4NCiAgICAgIDwvc3ZnPg0KICAgICAgPHNwYW4gaWQ9ImxvYWRpbmdNZXNzYWdlIiBjbGFzcz0idGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS03MDAiPtep15XXnteoINeg16rXldeg15nXnS4uLjwvc3Bhbj4NCiAgICA8L2Rpdj4NCiAgPC9kaXY+DQoNCiAgPCEtLSBNb2JpbGUgU3RpY2t5IEJvdHRvbSBOYXZpZ2F0aW9uIEJhciAtLT4NCiAgPG5hdiBjbGFzcz0ibWQ6aGlkZGVuIGZpeGVkIGJvdHRvbS0wIGluc2V0LXgtMCBiZy13aGl0ZS85NSBiYWNrZHJvcC1ibHVyLW1kIGJvcmRlci10IGJvcmRlci1zbGF0ZS0yMDAgei00MCBweC0yIHB5LTEgZmxleCBqdXN0aWZ5LWFyb3VuZCI+DQogICAgPGJ1dHRvbiBvbmNsaWNrPSJzd2l0Y2hUYWIo",
    "J3RyYWluaW5nJykiIGlkPSJtb2JpbGUtdGFiLXRyYWluaW5nIg0KICAgICAgY2xhc3M9Im5hdi10YWItYnRuIGZsZXgtMSBweS0xLjUgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgdGV4dC1pbmRpZ28tNjAwIGZvbnQtYm9sZCB0cmFuc2l0aW9uIj4NCiAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LWxnIj7wn4+DPC9zcGFuPg0KICAgICAgPHNwYW4gY2xhc3M9InRleHQtWzEwcHhdIG10LTAuNSI+15TXmdep15DXqNeV16o8L3NwYW4+DQogICAgPC9idXR0b24+DQogICAgPGJ1dHRvbiBvbmNsaWNrPSJzd2l0Y2hUYWIoJ2ZlZWRpbmcnKSIgaWQ9Im1vYmlsZS10YWItZmVlZGluZyINCiAgICAgIGNsYXNzPSJuYXYtdGFiLWJ0biBmbGV4LTEgcHktMS41IGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIHRleHQtc2xhdGUtNTAwIGZvbnQtbWVkaXVtIHRyYW5zaXRpb24iPg0KICAgICAgPHNwYW4gY2xhc3M9InRleHQtbGciPvCfprQ8L3NwYW4+DQogICAgICA8c3BhbiBjbGFzcz0idGV4dC1bMTBweF0gbXQtMC41Ij7XlNeQ15vXnNeV16o8L3NwYW4+DQogICAgPC9idXR0b24+DQogICAgPGJ1dHRvbiBvbmNsaWNrPSJzd2l0Y2hUYWIoJ3Rhc2tzJykiIGlkPSJtb2JpbGUtdGFiLXRhc2tzIg0KICAgICAgY2xhc3M9Im5hdi10YWItYnRuIGZsZXgtMSBweS0xLjUgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgdGV4dC1zbGF0ZS01MDAgZm9udC1tZWRpdW0gdHJhbnNpdGlvbiI+DQogICAgICA8c3BhbiBjbGFzcz0idGV4dC1s",
    "ZyI+8J+Okzwvc3Bhbj4NCiAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LVsxMHB4XSBtdC0wLjUiPtee16nXmdee15XXqjwvc3Bhbj4NCiAgICA8L2J1dHRvbj4NCiAgICA8YnV0dG9uIG9uY2xpY2s9InN3aXRjaFRhYignaGlzdG9yeScpIiBpZD0ibW9iaWxlLXRhYi1oaXN0b3J5Ig0KICAgICAgY2xhc3M9Im5hdi10YWItYnRuIGZsZXgtMSBweS0xLjUgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgdGV4dC1zbGF0ZS01MDAgZm9udC1tZWRpdW0gdHJhbnNpdGlvbiI+DQogICAgICA8c3BhbiBjbGFzcz0idGV4dC1sZyI+8J+Tijwvc3Bhbj4NCiAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LVsxMHB4XSBtdC0wLjUiPteU15nXodeY15XXqNeZ15Q8L3NwYW4+DQogICAgPC9idXR0b24+DQogIDwvbmF2Pg0KDQogIDwhLS0gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAtLT4NCiAgPCEtLSBDTElFTlQgQVBQTElDQVRJT04gSkFWQVNDUklQVCBMT0dJQyAtLT4NCiAgPCEtLSA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC0tPg0KICA8c2NyaXB0Pg0KICAgIC8vIEluamVjdGVkIGJvb3RzdHJhcHBlZCBkYXRhIGZyb20gR0FTIGJhY2tlbmQsIG9yIGxvY2FsIG1vY2sgZmFsbGJhY2sNCiAgICB2YXIgQk9PVFNUUkFQX0RBVEEgPSBudWxsOw0KICAgIHRyeSB7DQog",
    "ICAgICBCT09UU1RSQVBfREFUQSA9IDw/IT0gSlNPTi5zdHJpbmdpZnkoaW5pdGlhbERhdGEpID8+Ow0KICAgIH0gY2F0Y2ggKGUpIHsNCiAgICAgIC8vIExvY2FsIGRldmVsb3BtZW50IG9yIHByZXZpZXcgZmFsbGJhY2sNCiAgICAgIEJPT1RTVFJBUF9EQVRBID0gbnVsbDsNCiAgICB9DQoNCiAgICAvLyBEZWZhdWx0IG1vY2sgZGF0YXNldCBpZiBub3QgcnVubmluZyB3aXRoaW4gbGl2ZSBBcHBzIFNjcmlwdCB0ZW1wbGF0ZQ0KICAgIGlmICghQk9PVFNUUkFQX0RBVEEgfHwgQk9PVFNUUkFQX0RBVEEuZXJyb3IpIHsNCiAgICAgIEJPT1RTVFJBUF9EQVRBID0gew0KICAgICAgICB0cmFpbmluZzogWw0KICAgICAgICAgIHsgcm93SW5kZXg6IDIsIGRhdGU6ICcyMDI2LTExLTAxJywgdGltZTogJzEwOjAwJywgZHVyYXRpb246IDEuNSwgc3RyZXNzTGV2ZWw6IDEsIG5vdGVzOiAn16DXqdeQ16jXlCDXqNeS15XXoteUINeR157XmdeY15QnIH0sDQogICAgICAgICAgeyByb3dJbmRleDogMywgZGF0ZTogJzIwMjYtMTEtMDMnLCB0aW1lOiAnMTQ6MzAnLCBkdXJhdGlvbjogMi4yNSwgc3RyZXNzTGV2ZWw6IDIsIG5vdGVzOiAn15DXmS3Xqden15gg16fXnCDXkdeU16rXl9ec15QnIH0sDQogICAgICAgICAgeyByb3dJbmRleDogNCwgZGF0ZTogJzIwMjYtMTEtMDUnLCB0aW1lOiAnMDk6MTUnLCBkdXJhdGlvbjogMy4wLCBzdHJlc3NMZXZlbDogMywgbm90ZXM6ICfXoNeR15fXlCDXp9ec15XXqiDXldeX15bXqNeUINec16DXldeX",
    "JyB9LA0KICAgICAgICAgIHsgcm93SW5kZXg6IDUsIGRhdGU6ICcyMDI2LTExLTA4JywgdGltZTogJzEyOjAwJywgZHVyYXRpb246IDQuNSwgc3RyZXNzTGV2ZWw6IDQsIG5vdGVzOiAn157XpteV16fXlCDXkdei16fXkdeV16og16jXotepINeR15fXldelJyB9LA0KICAgICAgICAgIHsgcm93SW5kZXg6IDYsIGRhdGU6ICcyMDI2LTExLTEwJywgdGltZTogJzExOjAwJywgZHVyYXRpb246IDMuNSwgc3RyZXNzTGV2ZWw6IDIsIG5vdGVzOiAn15DXmdee15XXnyDXntei15XXnNeUJyB9DQogICAgICAgIF0sDQogICAgICAgIGF3YXlMb2c6IFsNCiAgICAgICAgICB7IHJvd0luZGV4OiAyLCBzdGFydERhdGU6ICcyMDI2LTEwLTE1JywgZW5kRGF0ZTogJzIwMjYtMTAtMjInLCBsb2NhdGlvbjogJ9eQ16bXnCDXmdeQ15nXqCDXkdee16nXpyDwn5qcJywgZGF5c0NvdW50OiA3LCBub3RlczogJ9eU16HXqteT16jXlCDXntem15XXmdefJyB9LA0KICAgICAgICAgIHsgcm93SW5kZXg6IDMsIHN0YXJ0RGF0ZTogJzIwMjYtMTEtMTInLCBlbmREYXRlOiAnMjAyNi0xMS0xNicsIGxvY2F0aW9uOiAn15DXptecINeg15nXp9eV15wg15HXlNeo16bXnNeZ15Qg8J+Plu+4jycsIGRheXNDb3VudDogNCwgbm90ZXM6ICfXl9eV16TXqdeUJyB9DQogICAgICAgIF0sDQogICAgICAgIGZlZWRpbmc6IFsNCiAgICAgICAgICB7IHJvd0luZGV4OiAyLCBkYXRlOiAnMjAyNi0xMS0wOScsIHRpbWU6ICcwODowMCcsIHR5cGU6ICfXkdeV16fXqCcsIGFt",
    "b3VudDogMS4wLCBmaW5pc2hlZDogJ9eb158nLCBub3RlczogJycgfSwNCiAgICAgICAgICB7IHJvd0luZGV4OiAzLCBkYXRlOiAnMjAyNi0xMS0wOScsIHRpbWU6ICcxOTowMCcsIHR5cGU6ICfXoteo15EnLCBhbW91bnQ6IDEuMCwgZmluaXNoZWQ6ICfXm9efJywgbm90ZXM6ICcnIH0sDQogICAgICAgICAgeyByb3dJbmRleDogNCwgZGF0ZTogJzIwMjYtMTEtMTAnLCB0aW1lOiAnMDg6MTUnLCB0eXBlOiAn15HXlden16gnLCBhbW91bnQ6IDEuMjUsIGZpbmlzaGVkOiAn15vXnycsIG5vdGVzOiAn16LXnSDXqteV16HXoycgfSwNCiAgICAgICAgICB7IHJvd0luZGV4OiA1LCBkYXRlOiAnMjAyNi0xMS0xMCcsIHRpbWU6ICcxOTozMCcsIHR5cGU6ICfXoteo15EnLCBhbW91bnQ6IDEuMCwgZmluaXNoZWQ6ICfXnNeQJywgbm90ZXM6ICfXlNep15DXmdeo15Qg16jXkdeiINeb15XXoScgfQ0KICAgICAgICBdLA0KICAgICAgICB0YXNrczogWw0KICAgICAgICAgIHsgcm93SW5kZXg6IDIsIHRhc2tOYW1lOiAn15TXmdep15DXqNeV16og15HXnteZ15jXlCcsIGZyZXF1ZW5jeTogJ9ek16LXnteZ15nXnSDXkdeZ15XXnScsIGRlc2NyaXB0aW9uOiAn16nXl9eo15XXqCDXqNenINeR16TXp9eV15PXlCwg157XqNeX16cgMyDXnteY16gnLCBzdGF0dXM6ICdBY3RpdmUnIH0sDQogICAgICAgICAgeyByb3dJbmRleDogMywgdGFza05hbWU6ICfXlNec15nXm9eUINeo15LXldei15Qg15HXqNem15XXoteUJywgZnJlcXVlbmN5OiAn15HX",
    "m9ecINeY15nXldecJywgZGVzY3JpcHRpb246ICfXotem15nXqNeUINeb16nXmdepINee16nXmdeb15QnLCBzdGF0dXM6ICdBY3RpdmUnIH0sDQogICAgICAgICAgeyByb3dJbmRleDogNCwgdGFza05hbWU6ICfXnteS16Ig15HXm9ek15XXqiDXqNeS15zXmdeZ150nLCBmcmVxdWVuY3k6ICfXpNei150g15HXmdeV150nLCBkZXNjcmlwdGlvbjogJ9eX15nXlteV16fXmdedINeX15nXldeR15nXmdedINei150g15fXmNeZ16MnLCBzdGF0dXM6ICdBY3RpdmUnIH0NCiAgICAgICAgXSwNCiAgICAgICAgdGFza0xvZ3M6IFsNCiAgICAgICAgICB7IHJvd0luZGV4OiAyLCBkYXRlOiAnMjAyNi0xMS0wOCcsIHRhc2tOYW1lOiAn15TXmdep15DXqNeV16og15HXnteZ15jXlCcsIHN1Y2Nlc3M6IDQsIG5vdGVzOiAn16DXqdeQ16jXlCA1INeT16fXldeqINep15zXnteV16onIH0sDQogICAgICAgICAgeyByb3dJbmRleDogMywgZGF0ZTogJzIwMjYtMTEtMDknLCB0YXNrTmFtZTogJ9eU15zXmdeb15Qg16jXkteV16LXlCDXkdeo16bXldei15QnLCBzdWNjZXNzOiAzLCBub3RlczogJ9en16bXqiDXntep15vXlCDXnNeZ15Mg15fXqteV15wnIH0sDQogICAgICAgICAgeyByb3dJbmRleDogNCwgZGF0ZTogJzIwMjYtMTEtMTAnLCB0YXNrTmFtZTogJ9eU15nXqdeQ16jXldeqINeR157XmdeY15QnLCBzdWNjZXNzOiA1LCBub3RlczogJ9ee15XXqdec150g15zXnNeQINep15XXnSDXqteW15XXlteUJyB9DQogICAgICAgIF0sDQogICAgICAg",
    "IGRlZmF1bHREdXJhdGlvbjogMi4yNQ0KICAgICAgfTsNCiAgICB9DQoNCiAgICAvLyBBcHBsaWNhdGlvbiBTdGF0ZQ0KICAgIHZhciBzdGF0ZSA9IHsNCiAgICAgIGFjdGl2ZVRhYjogJ3RyYWluaW5nJywNCiAgICAgIGhpc3RvcnlEb21haW46ICd0cmFpbmluZycsDQogICAgICBjaGFydFJhbmdlRGF5czogNjAsDQogICAgICBkYXRhOiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KEJPT1RTVFJBUF9EQVRBKSksDQogICAgICBjaGFydHM6IHsNCiAgICAgICAgdHJhaW5pbmc6IG51bGwsDQogICAgICAgIGZlZWRpbmc6IG51bGwsDQogICAgICAgIHRhc2tzOiBudWxsDQogICAgICB9LA0KICAgICAgZGVsZXRlUGVuZGluZzogbnVsbA0KICAgIH07DQoNCiAgICAvLyBMb2NhdGlvbiBjb2xvcnMgc3BlY2lmaWNhdGlvbg0KICAgIHZhciBMT0NBVElPTl9DT0xPUlMgPSB7DQogICAgICAi15DXptecINeZ15DXmdeoINeR157XqdenIPCfmpwiOiB7IGNvbG9yOiAiIzhFMjRBQSIsIHJnYmE6ICJyZ2JhKDE0MiwgMzYsIDE3MCwgMC4yMikiIH0sDQogICAgICAi15DXptecINeg15nXp9eV15wg15HXlNeo16bXnNeZ15Qg8J+Plu+4jyI6IHsgY29sb3I6ICIjMDA4OTdCIiwgcmdiYTogInJnYmEoMCwgMTM3LCAxMjMsIDAuMjIpIiB9LA0KICAgICAgIteQ16bXnCDXl9eR16jXmdedINeR16rXnCDXkNeR15nXkSDwn4+Z77iPIjogeyBjb2xvcjogIiMxRTg4RTUiLCByZ2JhOiAicmdiYSgzMCwgMTM2LCAyMjksIDAuMjIpIiB9LA0KICAg",
    "ICAgIteR15HXmdeqINeb16nXnteZ16nXlNeVINep15XXnteoINei15zXmdeUIPCfj6AiOiB7IGNvbG9yOiAiI0ZCOEMwMCIsIHJnYmE6ICJyZ2JhKDI1MSwgMTQwLCAwLCAwLjIyKSIgfSwNCiAgICAgICLXpNeg16HXmdeV158g8J+QviI6IHsgY29sb3I6ICIjRDgxQjYwIiwgcmdiYTogInJnYmEoMjE2LCAyNywgOTYsIDAuMjIpIiB9LA0KICAgICAgIteQ15fXqCDinKgiOiB7IGNvbG9yOiAiIzVFMzVCMSIsIHJnYmE6ICJyZ2JhKDk0LCA1MywgMTc3LCAwLjIyKSIgfQ0KICAgIH07DQoNCiAgICAvLyBTdHJlc3MgZGVzY3JpcHRpdmUgdGV4dCBtYXANCiAgICB2YXIgU1RSRVNTX01BUCA9IHsNCiAgICAgIDE6IHsgbGFiZWw6ICIxIC0g16jXkteV16LXlCDXnNeX15zXldeY15nXnyDwn5+iIiwgY29sb3I6ICIjMjJjNTVlIiwgYmc6ICJiZy1lbWVyYWxkLTUwIiwgdGV4dDogInRleHQtZW1lcmFsZC03MDAiIH0sDQogICAgICAyOiB7IGxhYmVsOiAiMiAtINeQ15kt16nXp9eYINen15wg8J+foSIsIGNvbG9yOiAiI2VhYjMwOCIsIGJnOiAiYmcteWVsbG93LTUwIiwgdGV4dDogInRleHQteWVsbG93LTcwMCIgfSwNCiAgICAgIDM6IHsgbGFiZWw6ICIzIC0g15zXl9elINeR15nXoNeV16DXmSDwn5+gIiwgY29sb3I6ICIjZjk3MzE2IiwgYmc6ICJiZy1vcmFuZ2UtNTAiLCB0ZXh0OiAidGV4dC1vcmFuZ2UtNzAwIiB9LA0KICAgICAgNDogeyBsYWJlbDogIjQgLSDXntem15XXp9eUINeS15HXldeU15Qg8J+UtCIsIGNvbG9yOiAi",
    "I2VmNDQ0NCIsIGJnOiAiYmctcmVkLTUwIiwgdGV4dDogInRleHQtcmVkLTcwMCIgfSwNCiAgICAgIDU6IHsgbGFiZWw6ICI1IC0g16TXkNeg15nXp9eUIPCfmqgiLCBjb2xvcjogIiNiOTFjMWMiLCBiZzogImJnLXJvc2UtNTAiLCB0ZXh0OiAidGV4dC1yb3NlLTcwMCIgfQ0KICAgIH07DQoNCiAgICAvKioNCiAgICAgKiBQcm9taXNlIHdyYXBwZXIgYXJvdW5kIGdvb2dsZS5zY3JpcHQucnVuDQogICAgICovDQogICAgZnVuY3Rpb24gY2FsbFNlcnZlcihtZXRob2QsIC4uLmFyZ3MpIHsNCiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHsNCiAgICAgICAgaWYgKHR5cGVvZiBnb29nbGUgIT09ICd1bmRlZmluZWQnICYmIGdvb2dsZS5zY3JpcHQgJiYgZ29vZ2xlLnNjcmlwdC5ydW4pIHsNCiAgICAgICAgICBnb29nbGUuc2NyaXB0LnJ1bg0KICAgICAgICAgICAgLndpdGhTdWNjZXNzSGFuZGxlcihyZXNvbHZlKQ0KICAgICAgICAgICAgLndpdGhGYWlsdXJlSGFuZGxlcihmdW5jdGlvbihlcnIpIHsNCiAgICAgICAgICAgICAgcmVqZWN0KGVycik7DQogICAgICAgICAgICB9KVttZXRob2RdKC4uLmFyZ3MpOw0KICAgICAgICB9IGVsc2Ugew0KICAgICAgICAgIC8vIExvY2FsIG1vY2sgaGFuZGxlcg0KICAgICAgICAgIGNvbnNvbGUud2FybignTG9jYWwgbW9jayBleGVjdXRpbmc6JywgbWV0aG9kLCBhcmdzKTsNCiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgew0KICAg",
    "ICAgICAgICAgdmFyIG1vY2tSZXMgPSBzaW11bGF0ZUxvY2FsU2VydmVyKG1ldGhvZCwgYXJncyk7DQogICAgICAgICAgICByZXNvbHZlKG1vY2tSZXMpOw0KICAgICAgICAgIH0sIDM1MCk7DQogICAgICAgIH0NCiAgICAgIH0pOw0KICAgIH0NCg0KICAgIC8qKg0KICAgICAqIExvY2FsIG1vY2sgc2ltdWxhdGlvbiBmb3IgdGVzdGluZyBvdXRzaWRlIEdvb2dsZSBBcHBzIFNjcmlwdCBlbnZpcm9ubWVudA0KICAgICAqLw0KICAgIGZ1bmN0aW9uIHNpbXVsYXRlTG9jYWxTZXJ2ZXIobWV0aG9kLCBhcmdzKSB7DQogICAgICBpZiAobWV0aG9kID09PSAnZ2V0SW5pdGlhbERhdGEnKSB7DQogICAgICAgIHJldHVybiBzdGF0ZS5kYXRhOw0KICAgICAgfQ0KICAgICAgaWYgKG1ldGhvZCA9PT0gJ2FkZFRyYWluaW5nU2Vzc2lvbicpIHsNCiAgICAgICAgdmFyIHJlYyA9IGFyZ3NbMF07DQogICAgICAgIHZhciBuZXdJZHggPSBzdGF0ZS5kYXRhLnRyYWluaW5nLmxlbmd0aCArIDI7DQogICAgICAgIHZhciBuZXdSb3cgPSB7DQogICAgICAgICAgcm93SW5kZXg6IG5ld0lkeCwNCiAgICAgICAgICBkYXRlOiByZWMuZGF0ZSwNCiAgICAgICAgICB0aW1lOiByZWMudGltZSwNCiAgICAgICAgICBkdXJhdGlvbjogTnVtYmVyKHJlYy5kdXJhdGlvbiksDQogICAgICAgICAgc3RyZXNzTGV2ZWw6IE51bWJlcihyZWMuc3RyZXNzTGV2ZWwpLA0KICAgICAgICAgIG5vdGVzOiByZWMubm90ZXMgfHwgJycNCiAgICAgICAgfTsNCiAgICAgICAg",
    "c3RhdGUuZGF0YS50cmFpbmluZy5wdXNoKG5ld1Jvdyk7DQogICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICfXlNeQ15nXnteV158g16DXqdee16gg15HXlNem15zXl9eUISAoJyArIHJlYy50aW1lICsgJywgJyArIHJlYy5kdXJhdGlvbiArICcg16nXoteV16opJywgcmVjb3JkOiBuZXdSb3cgfTsNCiAgICAgIH0NCiAgICAgIGlmIChtZXRob2QgPT09ICdhZGRBd2F5TG9nJykgew0KICAgICAgICB2YXIgcmVjID0gYXJnc1swXTsNCiAgICAgICAgdmFyIGQxID0gbmV3IERhdGUocmVjLnN0YXJ0RGF0ZSk7DQogICAgICAgIHZhciBkMiA9IG5ldyBEYXRlKHJlYy5lbmREYXRlKTsNCiAgICAgICAgdmFyIGRheXMgPSBNYXRoLnJvdW5kKChkMiAtIGQxKSAvICgxMDAwICogNjAgKiA2MCAqIDI0KSk7DQogICAgICAgIHZhciBuZXdSb3cgPSB7DQogICAgICAgICAgcm93SW5kZXg6IHN0YXRlLmRhdGEuYXdheUxvZy5sZW5ndGggKyAyLA0KICAgICAgICAgIHN0YXJ0RGF0ZTogcmVjLnN0YXJ0RGF0ZSwNCiAgICAgICAgICBlbmREYXRlOiByZWMuZW5kRGF0ZSwNCiAgICAgICAgICBsb2NhdGlvbjogcmVjLmxvY2F0aW9uLA0KICAgICAgICAgIGRheXNDb3VudDogZGF5cywNCiAgICAgICAgICBub3RlczogcmVjLm5vdGVzIHx8ICcnDQogICAgICAgIH07DQogICAgICAgIHN0YXRlLmRhdGEuYXdheUxvZy5wdXNoKG5ld1Jvdyk7DQogICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRheXNDb3VudDog",
    "ZGF5cywgbWVzc2FnZTogJ9eq16fXldek16og15TXlNeZ16LXk9eo15XXqiAoJyArIGRheXMgKyAnINeZ157XmdedKSDXoNep157XqNeUINeR15TXptec15fXlCEnLCByZWNvcmQ6IG5ld1JvdyB9Ow0KICAgICAgfQ0KICAgICAgaWYgKG1ldGhvZCA9PT0gJ2FkZEZlZWRpbmcnKSB7DQogICAgICAgIHZhciByZWMgPSBhcmdzWzBdOw0KICAgICAgICB2YXIgbmV3Um93ID0gew0KICAgICAgICAgIHJvd0luZGV4OiBzdGF0ZS5kYXRhLmZlZWRpbmcubGVuZ3RoICsgMiwNCiAgICAgICAgICBkYXRlOiByZWMuZGF0ZSwNCiAgICAgICAgICB0aW1lOiByZWMudGltZSwNCiAgICAgICAgICB0eXBlOiByZWMudHlwZSwNCiAgICAgICAgICBhbW91bnQ6IE51bWJlcihyZWMuYW1vdW50KSwNCiAgICAgICAgICBmaW5pc2hlZDogcmVjLmZpbmlzaGVkID8gJ9eb158nIDogJ9ec15AnLA0KICAgICAgICAgIG5vdGVzOiByZWMubm90ZXMgfHwgJycNCiAgICAgICAgfTsNCiAgICAgICAgc3RhdGUuZGF0YS5mZWVkaW5nLnB1c2gobmV3Um93KTsNCiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogJ9eU15DXqNeV15fXlCDXoNep157XqNeUIScsIHJlY29yZDogbmV3Um93IH07DQogICAgICB9DQogICAgICBpZiAobWV0aG9kID09PSAnYWRkVGFzaycpIHsNCiAgICAgICAgdmFyIHJlYyA9IGFyZ3NbMF07DQogICAgICAgIHZhciBuZXdSb3cgPSB7DQogICAgICAgICAgcm93SW5kZXg6IHN0YXRlLmRhdGEudGFza3MubGVu",
    "Z3RoICsgMiwNCiAgICAgICAgICB0YXNrTmFtZTogcmVjLnRhc2tOYW1lLA0KICAgICAgICAgIGZyZXF1ZW5jeTogcmVjLmZyZXF1ZW5jeSwNCiAgICAgICAgICBkZXNjcmlwdGlvbjogcmVjLmRlc2NyaXB0aW9uLA0KICAgICAgICAgIHN0YXR1czogJ0FjdGl2ZScNCiAgICAgICAgfTsNCiAgICAgICAgc3RhdGUuZGF0YS50YXNrcy5wdXNoKG5ld1Jvdyk7DQogICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICfXlNeq16jXkteZ15wg16DXldeh16Mg15zXqNep15nXnteUIScsIHJlY29yZDogbmV3Um93IH07DQogICAgICB9DQogICAgICBpZiAobWV0aG9kID09PSAnbG9nVGFza0V4ZWN1dGlvbicpIHsNCiAgICAgICAgdmFyIHJlYyA9IGFyZ3NbMF07DQogICAgICAgIHZhciBuZXdSb3cgPSB7DQogICAgICAgICAgcm93SW5kZXg6IHN0YXRlLmRhdGEudGFza0xvZ3MubGVuZ3RoICsgMiwNCiAgICAgICAgICBkYXRlOiByZWMuZGF0ZSwNCiAgICAgICAgICB0YXNrTmFtZTogcmVjLnRhc2tOYW1lLA0KICAgICAgICAgIHN1Y2Nlc3M6IE51bWJlcihyZWMuc3VjY2VzcyksDQogICAgICAgICAgbm90ZXM6IHJlYy5ub3RlcyB8fCAnJw0KICAgICAgICB9Ow0KICAgICAgICBzdGF0ZS5kYXRhLnRhc2tMb2dzLnB1c2gobmV3Um93KTsNCiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogJ9eU15HXmdem15XXoiDXqteV16LXkyDXkdeU16bXnNeX15QhJywgcmVjb3JkOiBuZXdSb3cgfTsN",
    "CiAgICAgIH0NCiAgICAgIGlmIChtZXRob2QgPT09ICd1cGRhdGVSb3cnKSB7DQogICAgICAgIHZhciBzaGVldE5hbWUgPSBhcmdzWzBdOw0KICAgICAgICB2YXIgcm93SWR4ID0gYXJnc1sxXTsNCiAgICAgICAgdmFyIHJvd0RhdGEgPSBhcmdzWzJdOw0KICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAn16nXldeo15QgJyArIHJvd0lkeCArICcg16LXldeT15vXoNeUIScgfTsNCiAgICAgIH0NCiAgICAgIGlmIChtZXRob2QgPT09ICdkZWxldGVSb3cnKSB7DQogICAgICAgIHZhciBzaGVldE5hbWUgPSBhcmdzWzBdOw0KICAgICAgICB2YXIgcm93SWR4ID0gYXJnc1sxXTsNCiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogJ9ep15XXqNeUICcgKyByb3dJZHggKyAnINeg157Xl9en15QhJyB9Ow0KICAgICAgfQ0KICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9Ow0KICAgIH0NCg0KICAgIC8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCiAgICAgKiBJTklUSUFMSVpBVElPTiAmIExJRkVDWUNMRQ0KICAgICAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8NCiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24oKSB7DQogICAgICB0cnkg",
    "ew0KICAgICAgICBpZiAodHlwZW9mIGx1Y2lkZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbHVjaWRlLmNyZWF0ZUljb25zKSB7DQogICAgICAgICAgbHVjaWRlLmNyZWF0ZUljb25zKCk7DQogICAgICAgIH0NCiAgICAgIH0gY2F0Y2ggKGVMdWNpZGUpIHsNCiAgICAgICAgY29uc29sZS53YXJuKCdMdWNpZGUgaWNvbnMgd2FybmluZzonLCBlTHVjaWRlKTsNCiAgICAgIH0NCiAgICAgIGluaXREYXRlSW5wdXRzKCk7DQogICAgICBpbml0RGVmYXVsdER1cmF0aW9ucygpOw0KICAgICAgcG9wdWxhdGVBY3RpdmVUYXNrc0Ryb3Bkb3duKCk7DQogICAgICB0cnkgeyByZW5kZXJUcmFpbmluZ0NoYXJ0KCk7IH0gY2F0Y2ggKGUpIHsgY29uc29sZS5lcnJvcignVHJhaW5pbmcgY2hhcnQgZXJyb3I6JywgZSk7IH0NCiAgICAgIHRyeSB7IHJlbmRlckZlZWRpbmdDaGFydCgpOyB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoJ0ZlZWRpbmcgY2hhcnQgZXJyb3I6JywgZSk7IH0NCiAgICAgIHRyeSB7IHJlbmRlclRhc2tzQ2hhcnQoKTsgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKCdUYXNrcyBjaGFydCBlcnJvcjonLCBlKTsgfQ0KICAgICAgdHJ5IHsgcmVuZGVySGlzdG9yeUxpc3QoKTsgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKCdIaXN0b3J5IGxpc3QgZXJyb3I6JywgZSk7IH0NCiAgICB9KTsNCg0KICAgIC8qKg0KICAgICAqIEluaXRpYWxpemUgZGF0ZSAmIHRpbWUgZm9ybSBwaWNrZXJzIHdpdGggY3VycmVudCBJc3Jh",
    "ZWwgU3RhbmRhcmQgVGltZQ0KICAgICAqLw0KICAgIGZ1bmN0aW9uIGluaXREYXRlSW5wdXRzKCkgew0KICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7DQogICAgICAvLyBGb3JtYXQgWVlZWS1NTS1ERA0KICAgICAgdmFyIHllYXIgPSBub3cuZ2V0RnVsbFllYXIoKTsNCiAgICAgIHZhciBtb250aCA9ICgnMCcgKyAobm93LmdldE1vbnRoKCkgKyAxKSkuc2xpY2UoLTIpOw0KICAgICAgdmFyIGRheSA9ICgnMCcgKyBub3cuZ2V0RGF0ZSgpKS5zbGljZSgtMik7DQogICAgICB2YXIgdG9kYXlTdHIgPSB5ZWFyICsgJy0nICsgbW9udGggKyAnLScgKyBkYXk7DQoNCiAgICAgIC8vIEZvcm1hdCBISDpNTQ0KICAgICAgdmFyIGhvdXJzID0gKCcwJyArIG5vdy5nZXRIb3VycygpKS5zbGljZSgtMik7DQogICAgICB2YXIgbWludXRlcyA9ICgnMCcgKyBub3cuZ2V0TWludXRlcygpKS5zbGljZSgtMik7DQogICAgICB2YXIgdGltZVN0ciA9IGhvdXJzICsgJzonICsgbWludXRlczsNCg0KICAgICAgLy8gUGx1cyAxNCBkYXlzIGZvciBkZWZhdWx0IGF3YXkgZW5kIGRhdGUNCiAgICAgIHZhciBmdXR1cmUgPSBuZXcgRGF0ZShub3cuZ2V0VGltZSgpICsgMTQgKiAyNCAqIDYwICogNjAgKiAxMDAwKTsNCiAgICAgIHZhciBmWWVhciA9IGZ1dHVyZS5nZXRGdWxsWWVhcigpOw0KICAgICAgdmFyIGZNb250aCA9ICgnMCcgKyAoZnV0dXJlLmdldE1vbnRoKCkgKyAxKSkuc2xpY2UoLTIpOw0KICAgICAgdmFyIGZEYXkgPSAoJzAnICsgZnV0",
    "dXJlLmdldERhdGUoKSkuc2xpY2UoLTIpOw0KICAgICAgdmFyIGZ1dHVyZVN0ciA9IGZZZWFyICsgJy0nICsgZk1vbnRoICsgJy0nICsgZkRheTsNCg0KICAgICAgLy8gU2V0IGlucHV0IHZhbHVlcw0KICAgICAgdmFyIGVsVHJhaW5EYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RyYWluRGF0ZScpOw0KICAgICAgdmFyIGVsVHJhaW5UaW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RyYWluVGltZScpOw0KICAgICAgaWYgKGVsVHJhaW5EYXRlKSBlbFRyYWluRGF0ZS52YWx1ZSA9IHRvZGF5U3RyOw0KICAgICAgaWYgKGVsVHJhaW5UaW1lKSBlbFRyYWluVGltZS52YWx1ZSA9IHRpbWVTdHI7DQoNCiAgICAgIHZhciBlbEF3YXlTdGFydCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhd2F5U3RhcnQnKTsNCiAgICAgIHZhciBlbEF3YXlFbmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXdheUVuZCcpOw0KICAgICAgaWYgKGVsQXdheVN0YXJ0KSBlbEF3YXlTdGFydC52YWx1ZSA9IHRvZGF5U3RyOw0KICAgICAgaWYgKGVsQXdheUVuZCkgZWxBd2F5RW5kLnZhbHVlID0gZnV0dXJlU3RyOw0KDQogICAgICB2YXIgZWxGZWVkRGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZWVkRGF0ZScpOw0KICAgICAgdmFyIGVsRmVlZFRpbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmVlZFRpbWUnKTsNCiAgICAgIGlmIChlbEZlZWREYXRlKSBlbEZlZWREYXRlLnZhbHVlID0gdG9kYXlTdHI7",
    "DQogICAgICBpZiAoZWxGZWVkVGltZSkgZWxGZWVkVGltZS52YWx1ZSA9IHRpbWVTdHI7DQoNCiAgICAgIHZhciBlbFRhc2tEYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Rhc2tFeGVjRGF0ZScpOw0KICAgICAgaWYgKGVsVGFza0RhdGUpIGVsVGFza0RhdGUudmFsdWUgPSB0b2RheVN0cjsNCg0KICAgICAgdXBkYXRlVHJhaW5DYWxjQmFubmVyKCk7DQogICAgICBjYWxjQXdheURheXMoKTsNCiAgICB9DQoNCiAgICAvKioNCiAgICAgKiBJbml0aWFsaXplcyBkZWZhdWx0IHRyYWluaW5nIGR1cmF0aW9uIGR5bmFtaWNhbGx5DQogICAgICovDQogICAgZnVuY3Rpb24gaW5pdERlZmF1bHREdXJhdGlvbnMoKSB7DQogICAgICB2YXIgZHVyID0gc3RhdGUuZGF0YS5kZWZhdWx0RHVyYXRpb24gfHwgMi41Ow0KICAgICAgc3luY1RyYWluRHVyYXRpb24oZHVyLCAnYm90aCcpOw0KICAgIH0NCg0KICAgIC8qKg0KICAgICAqIFBvcHVsYXRlcyB0aGUgYWN0aXZlIHRhc2tzIGRyb3Bkb3duIGluIHRoZSBUYXNrIEV4ZWN1dGlvbiBmb3JtDQogICAgICovDQogICAgZnVuY3Rpb24gcG9wdWxhdGVBY3RpdmVUYXNrc0Ryb3Bkb3duKCkgew0KICAgICAgdmFyIHNlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWxUYXNrTmFtZScpOw0KICAgICAgdmFyIG5vVGFza3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm9UYXNrc0FsZXJ0Jyk7DQogICAgICB2YXIgZmllbGRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQo",
    "J2xvZ1Rhc2tGaWVsZHMnKTsNCiAgICAgIGlmICghc2VsKSByZXR1cm47DQoNCiAgICAgIHZhciBhY3RpdmVUYXNrcyA9IChzdGF0ZS5kYXRhLnRhc2tzIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24odCkgew0KICAgICAgICByZXR1cm4gIXQuc3RhdHVzIHx8IHQuc3RhdHVzID09PSAnQWN0aXZlJzsNCiAgICAgIH0pOw0KDQogICAgICBzZWwuaW5uZXJIVE1MID0gJyc7DQogICAgICBpZiAoYWN0aXZlVGFza3MubGVuZ3RoID09PSAwKSB7DQogICAgICAgIGlmIChub1Rhc2tzKSBub1Rhc2tzLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpOw0KICAgICAgICBpZiAoZmllbGRzKSBmaWVsZHMuY2xhc3NMaXN0LmFkZCgnb3BhY2l0eS01MCcsICdwb2ludGVyLWV2ZW50cy1ub25lJyk7DQogICAgICB9IGVsc2Ugew0KICAgICAgICBpZiAobm9UYXNrcykgbm9UYXNrcy5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTsNCiAgICAgICAgaWYgKGZpZWxkcykgZmllbGRzLmNsYXNzTGlzdC5yZW1vdmUoJ29wYWNpdHktNTAnLCAncG9pbnRlci1ldmVudHMtbm9uZScpOw0KICAgICAgICBhY3RpdmVUYXNrcy5mb3JFYWNoKGZ1bmN0aW9uKHQpIHsNCiAgICAgICAgICB2YXIgb3B0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7DQogICAgICAgICAgb3B0LnZhbHVlID0gdC50YXNrTmFtZTsNCiAgICAgICAgICBvcHQudGV4dENvbnRlbnQgPSB0LnRhc2tOYW1lICsgKHQuZnJlcXVlbmN5ID8gJyAoJyArIHQuZnJlcXVlbmN5ICsg",
    "JyknIDogJycpOw0KICAgICAgICAgIHNlbC5hcHBlbmRDaGlsZChvcHQpOw0KICAgICAgICB9KTsNCiAgICAgIH0NCiAgICB9DQoNCiAgICAvKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09DQogICAgICogTkFWSUdBVElPTiAmIFRBQiBTV0lUQ0hJTkcNCiAgICAgKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovDQogICAgZnVuY3Rpb24gc3dpdGNoVGFiKHRhYklkKSB7DQogICAgICBzdGF0ZS5hY3RpdmVUYWIgPSB0YWJJZDsNCg0KICAgICAgLy8gVXBkYXRlIHRhYiBjb250ZW50cw0KICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnRhYi1jb250ZW50JykuZm9yRWFjaChmdW5jdGlvbihlbCkgew0KICAgICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTsNCiAgICAgIH0pOw0KICAgICAgdmFyIGFjdGl2ZUVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYi0nICsgdGFiSWQpOw0KICAgICAgaWYgKGFjdGl2ZUVsKSBhY3RpdmVFbC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTsNCg0KICAgICAgLy8gVXBkYXRlIERlc2t0b3AgTmF2IHN0eWxlcw0KICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm5hdi10YWItYnRuJykuZm9yRWFjaChmdW5jdGlvbihidG4pIHsNCiAgICAgICAgYnRuLmNsYXNzTGlzdC5y",
    "ZW1vdmUoJ2JvcmRlci1pbmRpZ28tNjAwJywgJ3RleHQtaW5kaWdvLTYwMCcpOw0KICAgICAgICBidG4uY2xhc3NMaXN0LmFkZCgnYm9yZGVyLXRyYW5zcGFyZW50JywgJ3RleHQtc2xhdGUtNjAwJyk7DQogICAgICB9KTsNCiAgICAgIHZhciBkQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Rlc2t0b3AtdGFiLScgKyB0YWJJZCk7DQogICAgICBpZiAoZEJ0bikgew0KICAgICAgICBkQnRuLmNsYXNzTGlzdC5yZW1vdmUoJ2JvcmRlci10cmFuc3BhcmVudCcsICd0ZXh0LXNsYXRlLTYwMCcpOw0KICAgICAgICBkQnRuLmNsYXNzTGlzdC5hZGQoJ2JvcmRlci1pbmRpZ28tNjAwJywgJ3RleHQtaW5kaWdvLTYwMCcpOw0KICAgICAgfQ0KDQogICAgICAvLyBVcGRhdGUgTW9iaWxlIE5hdiBzdHlsZXMNCiAgICAgIFsndHJhaW5pbmcnLCAnZmVlZGluZycsICd0YXNrcycsICdoaXN0b3J5J10uZm9yRWFjaChmdW5jdGlvbih0KSB7DQogICAgICAgIHZhciBtQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vYmlsZS10YWItJyArIHQpOw0KICAgICAgICBpZiAobUJ0bikgew0KICAgICAgICAgIGlmICh0ID09PSB0YWJJZCkgew0KICAgICAgICAgICAgbUJ0bi5jbGFzc0xpc3QuYWRkKCd0ZXh0LWluZGlnby02MDAnLCAnZm9udC1ib2xkJyk7DQogICAgICAgICAgICBtQnRuLmNsYXNzTGlzdC5yZW1vdmUoJ3RleHQtc2xhdGUtNTAwJywgJ2ZvbnQtbWVkaXVtJyk7DQogICAgICAgICAgfSBlbHNlIHsNCiAgICAgICAg",
    "ICAgIG1CdG4uY2xhc3NMaXN0LnJlbW92ZSgndGV4dC1pbmRpZ28tNjAwJywgJ2ZvbnQtYm9sZCcpOw0KICAgICAgICAgICAgbUJ0bi5jbGFzc0xpc3QuYWRkKCd0ZXh0LXNsYXRlLTUwMCcsICdmb250LW1lZGl1bScpOw0KICAgICAgICAgIH0NCiAgICAgICAgfQ0KICAgICAgfSk7DQoNCiAgICAgIC8vIFJlc2l6ZSBvciByZW5kZXIgY2hhcnRzIG9uIHRhYiBzd2l0Y2ggdG8gcHJldmVudCBjYW52YXMgc2l6aW5nIGdsaXRjaA0KICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsNCiAgICAgICAgaWYgKHRhYklkID09PSAndHJhaW5pbmcnICYmIHN0YXRlLmNoYXJ0cy50cmFpbmluZykgew0KICAgICAgICAgIHN0YXRlLmNoYXJ0cy50cmFpbmluZy5yZXNpemUoKTsNCiAgICAgICAgfSBlbHNlIGlmICh0YWJJZCA9PT0gJ2ZlZWRpbmcnKSB7DQogICAgICAgICAgcmVuZGVyRmVlZGluZ0NoYXJ0KCk7DQogICAgICAgIH0gZWxzZSBpZiAodGFiSWQgPT09ICd0YXNrcycpIHsNCiAgICAgICAgICByZW5kZXJUYXNrc0NoYXJ0KCk7DQogICAgICAgIH0gZWxzZSBpZiAodGFiSWQgPT09ICdoaXN0b3J5Jykgew0KICAgICAgICAgIHJlbmRlckhpc3RvcnlMaXN0KCk7DQogICAgICAgIH0NCiAgICAgIH0sIDUwKTsNCiAgICB9DQoNCiAgICBmdW5jdGlvbiB0b2dnbGVBY2NvcmRpb24oY29udGVudElkLCBjaGV2cm9uSWQpIHsNCiAgICAgIHZhciBjb250ZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29udGVudElkKTsNCiAg",
    "ICAgIHZhciBjaGV2cm9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY2hldnJvbklkKTsNCiAgICAgIGlmICghY29udGVudCkgcmV0dXJuOw0KICAgICAgaWYgKGNvbnRlbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdoaWRkZW4nKSkgew0KICAgICAgICBjb250ZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpOw0KICAgICAgICBpZiAoY2hldnJvbikgY2hldnJvbi5jbGFzc0xpc3QuYWRkKCdyb3RhdGUtMTgwJyk7DQogICAgICB9IGVsc2Ugew0KICAgICAgICBjb250ZW50LmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpOw0KICAgICAgICBpZiAoY2hldnJvbikgY2hldnJvbi5jbGFzc0xpc3QucmVtb3ZlKCdyb3RhdGUtMTgwJyk7DQogICAgICB9DQogICAgfQ0KDQogICAgLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQ0KICAgICAqIEZPUk0gSU5URVJBQ1RJVklUWSAmIFJFQUwtVElNRSBDQUxDVUxBVE9SUw0KICAgICAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8NCiAgICBmdW5jdGlvbiBzeW5jVHJhaW5EdXJhdGlvbih2YWwsIHNvdXJjZSkgew0KICAgICAgdmFyIG51bSA9IHBhcnNlRmxvYXQodmFsKTsNCiAgICAgIGlmIChpc05hTihudW0pKSBudW0gPSAwLjI1Ow0KICAgICAgbnVtID0gTWF0aC5tYXgoMC4yNSwgTWF0aC5taW4oMTIu",
    "MCwgTWF0aC5yb3VuZChudW0gKiA0KSAvIDQpKTsNCiAgICAgIA0KICAgICAgdmFyIHNTbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJhaW5EdXJhdGlvblNsaWRlcicpOw0KICAgICAgdmFyIHNOdW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJhaW5EdXJhdGlvbk51bScpOw0KICAgICAgdmFyIHNEaXNwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RyYWluRHVyYXRpb25EaXNwbGF5Jyk7DQoNCiAgICAgIGlmIChzb3VyY2UgPT09ICdzbGlkZXInICYmIHNOdW0pIHNOdW0udmFsdWUgPSBudW0udG9GaXhlZCgyKTsNCiAgICAgIGlmIChzb3VyY2UgPT09ICdudW1iZXInICYmIHNTbGlkZXIpIHNTbGlkZXIudmFsdWUgPSBudW07DQogICAgICBpZiAoc291cmNlID09PSAnYm90aCcpIHsNCiAgICAgICAgaWYgKHNTbGlkZXIpIHNTbGlkZXIudmFsdWUgPSBudW07DQogICAgICAgIGlmIChzTnVtKSBzTnVtLnZhbHVlID0gbnVtLnRvRml4ZWQoMik7DQogICAgICB9DQogICAgICBpZiAoc0Rpc3ApIHNEaXNwLnRleHRDb250ZW50ID0gbnVtLnRvRml4ZWQoMikgKyAnINep16LXldeqJzsNCg0KICAgICAgdXBkYXRlVHJhaW5DYWxjQmFubmVyKCk7DQogICAgfQ0KDQogICAgZnVuY3Rpb24gdXBkYXRlVHJhaW5DYWxjQmFubmVyKCkgew0KICAgICAgdmFyIHRpbWVWYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJhaW5UaW1lJyk/LnZhbHVlIHx8ICcxMDowMCc7DQogICAgICB2YXIgZHVyVmFs",
    "ID0gcGFyc2VGbG9hdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJhaW5EdXJhdGlvblNsaWRlcicpPy52YWx1ZSB8fCAyLjUpOw0KICAgICAgDQogICAgICB2YXIgcGFydHMgPSB0aW1lVmFsLnNwbGl0KCc6Jyk7DQogICAgICB2YXIgaCA9IHBhcnNlSW50KHBhcnRzWzBdLCAxMCkgfHwgMDsNCiAgICAgIHZhciBtID0gcGFyc2VJbnQocGFydHNbMV0sIDEwKSB8fCAwOw0KDQogICAgICB2YXIgc3RhcnRNaW51dGVzID0gaCAqIDYwICsgbTsNCiAgICAgIHZhciBlbmRNaW51dGVzID0gTWF0aC5yb3VuZChzdGFydE1pbnV0ZXMgKyBkdXJWYWwgKiA2MCk7DQoNCiAgICAgIHZhciBlbmRIID0gTWF0aC5mbG9vcigoZW5kTWludXRlcyAvIDYwKSAlIDI0KTsNCiAgICAgIHZhciBlbmRNID0gTWF0aC5mbG9vcihlbmRNaW51dGVzICUgNjApOw0KDQogICAgICB2YXIgZW5kU3RyID0gKCcwJyArIGVuZEgpLnNsaWNlKC0yKSArICc6JyArICgnMCcgKyBlbmRNKS5zbGljZSgtMik7DQoNCiAgICAgIHZhciBlbFN0YXJ0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbGNTdGFydCcpOw0KICAgICAgdmFyIGVsRW5kID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbGNFbmQnKTsNCiAgICAgIHZhciBlbER1ciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYWxjRHVyJyk7DQoNCiAgICAgIGlmIChlbFN0YXJ0KSBlbFN0YXJ0LnRleHRDb250ZW50ID0gdGltZVZhbDsNCiAgICAgIGlmIChlbEVuZCkgZWxFbmQudGV4dENv",
    "bnRlbnQgPSBlbmRTdHI7DQogICAgICBpZiAoZWxEdXIpIGVsRHVyLnRleHRDb250ZW50ID0gZHVyVmFsLnRvRml4ZWQoMikgKyAnINep16LXldeqJzsNCiAgICB9DQoNCiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJhaW5UaW1lJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgdXBkYXRlVHJhaW5DYWxjQmFubmVyKTsNCg0KICAgIGZ1bmN0aW9uIHNlbGVjdFN0cmVzcyhsZXZlbCkgew0KICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RyYWluU3RyZXNzJykudmFsdWUgPSBsZXZlbDsNCiAgICAgIHZhciBpbmZvID0gU1RSRVNTX01BUFtsZXZlbF0gfHwgU1RSRVNTX01BUFsyXTsNCiAgICAgIHZhciBsYWJlbEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0cmVzc1NlbGVjdGVkTGFiZWwnKTsNCiAgICAgIGlmIChsYWJlbEVsKSB7DQogICAgICAgIGxhYmVsRWwudGV4dENvbnRlbnQgPSBpbmZvLmxhYmVsOw0KICAgICAgICBsYWJlbEVsLmNsYXNzTmFtZSA9ICd0ZXh0LXhzIGZvbnQtYm9sZCBweC0yIHB5LTAuNSByb3VuZGVkLW1kICcgKyBpbmZvLmJnICsgJyAnICsgaW5mby50ZXh0Ow0KICAgICAgfQ0KDQogICAgICBmb3IgKHZhciBpID0gMTsgaSA8PSA1OyBpKyspIHsNCiAgICAgICAgdmFyIGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdHJlc3MtYnRuLScgKyBpKTsNCiAgICAgICAgaWYgKGJ0bikgew0KICAgICAgICAgIGlmIChpID09PSBsZXZlbCkgew0KICAgICAgICAg",
    "ICAgYnRuLmNsYXNzTmFtZSA9ICdzdHJlc3MtYnRuIHB5LTIgcHgtMSByb3VuZGVkLXhsIGJvcmRlci0yIGJvcmRlci1pbmRpZ28tNjAwIGJnLWluZGlnby01MCB0ZXh0LWNlbnRlciB0cmFuc2l0aW9uIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIHNoYWRvdy1zbSc7DQogICAgICAgICAgfSBlbHNlIHsNCiAgICAgICAgICAgIGJ0bi5jbGFzc05hbWUgPSAnc3RyZXNzLWJ0biBweS0yIHB4LTEgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBiZy13aGl0ZSBob3ZlcjpiZy1zbGF0ZS01MCB0ZXh0LWNlbnRlciB0cmFuc2l0aW9uIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyJzsNCiAgICAgICAgICB9DQogICAgICAgIH0NCiAgICAgIH0NCiAgICB9DQoNCiAgICBmdW5jdGlvbiBjYWxjQXdheURheXMoKSB7DQogICAgICB2YXIgc1ZhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhd2F5U3RhcnQnKT8udmFsdWU7DQogICAgICB2YXIgZVZhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhd2F5RW5kJyk/LnZhbHVlOw0KICAgICAgdmFyIGJhbm5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhd2F5RGF5c0Jhbm5lcicpOw0KICAgICAgdmFyIGJhbm5lclRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXdheURheXNUZXh0Jyk7DQogICAgICB2YXIgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0blN1Ym1pdEF3YXknKTsNCiAgICAgIGlmICghc1ZhbCB8fCAhZVZhbCB8",
    "fCAhYmFubmVyKSByZXR1cm47DQoNCiAgICAgIHZhciBkMSA9IG5ldyBEYXRlKHNWYWwpOw0KICAgICAgdmFyIGQyID0gbmV3IERhdGUoZVZhbCk7DQogICAgICB2YXIgZGlmZkRheXMgPSBNYXRoLnJvdW5kKChkMiAtIGQxKSAvICgxMDAwICogNjAgKiA2MCAqIDI0KSk7DQoNCiAgICAgIGlmIChkaWZmRGF5cyA8PSAwKSB7DQogICAgICAgIGJhbm5lci5jbGFzc05hbWUgPSAncC0zIHJvdW5kZWQteGwgdGV4dC14cyBmb250LW1lZGl1bSBiZy1hbWJlci01MCBib3JkZXIgYm9yZGVyLWFtYmVyLTIwMCB0ZXh0LWFtYmVyLTgwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMic7DQogICAgICAgIGJhbm5lclRleHQudGV4dENvbnRlbnQgPSAn16rXkNeo15nXmiDXlNeX15bXqNeUINeX15nXmdeRINec15TXmdeV16og157XkNeV15fXqCDXnteq15DXqNeZ15og15TXlNeq15fXnNeULic7DQogICAgICAgIGlmIChidG4pIHsNCiAgICAgICAgICBidG4uZGlzYWJsZWQgPSB0cnVlOw0KICAgICAgICAgIGJ0bi5jbGFzc0xpc3QuYWRkKCdvcGFjaXR5LTUwJywgJ2N1cnNvci1ub3QtYWxsb3dlZCcpOw0KICAgICAgICB9DQogICAgICB9IGVsc2Ugew0KICAgICAgICBiYW5uZXIuY2xhc3NOYW1lID0gJ3AtMyByb3VuZGVkLXhsIHRleHQteHMgZm9udC1tZWRpdW0gYmctaW5kaWdvLTUwIGJvcmRlciBib3JkZXItaW5kaWdvLTEwMCB0ZXh0LWluZGlnby05MDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTInOw0KICAgICAgICBiYW5uZXJUZXh0",
    "LmlubmVySFRNTCA9ICfwn5KhINeh15TXtNebINeW157XnyDXlNeZ16LXk9eo15XXqiDXnteq15XXm9eg1586IDxiPicgKyBkaWZmRGF5cyArICcg15nXnteZ1508L2I+JzsNCiAgICAgICAgaWYgKGJ0bikgew0KICAgICAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOw0KICAgICAgICAgIGJ0bi5jbGFzc0xpc3QucmVtb3ZlKCdvcGFjaXR5LTUwJywgJ2N1cnNvci1ub3QtYWxsb3dlZCcpOw0KICAgICAgICB9DQogICAgICB9DQogICAgfQ0KDQogICAgZnVuY3Rpb24gc3luY0ZlZWRBbW91bnQodmFsLCBzb3VyY2UpIHsNCiAgICAgIHZhciBudW0gPSBwYXJzZUZsb2F0KHZhbCk7DQogICAgICBpZiAoaXNOYU4obnVtKSkgbnVtID0gMS4wOw0KICAgICAgbnVtID0gTWF0aC5tYXgoMC4yNSwgTWF0aC5taW4oNC4wLCBNYXRoLnJvdW5kKG51bSAqIDQpIC8gNCkpOw0KDQogICAgICB2YXIgc1NsaWRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZWVkQW1vdW50U2xpZGVyJyk7DQogICAgICB2YXIgc051bSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZWVkQW1vdW50TnVtJyk7DQogICAgICB2YXIgc0dyYW1zID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZlZWRHcmFtc1RleHQnKTsNCg0KICAgICAgaWYgKHNvdXJjZSA9PT0gJ3NsaWRlcicgJiYgc051bSkgc051bS52YWx1ZSA9IG51bS50b0ZpeGVkKDIpOw0KICAgICAgaWYgKHNvdXJjZSA9PT0gJ251bWJlcicgJiYgc1NsaWRlcikgc1NsaWRlci52YWx1ZSA9",
    "IG51bTsNCg0KICAgICAgdmFyIGdyYW1zID0gTWF0aC5yb3VuZChudW0gKiA0MDApOw0KICAgICAgaWYgKHNHcmFtcykgew0KICAgICAgICBzR3JhbXMudGV4dENvbnRlbnQgPSBudW0udG9GaXhlZCgyKSArICcg15vXldehID0gJyArIGdyYW1zICsgJyDXkteo150gKDEg15vXldehID0gNDAwINeS16jXnSknOw0KICAgICAgfQ0KICAgIH0NCg0KICAgIGZ1bmN0aW9uIHVwZGF0ZVRhc2tTY29yZUxhYmVsKHZhbCkgew0KICAgICAgdmFyIG51bSA9IHBhcnNlSW50KHZhbCwgMTApOw0KICAgICAgdmFyIGxhYmVscyA9IHsNCiAgICAgICAgMTogJzEgLSDXlNeq15fXnNeUIPCfmJ4nLA0KICAgICAgICAyOiAnMiAtINec15Ag157XqdeU15Ug8J+ZgScsDQogICAgICAgIDM6ICczIC0g15HXmdeg15XXoNeZIPCfmJAnLA0KICAgICAgICA0OiAnNCAtINeY15XXkSDwn5mCJywNCiAgICAgICAgNTogJzUgLSDXqdec15nXmNeUINee15zXkNeUIPCfjJ8nDQogICAgICB9Ow0KICAgICAgdmFyIGRpc3AgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFza1Njb3JlRGlzcGxheScpOw0KICAgICAgaWYgKGRpc3ApIGRpc3AudGV4dENvbnRlbnQgPSBsYWJlbHNbbnVtXSB8fCAnMyAtINeR15nXoNeV16DXmSc7DQogICAgfQ0KDQogICAgLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQ0KICAgICAqIE1VVEFUSU9OIFNVQk1JU1NJT04gSEFORExFUlMN",
    "CiAgICAgKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovDQogICAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlVHJhaW5pbmdTdWJtaXQoZSkgew0KICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOw0KICAgICAgdmFyIGRhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJhaW5EYXRlJykudmFsdWU7DQogICAgICB2YXIgdGltZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmFpblRpbWUnKS52YWx1ZTsNCiAgICAgIHZhciBkdXIgPSBwYXJzZUZsb2F0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmFpbkR1cmF0aW9uU2xpZGVyJykudmFsdWUpOw0KICAgICAgdmFyIHN0cmVzcyA9IHBhcnNlSW50KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmFpblN0cmVzcycpLnZhbHVlLCAxMCk7DQogICAgICB2YXIgbm90ZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJhaW5Ob3RlcycpLnZhbHVlOw0KDQogICAgICBpZiAoIWR1ciB8fCBkdXIgPD0gMCkgew0KICAgICAgICBzaG93VG9hc3QoJ9ee16nXmiDXlNeQ15nXnteV158g15fXmdeZ15Eg15zXlNeZ15XXqiDXkteT15XXnCDXni0wIScsICdlcnJvcicpOw0KICAgICAgICByZXR1cm47DQogICAgICB9DQoNCiAgICAgIHNob3dTcGlubmVyKCfXqdeV157XqCDXkNeZ157XldefLi4uJyk7DQogICAgICB0cnkgew0KICAgICAgICB2YXIgcGF5bG9hZCA9IHsgZGF0ZTogZGF0",
    "ZSwgdGltZTogdGltZSwgZHVyYXRpb246IGR1ciwgc3RyZXNzTGV2ZWw6IHN0cmVzcywgbm90ZXM6IG5vdGVzIH07DQogICAgICAgIHZhciByZXMgPSBhd2FpdCBjYWxsU2VydmVyKCdhZGRUcmFpbmluZ1Nlc3Npb24nLCBwYXlsb2FkKTsNCiAgICAgICAgaWYgKHJlcy5zdWNjZXNzKSB7DQogICAgICAgICAgc2hvd1RvYXN0KHJlcy5tZXNzYWdlIHx8ICfXlNeQ15nXnteV158g16DXqdee16gg15HXlNem15zXl9eUISDwn5+iJywgJ3N1Y2Nlc3MnKTsNCiAgICAgICAgICAvLyBVcGRhdGUgbG9jYWwgc3RhdGUNCiAgICAgICAgICB2YXIgbmV3UmVjb3JkID0gcmVzLnJlY29yZCB8fCB7DQogICAgICAgICAgICByb3dJbmRleDogKHN0YXRlLmRhdGEudHJhaW5pbmcubGVuZ3RoICsgMiksDQogICAgICAgICAgICBkYXRlOiBkYXRlLA0KICAgICAgICAgICAgdGltZTogdGltZSwNCiAgICAgICAgICAgIGR1cmF0aW9uOiBkdXIsDQogICAgICAgICAgICBzdHJlc3NMZXZlbDogc3RyZXNzLA0KICAgICAgICAgICAgbm90ZXM6IG5vdGVzDQogICAgICAgICAgfTsNCiAgICAgICAgICBzdGF0ZS5kYXRhLnRyYWluaW5nLnB1c2gobmV3UmVjb3JkKTsNCiAgICAgICAgICAvLyBSZWNhbGN1bGF0ZSBkeW5hbWljIGRlZmF1bHQgZHVyYXRpb24NCiAgICAgICAgICByZWNhbGNEZWZhdWx0RHVyYXRpb24oKTsNCiAgICAgICAgICAvLyBSZXNldCBmb3JtIGZpZWxkcw0KICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmFpbk5v",
    "dGVzJykudmFsdWUgPSAnJzsNCiAgICAgICAgICAvLyBSZWZyZXNoIGNoYXJ0IGFuZCBoaXN0b3J5DQogICAgICAgICAgcmVuZGVyVHJhaW5pbmdDaGFydCgpOw0KICAgICAgICAgIHJlbmRlckhpc3RvcnlMaXN0KCk7DQogICAgICAgIH0gZWxzZSB7DQogICAgICAgICAgc2hvd1RvYXN0KCfXqdeS15nXkNeUINeR16nXnteZ16jXlDogJyArIChyZXMuZXJyb3IgfHwgJ9eq16fXnNeUINec15Ag15nXk9eV16LXlCcpLCAnZXJyb3InKTsNCiAgICAgICAgfQ0KICAgICAgfSBjYXRjaCAoZXJyKSB7DQogICAgICAgIHNob3dUb2FzdCgn16rXp9ec16og16rXp9ep15XXqNeqOiAnICsgZXJyLnRvU3RyaW5nKCksICdlcnJvcicpOw0KICAgICAgfSBmaW5hbGx5IHsNCiAgICAgICAgaGlkZVNwaW5uZXIoKTsNCiAgICAgIH0NCiAgICB9DQoNCiAgICBhc3luYyBmdW5jdGlvbiBoYW5kbGVBd2F5U3VibWl0KGUpIHsNCiAgICAgIGUucHJldmVudERlZmF1bHQoKTsNCiAgICAgIHZhciBzdGFydERhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXdheVN0YXJ0JykudmFsdWU7DQogICAgICB2YXIgZW5kRGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhd2F5RW5kJykudmFsdWU7DQogICAgICB2YXIgbG9jYXRpb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXdheUxvY2F0aW9uJykudmFsdWU7DQogICAgICB2YXIgbm90ZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXdheU5vdGVzJykudmFsdWU7DQoNCiAg",
    "ICAgIHZhciBkMSA9IG5ldyBEYXRlKHN0YXJ0RGF0ZSk7DQogICAgICB2YXIgZDIgPSBuZXcgRGF0ZShlbmREYXRlKTsNCiAgICAgIGlmIChkMiA8PSBkMSkgew0KICAgICAgICBzaG93VG9hc3QoJ9eq15DXqNeZ15og15TXl9eW16jXlCDXl9eZ15nXkSDXnNeU15nXldeqINee15DXldeX16gg157XqteQ16jXmdeaINeU15TXqteX15zXlC4nLCAnd2FybmluZycpOw0KICAgICAgICByZXR1cm47DQogICAgICB9DQoNCiAgICAgIHNob3dTcGlubmVyKCfXqdeV157XqCDXqten15XXpNeqINeU15nXoteT16jXldeqLi4uJyk7DQogICAgICB0cnkgew0KICAgICAgICB2YXIgcGF5bG9hZCA9IHsgc3RhcnREYXRlOiBzdGFydERhdGUsIGVuZERhdGU6IGVuZERhdGUsIGxvY2F0aW9uOiBsb2NhdGlvbiwgbm90ZXM6IG5vdGVzIH07DQogICAgICAgIHZhciByZXMgPSBhd2FpdCBjYWxsU2VydmVyKCdhZGRBd2F5TG9nJywgcGF5bG9hZCk7DQogICAgICAgIGlmIChyZXMuc3VjY2Vzcykgew0KICAgICAgICAgIHNob3dUb2FzdChyZXMubWVzc2FnZSB8fCAn16rXp9eV16TXqiDXlNeU15nXoteT16jXldeqINeg16nXnteo15Qg15HXlNem15zXl9eUIScsICdzdWNjZXNzJyk7DQogICAgICAgICAgdmFyIG5ld1JlY29yZCA9IHJlcy5yZWNvcmQgfHwgew0KICAgICAgICAgICAgcm93SW5kZXg6IChzdGF0ZS5kYXRhLmF3YXlMb2cubGVuZ3RoICsgMiksDQogICAgICAgICAgICBzdGFydERhdGU6IHN0YXJ0RGF0ZSwNCiAgICAgICAgICAgIGVu",
    "ZERhdGU6IGVuZERhdGUsDQogICAgICAgICAgICBsb2NhdGlvbjogbG9jYXRpb24sDQogICAgICAgICAgICBkYXlzQ291bnQ6IHJlcy5kYXlzQ291bnQsDQogICAgICAgICAgICBub3Rlczogbm90ZXMNCiAgICAgICAgICB9Ow0KICAgICAgICAgIHN0YXRlLmRhdGEuYXdheUxvZy5wdXNoKG5ld1JlY29yZCk7DQogICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F3YXlOb3RlcycpLnZhbHVlID0gJyc7DQogICAgICAgICAgcmVuZGVyVHJhaW5pbmdDaGFydCgpOw0KICAgICAgICAgIHJlbmRlckhpc3RvcnlMaXN0KCk7DQogICAgICAgICAgdG9nZ2xlQWNjb3JkaW9uKCdhd2F5TG9nQ2FyZENvbnRlbnQnLCAnYXdheUNoZXZyb24nKTsNCiAgICAgICAgfSBlbHNlIHsNCiAgICAgICAgICBzaG93VG9hc3QoJ9ep15LXmdeQ15Q6ICcgKyAocmVzLmVycm9yIHx8ICfXqten15zXlCcpLCAnZXJyb3InKTsNCiAgICAgICAgfQ0KICAgICAgfSBjYXRjaCAoZXJyKSB7DQogICAgICAgIHNob3dUb2FzdCgn16rXp9ec16og16rXp9ep15XXqNeqOiAnICsgZXJyLnRvU3RyaW5nKCksICdlcnJvcicpOw0KICAgICAgfSBmaW5hbGx5IHsNCiAgICAgICAgaGlkZVNwaW5uZXIoKTsNCiAgICAgIH0NCiAgICB9DQoNCiAgICBhc3luYyBmdW5jdGlvbiBoYW5kbGVGZWVkaW5nU3VibWl0KGUpIHsNCiAgICAgIGUucHJldmVudERlZmF1bHQoKTsNCiAgICAgIHZhciBkYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZlZWREYXRl",
    "JykudmFsdWU7DQogICAgICB2YXIgdGltZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZWVkVGltZScpLnZhbHVlOw0KICAgICAgdmFyIHR5cGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmVlZFR5cGUnKS52YWx1ZTsNCiAgICAgIHZhciBhbW91bnQgPSBwYXJzZUZsb2F0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZWVkQW1vdW50U2xpZGVyJykudmFsdWUpOw0KICAgICAgdmFyIGZpbmlzaGVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZlZWRGaW5pc2hlZCcpLmNoZWNrZWQ7DQogICAgICB2YXIgbm90ZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmVlZE5vdGVzJykudmFsdWU7DQoNCiAgICAgIHNob3dTcGlubmVyKCfXqdeV157XqCDXkNeo15XXl9eULi4uJyk7DQogICAgICB0cnkgew0KICAgICAgICB2YXIgcGF5bG9hZCA9IHsgZGF0ZTogZGF0ZSwgdGltZTogdGltZSwgdHlwZTogdHlwZSwgYW1vdW50OiBhbW91bnQsIGZpbmlzaGVkOiBmaW5pc2hlZCwgbm90ZXM6IG5vdGVzIH07DQogICAgICAgIHZhciByZXMgPSBhd2FpdCBjYWxsU2VydmVyKCdhZGRGZWVkaW5nJywgcGF5bG9hZCk7DQogICAgICAgIGlmIChyZXMuc3VjY2Vzcykgew0KICAgICAgICAgIHNob3dUb2FzdChyZXMubWVzc2FnZSB8fCAn15TXkNeo15XXl9eUINeg16nXnteo15QhJywgJ3N1Y2Nlc3MnKTsNCiAgICAgICAgICB2YXIgbmV3UmVjb3JkID0gcmVzLnJlY29yZCB8fCB7DQogICAgICAgICAgICByb3dJbmRl",
    "eDogKHN0YXRlLmRhdGEuZmVlZGluZy5sZW5ndGggKyAyKSwNCiAgICAgICAgICAgIGRhdGU6IGRhdGUsDQogICAgICAgICAgICB0aW1lOiB0aW1lLA0KICAgICAgICAgICAgdHlwZTogdHlwZSwNCiAgICAgICAgICAgIGFtb3VudDogYW1vdW50LA0KICAgICAgICAgICAgZmluaXNoZWQ6IGZpbmlzaGVkID8gJ9eb158nIDogJ9ec15AnLA0KICAgICAgICAgICAgbm90ZXM6IG5vdGVzDQogICAgICAgICAgfTsNCiAgICAgICAgICBzdGF0ZS5kYXRhLmZlZWRpbmcucHVzaChuZXdSZWNvcmQpOw0KICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZWVkTm90ZXMnKS52YWx1ZSA9ICcnOw0KICAgICAgICAgIHJlbmRlckZlZWRpbmdDaGFydCgpOw0KICAgICAgICAgIHJlbmRlckhpc3RvcnlMaXN0KCk7DQogICAgICAgIH0gZWxzZSB7DQogICAgICAgICAgc2hvd1RvYXN0KCfXqdeS15nXkNeUOiAnICsgKHJlcy5lcnJvciB8fCAn16rXp9ec15QnKSwgJ2Vycm9yJyk7DQogICAgICAgIH0NCiAgICAgIH0gY2F0Y2ggKGVycikgew0KICAgICAgICBzaG93VG9hc3QoJ9eq16fXnNeqINeq16fXqdeV16jXqjogJyArIGVyci50b1N0cmluZygpLCAnZXJyb3InKTsNCiAgICAgIH0gZmluYWxseSB7DQogICAgICAgIGhpZGVTcGlubmVyKCk7DQogICAgICB9DQogICAgfQ0KDQogICAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlTmV3VGFza1N1Ym1pdChlKSB7DQogICAgICBlLnByZXZlbnREZWZhdWx0KCk7DQogICAgICB2YXIgdGFz",
    "a05hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFza05hbWVJbnB1dCcpLnZhbHVlLnRyaW0oKTsNCiAgICAgIHZhciBmcmVxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Rhc2tGcmVxSW5wdXQnKS52YWx1ZS50cmltKCk7DQogICAgICB2YXIgZGVzYyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YXNrRGVzY0lucHV0JykudmFsdWUudHJpbSgpOw0KDQogICAgICBpZiAoIXRhc2tOYW1lKSB7DQogICAgICAgIHNob3dUb2FzdCgn16nXnSDXlNeq16jXkteZ15wg15DXmdeg15Ug15nXm9eV15wg15zXlNeZ15XXqiDXqNeZ16cuJywgJ3dhcm5pbmcnKTsNCiAgICAgICAgcmV0dXJuOw0KICAgICAgfQ0KDQogICAgICBzaG93U3Bpbm5lcign15nXldem16gg16rXqNeS15nXnC4uLicpOw0KICAgICAgdHJ5IHsNCiAgICAgICAgdmFyIHBheWxvYWQgPSB7IHRhc2tOYW1lOiB0YXNrTmFtZSwgZnJlcXVlbmN5OiBmcmVxLCBkZXNjcmlwdGlvbjogZGVzYyB9Ow0KICAgICAgICB2YXIgcmVzID0gYXdhaXQgY2FsbFNlcnZlcignYWRkVGFzaycsIHBheWxvYWQpOw0KICAgICAgICBpZiAocmVzLnN1Y2Nlc3MpIHsNCiAgICAgICAgICBzaG93VG9hc3QocmVzLm1lc3NhZ2UgfHwgJ9eU16rXqNeS15nXnCDXoNeV16HXoyDXnNeo16nXmdee15QhJywgJ3N1Y2Nlc3MnKTsNCiAgICAgICAgICB2YXIgbmV3UmVjb3JkID0gcmVzLnJlY29yZCB8fCB7DQogICAgICAgICAgICByb3dJbmRleDogKHN0YXRlLmRhdGEudGFza3Mu",
    "bGVuZ3RoICsgMiksDQogICAgICAgICAgICB0YXNrTmFtZTogdGFza05hbWUsDQogICAgICAgICAgICBmcmVxdWVuY3k6IGZyZXEsDQogICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzYywNCiAgICAgICAgICAgIHN0YXR1czogJ0FjdGl2ZScNCiAgICAgICAgICB9Ow0KICAgICAgICAgIHN0YXRlLmRhdGEudGFza3MucHVzaChuZXdSZWNvcmQpOw0KICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YXNrTmFtZUlucHV0JykudmFsdWUgPSAnJzsNCiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFza0ZyZXFJbnB1dCcpLnZhbHVlID0gJyc7DQogICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Rhc2tEZXNjSW5wdXQnKS52YWx1ZSA9ICcnOw0KICAgICAgICAgIHBvcHVsYXRlQWN0aXZlVGFza3NEcm9wZG93bigpOw0KICAgICAgICAgIHJlbmRlckhpc3RvcnlMaXN0KCk7DQogICAgICAgICAgdG9nZ2xlQWNjb3JkaW9uKCduZXdUYXNrQ2FyZENvbnRlbnQnLCAndGFza0NoZXZyb24nKTsNCiAgICAgICAgfSBlbHNlIHsNCiAgICAgICAgICBzaG93VG9hc3QoJ9ep15LXmdeQ15Q6ICcgKyAocmVzLmVycm9yIHx8ICfXqten15zXlCcpLCAnZXJyb3InKTsNCiAgICAgICAgfQ0KICAgICAgfSBjYXRjaCAoZXJyKSB7DQogICAgICAgIHNob3dUb2FzdCgn16rXp9ec16og16rXp9ep15XXqNeqOiAnICsgZXJyLnRvU3RyaW5nKCksICdlcnJvcicpOw0KICAgICAgfSBmaW5hbGx5IHsNCiAg",
    "ICAgICAgaGlkZVNwaW5uZXIoKTsNCiAgICAgIH0NCiAgICB9DQoNCiAgICBhc3luYyBmdW5jdGlvbiBoYW5kbGVMb2dUYXNrU3VibWl0KGUpIHsNCiAgICAgIGUucHJldmVudERlZmF1bHQoKTsNCiAgICAgIHZhciB0YXNrTmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWxUYXNrTmFtZScpLnZhbHVlOw0KICAgICAgdmFyIGRhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFza0V4ZWNEYXRlJykudmFsdWU7DQogICAgICB2YXIgc2NvcmUgPSBwYXJzZUludChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFza1Njb3JlU2xpZGVyJykudmFsdWUsIDEwKTsNCiAgICAgIHZhciBub3RlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YXNrRXhlY05vdGVzJykudmFsdWUudHJpbSgpOw0KDQogICAgICBpZiAoIXRhc2tOYW1lKSB7DQogICAgICAgIHNob3dUb2FzdCgn15fXldeR15Qg15zXkdeX15XXqCDXqteo15LXmdecLicsICd3YXJuaW5nJyk7DQogICAgICAgIHJldHVybjsNCiAgICAgIH0NCg0KICAgICAgc2hvd1NwaW5uZXIoJ9ee16rXoteTINeR15nXpteV16Ig16rXqNeS15nXnC4uLicpOw0KICAgICAgdHJ5IHsNCiAgICAgICAgdmFyIHBheWxvYWQgPSB7IHRhc2tOYW1lOiB0YXNrTmFtZSwgZGF0ZTogZGF0ZSwgc3VjY2Vzczogc2NvcmUsIG5vdGVzOiBub3RlcyB9Ow0KICAgICAgICB2YXIgcmVzID0gYXdhaXQgY2FsbFNlcnZlcignbG9nVGFza0V4ZWN1dGlvbicsIHBheWxvYWQpOw0KICAg",
    "ICAgICBpZiAocmVzLnN1Y2Nlc3MpIHsNCiAgICAgICAgICBzaG93VG9hc3QocmVzLm1lc3NhZ2UgfHwgJ9eU15HXmdem15XXoiDXqteV16LXkyDXkdeU16bXnNeX15QhJywgJ3N1Y2Nlc3MnKTsNCiAgICAgICAgICB2YXIgbmV3UmVjb3JkID0gcmVzLnJlY29yZCB8fCB7DQogICAgICAgICAgICByb3dJbmRleDogKHN0YXRlLmRhdGEudGFza0xvZ3MubGVuZ3RoICsgMiksDQogICAgICAgICAgICBkYXRlOiBkYXRlLA0KICAgICAgICAgICAgdGFza05hbWU6IHRhc2tOYW1lLA0KICAgICAgICAgICAgc3VjY2Vzczogc2NvcmUsDQogICAgICAgICAgICBub3Rlczogbm90ZXMNCiAgICAgICAgICB9Ow0KICAgICAgICAgIHN0YXRlLmRhdGEudGFza0xvZ3MucHVzaChuZXdSZWNvcmQpOw0KICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YXNrRXhlY05vdGVzJykudmFsdWUgPSAnJzsNCiAgICAgICAgICByZW5kZXJUYXNrc0NoYXJ0KCk7DQogICAgICAgICAgcmVuZGVySGlzdG9yeUxpc3QoKTsNCiAgICAgICAgfSBlbHNlIHsNCiAgICAgICAgICBzaG93VG9hc3QoJ9ep15LXmdeQ15Q6ICcgKyAocmVzLmVycm9yIHx8ICfXqten15zXlCcpLCAnZXJyb3InKTsNCiAgICAgICAgfQ0KICAgICAgfSBjYXRjaCAoZXJyKSB7DQogICAgICAgIHNob3dUb2FzdCgn16rXp9ec16og16rXp9ep15XXqNeqOiAnICsgZXJyLnRvU3RyaW5nKCksICdlcnJvcicpOw0KICAgICAgfSBmaW5hbGx5IHsNCiAgICAgICAgaGlkZVNwaW5u",
    "ZXIoKTsNCiAgICAgIH0NCiAgICB9DQoNCiAgICBmdW5jdGlvbiByZWNhbGNEZWZhdWx0RHVyYXRpb24oKSB7DQogICAgICB2YXIgbWF4RHVyID0gMDsNCiAgICAgIChzdGF0ZS5kYXRhLnRyYWluaW5nIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKHMpIHsNCiAgICAgICAgdmFyIGQgPSBwYXJzZUZsb2F0KHMuZHVyYXRpb24pOw0KICAgICAgICBpZiAoIWlzTmFOKGQpICYmIGQgPiBtYXhEdXIpIG1heER1ciA9IGQ7DQogICAgICB9KTsNCiAgICAgIGlmIChtYXhEdXIgPiAwKSB7DQogICAgICAgIHN0YXRlLmRhdGEuZGVmYXVsdER1cmF0aW9uID0gTWF0aC5yb3VuZCgobWF4RHVyIC8gMi4wKSAqIDQpIC8gNDsNCiAgICAgIH0gZWxzZSB7DQogICAgICAgIHN0YXRlLmRhdGEuZGVmYXVsdER1cmF0aW9uID0gMi41Ow0KICAgICAgfQ0KICAgIH0NCg0KICAgIGFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hBbGxEYXRhKCkgew0KICAgICAgc2hvd1NwaW5uZXIoJ9ee16jXoteg158g16DXqteV16DXmdedLi4uJyk7DQogICAgICB0cnkgew0KICAgICAgICB2YXIgcmVzID0gYXdhaXQgY2FsbFNlcnZlcignZ2V0SW5pdGlhbERhdGEnKTsNCiAgICAgICAgaWYgKHJlcyAmJiAhcmVzLmVycm9yKSB7DQogICAgICAgICAgc3RhdGUuZGF0YSA9IHJlczsNCiAgICAgICAgICBwb3B1bGF0ZUFjdGl2ZVRhc2tzRHJvcGRvd24oKTsNCiAgICAgICAgICByZW5kZXJUcmFpbmluZ0NoYXJ0KCk7DQogICAgICAgICAgcmVuZGVyRmVlZGluZ0NoYXJ0KCk7",
    "DQogICAgICAgICAgcmVuZGVyVGFza3NDaGFydCgpOw0KICAgICAgICAgIHJlbmRlckhpc3RvcnlMaXN0KCk7DQogICAgICAgICAgc2hvd1RvYXN0KCfXlNeg16rXldeg15nXnSDXqNeV16LXoNeg15Ug15HXlNem15zXl9eUISDwn5SEJywgJ3N1Y2Nlc3MnKTsNCiAgICAgICAgfSBlbHNlIHsNCiAgICAgICAgICBzaG93VG9hc3QoJ9ep15LXmdeQ15Qg15HXqNeZ16LXoNeV158g16DXqteV16DXmdedJywgJ2Vycm9yJyk7DQogICAgICAgIH0NCiAgICAgIH0gY2F0Y2ggKGVycikgew0KICAgICAgICBzaG93VG9hc3QoJ9eq16fXnNeqINeq16fXqdeV16jXqiDXkdeo15nXoteg15XXnycsICdlcnJvcicpOw0KICAgICAgfSBmaW5hbGx5IHsNCiAgICAgICAgaGlkZVNwaW5uZXIoKTsNCiAgICAgIH0NCiAgICB9DQoNCiAgICAvKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09DQogICAgICogTUFUSEVNQVRJQ0FMIEFOQUxZVElDUyAmIENIQVJUIFJFTkRFUklORw0KICAgICAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8NCiAgICBmdW5jdGlvbiBzZXRDaGFydFRpbWVSYW5nZShkYXlzKSB7DQogICAgICBzdGF0ZS5jaGFydFJhbmdlRGF5cyA9IGRheXM7DQogICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuY2hhcnQtcmFuZ2UtYnRuJykuZm9y",
    "RWFjaChmdW5jdGlvbihiKSB7DQogICAgICAgIGIuY2xhc3NOYW1lID0gJ2NoYXJ0LXJhbmdlLWJ0biBweC0yLjUgcHktMSByb3VuZGVkLWxnIHRleHQtc2xhdGUtNjAwIHRyYW5zaXRpb24nOw0KICAgICAgfSk7DQogICAgICB2YXIgYWN0aXZlQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JhbmdlLWJ0bi0nICsgZGF5cyk7DQogICAgICBpZiAoYWN0aXZlQnRuKSB7DQogICAgICAgIGFjdGl2ZUJ0bi5jbGFzc05hbWUgPSAnY2hhcnQtcmFuZ2UtYnRuIHB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctd2hpdGUgc2hhZG93LXNtIHRleHQtaW5kaWdvLTYwMCBmb250LWJvbGQgdHJhbnNpdGlvbic7DQogICAgICB9DQogICAgICByZW5kZXJUcmFpbmluZ0NoYXJ0KCk7DQogICAgfQ0KDQogICAgLyoqDQogICAgICogQ29yZSBBbGdvcml0aG06IENvbXB1dGVzIDctZGF5IGhhbGYtbGlmZSBleHBvbmVudGlhbGx5IGRlY2F5ZWQgcm9sbGluZyBpbnRlbnNpdHksDQogICAgICogMzMlIGFuZCA5MCUgcXVhbnRpbGUgYmFuZHMsIGluZGl2aWR1YWwgc2Vzc2lvbiBzY2F0dGVyIGRvdHMsIGFuZCBhd2F5IHN0YXkgYm94IG92ZXJsYXlzLg0KICAgICAqLw0KICAgIGZ1bmN0aW9uIGNvbXB1dGVTZXBhcmF0aW9uTWV0cmljcyh0cmFpbmluZ0xpc3QsIGF3YXlMaXN0LCBmaWx0ZXJEYXlzKSB7DQogICAgICBpZiAoIXRyYWluaW5nTGlzdCB8fCB0cmFpbmluZ0xpc3QubGVuZ3RoID09PSAwKSB7DQogICAgICAgIHJldHVybiB7IGRh",
    "aWx5RGF0ZXM6IFtdLCBpbnRlbnNpdHlWYWxzOiBbXSwgcTMzVmFsczogW10sIHE5MFZhbHM6IFtdLCBzY2F0dGVyUG9pbnRzOiBbXSwgYXdheUJveGVzOiB7fSB9Ow0KICAgICAgfQ0KDQogICAgICAvLyAxLiBTdHJlc3Mtd2VpZ2h0ZWQgc2Vzc2lvbiBkdXJhdGlvbjogRHVyYXRpb24gKiAoU3RyZXNzTGV2ZWwgLyAzLjApDQogICAgICB2YXIgc2Vzc2lvbnMgPSBbXTsNCiAgICAgIHRyYWluaW5nTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHMpIHsNCiAgICAgICAgdmFyIGR1ciA9IHBhcnNlRmxvYXQocy5kdXJhdGlvbik7DQogICAgICAgIHZhciBzdHJlc3MgPSBwYXJzZUludChzLnN0cmVzc0xldmVsLCAxMCk7DQogICAgICAgIGlmIChpc05hTihkdXIpIHx8IGR1ciA8PSAwKSByZXR1cm47DQogICAgICAgIGlmIChpc05hTihzdHJlc3MpIHx8IHN0cmVzcyA8IDEgfHwgc3RyZXNzID4gNSkgc3RyZXNzID0gMzsNCg0KICAgICAgICB2YXIgd2VpZ2h0ZWQgPSBkdXIgKiAoc3RyZXNzIC8gMy4wKTsNCiAgICAgICAgc2Vzc2lvbnMucHVzaCh7DQogICAgICAgICAgZGF0ZTogcy5kYXRlLA0KICAgICAgICAgIHRpbWU6IHMudGltZSB8fCAnMTI6MDAnLA0KICAgICAgICAgIGR1cmF0aW9uOiBkdXIsDQogICAgICAgICAgc3RyZXNzOiBzdHJlc3MsDQogICAgICAgICAgd2VpZ2h0ZWQ6IHdlaWdodGVkLA0KICAgICAgICAgIGZ1bGxEYXRlVGltZTogcy5kYXRlICsgJ1QnICsgKHMudGltZSA/IHMudGltZSA6ICcxMjowMCcpDQogICAg",
    "ICAgIH0pOw0KICAgICAgfSk7DQoNCiAgICAgIGlmIChzZXNzaW9ucy5sZW5ndGggPT09IDApIHsNCiAgICAgICAgcmV0dXJuIHsgZGFpbHlEYXRlczogW10sIGludGVuc2l0eVZhbHM6IFtdLCBxMzNWYWxzOiBbXSwgcTkwVmFsczogW10sIHNjYXR0ZXJQb2ludHM6IFtdLCBhd2F5Qm94ZXM6IHt9IH07DQogICAgICB9DQoNCiAgICAgIC8vIFNvcnQgc2Vzc2lvbnMgYnkgZGF0ZQ0KICAgICAgc2Vzc2lvbnMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhLmRhdGUubG9jYWxlQ29tcGFyZShiLmRhdGUpOyB9KTsNCg0KICAgICAgLy8gRGFpbHkgYWdncmVnYXRpb24NCiAgICAgIHZhciBkYWlseVN1bSA9IHt9Ow0KICAgICAgc2Vzc2lvbnMuZm9yRWFjaChmdW5jdGlvbihzKSB7DQogICAgICAgIGRhaWx5U3VtW3MuZGF0ZV0gPSAoZGFpbHlTdW1bcy5kYXRlXSB8fCAwKSArIHMud2VpZ2h0ZWQ7DQogICAgICB9KTsNCg0KICAgICAgLy8gQ2FsZW5kYXIgcmVzYW1wbGluZzogRmlsbCBkYWlseSBkYXRlcyBjb250aW51b3VzbHkgYmV0d2VlbiBtaW5EYXRlIGFuZCBtYXhEYXRlDQogICAgICB2YXIgbWluRGF0ZSA9IG5ldyBEYXRlKHNlc3Npb25zWzBdLmRhdGUpOw0KICAgICAgdmFyIG1heERhdGUgPSBuZXcgRGF0ZShzZXNzaW9uc1tzZXNzaW9ucy5sZW5ndGggLSAxXS5kYXRlKTsNCiAgICAgIC8vIEVuc3VyZSBhdCBsZWFzdCB0b2RheSBpcyBjb3ZlcmVkDQogICAgICB2YXIgdG9kYXkgPSBuZXcgRGF0ZSgpOw0KICAg",
    "ICAgaWYgKHRvZGF5ID4gbWF4RGF0ZSkgbWF4RGF0ZSA9IHRvZGF5Ow0KDQogICAgICB2YXIgY29udGludW91c0RhdGVzID0gW107DQogICAgICB2YXIgY3VyciA9IG5ldyBEYXRlKG1pbkRhdGUpOw0KICAgICAgd2hpbGUgKGN1cnIgPD0gbWF4RGF0ZSkgew0KICAgICAgICB2YXIgeXIgPSBjdXJyLmdldEZ1bGxZZWFyKCk7DQogICAgICAgIHZhciBtbyA9ICgnMCcgKyAoY3Vyci5nZXRNb250aCgpICsgMSkpLnNsaWNlKC0yKTsNCiAgICAgICAgdmFyIGRhID0gKCcwJyArIGN1cnIuZ2V0RGF0ZSgpKS5zbGljZSgtMik7DQogICAgICAgIGNvbnRpbnVvdXNEYXRlcy5wdXNoKHlyICsgJy0nICsgbW8gKyAnLScgKyBkYSk7DQogICAgICAgIGN1cnIuc2V0RGF0ZShjdXJyLmdldERhdGUoKSArIDEpOw0KICAgICAgfQ0KDQogICAgICAvLyBSb2xsaW5nIDctZGF5IGhhbGYtbGlmZSBleHBvbmVudGlhbCBkZWNheSBjYWxjdWxhdGlvbg0KICAgICAgLy8gSW50ZW5zaXR5KHQpID0gc3VtX3trPTAuLjZ9IDAuNV5rICogRGFpbHlfV2VpZ2h0ZWQodCAtIGspDQogICAgICB2YXIgZGFpbHlJbnRlbnNpdHkgPSBbXTsNCiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGludW91c0RhdGVzLmxlbmd0aDsgaSsrKSB7DQogICAgICAgIHZhciBzdW1JbnRlbnNpdHkgPSAwOw0KICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IDc7IGsrKykgew0KICAgICAgICAgIHZhciB0YXJnZXRJZHggPSBpIC0gazsNCiAgICAgICAgICBpZiAodGFy",
    "Z2V0SWR4ID49IDApIHsNCiAgICAgICAgICAgIHZhciB0YXJnZXREYXRlID0gY29udGludW91c0RhdGVzW3RhcmdldElkeF07DQogICAgICAgICAgICB2YXIgZGF5VmFsID0gZGFpbHlTdW1bdGFyZ2V0RGF0ZV0gfHwgMDsNCiAgICAgICAgICAgIHZhciB3ZWlnaHQgPSBNYXRoLnBvdygwLjUsIGspOw0KICAgICAgICAgICAgc3VtSW50ZW5zaXR5ICs9IHdlaWdodCAqIGRheVZhbDsNCiAgICAgICAgICB9DQogICAgICAgIH0NCiAgICAgICAgZGFpbHlJbnRlbnNpdHkucHVzaChOdW1iZXIoc3VtSW50ZW5zaXR5LnRvRml4ZWQoMykpKTsNCiAgICAgIH0NCg0KICAgICAgLy8gQ2FsY3VsYXRlIGR5bmFtaWMgcXVhbnRpbGUgYmFuZHMgKFEzMyBhbmQgUTkwKSBvbiBhY3RpdmUgZGF5cyAoPiAwLjEpDQogICAgICB2YXIgYWN0aXZlRGF5cyA9IGRhaWx5SW50ZW5zaXR5LmZpbHRlcihmdW5jdGlvbih2KSB7IHJldHVybiB2ID4gMC4xOyB9KTsNCiAgICAgIHZhciBxMzMgPSAwLjU7DQogICAgICB2YXIgcTkwID0gMi4wOw0KICAgICAgaWYgKGFjdGl2ZURheXMubGVuZ3RoID4gMCkgew0KICAgICAgICBhY3RpdmVEYXlzLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAtIGI7IH0pOw0KICAgICAgICB2YXIgaWR4MzMgPSBNYXRoLmZsb29yKDAuMzMgKiAoYWN0aXZlRGF5cy5sZW5ndGggLSAxKSk7DQogICAgICAgIHZhciBpZHg5MCA9IE1hdGguZmxvb3IoMC45MCAqIChhY3RpdmVEYXlzLmxlbmd0aCAtIDEpKTsNCiAgICAg",
    "ICAgcTMzID0gYWN0aXZlRGF5c1tpZHgzM107DQogICAgICAgIHE5MCA9IGFjdGl2ZURheXNbaWR4OTBdOw0KICAgICAgfQ0KDQogICAgICAvLyBGaWx0ZXIgYnkgcmVxdWVzdGVkIHRpbWUgcmFuZ2UNCiAgICAgIHZhciBjdXRvZmZEYXRlU3RyID0gbnVsbDsNCiAgICAgIGlmIChmaWx0ZXJEYXlzID4gMCkgew0KICAgICAgICB2YXIgY3V0b2ZmID0gbmV3IERhdGUoKTsNCiAgICAgICAgY3V0b2ZmLnNldERhdGUoY3V0b2ZmLmdldERhdGUoKSAtIGZpbHRlckRheXMpOw0KICAgICAgICBjdXRvZmZEYXRlU3RyID0gY3V0b2ZmLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXTsNCiAgICAgIH0NCg0KICAgICAgdmFyIGZpbHRlcmVkRGF0ZXMgPSBbXTsNCiAgICAgIHZhciBmaWx0ZXJlZEludGVuc2l0eSA9IFtdOw0KICAgICAgdmFyIGZpbHRlcmVkUTMzID0gW107DQogICAgICB2YXIgZmlsdGVyZWRROTAgPSBbXTsNCg0KICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjb250aW51b3VzRGF0ZXMubGVuZ3RoOyBqKyspIHsNCiAgICAgICAgdmFyIGRTdHIgPSBjb250aW51b3VzRGF0ZXNbal07DQogICAgICAgIGlmICghY3V0b2ZmRGF0ZVN0ciB8fCBkU3RyID49IGN1dG9mZkRhdGVTdHIpIHsNCiAgICAgICAgICBmaWx0ZXJlZERhdGVzLnB1c2goZFN0cik7DQogICAgICAgICAgZmlsdGVyZWRJbnRlbnNpdHkucHVzaChkYWlseUludGVuc2l0eVtqXSk7DQogICAgICAgICAgZmlsdGVyZWRRMzMucHVzaChxMzMpOw0KICAgICAg",
    "ICAgIGZpbHRlcmVkUTkwLnB1c2gocTkwKTsNCiAgICAgICAgfQ0KICAgICAgfQ0KDQogICAgICAvLyBJbmRpdmlkdWFsIHNlc3Npb24gc2NhdHRlciBwb2ludHMNCiAgICAgIHZhciBzY2F0dGVyUG9pbnRzID0gW107DQogICAgICBzZXNzaW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHMpIHsNCiAgICAgICAgaWYgKCFjdXRvZmZEYXRlU3RyIHx8IHMuZGF0ZSA+PSBjdXRvZmZEYXRlU3RyKSB7DQogICAgICAgICAgc2NhdHRlclBvaW50cy5wdXNoKHsNCiAgICAgICAgICAgIHg6IHMuZGF0ZSwgLy8gYWxpZ24gdG8gZGFpbHkgWCBheGlzDQogICAgICAgICAgICB5OiBzLmR1cmF0aW9uLA0KICAgICAgICAgICAgc3RyZXNzOiBzLnN0cmVzcywNCiAgICAgICAgICAgIHRpbWU6IHMudGltZSwNCiAgICAgICAgICAgIG5vdGVzOiBzLm5vdGVzDQogICAgICAgICAgfSk7DQogICAgICAgIH0NCiAgICAgIH0pOw0KDQogICAgICAvLyBBd2F5IHN0YXlzIGFubm90YXRpb25zDQogICAgICB2YXIgYXdheUFubm90YXRpb25zID0ge307DQogICAgICAoYXdheUxpc3QgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oYXcsIGlkeCkgew0KICAgICAgICBpZiAoIWF3LnN0YXJ0RGF0ZSB8fCAhYXcuZW5kRGF0ZSkgcmV0dXJuOw0KICAgICAgICBpZiAoY3V0b2ZmRGF0ZVN0ciAmJiBhdy5lbmREYXRlIDwgY3V0b2ZmRGF0ZVN0cikgcmV0dXJuOw0KDQogICAgICAgIHZhciBsb2NTdHlsZSA9IExPQ0FUSU9OX0NPTE9SU1thdy5sb2NhdGlvbl0gfHwgTE9D",
    "QVRJT05fQ09MT1JTWyLXkNeX16gg4pyoIl07DQogICAgICAgIGF3YXlBbm5vdGF0aW9uc1snYXdheV8nICsgaWR4XSA9IHsNCiAgICAgICAgICB0eXBlOiAnYm94JywNCiAgICAgICAgICB4TWluOiBhdy5zdGFydERhdGUsDQogICAgICAgICAgeE1heDogYXcuZW5kRGF0ZSwNCiAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGxvY1N0eWxlLnJnYmEsDQogICAgICAgICAgYm9yZGVyV2lkdGg6IDAsDQogICAgICAgICAgbGFiZWw6IHsNCiAgICAgICAgICAgIGRpc3BsYXk6IHRydWUsDQogICAgICAgICAgICBjb250ZW50OiAn8J+PoSAnICsgYXcubG9jYXRpb24sDQogICAgICAgICAgICBwb3NpdGlvbjogeyB4OiAnc3RhcnQnLCB5OiAnc3RhcnQnIH0sDQogICAgICAgICAgICBmb250OiB7IGZhbWlseTogJ1J1YmlrJywgc2l6ZTogMTAsIHdlaWdodDogJ2JvbGQnIH0sDQogICAgICAgICAgICBjb2xvcjogbG9jU3R5bGUuY29sb3IsDQogICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuODUpJywNCiAgICAgICAgICAgIHBhZGRpbmc6IDQsDQogICAgICAgICAgICBib3JkZXJSYWRpdXM6IDQNCiAgICAgICAgICB9DQogICAgICAgIH07DQogICAgICB9KTsNCg0KICAgICAgcmV0dXJuIHsNCiAgICAgICAgZGFpbHlEYXRlczogZmlsdGVyZWREYXRlcywNCiAgICAgICAgaW50ZW5zaXR5VmFsczogZmlsdGVyZWRJbnRlbnNpdHksDQogICAgICAgIHEzM1ZhbHM6IGZpbHRlcmVkUTMzLA0K",
    "ICAgICAgICBxOTBWYWxzOiBmaWx0ZXJlZFE5MCwNCiAgICAgICAgc2NhdHRlclBvaW50czogc2NhdHRlclBvaW50cywNCiAgICAgICAgYXdheUJveGVzOiBhd2F5QW5ub3RhdGlvbnMsDQogICAgICAgIHEzM1ZhbDogcTMzLA0KICAgICAgICBxOTBWYWw6IHE5MA0KICAgICAgfTsNCiAgICB9DQoNCiAgICBmdW5jdGlvbiByZW5kZXJUcmFpbmluZ0NoYXJ0KCkgew0KICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmFpbmluZ0NoYXJ0Jyk7DQogICAgICBpZiAoIWNhbnZhcykgcmV0dXJuOw0KICAgICAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpOw0KDQogICAgICB2YXIgbWV0cmljcyA9IGNvbXB1dGVTZXBhcmF0aW9uTWV0cmljcyhzdGF0ZS5kYXRhLnRyYWluaW5nLCBzdGF0ZS5kYXRhLmF3YXlMb2csIHN0YXRlLmNoYXJ0UmFuZ2VEYXlzKTsNCg0KICAgICAgaWYgKHN0YXRlLmNoYXJ0cy50cmFpbmluZykgew0KICAgICAgICBzdGF0ZS5jaGFydHMudHJhaW5pbmcuZGVzdHJveSgpOw0KICAgICAgfQ0KDQogICAgICBzdGF0ZS5jaGFydHMudHJhaW5pbmcgPSBuZXcgQ2hhcnQoY3R4LCB7DQogICAgICAgIHR5cGU6ICdsaW5lJywNCiAgICAgICAgZGF0YTogew0KICAgICAgICAgIGxhYmVsczogbWV0cmljcy5kYWlseURhdGVzLA0KICAgICAgICAgIGRhdGFzZXRzOiBbDQogICAgICAgICAgICAvLyBJbnRlbnNpdHkgTGluZQ0KICAgICAgICAgICAgew0KICAgICAgICAgICAg",
    "ICBsYWJlbDogJ9ei16bXmdee15XXqiDXntep15XXp9ec15zXqicsDQogICAgICAgICAgICAgIGRhdGE6IG1ldHJpY3MuaW50ZW5zaXR5VmFscywNCiAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICcjMWUyOTNiJywNCiAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAncmdiYSgzMCwgNDEsIDU5LCAwLjA1KScsDQogICAgICAgICAgICAgIGJvcmRlcldpZHRoOiAzLA0KICAgICAgICAgICAgICB0ZW5zaW9uOiAwLjMsDQogICAgICAgICAgICAgIHBvaW50UmFkaXVzOiAwLA0KICAgICAgICAgICAgICBvcmRlcjogMg0KICAgICAgICAgICAgfSwNCiAgICAgICAgICAgIC8vIFEzMyBab25lIChCbHVlKQ0KICAgICAgICAgICAgew0KICAgICAgICAgICAgICBsYWJlbDogJ9ei15XXntehINen15wgKNeQ15fXldeW15XXnyAzMyknLA0KICAgICAgICAgICAgICBkYXRhOiBtZXRyaWNzLnEzM1ZhbHMsDQogICAgICAgICAgICAgIGJvcmRlckNvbG9yOiAndHJhbnNwYXJlbnQnLA0KICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDU5LCAxMzAsIDI0NiwgMC4xMiknLA0KICAgICAgICAgICAgICBmaWxsOiAnb3JpZ2luJywNCiAgICAgICAgICAgICAgcG9pbnRSYWRpdXM6IDAsDQogICAgICAgICAgICAgIGJvcmRlcldpZHRoOiAwLA0KICAgICAgICAgICAgICBvcmRlcjogNQ0KICAgICAgICAgICAgfSwNCiAgICAgICAgICAgIC8vIFE5MCBab25lIChHcmVlbikNCiAgICAgICAgICAgIHsNCiAgICAgICAgICAg",
    "ICAgbGFiZWw6ICfXmNeV15XXlyDXkNeZ15PXmdeQ15zXmSAo15DXl9eV15bXldefIDkwKScsDQogICAgICAgICAgICAgIGRhdGE6IG1ldHJpY3MucTkwVmFscywNCiAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICd0cmFuc3BhcmVudCcsDQogICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMzQsIDE5NywgOTQsIDAuMTIpJywNCiAgICAgICAgICAgICAgZmlsbDogJy0xJywNCiAgICAgICAgICAgICAgcG9pbnRSYWRpdXM6IDAsDQogICAgICAgICAgICAgIGJvcmRlcldpZHRoOiAwLA0KICAgICAgICAgICAgICBvcmRlcjogNA0KICAgICAgICAgICAgfSwNCiAgICAgICAgICAgIC8vIEluZGl2aWR1YWwgU2Vzc2lvbnMgU2NhdHRlciBEb3RzDQogICAgICAgICAgICB7DQogICAgICAgICAgICAgIHR5cGU6ICdzY2F0dGVyJywNCiAgICAgICAgICAgICAgbGFiZWw6ICfXkNeZ157Xldeg15nXnSDXkdeV15PXk9eZ150nLA0KICAgICAgICAgICAgICBkYXRhOiBtZXRyaWNzLnNjYXR0ZXJQb2ludHMsDQogICAgICAgICAgICAgIHBvaW50UmFkaXVzOiA3LA0KICAgICAgICAgICAgICBwb2ludEhvdmVyUmFkaXVzOiA5LA0KICAgICAgICAgICAgICBwb2ludEJvcmRlckNvbG9yOiAnI2ZmZmZmZicsDQogICAgICAgICAgICAgIHBvaW50Qm9yZGVyV2lkdGg6IDEuNSwNCiAgICAgICAgICAgICAgcG9pbnRCYWNrZ3JvdW5kQ29sb3I6IGZ1bmN0aW9uKGNvbnRleHQpIHsNCiAgICAgICAgICAgICAgICB2YXIgc3RyZXNz",
    "ID0gY29udGV4dC5yYXc/LnN0cmVzcyB8fCAzOw0KICAgICAgICAgICAgICAgIGlmIChzdHJlc3MgPT09IDEpIHJldHVybiAnIzIyYzU1ZSc7IC8vIEdyZWVuDQogICAgICAgICAgICAgICAgaWYgKHN0cmVzcyA9PT0gMikgcmV0dXJuICcjODRjYzE2JzsgLy8gTGltZQ0KICAgICAgICAgICAgICAgIGlmIChzdHJlc3MgPT09IDMpIHJldHVybiAnI2VhYjMwOCc7IC8vIEFtYmVyDQogICAgICAgICAgICAgICAgaWYgKHN0cmVzcyA9PT0gNCkgcmV0dXJuICcjZjk3MzE2JzsgLy8gT3JhbmdlDQogICAgICAgICAgICAgICAgcmV0dXJuICcjZWY0NDQ0JzsgLy8gUmVkDQogICAgICAgICAgICAgIH0sDQogICAgICAgICAgICAgIG9yZGVyOiAxDQogICAgICAgICAgICB9DQogICAgICAgICAgXQ0KICAgICAgICB9LA0KICAgICAgICBvcHRpb25zOiB7DQogICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSwNCiAgICAgICAgICBtYWludGFpbkFzcGVjdFJhdGlvOiBmYWxzZSwNCiAgICAgICAgICBpbnRlcmFjdGlvbjogew0KICAgICAgICAgICAgbW9kZTogJ25lYXJlc3QnLA0KICAgICAgICAgICAgaW50ZXJzZWN0OiBmYWxzZQ0KICAgICAgICAgIH0sDQogICAgICAgICAgc2NhbGVzOiB7DQogICAgICAgICAgICB4OiB7DQogICAgICAgICAgICAgIGdyaWQ6IHsgZGlzcGxheTogZmFsc2UgfSwNCiAgICAgICAgICAgICAgdGlja3M6IHsNCiAgICAgICAgICAgICAgICBmb250OiB7IGZhbWlseTogJ1J1YmlrJywgc2l6ZTogMTAgfSwNCiAg",
    "ICAgICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24odmFsLCBpbmRleCkgew0KICAgICAgICAgICAgICAgICAgdmFyIGRTdHIgPSB0aGlzLmdldExhYmVsRm9yVmFsdWUodmFsKTsNCiAgICAgICAgICAgICAgICAgIGlmICghZFN0cikgcmV0dXJuICcnOw0KICAgICAgICAgICAgICAgICAgdmFyIHAgPSBkU3RyLnNwbGl0KCctJyk7DQogICAgICAgICAgICAgICAgICByZXR1cm4gcFsyXSArICcvJyArIHBbMV07DQogICAgICAgICAgICAgICAgfQ0KICAgICAgICAgICAgICB9DQogICAgICAgICAgICB9LA0KICAgICAgICAgICAgeTogew0KICAgICAgICAgICAgICBiZWdpbkF0WmVybzogdHJ1ZSwNCiAgICAgICAgICAgICAgdGl0bGU6IHsNCiAgICAgICAgICAgICAgICBkaXNwbGF5OiB0cnVlLA0KICAgICAgICAgICAgICAgIHRleHQ6ICfXoteV157XoSDXntep15XXp9ec15wgLyDXntep15ogKNep16LXldeqKScsDQogICAgICAgICAgICAgICAgZm9udDogeyBmYW1pbHk6ICdSdWJpaycsIHNpemU6IDExLCB3ZWlnaHQ6ICc2MDAnIH0NCiAgICAgICAgICAgICAgfSwNCiAgICAgICAgICAgICAgZ3JpZDogeyBjb2xvcjogJyNmMWY1ZjknIH0sDQogICAgICAgICAgICAgIHRpY2tzOiB7IGZvbnQ6IHsgZmFtaWx5OiAnUnViaWsnLCBzaXplOiAxMCB9IH0NCiAgICAgICAgICAgIH0NCiAgICAgICAgICB9LA0KICAgICAgICAgIHBsdWdpbnM6IHsNCiAgICAgICAgICAgIGxlZ2VuZDogew0KICAgICAgICAgICAgICBkaXNwbGF5",
    "OiBmYWxzZQ0KICAgICAgICAgICAgfSwNCiAgICAgICAgICAgIGFubm90YXRpb246IHsNCiAgICAgICAgICAgICAgYW5ub3RhdGlvbnM6IG1ldHJpY3MuYXdheUJveGVzDQogICAgICAgICAgICB9LA0KICAgICAgICAgICAgdG9vbHRpcDogew0KICAgICAgICAgICAgICBydGw6IHRydWUsDQogICAgICAgICAgICAgIHRleHREaXJlY3Rpb246ICdydGwnLA0KICAgICAgICAgICAgICB0aXRsZUZvbnQ6IHsgZmFtaWx5OiAnUnViaWsnLCBzaXplOiAxMiwgd2VpZ2h0OiAnYm9sZCcgfSwNCiAgICAgICAgICAgICAgYm9keUZvbnQ6IHsgZmFtaWx5OiAnUnViaWsnLCBzaXplOiAxMSB9LA0KICAgICAgICAgICAgICBjYWxsYmFja3M6IHsNCiAgICAgICAgICAgICAgICB0aXRsZTogZnVuY3Rpb24oaXRlbXMpIHsNCiAgICAgICAgICAgICAgICAgIGlmICghaXRlbXMgfHwgaXRlbXMubGVuZ3RoID09PSAwKSByZXR1cm4gJyc7DQogICAgICAgICAgICAgICAgICByZXR1cm4gJ9eq15DXqNeZ15o6ICcgKyBpdGVtc1swXS5sYWJlbDsNCiAgICAgICAgICAgICAgICB9LA0KICAgICAgICAgICAgICAgIGxhYmVsOiBmdW5jdGlvbihjb250ZXh0KSB7DQogICAgICAgICAgICAgICAgICBpZiAoY29udGV4dC5kYXRhc2V0LnR5cGUgPT09ICdzY2F0dGVyJykgew0KICAgICAgICAgICAgICAgICAgICB2YXIgcmF3ID0gY29udGV4dC5yYXc7DQogICAgICAgICAgICAgICAgICAgIHZhciBzdHJlc3NJbmZvID0gU1RSRVNTX01BUFtyYXcuc3RyZXNz",
    "XSB8fCBTVFJFU1NfTUFQWzNdOw0KICAgICAgICAgICAgICAgICAgICByZXR1cm4gWw0KICAgICAgICAgICAgICAgICAgICAgICfij7Mg15bXntefOiAnICsgcmF3LnkgKyAnINep16LXldeqICgnICsgKHJhdy50aW1lIHx8ICcnKSArICcpJywNCiAgICAgICAgICAgICAgICAgICAgICAn8J+YsCDXnNeX16U6ICcgKyBzdHJlc3NJbmZvLmxhYmVsLA0KICAgICAgICAgICAgICAgICAgICAgIHJhdy5ub3RlcyA/ICfwn5OdINeU16LXqNeV16o6ICcgKyByYXcubm90ZXMgOiAnJw0KICAgICAgICAgICAgICAgICAgICBdLmZpbHRlcihCb29sZWFuKTsNCiAgICAgICAgICAgICAgICAgIH0NCiAgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRhdGFzZXQubGFiZWwgKyAnOiAnICsgTnVtYmVyKGNvbnRleHQucmF3KS50b0ZpeGVkKDIpOw0KICAgICAgICAgICAgICAgIH0NCiAgICAgICAgICAgICAgfQ0KICAgICAgICAgICAgfQ0KICAgICAgICAgIH0NCiAgICAgICAgfQ0KICAgICAgfSk7DQogICAgfQ0KDQogICAgZnVuY3Rpb24gcmVuZGVyRmVlZGluZ0NoYXJ0KCkgew0KICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZWVkaW5nQ2hhcnQnKTsNCiAgICAgIGlmICghY2FudmFzKSByZXR1cm47DQogICAgICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7DQoNCiAgICAgIHZhciBmZWVkaW5ncyA9IHN0YXRlLmRhdGEuZmVlZGluZyB8fCBbXTsNCiAgICAgIC8vIEdyb3VwIGJ5",
    "IGRhdGUgYW5kIGZpbmlzaGVkIHN0YXR1cw0KICAgICAgdmFyIGRhaWx5TWFwID0ge307DQogICAgICBmZWVkaW5ncy5mb3JFYWNoKGZ1bmN0aW9uKGYpIHsNCiAgICAgICAgaWYgKCFmLmRhdGUpIHJldHVybjsNCiAgICAgICAgaWYgKCFkYWlseU1hcFtmLmRhdGVdKSB7DQogICAgICAgICAgZGFpbHlNYXBbZi5kYXRlXSA9IHsgZmluaXNoZWQ6IDAsIHVuZmluaXNoZWQ6IDAgfTsNCiAgICAgICAgfQ0KICAgICAgICB2YXIgYW10ID0gcGFyc2VGbG9hdChmLmFtb3VudCkgfHwgMDsNCiAgICAgICAgaWYgKGYuZmluaXNoZWQgPT09ICfXm9efJykgew0KICAgICAgICAgIGRhaWx5TWFwW2YuZGF0ZV0uZmluaXNoZWQgKz0gYW10Ow0KICAgICAgICB9IGVsc2Ugew0KICAgICAgICAgIGRhaWx5TWFwW2YuZGF0ZV0udW5maW5pc2hlZCArPSBhbXQ7DQogICAgICAgIH0NCiAgICAgIH0pOw0KDQogICAgICB2YXIgc29ydGVkRGF0ZXMgPSBPYmplY3Qua2V5cyhkYWlseU1hcCkuc29ydCgpOw0KICAgICAgLy8gU2hvdyBsYXN0IDE0IGRheXMNCiAgICAgIHZhciByZWNlbnREYXRlcyA9IHNvcnRlZERhdGVzLnNsaWNlKC0xNCk7DQoNCiAgICAgIHZhciBmaW5pc2hlZERhdGEgPSByZWNlbnREYXRlcy5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZGFpbHlNYXBbZF0uZmluaXNoZWQ7IH0pOw0KICAgICAgdmFyIHVuZmluaXNoZWREYXRhID0gcmVjZW50RGF0ZXMubWFwKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRhaWx5TWFwW2RdLnVuZmlu",
    "aXNoZWQ7IH0pOw0KDQogICAgICBpZiAoc3RhdGUuY2hhcnRzLmZlZWRpbmcpIHsNCiAgICAgICAgc3RhdGUuY2hhcnRzLmZlZWRpbmcuZGVzdHJveSgpOw0KICAgICAgfQ0KDQogICAgICBzdGF0ZS5jaGFydHMuZmVlZGluZyA9IG5ldyBDaGFydChjdHgsIHsNCiAgICAgICAgdHlwZTogJ2JhcicsDQogICAgICAgIGRhdGE6IHsNCiAgICAgICAgICBsYWJlbHM6IHJlY2VudERhdGVzLA0KICAgICAgICAgIGRhdGFzZXRzOiBbDQogICAgICAgICAgICB7DQogICAgICAgICAgICAgIGxhYmVsOiAn16HXmdeZ157XlCAo15vXnykg8J+foicsDQogICAgICAgICAgICAgIGRhdGE6IGZpbmlzaGVkRGF0YSwNCiAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnIzIyYzU1ZScsDQogICAgICAgICAgICAgIGJvcmRlclJhZGl1czogNg0KICAgICAgICAgICAgfSwNCiAgICAgICAgICAgIHsNCiAgICAgICAgICAgICAgbGFiZWw6ICfXnNeQINeh15nXmdee15QgKNec15ApIPCflLQnLA0KICAgICAgICAgICAgICBkYXRhOiB1bmZpbmlzaGVkRGF0YSwNCiAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnI2VmNDQ0NCcsDQogICAgICAgICAgICAgIGJvcmRlclJhZGl1czogNg0KICAgICAgICAgICAgfQ0KICAgICAgICAgIF0NCiAgICAgICAgfSwNCiAgICAgICAgb3B0aW9uczogew0KICAgICAgICAgIHJlc3BvbnNpdmU6IHRydWUsDQogICAgICAgICAgbWFpbnRhaW5Bc3BlY3RSYXRpbzogZmFsc2UsDQogICAgICAgICAgc2Nh",
    "bGVzOiB7DQogICAgICAgICAgICB4OiB7DQogICAgICAgICAgICAgIHN0YWNrZWQ6IHRydWUsDQogICAgICAgICAgICAgIGdyaWQ6IHsgZGlzcGxheTogZmFsc2UgfSwNCiAgICAgICAgICAgICAgdGlja3M6IHsNCiAgICAgICAgICAgICAgICBmb250OiB7IGZhbWlseTogJ1J1YmlrJywgc2l6ZTogMTAgfSwNCiAgICAgICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24odmFsKSB7DQogICAgICAgICAgICAgICAgICB2YXIgZFN0ciA9IHRoaXMuZ2V0TGFiZWxGb3JWYWx1ZSh2YWwpOw0KICAgICAgICAgICAgICAgICAgaWYgKCFkU3RyKSByZXR1cm4gJyc7DQogICAgICAgICAgICAgICAgICB2YXIgcCA9IGRTdHIuc3BsaXQoJy0nKTsNCiAgICAgICAgICAgICAgICAgIHJldHVybiBwWzJdICsgJy8nICsgcFsxXTsNCiAgICAgICAgICAgICAgICB9DQogICAgICAgICAgICAgIH0NCiAgICAgICAgICAgIH0sDQogICAgICAgICAgICB5OiB7DQogICAgICAgICAgICAgIHN0YWNrZWQ6IHRydWUsDQogICAgICAgICAgICAgIGJlZ2luQXRaZXJvOiB0cnVlLA0KICAgICAgICAgICAgICB0aXRsZTogew0KICAgICAgICAgICAgICAgIGRpc3BsYXk6IHRydWUsDQogICAgICAgICAgICAgICAgdGV4dDogJ9eb157XldeqICjXm9eV16HXldeqKScsDQogICAgICAgICAgICAgICAgZm9udDogeyBmYW1pbHk6ICdSdWJpaycsIHNpemU6IDExLCB3ZWlnaHQ6ICc2MDAnIH0NCiAgICAgICAgICAgICAgfSwNCiAgICAgICAgICAgICAgZ3JpZDog",
    "eyBjb2xvcjogJyNmMWY1ZjknIH0sDQogICAgICAgICAgICAgIHRpY2tzOiB7IGZvbnQ6IHsgZmFtaWx5OiAnUnViaWsnLCBzaXplOiAxMCB9IH0NCiAgICAgICAgICAgIH0NCiAgICAgICAgICB9LA0KICAgICAgICAgIHBsdWdpbnM6IHsNCiAgICAgICAgICAgIGxlZ2VuZDogew0KICAgICAgICAgICAgICBydGw6IHRydWUsDQogICAgICAgICAgICAgIHRleHREaXJlY3Rpb246ICdydGwnLA0KICAgICAgICAgICAgICBsYWJlbHM6IHsgZm9udDogeyBmYW1pbHk6ICdSdWJpaycsIHNpemU6IDExIH0gfQ0KICAgICAgICAgICAgfSwNCiAgICAgICAgICAgIHRvb2x0aXA6IHsNCiAgICAgICAgICAgICAgcnRsOiB0cnVlLA0KICAgICAgICAgICAgICB0ZXh0RGlyZWN0aW9uOiAncnRsJywNCiAgICAgICAgICAgICAgdGl0bGVGb250OiB7IGZhbWlseTogJ1J1YmlrJywgc2l6ZTogMTIgfSwNCiAgICAgICAgICAgICAgYm9keUZvbnQ6IHsgZmFtaWx5OiAnUnViaWsnLCBzaXplOiAxMSB9DQogICAgICAgICAgICB9DQogICAgICAgICAgfQ0KICAgICAgICB9DQogICAgICB9KTsNCiAgICB9DQoNCiAgICBmdW5jdGlvbiByZW5kZXJUYXNrc0NoYXJ0KCkgew0KICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YXNrc0NoYXJ0Jyk7DQogICAgICBpZiAoIWNhbnZhcykgcmV0dXJuOw0KICAgICAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpOw0KDQogICAgICB2YXIgdGFza0xvZ3MgPSAoc3Rh",
    "dGUuZGF0YS50YXNrTG9ncyB8fCBbXSkuc2xpY2UoKS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsNCiAgICAgICAgcmV0dXJuIGEuZGF0ZS5sb2NhbGVDb21wYXJlKGIuZGF0ZSk7DQogICAgICB9KTsNCg0KICAgICAgLy8gRGlzdGluY3QgdGFza3Mgd2l0aCBjb2xvciBhc3NpZ25tZW50DQogICAgICB2YXIgdGFza0NvbG9ycyA9IFsnIzRmNDZlNScsICcjMDZiNmQ0JywgJyMxMGI5ODEnLCAnI2Y1OWUwYicsICcjZWM0ODk5JywgJyM4YjVjZjYnXTsNCiAgICAgIHZhciB0YXNrTmFtZXMgPSBBcnJheS5mcm9tKG5ldyBTZXQodGFza0xvZ3MubWFwKGZ1bmN0aW9uKGwpIHsgcmV0dXJuIGwudGFza05hbWU7IH0pKSk7DQoNCiAgICAgIHZhciBkYXRhc2V0cyA9IHRhc2tOYW1lcy5tYXAoZnVuY3Rpb24odE5hbWUsIGlkeCkgew0KICAgICAgICB2YXIgY29sb3IgPSB0YXNrQ29sb3JzW2lkeCAlIHRhc2tDb2xvcnMubGVuZ3RoXTsNCiAgICAgICAgdmFyIHBvaW50cyA9IHRhc2tMb2dzLmZpbHRlcihmdW5jdGlvbihsKSB7IHJldHVybiBsLnRhc2tOYW1lID09PSB0TmFtZTsgfSkubWFwKGZ1bmN0aW9uKGwpIHsNCiAgICAgICAgICByZXR1cm4gew0KICAgICAgICAgICAgeDogbC5kYXRlLA0KICAgICAgICAgICAgeTogbC5zdWNjZXNzLA0KICAgICAgICAgICAgbm90ZXM6IGwubm90ZXMNCiAgICAgICAgICB9Ow0KICAgICAgICB9KTsNCg0KICAgICAgICByZXR1cm4gew0KICAgICAgICAgIGxhYmVsOiB0TmFtZSwNCiAgICAgICAgICBk",
    "YXRhOiBwb2ludHMsDQogICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBjb2xvciwNCiAgICAgICAgICBib3JkZXJDb2xvcjogY29sb3IsDQogICAgICAgICAgcG9pbnRSYWRpdXM6IDYsDQogICAgICAgICAgcG9pbnRIb3ZlclJhZGl1czogOA0KICAgICAgICB9Ow0KICAgICAgfSk7DQoNCiAgICAgIGlmIChzdGF0ZS5jaGFydHMudGFza3MpIHsNCiAgICAgICAgc3RhdGUuY2hhcnRzLnRhc2tzLmRlc3Ryb3koKTsNCiAgICAgIH0NCg0KICAgICAgc3RhdGUuY2hhcnRzLnRhc2tzID0gbmV3IENoYXJ0KGN0eCwgew0KICAgICAgICB0eXBlOiAnc2NhdHRlcicsDQogICAgICAgIGRhdGE6IHsgZGF0YXNldHM6IGRhdGFzZXRzIH0sDQogICAgICAgIG9wdGlvbnM6IHsNCiAgICAgICAgICByZXNwb25zaXZlOiB0cnVlLA0KICAgICAgICAgIG1haW50YWluQXNwZWN0UmF0aW86IGZhbHNlLA0KICAgICAgICAgIHNjYWxlczogew0KICAgICAgICAgICAgeDogew0KICAgICAgICAgICAgICBncmlkOiB7IGRpc3BsYXk6IGZhbHNlIH0sDQogICAgICAgICAgICAgIHRpY2tzOiB7DQogICAgICAgICAgICAgICAgZm9udDogeyBmYW1pbHk6ICdSdWJpaycsIHNpemU6IDEwIH0sDQogICAgICAgICAgICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKHZhbCkgew0KICAgICAgICAgICAgICAgICAgdmFyIGRTdHIgPSB0aGlzLmdldExhYmVsRm9yVmFsdWUodmFsKTsNCiAgICAgICAgICAgICAgICAgIGlmICghZFN0cikgcmV0dXJuICcnOw0KICAgICAg",
    "ICAgICAgICAgICAgdmFyIHAgPSBkU3RyLnNwbGl0KCctJyk7DQogICAgICAgICAgICAgICAgICByZXR1cm4gcFsyXSArICcvJyArIHBbMV07DQogICAgICAgICAgICAgICAgfQ0KICAgICAgICAgICAgICB9DQogICAgICAgICAgICB9LA0KICAgICAgICAgICAgeTogew0KICAgICAgICAgICAgICBtaW46IDAuNSwNCiAgICAgICAgICAgICAgbWF4OiA1LjUsDQogICAgICAgICAgICAgIHRpY2tzOiB7DQogICAgICAgICAgICAgICAgc3RlcFNpemU6IDEsDQogICAgICAgICAgICAgICAgZm9udDogeyBmYW1pbHk6ICdSdWJpaycsIHNpemU6IDEwIH0NCiAgICAgICAgICAgICAgfSwNCiAgICAgICAgICAgICAgdGl0bGU6IHsNCiAgICAgICAgICAgICAgICBkaXNwbGF5OiB0cnVlLA0KICAgICAgICAgICAgICAgIHRleHQ6ICfXpteZ15XXnyDXkNeZ15vXldeqICgxLTUpJywNCiAgICAgICAgICAgICAgICBmb250OiB7IGZhbWlseTogJ1J1YmlrJywgc2l6ZTogMTEsIHdlaWdodDogJzYwMCcgfQ0KICAgICAgICAgICAgICB9LA0KICAgICAgICAgICAgICBncmlkOiB7IGNvbG9yOiAnI2YxZjVmOScgfQ0KICAgICAgICAgICAgfQ0KICAgICAgICAgIH0sDQogICAgICAgICAgcGx1Z2luczogew0KICAgICAgICAgICAgbGVnZW5kOiB7DQogICAgICAgICAgICAgIHJ0bDogdHJ1ZSwNCiAgICAgICAgICAgICAgdGV4dERpcmVjdGlvbjogJ3J0bCcsDQogICAgICAgICAgICAgIGxhYmVsczogeyBmb250OiB7IGZhbWlseTogJ1J1YmlrJywg",
    "c2l6ZTogMTEgfSB9DQogICAgICAgICAgICB9LA0KICAgICAgICAgICAgdG9vbHRpcDogew0KICAgICAgICAgICAgICBydGw6IHRydWUsDQogICAgICAgICAgICAgIHRleHREaXJlY3Rpb246ICdydGwnLA0KICAgICAgICAgICAgICB0aXRsZUZvbnQ6IHsgZmFtaWx5OiAnUnViaWsnLCBzaXplOiAxMiB9LA0KICAgICAgICAgICAgICBib2R5Rm9udDogeyBmYW1pbHk6ICdSdWJpaycsIHNpemU6IDExIH0sDQogICAgICAgICAgICAgIGNhbGxiYWNrczogew0KICAgICAgICAgICAgICAgIGxhYmVsOiBmdW5jdGlvbihjb250ZXh0KSB7DQogICAgICAgICAgICAgICAgICB2YXIgcmF3ID0gY29udGV4dC5yYXc7DQogICAgICAgICAgICAgICAgICByZXR1cm4gWw0KICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmRhdGFzZXQubGFiZWwgKyAnOiAnICsgcmF3LnkgKyAnLzUnLA0KICAgICAgICAgICAgICAgICAgICByYXcubm90ZXMgPyAn8J+TnSAnICsgcmF3Lm5vdGVzIDogJycNCiAgICAgICAgICAgICAgICAgIF0uZmlsdGVyKEJvb2xlYW4pOw0KICAgICAgICAgICAgICAgIH0NCiAgICAgICAgICAgICAgfQ0KICAgICAgICAgICAgfQ0KICAgICAgICAgIH0NCiAgICAgICAgfQ0KICAgICAgfSk7DQogICAgfQ0KDQogICAgLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQ0KICAgICAqIEhJU1RPUlkgJiBDUlVEIElOTElORSBFRElUSU5HIC8g",
    "REVMRVRJTkcNCiAgICAgKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovDQogICAgZnVuY3Rpb24gc3dpdGNoSGlzdG9yeURvbWFpbihkb21haW4pIHsNCiAgICAgIHN0YXRlLmhpc3RvcnlEb21haW4gPSBkb21haW47DQogICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuaGRvbS1idG4nKS5mb3JFYWNoKGZ1bmN0aW9uKGIpIHsNCiAgICAgICAgYi5jbGFzc05hbWUgPSAnaGRvbS1idG4gcHgtMy41IHB5LTEuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1zZW1pYm9sZCBiZy13aGl0ZSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCB0ZXh0LXNsYXRlLTYwMCBob3ZlcjpiZy1zbGF0ZS01MCB3aGl0ZXNwYWNlLW5vd3JhcCc7DQogICAgICB9KTsNCiAgICAgIHZhciBhY3RpdmVCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaGRvbS1idG4tJyArIGRvbWFpbik7DQogICAgICBpZiAoYWN0aXZlQnRuKSB7DQogICAgICAgIGFjdGl2ZUJ0bi5jbGFzc05hbWUgPSAnaGRvbS1idG4gcHgtMy41IHB5LTEuNSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIGJnLWluZGlnby02MDAgdGV4dC13aGl0ZSBzaGFkb3ctc20gd2hpdGVzcGFjZS1ub3dyYXAnOw0KICAgICAgfQ0KICAgICAgcmVuZGVySGlzdG9yeUxpc3QoKTsNCiAgICB9DQoNCiAgICBmdW5jdGlvbiByZW5kZXJIaXN0b3J5TGlzdCgpIHsNCiAgICAgIHZhciBjb250",
    "YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaGlzdG9yeVRhYmxlQ29udGFpbmVyJyk7DQogICAgICB2YXIgaGVhZGVyVGV4dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdoaXN0b3J5RG9tYWluSGVhZGVyJyk7DQogICAgICB2YXIgYmFkZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaGlzdG9yeUNvdW50QmFkZ2UnKTsNCiAgICAgIGlmICghY29udGFpbmVyKSByZXR1cm47DQoNCiAgICAgIHZhciBkb21haW4gPSBzdGF0ZS5oaXN0b3J5RG9tYWluOw0KICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9ICcnOw0KDQogICAgICBpZiAoZG9tYWluID09PSAndHJhaW5pbmcnKSB7DQogICAgICAgIGhlYWRlclRleHQudGV4dENvbnRlbnQgPSAn16jXqdeZ157XqiDXkNeZ157Xldeg15nXnSDXkNeX16jXldeg15nXnSc7DQogICAgICAgIHZhciBsaXN0ID0gKHN0YXRlLmRhdGEudHJhaW5pbmcgfHwgW10pLnNsaWNlKCkucmV2ZXJzZSgpOw0KICAgICAgICBiYWRnZS50ZXh0Q29udGVudCA9IGxpc3QubGVuZ3RoICsgJyDXkNeZ157Xldeg15nXnSc7DQoNCiAgICAgICAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7DQogICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJwLTYgdGV4dC1jZW50ZXIgdGV4dC1zbGF0ZS00MDAgdGV4dC14cyI+16LXk9eZ15nXnyDXkNeZ158g15DXmdee15XXoNeZ150g157Xlden15zXmNeZ150uPC9kaXY+JzsNCiAgICAgICAgICByZXR1cm47DQogICAg",
    "ICAgIH0NCg0KICAgICAgICBsaXN0LmZvckVhY2goZnVuY3Rpb24oaXRlbSkgew0KICAgICAgICAgIHZhciBzSW5mbyA9IFNUUkVTU19NQVBbaXRlbS5zdHJlc3NMZXZlbF0gfHwgU1RSRVNTX01BUFszXTsNCiAgICAgICAgICB2YXIgY2FyZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOw0KICAgICAgICAgIGNhcmQuY2xhc3NOYW1lID0gJ3AtMy41IHNtOnAtNCBob3ZlcjpiZy1zbGF0ZS01MC83MCB0cmFuc2l0aW9uIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMyc7DQogICAgICAgICAgY2FyZC5pbm5lckhUTUwgPSBgDQogICAgICAgICAgICA8ZGl2IGNsYXNzPSJzcGFjZS15LTEiPg0KICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+DQogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9ImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTgwMCB0ZXh0LXNtIj4ke2l0ZW0uZGF0ZX08L3NwYW4+DQogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS01MDAgZm9udC1zZW1pYm9sZCBkaXItbHRyIj7ij7AgJHtpdGVtLnRpbWUgfHwgJyd9PC9zcGFuPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LWluZGlnby02MDAgYmctaW5kaWdvLTUwIHB4LTIgcHktMC41IHJvdW5kZWQtbWQiPuKPsyAke2l0ZW0uZHVyYXRpb259INep16LXldeqPC9zcGFuPg0KICAgICAgICAgICAgICAg",
    "IDxzcGFuIGNsYXNzPSJ0ZXh0LVsxMXB4XSBmb250LWJvbGQgcHgtMiBweS0wLjUgcm91bmRlZC1tZCAke3NJbmZvLmJnfSAke3NJbmZvLnRleHR9Ij4ke3NJbmZvLmxhYmVsfTwvc3Bhbj4NCiAgICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICAgICR7aXRlbS5ub3RlcyA/IGA8cCBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTYwMCBsZWFkaW5nLXNudWciPvCfk50gJHtlc2NhcGVIdG1sKGl0ZW0ubm90ZXMpfTwvcD5gIDogJyd9DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIj4NCiAgICAgICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJvcGVuRWRpdE1vZGFsKCdUcmFpbmluZycsICR7aXRlbS5yb3dJbmRleH0pIiB0aXRsZT0i16LXqNeV15og16nXldeo15QiDQogICAgICAgICAgICAgICAgY2xhc3M9InAtMiB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LWluZGlnby02MDAgaG92ZXI6YmctaW5kaWdvLTUwIHJvdW5kZWQtbGcgdHJhbnNpdGlvbiI+DQogICAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9ImVkaXQtMiIgY2xhc3M9InctNCBoLTQiPjwvaT4NCiAgICAgICAgICAgICAgPC9idXR0b24+DQogICAgICAgICAgICAgIDxidXR0b24gb25jbGljaz0iY29uZmlybURlbGV0ZSgnVHJhaW5pbmcnLCAke2l0ZW0ucm93SW5kZXh9LCAn15DXmdee15XXnyDXnteq15DXqNeZ15ogJHtpdGVtLmRhdGV9ICgke2l0ZW0uZHVyYXRpb259",
    "INep16LXldeqKScpIiB0aXRsZT0i157Xl9enINep15XXqNeUIg0KICAgICAgICAgICAgICAgIGNsYXNzPSJwLTIgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1yZWQtNjAwIGhvdmVyOmJnLXJlZC01MCByb3VuZGVkLWxnIHRyYW5zaXRpb24iPg0KICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPSJ0cmFzaC0yIiBjbGFzcz0idy00IGgtNCI+PC9pPg0KICAgICAgICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIGA7DQogICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNhcmQpOw0KICAgICAgICB9KTsNCiAgICAgIH0gZWxzZSBpZiAoZG9tYWluID09PSAnZmVlZGluZycpIHsNCiAgICAgICAgaGVhZGVyVGV4dC50ZXh0Q29udGVudCA9ICfXqNep15nXnteqINeQ16jXldeX15XXqiDXkNeX16jXldeg15XXqic7DQogICAgICAgIHZhciBsaXN0ID0gKHN0YXRlLmRhdGEuZmVlZGluZyB8fCBbXSkuc2xpY2UoKS5yZXZlcnNlKCk7DQogICAgICAgIGJhZGdlLnRleHRDb250ZW50ID0gbGlzdC5sZW5ndGggKyAnINeQ16jXldeX15XXqic7DQoNCiAgICAgICAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7DQogICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJwLTYgdGV4dC1jZW50ZXIgdGV4dC1zbGF0ZS00MDAgdGV4dC14cyI+16LXk9eZ15nXnyDXkNeZ158g15DXqNeV15fXldeqINee16rXldei15PXldeqLjwvZGl2Pic7DQogICAgICAgICAgcmV0",
    "dXJuOw0KICAgICAgICB9DQoNCiAgICAgICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHsNCiAgICAgICAgICB2YXIgaXNGaW4gPSBpdGVtLmZpbmlzaGVkID09PSAn15vXnyc7DQogICAgICAgICAgdmFyIGNhcmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsNCiAgICAgICAgICBjYXJkLmNsYXNzTmFtZSA9ICdwLTMuNSBzbTpwLTQgaG92ZXI6Ymctc2xhdGUtNTAvNzAgdHJhbnNpdGlvbiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTMnOw0KICAgICAgICAgIGNhcmQuaW5uZXJIVE1MID0gYA0KICAgICAgICAgICAgPGRpdiBjbGFzcz0ic3BhY2UteS0xIj4NCiAgICAgICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIiPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJmb250LWJvbGQgdGV4dC1zbGF0ZS04MDAgdGV4dC1zbSI+JHtpdGVtLmRhdGV9PC9zcGFuPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIGZvbnQtc2VtaWJvbGQgZGlyLWx0ciI+4o+wICR7aXRlbS50aW1lIHx8ICcnfTwvc3Bhbj4NCiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS03MDAgYmctc2xhdGUtMTAwIHB4LTIgcHktMC41IHJvdW5kZWQtbWQiPiR7aXRlbS50eXBlfTwvc3Bhbj4NCiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC14cyBmb250LWJv",
    "bGQgdGV4dC1pbmRpZ28tNjAwIGJnLWluZGlnby01MCBweC0yIHB5LTAuNSByb3VuZGVkLW1kIj4ke2l0ZW0uYW1vdW50fSDXm9eV16EgKCR7TWF0aC5yb3VuZChpdGVtLmFtb3VudCAqIDQwMCl9Zyk8L3NwYW4+DQogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQtWzExcHhdIGZvbnQtYm9sZCBweC0yIHB5LTAuNSByb3VuZGVkLW1kICR7aXNGaW4gPyAnYmctZW1lcmFsZC01MCB0ZXh0LWVtZXJhbGQtNzAwJyA6ICdiZy1yZWQtNTAgdGV4dC1yZWQtNzAwJ30iPg0KICAgICAgICAgICAgICAgICAgJHtpc0ZpbiA/ICfXodeZ15nXnteUINeU15vXnCDwn5+iJyA6ICfXnNeQINeh15nXmdee15Qg8J+UtCd9DQogICAgICAgICAgICAgICAgPC9zcGFuPg0KICAgICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgICAgJHtpdGVtLm5vdGVzID8gYDxwIGNsYXNzPSJ0ZXh0LXhzIHRleHQtc2xhdGUtNjAwIGxlYWRpbmctc251ZyI+8J+TnSAke2VzY2FwZUh0bWwoaXRlbS5ub3Rlcyl9PC9wPmAgOiAnJ30NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEiPg0KICAgICAgICAgICAgICA8YnV0dG9uIG9uY2xpY2s9Im9wZW5FZGl0TW9kYWwoJ0ZlZWRpbmcnLCAke2l0ZW0ucm93SW5kZXh9KSIgdGl0bGU9Itei16jXldeaINep15XXqNeUIg0KICAgICAgICAgICAgICAgIGNsYXNzPSJwLTIgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1pbmRpZ28t",
    "NjAwIGhvdmVyOmJnLWluZGlnby01MCByb3VuZGVkLWxnIHRyYW5zaXRpb24iPg0KICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPSJlZGl0LTIiIGNsYXNzPSJ3LTQgaC00Ij48L2k+DQogICAgICAgICAgICAgIDwvYnV0dG9uPg0KICAgICAgICAgICAgICA8YnV0dG9uIG9uY2xpY2s9ImNvbmZpcm1EZWxldGUoJ0ZlZWRpbmcnLCAke2l0ZW0ucm93SW5kZXh9LCAn15DXqNeV15fXqiAke2l0ZW0udHlwZX0g157XqteQ16jXmdeaICR7aXRlbS5kYXRlfScpIiB0aXRsZT0i157Xl9enINep15XXqNeUIg0KICAgICAgICAgICAgICAgIGNsYXNzPSJwLTIgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1yZWQtNjAwIGhvdmVyOmJnLXJlZC01MCByb3VuZGVkLWxnIHRyYW5zaXRpb24iPg0KICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPSJ0cmFzaC0yIiBjbGFzcz0idy00IGgtNCI+PC9pPg0KICAgICAgICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIGA7DQogICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNhcmQpOw0KICAgICAgICB9KTsNCiAgICAgIH0gZWxzZSBpZiAoZG9tYWluID09PSAnYXdheScpIHsNCiAgICAgICAgaGVhZGVyVGV4dC50ZXh0Q29udGVudCA9ICfXqNep15nXnteqINeU15nXoteT16jXldeZ15XXqiDXldeQ15nXqNeV15fXmdedJzsNCiAgICAgICAgdmFyIGxpc3QgPSAoc3RhdGUuZGF0YS5hd2F5TG9nIHx8IFtdKS5zbGljZSgpLnJldmVyc2Uo",
    "KTsNCiAgICAgICAgYmFkZ2UudGV4dENvbnRlbnQgPSBsaXN0Lmxlbmd0aCArICcg15TXmdei15PXqNeV15nXldeqJzsNCg0KICAgICAgICBpZiAobGlzdC5sZW5ndGggPT09IDApIHsNCiAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9InAtNiB0ZXh0LWNlbnRlciB0ZXh0LXNsYXRlLTQwMCB0ZXh0LXhzIj7XoteT15nXmdefINeQ15nXnyDXlNeZ16LXk9eo15XXmdeV16og157XqteV16LXk9eV16ouPC9kaXY+JzsNCiAgICAgICAgICByZXR1cm47DQogICAgICAgIH0NCg0KICAgICAgICBsaXN0LmZvckVhY2goZnVuY3Rpb24oaXRlbSkgew0KICAgICAgICAgIHZhciBjYXJkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7DQogICAgICAgICAgY2FyZC5jbGFzc05hbWUgPSAncC0zLjUgc206cC00IGhvdmVyOmJnLXNsYXRlLTUwLzcwIHRyYW5zaXRpb24gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zJzsNCiAgICAgICAgICBjYXJkLmlubmVySFRNTCA9IGANCiAgICAgICAgICAgIDxkaXYgY2xhc3M9InNwYWNlLXktMSI+DQogICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIj4NCiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0iZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIHRleHQtc20iPiR7aXRlbS5zdGFydERhdGV9INei15MgJHtpdGVtLmVuZERhdGV9PC9zcGFuPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNz",
    "PSJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LWluZGlnby02MDAgYmctaW5kaWdvLTUwIHB4LTIgcHktMC41IHJvdW5kZWQtbWQiPiR7aXRlbS5kYXlzQ291bnR9INeZ157XmdedPC9zcGFuPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS03MDAgYmctc2xhdGUtMTAwIHB4LTIgcHktMC41IHJvdW5kZWQtbWQiPvCfk40gJHtpdGVtLmxvY2F0aW9ufTwvc3Bhbj4NCiAgICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICAgICR7aXRlbS5ub3RlcyA/IGA8cCBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTYwMCBsZWFkaW5nLXNudWciPvCfk50gJHtlc2NhcGVIdG1sKGl0ZW0ubm90ZXMpfTwvcD5gIDogJyd9DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIj4NCiAgICAgICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJvcGVuRWRpdE1vZGFsKCdBd2F5X0xvZycsICR7aXRlbS5yb3dJbmRleH0pIiB0aXRsZT0i16LXqNeV15og16nXldeo15QiDQogICAgICAgICAgICAgICAgY2xhc3M9InAtMiB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LWluZGlnby02MDAgaG92ZXI6YmctaW5kaWdvLTUwIHJvdW5kZWQtbGcgdHJhbnNpdGlvbiI+DQogICAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9ImVkaXQtMiIgY2xhc3M9InctNCBoLTQiPjwvaT4NCiAgICAgICAgICAgICAgPC9idXR0b24+",
    "DQogICAgICAgICAgICAgIDxidXR0b24gb25jbGljaz0iY29uZmlybURlbGV0ZSgnQXdheV9Mb2cnLCAke2l0ZW0ucm93SW5kZXh9LCAn15TXmdei15PXqNeV16ogJHtpdGVtLmxvY2F0aW9ufSAoJHtpdGVtLnN0YXJ0RGF0ZX0pJykiIHRpdGxlPSLXnteX16cg16nXldeo15QiDQogICAgICAgICAgICAgICAgY2xhc3M9InAtMiB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXJlZC02MDAgaG92ZXI6YmctcmVkLTUwIHJvdW5kZWQtbGcgdHJhbnNpdGlvbiI+DQogICAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9InRyYXNoLTIiIGNsYXNzPSJ3LTQgaC00Ij48L2k+DQogICAgICAgICAgICAgIDwvYnV0dG9uPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgYDsNCiAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2FyZCk7DQogICAgICAgIH0pOw0KICAgICAgfSBlbHNlIGlmIChkb21haW4gPT09ICd0YXNrcycpIHsNCiAgICAgICAgaGVhZGVyVGV4dC50ZXh0Q29udGVudCA9ICfXkdeZ16bXldei15kg157XqdeZ157XldeqINeV16rXqNeS15nXnNeZ150nOw0KICAgICAgICB2YXIgbGlzdCA9IChzdGF0ZS5kYXRhLnRhc2tMb2dzIHx8IFtdKS5zbGljZSgpLnJldmVyc2UoKTsNCiAgICAgICAgYmFkZ2UudGV4dENvbnRlbnQgPSBsaXN0Lmxlbmd0aCArICcg15HXmdem15XXoteZ150nOw0KDQogICAgICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkgew0KICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwg",
    "PSAnPGRpdiBjbGFzcz0icC02IHRleHQtY2VudGVyIHRleHQtc2xhdGUtNDAwIHRleHQteHMiPtei15PXmdeZ158g15DXmdefINeR15nXpteV16LXmSDXntep15nXnteV16og157XqteV16LXk9eZ150uPC9kaXY+JzsNCiAgICAgICAgICByZXR1cm47DQogICAgICAgIH0NCg0KICAgICAgICBsaXN0LmZvckVhY2goZnVuY3Rpb24oaXRlbSkgew0KICAgICAgICAgIHZhciBjYXJkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7DQogICAgICAgICAgY2FyZC5jbGFzc05hbWUgPSAncC0zLjUgc206cC00IGhvdmVyOmJnLXNsYXRlLTUwLzcwIHRyYW5zaXRpb24gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zJzsNCiAgICAgICAgICBjYXJkLmlubmVySFRNTCA9IGANCiAgICAgICAgICAgIDxkaXYgY2xhc3M9InNwYWNlLXktMSI+DQogICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIj4NCiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0iZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIHRleHQtc20iPiR7aXRlbS5kYXRlfTwvc3Bhbj4NCiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC14cyBmb250LWJvbGQgdGV4dC1pbmRpZ28tNzAwIGJnLWluZGlnby01MCBweC0yIHB5LTAuNSByb3VuZGVkLW1kIj4ke2l0ZW0udGFza05hbWV9PC9zcGFuPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRl",
    "LTcwMCBiZy1zbGF0ZS0xMDAgcHgtMiBweS0wLjUgcm91bmRlZC1tZCI+16bXmdeV1586ICR7aXRlbS5zdWNjZXNzfS81IOKtkDwvc3Bhbj4NCiAgICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICAgICR7aXRlbS5ub3RlcyA/IGA8cCBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTYwMCBsZWFkaW5nLXNudWciPvCfk50gJHtlc2NhcGVIdG1sKGl0ZW0ubm90ZXMpfTwvcD5gIDogJyd9DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIj4NCiAgICAgICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJvcGVuRWRpdE1vZGFsKCdUYXNrTG9ncycsICR7aXRlbS5yb3dJbmRleH0pIiB0aXRsZT0i16LXqNeV15og16nXldeo15QiDQogICAgICAgICAgICAgICAgY2xhc3M9InAtMiB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LWluZGlnby02MDAgaG92ZXI6YmctaW5kaWdvLTUwIHJvdW5kZWQtbGcgdHJhbnNpdGlvbiI+DQogICAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9ImVkaXQtMiIgY2xhc3M9InctNCBoLTQiPjwvaT4NCiAgICAgICAgICAgICAgPC9idXR0b24+DQogICAgICAgICAgICAgIDxidXR0b24gb25jbGljaz0iY29uZmlybURlbGV0ZSgnVGFza0xvZ3MnLCAke2l0ZW0ucm93SW5kZXh9LCAn15HXmdem15XXoiAke2l0ZW0udGFza05hbWV9INee16rXkNeo15nXmiAke2l0ZW0uZGF0ZX0nKSIgdGl0bGU9Itee15fXpyDXqdeV16jXlCIN",
    "CiAgICAgICAgICAgICAgICBjbGFzcz0icC0yIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtcmVkLTYwMCBob3ZlcjpiZy1yZWQtNTAgcm91bmRlZC1sZyB0cmFuc2l0aW9uIj4NCiAgICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT0idHJhc2gtMiIgY2xhc3M9InctNCBoLTQiPjwvaT4NCiAgICAgICAgICAgICAgPC9idXR0b24+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICBgOw0KICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjYXJkKTsNCiAgICAgICAgfSk7DQogICAgICB9DQoNCiAgICAgIGx1Y2lkZS5jcmVhdGVJY29ucygpOw0KICAgIH0NCg0KICAgIC8qKg0KICAgICAqIE9wZW5zIGR5bmFtaWMgZWRpdCBtb2RhbCBmb3IgYW55IG9mIHRoZSA0IHNoZWV0cw0KICAgICAqLw0KICAgIGZ1bmN0aW9uIG9wZW5FZGl0TW9kYWwoc2hlZXROYW1lLCByb3dJbmRleCkgew0KICAgICAgdmFyIG1vZGFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VkaXRNb2RhbCcpOw0KICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlZGl0RmllbGRzQ29udGFpbmVyJyk7DQogICAgICB2YXIgdGl0bGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZWRpdE1vZGFsVGl0bGUnKTsNCiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlZGl0U2hlZXROYW1lJykudmFsdWUgPSBzaGVldE5hbWU7DQogICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZWRpdFJvd0lu",
    "ZGV4JykudmFsdWUgPSByb3dJbmRleDsNCiAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJzsNCg0KICAgICAgaWYgKHNoZWV0TmFtZSA9PT0gJ1RyYWluaW5nJykgew0KICAgICAgICB0aXRsZS50ZXh0Q29udGVudCA9ICfXoteo15nXm9eqINeQ15nXnteV158gKNep15XXqNeUICcgKyByb3dJbmRleCArICcpJzsNCiAgICAgICAgdmFyIHJlYyA9IHN0YXRlLmRhdGEudHJhaW5pbmcuZmluZChmdW5jdGlvbihyKSB7IHJldHVybiByLnJvd0luZGV4ID09PSByb3dJbmRleDsgfSk7DQogICAgICAgIGlmICghcmVjKSByZXR1cm47DQoNCiAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IGANCiAgICAgICAgICA8ZGl2IGNsYXNzPSJncmlkIGdyaWQtY29scy0yIGdhcC0zIj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPvCfk4Ug16rXkNeo15nXmjwvbGFiZWw+DQogICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJkYXRlIiBpZD0ibV9lZGl0X2RhdGUiIHZhbHVlPSIke3JlYy5kYXRlfSIgcmVxdWlyZWQgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC14cyI+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14",
    "cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPuKPsCDXqdei15Q8L2xhYmVsPg0KICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0idGltZSIgaWQ9Im1fZWRpdF90aW1lIiB2YWx1ZT0iJHtyZWMudGltZSB8fCAnMTA6MDAnfSIgcmVxdWlyZWQgY2xhc3M9ImlucHV0LXRpbWUgdy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQiPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPGRpdiBjbGFzcz0iZ3JpZCBncmlkLWNvbHMtMiBnYXAtMyI+DQogICAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7ij7Mg157XqdeaICjXqdei15XXqik8L2xhYmVsPg0KICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0ibnVtYmVyIiBpZD0ibV9lZGl0X2R1ciIgc3RlcD0iMC4yNSIgbWluPSIwLjI1IiBtYXg9IjEyIiB2YWx1ZT0iJHtyZWMuZHVyYXRpb259IiByZXF1aXJlZCBjbGFzcz0iaW5wdXQtbHRyIHctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC14cyBmb250LWJvbGQgdGV4dC1jZW50ZXIiPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICA8ZGl2Pg0KICAgICAg",
    "ICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7wn5iwINec15fXpSAoMS01KTwvbGFiZWw+DQogICAgICAgICAgICAgIDxzZWxlY3QgaWQ9Im1fZWRpdF9zdHJlc3MiIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0yLjUgcHktMS41IHRleHQteHMgZm9udC1zZW1pYm9sZCI+DQogICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0iMSIgJHtyZWMuc3RyZXNzTGV2ZWwgPT09IDEgPyAnc2VsZWN0ZWQnIDogJyd9PjEgLSDXqNeS15XXoteUINec15fXnNeV15jXmdefIPCfn6I8L29wdGlvbj4NCiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSIyIiAke3JlYy5zdHJlc3NMZXZlbCA9PT0gMiA/ICdzZWxlY3RlZCcgOiAnJ30+MiAtINeQ15kt16nXp9eYINen15wg8J+foTwvb3B0aW9uPg0KICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IjMiICR7cmVjLnN0cmVzc0xldmVsID09PSAzID8gJ3NlbGVjdGVkJyA6ICcnfT4zIC0g15zXl9elINeR15nXoNeV16DXmSDwn5+gPC9vcHRpb24+DQogICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0iNCIgJHtyZWMuc3RyZXNzTGV2ZWwgPT09IDQgPyAnc2VsZWN0ZWQnIDogJyd9PjQgLSDXntem15XXp9eUINeS15HXldeU15Qg8J+UtDwvb3B0aW9uPg0KICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IjUiICR7cmVjLnN0",
    "cmVzc0xldmVsID09PSA1ID8gJ3NlbGVjdGVkJyA6ICcnfT41IC0g16TXkNeg15nXp9eUIPCfmqg8L29wdGlvbj4NCiAgICAgICAgICAgICAgPC9zZWxlY3Q+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAgbWItMSI+8J+TnSDXlNei16jXldeqPC9sYWJlbD4NCiAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJ0ZXh0IiBpZD0ibV9lZGl0X25vdGVzIiB2YWx1ZT0iJHtlc2NhcGVIdG1sKHJlYy5ub3RlcyB8fCAnJyl9IiBjbGFzcz0idy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIj4NCiAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgYDsNCiAgICAgIH0gZWxzZSBpZiAoc2hlZXROYW1lID09PSAnRmVlZGluZycpIHsNCiAgICAgICAgdGl0bGUudGV4dENvbnRlbnQgPSAn16LXqNeZ15vXqiDXkNeo15XXl9eUICjXqdeV16jXlCAnICsgcm93SW5kZXggKyAnKSc7DQogICAgICAgIHZhciByZWMgPSBzdGF0ZS5kYXRhLmZlZWRpbmcuZmluZChmdW5jdGlvbihyKSB7IHJldHVybiByLnJvd0luZGV4ID09PSByb3dJbmRleDsgfSk7DQogICAgICAgIGlmICghcmVjKSByZXR1cm47DQoNCiAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IGANCiAgICAgICAgICA8ZGl2IGNs",
    "YXNzPSJncmlkIGdyaWQtY29scy0zIGdhcC0zIj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPteq15DXqNeZ15o8L2xhYmVsPg0KICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0iZGF0ZSIgaWQ9Im1fZWRpdF9mZWVkX2RhdGUiIHZhbHVlPSIke3JlYy5kYXRlfSIgcmVxdWlyZWQgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC14cyI+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPtep16LXlDwvbGFiZWw+DQogICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJ0aW1lIiBpZD0ibV9lZGl0X2ZlZWRfdGltZSIgdmFsdWU9IiR7cmVjLnRpbWUgfHwgJzA4OjAwJ30iIHJlcXVpcmVkIGNsYXNzPSJpbnB1dC10aW1lIHctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC14cyBmb250LXNlbWlib2xkIj4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQg",
    "dGV4dC1zbGF0ZS02MDAgbWItMSI+16HXldeSPC9sYWJlbD4NCiAgICAgICAgICAgICAgPHNlbGVjdCBpZD0ibV9lZGl0X2ZlZWRfdHlwZSIgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC14cyBmb250LXNlbWlib2xkIj4NCiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSLXkdeV16fXqCIgJHtyZWMudHlwZSA9PT0gJ9eR15XXp9eoJyA/ICdzZWxlY3RlZCcgOiAnJ30+15HXlden16gg4piA77iPPC9vcHRpb24+DQogICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0i16LXqNeRIiAke3JlYy50eXBlID09PSAn16LXqNeRJyA/ICdzZWxlY3RlZCcgOiAnJ30+16LXqNeRIPCfjJk8L29wdGlvbj4NCiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSLXkNeX16giICR7cmVjLnR5cGUgPT09ICfXkNeX16gnID8gJ3NlbGVjdGVkJyA6ICcnfT7XkNeX16gg4pyoPC9vcHRpb24+DQogICAgICAgICAgICAgIDwvc2VsZWN0Pg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPGRpdiBjbGFzcz0iZ3JpZCBncmlkLWNvbHMtMiBnYXAtMyBpdGVtcy1jZW50ZXIiPg0KICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAgbWItMSI+15vXnteV16ogKNeb15XXodeV16opPC9sYWJlbD4N",
    "CiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9Im51bWJlciIgaWQ9Im1fZWRpdF9mZWVkX2Ftb3VudCIgc3RlcD0iMC4yNSIgbWluPSIwLjI1IiBtYXg9IjQiIHZhbHVlPSIke3JlYy5hbW91bnR9IiByZXF1aXJlZCBjbGFzcz0iaW5wdXQtbHRyIHctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC14cyBmb250LWJvbGQgdGV4dC1jZW50ZXIiPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICA8ZGl2IGNsYXNzPSJwdC00IGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIj4NCiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9ImNoZWNrYm94IiBpZD0ibV9lZGl0X2ZlZWRfZmluIiAke3JlYy5maW5pc2hlZCA9PT0gJ9eb158nID8gJ2NoZWNrZWQnIDogJyd9IGNsYXNzPSJ3LTQgaC00IHRleHQtaW5kaWdvLTYwMCByb3VuZGVkIj4NCiAgICAgICAgICAgICAgPGxhYmVsIGZvcj0ibV9lZGl0X2ZlZWRfZmluIiBjbGFzcz0idGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS03MDAgY3Vyc29yLXBvaW50ZXIiPteh15nXmdee15Qg15TXm9ecPyDwn6WjPC9sYWJlbD4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7XlNei16jXldeqPC9sYWJlbD4NCiAgICAgICAg",
    "ICAgIDxpbnB1dCB0eXBlPSJ0ZXh0IiBpZD0ibV9lZGl0X2ZlZWRfbm90ZXMiIHZhbHVlPSIke2VzY2FwZUh0bWwocmVjLm5vdGVzIHx8ICcnKX0iIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0yLjUgcHktMS41IHRleHQteHMiPg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICBgOw0KICAgICAgfSBlbHNlIGlmIChzaGVldE5hbWUgPT09ICdBd2F5X0xvZycpIHsNCiAgICAgICAgdGl0bGUudGV4dENvbnRlbnQgPSAn16LXqNeZ15vXqiDXlNeZ16LXk9eo15XXqiAo16nXldeo15QgJyArIHJvd0luZGV4ICsgJyknOw0KICAgICAgICB2YXIgcmVjID0gc3RhdGUuZGF0YS5hd2F5TG9nLmZpbmQoZnVuY3Rpb24ocikgeyByZXR1cm4gci5yb3dJbmRleCA9PT0gcm93SW5kZXg7IH0pOw0KICAgICAgICBpZiAoIXJlYykgcmV0dXJuOw0KDQogICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBgDQogICAgICAgICAgPGRpdiBjbGFzcz0iZ3JpZCBncmlkLWNvbHMtMiBnYXAtMyI+DQogICAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7XqteQ16jXmdeaINeU16rXl9ec15Q8L2xhYmVsPg0KICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0iZGF0ZSIgaWQ9Im1fZWRpdF9hd2F5X3N0YXJ0IiB2YWx1ZT0iJHtyZWMuc3RhcnREYXRlfSIgcmVxdWly",
    "ZWQgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC14cyI+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPteq15DXqNeZ15og15fXlteo15Q8L2xhYmVsPg0KICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0iZGF0ZSIgaWQ9Im1fZWRpdF9hd2F5X2VuZCIgdmFsdWU9IiR7cmVjLmVuZERhdGV9IiByZXF1aXJlZCBjbGFzcz0idy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIj4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7XnteZ16fXldedPC9sYWJlbD4NCiAgICAgICAgICAgIDxzZWxlY3QgaWQ9Im1fZWRpdF9hd2F5X2xvYyIgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC14cyBmb250LXNlbWlib2xkIj4NCiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0i15DXptecINeZ15DXmdeoINeR157Xqden",
    "IPCfmpwiICR7cmVjLmxvY2F0aW9uID09PSAn15DXptecINeZ15DXmdeoINeR157XqdenIPCfmpwnID8gJ3NlbGVjdGVkJyA6ICcnfT7XkNem15wg15nXkNeZ16gg15HXntep16cg8J+anDwvb3B0aW9uPg0KICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSLXkNem15wg16DXmden15XXnCDXkdeU16jXptec15nXlCDwn4+W77iPIiAke3JlYy5sb2NhdGlvbiA9PT0gJ9eQ16bXnCDXoNeZ16fXldecINeR15TXqNem15zXmdeUIPCfj5bvuI8nID8gJ3NlbGVjdGVkJyA6ICcnfT7XkNem15wg16DXmden15XXnCDXkdeU16jXptec15nXlCDwn4+W77iPPC9vcHRpb24+DQogICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IteQ16bXnCDXl9eR16jXmdedINeR16rXnCDXkNeR15nXkSDwn4+Z77iPIiAke3JlYy5sb2NhdGlvbiA9PT0gJ9eQ16bXnCDXl9eR16jXmdedINeR16rXnCDXkNeR15nXkSDwn4+Z77iPJyA/ICdzZWxlY3RlZCcgOiAnJ30+15DXptecINeX15HXqNeZ150g15HXqtecINeQ15HXmdeRIPCfj5nvuI88L29wdGlvbj4NCiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0i15HXkdeZ16og15vXqdee15nXqdeU15Ug16nXldee16gg16LXnNeZ15Qg8J+PoCIgJHtyZWMubG9jYXRpb24gPT09ICfXkdeR15nXqiDXm9ep157Xmdep15TXlSDXqdeV157XqCDXotec15nXlCDwn4+gJyA/ICdzZWxlY3RlZCcgOiAnJ30+15HXkdeZ16og15vXqdee15nXqdeU15Ug16nXldee16gg16LXnNeZ15Qg8J+PoDwvb3B0aW9uPg0KICAg",
    "ICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSLXpNeg16HXmdeV158g8J+QviIgJHtyZWMubG9jYXRpb24gPT09ICfXpNeg16HXmdeV158g8J+QvicgPyAnc2VsZWN0ZWQnIDogJyd9Ptek16DXodeZ15XXnyDwn5C+PC9vcHRpb24+DQogICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IteQ15fXqCDinKgiICR7cmVjLmxvY2F0aW9uID09PSAn15DXl9eoIOKcqCcgPyAnc2VsZWN0ZWQnIDogJyd9PteQ15fXqCDinKg8L29wdGlvbj4NCiAgICAgICAgICAgIDwvc2VsZWN0Pg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7XlNei16jXldeqPC9sYWJlbD4NCiAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJ0ZXh0IiBpZD0ibV9lZGl0X2F3YXlfbm90ZXMiIHZhbHVlPSIke2VzY2FwZUh0bWwocmVjLm5vdGVzIHx8ICcnKX0iIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0yLjUgcHktMS41IHRleHQteHMiPg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICBgOw0KICAgICAgfSBlbHNlIGlmIChzaGVldE5hbWUgPT09ICdUYXNrTG9ncycpIHsNCiAgICAgICAgdGl0bGUudGV4dENvbnRlbnQgPSAn16LXqNeZ15vXqiDXkdeZ16bXldeiINee16nXmdee15QgKNep15XXqNeUICcgKyByb3dJbmRleCArICcpJzsNCiAgICAg",
    "ICAgdmFyIHJlYyA9IHN0YXRlLmRhdGEudGFza0xvZ3MuZmluZChmdW5jdGlvbihyKSB7IHJldHVybiByLnJvd0luZGV4ID09PSByb3dJbmRleDsgfSk7DQogICAgICAgIGlmICghcmVjKSByZXR1cm47DQoNCiAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IGANCiAgICAgICAgICA8ZGl2IGNsYXNzPSJncmlkIGdyaWQtY29scy0yIGdhcC0zIj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPteq15DXqNeZ15o8L2xhYmVsPg0KICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0iZGF0ZSIgaWQ9Im1fZWRpdF90YXNrX2RhdGUiIHZhbHVlPSIke3JlYy5kYXRlfSIgcmVxdWlyZWQgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC14cyI+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPtem15nXldefICgxLTUpPC9sYWJlbD4NCiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9Im51bWJlciIgaWQ9Im1fZWRpdF90YXNrX3Njb3JlIiBtaW49IjEiIG1heD0iNSIgdmFsdWU9IiR7cmVjLnN1Y2Nlc3N9IiByZXF1aXJlZCBjbGFzcz0iaW5wdXQtbHRyIHct",
    "ZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC14cyBmb250LWJvbGQgdGV4dC1jZW50ZXIiPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPtep150g15TXqteo15LXmdecPC9sYWJlbD4NCiAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJ0ZXh0IiBpZD0ibV9lZGl0X3Rhc2tfbmFtZSIgdmFsdWU9IiR7ZXNjYXBlSHRtbChyZWMudGFza05hbWUpfSIgcmVxdWlyZWQgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC14cyBmb250LWJvbGQiPg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7XlNei16jXldeqPC9sYWJlbD4NCiAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJ0ZXh0IiBpZD0ibV9lZGl0X3Rhc2tfbm90ZXMiIHZhbHVlPSIke2VzY2FwZUh0bWwocmVjLm5vdGVzIHx8ICcnKX0iIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0yLjUgcHktMS41IHRl",
    "eHQteHMiPg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICBgOw0KICAgICAgfQ0KDQogICAgICBtb2RhbC5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTsNCiAgICAgIG1vZGFsLmNsYXNzTGlzdC5hZGQoJ2ZsZXgnKTsNCiAgICB9DQoNCiAgICBmdW5jdGlvbiBjbG9zZUVkaXRNb2RhbCgpIHsNCiAgICAgIHZhciBtb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlZGl0TW9kYWwnKTsNCiAgICAgIG1vZGFsLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpOw0KICAgICAgbW9kYWwuY2xhc3NMaXN0LnJlbW92ZSgnZmxleCcpOw0KICAgIH0NCg0KICAgIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUVkaXRNb2RhbFN1Ym1pdChlKSB7DQogICAgICBlLnByZXZlbnREZWZhdWx0KCk7DQogICAgICB2YXIgc2hlZXROYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VkaXRTaGVldE5hbWUnKS52YWx1ZTsNCiAgICAgIHZhciByb3dJbmRleCA9IHBhcnNlSW50KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlZGl0Um93SW5kZXgnKS52YWx1ZSwgMTApOw0KICAgICAgdmFyIHJvd0RhdGEgPSBbXTsNCg0KICAgICAgaWYgKHNoZWV0TmFtZSA9PT0gJ1RyYWluaW5nJykgew0KICAgICAgICB2YXIgZGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtX2VkaXRfZGF0ZScpLnZhbHVlOw0KICAgICAgICB2YXIgdGltZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtX2VkaXRfdGltZScpLnZhbHVlOw0KICAgICAgICB2YXIg",
    "ZHVyID0gcGFyc2VGbG9hdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0X2R1cicpLnZhbHVlKTsNCiAgICAgICAgdmFyIHN0cmVzcyA9IHBhcnNlSW50KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtX2VkaXRfc3RyZXNzJykudmFsdWUsIDEwKTsNCiAgICAgICAgdmFyIG5vdGVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21fZWRpdF9ub3RlcycpLnZhbHVlOw0KICAgICAgICByb3dEYXRhID0gW2RhdGUsIHRpbWUsIGR1ciwgc3RyZXNzLCBub3Rlc107DQoNCiAgICAgICAgLy8gVXBkYXRlIGxvY2FsIHN0YXRlIGl0ZW0NCiAgICAgICAgdmFyIHJlYyA9IHN0YXRlLmRhdGEudHJhaW5pbmcuZmluZChmdW5jdGlvbihyKSB7IHJldHVybiByLnJvd0luZGV4ID09PSByb3dJbmRleDsgfSk7DQogICAgICAgIGlmIChyZWMpIHsNCiAgICAgICAgICByZWMuZGF0ZSA9IGRhdGU7DQogICAgICAgICAgcmVjLnRpbWUgPSB0aW1lOw0KICAgICAgICAgIHJlYy5kdXJhdGlvbiA9IGR1cjsNCiAgICAgICAgICByZWMuc3RyZXNzTGV2ZWwgPSBzdHJlc3M7DQogICAgICAgICAgcmVjLm5vdGVzID0gbm90ZXM7DQogICAgICAgIH0NCiAgICAgIH0gZWxzZSBpZiAoc2hlZXROYW1lID09PSAnRmVlZGluZycpIHsNCiAgICAgICAgdmFyIGRhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0X2ZlZWRfZGF0ZScpLnZhbHVlOw0KICAgICAgICB2YXIgdGltZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtX2Vk",
    "aXRfZmVlZF90aW1lJykudmFsdWU7DQogICAgICAgIHZhciB0eXBlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21fZWRpdF9mZWVkX3R5cGUnKS52YWx1ZTsNCiAgICAgICAgdmFyIGFtdCA9IHBhcnNlRmxvYXQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21fZWRpdF9mZWVkX2Ftb3VudCcpLnZhbHVlKTsNCiAgICAgICAgdmFyIGZpbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtX2VkaXRfZmVlZF9maW4nKS5jaGVja2VkID8gJ9eb158nIDogJ9ec15AnOw0KICAgICAgICB2YXIgbm90ZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0X2ZlZWRfbm90ZXMnKS52YWx1ZTsNCiAgICAgICAgcm93RGF0YSA9IFtkYXRlLCB0aW1lLCB0eXBlLCBhbXQsIGZpbiwgbm90ZXNdOw0KDQogICAgICAgIHZhciByZWMgPSBzdGF0ZS5kYXRhLmZlZWRpbmcuZmluZChmdW5jdGlvbihyKSB7IHJldHVybiByLnJvd0luZGV4ID09PSByb3dJbmRleDsgfSk7DQogICAgICAgIGlmIChyZWMpIHsNCiAgICAgICAgICByZWMuZGF0ZSA9IGRhdGU7DQogICAgICAgICAgcmVjLnRpbWUgPSB0aW1lOw0KICAgICAgICAgIHJlYy50eXBlID0gdHlwZTsNCiAgICAgICAgICByZWMuYW1vdW50ID0gYW10Ow0KICAgICAgICAgIHJlYy5maW5pc2hlZCA9IGZpbjsNCiAgICAgICAgICByZWMubm90ZXMgPSBub3RlczsNCiAgICAgICAgfQ0KICAgICAgfSBlbHNlIGlmIChzaGVldE5hbWUgPT09ICdBd2F5X0xvZycpIHsNCiAgICAgICAg",
    "dmFyIHN0YXJ0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21fZWRpdF9hd2F5X3N0YXJ0JykudmFsdWU7DQogICAgICAgIHZhciBlbmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0X2F3YXlfZW5kJykudmFsdWU7DQogICAgICAgIHZhciBsb2MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0X2F3YXlfbG9jJykudmFsdWU7DQogICAgICAgIHZhciBub3RlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtX2VkaXRfYXdheV9ub3RlcycpLnZhbHVlOw0KICAgICAgICB2YXIgZGF5cyA9IE1hdGgucm91bmQoKG5ldyBEYXRlKGVuZCkgLSBuZXcgRGF0ZShzdGFydCkpIC8gKDEwMDAgKiA2MCAqIDYwICogMjQpKTsNCiAgICAgICAgcm93RGF0YSA9IFtzdGFydCwgZW5kLCBsb2MsIGRheXMsIG5vdGVzXTsNCg0KICAgICAgICB2YXIgcmVjID0gc3RhdGUuZGF0YS5hd2F5TG9nLmZpbmQoZnVuY3Rpb24ocikgeyByZXR1cm4gci5yb3dJbmRleCA9PT0gcm93SW5kZXg7IH0pOw0KICAgICAgICBpZiAocmVjKSB7DQogICAgICAgICAgcmVjLnN0YXJ0RGF0ZSA9IHN0YXJ0Ow0KICAgICAgICAgIHJlYy5lbmREYXRlID0gZW5kOw0KICAgICAgICAgIHJlYy5sb2NhdGlvbiA9IGxvYzsNCiAgICAgICAgICByZWMuZGF5c0NvdW50ID0gZGF5czsNCiAgICAgICAgICByZWMubm90ZXMgPSBub3RlczsNCiAgICAgICAgfQ0KICAgICAgfSBlbHNlIGlmIChzaGVldE5hbWUgPT09ICdUYXNrTG9ncycpIHsNCiAg",
    "ICAgICAgdmFyIGRhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0X3Rhc2tfZGF0ZScpLnZhbHVlOw0KICAgICAgICB2YXIgdE5hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0X3Rhc2tfbmFtZScpLnZhbHVlOw0KICAgICAgICB2YXIgc2NvcmUgPSBwYXJzZUludChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0X3Rhc2tfc2NvcmUnKS52YWx1ZSwgMTApOw0KICAgICAgICB2YXIgbm90ZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0X3Rhc2tfbm90ZXMnKS52YWx1ZTsNCiAgICAgICAgcm93RGF0YSA9IFtkYXRlLCB0TmFtZSwgc2NvcmUsIG5vdGVzXTsNCg0KICAgICAgICB2YXIgcmVjID0gc3RhdGUuZGF0YS50YXNrTG9ncy5maW5kKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHIucm93SW5kZXggPT09IHJvd0luZGV4OyB9KTsNCiAgICAgICAgaWYgKHJlYykgew0KICAgICAgICAgIHJlYy5kYXRlID0gZGF0ZTsNCiAgICAgICAgICByZWMudGFza05hbWUgPSB0TmFtZTsNCiAgICAgICAgICByZWMuc3VjY2VzcyA9IHNjb3JlOw0KICAgICAgICAgIHJlYy5ub3RlcyA9IG5vdGVzOw0KICAgICAgICB9DQogICAgICB9DQoNCiAgICAgIHNob3dTcGlubmVyKCfXntei15PXm9efINep15XXqNeUINeR15LXmdec15nXldefLi4uJyk7DQogICAgICB0cnkgew0KICAgICAgICB2YXIgcmVzID0gYXdhaXQgY2FsbFNlcnZlcigndXBkYXRlUm93Jywgc2hlZXROYW1lLCByb3dJbmRl",
    "eCwgcm93RGF0YSk7DQogICAgICAgIGlmIChyZXMuc3VjY2Vzcykgew0KICAgICAgICAgIHNob3dUb2FzdChyZXMubWVzc2FnZSB8fCAn15TXqdeV16jXlCDXoteV15PXm9eg15Qg15HXlNem15zXl9eUIScsICdzdWNjZXNzJyk7DQogICAgICAgICAgaWYgKHNoZWV0TmFtZSA9PT0gJ1RyYWluaW5nJykgew0KICAgICAgICAgICAgcmVjYWxjRGVmYXVsdER1cmF0aW9uKCk7DQogICAgICAgICAgfQ0KICAgICAgICAgIGNsb3NlRWRpdE1vZGFsKCk7DQogICAgICAgICAgcmVuZGVyVHJhaW5pbmdDaGFydCgpOw0KICAgICAgICAgIHJlbmRlckZlZWRpbmdDaGFydCgpOw0KICAgICAgICAgIHJlbmRlclRhc2tzQ2hhcnQoKTsNCiAgICAgICAgICByZW5kZXJIaXN0b3J5TGlzdCgpOw0KICAgICAgICB9IGVsc2Ugew0KICAgICAgICAgIHNob3dUb2FzdCgn16nXkteZ15DXlCDXkdei15PXm9eV1586ICcgKyAocmVzLmVycm9yIHx8ICfXqten15zXlCcpLCAnZXJyb3InKTsNCiAgICAgICAgfQ0KICAgICAgfSBjYXRjaCAoZXJyKSB7DQogICAgICAgIHNob3dUb2FzdCgn16rXp9ec16og16rXp9ep15XXqNeqOiAnICsgZXJyLnRvU3RyaW5nKCksICdlcnJvcicpOw0KICAgICAgfSBmaW5hbGx5IHsNCiAgICAgICAgaGlkZVNwaW5uZXIoKTsNCiAgICAgIH0NCiAgICB9DQoNCiAgICBmdW5jdGlvbiBjb25maXJtRGVsZXRlKHNoZWV0TmFtZSwgcm93SW5kZXgsIGRlc2NyaXB0aW9uKSB7DQogICAgICBzdGF0ZS5kZWxldGVQZW5kaW5nID0g",
    "eyBzaGVldE5hbWU6IHNoZWV0TmFtZSwgcm93SW5kZXg6IHJvd0luZGV4IH07DQogICAgICB2YXIgbXNnID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbGV0ZU1vZGFsTWVzc2FnZScpOw0KICAgICAgaWYgKG1zZykgbXNnLnRleHRDb250ZW50ID0gZGVzY3JpcHRpb24gfHwgKCfXqdeV16jXlCAnICsgcm93SW5kZXggKyAnINeRLScgKyBzaGVldE5hbWUpOw0KICAgICAgdmFyIG1vZGFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbGV0ZU1vZGFsJyk7DQogICAgICBtb2RhbC5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTsNCiAgICAgIG1vZGFsLmNsYXNzTGlzdC5hZGQoJ2ZsZXgnKTsNCiAgICB9DQoNCiAgICBmdW5jdGlvbiBjbG9zZURlbGV0ZU1vZGFsKCkgew0KICAgICAgc3RhdGUuZGVsZXRlUGVuZGluZyA9IG51bGw7DQogICAgICB2YXIgbW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVsZXRlTW9kYWwnKTsNCiAgICAgIG1vZGFsLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpOw0KICAgICAgbW9kYWwuY2xhc3NMaXN0LnJlbW92ZSgnZmxleCcpOw0KICAgIH0NCg0KICAgIGFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVEZWxldGVSZWNvcmQoKSB7DQogICAgICBpZiAoIXN0YXRlLmRlbGV0ZVBlbmRpbmcpIHJldHVybjsNCiAgICAgIHZhciBzaGVldE5hbWUgPSBzdGF0ZS5kZWxldGVQZW5kaW5nLnNoZWV0TmFtZTsNCiAgICAgIHZhciByb3dJbmRleCA9IHN0YXRlLmRlbGV0ZVBlbmRpbmcucm93",
    "SW5kZXg7DQoNCiAgICAgIHNob3dTcGlubmVyKCfXnteV15fXpyDXqdeV16jXlC4uLicpOw0KICAgICAgdHJ5IHsNCiAgICAgICAgdmFyIHJlcyA9IGF3YWl0IGNhbGxTZXJ2ZXIoJ2RlbGV0ZVJvdycsIHNoZWV0TmFtZSwgcm93SW5kZXgpOw0KICAgICAgICBpZiAocmVzLnN1Y2Nlc3MpIHsNCiAgICAgICAgICBzaG93VG9hc3QocmVzLm1lc3NhZ2UgfHwgJ9eU16nXldeo15Qg16DXnteX16fXlCEnLCAnc3VjY2VzcycpOw0KICAgICAgICAgIA0KICAgICAgICAgIC8vIFJlbW92ZSBmcm9tIGxvY2FsIHN0YXRlDQogICAgICAgICAgaWYgKHNoZWV0TmFtZSA9PT0gJ1RyYWluaW5nJykgew0KICAgICAgICAgICAgc3RhdGUuZGF0YS50cmFpbmluZyA9IHN0YXRlLmRhdGEudHJhaW5pbmcuZmlsdGVyKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHIucm93SW5kZXggIT09IHJvd0luZGV4OyB9KTsNCiAgICAgICAgICAgIHJlY2FsY0RlZmF1bHREdXJhdGlvbigpOw0KICAgICAgICAgIH0gZWxzZSBpZiAoc2hlZXROYW1lID09PSAnRmVlZGluZycpIHsNCiAgICAgICAgICAgIHN0YXRlLmRhdGEuZmVlZGluZyA9IHN0YXRlLmRhdGEuZmVlZGluZy5maWx0ZXIoZnVuY3Rpb24ocikgeyByZXR1cm4gci5yb3dJbmRleCAhPT0gcm93SW5kZXg7IH0pOw0KICAgICAgICAgIH0gZWxzZSBpZiAoc2hlZXROYW1lID09PSAnQXdheV9Mb2cnKSB7DQogICAgICAgICAgICBzdGF0ZS5kYXRhLmF3YXlMb2cgPSBzdGF0ZS5kYXRhLmF3YXlMb2cuZmlsdGVy",
    "KGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHIucm93SW5kZXggIT09IHJvd0luZGV4OyB9KTsNCiAgICAgICAgICB9IGVsc2UgaWYgKHNoZWV0TmFtZSA9PT0gJ1Rhc2tMb2dzJykgew0KICAgICAgICAgICAgc3RhdGUuZGF0YS50YXNrTG9ncyA9IHN0YXRlLmRhdGEudGFza0xvZ3MuZmlsdGVyKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHIucm93SW5kZXggIT09IHJvd0luZGV4OyB9KTsNCiAgICAgICAgICB9DQoNCiAgICAgICAgICBjbG9zZURlbGV0ZU1vZGFsKCk7DQogICAgICAgICAgcmVuZGVyVHJhaW5pbmdDaGFydCgpOw0KICAgICAgICAgIHJlbmRlckZlZWRpbmdDaGFydCgpOw0KICAgICAgICAgIHJlbmRlclRhc2tzQ2hhcnQoKTsNCiAgICAgICAgICByZW5kZXJIaXN0b3J5TGlzdCgpOw0KICAgICAgICB9IGVsc2Ugew0KICAgICAgICAgIHNob3dUb2FzdCgn16nXkteZ15DXlCDXkdee15fXmden15Q6ICcgKyAocmVzLmVycm9yIHx8ICfXqten15zXlCcpLCAnZXJyb3InKTsNCiAgICAgICAgfQ0KICAgICAgfSBjYXRjaCAoZXJyKSB7DQogICAgICAgIHNob3dUb2FzdCgn16rXp9ec16og16rXp9ep15XXqNeqOiAnICsgZXJyLnRvU3RyaW5nKCksICdlcnJvcicpOw0KICAgICAgfSBmaW5hbGx5IHsNCiAgICAgICAgaGlkZVNwaW5uZXIoKTsNCiAgICAgIH0NCiAgICB9DQoNCiAgICAvKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09DQogICAg",
    "ICogVUkgVVRJTElUSUVTIChUT0FTVFMsIFNQSU5ORVIsIEVTQ0FQSU5HKQ0KICAgICAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8NCiAgICBmdW5jdGlvbiBzaG93VG9hc3QobWVzc2FnZSwgdHlwZSkgew0KICAgICAgdHlwZSA9IHR5cGUgfHwgJ2luZm8nOw0KICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdENvbnRhaW5lcicpOw0KICAgICAgaWYgKCFjb250YWluZXIpIHJldHVybjsNCg0KICAgICAgdmFyIHRvYXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7DQogICAgICB2YXIgYmcgPSAnYmctc2xhdGUtODAwIHRleHQtd2hpdGUnOw0KICAgICAgdmFyIGljb24gPSAn4oS577iPJzsNCg0KICAgICAgaWYgKHR5cGUgPT09ICdzdWNjZXNzJykgew0KICAgICAgICBiZyA9ICdiZy1lbWVyYWxkLTYwMCB0ZXh0LXdoaXRlJzsNCiAgICAgICAgaWNvbiA9ICfinIUnOw0KICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnZXJyb3InKSB7DQogICAgICAgIGJnID0gJ2JnLXJvc2UtNjAwIHRleHQtd2hpdGUnOw0KICAgICAgICBpY29uID0gJ+KaoO+4jyc7DQogICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICd3YXJuaW5nJykgew0KICAgICAgICBiZyA9ICdiZy1hbWJlci02MDAgdGV4dC13aGl0ZSc7DQogICAgICAgIGljb24gPSAn8J+UlCc7DQogICAgICB9DQoNCiAgICAgIHRv",
    "YXN0LmNsYXNzTmFtZSA9IGJnICsgJyBweC00IHB5LTIuNSByb3VuZGVkLXhsIHNoYWRvdy1sZyB0ZXh0LXhzIGZvbnQtYm9sZCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBwb2ludGVyLWV2ZW50cy1hdXRvIHRyYW5zaXRpb24gdHJhbnNmb3JtIHRyYW5zbGF0ZS15LTIgb3BhY2l0eS0wIGR1cmF0aW9uLTIwMCc7DQogICAgICB0b2FzdC5pbm5lckhUTUwgPSAnPHNwYW4+JyArIGljb24gKyAnPC9zcGFuPjxzcGFuPicgKyBlc2NhcGVIdG1sKG1lc3NhZ2UpICsgJzwvc3Bhbj4nOw0KDQogICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodG9hc3QpOw0KICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsNCiAgICAgICAgdG9hc3QuY2xhc3NMaXN0LnJlbW92ZSgndHJhbnNsYXRlLXktMicsICdvcGFjaXR5LTAnKTsNCiAgICAgIH0sIDEwKTsNCg0KICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsNCiAgICAgICAgdG9hc3QuY2xhc3NMaXN0LmFkZCgnb3BhY2l0eS0wJywgJ3RyYW5zbGF0ZS15LTInKTsNCiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsNCiAgICAgICAgICBpZiAodG9hc3QucGFyZW50Tm9kZSkgdG9hc3QucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0b2FzdCk7DQogICAgICAgIH0sIDIwMCk7DQogICAgICB9LCAzNTAwKTsNCiAgICB9DQoNCiAgICBmdW5jdGlvbiBzaG93U3Bpbm5lcihtc2cpIHsNCiAgICAgIHZhciBvdmVybGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvYWRpbmdPdmVy",
    "bGF5Jyk7DQogICAgICB2YXIgbGFiZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9hZGluZ01lc3NhZ2UnKTsNCiAgICAgIGlmIChsYWJlbCAmJiBtc2cpIGxhYmVsLnRleHRDb250ZW50ID0gbXNnOw0KICAgICAgaWYgKG92ZXJsYXkpIHsNCiAgICAgICAgb3ZlcmxheS5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTsNCiAgICAgICAgb3ZlcmxheS5jbGFzc0xpc3QuYWRkKCdmbGV4Jyk7DQogICAgICB9DQogICAgfQ0KDQogICAgZnVuY3Rpb24gaGlkZVNwaW5uZXIoKSB7DQogICAgICB2YXIgb3ZlcmxheSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2FkaW5nT3ZlcmxheScpOw0KICAgICAgaWYgKG92ZXJsYXkpIHsNCiAgICAgICAgb3ZlcmxheS5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTsNCiAgICAgICAgb3ZlcmxheS5jbGFzc0xpc3QucmVtb3ZlKCdmbGV4Jyk7DQogICAgICB9DQogICAgfQ0KDQogICAgZnVuY3Rpb24gZXNjYXBlSHRtbChzdHIpIHsNCiAgICAgIGlmICghc3RyKSByZXR1cm4gJyc7DQogICAgICByZXR1cm4gU3RyaW5nKHN0cikNCiAgICAgICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JykNCiAgICAgICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKQ0KICAgICAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpDQogICAgICAgIC5yZXBsYWNlKC8iL2csICcmcXVvdDsnKQ0KICAgICAgICAucmVwbGFjZSgvJy9nLCAnJiMwMzk7Jyk7DQogICAgfQ0KICA8L3NjcmlwdD4NCjwvYm9keT4NCjwvaHRt",
    "bD4NCg=="
  ];
  var b64 = b64Parts.join("");
  return Utilities.newBlob(Utilities.base64Decode(b64)).getDataAsString("UTF-8");
}
