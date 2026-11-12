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

  var webAppUrl = '';
  try {
    webAppUrl = ScriptApp.getService().getUrl() || '';
  } catch (e) {}

  return {
    training: trainingData,
    awayLog: awayData,
    feeding: feedingData,
    tasks: tasksData,
    taskLogs: taskLogsData,
    defaultDuration: defaultDuration,
    webAppUrl: webAppUrl
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
    "biI+DQogICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBzcGFjZS14LTMgc3BhY2UteC1yZXZlcnNlIj4NCiAgICAgICAgPHNwYW4gY2xhc3M9InRleHQtM3hsIHNlbGVjdC1ub25lIiByb2xlPSJpbWciIGFyaWEtbGFiZWw9ImRvZyI+8J+QlTwvc3Bhbj4NCiAgICAgICAgPGRpdj4NCiAgICAgICAgICA8aDEgY2xhc3M9InRleHQteGwgZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIGxlYWRpbmctdGlnaHQiPteU157Xoten15Eg16nXnCDXnteZ15nXpNecPC9oMT4NCiAgICAgICAgICA8cCBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTUwMCBmb250LW1lZGl1bSI+15nXldee158g15DXmdee15XXoNeZ150sINeU15DXm9ec15XXqiDXldee16nXmdee15XXqjwvcD4NCiAgICAgICAgPC9kaXY+DQogICAgICA8L2Rpdj4NCg0KICAgICAgPCEtLSBBY3Rpb25zICYgUVIgQ29kZSAtLT4NCiAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIHNwYWNlLXgtMiBzcGFjZS14LXJldmVyc2UiPg0KICAgICAgICA8YnV0dG9uIG9uY2xpY2s9Im9wZW5Rck1vZGFsKCkiIHRpdGxlPSLXp9eV15MgUVIg15zXlNeq16fXoNeUINeR15jXnNek15XXnyINCiAgICAgICAgICBjbGFzcz0icHktMS41IHB4LTMgcm91bmRlZC14bCB0ZXh0LWluZGlnby03MDAgYmctaW5kaWdvLTUwIGhvdmVyOmJnLWluZGlnby0xMDAgdHJhbnNpdGlvbiBhY3RpdmU6c2NhbGUtOTUgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSB0ZXh0LXhz",
    "IHNtOnRleHQtc20gZm9udC1ib2xkIGJvcmRlciBib3JkZXItaW5kaWdvLTIwMCBzaGFkb3ctc20iPg0KICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPSJxci1jb2RlIiBjbGFzcz0idy00IGgtNCI+PC9pPg0KICAgICAgICAgIDxzcGFuPten15XXkyBRUiDXnNeg15nXmdeTIPCfk7E8L3NwYW4+DQogICAgICAgIDwvYnV0dG9uPg0KICAgICAgICA8YnV0dG9uIGlkPSJidG5SZWZyZXNoIiBvbmNsaWNrPSJyZWZyZXNoQWxsRGF0YSgpIiB0aXRsZT0i16jXoteg158g16DXqteV16DXmdedIg0KICAgICAgICAgIGNsYXNzPSJwLTIgcm91bmRlZC14bCB0ZXh0LXNsYXRlLTYwMCBob3Zlcjp0ZXh0LWluZGlnby02MDAgaG92ZXI6Ymctc2xhdGUtMTAwIHRyYW5zaXRpb24gYWN0aXZlOnNjYWxlLTk1IGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgdGV4dC1zbSBmb250LW1lZGl1bSI+DQogICAgICAgICAgPGkgZGF0YS1sdWNpZGU9InJlZnJlc2gtY3ciIGNsYXNzPSJ3LTQgaC00Ij48L2k+DQogICAgICAgICAgPHNwYW4gY2xhc3M9ImhpZGRlbiBzbTppbmxpbmUiPteo16LXoNeV1588L3NwYW4+DQogICAgICAgIDwvYnV0dG9uPg0KICAgICAgICA8YSBocmVmPSJodHRwczovL2RvY3MuZ29vZ2xlLmNvbS9zcHJlYWRzaGVldHMvZC8xVVJVSTNncElhMnd4X2dRZEVhd0NEUnA4VHc0aDIwZ3VuMnplZWdDLU96OCIgdGFyZ2V0PSJfYmxhbmsiDQogICAgICAgICAgdGl0bGU9Itek16rXlyDXkteZ15zXmdeV158g15LXldeS15wiDQogICAg",
    "ICAgICAgY2xhc3M9InAtMiByb3VuZGVkLXhsIHRleHQtc2xhdGUtNjAwIGhvdmVyOnRleHQtZW1lcmFsZC02MDAgaG92ZXI6Ymctc2xhdGUtMTAwIHRyYW5zaXRpb24gYWN0aXZlOnNjYWxlLTk1IGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgdGV4dC1zbSBmb250LW1lZGl1bSI+DQogICAgICAgICAgPGkgZGF0YS1sdWNpZGU9InNoZWV0IiBjbGFzcz0idy00IGgtNCI+PC9pPg0KICAgICAgICAgIDxzcGFuIGNsYXNzPSJoaWRkZW4gc206aW5saW5lIj7XkteV15LXnCDXqdeZ15jXoTwvc3Bhbj4NCiAgICAgICAgPC9hPg0KICAgICAgPC9kaXY+DQogICAgPC9kaXY+DQoNCiAgICA8IS0tIERlc2t0b3AgTmF2aWdhdGlvbiBUYWJzIC0tPg0KICAgIDxkaXYgY2xhc3M9ImhpZGRlbiBtZDpibG9jayBib3JkZXItdCBib3JkZXItc2xhdGUtMTAwIGJnLXNsYXRlLTUwLzUwIj4NCiAgICAgIDxkaXYgY2xhc3M9Im1heC13LTV4bCBteC1hdXRvIHB4LTQgZmxleCBzcGFjZS14LTIgc3BhY2UteC1yZXZlcnNlIj4NCiAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJzd2l0Y2hUYWIoJ3RyYWluaW5nJykiIGlkPSJkZXNrdG9wLXRhYi10cmFpbmluZyINCiAgICAgICAgICBjbGFzcz0ibmF2LXRhYi1idG4gcHktMyBweC00IHRleHQtc20gZm9udC1zZW1pYm9sZCBib3JkZXItYi0yIGJvcmRlci1pbmRpZ28tNjAwIHRleHQtaW5kaWdvLTYwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+DQogICAgICAgICAgPHNwYW4+8J+Pgzwvc3Bhbj4g",
    "15TXmdep15DXqNeV16og15zXkdeTDQogICAgICAgIDwvYnV0dG9uPg0KICAgICAgICA8YnV0dG9uIG9uY2xpY2s9InN3aXRjaFRhYignZmVlZGluZycpIiBpZD0iZGVza3RvcC10YWItZmVlZGluZyINCiAgICAgICAgICBjbGFzcz0ibmF2LXRhYi1idG4gcHktMyBweC00IHRleHQtc20gZm9udC1zZW1pYm9sZCBib3JkZXItYi0yIGJvcmRlci10cmFuc3BhcmVudCB0ZXh0LXNsYXRlLTYwMCBob3Zlcjp0ZXh0LXNsYXRlLTkwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+DQogICAgICAgICAgPHNwYW4+8J+mtDwvc3Bhbj4g15TXkNeb15zXldeqDQogICAgICAgIDwvYnV0dG9uPg0KICAgICAgICA8YnV0dG9uIG9uY2xpY2s9InN3aXRjaFRhYigndGFza3MnKSIgaWQ9ImRlc2t0b3AtdGFiLXRhc2tzIg0KICAgICAgICAgIGNsYXNzPSJuYXYtdGFiLWJ0biBweS0zIHB4LTQgdGV4dC1zbSBmb250LXNlbWlib2xkIGJvcmRlci1iLTIgYm9yZGVyLXRyYW5zcGFyZW50IHRleHQtc2xhdGUtNjAwIGhvdmVyOnRleHQtc2xhdGUtOTAwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIj4NCiAgICAgICAgICA8c3Bhbj7wn46TPC9zcGFuPiDXntep15nXnteV16oNCiAgICAgICAgPC9idXR0b24+DQogICAgICAgIDxidXR0b24gb25jbGljaz0ic3dpdGNoVGFiKCdoaXN0b3J5JykiIGlkPSJkZXNrdG9wLXRhYi1oaXN0b3J5Ig0KICAgICAgICAgIGNsYXNzPSJuYXYtdGFiLWJ0biBweS0zIHB4LTQgdGV4dC1zbSBmb250LXNlbWlib2xkIGJv",
    "cmRlci1iLTIgYm9yZGVyLXRyYW5zcGFyZW50IHRleHQtc2xhdGUtNjAwIGhvdmVyOnRleHQtc2xhdGUtOTAwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIj4NCiAgICAgICAgICA8c3Bhbj7wn5OKPC9zcGFuPiDXlNeZ16HXmNeV16jXmdeUINeV15nXldee158NCiAgICAgICAgPC9idXR0b24+DQogICAgICA8L2Rpdj4NCiAgICA8L2Rpdj4NCiAgPC9oZWFkZXI+DQoNCiAgPCEtLSBNYWluIENvbnRhaW5lciAtLT4NCiAgPG1haW4gY2xhc3M9Im1heC13LTV4bCBteC1hdXRvIHB4LTQgcHktNiB3LWZ1bGwgZmxleC0xIj4NCg0KICAgIDwhLS0gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAtLT4NCiAgICA8IS0tIFRBQiAxOiDXlNeZ16nXkNeo15XXqiDXnNeR15MgKFNlcGFyYXRpb24gVHJhaW5pbmcgJiBBd2F5IFN0YXlzKSAtLT4NCiAgICA8IS0tID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLS0+DQogICAgPHNlY3Rpb24gaWQ9InRhYi10cmFpbmluZyIgY2xhc3M9InRhYi1jb250ZW50IGFjdGl2ZSBzcGFjZS15LTYiPg0KICAgICAgDQogICAgICA8IS0tIFNlY3Rpb24gVGl0bGUgLS0+DQogICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4iPg0KICAgICAgICA8ZGl2Pg0KICAgICAgICAgIDxoMiBjbGFzcz0i",
    "dGV4dC14bCBmb250LWJvbGQgdGV4dC1zbGF0ZS04MDAiPteq15nXoteV15Mg15fXqdeZ16TXlCDXldeg15jXmdep15XXqjwvaDI+DQogICAgICAgICAgPHAgY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS01MDAiPteQ15nXnteV16DXmSDXpNeo15nXk9eUINeU15PXqNeS16rXmdeZ150sINee16LXp9eRINei15XXntehINeV15TXmdei15PXqNeV15nXldeqPC9wPg0KICAgICAgICA8L2Rpdj4NCiAgICAgIDwvZGl2Pg0KDQogICAgICA8IS0tIEFkZCBUcmFpbmluZyBTZXNzaW9uIEZvcm0gQ2FyZCAtLT4NCiAgICAgIDxkaXYgY2xhc3M9ImJnLXdoaXRlIHJvdW5kZWQtMnhsIHAtNSBzaGFkb3ctc20gYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAiPg0KICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtYi00IHBiLTIgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTEwMCI+DQogICAgICAgICAgPGkgZGF0YS1sdWNpZGU9InBsdXMtY2lyY2xlIiBjbGFzcz0idy01IGgtNSB0ZXh0LWluZGlnby02MDAiPjwvaT4NCiAgICAgICAgICA8aDMgY2xhc3M9ImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTgwMCB0ZXh0LWJhc2UiPvCfk50g15TXldeh16TXqiDXkNeZ157XldefINeX15PXqTwvaDM+DQogICAgICAgIDwvZGl2Pg0KDQogICAgICAgIDxmb3JtIGlkPSJmb3JtVHJhaW5pbmciIG9uc3VibWl0PSJoYW5kbGVUcmFpbmluZ1N1Ym1pdChldmVudCkiIGNsYXNzPSJzcGFjZS15LTQiPg0KICAgICAgICAgIDxkaXYgY2xh",
    "c3M9ImdyaWQgZ3JpZC1jb2xzLTEgc206Z3JpZC1jb2xzLTIgZ2FwLTQiPg0KICAgICAgICAgICAgPCEtLSBEYXRlIC0tPg0KICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAgbWItMSI+8J+ThSDXqteQ16jXmdeaPC9sYWJlbD4NCiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9ImRhdGUiIGlkPSJ0cmFpbkRhdGUiIHJlcXVpcmVkDQogICAgICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTMgcHktMi41IHRleHQtc20gZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUgdHJhbnNpdGlvbiI+DQogICAgICAgICAgICA8L2Rpdj4NCg0KICAgICAgICAgICAgPCEtLSBTdGFydCBUaW1lIChMVFIgQ2VudGVyZWQpIC0tPg0KICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAgbWItMSI+4o+wINep16LXqiDXlNeq15fXnNeUICjXmdem15nXkNeUKTwvbGFiZWw+DQogICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJ0aW1lIiBpZD0idHJhaW5UaW1lIiByZXF1aXJlZA0KICAgICAgICAgICAgICAgIGNsYXNzPSJpbnB1dC10aW1lIHctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVy",
    "LXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTMgcHktMi41IHRleHQtc20gZm9udC1zZW1pYm9sZCB0cmFja2luZy13aWRlciBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1pbmRpZ28tNTAwIGZvY3VzOm91dGxpbmUtbm9uZSB0cmFuc2l0aW9uIj4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgPCEtLSBEdXJhdGlvbiAoaG91cnMsIDAuMjUgc3RlcCkgLS0+DQogICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBtYi0xIj4NCiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAiPuKPsyDXntep15og15bXntefICjXqdei15XXqik8L2xhYmVsPg0KICAgICAgICAgICAgICA8c3BhbiBpZD0idHJhaW5EdXJhdGlvbkRpc3BsYXkiIGNsYXNzPSJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LWluZGlnby02MDAgYmctaW5kaWdvLTUwIHB4LTIgcHktMC41IHJvdW5kZWQtbWQiPjIuNTAg16nXoteV16o8L3NwYW4+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0zIj4NCiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9InJhbmdlIiBpZD0idHJhaW5EdXJhdGlvblNsaWRlciIgbWluPSIwLjI1IiBtYXg9IjEyLjAiIHN0ZXA9IjAuMjUiIHZhbHVlPSIyLjUiDQogICAgICAgICAgICAg",
    "ICAgY2xhc3M9InNsaWRlci1sdHIgdy1mdWxsIGgtMiBiZy1zbGF0ZS0yMDAgcm91bmRlZC1sZyBhcHBlYXJhbmNlLW5vbmUgY3Vyc29yLXBvaW50ZXIgYWNjZW50LWluZGlnby02MDAiDQogICAgICAgICAgICAgICAgb25pbnB1dD0ic3luY1RyYWluRHVyYXRpb24odGhpcy52YWx1ZSwgJ3NsaWRlcicpIj4NCiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9Im51bWJlciIgaWQ9InRyYWluRHVyYXRpb25OdW0iIG1pbj0iMC4yNSIgbWF4PSIxMi4wIiBzdGVwPSIwLjI1IiB2YWx1ZT0iMi41Ig0KICAgICAgICAgICAgICAgIGNsYXNzPSJpbnB1dC1sdHIgdy0yNCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC1zbSBmb250LWJvbGQgdGV4dC1jZW50ZXIgZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUiDQogICAgICAgICAgICAgICAgb25pbnB1dD0ic3luY1RyYWluRHVyYXRpb24odGhpcy52YWx1ZSwgJ251bWJlcicpIj4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgPCEtLSBEeW5hbWljIEluZm8gSGVscGVyIEJhbm5lciAtLT4NCiAgICAgICAgICA8ZGl2IGlkPSJ0cmFpbkNhbGNCYW5uZXIiIGNsYXNzPSJiZy1pbmRpZ28tNTAgYm9yZGVyIGJvcmRlci1pbmRpZ28tMTAwIHJvdW5kZWQteGwgcC0zIHRleHQteHMgdGV4dC1pbmRpZ28tOTAwIGZsZXggaXRlbXMt",
    "Y2VudGVyIGdhcC0yIj4NCiAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LWJhc2Ugc2VsZWN0LW5vbmUiPvCfkqE8L3NwYW4+DQogICAgICAgICAgICA8ZGl2IGlkPSJ0cmFpbkNhbGNUZXh0IiBjbGFzcz0iZm9udC1tZWRpdW0iPg0KICAgICAgICAgICAgICDXmdem15nXkNeUOiA8YiBpZD0iY2FsY1N0YXJ0Ij4tLTotLTwvYj4gfCDXl9eW16jXlCDXntep15XXoteo16o6IDxiIGlkPSJjYWxjRW5kIj4tLTotLTwvYj4gfCDXodeU17TXmzogPGIgaWQ9ImNhbGNEdXIiPjIuNTAg16nXoteV16o8L2I+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8L2Rpdj4NCg0KICAgICAgICAgIDwhLS0gU3RyZXNzIExldmVsIFNlbGVjdG9yICgxLTUpIC0tPg0KICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gbWItMS41Ij4NCiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAiPvCfmLAg157Xk9eTINec15fXpTwvbGFiZWw+DQogICAgICAgICAgICAgIDxzcGFuIGlkPSJzdHJlc3NTZWxlY3RlZExhYmVsIiBjbGFzcz0idGV4dC14cyBmb250LWJvbGQgdGV4dC1lbWVyYWxkLTcwMCBiZy1lbWVyYWxkLTUwIHB4LTIgcHktMC41IHJvdW5kZWQtbWQiPjIgLSDXkNeZLdep16fXmCDXp9ecIPCfn6E8L3NwYW4+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIA0KICAg",
    "ICAgICAgICAgPGRpdiBjbGFzcz0iZ3JpZCBncmlkLWNvbHMtNSBnYXAtMS41Ij4NCiAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPSJidXR0b24iIG9uY2xpY2s9InNlbGVjdFN0cmVzcygxKSIgaWQ9InN0cmVzcy1idG4tMSINCiAgICAgICAgICAgICAgICBjbGFzcz0ic3RyZXNzLWJ0biBweS0yIHB4LTEgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBiZy13aGl0ZSBob3ZlcjpiZy1zbGF0ZS01MCB0ZXh0LWNlbnRlciB0cmFuc2l0aW9uIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIj4NCiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC1sZyI+8J+fojwvc3Bhbj4NCiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC1bMTBweF0gZm9udC1ib2xkIG10LTAuNSI+MSDXqNeS15XXoteUPC9zcGFuPg0KICAgICAgICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPSJidXR0b24iIG9uY2xpY2s9InNlbGVjdFN0cmVzcygyKSIgaWQ9InN0cmVzcy1idG4tMiINCiAgICAgICAgICAgICAgICBjbGFzcz0ic3RyZXNzLWJ0biBweS0yIHB4LTEgcm91bmRlZC14bCBib3JkZXItMiBib3JkZXIteWVsbG93LTUwMCBiZy15ZWxsb3ctNTAgdGV4dC1jZW50ZXIgdHJhbnNpdGlvbiBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBzaGFkb3ctc20iPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LWxnIj7wn5+hPC9zcGFuPg0KICAgICAgICAgICAgICAg",
    "IDxzcGFuIGNsYXNzPSJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgbXQtMC41Ij4yINen15w8L3NwYW4+DQogICAgICAgICAgICAgIDwvYnV0dG9uPg0KICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgb25jbGljaz0ic2VsZWN0U3RyZXNzKDMpIiBpZD0ic3RyZXNzLWJ0bi0zIg0KICAgICAgICAgICAgICAgIGNsYXNzPSJzdHJlc3MtYnRuIHB5LTIgcHgtMSByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIGJnLXdoaXRlIGhvdmVyOmJnLXNsYXRlLTUwIHRleHQtY2VudGVyIHRyYW5zaXRpb24gZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIiPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LWxnIj7wn5+gPC9zcGFuPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgbXQtMC41Ij4zINeR15nXoNeV16DXmTwvc3Bhbj4NCiAgICAgICAgICAgICAgPC9idXR0b24+DQogICAgICAgICAgICAgIDxidXR0b24gdHlwZT0iYnV0dG9uIiBvbmNsaWNrPSJzZWxlY3RTdHJlc3MoNCkiIGlkPSJzdHJlc3MtYnRuLTQiDQogICAgICAgICAgICAgICAgY2xhc3M9InN0cmVzcy1idG4gcHktMiBweC0xIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgYmctd2hpdGUgaG92ZXI6Ymctc2xhdGUtNTAgdGV4dC1jZW50ZXIgdHJhbnNpdGlvbiBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciI+DQogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9",
    "InRleHQtbGciPvCflLQ8L3NwYW4+DQogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQtWzEwcHhdIGZvbnQtYm9sZCBtdC0wLjUiPjQg157XpteV16fXlDwvc3Bhbj4NCiAgICAgICAgICAgICAgPC9idXR0b24+DQogICAgICAgICAgICAgIDxidXR0b24gdHlwZT0iYnV0dG9uIiBvbmNsaWNrPSJzZWxlY3RTdHJlc3MoNSkiIGlkPSJzdHJlc3MtYnRuLTUiDQogICAgICAgICAgICAgICAgY2xhc3M9InN0cmVzcy1idG4gcHktMiBweC0xIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgYmctd2hpdGUgaG92ZXI6Ymctc2xhdGUtNTAgdGV4dC1jZW50ZXIgdHJhbnNpdGlvbiBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciI+DQogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQtbGciPvCfmqg8L3NwYW4+DQogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQtWzEwcHhdIGZvbnQtYm9sZCBtdC0wLjUiPjUg16TXkNeg15nXp9eUPC9zcGFuPg0KICAgICAgICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgPGlucHV0IHR5cGU9ImhpZGRlbiIgaWQ9InRyYWluU3RyZXNzIiB2YWx1ZT0iMiI+DQogICAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgICA8IS0tIE5vdGVzIC0tPg0KICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7wn5Od",
    "INeU16LXqNeV16o8L2xhYmVsPg0KICAgICAgICAgICAgPGlucHV0IHR5cGU9InRleHQiIGlkPSJ0cmFpbk5vdGVzIg0KICAgICAgICAgICAgICBwbGFjZWhvbGRlcj0i157XlCDXotep16rXlD8g16LXnSDXnteUINeU15XXqdeQ16jXlD8gKNec157XqdecOiDXoNep15DXqNeUINeo15LXldei15Qg15HXnteZ15jXlCkiDQogICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0zIHB5LTIuNSB0ZXh0LXNtIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWluZGlnby01MDAgZm9jdXM6b3V0bGluZS1ub25lIHRyYW5zaXRpb24iPg0KICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgPCEtLSBTdWJtaXQgQnV0dG9uIC0tPg0KICAgICAgICAgIDxidXR0b24gdHlwZT0ic3VibWl0IiBpZD0iYnRuU3VibWl0VHJhaW5pbmciDQogICAgICAgICAgICBjbGFzcz0idy1mdWxsIGJnLWluZGlnby02MDAgaG92ZXI6YmctaW5kaWdvLTcwMCB0ZXh0LXdoaXRlIGZvbnQtYm9sZCBweS0zIHB4LTQgcm91bmRlZC14bCBzaGFkb3ctbWQgdHJhbnNpdGlvbiB0cmFuc2Zvcm0gYWN0aXZlOnNjYWxlLVswLjk5XSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMiI+DQogICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT0ic2F2ZSIgY2xhc3M9InctNSBoLTUiPjwvaT4NCiAgICAgICAgICAgIDxzcGFuPtep157XldeoINeQ15nXnteV158g8J+Svjwv",
    "c3Bhbj4NCiAgICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgPC9mb3JtPg0KICAgICAgPC9kaXY+DQoNCiAgICAgIDwhLS0gQ29tcG9zaXRlIFRyYWluaW5nICYgQXdheSBJbnRlbnNpdHkgQ2hhcnQgLS0+DQogICAgICA8ZGl2IGNsYXNzPSJiZy13aGl0ZSByb3VuZGVkLTJ4bCBwLTUgc2hhZG93LXNtIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIHNwYWNlLXktNCI+DQogICAgICAgIDxkaXYgY2xhc3M9ImZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgc206aXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMyBwYi0yIGJvcmRlci1iIGJvcmRlci1zbGF0ZS0xMDAiPg0KICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIj4NCiAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LXhsIj7wn5CVPC9zcGFuPg0KICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgPGgzIGNsYXNzPSJmb250LWJvbGQgdGV4dC1zbGF0ZS04MDAgdGV4dC1iYXNlIj7XoNeZ16rXldeXINei15XXntehINeV15TXqten15PXnteV16og16nXnCDXnteZ15nXpNecPC9oMz4NCiAgICAgICAgICAgICAgPHAgY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS01MDAiPtei16bXmdee15XXqiDXntep15XXp9ec15zXqiAo15PXoteZ15vXlCDXqdecIDcg15nXnteZ150pLCDXkNeW15XXqNeZINeQ15fXldeW15XXoNeZ150g15XXqdeZ15DXmdedPC9wPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPC9kaXY+",
    "DQoNCiAgICAgICAgICA8IS0tIFRpbWUgUmFuZ2UgU2VsZWN0b3IgLS0+DQogICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgYmctc2xhdGUtMTAwIHAtMSByb3VuZGVkLXhsIHNlbGYtc3RhcnQgc206c2VsZi1hdXRvIHRleHQteHMgZm9udC1zZW1pYm9sZCI+DQogICAgICAgICAgICA8YnV0dG9uIG9uY2xpY2s9InNldENoYXJ0VGltZVJhbmdlKDcpIiBpZD0icmFuZ2UtYnRuLTciIGNsYXNzPSJjaGFydC1yYW5nZS1idG4gcHgtMi41IHB5LTEgcm91bmRlZC1sZyB0ZXh0LXNsYXRlLTYwMCB0cmFuc2l0aW9uIj43INeZ157XmdedPC9idXR0b24+DQogICAgICAgICAgICA8YnV0dG9uIG9uY2xpY2s9InNldENoYXJ0VGltZVJhbmdlKDMwKSIgaWQ9InJhbmdlLWJ0bi0zMCIgY2xhc3M9ImNoYXJ0LXJhbmdlLWJ0biBweC0yLjUgcHktMSByb3VuZGVkLWxnIHRleHQtc2xhdGUtNjAwIHRyYW5zaXRpb24iPjMwINeZ15XXnTwvYnV0dG9uPg0KICAgICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJzZXRDaGFydFRpbWVSYW5nZSg2MCkiIGlkPSJyYW5nZS1idG4tNjAiIGNsYXNzPSJjaGFydC1yYW5nZS1idG4gcHgtMi41IHB5LTEgcm91bmRlZC1sZyBiZy13aGl0ZSBzaGFkb3ctc20gdGV4dC1pbmRpZ28tNjAwIGZvbnQtYm9sZCB0cmFuc2l0aW9uIj7Xl9eV15PXqdeZ15nXnTwvYnV0dG9uPg0KICAgICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJzZXRDaGFydFRpbWVSYW5nZSgwKSIgaWQ9InJhbmdl",
    "LWJ0bi0wIiBjbGFzcz0iY2hhcnQtcmFuZ2UtYnRuIHB4LTIuNSBweS0xIHJvdW5kZWQtbGcgdGV4dC1zbGF0ZS02MDAgdHJhbnNpdGlvbiI+15TXm9ecPC9idXR0b24+DQogICAgICAgICAgPC9kaXY+DQogICAgICAgIDwvZGl2Pg0KDQogICAgICAgIDwhLS0gQ2hhcnQgQ2FudmFzIENvbnRhaW5lciAtLT4NCiAgICAgICAgPGRpdiBjbGFzcz0icmVsYXRpdmUgdy1mdWxsIGgtODAgc206aC05NiI+DQogICAgICAgICAgPGNhbnZhcyBpZD0idHJhaW5pbmdDaGFydCI+PC9jYW52YXM+DQogICAgICAgIDwvZGl2Pg0KDQogICAgICAgIDwhLS0gTGVnZW5kIEV4cGxhbmF0aW9ucyAtLT4NCiAgICAgICAgPGRpdiBjbGFzcz0iZ3JpZCBncmlkLWNvbHMtMiBzbTpncmlkLWNvbHMtNCBnYXAtMiBwdC0yIHRleHQtWzExcHhdIHRleHQtc2xhdGUtNjAwIGJvcmRlci10IGJvcmRlci1zbGF0ZS0xMDAiPg0KICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUiPg0KICAgICAgICAgICAgPHNwYW4gY2xhc3M9InctMyBoLTMgcm91bmRlZC1mdWxsIGJnLVsjMWYyOTM3XSI+PC9zcGFuPg0KICAgICAgICAgICAgPHNwYW4+16LXpteZ157XldeqINee16nXlden15zXnNeqPC9zcGFuPg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUiPg0KICAgICAgICAgICAgPHNwYW4gY2xhc3M9InctMyBoLTMgcm91bmRlZC1zbSBiZy1ibHVlLTQwMC80",
    "MCBib3JkZXIgYm9yZGVyLWJsdWUtNDAwIj48L3NwYW4+DQogICAgICAgICAgICA8c3Bhbj7XoteV157XoSDXp9ecICjXkNeX15XXlteV158gMzMpPC9zcGFuPg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUiPg0KICAgICAgICAgICAgPHNwYW4gY2xhc3M9InctMyBoLTMgcm91bmRlZC1zbSBiZy1ncmVlbi01MDAvNDAgYm9yZGVyIGJvcmRlci1ncmVlbi01MDAiPjwvc3Bhbj4NCiAgICAgICAgICAgIDxzcGFuPteY15XXldeXINeQ15nXk9eZ15DXnNeZICjXkNeX15XXlteV158gOTApPC9zcGFuPg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUiPg0KICAgICAgICAgICAgPHNwYW4gY2xhc3M9InctMyBoLTMgcm91bmRlZC1zbSBiZy1yZWQtNTAwLzQwIGJvcmRlciBib3JkZXItcmVkLTUwMCI+PC9zcGFuPg0KICAgICAgICAgICAgPHNwYW4+16LXldee16Eg15nXqteoIC8g16nXmdeQPC9zcGFuPg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICA8L2Rpdj4NCiAgICAgIDwvZGl2Pg0KDQogICAgICA8IS0tIEF3YXkgTG9nIEZvcm0gKEFjY29yZGlvbiAvIENhcmQpIC0tPg0KICAgICAgPGRpdiBjbGFzcz0iYmctd2hpdGUgcm91bmRlZC0yeGwgcC01IHNoYWRvdy1zbSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCI+DQogICAgICAgIDxidXR0b24gdHlwZT0iYnV0dG9uIiBvbmNsaWNr",
    "PSJ0b2dnbGVBY2NvcmRpb24oJ2F3YXlMb2dDYXJkQ29udGVudCcsICdhd2F5Q2hldnJvbicpIg0KICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQtcmlnaHQiPg0KICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIj4NCiAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LXhsIj7wn4+hPC9zcGFuPg0KICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgPGgzIGNsYXNzPSJmb250LWJvbGQgdGV4dC1zbGF0ZS04MDAgdGV4dC1iYXNlIj7XqteZ16LXldeTINeU15nXoteT16jXldeqINee157Xldep15vXqiAo15jXmdeV15wgLyDXkNeZ16jXldeXINee15fXldelINec15HXmdeqKTwvaDM+DQogICAgICAgICAgICAgIDxwIGNsYXNzPSJ0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIj7Xnteh157XnyDXqNen16Ig16bXkdei15XXoNeZINeR15LXqNejINee15HXnNeZINec15TXmNeV16og15DXqiDXnteT15Mg15TXotem15nXnteV16o8L3A+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT0iY2hldnJvbi1kb3duIiBpZD0iYXdheUNoZXZyb24iIGNsYXNzPSJ3LTUgaC01IHRleHQtc2xhdGUtNDAwIHRyYW5zaXRpb24tdHJhbnNmb3JtIGR1cmF0aW9uLTIwMCI+PC9pPg0KICAgICAgICA8L2J1dHRvbj4NCg0KICAgICAgICA8ZGl2IGlkPSJhd2F5TG9nQ2FyZENvbnRl",
    "bnQiIGNsYXNzPSJoaWRkZW4gbXQtNCBwdC00IGJvcmRlci10IGJvcmRlci1zbGF0ZS0xMDAgc3BhY2UteS00Ij4NCiAgICAgICAgICA8cCBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTYwMCBsZWFkaW5nLXJlbGF4ZWQiPg0KICAgICAgICAgICAg157Xqdeq157XqdeZ150g15HXl9ec16cg15bXlCDXnNeq15nXoteV15Mg15TXmdei15PXqNeV15nXldeqINeQ16jXldeb15XXqiDXm9eT15kg16nXlNeW157XnyDXmdeh15XXntefINeR16bXkdeiINeU157XqteQ15nXnSDXotecINeU15LXqNejINeV15zXkCDXmdeY15Qg15DXqiDXnteT15Mg15TXotem15nXnteV16ouDQogICAgICAgICAgPC9wPg0KDQogICAgICAgICAgPGZvcm0gaWQ9ImZvcm1Bd2F5IiBvbnN1Ym1pdD0iaGFuZGxlQXdheVN1Ym1pdChldmVudCkiIGNsYXNzPSJzcGFjZS15LTQiPg0KICAgICAgICAgICAgPGRpdiBjbGFzcz0iZ3JpZCBncmlkLWNvbHMtMSBzbTpncmlkLWNvbHMtMiBnYXAtNCI+DQogICAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAgbWItMSI+8J+ThSDXqteQ16jXmdeaINeq15fXmdec16og15TXmdei15PXqNeV16o8L2xhYmVsPg0KICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJkYXRlIiBpZD0iYXdheVN0YXJ0IiByZXF1aXJlZCBvbmNoYW5nZT0iY2FsY0F3YXlEYXlzKCkiDQogICAgICAgICAgICAgICAgICBjbGFz",
    "cz0idy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMyBweS0yLjUgdGV4dC1zbSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1pbmRpZ28tNTAwIGZvY3VzOm91dGxpbmUtbm9uZSI+DQogICAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPvCfk4Ug16rXkNeo15nXmiDXl9eW16jXlDwvbGFiZWw+DQogICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9ImRhdGUiIGlkPSJhd2F5RW5kIiByZXF1aXJlZCBvbmNoYW5nZT0iY2FsY0F3YXlEYXlzKCkiDQogICAgICAgICAgICAgICAgICBjbGFzcz0idy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMyBweS0yLjUgdGV4dC1zbSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1pbmRpZ28tNTAwIGZvY3VzOm91dGxpbmUtbm9uZSI+DQogICAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPvCfk40g15DXmdek15Qg157XmdeZ16TXnCDXqtep15TXlD88L2xhYmVsPg0KICAgICAgICAgICAgICA8c2VsZWN0IGlkPSJhd2F5TG9jYXRp",
    "b24iDQogICAgICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTMgcHktMi41IHRleHQtc20gZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUiPg0KICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IteQ16bXnCDXmdeQ15nXqCDXkdee16nXpyDwn5qcIj7XkNem15wg15nXkNeZ16gg15HXntep16cg8J+anCAo16HXkteV15wpPC9vcHRpb24+DQogICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0i15DXptecINeQ15HXkCDXkdee16nXpyDwn5qcIj7XkNem15wg15DXkdeQINeR157XqdenIPCfmpwgKNeh15LXldecKTwvb3B0aW9uPg0KICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IteQ16bXnCDXoNeZ16fXldecINeR15TXqNem15zXmdeUIPCfj5bvuI8iPteQ16bXnCDXoNeZ16fXldecINeR15TXqNem15zXmdeUIPCfj5bvuI8gKNeY15XXqNen15nXlik8L29wdGlvbj4NCiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSLXkNem15wg15jXqNeZ15nXodeZINeR157XoNeV16Mg8J+PoSI+15DXptecINeY16jXmdeZ16HXmSDXkdee16DXldejIPCfj6EgKNeZ16jXldenKTwvb3B0aW9uPg0KICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IteQ16bXnCDXl9eR16jXmdedINeR16rXnCDXkNeR15nXkSDwn4+Z77iPIj7XkNem15wg15fXkdeo15nXnSDXkdeq15wg15DXkdeZ",
    "15Eg8J+Pme+4jyAo15vXl9eV15wpPC9vcHRpb24+DQogICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0i15HXkdeZ16og15vXqdee15nXqdeU15Ug16nXldee16gg16LXnNeZ15Qg8J+PoCI+15HXkdeZ16og15vXqdee15nXqdeU15Ug16nXldee16gg16LXnNeZ15Qg8J+PoCAo15vXqteV150pPC9vcHRpb24+DQogICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0i16TXoNeh15nXldefIPCfkL4iPtek16DXodeZ15XXnyDwn5C+ICjXldeo15XXkyk8L29wdGlvbj4NCiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSLXkNeX16gg4pyoIiBzZWxlY3RlZD7XkNeX16gg4pyoICjXkNeZ16DXk9eZ15LXlSk8L29wdGlvbj4NCiAgICAgICAgICAgICAgPC9zZWxlY3Q+DQogICAgICAgICAgICA8L2Rpdj4NCg0KICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAgbWItMSI+8J+TnSDXlNei16jXldeqINei15wg15TXqten15XXpNeUPC9sYWJlbD4NCiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9InRleHQiIGlkPSJhd2F5Tm90ZXMiIHBsYWNlaG9sZGVyPSLXkNeZ15og15TXkteZ15HXlD8g15TXkNedINeU15nXlSDXqdeZ16DXldeZ15nXnSDXlNeq16DXlNeS15XXqteZ15nXnT8iDQogICAgICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVk",
    "LXhsIHB4LTMgcHktMi41IHRleHQtc20gZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUiPg0KICAgICAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgICAgIDwhLS0gRHluYW1pYyBEYXlzIFZhbGlkYXRpb24gQmFubmVyIC0tPg0KICAgICAgICAgICAgPGRpdiBpZD0iYXdheURheXNCYW5uZXIiIGNsYXNzPSJwLTMgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtbWVkaXVtIGJnLWluZGlnby01MCBib3JkZXIgYm9yZGVyLWluZGlnby0xMDAgdGV4dC1pbmRpZ28tOTAwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIj4NCiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQtYmFzZSI+8J+SoTwvc3Bhbj4NCiAgICAgICAgICAgICAgPHNwYW4gaWQ9ImF3YXlEYXlzVGV4dCI+16HXlNe015sg15bXntefINeU15nXoteT16jXldeqINee16rXldeb16DXnzogPGI+MTQg15nXnteZ1508L2I+PC9zcGFuPg0KICAgICAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgICAgIDxidXR0b24gdHlwZT0ic3VibWl0IiBpZD0iYnRuU3VibWl0QXdheSINCiAgICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1pbmRpZ28tNjAwIGhvdmVyOmJnLWluZGlnby03MDAgdGV4dC13aGl0ZSBmb250LWJvbGQgcHktMyBweC00IHJvdW5kZWQteGwgc2hhZG93LW1kIHRyYW5zaXRpb24gdHJhbnNmb3JtIGFjdGl2ZTpzY2FsZS1bMC45OV0gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTIiPg0K",
    "ICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT0ic2F2ZSIgY2xhc3M9InctNSBoLTUiPjwvaT4NCiAgICAgICAgICAgICAgPHNwYW4+16nXnteV16gg15TXmdei15PXqNeV16og8J+Svjwvc3Bhbj4NCiAgICAgICAgICAgIDwvYnV0dG9uPg0KICAgICAgICAgIDwvZm9ybT4NCiAgICAgICAgPC9kaXY+DQogICAgICA8L2Rpdj4NCg0KICAgIDwvc2VjdGlvbj4NCg0KICAgIDwhLS0gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAtLT4NCiAgICA8IS0tIFRBQiAyOiDXlNeQ15vXnNeV16ogKEZlZWRpbmcgVHJhY2tlcikgLS0+DQogICAgPCEtLSA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC0tPg0KICAgIDxzZWN0aW9uIGlkPSJ0YWItZmVlZGluZyIgY2xhc3M9InRhYi1jb250ZW50IHNwYWNlLXktNiI+DQogICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4iPg0KICAgICAgICA8ZGl2Pg0KICAgICAgICAgIDxoMiBjbGFzcz0idGV4dC14bCBmb250LWJvbGQgdGV4dC1zbGF0ZS04MDAiPteZ15XXntefINeQ15vXmdec15Q8L2gyPg0KICAgICAgICAgIDxwIGNsYXNzPSJ0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIj7XqteZ16LXldeTINeQ16jXldeX15XXqiDXmdeV157XmdeV16osINee16LXp9eRINeb157XldeqINeV",
    "16HXmdeV150g157XoNeUPC9wPg0KICAgICAgICA8L2Rpdj4NCiAgICAgIDwvZGl2Pg0KDQogICAgICA8IS0tIEFkZCBGZWVkaW5nIEZvcm0gQ2FyZCAtLT4NCiAgICAgIDxkaXYgY2xhc3M9ImJnLXdoaXRlIHJvdW5kZWQtMnhsIHAtNSBzaGFkb3ctc20gYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAiPg0KICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtYi00IHBiLTIgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTEwMCI+DQogICAgICAgICAgPGkgZGF0YS1sdWNpZGU9InV0ZW5zaWxzIiBjbGFzcz0idy01IGgtNSB0ZXh0LWluZGlnby02MDAiPjwvaT4NCiAgICAgICAgICA8aDMgY2xhc3M9ImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTgwMCB0ZXh0LWJhc2UiPvCfjZYg15TXldeh16TXqiDXkNeo15XXl9eUPC9oMz4NCiAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgPGZvcm0gaWQ9ImZvcm1GZWVkaW5nIiBvbnN1Ym1pdD0iaGFuZGxlRmVlZGluZ1N1Ym1pdChldmVudCkiIGNsYXNzPSJzcGFjZS15LTQiPg0KICAgICAgICAgIDxkaXYgY2xhc3M9ImdyaWQgZ3JpZC1jb2xzLTEgc206Z3JpZC1jb2xzLTMgZ2FwLTQiPg0KICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAgbWItMSI+16rXkNeo15nXmjwvbGFiZWw+DQogICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJkYXRlIiBpZD0iZmVlZERhdGUi",
    "IHJlcXVpcmVkDQogICAgICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTMgcHktMi41IHRleHQtc20gZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUiPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7Xqdei15Q8L2xhYmVsPg0KICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0idGltZSIgaWQ9ImZlZWRUaW1lIiByZXF1aXJlZA0KICAgICAgICAgICAgICAgIGNsYXNzPSJpbnB1dC10aW1lIHctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTMgcHktMi41IHRleHQtc20gZm9udC1zZW1pYm9sZCB0cmFja2luZy13aWRlciBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1pbmRpZ28tNTAwIGZvY3VzOm91dGxpbmUtbm9uZSI+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPteh15XXkiDXkNeo15XXl9eUPC9sYWJlbD4NCiAgICAgICAgICAgICAgPHNlbGVjdCBpZD0iZmVlZFR5cGUiDQogICAgICAgICAgICAgICAgY2xhc3M9",
    "InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTMgcHktMi41IHRleHQtc20gZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUiPg0KICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IteR15XXp9eoIiBzZWxlY3RlZD7XkdeV16fXqCDimIDvuI88L29wdGlvbj4NCiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSLXoteo15EiPtei16jXkSDwn4yZPC9vcHRpb24+DQogICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0i15DXl9eoIj7XkNeX16gg4pyoPC9vcHRpb24+DQogICAgICAgICAgICAgIDwvc2VsZWN0Pg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgICA8IS0tIEFtb3VudCBpbiBDdXBzIHdpdGggR3JhbXMgQ29udmVydGVyICgxIGN1cCA9IDQwMGcpIC0tPg0KICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gbWItMSI+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0idGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIj7Xm9ee15XXqiAo15vXldeh15XXqik8L2xhYmVsPg0KICAgICAgICAgICAgICA8c3BhbiBpZD0iZmVlZEdyYW1zVGV4dCIgY2xhc3M9InRleHQteHMgZm9udC1ib2xkIHRleHQtaW5kaWdvLTYwMCBiZy1pbmRpZ28tNTAgcHgtMiBweS0wLjUg",
    "cm91bmRlZC1tZCI+DQogICAgICAgICAgICAgICAgMS4wMCDXm9eV16EgPSA0MDAg15LXqNedICgxINeb15XXoSA9IDQwMCDXkteo150pDQogICAgICAgICAgICAgIDwvc3Bhbj4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMiPg0KICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0icmFuZ2UiIGlkPSJmZWVkQW1vdW50U2xpZGVyIiBtaW49IjAuMjUiIG1heD0iNC4wIiBzdGVwPSIwLjI1IiB2YWx1ZT0iMS4wIg0KICAgICAgICAgICAgICAgIGNsYXNzPSJzbGlkZXItbHRyIHctZnVsbCBoLTIgYmctc2xhdGUtMjAwIHJvdW5kZWQtbGcgYXBwZWFyYW5jZS1ub25lIGN1cnNvci1wb2ludGVyIGFjY2VudC1pbmRpZ28tNjAwIg0KICAgICAgICAgICAgICAgIG9uaW5wdXQ9InN5bmNGZWVkQW1vdW50KHRoaXMudmFsdWUsICdzbGlkZXInKSI+DQogICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJudW1iZXIiIGlkPSJmZWVkQW1vdW50TnVtIiBtaW49IjAuMjUiIG1heD0iNC4wIiBzdGVwPSIwLjI1IiB2YWx1ZT0iMS4wIg0KICAgICAgICAgICAgICAgIGNsYXNzPSJpbnB1dC1sdHIgdy0yNCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC1zbSBmb250LWJvbGQgdGV4dC1jZW50ZXIgZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUiDQogICAg",
    "ICAgICAgICAgICAgb25pbnB1dD0ic3luY0ZlZWRBbW91bnQodGhpcy52YWx1ZSwgJ251bWJlcicpIj4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgPCEtLSBGaW5pc2hlZCBDaGVja2JveCAvIFRvZ2dsZSAtLT4NCiAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcC0zIGJnLXNsYXRlLTUwIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAiPg0KICAgICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIiPg0KICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC1sZyI+8J+lozwvc3Bhbj4NCiAgICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgICA8bGFiZWwgZm9yPSJmZWVkRmluaXNoZWQiIGNsYXNzPSJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTgwMCBjdXJzb3ItcG9pbnRlciI+15TXkNedINeh15nXmdee15Qg15TXm9ecPzwvbGFiZWw+DQogICAgICAgICAgICAgICAgPHAgY2xhc3M9InRleHQtWzExcHhdIHRleHQtc2xhdGUtNTAwIj7Xodee16DXlSAn15zXkCcg15DXnSDXoNep15DXqCDXkNeV15vXnCDXkden16LXqNeUPC9wPg0KICAgICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJyZWxhdGl2ZSBpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgY3Vyc29yLXBvaW50ZXIiPg0KICAgICAgICAg",
    "ICAgICA8aW5wdXQgdHlwZT0iY2hlY2tib3giIGlkPSJmZWVkRmluaXNoZWQiIGNoZWNrZWQgY2xhc3M9InNyLW9ubHkgcGVlciI+DQogICAgICAgICAgICAgIDxkaXYgY2xhc3M9InctMTEgaC02IGJnLXNsYXRlLTMwMCBwZWVyLWZvY3VzOm91dGxpbmUtbm9uZSByb3VuZGVkLWZ1bGwgcGVlciBwZWVyLWNoZWNrZWQ6YWZ0ZXI6dHJhbnNsYXRlLXgtZnVsbCBydGw6cGVlci1jaGVja2VkOmFmdGVyOi10cmFuc2xhdGUteC1mdWxsIHBlZXItY2hlY2tlZDphZnRlcjpib3JkZXItd2hpdGUgYWZ0ZXI6Y29udGVudC1bJyddIGFmdGVyOmFic29sdXRlIGFmdGVyOnRvcC1bMnB4XSBhZnRlcjpzdGFydC1bMnB4XSBhZnRlcjpiZy13aGl0ZSBhZnRlcjpib3JkZXItc2xhdGUtMzAwIGFmdGVyOmJvcmRlciBhZnRlcjpyb3VuZGVkLWZ1bGwgYWZ0ZXI6aC01IGFmdGVyOnctNSBhZnRlcjp0cmFuc2l0aW9uLWFsbCBwZWVyLWNoZWNrZWQ6YmctZW1lcmFsZC01MDAiPjwvZGl2Pg0KICAgICAgICAgICAgPC9sYWJlbD4NCiAgICAgICAgICA8L2Rpdj4NCg0KICAgICAgICAgIDwhLS0gTm90ZXMgLS0+DQogICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPteU16LXqNeV16og16DXldeh16TXldeqPC9sYWJlbD4NCiAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJ0ZXh0IiBpZD0iZmVlZE5vdGVzIiBwbGFjZWhvbGRlcj0i16rXmdeQ",
    "15HXldefLCDXqteV16HXpNeV16osINep15nXoNeV15nXmdedIg0KICAgICAgICAgICAgICBjbGFzcz0idy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMyBweS0yLjUgdGV4dC1zbSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1pbmRpZ28tNTAwIGZvY3VzOm91dGxpbmUtbm9uZSI+DQogICAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgICA8YnV0dG9uIHR5cGU9InN1Ym1pdCIgaWQ9ImJ0blN1Ym1pdEZlZWRpbmciDQogICAgICAgICAgICBjbGFzcz0idy1mdWxsIGJnLWluZGlnby02MDAgaG92ZXI6YmctaW5kaWdvLTcwMCB0ZXh0LXdoaXRlIGZvbnQtYm9sZCBweS0zIHB4LTQgcm91bmRlZC14bCBzaGFkb3ctbWQgdHJhbnNpdGlvbiB0cmFuc2Zvcm0gYWN0aXZlOnNjYWxlLVswLjk5XSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMiI+DQogICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT0ic2F2ZSIgY2xhc3M9InctNSBoLTUiPjwvaT4NCiAgICAgICAgICAgIDxzcGFuPtep157XldeoINeQ16jXldeX15Qg8J+Svjwvc3Bhbj4NCiAgICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgPC9mb3JtPg0KICAgICAgPC9kaXY+DQoNCiAgICAgIDwhLS0gRmVlZGluZyBEYWlseSBTdGFja2VkIEJhciBDaGFydCAtLT4NCiAgICAgIDxkaXYgY2xhc3M9ImJnLXdoaXRlIHJvdW5kZWQtMnhsIHAtNSBzaGFkb3ctc20gYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgc3Bh",
    "Y2UteS00Ij4NCiAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHBiLTIgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTEwMCI+DQogICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgIDxoMyBjbGFzcz0iZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIHRleHQtYmFzZSI+157Xoten15Eg15DXm9eZ15zXlCAo15nXqNeV16c916HXmdeZ157XlCwg15DXk9eV150915zXkCDXodeZ15nXnteUKTwvaDM+DQogICAgICAgICAgICA8cCBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTUwMCI+8J+TiiDXm9ee15XXqiDXkNeV15vXnCDXmdeV157XmdeqICjXm9eV16HXldeqKTwvcD4NCiAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgPGRpdiBjbGFzcz0icmVsYXRpdmUgdy1mdWxsIGgtNzIgc206aC04MCI+DQogICAgICAgICAgPGNhbnZhcyBpZD0iZmVlZGluZ0NoYXJ0Ij48L2NhbnZhcz4NCiAgICAgICAgPC9kaXY+DQogICAgICA8L2Rpdj4NCiAgICA8L3NlY3Rpb24+DQoNCiAgICA8IS0tID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLS0+DQogICAgPCEtLSBUQUIgMzog157XqdeZ157XldeqIChUYXNrcyAmIEV4ZWN1dGlvbiBMb2dzKSAtLT4NCiAgICA8IS0tID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09",
    "PT09PT09PT0gLS0+DQogICAgPHNlY3Rpb24gaWQ9InRhYi10YXNrcyIgY2xhc3M9InRhYi1jb250ZW50IHNwYWNlLXktNiI+DQogICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4iPg0KICAgICAgICA8ZGl2Pg0KICAgICAgICAgIDxoMiBjbGFzcz0idGV4dC14bCBmb250LWJvbGQgdGV4dC1zbGF0ZS04MDAiPteg15nXlNeV15wg157XqdeZ157XldeqPC9oMj4NCiAgICAgICAgICA8cCBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTUwMCI+16rXqNeS15nXnNeZINeQ15nXnNeV16MsINeq15PXmdeo15XXqiDXldee16LXp9eRINeR15nXpteV16LXmdedPC9wPg0KICAgICAgICA8L2Rpdj4NCiAgICAgIDwvZGl2Pg0KDQogICAgICA8IS0tIE5ldyBUYXNrIERlZmluaXRpb24gRm9ybSAoQWNjb3JkaW9uKSAtLT4NCiAgICAgIDxkaXYgY2xhc3M9ImJnLXdoaXRlIHJvdW5kZWQtMnhsIHAtNSBzaGFkb3ctc20gYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAiPg0KICAgICAgICA8YnV0dG9uIHR5cGU9ImJ1dHRvbiIgb25jbGljaz0idG9nZ2xlQWNjb3JkaW9uKCduZXdUYXNrQ2FyZENvbnRlbnQnLCAndGFza0NoZXZyb24nKSINCiAgICAgICAgICBjbGFzcz0idy1mdWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB0ZXh0LXJpZ2h0Ij4NCiAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+DQogICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4",
    "dC14bCI+4p6VPC9zcGFuPg0KICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgPGgzIGNsYXNzPSJmb250LWJvbGQgdGV4dC1zbGF0ZS04MDAgdGV4dC1iYXNlIj7Xmdem15nXqNeqINeq16jXkteZ15wg15fXk9epINeR157Xoteo15vXqjwvaDM+DQogICAgICAgICAgICAgIDxwIGNsYXNzPSJ0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIj7XlNeV16HXpNeqINeq16jXkteZ15wv157XqdeZ157XlCDXnNen15jXnNeV15I8L3A+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT0iY2hldnJvbi1kb3duIiBpZD0idGFza0NoZXZyb24iIGNsYXNzPSJ3LTUgaC01IHRleHQtc2xhdGUtNDAwIHRyYW5zaXRpb24tdHJhbnNmb3JtIGR1cmF0aW9uLTIwMCI+PC9pPg0KICAgICAgICA8L2J1dHRvbj4NCg0KICAgICAgICA8ZGl2IGlkPSJuZXdUYXNrQ2FyZENvbnRlbnQiIGNsYXNzPSJoaWRkZW4gbXQtNCBwdC00IGJvcmRlci10IGJvcmRlci1zbGF0ZS0xMDAiPg0KICAgICAgICAgIDxmb3JtIGlkPSJmb3JtTmV3VGFzayIgb25zdWJtaXQ9ImhhbmRsZU5ld1Rhc2tTdWJtaXQoZXZlbnQpIiBjbGFzcz0ic3BhY2UteS00Ij4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPtep150g15TXqteo15LXmdecICo8L2xhYmVsPg0KICAgICAgICAgICAg",
    "ICA8aW5wdXQgdHlwZT0idGV4dCIgaWQ9InRhc2tOYW1lSW5wdXQiIHJlcXVpcmVkIHBsYWNlaG9sZGVyPSLXnNee16nXnDog15TXmdep15DXqNeV16og15HXnteZ15jXlCINCiAgICAgICAgICAgICAgICBjbGFzcz0idy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMyBweS0yLjUgdGV4dC1zbSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1pbmRpZ28tNTAwIGZvY3VzOm91dGxpbmUtbm9uZSI+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPteq15PXmdeo15XXqiAo15zXntep15w6INek16LXnteZ15nXnSDXkdeZ15XXnSk8L2xhYmVsPg0KICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0idGV4dCIgaWQ9InRhc2tGcmVxSW5wdXQiIHBsYWNlaG9sZGVyPSLXpNei157XmdeZ150g15HXmdeV150sINeb15wg15HXlden16gsINeV15vXlSciDQogICAgICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTMgcHktMi41IHRleHQtc20gZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctaW5kaWdvLTUwMCBmb2N1czpvdXRsaW5lLW5vbmUiPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgICA8bGFi",
    "ZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7Xk9eS16nXmdedINec15HXmdem15XXojwvbGFiZWw+DQogICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJ0ZXh0IiBpZD0idGFza0Rlc2NJbnB1dCIgcGxhY2Vob2xkZXI9Itep15fXqNeV16gg16jXpyDXkdek16fXldeT15QsINee16jXl9enIDMg157XmNeo15nXnS4uLiINCiAgICAgICAgICAgICAgICBjbGFzcz0idy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMyBweS0yLjUgdGV4dC1zbSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1pbmRpZ28tNTAwIGZvY3VzOm91dGxpbmUtbm9uZSI+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxidXR0b24gdHlwZT0ic3VibWl0IiBpZD0iYnRuU3VibWl0TmV3VGFzayINCiAgICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS04MDAgaG92ZXI6Ymctc2xhdGUtOTAwIHRleHQtd2hpdGUgZm9udC1ib2xkIHB5LTIuNSBweC00IHJvdW5kZWQteGwgc2hhZG93IHRyYW5zaXRpb24iPg0KICAgICAgICAgICAgICDXpteV16gg16rXqNeS15nXnCDinpUNCiAgICAgICAgICAgIDwvYnV0dG9uPg0KICAgICAgICAgIDwvZm9ybT4NCiAgICAgICAgPC9kaXY+DQogICAgICA8L2Rpdj4NCg0KICAgICAgPCEtLSBMb2cgVGFzayBFeGVjdXRpb24gRm9ybSBDYXJkIC0tPg0KICAgICAgPGRpdiBjbGFzcz0iYmctd2hp",
    "dGUgcm91bmRlZC0yeGwgcC01IHNoYWRvdy1zbSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCI+DQogICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIG1iLTQgcGItMiBib3JkZXItYiBib3JkZXItc2xhdGUtMTAwIj4NCiAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT0iY2hlY2stY2lyY2xlIiBjbGFzcz0idy01IGgtNSB0ZXh0LWluZGlnby02MDAiPjwvaT4NCiAgICAgICAgICA8aDMgY2xhc3M9ImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTgwMCB0ZXh0LWJhc2UiPuKchSDXqteZ16LXldeTINeR15nXpteV16Ig16rXqNeS15nXnDwvaDM+DQogICAgICAgIDwvZGl2Pg0KDQogICAgICAgIDxmb3JtIGlkPSJmb3JtTG9nVGFzayIgb25zdWJtaXQ9ImhhbmRsZUxvZ1Rhc2tTdWJtaXQoZXZlbnQpIiBjbGFzcz0ic3BhY2UteS00Ij4NCiAgICAgICAgICA8ZGl2IGlkPSJub1Rhc2tzQWxlcnQiIGNsYXNzPSJoaWRkZW4gcC0zIHJvdW5kZWQteGwgYmctYW1iZXItNTAgYm9yZGVyIGJvcmRlci1hbWJlci0yMDAgdGV4dC1hbWJlci04MDAgdGV4dC14cyI+DQogICAgICAgICAgICDXkNeZ158g16rXqNeS15nXnNeZ150g16TXoteZ15zXmdedINeR157Xoteo15vXqi4g16bXldeoINeq16jXkteZ15wg15fXk9epINec157Xotec15QuDQogICAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgICA8ZGl2IGlkPSJsb2dUYXNrRmllbGRzIiBjbGFzcz0ic3BhY2UteS00Ij4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAg",
    "ICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPteR15fXqCDXqteo15LXmdecINec16rXmdei15XXkzo8L2xhYmVsPg0KICAgICAgICAgICAgICA8c2VsZWN0IGlkPSJzZWxUYXNrTmFtZSIgcmVxdWlyZWQNCiAgICAgICAgICAgICAgICBjbGFzcz0idy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMyBweS0yLjUgdGV4dC1zbSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1pbmRpZ28tNTAwIGZvY3VzOm91dGxpbmUtbm9uZSI+DQogICAgICAgICAgICAgICAgPCEtLSBEeW5hbWljYWxseSBwb3B1bGF0ZWQgLS0+DQogICAgICAgICAgICAgIDwvc2VsZWN0Pg0KICAgICAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImdyaWQgZ3JpZC1jb2xzLTEgc206Z3JpZC1jb2xzLTIgZ2FwLTQiPg0KICAgICAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPteq15DXqNeZ15og15HXmdem15XXojwvbGFiZWw+DQogICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9ImRhdGUiIGlkPSJ0YXNrRXhlY0RhdGUiIHJlcXVpcmVkDQogICAgICAgICAgICAgICAgICBjbGFzcz0idy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMyBw",
    "eS0yLjUgdGV4dC1zbSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1pbmRpZ28tNTAwIGZvY3VzOm91dGxpbmUtbm9uZSI+DQogICAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBtYi0xIj4NCiAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0idGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIj7XkNeZ15og15TXnNeaPyAoMT3XlNeq15fXnNeULCA1Pdep15zXmdeY15Qg157XnNeQ15QpPC9sYWJlbD4NCiAgICAgICAgICAgICAgICAgIDxzcGFuIGlkPSJ0YXNrU2NvcmVEaXNwbGF5IiBjbGFzcz0idGV4dC14cyBmb250LWJvbGQgdGV4dC1pbmRpZ28tNjAwIGJnLWluZGlnby01MCBweC0yIHB5LTAuNSByb3VuZGVkLW1kIj4zIC0g15HXmdeg15XXoNeZPC9zcGFuPg0KICAgICAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgICAgIDxkaXYgZGlyPSJsdHIiIGNsYXNzPSJtdC0xIj4NCiAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJyYW5nZSIgaWQ9InRhc2tTY29yZVNsaWRlciIgbWluPSIxIiBtYXg9IjUiIHN0ZXA9IjEiIHZhbHVlPSIzIg0KICAgICAgICAgICAgICAgICAgICBjbGFzcz0ic2xpZGVyLWx0ciB3LWZ1bGwgaC0yIGJnLXNsYXRlLTIwMCByb3VuZGVkLWxnIGFwcGVhcmFuY2Utbm9uZSBjdXJzb3ItcG9pbnRlciBhY2NlbnQtaW5kaWdvLTYw",
    "MCINCiAgICAgICAgICAgICAgICAgICAgb25pbnB1dD0idXBkYXRlVGFza1Njb3JlTGFiZWwodGhpcy52YWx1ZSkiPg0KICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBqdXN0aWZ5LWJldHdlZW4gdGV4dC1bMTBweF0gdGV4dC1zbGF0ZS01MDAgcHgtMSBtdC0xIiBkaXI9Imx0ciI+DQogICAgICAgICAgICAgICAgICAgIDxzcGFuPjEgKNeU16rXl9ec15QpPC9zcGFuPg0KICAgICAgICAgICAgICAgICAgICA8c3Bhbj4yPC9zcGFuPg0KICAgICAgICAgICAgICAgICAgICA8c3Bhbj4zPC9zcGFuPg0KICAgICAgICAgICAgICAgICAgICA8c3Bhbj40PC9zcGFuPg0KICAgICAgICAgICAgICAgICAgICA8c3Bhbj41ICjXqdec15nXmNeUINee15zXkNeUKTwvc3Bhbj4NCiAgICAgICAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDwvZGl2Pg0KDQogICAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7XlNei16jXldeqINei15wg15TXkdeZ16bXldeiPC9sYWJlbD4NCiAgICAgICAgICAgICAgPHRleHRhcmVhIGlkPSJ0YXNrRXhlY05vdGVzIiByb3dzPSIyIiBwbGFjZWhvbGRlcj0i15DXmdeaINeU15LXmdeR15Q/INeb157XlCDXpNei157XmdedINeU16bXnNeZ15fXlD8iDQogICAgICAgICAgICAgICAgY2xh",
    "c3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTMgcHktMiB0ZXh0LXNtIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWluZGlnby01MDAgZm9jdXM6b3V0bGluZS1ub25lIj48L3RleHRhcmVhPg0KICAgICAgICAgICAgPC9kaXY+DQoNCiAgICAgICAgICAgIDxidXR0b24gdHlwZT0ic3VibWl0IiBpZD0iYnRuU3VibWl0VGFza0xvZyINCiAgICAgICAgICAgICAgY2xhc3M9InctZnVsbCBiZy1pbmRpZ28tNjAwIGhvdmVyOmJnLWluZGlnby03MDAgdGV4dC13aGl0ZSBmb250LWJvbGQgcHktMyBweC00IHJvdW5kZWQteGwgc2hhZG93LW1kIHRyYW5zaXRpb24gdHJhbnNmb3JtIGFjdGl2ZTpzY2FsZS1bMC45OV0gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTIiPg0KICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT0ic2F2ZSIgY2xhc3M9InctNSBoLTUiPjwvaT4NCiAgICAgICAgICAgICAgPHNwYW4+16rXmdei15XXkyDXkdeZ16bXldeiIPCfkr48L3NwYW4+DQogICAgICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgPC9mb3JtPg0KICAgICAgPC9kaXY+DQoNCiAgICAgIDwhLS0gVGFzayBFeGVjdXRpb24gU2NhdHRlciBQbG90IC0tPg0KICAgICAgPGRpdiBjbGFzcz0iYmctd2hpdGUgcm91bmRlZC0yeGwgcC01IHNoYWRvdy1zbSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBzcGFjZS15LTQiPg0KICAgICAgICA8",
    "ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcGItMiBib3JkZXItYiBib3JkZXItc2xhdGUtMTAwIj4NCiAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgPGgzIGNsYXNzPSJmb250LWJvbGQgdGV4dC1zbGF0ZS04MDAgdGV4dC1iYXNlIj7Xntei16fXkSDXlNem15zXl9eUINec16TXmSDXqteo15LXmdecPC9oMz4NCiAgICAgICAgICAgIDxwIGNsYXNzPSJ0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIj7XpteZ15XXnyDXkNeZ15vXldeqICgxLTUpINec15DXldeo15og16bXmdeoINeU15bXntefPC9wPg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICA8L2Rpdj4NCg0KICAgICAgICA8ZGl2IGNsYXNzPSJyZWxhdGl2ZSB3LWZ1bGwgaC03MiBzbTpoLTgwIj4NCiAgICAgICAgICA8Y2FudmFzIGlkPSJ0YXNrc0NoYXJ0Ij48L2NhbnZhcz4NCiAgICAgICAgPC9kaXY+DQogICAgICA8L2Rpdj4NCiAgICA8L3NlY3Rpb24+DQoNCiAgICA8IS0tID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gLS0+DQogICAgPCEtLSBUQUIgNDog15TXmdeh15jXldeo15nXlCDXldeZ15XXntefIChIaXN0b3J5ICYgRnVsbCBDUlVEIE1hbmFnZW1lbnQpIC0tPg0KICAgIDwhLS0gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAtLT4NCiAgICA8c2Vj",
    "dGlvbiBpZD0idGFiLWhpc3RvcnkiIGNsYXNzPSJ0YWItY29udGVudCBzcGFjZS15LTYiPg0KICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIj4NCiAgICAgICAgPGRpdj4NCiAgICAgICAgICA8aDIgY2xhc3M9InRleHQteGwgZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIj7XlNeZ16HXmNeV16jXmdeUINeV15nXldee158g157XnNeQPC9oMj4NCiAgICAgICAgICA8cCBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTUwMCI+16bXpNeZ15nXlCDXkdeo16nXldee15XXqiwg16LXqNeZ15vXlCDXm9eZ16jXldeo15LXmdeqINeV157Xl9eZ16fXqiDXqdeV16jXldeqPC9wPg0KICAgICAgICA8L2Rpdj4NCiAgICAgIDwvZGl2Pg0KDQogICAgICA8IS0tIFN1Yi1OYXZpZ2F0aW9uIGZvciBIaXN0b3J5IERvbWFpbnMgLS0+DQogICAgICA8ZGl2IGNsYXNzPSJmbGV4IG92ZXJmbG93LXgtYXV0byBnYXAtMiBwYi0xIG5vLXNjcm9sbGJhciI+DQogICAgICAgIDxidXR0b24gb25jbGljaz0ic3dpdGNoSGlzdG9yeURvbWFpbigndHJhaW5pbmcnKSIgaWQ9Imhkb20tYnRuLXRyYWluaW5nIg0KICAgICAgICAgIGNsYXNzPSJoZG9tLWJ0biBweC0zLjUgcHktMS41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgYmctaW5kaWdvLTYwMCB0ZXh0LXdoaXRlIHNoYWRvdy1zbSB3aGl0ZXNwYWNlLW5vd3JhcCI+DQogICAgICAgICAg8J+PgyDXkNeZ157Xldeg15nXnQ0KICAgICAgICA8L2J1dHRv",
    "bj4NCiAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJzd2l0Y2hIaXN0b3J5RG9tYWluKCdmZWVkaW5nJykiIGlkPSJoZG9tLWJ0bi1mZWVkaW5nIg0KICAgICAgICAgIGNsYXNzPSJoZG9tLWJ0biBweC0zLjUgcHktMS41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LXNlbWlib2xkIGJnLXdoaXRlIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIHRleHQtc2xhdGUtNjAwIGhvdmVyOmJnLXNsYXRlLTUwIHdoaXRlc3BhY2Utbm93cmFwIj4NCiAgICAgICAgICDwn6a0INeU15DXm9ec15XXqg0KICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJzd2l0Y2hIaXN0b3J5RG9tYWluKCdhd2F5JykiIGlkPSJoZG9tLWJ0bi1hd2F5Ig0KICAgICAgICAgIGNsYXNzPSJoZG9tLWJ0biBweC0zLjUgcHktMS41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LXNlbWlib2xkIGJnLXdoaXRlIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIHRleHQtc2xhdGUtNjAwIGhvdmVyOmJnLXNsYXRlLTUwIHdoaXRlc3BhY2Utbm93cmFwIj4NCiAgICAgICAgICDwn4+hINeU15nXoteT16jXldeZ15XXqg0KICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJzd2l0Y2hIaXN0b3J5RG9tYWluKCd0YXNrcycpIiBpZD0iaGRvbS1idG4tdGFza3MiDQogICAgICAgICAgY2xhc3M9Imhkb20tYnRuIHB4LTMuNSBweS0xLjUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgYmctd2hpdGUgYm9yZGVyIGJvcmRl",
    "ci1zbGF0ZS0yMDAgdGV4dC1zbGF0ZS02MDAgaG92ZXI6Ymctc2xhdGUtNTAgd2hpdGVzcGFjZS1ub3dyYXAiPg0KICAgICAgICAgIPCfjpMg15HXmdem15XXoteZINee16nXmdee15XXqg0KICAgICAgICA8L2J1dHRvbj4NCiAgICAgIDwvZGl2Pg0KDQogICAgICA8IS0tIEhpc3RvcnkgVGFibGUgLyBDYXJkIENvbnRhaW5lciAtLT4NCiAgICAgIDxkaXYgY2xhc3M9ImJnLXdoaXRlIHJvdW5kZWQtMnhsIHNoYWRvdy1zbSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBvdmVyZmxvdy1oaWRkZW4iPg0KICAgICAgICA8ZGl2IGNsYXNzPSJwLTQgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTEwMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gYmctc2xhdGUtNTAvNTAiPg0KICAgICAgICAgIDxkaXYgY2xhc3M9InRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtNzAwIiBpZD0iaGlzdG9yeURvbWFpbkhlYWRlciI+DQogICAgICAgICAgICDXqNep15nXnteqINeQ15nXnteV16DXmdedINeQ15fXqNeV16DXmdedDQogICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS01MDAgZm9udC1tZWRpdW0iIGlkPSJoaXN0b3J5Q291bnRCYWRnZSI+MCDXqNep15XXnteV16o8L3NwYW4+DQogICAgICAgIDwvZGl2Pg0KDQogICAgICAgIDxkaXYgaWQ9Imhpc3RvcnlUYWJsZUNvbnRhaW5lciIgY2xhc3M9ImRpdmlkZS15IGRpdmlkZS1zbGF0ZS0xMDAgb3ZlcmZsb3cteC1hdXRv",
    "Ij4NCiAgICAgICAgICA8IS0tIER5bmFtaWNhbGx5IHBvcHVsYXRlZCBlbnRyaWVzIC0tPg0KICAgICAgICA8L2Rpdj4NCiAgICAgIDwvZGl2Pg0KICAgIDwvc2VjdGlvbj4NCg0KICA8L21haW4+DQoNCiAgPCEtLSBFZGl0IEl0ZW0gTW9kYWwgLS0+DQogIDxkaXYgaWQ9ImVkaXRNb2RhbCIgY2xhc3M9ImZpeGVkIGluc2V0LTAgei01MCBiZy1zbGF0ZS05MDAvNTAgYmFja2Ryb3AtYmx1ci1zbSBoaWRkZW4gaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNCI+DQogICAgPGRpdiBjbGFzcz0iYmctd2hpdGUgcm91bmRlZC0yeGwgc2hhZG93LTJ4bCBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBtYXgtdy1sZyB3LWZ1bGwgb3ZlcmZsb3ctaGlkZGVuIGFuaW1hdGUtZmFkZUluIj4NCiAgICAgIDxkaXYgY2xhc3M9InAtNCBiZy1zbGF0ZS01MCBib3JkZXItYiBib3JkZXItc2xhdGUtMjAwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiI+DQogICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIj4NCiAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC1sZyI+4pyP77iPPC9zcGFuPg0KICAgICAgICAgIDxoMyBpZD0iZWRpdE1vZGFsVGl0bGUiIGNsYXNzPSJmb250LWJvbGQgdGV4dC1zbGF0ZS04MDAgdGV4dC1zbSI+16LXqNeZ15vXqiDXqNep15XXnteUPC9oMz4NCiAgICAgICAgPC9kaXY+DQogICAgICAgIDxidXR0b24gb25jbGljaz0iY2xvc2VFZGl0TW9kYWwoKSIgY2xhc3M9InRl",
    "eHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtc2xhdGUtNjAwIHAtMSByb3VuZGVkLWxnIj4NCiAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT0ieCIgY2xhc3M9InctNSBoLTUiPjwvaT4NCiAgICAgICAgPC9idXR0b24+DQogICAgICA8L2Rpdj4NCg0KICAgICAgPGZvcm0gaWQ9ImZvcm1FZGl0UmVjb3JkIiBvbnN1Ym1pdD0iaGFuZGxlRWRpdE1vZGFsU3VibWl0KGV2ZW50KSIgY2xhc3M9InAtNSBzcGFjZS15LTQiPg0KICAgICAgICA8aW5wdXQgdHlwZT0iaGlkZGVuIiBpZD0iZWRpdFNoZWV0TmFtZSI+DQogICAgICAgIDxpbnB1dCB0eXBlPSJoaWRkZW4iIGlkPSJlZGl0Um93SW5kZXgiPg0KICAgICAgICANCiAgICAgICAgPGRpdiBpZD0iZWRpdEZpZWxkc0NvbnRhaW5lciIgY2xhc3M9InNwYWNlLXktMyI+DQogICAgICAgICAgPCEtLSBEeW5hbWljIEZvcm0gRmllbGRzIC0tPg0KICAgICAgICA8L2Rpdj4NCg0KICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGdhcC0yIHB0LTIiPg0KICAgICAgICAgIDxidXR0b24gdHlwZT0iYnV0dG9uIiBvbmNsaWNrPSJjbG9zZUVkaXRNb2RhbCgpIg0KICAgICAgICAgICAgY2xhc3M9ImZsZXgtMSBweS0yLjUgcHgtNCByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHRleHQtc2xhdGUtNzAwIGZvbnQtYm9sZCBob3ZlcjpiZy1zbGF0ZS01MCB0cmFuc2l0aW9uIj4NCiAgICAgICAgICAgINeR15nXmNeV15wNCiAgICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgICA8YnV0dG9u",
    "IHR5cGU9InN1Ym1pdCIgaWQ9ImJ0blNhdmVFZGl0Ig0KICAgICAgICAgICAgY2xhc3M9ImZsZXgtMSBweS0yLjUgcHgtNCByb3VuZGVkLXhsIGJnLWluZGlnby02MDAgaG92ZXI6YmctaW5kaWdvLTcwMCB0ZXh0LXdoaXRlIGZvbnQtYm9sZCBzaGFkb3ctbWQgdHJhbnNpdGlvbiI+DQogICAgICAgICAgICDXqdee15XXqCDXqdeZ16DXldeZ15nXnSDwn5K+DQogICAgICAgICAgPC9idXR0b24+DQogICAgICAgIDwvZGl2Pg0KICAgICAgPC9mb3JtPg0KICAgIDwvZGl2Pg0KICA8L2Rpdj4NCg0KICA8IS0tIERlbGV0ZSBDb25maXJtIERpYWxvZyBNb2RhbCAtLT4NCiAgPGRpdiBpZD0iZGVsZXRlTW9kYWwiIGNsYXNzPSJmaXhlZCBpbnNldC0wIHotNTAgYmctc2xhdGUtOTAwLzUwIGJhY2tkcm9wLWJsdXItc20gaGlkZGVuIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTQiPg0KICAgIDxkaXYgY2xhc3M9ImJnLXdoaXRlIHJvdW5kZWQtMnhsIHNoYWRvdy0yeGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgbWF4LXctc20gdy1mdWxsIHAtNSBzcGFjZS15LTQiPg0KICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMiPg0KICAgICAgICA8ZGl2IGNsYXNzPSJ3LTEwIGgtMTAgcm91bmRlZC1mdWxsIGJnLXJlZC0xMDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1yZWQtNjAwIj4NCiAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT0iYWxlcnQtdHJpYW5nbGUiIGNsYXNzPSJ3LTUg",
    "aC01Ij48L2k+DQogICAgICAgIDwvZGl2Pg0KICAgICAgICA8ZGl2Pg0KICAgICAgICAgIDxoNCBjbGFzcz0iZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIj7XkNeZ16nXldeoINee15fXmden15Q8L2g0Pg0KICAgICAgICAgIDxwIGNsYXNzPSJ0ZXh0LXhzIHRleHQtc2xhdGUtNTAwIj7XpNei15XXnNeUINeW15Ug16rXnteX16cg15DXqiDXlNep15XXqNeUINec16bXnteZ16rXldeqINee15TXkteZ15zXmdeV158uPC9wPg0KICAgICAgICA8L2Rpdj4NCiAgICAgIDwvZGl2Pg0KICAgICAgDQogICAgICA8cCBpZD0iZGVsZXRlTW9kYWxNZXNzYWdlIiBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTYwMCBiZy1zbGF0ZS01MCBwLTMgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTEwMCI+PC9wPg0KDQogICAgICA8ZGl2IGNsYXNzPSJmbGV4IGdhcC0yIj4NCiAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJjbG9zZURlbGV0ZU1vZGFsKCkiDQogICAgICAgICAgY2xhc3M9ImZsZXgtMSBweS0yIHB4LTMgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCB0ZXh0LXNsYXRlLTcwMCB0ZXh0LXhzIGZvbnQtYm9sZCBob3ZlcjpiZy1zbGF0ZS01MCI+DQogICAgICAgICAg15HXmdeY15XXnA0KICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgPGJ1dHRvbiBpZD0iYnRuQ29uZmlybURlbGV0ZSIgb25jbGljaz0iZXhlY3V0ZURlbGV0ZVJlY29yZCgpIg0KICAgICAgICAgIGNsYXNzPSJmbGV4LTEgcHktMiBweC0zIHJv",
    "dW5kZWQteGwgYmctcmVkLTYwMCBob3ZlcjpiZy1yZWQtNzAwIHRleHQtd2hpdGUgdGV4dC14cyBmb250LWJvbGQgc2hhZG93Ij4NCiAgICAgICAgICDXm9efLCDXnteX16cg8J+Xke+4jw0KICAgICAgICA8L2J1dHRvbj4NCiAgICAgIDwvZGl2Pg0KICAgIDwvZGl2Pg0KICA8L2Rpdj4NCg0KICA8IS0tIFFSIENvZGUgTW9kYWwgLS0+DQogIDxkaXYgaWQ9InFyTW9kYWwiIGNsYXNzPSJmaXhlZCBpbnNldC0wIHotNTAgYmctc2xhdGUtOTAwLzUwIGJhY2tkcm9wLWJsdXItc20gaGlkZGVuIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTQiPg0KICAgIDxkaXYgY2xhc3M9ImJnLXdoaXRlIHJvdW5kZWQtMnhsIHNoYWRvdy0yeGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgbWF4LXctc20gdy1mdWxsIHAtNiB0ZXh0LWNlbnRlciBzcGFjZS15LTQgYW5pbWF0ZS1mYWRlSW4iPg0KICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHBiLTIgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTEwMCI+DQogICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIj4NCiAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC14bCI+8J+QlTwvc3Bhbj4NCiAgICAgICAgICA8aDMgY2xhc3M9ImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTgwMCB0ZXh0LWJhc2UiPteU15nXldee158g16nXnCDXnteZ15nXpNecINeR16DXmdeZ15M8L2gzPg0KICAgICAgICA8L2Rpdj4NCiAgICAgICAgPGJ1",
    "dHRvbiBvbmNsaWNrPSJjbG9zZVFyTW9kYWwoKSIgY2xhc3M9InRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtc2xhdGUtNjAwIHAtMSByb3VuZGVkLWxnIj4NCiAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT0ieCIgY2xhc3M9InctNSBoLTUiPjwvaT4NCiAgICAgICAgPC9idXR0b24+DQogICAgICA8L2Rpdj4NCg0KICAgICAgPHAgY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS02MDAiPteh16jXldenINei150g157Xptec157XqiDXlNeY15zXpNeV158g15vXk9eZINec16TXqteV15cg15DXqiDXlNeQ16TXnNeZ16fXpteZ15Qg157XmdeTOjwvcD4NCg0KICAgICAgPGRpdiBjbGFzcz0icC0zIGJnLXdoaXRlIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIHJvdW5kZWQtMnhsIGlubGluZS1ibG9jayBzaGFkb3ctc20iPg0KICAgICAgICA8aW1nIGlkPSJxck1vZGFsSW1nIiBzcmM9IiIgYWx0PSJRUiBDb2RlIiBjbGFzcz0idy00OCBoLTQ4IG14LWF1dG8gcm91bmRlZC1sZyIgLz4NCiAgICAgIDwvZGl2Pg0KDQogICAgICA8ZGl2IGNsYXNzPSJzcGFjZS15LTIgcHQtMiI+DQogICAgICAgIDxidXR0b24gb25jbGljaz0iY29weUFwcFVybCgpIiBjbGFzcz0idy1mdWxsIHB5LTIuNSBweC00IGJnLWluZGlnby02MDAgaG92ZXI6YmctaW5kaWdvLTcwMCB0ZXh0LXdoaXRlIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMiBzaGFkb3ctc20iPg0K",
    "ICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPSJjb3B5IiBjbGFzcz0idy00IGgtNCI+PC9pPg0KICAgICAgICAgIDxzcGFuPteU16LXqtenINen15nXqdeV16gg15zXkNek15zXmden16bXmdeUPC9zcGFuPg0KICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgPHAgY2xhc3M9InRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIj7wn5KhINeY15nXpDog15HXoNeZ15nXkyDXnNeX16Ug16LXnCAi15TXldeh16Mg15zXnteh15og15TXkdeZ16oiINec15TXpNei15zXlCDXm9eQ16TXnNeZ16fXpteZ15Qg157XnNeQ15Q8L3A+DQogICAgICA8L2Rpdj4NCiAgICA8L2Rpdj4NCiAgPC9kaXY+DQoNCiAgPCEtLSBUb2FzdCBOb3RpZmljYXRpb24gQ29udGFpbmVyIC0tPg0KICA8ZGl2IGlkPSJ0b2FzdENvbnRhaW5lciIgY2xhc3M9ImZpeGVkIGJvdHRvbS0yMCBtZDpib3R0b20tNiBzdGFydC00IGVuZC00IG1kOnN0YXJ0LWF1dG8gbWQ6ZW5kLTYgei01MCBwb2ludGVyLWV2ZW50cy1ub25lIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIG1kOml0ZW1zLWVuZCBnYXAtMiI+PC9kaXY+DQoNCiAgPCEtLSBHbG9iYWwgTG9hZGluZyBTcGlubmVyIE92ZXJsYXkgLS0+DQogIDxkaXYgaWQ9ImxvYWRpbmdPdmVybGF5IiBjbGFzcz0iZml4ZWQgaW5zZXQtMCB6LTUwIGJnLXNsYXRlLTkwMC8zMCBiYWNrZHJvcC1ibHVyLVsycHhdIGhpZGRlbiBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIiPg0KICAgIDxkaXYgY2xhc3M9ImJnLXdoaXRlIHJv",
    "dW5kZWQtMnhsIHAtNCBzaGFkb3cteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0xMDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMiPg0KICAgICAgPHN2ZyBjbGFzcz0iYW5pbWF0ZS1zcGluIHctNSBoLTUgdGV4dC1pbmRpZ28tNjAwIiBmaWxsPSJub25lIiB2aWV3Qm94PSIwIDAgMjQgMjQiPg0KICAgICAgICA8Y2lyY2xlIGNsYXNzPSJvcGFjaXR5LTI1IiBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjQiPjwvY2lyY2xlPg0KICAgICAgICA8cGF0aCBjbGFzcz0ib3BhY2l0eS03NSIgZmlsbD0iY3VycmVudENvbG9yIiBkPSJNNCAxMmE4IDggMCAwMTgtOFYwQzUuMzczIDAgMCA1LjM3MyAwIDEyaDR6bTIgNS4yOTFBNy45NjIgNy45NjIgMCAwMTQgMTJIMGMwIDMuMDQyIDEuMTM1IDUuODI0IDMgNy45MzhsMy0yLjY0N3oiPjwvcGF0aD4NCiAgICAgIDwvc3ZnPg0KICAgICAgPHNwYW4gaWQ9ImxvYWRpbmdNZXNzYWdlIiBjbGFzcz0idGV4dC14cyBmb250LWJvbGQgdGV4dC1zbGF0ZS03MDAiPtep15XXnteoINeg16rXldeg15nXnS4uLjwvc3Bhbj4NCiAgICA8L2Rpdj4NCiAgPC9kaXY+DQoNCiAgPCEtLSBNb2JpbGUgU3RpY2t5IEJvdHRvbSBOYXZpZ2F0aW9uIEJhciAtLT4NCiAgPG5hdiBjbGFzcz0ibWQ6aGlkZGVuIGZpeGVkIGJvdHRvbS0wIGluc2V0LXgtMCBiZy13aGl0ZS85NSBiYWNrZHJvcC1ibHVyLW1kIGJvcmRlci10IGJvcmRlci1zbGF0ZS0yMDAgei00",
    "MCBweC0yIHB5LTEgZmxleCBqdXN0aWZ5LWFyb3VuZCI+DQogICAgPGJ1dHRvbiBvbmNsaWNrPSJzd2l0Y2hUYWIoJ3RyYWluaW5nJykiIGlkPSJtb2JpbGUtdGFiLXRyYWluaW5nIg0KICAgICAgY2xhc3M9Im5hdi10YWItYnRuIGZsZXgtMSBweS0xLjUgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgdGV4dC1pbmRpZ28tNjAwIGZvbnQtYm9sZCB0cmFuc2l0aW9uIj4NCiAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LWxnIj7wn4+DPC9zcGFuPg0KICAgICAgPHNwYW4gY2xhc3M9InRleHQtWzEwcHhdIG10LTAuNSI+15TXmdep15DXqNeV16o8L3NwYW4+DQogICAgPC9idXR0b24+DQogICAgPGJ1dHRvbiBvbmNsaWNrPSJzd2l0Y2hUYWIoJ2ZlZWRpbmcnKSIgaWQ9Im1vYmlsZS10YWItZmVlZGluZyINCiAgICAgIGNsYXNzPSJuYXYtdGFiLWJ0biBmbGV4LTEgcHktMS41IGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIHRleHQtc2xhdGUtNTAwIGZvbnQtbWVkaXVtIHRyYW5zaXRpb24iPg0KICAgICAgPHNwYW4gY2xhc3M9InRleHQtbGciPvCfprQ8L3NwYW4+DQogICAgICA8c3BhbiBjbGFzcz0idGV4dC1bMTBweF0gbXQtMC41Ij7XlNeQ15vXnNeV16o8L3NwYW4+DQogICAgPC9idXR0b24+DQogICAgPGJ1dHRvbiBvbmNsaWNrPSJzd2l0Y2hUYWIoJ3Rhc2tzJykiIGlkPSJtb2JpbGUtdGFiLXRhc2tzIg0KICAgICAgY2xhc3M9Im5hdi10YWItYnRuIGZsZXgtMSBweS0xLjUgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIg",
    "dGV4dC1zbGF0ZS01MDAgZm9udC1tZWRpdW0gdHJhbnNpdGlvbiI+DQogICAgICA8c3BhbiBjbGFzcz0idGV4dC1sZyI+8J+Okzwvc3Bhbj4NCiAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LVsxMHB4XSBtdC0wLjUiPtee16nXmdee15XXqjwvc3Bhbj4NCiAgICA8L2J1dHRvbj4NCiAgICA8YnV0dG9uIG9uY2xpY2s9InN3aXRjaFRhYignaGlzdG9yeScpIiBpZD0ibW9iaWxlLXRhYi1oaXN0b3J5Ig0KICAgICAgY2xhc3M9Im5hdi10YWItYnRuIGZsZXgtMSBweS0xLjUgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgdGV4dC1zbGF0ZS01MDAgZm9udC1tZWRpdW0gdHJhbnNpdGlvbiI+DQogICAgICA8c3BhbiBjbGFzcz0idGV4dC1sZyI+8J+Tijwvc3Bhbj4NCiAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LVsxMHB4XSBtdC0wLjUiPteU15nXodeY15XXqNeZ15Q8L3NwYW4+DQogICAgPC9idXR0b24+DQogIDwvbmF2Pg0KDQogIDwhLS0gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAtLT4NCiAgPCEtLSBDTElFTlQgQVBQTElDQVRJT04gSkFWQVNDUklQVCBMT0dJQyAtLT4NCiAgPCEtLSA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09IC0tPg0KICA8c2NyaXB0Pg0KICAgIC8vIEluamVjdGVkIGJvb3RzdHJhcHBlZCBkYXRhIGZyb20gR0FTIGJhY2tlbmQsIG9y",
    "IGxvY2FsIG1vY2sgZmFsbGJhY2sNCiAgICB2YXIgQk9PVFNUUkFQX0RBVEEgPSBudWxsOw0KICAgIHRyeSB7DQogICAgICBCT09UU1RSQVBfREFUQSA9IDw/IT0gSlNPTi5zdHJpbmdpZnkoaW5pdGlhbERhdGEpID8+Ow0KICAgIH0gY2F0Y2ggKGUpIHsNCiAgICAgIC8vIExvY2FsIGRldmVsb3BtZW50IG9yIHByZXZpZXcgZmFsbGJhY2sNCiAgICAgIEJPT1RTVFJBUF9EQVRBID0gbnVsbDsNCiAgICB9DQoNCiAgICAvLyBEZWZhdWx0IG1vY2sgZGF0YXNldCBpZiBub3QgcnVubmluZyB3aXRoaW4gbGl2ZSBBcHBzIFNjcmlwdCB0ZW1wbGF0ZQ0KICAgIGlmICghQk9PVFNUUkFQX0RBVEEgfHwgQk9PVFNUUkFQX0RBVEEuZXJyb3IpIHsNCiAgICAgIEJPT1RTVFJBUF9EQVRBID0gew0KICAgICAgICB0cmFpbmluZzogWw0KICAgICAgICAgIHsgcm93SW5kZXg6IDIsIGRhdGU6ICcyMDI2LTExLTAxJywgdGltZTogJzEwOjAwJywgZHVyYXRpb246IDEuNSwgc3RyZXNzTGV2ZWw6IDEsIG5vdGVzOiAn16DXqdeQ16jXlCDXqNeS15XXoteUINeR157XmdeY15QnIH0sDQogICAgICAgICAgeyByb3dJbmRleDogMywgZGF0ZTogJzIwMjYtMTEtMDMnLCB0aW1lOiAnMTQ6MzAnLCBkdXJhdGlvbjogMi4yNSwgc3RyZXNzTGV2ZWw6IDIsIG5vdGVzOiAn15DXmS3Xqden15gg16fXnCDXkdeU16rXl9ec15QnIH0sDQogICAgICAgICAgeyByb3dJbmRleDogNCwgZGF0ZTogJzIwMjYtMTEtMDUnLCB0aW1lOiAnMDk6MTUnLCBkdXJhdGlvbjog",
    "My4wLCBzdHJlc3NMZXZlbDogMywgbm90ZXM6ICfXoNeR15fXlCDXp9ec15XXqiDXldeX15bXqNeUINec16DXldeXJyB9LA0KICAgICAgICAgIHsgcm93SW5kZXg6IDUsIGRhdGU6ICcyMDI2LTExLTA4JywgdGltZTogJzEyOjAwJywgZHVyYXRpb246IDQuNSwgc3RyZXNzTGV2ZWw6IDQsIG5vdGVzOiAn157XpteV16fXlCDXkdei16fXkdeV16og16jXotepINeR15fXldelJyB9LA0KICAgICAgICAgIHsgcm93SW5kZXg6IDYsIGRhdGU6ICcyMDI2LTExLTEwJywgdGltZTogJzExOjAwJywgZHVyYXRpb246IDMuNSwgc3RyZXNzTGV2ZWw6IDIsIG5vdGVzOiAn15DXmdee15XXnyDXntei15XXnNeUJyB9DQogICAgICAgIF0sDQogICAgICAgIGF3YXlMb2c6IFsNCiAgICAgICAgICB7IHJvd0luZGV4OiAyLCBzdGFydERhdGU6ICcyMDI2LTEwLTE1JywgZW5kRGF0ZTogJzIwMjYtMTAtMjInLCBsb2NhdGlvbjogJ9eQ16bXnCDXmdeQ15nXqCDXkdee16nXpyDwn5qcJywgZGF5c0NvdW50OiA3LCBub3RlczogJ9eU16HXqteT16jXlCDXntem15XXmdefJyB9LA0KICAgICAgICAgIHsgcm93SW5kZXg6IDMsIHN0YXJ0RGF0ZTogJzIwMjYtMTEtMTInLCBlbmREYXRlOiAnMjAyNi0xMS0xNicsIGxvY2F0aW9uOiAn15DXptecINeg15nXp9eV15wg15HXlNeo16bXnNeZ15Qg8J+Plu+4jycsIGRheXNDb3VudDogNCwgbm90ZXM6ICfXl9eV16TXqdeUJyB9DQogICAgICAgIF0sDQogICAgICAgIGZlZWRpbmc6IFsNCiAgICAgICAgICB7IHJv",
    "d0luZGV4OiAyLCBkYXRlOiAnMjAyNi0xMS0wOScsIHRpbWU6ICcwODowMCcsIHR5cGU6ICfXkdeV16fXqCcsIGFtb3VudDogMS4wLCBmaW5pc2hlZDogJ9eb158nLCBub3RlczogJycgfSwNCiAgICAgICAgICB7IHJvd0luZGV4OiAzLCBkYXRlOiAnMjAyNi0xMS0wOScsIHRpbWU6ICcxOTowMCcsIHR5cGU6ICfXoteo15EnLCBhbW91bnQ6IDEuMCwgZmluaXNoZWQ6ICfXm9efJywgbm90ZXM6ICcnIH0sDQogICAgICAgICAgeyByb3dJbmRleDogNCwgZGF0ZTogJzIwMjYtMTEtMTAnLCB0aW1lOiAnMDg6MTUnLCB0eXBlOiAn15HXlden16gnLCBhbW91bnQ6IDEuMjUsIGZpbmlzaGVkOiAn15vXnycsIG5vdGVzOiAn16LXnSDXqteV16HXoycgfSwNCiAgICAgICAgICB7IHJvd0luZGV4OiA1LCBkYXRlOiAnMjAyNi0xMS0xMCcsIHRpbWU6ICcxOTozMCcsIHR5cGU6ICfXoteo15EnLCBhbW91bnQ6IDEuMCwgZmluaXNoZWQ6ICfXnNeQJywgbm90ZXM6ICfXlNep15DXmdeo15Qg16jXkdeiINeb15XXoScgfQ0KICAgICAgICBdLA0KICAgICAgICB0YXNrczogWw0KICAgICAgICAgIHsgcm93SW5kZXg6IDIsIHRhc2tOYW1lOiAn15TXmdep15DXqNeV16og15HXnteZ15jXlCcsIGZyZXF1ZW5jeTogJ9ek16LXnteZ15nXnSDXkdeZ15XXnScsIGRlc2NyaXB0aW9uOiAn16nXl9eo15XXqCDXqNenINeR16TXp9eV15PXlCwg157XqNeX16cgMyDXnteY16gnLCBzdGF0dXM6ICdBY3RpdmUnIH0sDQogICAgICAgICAgeyByb3dJbmRleDog",
    "MywgdGFza05hbWU6ICfXlNec15nXm9eUINeo15LXldei15Qg15HXqNem15XXoteUJywgZnJlcXVlbmN5OiAn15HXm9ecINeY15nXldecJywgZGVzY3JpcHRpb246ICfXotem15nXqNeUINeb16nXmdepINee16nXmdeb15QnLCBzdGF0dXM6ICdBY3RpdmUnIH0sDQogICAgICAgICAgeyByb3dJbmRleDogNCwgdGFza05hbWU6ICfXnteS16Ig15HXm9ek15XXqiDXqNeS15zXmdeZ150nLCBmcmVxdWVuY3k6ICfXpNei150g15HXmdeV150nLCBkZXNjcmlwdGlvbjogJ9eX15nXlteV16fXmdedINeX15nXldeR15nXmdedINei150g15fXmNeZ16MnLCBzdGF0dXM6ICdBY3RpdmUnIH0NCiAgICAgICAgXSwNCiAgICAgICAgdGFza0xvZ3M6IFsNCiAgICAgICAgICB7IHJvd0luZGV4OiAyLCBkYXRlOiAnMjAyNi0xMS0wOCcsIHRhc2tOYW1lOiAn15TXmdep15DXqNeV16og15HXnteZ15jXlCcsIHN1Y2Nlc3M6IDQsIG5vdGVzOiAn16DXqdeQ16jXlCA1INeT16fXldeqINep15zXnteV16onIH0sDQogICAgICAgICAgeyByb3dJbmRleDogMywgZGF0ZTogJzIwMjYtMTEtMDknLCB0YXNrTmFtZTogJ9eU15zXmdeb15Qg16jXkteV16LXlCDXkdeo16bXldei15QnLCBzdWNjZXNzOiAzLCBub3RlczogJ9en16bXqiDXntep15vXlCDXnNeZ15Mg15fXqteV15wnIH0sDQogICAgICAgICAgeyByb3dJbmRleDogNCwgZGF0ZTogJzIwMjYtMTEtMTAnLCB0YXNrTmFtZTogJ9eU15nXqdeQ16jXldeqINeR157XmdeY15QnLCBzdWNjZXNzOiA1LCBu",
    "b3RlczogJ9ee15XXqdec150g15zXnNeQINep15XXnSDXqteW15XXlteUJyB9DQogICAgICAgIF0sDQogICAgICAgIGRlZmF1bHREdXJhdGlvbjogMi4yNQ0KICAgICAgfTsNCiAgICB9DQoNCiAgICAvLyBBcHBsaWNhdGlvbiBTdGF0ZQ0KICAgIHZhciBzdGF0ZSA9IHsNCiAgICAgIGFjdGl2ZVRhYjogJ3RyYWluaW5nJywNCiAgICAgIGhpc3RvcnlEb21haW46ICd0cmFpbmluZycsDQogICAgICBjaGFydFJhbmdlRGF5czogNjAsDQogICAgICBkYXRhOiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KEJPT1RTVFJBUF9EQVRBKSksDQogICAgICBjaGFydHM6IHsNCiAgICAgICAgdHJhaW5pbmc6IG51bGwsDQogICAgICAgIGZlZWRpbmc6IG51bGwsDQogICAgICAgIHRhc2tzOiBudWxsDQogICAgICB9LA0KICAgICAgZGVsZXRlUGVuZGluZzogbnVsbA0KICAgIH07DQoNCiAgICAvLyBMb2NhdGlvbiBjb2xvcnMgc3BlY2lmaWNhdGlvbg0KICAgIHZhciBMT0NBVElPTl9DT0xPUlMgPSB7DQogICAgICAi15DXptecINeZ15DXmdeoINeR157XqdenIPCfmpwiOiB7IGNvbG9yOiAiIzhFMjRBQSIsIHJnYmE6ICJyZ2JhKDE0MiwgMzYsIDE3MCwgMC4yMikiIH0sDQogICAgICAi15DXptecINeQ15HXkCDXkdee16nXpyDwn5qcIjogeyBjb2xvcjogIiM4RTI0QUEiLCByZ2JhOiAicmdiYSgxNDIsIDM2LCAxNzAsIDAuMjIpIiB9LA0KICAgICAgIteQ16bXnCDXoNeZ16fXldecINeR15TXqNem15zXmdeUIPCfj5bvuI8iOiB7IGNvbG9y",
    "OiAiIzAwODk3QiIsIHJnYmE6ICJyZ2JhKDAsIDEzNywgMTIzLCAwLjIyKSIgfSwNCiAgICAgICLXkNem15wg15jXqNeZ15nXodeZINeR157XoNeV16Mg8J+PoSI6IHsgY29sb3I6ICIjMDU5NjY5IiwgcmdiYTogInJnYmEoNSwgMTUwLCAxMDUsIDAuMjIpIiB9LA0KICAgICAgIteQ16bXnCDXmNeo15nXmdeh15kg15HXnteg15XXoyI6IHsgY29sb3I6ICIjMDU5NjY5IiwgcmdiYTogInJnYmEoNSwgMTUwLCAxMDUsIDAuMjIpIiB9LA0KICAgICAgIteQ16bXnCDXl9eR16jXmdedINeR16rXnCDXkNeR15nXkSDwn4+Z77iPIjogeyBjb2xvcjogIiMxRTg4RTUiLCByZ2JhOiAicmdiYSgzMCwgMTM2LCAyMjksIDAuMjIpIiB9LA0KICAgICAgIteR15HXmdeqINeb16nXnteZ16nXlNeVINep15XXnteoINei15zXmdeUIPCfj6AiOiB7IGNvbG9yOiAiI0ZCOEMwMCIsIHJnYmE6ICJyZ2JhKDI1MSwgMTQwLCAwLCAwLjIyKSIgfSwNCiAgICAgICLXpNeg16HXmdeV158g8J+QviI6IHsgY29sb3I6ICIjRDgxQjYwIiwgcmdiYTogInJnYmEoMjE2LCAyNywgOTYsIDAuMjIpIiB9LA0KICAgICAgIteQ15fXqCDinKgiOiB7IGNvbG9yOiAiIzVFMzVCMSIsIHJnYmE6ICJyZ2JhKDk0LCA1MywgMTc3LCAwLjIyKSIgfQ0KICAgIH07DQoNCiAgICAvLyBTdHJlc3MgZGVzY3JpcHRpdmUgdGV4dCBtYXANCiAgICB2YXIgU1RSRVNTX01BUCA9IHsNCiAgICAgIDE6IHsgbGFiZWw6ICIxIC0g16jXkteV16LXlCDXnNeX15zXldeY15nXnyDwn5+iIiwg",
    "Y29sb3I6ICIjMjJjNTVlIiwgYmc6ICJiZy1lbWVyYWxkLTUwIiwgdGV4dDogInRleHQtZW1lcmFsZC03MDAiIH0sDQogICAgICAyOiB7IGxhYmVsOiAiMiAtINeQ15kt16nXp9eYINen15wg8J+foSIsIGNvbG9yOiAiI2VhYjMwOCIsIGJnOiAiYmcteWVsbG93LTUwIiwgdGV4dDogInRleHQteWVsbG93LTcwMCIgfSwNCiAgICAgIDM6IHsgbGFiZWw6ICIzIC0g15zXl9elINeR15nXoNeV16DXmSDwn5+gIiwgY29sb3I6ICIjZjk3MzE2IiwgYmc6ICJiZy1vcmFuZ2UtNTAiLCB0ZXh0OiAidGV4dC1vcmFuZ2UtNzAwIiB9LA0KICAgICAgNDogeyBsYWJlbDogIjQgLSDXntem15XXp9eUINeS15HXldeU15Qg8J+UtCIsIGNvbG9yOiAiI2VmNDQ0NCIsIGJnOiAiYmctcmVkLTUwIiwgdGV4dDogInRleHQtcmVkLTcwMCIgfSwNCiAgICAgIDU6IHsgbGFiZWw6ICI1IC0g16TXkNeg15nXp9eUIPCfmqgiLCBjb2xvcjogIiNiOTFjMWMiLCBiZzogImJnLXJvc2UtNTAiLCB0ZXh0OiAidGV4dC1yb3NlLTcwMCIgfQ0KICAgIH07DQoNCiAgICAvKioNCiAgICAgKiBQcm9taXNlIHdyYXBwZXIgYXJvdW5kIGdvb2dsZS5zY3JpcHQucnVuDQogICAgICovDQogICAgZnVuY3Rpb24gY2FsbFNlcnZlcihtZXRob2QsIC4uLmFyZ3MpIHsNCiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHsNCiAgICAgICAgaWYgKHR5cGVvZiBnb29nbGUgIT09ICd1bmRlZmluZWQnICYmIGdvb2dsZS5zY3JpcHQgJiYg",
    "Z29vZ2xlLnNjcmlwdC5ydW4pIHsNCiAgICAgICAgICBnb29nbGUuc2NyaXB0LnJ1bg0KICAgICAgICAgICAgLndpdGhTdWNjZXNzSGFuZGxlcihyZXNvbHZlKQ0KICAgICAgICAgICAgLndpdGhGYWlsdXJlSGFuZGxlcihmdW5jdGlvbihlcnIpIHsNCiAgICAgICAgICAgICAgcmVqZWN0KGVycik7DQogICAgICAgICAgICB9KVttZXRob2RdKC4uLmFyZ3MpOw0KICAgICAgICB9IGVsc2Ugew0KICAgICAgICAgIC8vIExvY2FsIG1vY2sgaGFuZGxlcg0KICAgICAgICAgIGNvbnNvbGUud2FybignTG9jYWwgbW9jayBleGVjdXRpbmc6JywgbWV0aG9kLCBhcmdzKTsNCiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgew0KICAgICAgICAgICAgdmFyIG1vY2tSZXMgPSBzaW11bGF0ZUxvY2FsU2VydmVyKG1ldGhvZCwgYXJncyk7DQogICAgICAgICAgICByZXNvbHZlKG1vY2tSZXMpOw0KICAgICAgICAgIH0sIDM1MCk7DQogICAgICAgIH0NCiAgICAgIH0pOw0KICAgIH0NCg0KICAgIC8qKg0KICAgICAqIExvY2FsIG1vY2sgc2ltdWxhdGlvbiBmb3IgdGVzdGluZyBvdXRzaWRlIEdvb2dsZSBBcHBzIFNjcmlwdCBlbnZpcm9ubWVudA0KICAgICAqLw0KICAgIGZ1bmN0aW9uIHNpbXVsYXRlTG9jYWxTZXJ2ZXIobWV0aG9kLCBhcmdzKSB7DQogICAgICBpZiAobWV0aG9kID09PSAnZ2V0SW5pdGlhbERhdGEnKSB7DQogICAgICAgIHJldHVybiBzdGF0ZS5kYXRhOw0KICAgICAgfQ0KICAgICAgaWYgKG1ldGhvZCA9PT0gJ2Fk",
    "ZFRyYWluaW5nU2Vzc2lvbicpIHsNCiAgICAgICAgdmFyIHJlYyA9IGFyZ3NbMF07DQogICAgICAgIHZhciBuZXdJZHggPSBzdGF0ZS5kYXRhLnRyYWluaW5nLmxlbmd0aCArIDI7DQogICAgICAgIHZhciBuZXdSb3cgPSB7DQogICAgICAgICAgcm93SW5kZXg6IG5ld0lkeCwNCiAgICAgICAgICBkYXRlOiByZWMuZGF0ZSwNCiAgICAgICAgICB0aW1lOiByZWMudGltZSwNCiAgICAgICAgICBkdXJhdGlvbjogTnVtYmVyKHJlYy5kdXJhdGlvbiksDQogICAgICAgICAgc3RyZXNzTGV2ZWw6IE51bWJlcihyZWMuc3RyZXNzTGV2ZWwpLA0KICAgICAgICAgIG5vdGVzOiByZWMubm90ZXMgfHwgJycNCiAgICAgICAgfTsNCiAgICAgICAgc3RhdGUuZGF0YS50cmFpbmluZy5wdXNoKG5ld1Jvdyk7DQogICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICfXlNeQ15nXnteV158g16DXqdee16gg15HXlNem15zXl9eUISAoJyArIHJlYy50aW1lICsgJywgJyArIHJlYy5kdXJhdGlvbiArICcg16nXoteV16opJywgcmVjb3JkOiBuZXdSb3cgfTsNCiAgICAgIH0NCiAgICAgIGlmIChtZXRob2QgPT09ICdhZGRBd2F5TG9nJykgew0KICAgICAgICB2YXIgcmVjID0gYXJnc1swXTsNCiAgICAgICAgdmFyIGQxID0gbmV3IERhdGUocmVjLnN0YXJ0RGF0ZSk7DQogICAgICAgIHZhciBkMiA9IG5ldyBEYXRlKHJlYy5lbmREYXRlKTsNCiAgICAgICAgdmFyIGRheXMgPSBNYXRoLnJvdW5kKChkMiAtIGQxKSAvICgxMDAwICog",
    "NjAgKiA2MCAqIDI0KSk7DQogICAgICAgIHZhciBuZXdSb3cgPSB7DQogICAgICAgICAgcm93SW5kZXg6IHN0YXRlLmRhdGEuYXdheUxvZy5sZW5ndGggKyAyLA0KICAgICAgICAgIHN0YXJ0RGF0ZTogcmVjLnN0YXJ0RGF0ZSwNCiAgICAgICAgICBlbmREYXRlOiByZWMuZW5kRGF0ZSwNCiAgICAgICAgICBsb2NhdGlvbjogcmVjLmxvY2F0aW9uLA0KICAgICAgICAgIGRheXNDb3VudDogZGF5cywNCiAgICAgICAgICBub3RlczogcmVjLm5vdGVzIHx8ICcnDQogICAgICAgIH07DQogICAgICAgIHN0YXRlLmRhdGEuYXdheUxvZy5wdXNoKG5ld1Jvdyk7DQogICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRheXNDb3VudDogZGF5cywgbWVzc2FnZTogJ9eq16fXldek16og15TXlNeZ16LXk9eo15XXqiAoJyArIGRheXMgKyAnINeZ157XmdedKSDXoNep157XqNeUINeR15TXptec15fXlCEnLCByZWNvcmQ6IG5ld1JvdyB9Ow0KICAgICAgfQ0KICAgICAgaWYgKG1ldGhvZCA9PT0gJ2FkZEZlZWRpbmcnKSB7DQogICAgICAgIHZhciByZWMgPSBhcmdzWzBdOw0KICAgICAgICB2YXIgbmV3Um93ID0gew0KICAgICAgICAgIHJvd0luZGV4OiBzdGF0ZS5kYXRhLmZlZWRpbmcubGVuZ3RoICsgMiwNCiAgICAgICAgICBkYXRlOiByZWMuZGF0ZSwNCiAgICAgICAgICB0aW1lOiByZWMudGltZSwNCiAgICAgICAgICB0eXBlOiByZWMudHlwZSwNCiAgICAgICAgICBhbW91bnQ6IE51bWJlcihyZWMuYW1vdW50KSwNCiAgICAgICAg",
    "ICBmaW5pc2hlZDogcmVjLmZpbmlzaGVkID8gJ9eb158nIDogJ9ec15AnLA0KICAgICAgICAgIG5vdGVzOiByZWMubm90ZXMgfHwgJycNCiAgICAgICAgfTsNCiAgICAgICAgc3RhdGUuZGF0YS5mZWVkaW5nLnB1c2gobmV3Um93KTsNCiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogJ9eU15DXqNeV15fXlCDXoNep157XqNeUIScsIHJlY29yZDogbmV3Um93IH07DQogICAgICB9DQogICAgICBpZiAobWV0aG9kID09PSAnYWRkVGFzaycpIHsNCiAgICAgICAgdmFyIHJlYyA9IGFyZ3NbMF07DQogICAgICAgIHZhciBuZXdSb3cgPSB7DQogICAgICAgICAgcm93SW5kZXg6IHN0YXRlLmRhdGEudGFza3MubGVuZ3RoICsgMiwNCiAgICAgICAgICB0YXNrTmFtZTogcmVjLnRhc2tOYW1lLA0KICAgICAgICAgIGZyZXF1ZW5jeTogcmVjLmZyZXF1ZW5jeSwNCiAgICAgICAgICBkZXNjcmlwdGlvbjogcmVjLmRlc2NyaXB0aW9uLA0KICAgICAgICAgIHN0YXR1czogJ0FjdGl2ZScNCiAgICAgICAgfTsNCiAgICAgICAgc3RhdGUuZGF0YS50YXNrcy5wdXNoKG5ld1Jvdyk7DQogICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICfXlNeq16jXkteZ15wg16DXldeh16Mg15zXqNep15nXnteUIScsIHJlY29yZDogbmV3Um93IH07DQogICAgICB9DQogICAgICBpZiAobWV0aG9kID09PSAnbG9nVGFza0V4ZWN1dGlvbicpIHsNCiAgICAgICAgdmFyIHJlYyA9IGFyZ3NbMF07DQogICAgICAgIHZh",
    "ciBuZXdSb3cgPSB7DQogICAgICAgICAgcm93SW5kZXg6IHN0YXRlLmRhdGEudGFza0xvZ3MubGVuZ3RoICsgMiwNCiAgICAgICAgICBkYXRlOiByZWMuZGF0ZSwNCiAgICAgICAgICB0YXNrTmFtZTogcmVjLnRhc2tOYW1lLA0KICAgICAgICAgIHN1Y2Nlc3M6IE51bWJlcihyZWMuc3VjY2VzcyksDQogICAgICAgICAgbm90ZXM6IHJlYy5ub3RlcyB8fCAnJw0KICAgICAgICB9Ow0KICAgICAgICBzdGF0ZS5kYXRhLnRhc2tMb2dzLnB1c2gobmV3Um93KTsNCiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogJ9eU15HXmdem15XXoiDXqteV16LXkyDXkdeU16bXnNeX15QhJywgcmVjb3JkOiBuZXdSb3cgfTsNCiAgICAgIH0NCiAgICAgIGlmIChtZXRob2QgPT09ICd1cGRhdGVSb3cnKSB7DQogICAgICAgIHZhciBzaGVldE5hbWUgPSBhcmdzWzBdOw0KICAgICAgICB2YXIgcm93SWR4ID0gYXJnc1sxXTsNCiAgICAgICAgdmFyIHJvd0RhdGEgPSBhcmdzWzJdOw0KICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAn16nXldeo15QgJyArIHJvd0lkeCArICcg16LXldeT15vXoNeUIScgfTsNCiAgICAgIH0NCiAgICAgIGlmIChtZXRob2QgPT09ICdkZWxldGVSb3cnKSB7DQogICAgICAgIHZhciBzaGVldE5hbWUgPSBhcmdzWzBdOw0KICAgICAgICB2YXIgcm93SWR4ID0gYXJnc1sxXTsNCiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogJ9ep15XXqNeUICcg",
    "KyByb3dJZHggKyAnINeg157Xl9en15QhJyB9Ow0KICAgICAgfQ0KICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9Ow0KICAgIH0NCg0KICAgIC8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCiAgICAgKiBJTklUSUFMSVpBVElPTiAmIExJRkVDWUNMRQ0KICAgICAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8NCiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24oKSB7DQogICAgICB0cnkgew0KICAgICAgICBpZiAodHlwZW9mIGx1Y2lkZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbHVjaWRlLmNyZWF0ZUljb25zKSB7DQogICAgICAgICAgbHVjaWRlLmNyZWF0ZUljb25zKCk7DQogICAgICAgIH0NCiAgICAgIH0gY2F0Y2ggKGVMdWNpZGUpIHsNCiAgICAgICAgY29uc29sZS53YXJuKCdMdWNpZGUgaWNvbnMgd2FybmluZzonLCBlTHVjaWRlKTsNCiAgICAgIH0NCiAgICAgIGluaXREYXRlSW5wdXRzKCk7DQogICAgICBpbml0RGVmYXVsdER1cmF0aW9ucygpOw0KICAgICAgcG9wdWxhdGVBY3RpdmVUYXNrc0Ryb3Bkb3duKCk7DQogICAgICB0cnkgeyByZW5kZXJUcmFpbmluZ0NoYXJ0KCk7IH0gY2F0Y2ggKGUpIHsgY29uc29sZS5lcnJvcignVHJhaW5pbmcgY2hhcnQgZXJyb3I6JywgZSk7",
    "IH0NCiAgICAgIHRyeSB7IHJlbmRlckZlZWRpbmdDaGFydCgpOyB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoJ0ZlZWRpbmcgY2hhcnQgZXJyb3I6JywgZSk7IH0NCiAgICAgIHRyeSB7IHJlbmRlclRhc2tzQ2hhcnQoKTsgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKCdUYXNrcyBjaGFydCBlcnJvcjonLCBlKTsgfQ0KICAgICAgdHJ5IHsgcmVuZGVySGlzdG9yeUxpc3QoKTsgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKCdIaXN0b3J5IGxpc3QgZXJyb3I6JywgZSk7IH0NCiAgICB9KTsNCg0KICAgIC8qKg0KICAgICAqIEluaXRpYWxpemUgZGF0ZSAmIHRpbWUgZm9ybSBwaWNrZXJzIHdpdGggY3VycmVudCBJc3JhZWwgU3RhbmRhcmQgVGltZQ0KICAgICAqLw0KICAgIGZ1bmN0aW9uIGluaXREYXRlSW5wdXRzKCkgew0KICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7DQogICAgICAvLyBGb3JtYXQgWVlZWS1NTS1ERA0KICAgICAgdmFyIHllYXIgPSBub3cuZ2V0RnVsbFllYXIoKTsNCiAgICAgIHZhciBtb250aCA9ICgnMCcgKyAobm93LmdldE1vbnRoKCkgKyAxKSkuc2xpY2UoLTIpOw0KICAgICAgdmFyIGRheSA9ICgnMCcgKyBub3cuZ2V0RGF0ZSgpKS5zbGljZSgtMik7DQogICAgICB2YXIgdG9kYXlTdHIgPSB5ZWFyICsgJy0nICsgbW9udGggKyAnLScgKyBkYXk7DQoNCiAgICAgIC8vIEZvcm1hdCBISDpNTQ0KICAgICAgdmFyIGhvdXJzID0gKCcwJyArIG5vdy5nZXRIb3VycygpKS5zbGljZSgtMik7",
    "DQogICAgICB2YXIgbWludXRlcyA9ICgnMCcgKyBub3cuZ2V0TWludXRlcygpKS5zbGljZSgtMik7DQogICAgICB2YXIgdGltZVN0ciA9IGhvdXJzICsgJzonICsgbWludXRlczsNCg0KICAgICAgLy8gUGx1cyAxNCBkYXlzIGZvciBkZWZhdWx0IGF3YXkgZW5kIGRhdGUNCiAgICAgIHZhciBmdXR1cmUgPSBuZXcgRGF0ZShub3cuZ2V0VGltZSgpICsgMTQgKiAyNCAqIDYwICogNjAgKiAxMDAwKTsNCiAgICAgIHZhciBmWWVhciA9IGZ1dHVyZS5nZXRGdWxsWWVhcigpOw0KICAgICAgdmFyIGZNb250aCA9ICgnMCcgKyAoZnV0dXJlLmdldE1vbnRoKCkgKyAxKSkuc2xpY2UoLTIpOw0KICAgICAgdmFyIGZEYXkgPSAoJzAnICsgZnV0dXJlLmdldERhdGUoKSkuc2xpY2UoLTIpOw0KICAgICAgdmFyIGZ1dHVyZVN0ciA9IGZZZWFyICsgJy0nICsgZk1vbnRoICsgJy0nICsgZkRheTsNCg0KICAgICAgLy8gU2V0IGlucHV0IHZhbHVlcw0KICAgICAgdmFyIGVsVHJhaW5EYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RyYWluRGF0ZScpOw0KICAgICAgdmFyIGVsVHJhaW5UaW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RyYWluVGltZScpOw0KICAgICAgaWYgKGVsVHJhaW5EYXRlKSBlbFRyYWluRGF0ZS52YWx1ZSA9IHRvZGF5U3RyOw0KICAgICAgaWYgKGVsVHJhaW5UaW1lKSBlbFRyYWluVGltZS52YWx1ZSA9IHRpbWVTdHI7DQoNCiAgICAgIHZhciBlbEF3YXlTdGFydCA9IGRvY3VtZW50LmdldEVsZW1lbnRC",
    "eUlkKCdhd2F5U3RhcnQnKTsNCiAgICAgIHZhciBlbEF3YXlFbmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXdheUVuZCcpOw0KICAgICAgaWYgKGVsQXdheVN0YXJ0KSBlbEF3YXlTdGFydC52YWx1ZSA9IHRvZGF5U3RyOw0KICAgICAgaWYgKGVsQXdheUVuZCkgZWxBd2F5RW5kLnZhbHVlID0gZnV0dXJlU3RyOw0KDQogICAgICB2YXIgZWxGZWVkRGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZWVkRGF0ZScpOw0KICAgICAgdmFyIGVsRmVlZFRpbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmVlZFRpbWUnKTsNCiAgICAgIGlmIChlbEZlZWREYXRlKSBlbEZlZWREYXRlLnZhbHVlID0gdG9kYXlTdHI7DQogICAgICBpZiAoZWxGZWVkVGltZSkgZWxGZWVkVGltZS52YWx1ZSA9IHRpbWVTdHI7DQoNCiAgICAgIHZhciBlbFRhc2tEYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Rhc2tFeGVjRGF0ZScpOw0KICAgICAgaWYgKGVsVGFza0RhdGUpIGVsVGFza0RhdGUudmFsdWUgPSB0b2RheVN0cjsNCg0KICAgICAgdXBkYXRlVHJhaW5DYWxjQmFubmVyKCk7DQogICAgICBjYWxjQXdheURheXMoKTsNCiAgICB9DQoNCiAgICAvKioNCiAgICAgKiBJbml0aWFsaXplcyBkZWZhdWx0IHRyYWluaW5nIGR1cmF0aW9uIGR5bmFtaWNhbGx5DQogICAgICovDQogICAgZnVuY3Rpb24gaW5pdERlZmF1bHREdXJhdGlvbnMoKSB7DQogICAgICB2YXIgZHVyID0gc3RhdGUuZGF0YS5kZWZhdWx0RHVyYXRp",
    "b24gfHwgMi41Ow0KICAgICAgc3luY1RyYWluRHVyYXRpb24oZHVyLCAnYm90aCcpOw0KICAgIH0NCg0KICAgIC8qKg0KICAgICAqIFBvcHVsYXRlcyB0aGUgYWN0aXZlIHRhc2tzIGRyb3Bkb3duIGluIHRoZSBUYXNrIEV4ZWN1dGlvbiBmb3JtDQogICAgICovDQogICAgZnVuY3Rpb24gcG9wdWxhdGVBY3RpdmVUYXNrc0Ryb3Bkb3duKCkgew0KICAgICAgdmFyIHNlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWxUYXNrTmFtZScpOw0KICAgICAgdmFyIG5vVGFza3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm9UYXNrc0FsZXJ0Jyk7DQogICAgICB2YXIgZmllbGRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZ1Rhc2tGaWVsZHMnKTsNCiAgICAgIGlmICghc2VsKSByZXR1cm47DQoNCiAgICAgIHZhciBhY3RpdmVUYXNrcyA9IChzdGF0ZS5kYXRhLnRhc2tzIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24odCkgew0KICAgICAgICByZXR1cm4gIXQuc3RhdHVzIHx8IHQuc3RhdHVzID09PSAnQWN0aXZlJzsNCiAgICAgIH0pOw0KDQogICAgICBzZWwuaW5uZXJIVE1MID0gJyc7DQogICAgICBpZiAoYWN0aXZlVGFza3MubGVuZ3RoID09PSAwKSB7DQogICAgICAgIGlmIChub1Rhc2tzKSBub1Rhc2tzLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpOw0KICAgICAgICBpZiAoZmllbGRzKSBmaWVsZHMuY2xhc3NMaXN0LmFkZCgnb3BhY2l0eS01MCcsICdwb2ludGVyLWV2ZW50cy1ub25lJyk7DQogICAgICB9",
    "IGVsc2Ugew0KICAgICAgICBpZiAobm9UYXNrcykgbm9UYXNrcy5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTsNCiAgICAgICAgaWYgKGZpZWxkcykgZmllbGRzLmNsYXNzTGlzdC5yZW1vdmUoJ29wYWNpdHktNTAnLCAncG9pbnRlci1ldmVudHMtbm9uZScpOw0KICAgICAgICBhY3RpdmVUYXNrcy5mb3JFYWNoKGZ1bmN0aW9uKHQpIHsNCiAgICAgICAgICB2YXIgb3B0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7DQogICAgICAgICAgb3B0LnZhbHVlID0gdC50YXNrTmFtZTsNCiAgICAgICAgICBvcHQudGV4dENvbnRlbnQgPSB0LnRhc2tOYW1lICsgKHQuZnJlcXVlbmN5ID8gJyAoJyArIHQuZnJlcXVlbmN5ICsgJyknIDogJycpOw0KICAgICAgICAgIHNlbC5hcHBlbmRDaGlsZChvcHQpOw0KICAgICAgICB9KTsNCiAgICAgIH0NCiAgICB9DQoNCiAgICAvKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09DQogICAgICogTkFWSUdBVElPTiAmIFRBQiBTV0lUQ0hJTkcNCiAgICAgKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovDQogICAgZnVuY3Rpb24gc3dpdGNoVGFiKHRhYklkKSB7DQogICAgICBzdGF0ZS5hY3RpdmVUYWIgPSB0YWJJZDsNCg0KICAgICAgLy8gVXBkYXRlIHRhYiBjb250ZW50cw0KICAgICAgZG9jdW1lbnQucXVl",
    "cnlTZWxlY3RvckFsbCgnLnRhYi1jb250ZW50JykuZm9yRWFjaChmdW5jdGlvbihlbCkgew0KICAgICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTsNCiAgICAgIH0pOw0KICAgICAgdmFyIGFjdGl2ZUVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYi0nICsgdGFiSWQpOw0KICAgICAgaWYgKGFjdGl2ZUVsKSBhY3RpdmVFbC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTsNCg0KICAgICAgLy8gVXBkYXRlIERlc2t0b3AgTmF2IHN0eWxlcw0KICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm5hdi10YWItYnRuJykuZm9yRWFjaChmdW5jdGlvbihidG4pIHsNCiAgICAgICAgYnRuLmNsYXNzTGlzdC5yZW1vdmUoJ2JvcmRlci1pbmRpZ28tNjAwJywgJ3RleHQtaW5kaWdvLTYwMCcpOw0KICAgICAgICBidG4uY2xhc3NMaXN0LmFkZCgnYm9yZGVyLXRyYW5zcGFyZW50JywgJ3RleHQtc2xhdGUtNjAwJyk7DQogICAgICB9KTsNCiAgICAgIHZhciBkQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Rlc2t0b3AtdGFiLScgKyB0YWJJZCk7DQogICAgICBpZiAoZEJ0bikgew0KICAgICAgICBkQnRuLmNsYXNzTGlzdC5yZW1vdmUoJ2JvcmRlci10cmFuc3BhcmVudCcsICd0ZXh0LXNsYXRlLTYwMCcpOw0KICAgICAgICBkQnRuLmNsYXNzTGlzdC5hZGQoJ2JvcmRlci1pbmRpZ28tNjAwJywgJ3RleHQtaW5kaWdvLTYwMCcpOw0KICAgICAgfQ0KDQogICAgICAvLyBVcGRhdGUgTW9iaWxlIE5hdiBz",
    "dHlsZXMNCiAgICAgIFsndHJhaW5pbmcnLCAnZmVlZGluZycsICd0YXNrcycsICdoaXN0b3J5J10uZm9yRWFjaChmdW5jdGlvbih0KSB7DQogICAgICAgIHZhciBtQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vYmlsZS10YWItJyArIHQpOw0KICAgICAgICBpZiAobUJ0bikgew0KICAgICAgICAgIGlmICh0ID09PSB0YWJJZCkgew0KICAgICAgICAgICAgbUJ0bi5jbGFzc0xpc3QuYWRkKCd0ZXh0LWluZGlnby02MDAnLCAnZm9udC1ib2xkJyk7DQogICAgICAgICAgICBtQnRuLmNsYXNzTGlzdC5yZW1vdmUoJ3RleHQtc2xhdGUtNTAwJywgJ2ZvbnQtbWVkaXVtJyk7DQogICAgICAgICAgfSBlbHNlIHsNCiAgICAgICAgICAgIG1CdG4uY2xhc3NMaXN0LnJlbW92ZSgndGV4dC1pbmRpZ28tNjAwJywgJ2ZvbnQtYm9sZCcpOw0KICAgICAgICAgICAgbUJ0bi5jbGFzc0xpc3QuYWRkKCd0ZXh0LXNsYXRlLTUwMCcsICdmb250LW1lZGl1bScpOw0KICAgICAgICAgIH0NCiAgICAgICAgfQ0KICAgICAgfSk7DQoNCiAgICAgIC8vIFJlc2l6ZSBvciByZW5kZXIgY2hhcnRzIG9uIHRhYiBzd2l0Y2ggdG8gcHJldmVudCBjYW52YXMgc2l6aW5nIGdsaXRjaA0KICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsNCiAgICAgICAgaWYgKHRhYklkID09PSAndHJhaW5pbmcnICYmIHN0YXRlLmNoYXJ0cy50cmFpbmluZykgew0KICAgICAgICAgIHN0YXRlLmNoYXJ0cy50cmFpbmluZy5yZXNpemUoKTsNCiAgICAgICAgfSBlbHNl",
    "IGlmICh0YWJJZCA9PT0gJ2ZlZWRpbmcnKSB7DQogICAgICAgICAgcmVuZGVyRmVlZGluZ0NoYXJ0KCk7DQogICAgICAgIH0gZWxzZSBpZiAodGFiSWQgPT09ICd0YXNrcycpIHsNCiAgICAgICAgICByZW5kZXJUYXNrc0NoYXJ0KCk7DQogICAgICAgIH0gZWxzZSBpZiAodGFiSWQgPT09ICdoaXN0b3J5Jykgew0KICAgICAgICAgIHJlbmRlckhpc3RvcnlMaXN0KCk7DQogICAgICAgIH0NCiAgICAgIH0sIDUwKTsNCiAgICB9DQoNCiAgICBmdW5jdGlvbiB0b2dnbGVBY2NvcmRpb24oY29udGVudElkLCBjaGV2cm9uSWQpIHsNCiAgICAgIHZhciBjb250ZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29udGVudElkKTsNCiAgICAgIHZhciBjaGV2cm9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY2hldnJvbklkKTsNCiAgICAgIGlmICghY29udGVudCkgcmV0dXJuOw0KICAgICAgaWYgKGNvbnRlbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdoaWRkZW4nKSkgew0KICAgICAgICBjb250ZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpOw0KICAgICAgICBpZiAoY2hldnJvbikgY2hldnJvbi5jbGFzc0xpc3QuYWRkKCdyb3RhdGUtMTgwJyk7DQogICAgICB9IGVsc2Ugew0KICAgICAgICBjb250ZW50LmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpOw0KICAgICAgICBpZiAoY2hldnJvbikgY2hldnJvbi5jbGFzc0xpc3QucmVtb3ZlKCdyb3RhdGUtMTgwJyk7DQogICAgICB9DQogICAgfQ0KDQogICAgLyogPT09PT09PT09",
    "PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQ0KICAgICAqIEZPUk0gSU5URVJBQ1RJVklUWSAmIFJFQUwtVElNRSBDQUxDVUxBVE9SUw0KICAgICAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8NCiAgICBmdW5jdGlvbiBzeW5jVHJhaW5EdXJhdGlvbih2YWwsIHNvdXJjZSkgew0KICAgICAgdmFyIG51bSA9IHBhcnNlRmxvYXQodmFsKTsNCiAgICAgIGlmIChpc05hTihudW0pKSBudW0gPSAwLjI1Ow0KICAgICAgbnVtID0gTWF0aC5tYXgoMC4yNSwgTWF0aC5taW4oMTIuMCwgTWF0aC5yb3VuZChudW0gKiA0KSAvIDQpKTsNCiAgICAgIA0KICAgICAgdmFyIHNTbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJhaW5EdXJhdGlvblNsaWRlcicpOw0KICAgICAgdmFyIHNOdW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJhaW5EdXJhdGlvbk51bScpOw0KICAgICAgdmFyIHNEaXNwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RyYWluRHVyYXRpb25EaXNwbGF5Jyk7DQoNCiAgICAgIGlmIChzb3VyY2UgPT09ICdzbGlkZXInICYmIHNOdW0pIHNOdW0udmFsdWUgPSBudW0udG9GaXhlZCgyKTsNCiAgICAgIGlmIChzb3VyY2UgPT09ICdudW1iZXInICYmIHNTbGlkZXIpIHNTbGlkZXIudmFsdWUgPSBudW07DQogICAgICBpZiAoc291cmNlID09",
    "PSAnYm90aCcpIHsNCiAgICAgICAgaWYgKHNTbGlkZXIpIHNTbGlkZXIudmFsdWUgPSBudW07DQogICAgICAgIGlmIChzTnVtKSBzTnVtLnZhbHVlID0gbnVtLnRvRml4ZWQoMik7DQogICAgICB9DQogICAgICBpZiAoc0Rpc3ApIHNEaXNwLnRleHRDb250ZW50ID0gbnVtLnRvRml4ZWQoMikgKyAnINep16LXldeqJzsNCg0KICAgICAgdXBkYXRlVHJhaW5DYWxjQmFubmVyKCk7DQogICAgfQ0KDQogICAgZnVuY3Rpb24gdXBkYXRlVHJhaW5DYWxjQmFubmVyKCkgew0KICAgICAgdmFyIHRpbWVWYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJhaW5UaW1lJyk/LnZhbHVlIHx8ICcxMDowMCc7DQogICAgICB2YXIgZHVyVmFsID0gcGFyc2VGbG9hdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJhaW5EdXJhdGlvblNsaWRlcicpPy52YWx1ZSB8fCAyLjUpOw0KICAgICAgDQogICAgICB2YXIgcGFydHMgPSB0aW1lVmFsLnNwbGl0KCc6Jyk7DQogICAgICB2YXIgaCA9IHBhcnNlSW50KHBhcnRzWzBdLCAxMCkgfHwgMDsNCiAgICAgIHZhciBtID0gcGFyc2VJbnQocGFydHNbMV0sIDEwKSB8fCAwOw0KDQogICAgICB2YXIgc3RhcnRNaW51dGVzID0gaCAqIDYwICsgbTsNCiAgICAgIHZhciBlbmRNaW51dGVzID0gTWF0aC5yb3VuZChzdGFydE1pbnV0ZXMgKyBkdXJWYWwgKiA2MCk7DQoNCiAgICAgIHZhciBlbmRIID0gTWF0aC5mbG9vcigoZW5kTWludXRlcyAvIDYwKSAlIDI0KTsNCiAgICAgIHZhciBlbmRNID0gTWF0",
    "aC5mbG9vcihlbmRNaW51dGVzICUgNjApOw0KDQogICAgICB2YXIgZW5kU3RyID0gKCcwJyArIGVuZEgpLnNsaWNlKC0yKSArICc6JyArICgnMCcgKyBlbmRNKS5zbGljZSgtMik7DQoNCiAgICAgIHZhciBlbFN0YXJ0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbGNTdGFydCcpOw0KICAgICAgdmFyIGVsRW5kID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbGNFbmQnKTsNCiAgICAgIHZhciBlbER1ciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYWxjRHVyJyk7DQoNCiAgICAgIGlmIChlbFN0YXJ0KSBlbFN0YXJ0LnRleHRDb250ZW50ID0gdGltZVZhbDsNCiAgICAgIGlmIChlbEVuZCkgZWxFbmQudGV4dENvbnRlbnQgPSBlbmRTdHI7DQogICAgICBpZiAoZWxEdXIpIGVsRHVyLnRleHRDb250ZW50ID0gZHVyVmFsLnRvRml4ZWQoMikgKyAnINep16LXldeqJzsNCiAgICB9DQoNCiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJhaW5UaW1lJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgdXBkYXRlVHJhaW5DYWxjQmFubmVyKTsNCg0KICAgIGZ1bmN0aW9uIHNlbGVjdFN0cmVzcyhsZXZlbCkgew0KICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RyYWluU3RyZXNzJykudmFsdWUgPSBsZXZlbDsNCiAgICAgIHZhciBpbmZvID0gU1RSRVNTX01BUFtsZXZlbF0gfHwgU1RSRVNTX01BUFsyXTsNCiAgICAgIHZhciBsYWJlbEVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0cmVz",
    "c1NlbGVjdGVkTGFiZWwnKTsNCiAgICAgIGlmIChsYWJlbEVsKSB7DQogICAgICAgIGxhYmVsRWwudGV4dENvbnRlbnQgPSBpbmZvLmxhYmVsOw0KICAgICAgICBsYWJlbEVsLmNsYXNzTmFtZSA9ICd0ZXh0LXhzIGZvbnQtYm9sZCBweC0yIHB5LTAuNSByb3VuZGVkLW1kICcgKyBpbmZvLmJnICsgJyAnICsgaW5mby50ZXh0Ow0KICAgICAgfQ0KDQogICAgICBmb3IgKHZhciBpID0gMTsgaSA8PSA1OyBpKyspIHsNCiAgICAgICAgdmFyIGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdHJlc3MtYnRuLScgKyBpKTsNCiAgICAgICAgaWYgKGJ0bikgew0KICAgICAgICAgIGlmIChpID09PSBsZXZlbCkgew0KICAgICAgICAgICAgYnRuLmNsYXNzTmFtZSA9ICdzdHJlc3MtYnRuIHB5LTIgcHgtMSByb3VuZGVkLXhsIGJvcmRlci0yIGJvcmRlci1pbmRpZ28tNjAwIGJnLWluZGlnby01MCB0ZXh0LWNlbnRlciB0cmFuc2l0aW9uIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIHNoYWRvdy1zbSc7DQogICAgICAgICAgfSBlbHNlIHsNCiAgICAgICAgICAgIGJ0bi5jbGFzc05hbWUgPSAnc3RyZXNzLWJ0biBweS0yIHB4LTEgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBiZy13aGl0ZSBob3ZlcjpiZy1zbGF0ZS01MCB0ZXh0LWNlbnRlciB0cmFuc2l0aW9uIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyJzsNCiAgICAgICAgICB9DQogICAgICAgIH0NCiAgICAgIH0NCiAgICB9DQoNCiAgICBmdW5jdGlv",
    "biBjYWxjQXdheURheXMoKSB7DQogICAgICB2YXIgc1ZhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhd2F5U3RhcnQnKT8udmFsdWU7DQogICAgICB2YXIgZVZhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhd2F5RW5kJyk/LnZhbHVlOw0KICAgICAgdmFyIGJhbm5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhd2F5RGF5c0Jhbm5lcicpOw0KICAgICAgdmFyIGJhbm5lclRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXdheURheXNUZXh0Jyk7DQogICAgICB2YXIgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0blN1Ym1pdEF3YXknKTsNCiAgICAgIGlmICghc1ZhbCB8fCAhZVZhbCB8fCAhYmFubmVyKSByZXR1cm47DQoNCiAgICAgIHZhciBkMSA9IG5ldyBEYXRlKHNWYWwpOw0KICAgICAgdmFyIGQyID0gbmV3IERhdGUoZVZhbCk7DQogICAgICB2YXIgZGlmZkRheXMgPSBNYXRoLnJvdW5kKChkMiAtIGQxKSAvICgxMDAwICogNjAgKiA2MCAqIDI0KSk7DQoNCiAgICAgIGlmIChkaWZmRGF5cyA8PSAwKSB7DQogICAgICAgIGJhbm5lci5jbGFzc05hbWUgPSAncC0zIHJvdW5kZWQteGwgdGV4dC14cyBmb250LW1lZGl1bSBiZy1hbWJlci01MCBib3JkZXIgYm9yZGVyLWFtYmVyLTIwMCB0ZXh0LWFtYmVyLTgwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMic7DQogICAgICAgIGJhbm5lclRleHQudGV4dENvbnRlbnQgPSAn16rXkNeo15nXmiDXlNeX15bXqNeUINeX15nXmdeRINec",
    "15TXmdeV16og157XkNeV15fXqCDXnteq15DXqNeZ15og15TXlNeq15fXnNeULic7DQogICAgICAgIGlmIChidG4pIHsNCiAgICAgICAgICBidG4uZGlzYWJsZWQgPSB0cnVlOw0KICAgICAgICAgIGJ0bi5jbGFzc0xpc3QuYWRkKCdvcGFjaXR5LTUwJywgJ2N1cnNvci1ub3QtYWxsb3dlZCcpOw0KICAgICAgICB9DQogICAgICB9IGVsc2Ugew0KICAgICAgICBiYW5uZXIuY2xhc3NOYW1lID0gJ3AtMyByb3VuZGVkLXhsIHRleHQteHMgZm9udC1tZWRpdW0gYmctaW5kaWdvLTUwIGJvcmRlciBib3JkZXItaW5kaWdvLTEwMCB0ZXh0LWluZGlnby05MDAgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTInOw0KICAgICAgICBiYW5uZXJUZXh0LmlubmVySFRNTCA9ICfwn5KhINeh15TXtNebINeW157XnyDXlNeZ16LXk9eo15XXqiDXnteq15XXm9eg1586IDxiPicgKyBkaWZmRGF5cyArICcg15nXnteZ1508L2I+JzsNCiAgICAgICAgaWYgKGJ0bikgew0KICAgICAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlOw0KICAgICAgICAgIGJ0bi5jbGFzc0xpc3QucmVtb3ZlKCdvcGFjaXR5LTUwJywgJ2N1cnNvci1ub3QtYWxsb3dlZCcpOw0KICAgICAgICB9DQogICAgICB9DQogICAgfQ0KDQogICAgZnVuY3Rpb24gc3luY0ZlZWRBbW91bnQodmFsLCBzb3VyY2UpIHsNCiAgICAgIHZhciBudW0gPSBwYXJzZUZsb2F0KHZhbCk7DQogICAgICBpZiAoaXNOYU4obnVtKSkgbnVtID0gMS4wOw0KICAgICAgbnVtID0gTWF0aC5tYXgoMC4yNSwgTWF0",
    "aC5taW4oNC4wLCBNYXRoLnJvdW5kKG51bSAqIDQpIC8gNCkpOw0KDQogICAgICB2YXIgc1NsaWRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZWVkQW1vdW50U2xpZGVyJyk7DQogICAgICB2YXIgc051bSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZWVkQW1vdW50TnVtJyk7DQogICAgICB2YXIgc0dyYW1zID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZlZWRHcmFtc1RleHQnKTsNCg0KICAgICAgaWYgKHNvdXJjZSA9PT0gJ3NsaWRlcicgJiYgc051bSkgc051bS52YWx1ZSA9IG51bS50b0ZpeGVkKDIpOw0KICAgICAgaWYgKHNvdXJjZSA9PT0gJ251bWJlcicgJiYgc1NsaWRlcikgc1NsaWRlci52YWx1ZSA9IG51bTsNCg0KICAgICAgdmFyIGdyYW1zID0gTWF0aC5yb3VuZChudW0gKiA0MDApOw0KICAgICAgaWYgKHNHcmFtcykgew0KICAgICAgICBzR3JhbXMudGV4dENvbnRlbnQgPSBudW0udG9GaXhlZCgyKSArICcg15vXldehID0gJyArIGdyYW1zICsgJyDXkteo150gKDEg15vXldehID0gNDAwINeS16jXnSknOw0KICAgICAgfQ0KICAgIH0NCg0KICAgIGZ1bmN0aW9uIHVwZGF0ZVRhc2tTY29yZUxhYmVsKHZhbCkgew0KICAgICAgdmFyIG51bSA9IHBhcnNlSW50KHZhbCwgMTApOw0KICAgICAgdmFyIGxhYmVscyA9IHsNCiAgICAgICAgMTogJzEgLSDXlNeq15fXnNeUIPCfmJ4nLA0KICAgICAgICAyOiAnMiAtINec15Ag157XqdeU15Ug8J+ZgScsDQogICAgICAgIDM6ICczIC0g15HXmdeg15XX",
    "oNeZIPCfmJAnLA0KICAgICAgICA0OiAnNCAtINeY15XXkSDwn5mCJywNCiAgICAgICAgNTogJzUgLSDXqdec15nXmNeUINee15zXkNeUIPCfjJ8nDQogICAgICB9Ow0KICAgICAgdmFyIGRpc3AgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFza1Njb3JlRGlzcGxheScpOw0KICAgICAgaWYgKGRpc3ApIGRpc3AudGV4dENvbnRlbnQgPSBsYWJlbHNbbnVtXSB8fCAnMyAtINeR15nXoNeV16DXmSc7DQogICAgfQ0KDQogICAgLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQ0KICAgICAqIE1VVEFUSU9OIFNVQk1JU1NJT04gSEFORExFUlMNCiAgICAgKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovDQogICAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlVHJhaW5pbmdTdWJtaXQoZSkgew0KICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOw0KICAgICAgdmFyIGRhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJhaW5EYXRlJykudmFsdWU7DQogICAgICB2YXIgdGltZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmFpblRpbWUnKS52YWx1ZTsNCiAgICAgIHZhciBkdXIgPSBwYXJzZUZsb2F0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmFpbkR1cmF0aW9uU2xpZGVyJykudmFsdWUpOw0KICAgICAgdmFyIHN0cmVzcyA9IHBhcnNlSW50",
    "KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmFpblN0cmVzcycpLnZhbHVlLCAxMCk7DQogICAgICB2YXIgbm90ZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndHJhaW5Ob3RlcycpLnZhbHVlOw0KDQogICAgICBpZiAoIWR1ciB8fCBkdXIgPD0gMCkgew0KICAgICAgICBzaG93VG9hc3QoJ9ee16nXmiDXlNeQ15nXnteV158g15fXmdeZ15Eg15zXlNeZ15XXqiDXkteT15XXnCDXni0wIScsICdlcnJvcicpOw0KICAgICAgICByZXR1cm47DQogICAgICB9DQoNCiAgICAgIHNob3dTcGlubmVyKCfXqdeV157XqCDXkNeZ157XldefLi4uJyk7DQogICAgICB0cnkgew0KICAgICAgICB2YXIgcGF5bG9hZCA9IHsgZGF0ZTogZGF0ZSwgdGltZTogdGltZSwgZHVyYXRpb246IGR1ciwgc3RyZXNzTGV2ZWw6IHN0cmVzcywgbm90ZXM6IG5vdGVzIH07DQogICAgICAgIHZhciByZXMgPSBhd2FpdCBjYWxsU2VydmVyKCdhZGRUcmFpbmluZ1Nlc3Npb24nLCBwYXlsb2FkKTsNCiAgICAgICAgaWYgKHJlcy5zdWNjZXNzKSB7DQogICAgICAgICAgc2hvd1RvYXN0KHJlcy5tZXNzYWdlIHx8ICfXlNeQ15nXnteV158g16DXqdee16gg15HXlNem15zXl9eUISDwn5+iJywgJ3N1Y2Nlc3MnKTsNCiAgICAgICAgICAvLyBVcGRhdGUgbG9jYWwgc3RhdGUNCiAgICAgICAgICB2YXIgbmV3UmVjb3JkID0gcmVzLnJlY29yZCB8fCB7DQogICAgICAgICAgICByb3dJbmRleDogKHN0YXRlLmRhdGEudHJhaW5pbmcubGVuZ3RoICsgMiksDQogICAg",
    "ICAgICAgICBkYXRlOiBkYXRlLA0KICAgICAgICAgICAgdGltZTogdGltZSwNCiAgICAgICAgICAgIGR1cmF0aW9uOiBkdXIsDQogICAgICAgICAgICBzdHJlc3NMZXZlbDogc3RyZXNzLA0KICAgICAgICAgICAgbm90ZXM6IG5vdGVzDQogICAgICAgICAgfTsNCiAgICAgICAgICBzdGF0ZS5kYXRhLnRyYWluaW5nLnB1c2gobmV3UmVjb3JkKTsNCiAgICAgICAgICAvLyBSZWNhbGN1bGF0ZSBkeW5hbWljIGRlZmF1bHQgZHVyYXRpb24NCiAgICAgICAgICByZWNhbGNEZWZhdWx0RHVyYXRpb24oKTsNCiAgICAgICAgICAvLyBSZXNldCBmb3JtIGZpZWxkcw0KICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0cmFpbk5vdGVzJykudmFsdWUgPSAnJzsNCiAgICAgICAgICAvLyBSZWZyZXNoIGNoYXJ0IGFuZCBoaXN0b3J5DQogICAgICAgICAgcmVuZGVyVHJhaW5pbmdDaGFydCgpOw0KICAgICAgICAgIHJlbmRlckhpc3RvcnlMaXN0KCk7DQogICAgICAgIH0gZWxzZSB7DQogICAgICAgICAgc2hvd1RvYXN0KCfXqdeS15nXkNeUINeR16nXnteZ16jXlDogJyArIChyZXMuZXJyb3IgfHwgJ9eq16fXnNeUINec15Ag15nXk9eV16LXlCcpLCAnZXJyb3InKTsNCiAgICAgICAgfQ0KICAgICAgfSBjYXRjaCAoZXJyKSB7DQogICAgICAgIHNob3dUb2FzdCgn16rXp9ec16og16rXp9ep15XXqNeqOiAnICsgZXJyLnRvU3RyaW5nKCksICdlcnJvcicpOw0KICAgICAgfSBmaW5hbGx5IHsNCiAgICAgICAgaGlkZVNwaW5uZXIo",
    "KTsNCiAgICAgIH0NCiAgICB9DQoNCiAgICBhc3luYyBmdW5jdGlvbiBoYW5kbGVBd2F5U3VibWl0KGUpIHsNCiAgICAgIGUucHJldmVudERlZmF1bHQoKTsNCiAgICAgIHZhciBzdGFydERhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXdheVN0YXJ0JykudmFsdWU7DQogICAgICB2YXIgZW5kRGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhd2F5RW5kJykudmFsdWU7DQogICAgICB2YXIgbG9jYXRpb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXdheUxvY2F0aW9uJykudmFsdWU7DQogICAgICB2YXIgbm90ZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXdheU5vdGVzJykudmFsdWU7DQoNCiAgICAgIHZhciBkMSA9IG5ldyBEYXRlKHN0YXJ0RGF0ZSk7DQogICAgICB2YXIgZDIgPSBuZXcgRGF0ZShlbmREYXRlKTsNCiAgICAgIGlmIChkMiA8PSBkMSkgew0KICAgICAgICBzaG93VG9hc3QoJ9eq15DXqNeZ15og15TXl9eW16jXlCDXl9eZ15nXkSDXnNeU15nXldeqINee15DXldeX16gg157XqteQ16jXmdeaINeU15TXqteX15zXlC4nLCAnd2FybmluZycpOw0KICAgICAgICByZXR1cm47DQogICAgICB9DQoNCiAgICAgIHNob3dTcGlubmVyKCfXqdeV157XqCDXqten15XXpNeqINeU15nXoteT16jXldeqLi4uJyk7DQogICAgICB0cnkgew0KICAgICAgICB2YXIgcGF5bG9hZCA9IHsgc3RhcnREYXRlOiBzdGFydERhdGUsIGVuZERhdGU6IGVuZERhdGUsIGxvY2F0aW9uOiBsb2NhdGlvbiwg",
    "bm90ZXM6IG5vdGVzIH07DQogICAgICAgIHZhciByZXMgPSBhd2FpdCBjYWxsU2VydmVyKCdhZGRBd2F5TG9nJywgcGF5bG9hZCk7DQogICAgICAgIGlmIChyZXMuc3VjY2Vzcykgew0KICAgICAgICAgIHNob3dUb2FzdChyZXMubWVzc2FnZSB8fCAn16rXp9eV16TXqiDXlNeU15nXoteT16jXldeqINeg16nXnteo15Qg15HXlNem15zXl9eUIScsICdzdWNjZXNzJyk7DQogICAgICAgICAgdmFyIG5ld1JlY29yZCA9IHJlcy5yZWNvcmQgfHwgew0KICAgICAgICAgICAgcm93SW5kZXg6IChzdGF0ZS5kYXRhLmF3YXlMb2cubGVuZ3RoICsgMiksDQogICAgICAgICAgICBzdGFydERhdGU6IHN0YXJ0RGF0ZSwNCiAgICAgICAgICAgIGVuZERhdGU6IGVuZERhdGUsDQogICAgICAgICAgICBsb2NhdGlvbjogbG9jYXRpb24sDQogICAgICAgICAgICBkYXlzQ291bnQ6IHJlcy5kYXlzQ291bnQsDQogICAgICAgICAgICBub3Rlczogbm90ZXMNCiAgICAgICAgICB9Ow0KICAgICAgICAgIHN0YXRlLmRhdGEuYXdheUxvZy5wdXNoKG5ld1JlY29yZCk7DQogICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F3YXlOb3RlcycpLnZhbHVlID0gJyc7DQogICAgICAgICAgcmVuZGVyVHJhaW5pbmdDaGFydCgpOw0KICAgICAgICAgIHJlbmRlckhpc3RvcnlMaXN0KCk7DQogICAgICAgICAgdG9nZ2xlQWNjb3JkaW9uKCdhd2F5TG9nQ2FyZENvbnRlbnQnLCAnYXdheUNoZXZyb24nKTsNCiAgICAgICAgfSBlbHNlIHsNCiAgICAgICAg",
    "ICBzaG93VG9hc3QoJ9ep15LXmdeQ15Q6ICcgKyAocmVzLmVycm9yIHx8ICfXqten15zXlCcpLCAnZXJyb3InKTsNCiAgICAgICAgfQ0KICAgICAgfSBjYXRjaCAoZXJyKSB7DQogICAgICAgIHNob3dUb2FzdCgn16rXp9ec16og16rXp9ep15XXqNeqOiAnICsgZXJyLnRvU3RyaW5nKCksICdlcnJvcicpOw0KICAgICAgfSBmaW5hbGx5IHsNCiAgICAgICAgaGlkZVNwaW5uZXIoKTsNCiAgICAgIH0NCiAgICB9DQoNCiAgICBhc3luYyBmdW5jdGlvbiBoYW5kbGVGZWVkaW5nU3VibWl0KGUpIHsNCiAgICAgIGUucHJldmVudERlZmF1bHQoKTsNCiAgICAgIHZhciBkYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZlZWREYXRlJykudmFsdWU7DQogICAgICB2YXIgdGltZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZWVkVGltZScpLnZhbHVlOw0KICAgICAgdmFyIHR5cGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmVlZFR5cGUnKS52YWx1ZTsNCiAgICAgIHZhciBhbW91bnQgPSBwYXJzZUZsb2F0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZWVkQW1vdW50U2xpZGVyJykudmFsdWUpOw0KICAgICAgdmFyIGZpbmlzaGVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZlZWRGaW5pc2hlZCcpLmNoZWNrZWQ7DQogICAgICB2YXIgbm90ZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmVlZE5vdGVzJykudmFsdWU7DQoNCiAgICAgIHNob3dTcGlubmVyKCfXqdeV157XqCDXkNeo15XXl9eULi4u",
    "Jyk7DQogICAgICB0cnkgew0KICAgICAgICB2YXIgcGF5bG9hZCA9IHsgZGF0ZTogZGF0ZSwgdGltZTogdGltZSwgdHlwZTogdHlwZSwgYW1vdW50OiBhbW91bnQsIGZpbmlzaGVkOiBmaW5pc2hlZCwgbm90ZXM6IG5vdGVzIH07DQogICAgICAgIHZhciByZXMgPSBhd2FpdCBjYWxsU2VydmVyKCdhZGRGZWVkaW5nJywgcGF5bG9hZCk7DQogICAgICAgIGlmIChyZXMuc3VjY2Vzcykgew0KICAgICAgICAgIHNob3dUb2FzdChyZXMubWVzc2FnZSB8fCAn15TXkNeo15XXl9eUINeg16nXnteo15QhJywgJ3N1Y2Nlc3MnKTsNCiAgICAgICAgICB2YXIgbmV3UmVjb3JkID0gcmVzLnJlY29yZCB8fCB7DQogICAgICAgICAgICByb3dJbmRleDogKHN0YXRlLmRhdGEuZmVlZGluZy5sZW5ndGggKyAyKSwNCiAgICAgICAgICAgIGRhdGU6IGRhdGUsDQogICAgICAgICAgICB0aW1lOiB0aW1lLA0KICAgICAgICAgICAgdHlwZTogdHlwZSwNCiAgICAgICAgICAgIGFtb3VudDogYW1vdW50LA0KICAgICAgICAgICAgZmluaXNoZWQ6IGZpbmlzaGVkID8gJ9eb158nIDogJ9ec15AnLA0KICAgICAgICAgICAgbm90ZXM6IG5vdGVzDQogICAgICAgICAgfTsNCiAgICAgICAgICBzdGF0ZS5kYXRhLmZlZWRpbmcucHVzaChuZXdSZWNvcmQpOw0KICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmZWVkTm90ZXMnKS52YWx1ZSA9ICcnOw0KICAgICAgICAgIHJlbmRlckZlZWRpbmdDaGFydCgpOw0KICAgICAgICAgIHJlbmRlckhpc3Rv",
    "cnlMaXN0KCk7DQogICAgICAgIH0gZWxzZSB7DQogICAgICAgICAgc2hvd1RvYXN0KCfXqdeS15nXkNeUOiAnICsgKHJlcy5lcnJvciB8fCAn16rXp9ec15QnKSwgJ2Vycm9yJyk7DQogICAgICAgIH0NCiAgICAgIH0gY2F0Y2ggKGVycikgew0KICAgICAgICBzaG93VG9hc3QoJ9eq16fXnNeqINeq16fXqdeV16jXqjogJyArIGVyci50b1N0cmluZygpLCAnZXJyb3InKTsNCiAgICAgIH0gZmluYWxseSB7DQogICAgICAgIGhpZGVTcGlubmVyKCk7DQogICAgICB9DQogICAgfQ0KDQogICAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlTmV3VGFza1N1Ym1pdChlKSB7DQogICAgICBlLnByZXZlbnREZWZhdWx0KCk7DQogICAgICB2YXIgdGFza05hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFza05hbWVJbnB1dCcpLnZhbHVlLnRyaW0oKTsNCiAgICAgIHZhciBmcmVxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Rhc2tGcmVxSW5wdXQnKS52YWx1ZS50cmltKCk7DQogICAgICB2YXIgZGVzYyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YXNrRGVzY0lucHV0JykudmFsdWUudHJpbSgpOw0KDQogICAgICBpZiAoIXRhc2tOYW1lKSB7DQogICAgICAgIHNob3dUb2FzdCgn16nXnSDXlNeq16jXkteZ15wg15DXmdeg15Ug15nXm9eV15wg15zXlNeZ15XXqiDXqNeZ16cuJywgJ3dhcm5pbmcnKTsNCiAgICAgICAgcmV0dXJuOw0KICAgICAgfQ0KDQogICAgICBzaG93U3Bpbm5lcign15nXldem16gg16rXqNeS15nXnC4u",
    "LicpOw0KICAgICAgdHJ5IHsNCiAgICAgICAgdmFyIHBheWxvYWQgPSB7IHRhc2tOYW1lOiB0YXNrTmFtZSwgZnJlcXVlbmN5OiBmcmVxLCBkZXNjcmlwdGlvbjogZGVzYyB9Ow0KICAgICAgICB2YXIgcmVzID0gYXdhaXQgY2FsbFNlcnZlcignYWRkVGFzaycsIHBheWxvYWQpOw0KICAgICAgICBpZiAocmVzLnN1Y2Nlc3MpIHsNCiAgICAgICAgICBzaG93VG9hc3QocmVzLm1lc3NhZ2UgfHwgJ9eU16rXqNeS15nXnCDXoNeV16HXoyDXnNeo16nXmdee15QhJywgJ3N1Y2Nlc3MnKTsNCiAgICAgICAgICB2YXIgbmV3UmVjb3JkID0gcmVzLnJlY29yZCB8fCB7DQogICAgICAgICAgICByb3dJbmRleDogKHN0YXRlLmRhdGEudGFza3MubGVuZ3RoICsgMiksDQogICAgICAgICAgICB0YXNrTmFtZTogdGFza05hbWUsDQogICAgICAgICAgICBmcmVxdWVuY3k6IGZyZXEsDQogICAgICAgICAgICBkZXNjcmlwdGlvbjogZGVzYywNCiAgICAgICAgICAgIHN0YXR1czogJ0FjdGl2ZScNCiAgICAgICAgICB9Ow0KICAgICAgICAgIHN0YXRlLmRhdGEudGFza3MucHVzaChuZXdSZWNvcmQpOw0KICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YXNrTmFtZUlucHV0JykudmFsdWUgPSAnJzsNCiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFza0ZyZXFJbnB1dCcpLnZhbHVlID0gJyc7DQogICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Rhc2tEZXNjSW5wdXQnKS52YWx1ZSA9ICcnOw0KICAg",
    "ICAgICAgIHBvcHVsYXRlQWN0aXZlVGFza3NEcm9wZG93bigpOw0KICAgICAgICAgIHJlbmRlckhpc3RvcnlMaXN0KCk7DQogICAgICAgICAgdG9nZ2xlQWNjb3JkaW9uKCduZXdUYXNrQ2FyZENvbnRlbnQnLCAndGFza0NoZXZyb24nKTsNCiAgICAgICAgfSBlbHNlIHsNCiAgICAgICAgICBzaG93VG9hc3QoJ9ep15LXmdeQ15Q6ICcgKyAocmVzLmVycm9yIHx8ICfXqten15zXlCcpLCAnZXJyb3InKTsNCiAgICAgICAgfQ0KICAgICAgfSBjYXRjaCAoZXJyKSB7DQogICAgICAgIHNob3dUb2FzdCgn16rXp9ec16og16rXp9ep15XXqNeqOiAnICsgZXJyLnRvU3RyaW5nKCksICdlcnJvcicpOw0KICAgICAgfSBmaW5hbGx5IHsNCiAgICAgICAgaGlkZVNwaW5uZXIoKTsNCiAgICAgIH0NCiAgICB9DQoNCiAgICBhc3luYyBmdW5jdGlvbiBoYW5kbGVMb2dUYXNrU3VibWl0KGUpIHsNCiAgICAgIGUucHJldmVudERlZmF1bHQoKTsNCiAgICAgIHZhciB0YXNrTmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWxUYXNrTmFtZScpLnZhbHVlOw0KICAgICAgdmFyIGRhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFza0V4ZWNEYXRlJykudmFsdWU7DQogICAgICB2YXIgc2NvcmUgPSBwYXJzZUludChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFza1Njb3JlU2xpZGVyJykudmFsdWUsIDEwKTsNCiAgICAgIHZhciBub3RlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YXNrRXhlY05vdGVzJykudmFsdWUu",
    "dHJpbSgpOw0KDQogICAgICBpZiAoIXRhc2tOYW1lKSB7DQogICAgICAgIHNob3dUb2FzdCgn15fXldeR15Qg15zXkdeX15XXqCDXqteo15LXmdecLicsICd3YXJuaW5nJyk7DQogICAgICAgIHJldHVybjsNCiAgICAgIH0NCg0KICAgICAgc2hvd1NwaW5uZXIoJ9ee16rXoteTINeR15nXpteV16Ig16rXqNeS15nXnC4uLicpOw0KICAgICAgdHJ5IHsNCiAgICAgICAgdmFyIHBheWxvYWQgPSB7IHRhc2tOYW1lOiB0YXNrTmFtZSwgZGF0ZTogZGF0ZSwgc3VjY2Vzczogc2NvcmUsIG5vdGVzOiBub3RlcyB9Ow0KICAgICAgICB2YXIgcmVzID0gYXdhaXQgY2FsbFNlcnZlcignbG9nVGFza0V4ZWN1dGlvbicsIHBheWxvYWQpOw0KICAgICAgICBpZiAocmVzLnN1Y2Nlc3MpIHsNCiAgICAgICAgICBzaG93VG9hc3QocmVzLm1lc3NhZ2UgfHwgJ9eU15HXmdem15XXoiDXqteV16LXkyDXkdeU16bXnNeX15QhJywgJ3N1Y2Nlc3MnKTsNCiAgICAgICAgICB2YXIgbmV3UmVjb3JkID0gcmVzLnJlY29yZCB8fCB7DQogICAgICAgICAgICByb3dJbmRleDogKHN0YXRlLmRhdGEudGFza0xvZ3MubGVuZ3RoICsgMiksDQogICAgICAgICAgICBkYXRlOiBkYXRlLA0KICAgICAgICAgICAgdGFza05hbWU6IHRhc2tOYW1lLA0KICAgICAgICAgICAgc3VjY2Vzczogc2NvcmUsDQogICAgICAgICAgICBub3Rlczogbm90ZXMNCiAgICAgICAgICB9Ow0KICAgICAgICAgIHN0YXRlLmRhdGEudGFza0xvZ3MucHVzaChuZXdSZWNvcmQpOw0KICAgICAg",
    "ICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YXNrRXhlY05vdGVzJykudmFsdWUgPSAnJzsNCiAgICAgICAgICByZW5kZXJUYXNrc0NoYXJ0KCk7DQogICAgICAgICAgcmVuZGVySGlzdG9yeUxpc3QoKTsNCiAgICAgICAgfSBlbHNlIHsNCiAgICAgICAgICBzaG93VG9hc3QoJ9ep15LXmdeQ15Q6ICcgKyAocmVzLmVycm9yIHx8ICfXqten15zXlCcpLCAnZXJyb3InKTsNCiAgICAgICAgfQ0KICAgICAgfSBjYXRjaCAoZXJyKSB7DQogICAgICAgIHNob3dUb2FzdCgn16rXp9ec16og16rXp9ep15XXqNeqOiAnICsgZXJyLnRvU3RyaW5nKCksICdlcnJvcicpOw0KICAgICAgfSBmaW5hbGx5IHsNCiAgICAgICAgaGlkZVNwaW5uZXIoKTsNCiAgICAgIH0NCiAgICB9DQoNCiAgICBmdW5jdGlvbiByZWNhbGNEZWZhdWx0RHVyYXRpb24oKSB7DQogICAgICB2YXIgbWF4RHVyID0gMDsNCiAgICAgIChzdGF0ZS5kYXRhLnRyYWluaW5nIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKHMpIHsNCiAgICAgICAgdmFyIGQgPSBwYXJzZUZsb2F0KHMuZHVyYXRpb24pOw0KICAgICAgICBpZiAoIWlzTmFOKGQpICYmIGQgPiBtYXhEdXIpIG1heER1ciA9IGQ7DQogICAgICB9KTsNCiAgICAgIGlmIChtYXhEdXIgPiAwKSB7DQogICAgICAgIHN0YXRlLmRhdGEuZGVmYXVsdER1cmF0aW9uID0gTWF0aC5yb3VuZCgobWF4RHVyIC8gMi4wKSAqIDQpIC8gNDsNCiAgICAgIH0gZWxzZSB7DQogICAgICAgIHN0YXRlLmRhdGEuZGVmYXVsdER1cmF0",
    "aW9uID0gMi41Ow0KICAgICAgfQ0KICAgIH0NCg0KICAgIGFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hBbGxEYXRhKCkgew0KICAgICAgc2hvd1NwaW5uZXIoJ9ee16jXoteg158g16DXqteV16DXmdedLi4uJyk7DQogICAgICB0cnkgew0KICAgICAgICB2YXIgcmVzID0gYXdhaXQgY2FsbFNlcnZlcignZ2V0SW5pdGlhbERhdGEnKTsNCiAgICAgICAgaWYgKHJlcyAmJiAhcmVzLmVycm9yKSB7DQogICAgICAgICAgc3RhdGUuZGF0YSA9IHJlczsNCiAgICAgICAgICBwb3B1bGF0ZUFjdGl2ZVRhc2tzRHJvcGRvd24oKTsNCiAgICAgICAgICByZW5kZXJUcmFpbmluZ0NoYXJ0KCk7DQogICAgICAgICAgcmVuZGVyRmVlZGluZ0NoYXJ0KCk7DQogICAgICAgICAgcmVuZGVyVGFza3NDaGFydCgpOw0KICAgICAgICAgIHJlbmRlckhpc3RvcnlMaXN0KCk7DQogICAgICAgICAgc2hvd1RvYXN0KCfXlNeg16rXldeg15nXnSDXqNeV16LXoNeg15Ug15HXlNem15zXl9eUISDwn5SEJywgJ3N1Y2Nlc3MnKTsNCiAgICAgICAgfSBlbHNlIHsNCiAgICAgICAgICBzaG93VG9hc3QoJ9ep15LXmdeQ15Qg15HXqNeZ16LXoNeV158g16DXqteV16DXmdedJywgJ2Vycm9yJyk7DQogICAgICAgIH0NCiAgICAgIH0gY2F0Y2ggKGVycikgew0KICAgICAgICBzaG93VG9hc3QoJ9eq16fXnNeqINeq16fXqdeV16jXqiDXkdeo15nXoteg15XXnycsICdlcnJvcicpOw0KICAgICAgfSBmaW5hbGx5IHsNCiAgICAgICAgaGlkZVNwaW5uZXIoKTsNCiAgICAgIH0N",
    "CiAgICB9DQoNCiAgICAvKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09DQogICAgICogTUFUSEVNQVRJQ0FMIEFOQUxZVElDUyAmIENIQVJUIFJFTkRFUklORw0KICAgICAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8NCiAgICBmdW5jdGlvbiBzZXRDaGFydFRpbWVSYW5nZShkYXlzKSB7DQogICAgICBzdGF0ZS5jaGFydFJhbmdlRGF5cyA9IGRheXM7DQogICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuY2hhcnQtcmFuZ2UtYnRuJykuZm9yRWFjaChmdW5jdGlvbihiKSB7DQogICAgICAgIGIuY2xhc3NOYW1lID0gJ2NoYXJ0LXJhbmdlLWJ0biBweC0yLjUgcHktMSByb3VuZGVkLWxnIHRleHQtc2xhdGUtNjAwIHRyYW5zaXRpb24nOw0KICAgICAgfSk7DQogICAgICB2YXIgYWN0aXZlQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JhbmdlLWJ0bi0nICsgZGF5cyk7DQogICAgICBpZiAoYWN0aXZlQnRuKSB7DQogICAgICAgIGFjdGl2ZUJ0bi5jbGFzc05hbWUgPSAnY2hhcnQtcmFuZ2UtYnRuIHB4LTIuNSBweS0xIHJvdW5kZWQtbGcgYmctd2hpdGUgc2hhZG93LXNtIHRleHQtaW5kaWdvLTYwMCBmb250LWJvbGQgdHJhbnNpdGlvbic7DQogICAgICB9DQogICAgICByZW5kZXJUcmFpbmluZ0NoYXJ0KCk7DQogICAgfQ0KDQog",
    "ICAgLyoqDQogICAgICogQ29yZSBBbGdvcml0aG06IENvbXB1dGVzIDctZGF5IGhhbGYtbGlmZSBleHBvbmVudGlhbGx5IGRlY2F5ZWQgcm9sbGluZyBpbnRlbnNpdHksDQogICAgICogMzMlIGFuZCA5MCUgcXVhbnRpbGUgYmFuZHMsIGluZGl2aWR1YWwgc2Vzc2lvbiBzY2F0dGVyIGRvdHMsIGFuZCBhd2F5IHN0YXkgYm94IG92ZXJsYXlzLg0KICAgICAqLw0KICAgIGZ1bmN0aW9uIGNvbXB1dGVTZXBhcmF0aW9uTWV0cmljcyh0cmFpbmluZ0xpc3QsIGF3YXlMaXN0LCBmaWx0ZXJEYXlzKSB7DQogICAgICBpZiAoIXRyYWluaW5nTGlzdCB8fCB0cmFpbmluZ0xpc3QubGVuZ3RoID09PSAwKSB7DQogICAgICAgIHJldHVybiB7IGRhaWx5RGF0ZXM6IFtdLCBpbnRlbnNpdHlWYWxzOiBbXSwgcTMzVmFsczogW10sIHE5MFZhbHM6IFtdLCBzY2F0dGVyUG9pbnRzOiBbXSwgYXdheUJveGVzOiB7fSB9Ow0KICAgICAgfQ0KDQogICAgICAvLyAxLiBTdHJlc3Mtd2VpZ2h0ZWQgc2Vzc2lvbiBkdXJhdGlvbjogRHVyYXRpb24gKiAoU3RyZXNzTGV2ZWwgLyAzLjApDQogICAgICB2YXIgc2Vzc2lvbnMgPSBbXTsNCiAgICAgIHRyYWluaW5nTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHMpIHsNCiAgICAgICAgdmFyIGR1ciA9IHBhcnNlRmxvYXQocy5kdXJhdGlvbik7DQogICAgICAgIHZhciBzdHJlc3MgPSBwYXJzZUludChzLnN0cmVzc0xldmVsLCAxMCk7DQogICAgICAgIGlmIChpc05hTihkdXIpIHx8IGR1ciA8PSAwKSByZXR1cm47DQog",
    "ICAgICAgIGlmIChpc05hTihzdHJlc3MpIHx8IHN0cmVzcyA8IDEgfHwgc3RyZXNzID4gNSkgc3RyZXNzID0gMzsNCg0KICAgICAgICB2YXIgd2VpZ2h0ZWQgPSBkdXIgKiAoc3RyZXNzIC8gMy4wKTsNCiAgICAgICAgc2Vzc2lvbnMucHVzaCh7DQogICAgICAgICAgZGF0ZTogcy5kYXRlLA0KICAgICAgICAgIHRpbWU6IHMudGltZSB8fCAnMTI6MDAnLA0KICAgICAgICAgIGR1cmF0aW9uOiBkdXIsDQogICAgICAgICAgc3RyZXNzOiBzdHJlc3MsDQogICAgICAgICAgd2VpZ2h0ZWQ6IHdlaWdodGVkLA0KICAgICAgICAgIGZ1bGxEYXRlVGltZTogcy5kYXRlICsgJ1QnICsgKHMudGltZSA/IHMudGltZSA6ICcxMjowMCcpDQogICAgICAgIH0pOw0KICAgICAgfSk7DQoNCiAgICAgIGlmIChzZXNzaW9ucy5sZW5ndGggPT09IDApIHsNCiAgICAgICAgcmV0dXJuIHsgZGFpbHlEYXRlczogW10sIGludGVuc2l0eVZhbHM6IFtdLCBxMzNWYWxzOiBbXSwgcTkwVmFsczogW10sIHNjYXR0ZXJQb2ludHM6IFtdLCBhd2F5Qm94ZXM6IHt9IH07DQogICAgICB9DQoNCiAgICAgIC8vIFNvcnQgc2Vzc2lvbnMgYnkgZGF0ZQ0KICAgICAgc2Vzc2lvbnMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhLmRhdGUubG9jYWxlQ29tcGFyZShiLmRhdGUpOyB9KTsNCg0KICAgICAgLy8gRGFpbHkgYWdncmVnYXRpb24NCiAgICAgIHZhciBkYWlseVN1bSA9IHt9Ow0KICAgICAgc2Vzc2lvbnMuZm9yRWFjaChmdW5jdGlvbihzKSB7DQogICAg",
    "ICAgIGRhaWx5U3VtW3MuZGF0ZV0gPSAoZGFpbHlTdW1bcy5kYXRlXSB8fCAwKSArIHMud2VpZ2h0ZWQ7DQogICAgICB9KTsNCg0KICAgICAgLy8gQ2FsZW5kYXIgcmVzYW1wbGluZzogRmlsbCBkYWlseSBkYXRlcyBjb250aW51b3VzbHkgYmV0d2VlbiBtaW5EYXRlIGFuZCBtYXhEYXRlDQogICAgICB2YXIgbWluRGF0ZSA9IG5ldyBEYXRlKHNlc3Npb25zWzBdLmRhdGUpOw0KICAgICAgdmFyIG1heERhdGUgPSBuZXcgRGF0ZShzZXNzaW9uc1tzZXNzaW9ucy5sZW5ndGggLSAxXS5kYXRlKTsNCiAgICAgIC8vIEVuc3VyZSBhdCBsZWFzdCB0b2RheSBpcyBjb3ZlcmVkDQogICAgICB2YXIgdG9kYXkgPSBuZXcgRGF0ZSgpOw0KICAgICAgaWYgKHRvZGF5ID4gbWF4RGF0ZSkgbWF4RGF0ZSA9IHRvZGF5Ow0KDQogICAgICB2YXIgY29udGludW91c0RhdGVzID0gW107DQogICAgICB2YXIgY3VyciA9IG5ldyBEYXRlKG1pbkRhdGUpOw0KICAgICAgd2hpbGUgKGN1cnIgPD0gbWF4RGF0ZSkgew0KICAgICAgICB2YXIgeXIgPSBjdXJyLmdldEZ1bGxZZWFyKCk7DQogICAgICAgIHZhciBtbyA9ICgnMCcgKyAoY3Vyci5nZXRNb250aCgpICsgMSkpLnNsaWNlKC0yKTsNCiAgICAgICAgdmFyIGRhID0gKCcwJyArIGN1cnIuZ2V0RGF0ZSgpKS5zbGljZSgtMik7DQogICAgICAgIGNvbnRpbnVvdXNEYXRlcy5wdXNoKHlyICsgJy0nICsgbW8gKyAnLScgKyBkYSk7DQogICAgICAgIGN1cnIuc2V0RGF0ZShjdXJyLmdldERhdGUoKSArIDEp",
    "Ow0KICAgICAgfQ0KDQogICAgICAvLyBSb2xsaW5nIDctZGF5IGhhbGYtbGlmZSBleHBvbmVudGlhbCBkZWNheSBjYWxjdWxhdGlvbg0KICAgICAgLy8gSW50ZW5zaXR5KHQpID0gc3VtX3trPTAuLjZ9IDAuNV5rICogRGFpbHlfV2VpZ2h0ZWQodCAtIGspDQogICAgICB2YXIgZGFpbHlJbnRlbnNpdHkgPSBbXTsNCiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGludW91c0RhdGVzLmxlbmd0aDsgaSsrKSB7DQogICAgICAgIHZhciBzdW1JbnRlbnNpdHkgPSAwOw0KICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IDc7IGsrKykgew0KICAgICAgICAgIHZhciB0YXJnZXRJZHggPSBpIC0gazsNCiAgICAgICAgICBpZiAodGFyZ2V0SWR4ID49IDApIHsNCiAgICAgICAgICAgIHZhciB0YXJnZXREYXRlID0gY29udGludW91c0RhdGVzW3RhcmdldElkeF07DQogICAgICAgICAgICB2YXIgZGF5VmFsID0gZGFpbHlTdW1bdGFyZ2V0RGF0ZV0gfHwgMDsNCiAgICAgICAgICAgIHZhciB3ZWlnaHQgPSBNYXRoLnBvdygwLjUsIGspOw0KICAgICAgICAgICAgc3VtSW50ZW5zaXR5ICs9IHdlaWdodCAqIGRheVZhbDsNCiAgICAgICAgICB9DQogICAgICAgIH0NCiAgICAgICAgZGFpbHlJbnRlbnNpdHkucHVzaChOdW1iZXIoc3VtSW50ZW5zaXR5LnRvRml4ZWQoMykpKTsNCiAgICAgIH0NCg0KICAgICAgLy8gQ2FsY3VsYXRlIGR5bmFtaWMgcXVhbnRpbGUgYmFuZHMgKFEzMyBhbmQgUTkwKSBvbiBhY3RpdmUgZGF5cyAoPiAwLjEp",
    "DQogICAgICB2YXIgYWN0aXZlRGF5cyA9IGRhaWx5SW50ZW5zaXR5LmZpbHRlcihmdW5jdGlvbih2KSB7IHJldHVybiB2ID4gMC4xOyB9KTsNCiAgICAgIHZhciBxMzMgPSAwLjU7DQogICAgICB2YXIgcTkwID0gMi4wOw0KICAgICAgaWYgKGFjdGl2ZURheXMubGVuZ3RoID4gMCkgew0KICAgICAgICBhY3RpdmVEYXlzLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAtIGI7IH0pOw0KICAgICAgICB2YXIgaWR4MzMgPSBNYXRoLmZsb29yKDAuMzMgKiAoYWN0aXZlRGF5cy5sZW5ndGggLSAxKSk7DQogICAgICAgIHZhciBpZHg5MCA9IE1hdGguZmxvb3IoMC45MCAqIChhY3RpdmVEYXlzLmxlbmd0aCAtIDEpKTsNCiAgICAgICAgcTMzID0gYWN0aXZlRGF5c1tpZHgzM107DQogICAgICAgIHE5MCA9IGFjdGl2ZURheXNbaWR4OTBdOw0KICAgICAgfQ0KDQogICAgICAvLyBGaWx0ZXIgYnkgcmVxdWVzdGVkIHRpbWUgcmFuZ2UNCiAgICAgIHZhciBjdXRvZmZEYXRlU3RyID0gbnVsbDsNCiAgICAgIGlmIChmaWx0ZXJEYXlzID4gMCkgew0KICAgICAgICB2YXIgY3V0b2ZmID0gbmV3IERhdGUoKTsNCiAgICAgICAgY3V0b2ZmLnNldERhdGUoY3V0b2ZmLmdldERhdGUoKSAtIGZpbHRlckRheXMpOw0KICAgICAgICBjdXRvZmZEYXRlU3RyID0gY3V0b2ZmLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXTsNCiAgICAgIH0NCg0KICAgICAgdmFyIGZpbHRlcmVkRGF0ZXMgPSBbXTsNCiAgICAgIHZhciBmaWx0ZXJlZEludGVu",
    "c2l0eSA9IFtdOw0KICAgICAgdmFyIGZpbHRlcmVkUTMzID0gW107DQogICAgICB2YXIgZmlsdGVyZWRROTAgPSBbXTsNCg0KICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjb250aW51b3VzRGF0ZXMubGVuZ3RoOyBqKyspIHsNCiAgICAgICAgdmFyIGRTdHIgPSBjb250aW51b3VzRGF0ZXNbal07DQogICAgICAgIGlmICghY3V0b2ZmRGF0ZVN0ciB8fCBkU3RyID49IGN1dG9mZkRhdGVTdHIpIHsNCiAgICAgICAgICBmaWx0ZXJlZERhdGVzLnB1c2goZFN0cik7DQogICAgICAgICAgZmlsdGVyZWRJbnRlbnNpdHkucHVzaChkYWlseUludGVuc2l0eVtqXSk7DQogICAgICAgICAgZmlsdGVyZWRRMzMucHVzaChxMzMpOw0KICAgICAgICAgIGZpbHRlcmVkUTkwLnB1c2gocTkwKTsNCiAgICAgICAgfQ0KICAgICAgfQ0KDQogICAgICAvLyBJbmRpdmlkdWFsIHNlc3Npb24gc2NhdHRlciBwb2ludHMNCiAgICAgIHZhciBzY2F0dGVyUG9pbnRzID0gW107DQogICAgICBzZXNzaW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHMpIHsNCiAgICAgICAgaWYgKCFjdXRvZmZEYXRlU3RyIHx8IHMuZGF0ZSA+PSBjdXRvZmZEYXRlU3RyKSB7DQogICAgICAgICAgc2NhdHRlclBvaW50cy5wdXNoKHsNCiAgICAgICAgICAgIHg6IHMuZGF0ZSwNCiAgICAgICAgICAgIGRhdGU6IHMuZGF0ZSwNCiAgICAgICAgICAgIHk6IHMuZHVyYXRpb24sDQogICAgICAgICAgICBzdHJlc3M6IHMuc3RyZXNzLA0KICAgICAgICAgICAgdGltZTogcy50aW1lLA0KICAg",
    "ICAgICAgICAgbm90ZXM6IHMubm90ZXMNCiAgICAgICAgICB9KTsNCiAgICAgICAgfQ0KICAgICAgfSk7DQoNCiAgICAgIC8vIEF3YXkgc3RheXMgYW5ub3RhdGlvbnMgLSBzdHJpY3RseSBjbGFtcGVkIHRvIHZpc2libGUgaW5kZXggYm91bmRhcmllcw0KICAgICAgdmFyIGF3YXlBbm5vdGF0aW9ucyA9IHt9Ow0KICAgICAgKGF3YXlMaXN0IHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKGF3LCBpZHgpIHsNCiAgICAgICAgaWYgKCFhdy5zdGFydERhdGUgfHwgIWF3LmVuZERhdGUpIHJldHVybjsNCiAgICAgICAgdmFyIHNEYXRlID0gYXcuc3RhcnREYXRlOw0KICAgICAgICB2YXIgZURhdGUgPSBhdy5lbmREYXRlOw0KICAgICAgICBpZiAoc0RhdGUgPiBlRGF0ZSkgew0KICAgICAgICAgIHZhciB0bXAgPSBzRGF0ZTsgc0RhdGUgPSBlRGF0ZTsgZURhdGUgPSB0bXA7DQogICAgICAgIH0NCg0KICAgICAgICB2YXIgbWluVmlzaWJsZSA9IGZpbHRlcmVkRGF0ZXNbMF07DQogICAgICAgIHZhciBtYXhWaXNpYmxlID0gZmlsdGVyZWREYXRlc1tmaWx0ZXJlZERhdGVzLmxlbmd0aCAtIDFdOw0KDQogICAgICAgIC8vIElmIHN0YXkgaXMgY29tcGxldGVseSBvdXRzaWRlIHZpc2libGUgcmFuZ2UsIHNraXANCiAgICAgICAgaWYgKGVEYXRlIDwgbWluVmlzaWJsZSB8fCBzRGF0ZSA+IG1heFZpc2libGUpIHJldHVybjsNCg0KICAgICAgICAvLyBDbGFtcCB0byB2aXNpYmxlIHJhbmdlDQogICAgICAgIHZhciBlZmZlY3RpdmVTdGFydCA9",
    "IChzRGF0ZSA8IG1pblZpc2libGUpID8gbWluVmlzaWJsZSA6IHNEYXRlOw0KICAgICAgICB2YXIgZWZmZWN0aXZlRW5kID0gKGVEYXRlID4gbWF4VmlzaWJsZSkgPyBtYXhWaXNpYmxlIDogZURhdGU7DQoNCiAgICAgICAgdmFyIHN0YXJ0SWR4ID0gZmlsdGVyZWREYXRlcy5pbmRleE9mKGVmZmVjdGl2ZVN0YXJ0KTsNCiAgICAgICAgaWYgKHN0YXJ0SWR4ID09PSAtMSkgew0KICAgICAgICAgIGZvciAodmFyIGQgPSAwOyBkIDwgZmlsdGVyZWREYXRlcy5sZW5ndGg7IGQrKykgew0KICAgICAgICAgICAgaWYgKGZpbHRlcmVkRGF0ZXNbZF0gPj0gZWZmZWN0aXZlU3RhcnQpIHsgc3RhcnRJZHggPSBkOyBicmVhazsgfQ0KICAgICAgICAgIH0NCiAgICAgICAgfQ0KICAgICAgICB2YXIgZW5kSWR4ID0gZmlsdGVyZWREYXRlcy5pbmRleE9mKGVmZmVjdGl2ZUVuZCk7DQogICAgICAgIGlmIChlbmRJZHggPT09IC0xKSB7DQogICAgICAgICAgZm9yICh2YXIgZCA9IGZpbHRlcmVkRGF0ZXMubGVuZ3RoIC0gMTsgZCA+PSAwOyBkLS0pIHsNCiAgICAgICAgICAgIGlmIChmaWx0ZXJlZERhdGVzW2RdIDw9IGVmZmVjdGl2ZUVuZCkgeyBlbmRJZHggPSBkOyBicmVhazsgfQ0KICAgICAgICAgIH0NCiAgICAgICAgfQ0KDQogICAgICAgIGlmIChzdGFydElkeCA9PT0gLTEpIHN0YXJ0SWR4ID0gMDsNCiAgICAgICAgaWYgKGVuZElkeCA9PT0gLTEpIGVuZElkeCA9IGZpbHRlcmVkRGF0ZXMubGVuZ3RoIC0gMTsNCiAgICAgICAgaWYgKGVu",
    "ZElkeCA8IHN0YXJ0SWR4KSBlbmRJZHggPSBzdGFydElkeDsNCg0KICAgICAgICB2YXIgbG9jU3R5bGUgPSBMT0NBVElPTl9DT0xPUlNbYXcubG9jYXRpb25dIHx8IExPQ0FUSU9OX0NPTE9SU1si15DXl9eoIOKcqCJdOw0KICAgICAgICBhd2F5QW5ub3RhdGlvbnNbJ2F3YXlfJyArIGlkeF0gPSB7DQogICAgICAgICAgdHlwZTogJ2JveCcsDQogICAgICAgICAgeE1pbjogc3RhcnRJZHgsDQogICAgICAgICAgeE1heDogZW5kSWR4LA0KICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogbG9jU3R5bGUucmdiYSwNCiAgICAgICAgICBib3JkZXJXaWR0aDogMCwNCiAgICAgICAgICBsYWJlbDogew0KICAgICAgICAgICAgZGlzcGxheTogdHJ1ZSwNCiAgICAgICAgICAgIGNvbnRlbnQ6ICfwn4+hICcgKyBhdy5sb2NhdGlvbiwNCiAgICAgICAgICAgIHBvc2l0aW9uOiB7IHg6ICdzdGFydCcsIHk6ICdzdGFydCcgfSwNCiAgICAgICAgICAgIGZvbnQ6IHsgZmFtaWx5OiAnUnViaWsnLCBzaXplOiAxMCwgd2VpZ2h0OiAnYm9sZCcgfSwNCiAgICAgICAgICAgIGNvbG9yOiBsb2NTdHlsZS5jb2xvciwNCiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMC44NSknLA0KICAgICAgICAgICAgcGFkZGluZzogNCwNCiAgICAgICAgICAgIGJvcmRlclJhZGl1czogNA0KICAgICAgICAgIH0NCiAgICAgICAgfTsNCiAgICAgIH0pOw0KDQogICAgICByZXR1cm4gew0KICAgICAgICBkYWlseURhdGVzOiBm",
    "aWx0ZXJlZERhdGVzLA0KICAgICAgICBpbnRlbnNpdHlWYWxzOiBmaWx0ZXJlZEludGVuc2l0eSwNCiAgICAgICAgcTMzVmFsczogZmlsdGVyZWRRMzMsDQogICAgICAgIHE5MFZhbHM6IGZpbHRlcmVkUTkwLA0KICAgICAgICBzY2F0dGVyUG9pbnRzOiBzY2F0dGVyUG9pbnRzLA0KICAgICAgICBhd2F5Qm94ZXM6IGF3YXlBbm5vdGF0aW9ucywNCiAgICAgICAgcTMzVmFsOiBxMzMsDQogICAgICAgIHE5MFZhbDogcTkwDQogICAgICB9Ow0KICAgIH0NCg0KICAgIGZ1bmN0aW9uIHJlbmRlclRyYWluaW5nQ2hhcnQoKSB7DQogICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RyYWluaW5nQ2hhcnQnKTsNCiAgICAgIGlmICghY2FudmFzKSByZXR1cm47DQogICAgICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7DQoNCiAgICAgIHZhciBtZXRyaWNzID0gY29tcHV0ZVNlcGFyYXRpb25NZXRyaWNzKHN0YXRlLmRhdGEudHJhaW5pbmcsIHN0YXRlLmRhdGEuYXdheUxvZywgc3RhdGUuY2hhcnRSYW5nZURheXMpOw0KDQogICAgICBpZiAoc3RhdGUuY2hhcnRzLnRyYWluaW5nKSB7DQogICAgICAgIHN0YXRlLmNoYXJ0cy50cmFpbmluZy5kZXN0cm95KCk7DQogICAgICB9DQoNCiAgICAgIHN0YXRlLmNoYXJ0cy50cmFpbmluZyA9IG5ldyBDaGFydChjdHgsIHsNCiAgICAgICAgdHlwZTogJ2xpbmUnLA0KICAgICAgICBkYXRhOiB7DQogICAgICAgICAgbGFiZWxzOiBtZXRyaWNzLmRhaWx5",
    "RGF0ZXMsDQogICAgICAgICAgZGF0YXNldHM6IFsNCiAgICAgICAgICAgIC8vIEludGVuc2l0eSBMaW5lDQogICAgICAgICAgICB7DQogICAgICAgICAgICAgIGxhYmVsOiAn16LXpteZ157XldeqINee16nXlden15zXnNeqJywNCiAgICAgICAgICAgICAgZGF0YTogbWV0cmljcy5pbnRlbnNpdHlWYWxzLA0KICAgICAgICAgICAgICBib3JkZXJDb2xvcjogJyMxZTI5M2InLA0KICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDMwLCA0MSwgNTksIDAuMDUpJywNCiAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDMsDQogICAgICAgICAgICAgIHRlbnNpb246IDAuMywNCiAgICAgICAgICAgICAgcG9pbnRSYWRpdXM6IDAsDQogICAgICAgICAgICAgIG9yZGVyOiAyDQogICAgICAgICAgICB9LA0KICAgICAgICAgICAgLy8gUTMzIFpvbmUgKEJsdWUpDQogICAgICAgICAgICB7DQogICAgICAgICAgICAgIGxhYmVsOiAn16LXldee16Eg16fXnCAo15DXl9eV15bXldefIDMzKScsDQogICAgICAgICAgICAgIGRhdGE6IG1ldHJpY3MucTMzVmFscywNCiAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICd0cmFuc3BhcmVudCcsDQogICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JnYmEoNTksIDEzMCwgMjQ2LCAwLjEyKScsDQogICAgICAgICAgICAgIGZpbGw6ICdvcmlnaW4nLA0KICAgICAgICAgICAgICBwb2ludFJhZGl1czogMCwNCiAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDAsDQogICAgICAgICAg",
    "ICAgIG9yZGVyOiA1DQogICAgICAgICAgICB9LA0KICAgICAgICAgICAgLy8gUTkwIFpvbmUgKEdyZWVuKQ0KICAgICAgICAgICAgew0KICAgICAgICAgICAgICBsYWJlbDogJ9eY15XXldeXINeQ15nXk9eZ15DXnNeZICjXkNeX15XXlteV158gOTApJywNCiAgICAgICAgICAgICAgZGF0YTogbWV0cmljcy5xOTBWYWxzLA0KICAgICAgICAgICAgICBib3JkZXJDb2xvcjogJ3RyYW5zcGFyZW50JywNCiAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAncmdiYSgzNCwgMTk3LCA5NCwgMC4xMiknLA0KICAgICAgICAgICAgICBmaWxsOiAnLTEnLA0KICAgICAgICAgICAgICBwb2ludFJhZGl1czogMCwNCiAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDAsDQogICAgICAgICAgICAgIG9yZGVyOiA0DQogICAgICAgICAgICB9LA0KICAgICAgICAgICAgLy8gSW5kaXZpZHVhbCBTZXNzaW9ucyBTY2F0dGVyIERvdHMNCiAgICAgICAgICAgIHsNCiAgICAgICAgICAgICAgdHlwZTogJ3NjYXR0ZXInLA0KICAgICAgICAgICAgICBsYWJlbDogJ9eQ15nXnteV16DXmdedINeR15XXk9eT15nXnScsDQogICAgICAgICAgICAgIGRhdGE6IG1ldHJpY3Muc2NhdHRlclBvaW50cywNCiAgICAgICAgICAgICAgcG9pbnRSYWRpdXM6IDcsDQogICAgICAgICAgICAgIHBvaW50SG92ZXJSYWRpdXM6IDksDQogICAgICAgICAgICAgIHBvaW50Qm9yZGVyQ29sb3I6ICcjZmZmZmZmJywNCiAgICAgICAgICAgICAgcG9pbnRCb3JkZXJXaWR0aDog",
    "MS41LA0KICAgICAgICAgICAgICBwb2ludEJhY2tncm91bmRDb2xvcjogZnVuY3Rpb24oY29udGV4dCkgew0KICAgICAgICAgICAgICAgIHZhciBzdHJlc3MgPSBjb250ZXh0LnJhdz8uc3RyZXNzIHx8IDM7DQogICAgICAgICAgICAgICAgaWYgKHN0cmVzcyA9PT0gMSkgcmV0dXJuICcjMjJjNTVlJzsgLy8gR3JlZW4NCiAgICAgICAgICAgICAgICBpZiAoc3RyZXNzID09PSAyKSByZXR1cm4gJyM4NGNjMTYnOyAvLyBMaW1lDQogICAgICAgICAgICAgICAgaWYgKHN0cmVzcyA9PT0gMykgcmV0dXJuICcjZWFiMzA4JzsgLy8gQW1iZXINCiAgICAgICAgICAgICAgICBpZiAoc3RyZXNzID09PSA0KSByZXR1cm4gJyNmOTczMTYnOyAvLyBPcmFuZ2UNCiAgICAgICAgICAgICAgICByZXR1cm4gJyNlZjQ0NDQnOyAvLyBSZWQNCiAgICAgICAgICAgICAgfSwNCiAgICAgICAgICAgICAgb3JkZXI6IDENCiAgICAgICAgICAgIH0NCiAgICAgICAgICBdDQogICAgICAgIH0sDQogICAgICAgIG9wdGlvbnM6IHsNCiAgICAgICAgICByZXNwb25zaXZlOiB0cnVlLA0KICAgICAgICAgIG1haW50YWluQXNwZWN0UmF0aW86IGZhbHNlLA0KICAgICAgICAgIGludGVyYWN0aW9uOiB7DQogICAgICAgICAgICBtb2RlOiAnbmVhcmVzdCcsDQogICAgICAgICAgICBpbnRlcnNlY3Q6IGZhbHNlDQogICAgICAgICAgfSwNCiAgICAgICAgICBzY2FsZXM6IHsNCiAgICAgICAgICAgIHg6IHsNCiAgICAgICAgICAgICAgZ3JpZDogeyBkaXNwbGF5OiBm",
    "YWxzZSB9LA0KICAgICAgICAgICAgICB0aWNrczogew0KICAgICAgICAgICAgICAgIGZvbnQ6IHsgZmFtaWx5OiAnUnViaWsnLCBzaXplOiAxMCB9LA0KICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbih2YWwsIGluZGV4KSB7DQogICAgICAgICAgICAgICAgICB2YXIgZFN0ciA9IHRoaXMuZ2V0TGFiZWxGb3JWYWx1ZSh2YWwpOw0KICAgICAgICAgICAgICAgICAgaWYgKCFkU3RyKSByZXR1cm4gJyc7DQogICAgICAgICAgICAgICAgICB2YXIgcCA9IGRTdHIuc3BsaXQoJy0nKTsNCiAgICAgICAgICAgICAgICAgIHJldHVybiBwWzJdICsgJy8nICsgcFsxXTsNCiAgICAgICAgICAgICAgICB9DQogICAgICAgICAgICAgIH0NCiAgICAgICAgICAgIH0sDQogICAgICAgICAgICB5OiB7DQogICAgICAgICAgICAgIGJlZ2luQXRaZXJvOiB0cnVlLA0KICAgICAgICAgICAgICB0aXRsZTogew0KICAgICAgICAgICAgICAgIGRpc3BsYXk6IHRydWUsDQogICAgICAgICAgICAgICAgdGV4dDogJ9ei15XXntehINee16nXlden15zXnCAvINee16nXmiAo16nXoteV16opJywNCiAgICAgICAgICAgICAgICBmb250OiB7IGZhbWlseTogJ1J1YmlrJywgc2l6ZTogMTEsIHdlaWdodDogJzYwMCcgfQ0KICAgICAgICAgICAgICB9LA0KICAgICAgICAgICAgICBncmlkOiB7IGNvbG9yOiAnI2YxZjVmOScgfSwNCiAgICAgICAgICAgICAgdGlja3M6IHsgZm9udDogeyBmYW1pbHk6ICdSdWJpaycsIHNpemU6IDEwIH0gfQ0KICAgICAg",
    "ICAgICAgfQ0KICAgICAgICAgIH0sDQogICAgICAgICAgcGx1Z2luczogew0KICAgICAgICAgICAgbGVnZW5kOiB7DQogICAgICAgICAgICAgIGRpc3BsYXk6IGZhbHNlDQogICAgICAgICAgICB9LA0KICAgICAgICAgICAgYW5ub3RhdGlvbjogew0KICAgICAgICAgICAgICBhbm5vdGF0aW9uczogbWV0cmljcy5hd2F5Qm94ZXMNCiAgICAgICAgICAgIH0sDQogICAgICAgICAgICB0b29sdGlwOiB7DQogICAgICAgICAgICAgIHJ0bDogdHJ1ZSwNCiAgICAgICAgICAgICAgdGV4dERpcmVjdGlvbjogJ3J0bCcsDQogICAgICAgICAgICAgIHRpdGxlRm9udDogeyBmYW1pbHk6ICdSdWJpaycsIHNpemU6IDEyLCB3ZWlnaHQ6ICdib2xkJyB9LA0KICAgICAgICAgICAgICBib2R5Rm9udDogeyBmYW1pbHk6ICdSdWJpaycsIHNpemU6IDExIH0sDQogICAgICAgICAgICAgIGNhbGxiYWNrczogew0KICAgICAgICAgICAgICAgIHRpdGxlOiBmdW5jdGlvbihpdGVtcykgew0KICAgICAgICAgICAgICAgICAgaWYgKCFpdGVtcyB8fCBpdGVtcy5sZW5ndGggPT09IDApIHJldHVybiAnJzsNCiAgICAgICAgICAgICAgICAgIHZhciBpdGVtID0gaXRlbXNbMF07DQogICAgICAgICAgICAgICAgICB2YXIgcmF3ID0gaXRlbS5yYXc7DQogICAgICAgICAgICAgICAgICBpZiAocmF3ICYmIHR5cGVvZiByYXcgPT09ICdvYmplY3QnICYmIChyYXcuZGF0ZSB8fCByYXcueCkpIHsNCiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICfXqteQ16jXmdea",
    "OiAnICsgKHJhdy5kYXRlIHx8IHJhdy54KTsNCiAgICAgICAgICAgICAgICAgIH0NCiAgICAgICAgICAgICAgICAgIHJldHVybiAn16rXkNeo15nXmjogJyArIGl0ZW0ubGFiZWw7DQogICAgICAgICAgICAgICAgfSwNCiAgICAgICAgICAgICAgICBsYWJlbDogZnVuY3Rpb24oY29udGV4dCkgew0KICAgICAgICAgICAgICAgICAgaWYgKGNvbnRleHQuZGF0YXNldC50eXBlID09PSAnc2NhdHRlcicpIHsNCiAgICAgICAgICAgICAgICAgICAgdmFyIHJhdyA9IGNvbnRleHQucmF3Ow0KICAgICAgICAgICAgICAgICAgICB2YXIgc3RyZXNzSW5mbyA9IFNUUkVTU19NQVBbcmF3LnN0cmVzc10gfHwgU1RSRVNTX01BUFszXTsNCiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsNCiAgICAgICAgICAgICAgICAgICAgICAn4o+zINee16nXmjogJyArIHJhdy55ICsgJyDXqdei15XXqicgKyAocmF3LnRpbWUgPyAnICgnICsgcmF3LnRpbWUgKyAnKScgOiAnJyksDQogICAgICAgICAgICAgICAgICAgICAgJ/CfmLAg16jXnteqINec15fXpTogJyArIHN0cmVzc0luZm8ubGFiZWwsDQogICAgICAgICAgICAgICAgICAgICAgcmF3Lm5vdGVzID8gJ/Cfk50g15TXoteo15XXqjogJyArIHJhdy5ub3RlcyA6ICcnDQogICAgICAgICAgICAgICAgICAgIF0uZmlsdGVyKEJvb2xlYW4pOw0KICAgICAgICAgICAgICAgICAgfQ0KICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGF0YXNldC5sYWJlbCArICc6ICcgKyBOdW1iZXIoY29u",
    "dGV4dC5yYXcpLnRvRml4ZWQoMik7DQogICAgICAgICAgICAgICAgfQ0KICAgICAgICAgICAgICB9DQogICAgICAgICAgICB9DQogICAgICAgICAgfQ0KICAgICAgICB9DQogICAgICB9KTsNCiAgICB9DQoNCiAgICBmdW5jdGlvbiByZW5kZXJGZWVkaW5nQ2hhcnQoKSB7DQogICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZlZWRpbmdDaGFydCcpOw0KICAgICAgaWYgKCFjYW52YXMpIHJldHVybjsNCiAgICAgIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTsNCg0KICAgICAgdmFyIGZlZWRpbmdzID0gc3RhdGUuZGF0YS5mZWVkaW5nIHx8IFtdOw0KICAgICAgLy8gR3JvdXAgYnkgZGF0ZSBhbmQgZmluaXNoZWQgc3RhdHVzDQogICAgICB2YXIgZGFpbHlNYXAgPSB7fTsNCiAgICAgIGZlZWRpbmdzLmZvckVhY2goZnVuY3Rpb24oZikgew0KICAgICAgICBpZiAoIWYuZGF0ZSkgcmV0dXJuOw0KICAgICAgICBpZiAoIWRhaWx5TWFwW2YuZGF0ZV0pIHsNCiAgICAgICAgICBkYWlseU1hcFtmLmRhdGVdID0geyBmaW5pc2hlZDogMCwgdW5maW5pc2hlZDogMCB9Ow0KICAgICAgICB9DQogICAgICAgIHZhciBhbXQgPSBwYXJzZUZsb2F0KGYuYW1vdW50KSB8fCAwOw0KICAgICAgICBpZiAoZi5maW5pc2hlZCA9PT0gJ9eb158nKSB7DQogICAgICAgICAgZGFpbHlNYXBbZi5kYXRlXS5maW5pc2hlZCArPSBhbXQ7DQogICAgICAgIH0gZWxzZSB7DQogICAgICAgICAgZGFpbHlNYXBbZi5k",
    "YXRlXS51bmZpbmlzaGVkICs9IGFtdDsNCiAgICAgICAgfQ0KICAgICAgfSk7DQoNCiAgICAgIHZhciBzb3J0ZWREYXRlcyA9IE9iamVjdC5rZXlzKGRhaWx5TWFwKS5zb3J0KCk7DQogICAgICAvLyBTaG93IGxhc3QgMTQgZGF5cw0KICAgICAgdmFyIHJlY2VudERhdGVzID0gc29ydGVkRGF0ZXMuc2xpY2UoLTE0KTsNCg0KICAgICAgdmFyIGZpbmlzaGVkRGF0YSA9IHJlY2VudERhdGVzLm1hcChmdW5jdGlvbihkKSB7IHJldHVybiBkYWlseU1hcFtkXS5maW5pc2hlZDsgfSk7DQogICAgICB2YXIgdW5maW5pc2hlZERhdGEgPSByZWNlbnREYXRlcy5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZGFpbHlNYXBbZF0udW5maW5pc2hlZDsgfSk7DQoNCiAgICAgIGlmIChzdGF0ZS5jaGFydHMuZmVlZGluZykgew0KICAgICAgICBzdGF0ZS5jaGFydHMuZmVlZGluZy5kZXN0cm95KCk7DQogICAgICB9DQoNCiAgICAgIHN0YXRlLmNoYXJ0cy5mZWVkaW5nID0gbmV3IENoYXJ0KGN0eCwgew0KICAgICAgICB0eXBlOiAnYmFyJywNCiAgICAgICAgZGF0YTogew0KICAgICAgICAgIGxhYmVsczogcmVjZW50RGF0ZXMsDQogICAgICAgICAgZGF0YXNldHM6IFsNCiAgICAgICAgICAgIHsNCiAgICAgICAgICAgICAgbGFiZWw6ICfXodeZ15nXnteUICjXm9efKSDwn5+iJywNCiAgICAgICAgICAgICAgZGF0YTogZmluaXNoZWREYXRhLA0KICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjMjJjNTVlJywNCiAgICAgICAgICAgICAg",
    "Ym9yZGVyUmFkaXVzOiA2DQogICAgICAgICAgICB9LA0KICAgICAgICAgICAgew0KICAgICAgICAgICAgICBsYWJlbDogJ9ec15Ag16HXmdeZ157XlCAo15zXkCkg8J+UtCcsDQogICAgICAgICAgICAgIGRhdGE6IHVuZmluaXNoZWREYXRhLA0KICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjZWY0NDQ0JywNCiAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiA2DQogICAgICAgICAgICB9DQogICAgICAgICAgXQ0KICAgICAgICB9LA0KICAgICAgICBvcHRpb25zOiB7DQogICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSwNCiAgICAgICAgICBtYWludGFpbkFzcGVjdFJhdGlvOiBmYWxzZSwNCiAgICAgICAgICBzY2FsZXM6IHsNCiAgICAgICAgICAgIHg6IHsNCiAgICAgICAgICAgICAgc3RhY2tlZDogdHJ1ZSwNCiAgICAgICAgICAgICAgZ3JpZDogeyBkaXNwbGF5OiBmYWxzZSB9LA0KICAgICAgICAgICAgICB0aWNrczogew0KICAgICAgICAgICAgICAgIGZvbnQ6IHsgZmFtaWx5OiAnUnViaWsnLCBzaXplOiAxMCB9LA0KICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbih2YWwpIHsNCiAgICAgICAgICAgICAgICAgIHZhciBkU3RyID0gdGhpcy5nZXRMYWJlbEZvclZhbHVlKHZhbCk7DQogICAgICAgICAgICAgICAgICBpZiAoIWRTdHIpIHJldHVybiAnJzsNCiAgICAgICAgICAgICAgICAgIHZhciBwID0gZFN0ci5zcGxpdCgnLScpOw0KICAgICAgICAgICAgICAgICAgcmV0dXJuIHBbMl0gKyAnLycg",
    "KyBwWzFdOw0KICAgICAgICAgICAgICAgIH0NCiAgICAgICAgICAgICAgfQ0KICAgICAgICAgICAgfSwNCiAgICAgICAgICAgIHk6IHsNCiAgICAgICAgICAgICAgc3RhY2tlZDogdHJ1ZSwNCiAgICAgICAgICAgICAgYmVnaW5BdFplcm86IHRydWUsDQogICAgICAgICAgICAgIHRpdGxlOiB7DQogICAgICAgICAgICAgICAgZGlzcGxheTogdHJ1ZSwNCiAgICAgICAgICAgICAgICB0ZXh0OiAn15vXnteV16ogKNeb15XXodeV16opJywNCiAgICAgICAgICAgICAgICBmb250OiB7IGZhbWlseTogJ1J1YmlrJywgc2l6ZTogMTEsIHdlaWdodDogJzYwMCcgfQ0KICAgICAgICAgICAgICB9LA0KICAgICAgICAgICAgICBncmlkOiB7IGNvbG9yOiAnI2YxZjVmOScgfSwNCiAgICAgICAgICAgICAgdGlja3M6IHsgZm9udDogeyBmYW1pbHk6ICdSdWJpaycsIHNpemU6IDEwIH0gfQ0KICAgICAgICAgICAgfQ0KICAgICAgICAgIH0sDQogICAgICAgICAgcGx1Z2luczogew0KICAgICAgICAgICAgbGVnZW5kOiB7DQogICAgICAgICAgICAgIHJ0bDogdHJ1ZSwNCiAgICAgICAgICAgICAgdGV4dERpcmVjdGlvbjogJ3J0bCcsDQogICAgICAgICAgICAgIGxhYmVsczogeyBmb250OiB7IGZhbWlseTogJ1J1YmlrJywgc2l6ZTogMTEgfSB9DQogICAgICAgICAgICB9LA0KICAgICAgICAgICAgdG9vbHRpcDogew0KICAgICAgICAgICAgICBydGw6IHRydWUsDQogICAgICAgICAgICAgIHRleHREaXJlY3Rpb246ICdydGwnLA0KICAgICAgICAg",
    "ICAgICB0aXRsZUZvbnQ6IHsgZmFtaWx5OiAnUnViaWsnLCBzaXplOiAxMiB9LA0KICAgICAgICAgICAgICBib2R5Rm9udDogeyBmYW1pbHk6ICdSdWJpaycsIHNpemU6IDExIH0NCiAgICAgICAgICAgIH0NCiAgICAgICAgICB9DQogICAgICAgIH0NCiAgICAgIH0pOw0KICAgIH0NCg0KICAgIGZ1bmN0aW9uIHJlbmRlclRhc2tzQ2hhcnQoKSB7DQogICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Rhc2tzQ2hhcnQnKTsNCiAgICAgIGlmICghY2FudmFzKSByZXR1cm47DQogICAgICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7DQoNCiAgICAgIHZhciB0YXNrTG9ncyA9IChzdGF0ZS5kYXRhLnRhc2tMb2dzIHx8IFtdKS5zbGljZSgpLnNvcnQoZnVuY3Rpb24oYSwgYikgew0KICAgICAgICByZXR1cm4gYS5kYXRlLmxvY2FsZUNvbXBhcmUoYi5kYXRlKTsNCiAgICAgIH0pOw0KDQogICAgICAvLyBEaXN0aW5jdCB0YXNrcyB3aXRoIGNvbG9yIGFzc2lnbm1lbnQNCiAgICAgIHZhciB0YXNrQ29sb3JzID0gWycjNGY0NmU1JywgJyMwNmI2ZDQnLCAnIzEwYjk4MScsICcjZjU5ZTBiJywgJyNlYzQ4OTknLCAnIzhiNWNmNiddOw0KICAgICAgdmFyIHRhc2tOYW1lcyA9IEFycmF5LmZyb20obmV3IFNldCh0YXNrTG9ncy5tYXAoZnVuY3Rpb24obCkgeyByZXR1cm4gbC50YXNrTmFtZTsgfSkpKTsNCg0KICAgICAgdmFyIGRhdGFzZXRzID0gdGFza05hbWVzLm1hcChmdW5jdGlvbih0TmFt",
    "ZSwgaWR4KSB7DQogICAgICAgIHZhciBjb2xvciA9IHRhc2tDb2xvcnNbaWR4ICUgdGFza0NvbG9ycy5sZW5ndGhdOw0KICAgICAgICB2YXIgcG9pbnRzID0gdGFza0xvZ3MuZmlsdGVyKGZ1bmN0aW9uKGwpIHsgcmV0dXJuIGwudGFza05hbWUgPT09IHROYW1lOyB9KS5tYXAoZnVuY3Rpb24obCkgew0KICAgICAgICAgIHJldHVybiB7DQogICAgICAgICAgICB4OiBsLmRhdGUsDQogICAgICAgICAgICB5OiBsLnN1Y2Nlc3MsDQogICAgICAgICAgICBub3RlczogbC5ub3Rlcw0KICAgICAgICAgIH07DQogICAgICAgIH0pOw0KDQogICAgICAgIHJldHVybiB7DQogICAgICAgICAgbGFiZWw6IHROYW1lLA0KICAgICAgICAgIGRhdGE6IHBvaW50cywNCiAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGNvbG9yLA0KICAgICAgICAgIGJvcmRlckNvbG9yOiBjb2xvciwNCiAgICAgICAgICBwb2ludFJhZGl1czogNiwNCiAgICAgICAgICBwb2ludEhvdmVyUmFkaXVzOiA4DQogICAgICAgIH07DQogICAgICB9KTsNCg0KICAgICAgaWYgKHN0YXRlLmNoYXJ0cy50YXNrcykgew0KICAgICAgICBzdGF0ZS5jaGFydHMudGFza3MuZGVzdHJveSgpOw0KICAgICAgfQ0KDQogICAgICBzdGF0ZS5jaGFydHMudGFza3MgPSBuZXcgQ2hhcnQoY3R4LCB7DQogICAgICAgIHR5cGU6ICdzY2F0dGVyJywNCiAgICAgICAgZGF0YTogeyBkYXRhc2V0czogZGF0YXNldHMgfSwNCiAgICAgICAgb3B0aW9uczogew0KICAgICAgICAgIHJlc3BvbnNpdmU6",
    "IHRydWUsDQogICAgICAgICAgbWFpbnRhaW5Bc3BlY3RSYXRpbzogZmFsc2UsDQogICAgICAgICAgc2NhbGVzOiB7DQogICAgICAgICAgICB4OiB7DQogICAgICAgICAgICAgIGdyaWQ6IHsgZGlzcGxheTogZmFsc2UgfSwNCiAgICAgICAgICAgICAgdGlja3M6IHsNCiAgICAgICAgICAgICAgICBmb250OiB7IGZhbWlseTogJ1J1YmlrJywgc2l6ZTogMTAgfSwNCiAgICAgICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24odmFsKSB7DQogICAgICAgICAgICAgICAgICB2YXIgZFN0ciA9IHRoaXMuZ2V0TGFiZWxGb3JWYWx1ZSh2YWwpOw0KICAgICAgICAgICAgICAgICAgaWYgKCFkU3RyKSByZXR1cm4gJyc7DQogICAgICAgICAgICAgICAgICB2YXIgcCA9IGRTdHIuc3BsaXQoJy0nKTsNCiAgICAgICAgICAgICAgICAgIHJldHVybiBwWzJdICsgJy8nICsgcFsxXTsNCiAgICAgICAgICAgICAgICB9DQogICAgICAgICAgICAgIH0NCiAgICAgICAgICAgIH0sDQogICAgICAgICAgICB5OiB7DQogICAgICAgICAgICAgIG1pbjogMC41LA0KICAgICAgICAgICAgICBtYXg6IDUuNSwNCiAgICAgICAgICAgICAgdGlja3M6IHsNCiAgICAgICAgICAgICAgICBzdGVwU2l6ZTogMSwNCiAgICAgICAgICAgICAgICBmb250OiB7IGZhbWlseTogJ1J1YmlrJywgc2l6ZTogMTAgfQ0KICAgICAgICAgICAgICB9LA0KICAgICAgICAgICAgICB0aXRsZTogew0KICAgICAgICAgICAgICAgIGRpc3BsYXk6IHRydWUsDQogICAgICAgICAgICAg",
    "ICAgdGV4dDogJ9em15nXldefINeQ15nXm9eV16ogKDEtNSknLA0KICAgICAgICAgICAgICAgIGZvbnQ6IHsgZmFtaWx5OiAnUnViaWsnLCBzaXplOiAxMSwgd2VpZ2h0OiAnNjAwJyB9DQogICAgICAgICAgICAgIH0sDQogICAgICAgICAgICAgIGdyaWQ6IHsgY29sb3I6ICcjZjFmNWY5JyB9DQogICAgICAgICAgICB9DQogICAgICAgICAgfSwNCiAgICAgICAgICBwbHVnaW5zOiB7DQogICAgICAgICAgICBsZWdlbmQ6IHsNCiAgICAgICAgICAgICAgcnRsOiB0cnVlLA0KICAgICAgICAgICAgICB0ZXh0RGlyZWN0aW9uOiAncnRsJywNCiAgICAgICAgICAgICAgbGFiZWxzOiB7IGZvbnQ6IHsgZmFtaWx5OiAnUnViaWsnLCBzaXplOiAxMSB9IH0NCiAgICAgICAgICAgIH0sDQogICAgICAgICAgICB0b29sdGlwOiB7DQogICAgICAgICAgICAgIHJ0bDogdHJ1ZSwNCiAgICAgICAgICAgICAgdGV4dERpcmVjdGlvbjogJ3J0bCcsDQogICAgICAgICAgICAgIHRpdGxlRm9udDogeyBmYW1pbHk6ICdSdWJpaycsIHNpemU6IDEyIH0sDQogICAgICAgICAgICAgIGJvZHlGb250OiB7IGZhbWlseTogJ1J1YmlrJywgc2l6ZTogMTEgfSwNCiAgICAgICAgICAgICAgY2FsbGJhY2tzOiB7DQogICAgICAgICAgICAgICAgbGFiZWw6IGZ1bmN0aW9uKGNvbnRleHQpIHsNCiAgICAgICAgICAgICAgICAgIHZhciByYXcgPSBjb250ZXh0LnJhdzsNCiAgICAgICAgICAgICAgICAgIHJldHVybiBbDQogICAgICAgICAgICAgICAgICAgIGNvbnRl",
    "eHQuZGF0YXNldC5sYWJlbCArICc6ICcgKyByYXcueSArICcvNScsDQogICAgICAgICAgICAgICAgICAgIHJhdy5ub3RlcyA/ICfwn5OdICcgKyByYXcubm90ZXMgOiAnJw0KICAgICAgICAgICAgICAgICAgXS5maWx0ZXIoQm9vbGVhbik7DQogICAgICAgICAgICAgICAgfQ0KICAgICAgICAgICAgICB9DQogICAgICAgICAgICB9DQogICAgICAgICAgfQ0KICAgICAgICB9DQogICAgICB9KTsNCiAgICB9DQoNCiAgICAvKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09DQogICAgICogSElTVE9SWSAmIENSVUQgSU5MSU5FIEVESVRJTkcgLyBERUxFVElORw0KICAgICAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8NCiAgICBmdW5jdGlvbiBzd2l0Y2hIaXN0b3J5RG9tYWluKGRvbWFpbikgew0KICAgICAgc3RhdGUuaGlzdG9yeURvbWFpbiA9IGRvbWFpbjsNCiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5oZG9tLWJ0bicpLmZvckVhY2goZnVuY3Rpb24oYikgew0KICAgICAgICBiLmNsYXNzTmFtZSA9ICdoZG9tLWJ0biBweC0zLjUgcHktMS41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LXNlbWlib2xkIGJnLXdoaXRlIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIHRleHQtc2xhdGUtNjAwIGhvdmVyOmJnLXNsYXRlLTUwIHdoaXRlc3Bh",
    "Y2Utbm93cmFwJzsNCiAgICAgIH0pOw0KICAgICAgdmFyIGFjdGl2ZUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdoZG9tLWJ0bi0nICsgZG9tYWluKTsNCiAgICAgIGlmIChhY3RpdmVCdG4pIHsNCiAgICAgICAgYWN0aXZlQnRuLmNsYXNzTmFtZSA9ICdoZG9tLWJ0biBweC0zLjUgcHktMS41IHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgYmctaW5kaWdvLTYwMCB0ZXh0LXdoaXRlIHNoYWRvdy1zbSB3aGl0ZXNwYWNlLW5vd3JhcCc7DQogICAgICB9DQogICAgICByZW5kZXJIaXN0b3J5TGlzdCgpOw0KICAgIH0NCg0KICAgIGZ1bmN0aW9uIHJlbmRlckhpc3RvcnlMaXN0KCkgew0KICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdoaXN0b3J5VGFibGVDb250YWluZXInKTsNCiAgICAgIHZhciBoZWFkZXJUZXh0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2hpc3RvcnlEb21haW5IZWFkZXInKTsNCiAgICAgIHZhciBiYWRnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdoaXN0b3J5Q291bnRCYWRnZScpOw0KICAgICAgaWYgKCFjb250YWluZXIpIHJldHVybjsNCg0KICAgICAgdmFyIGRvbWFpbiA9IHN0YXRlLmhpc3RvcnlEb21haW47DQogICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gJyc7DQoNCiAgICAgIGlmIChkb21haW4gPT09ICd0cmFpbmluZycpIHsNCiAgICAgICAgaGVhZGVyVGV4dC50ZXh0Q29udGVudCA9ICfXqNep15nXnteqINeQ15nXnteV16DX",
    "mdedINeQ15fXqNeV16DXmdedJzsNCiAgICAgICAgdmFyIGxpc3QgPSAoc3RhdGUuZGF0YS50cmFpbmluZyB8fCBbXSkuc2xpY2UoKS5yZXZlcnNlKCk7DQogICAgICAgIGJhZGdlLnRleHRDb250ZW50ID0gbGlzdC5sZW5ndGggKyAnINeQ15nXnteV16DXmdedJzsNCg0KICAgICAgICBpZiAobGlzdC5sZW5ndGggPT09IDApIHsNCiAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9InAtNiB0ZXh0LWNlbnRlciB0ZXh0LXNsYXRlLTQwMCB0ZXh0LXhzIj7XoteT15nXmdefINeQ15nXnyDXkNeZ157Xldeg15nXnSDXnteV16fXnNeY15nXnS48L2Rpdj4nOw0KICAgICAgICAgIHJldHVybjsNCiAgICAgICAgfQ0KDQogICAgICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7DQogICAgICAgICAgdmFyIHNJbmZvID0gU1RSRVNTX01BUFtpdGVtLnN0cmVzc0xldmVsXSB8fCBTVFJFU1NfTUFQWzNdOw0KICAgICAgICAgIHZhciBjYXJkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7DQogICAgICAgICAgY2FyZC5jbGFzc05hbWUgPSAncC0zLjUgc206cC00IGhvdmVyOmJnLXNsYXRlLTUwLzcwIHRyYW5zaXRpb24gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zJzsNCiAgICAgICAgICBjYXJkLmlubmVySFRNTCA9IGANCiAgICAgICAgICAgIDxkaXYgY2xhc3M9InNwYWNlLXktMSI+DQogICAgICAgICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVy",
    "IGdhcC0yIj4NCiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0iZm9udC1ib2xkIHRleHQtc2xhdGUtODAwIHRleHQtc20iPiR7aXRlbS5kYXRlfTwvc3Bhbj4NCiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTUwMCBmb250LXNlbWlib2xkIGRpci1sdHIiPuKPsCAke2l0ZW0udGltZSB8fCAnJ308L3NwYW4+DQogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQteHMgZm9udC1ib2xkIHRleHQtaW5kaWdvLTYwMCBiZy1pbmRpZ28tNTAgcHgtMiBweS0wLjUgcm91bmRlZC1tZCI+4o+zICR7aXRlbS5kdXJhdGlvbn0g16nXoteV16o8L3NwYW4+DQogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQtWzExcHhdIGZvbnQtYm9sZCBweC0yIHB5LTAuNSByb3VuZGVkLW1kICR7c0luZm8uYmd9ICR7c0luZm8udGV4dH0iPiR7c0luZm8ubGFiZWx9PC9zcGFuPg0KICAgICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgICAgJHtpdGVtLm5vdGVzID8gYDxwIGNsYXNzPSJ0ZXh0LXhzIHRleHQtc2xhdGUtNjAwIGxlYWRpbmctc251ZyI+8J+TnSAke2VzY2FwZUh0bWwoaXRlbS5ub3Rlcyl9PC9wPmAgOiAnJ30NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEiPg0KICAgICAgICAgICAgICA8YnV0dG9uIG9uY2xpY2s9Im9wZW5FZGl0TW9kYWwoJ1RyYWluaW5nJywgJHtpdGVtLnJvd0luZGV4fSki",
    "IHRpdGxlPSLXoteo15XXmiDXqdeV16jXlCINCiAgICAgICAgICAgICAgICBjbGFzcz0icC0yIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtaW5kaWdvLTYwMCBob3ZlcjpiZy1pbmRpZ28tNTAgcm91bmRlZC1sZyB0cmFuc2l0aW9uIj4NCiAgICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT0iZWRpdC0yIiBjbGFzcz0idy00IGgtNCI+PC9pPg0KICAgICAgICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJjb25maXJtRGVsZXRlKCdUcmFpbmluZycsICR7aXRlbS5yb3dJbmRleH0sICfXkNeZ157XldefINee16rXkNeo15nXmiAke2l0ZW0uZGF0ZX0gKCR7aXRlbS5kdXJhdGlvbn0g16nXoteV16opJykiIHRpdGxlPSLXnteX16cg16nXldeo15QiDQogICAgICAgICAgICAgICAgY2xhc3M9InAtMiB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXJlZC02MDAgaG92ZXI6YmctcmVkLTUwIHJvdW5kZWQtbGcgdHJhbnNpdGlvbiI+DQogICAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9InRyYXNoLTIiIGNsYXNzPSJ3LTQgaC00Ij48L2k+DQogICAgICAgICAgICAgIDwvYnV0dG9uPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgYDsNCiAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2FyZCk7DQogICAgICAgIH0pOw0KICAgICAgfSBlbHNlIGlmIChkb21haW4gPT09ICdmZWVkaW5nJykgew0KICAgICAgICBoZWFkZXJUZXh0LnRleHRDb250ZW50ID0gJ9eo16nX",
    "mdee16og15DXqNeV15fXldeqINeQ15fXqNeV16DXldeqJzsNCiAgICAgICAgdmFyIGxpc3QgPSAoc3RhdGUuZGF0YS5mZWVkaW5nIHx8IFtdKS5zbGljZSgpLnJldmVyc2UoKTsNCiAgICAgICAgYmFkZ2UudGV4dENvbnRlbnQgPSBsaXN0Lmxlbmd0aCArICcg15DXqNeV15fXldeqJzsNCg0KICAgICAgICBpZiAobGlzdC5sZW5ndGggPT09IDApIHsNCiAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9InAtNiB0ZXh0LWNlbnRlciB0ZXh0LXNsYXRlLTQwMCB0ZXh0LXhzIj7XoteT15nXmdefINeQ15nXnyDXkNeo15XXl9eV16og157XqteV16LXk9eV16ouPC9kaXY+JzsNCiAgICAgICAgICByZXR1cm47DQogICAgICAgIH0NCg0KICAgICAgICBsaXN0LmZvckVhY2goZnVuY3Rpb24oaXRlbSkgew0KICAgICAgICAgIHZhciBpc0ZpbiA9IGl0ZW0uZmluaXNoZWQgPT09ICfXm9efJzsNCiAgICAgICAgICB2YXIgY2FyZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOw0KICAgICAgICAgIGNhcmQuY2xhc3NOYW1lID0gJ3AtMy41IHNtOnAtNCBob3ZlcjpiZy1zbGF0ZS01MC83MCB0cmFuc2l0aW9uIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMyc7DQogICAgICAgICAgY2FyZC5pbm5lckhUTUwgPSBgDQogICAgICAgICAgICA8ZGl2IGNsYXNzPSJzcGFjZS15LTEiPg0KICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+DQog",
    "ICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9ImZvbnQtYm9sZCB0ZXh0LXNsYXRlLTgwMCB0ZXh0LXNtIj4ke2l0ZW0uZGF0ZX08L3NwYW4+DQogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS01MDAgZm9udC1zZW1pYm9sZCBkaXItbHRyIj7ij7AgJHtpdGVtLnRpbWUgfHwgJyd9PC9zcGFuPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTcwMCBiZy1zbGF0ZS0xMDAgcHgtMiBweS0wLjUgcm91bmRlZC1tZCI+JHtpdGVtLnR5cGV9PC9zcGFuPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LWluZGlnby02MDAgYmctaW5kaWdvLTUwIHB4LTIgcHktMC41IHJvdW5kZWQtbWQiPiR7aXRlbS5hbW91bnR9INeb15XXoSAoJHtNYXRoLnJvdW5kKGl0ZW0uYW1vdW50ICogNDAwKX1nKTwvc3Bhbj4NCiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC1bMTFweF0gZm9udC1ib2xkIHB4LTIgcHktMC41IHJvdW5kZWQtbWQgJHtpc0ZpbiA/ICdiZy1lbWVyYWxkLTUwIHRleHQtZW1lcmFsZC03MDAnIDogJ2JnLXJlZC01MCB0ZXh0LXJlZC03MDAnfSI+DQogICAgICAgICAgICAgICAgICAke2lzRmluID8gJ9eh15nXmdee15Qg15TXm9ecIPCfn6InIDogJ9ec15Ag16HXmdeZ157XlCDwn5S0J30NCiAgICAgICAgICAgICAgICA8L3NwYW4+DQogICAgICAgICAgICAgIDwvZGl2Pg0K",
    "ICAgICAgICAgICAgICAke2l0ZW0ubm90ZXMgPyBgPHAgY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS02MDAgbGVhZGluZy1zbnVnIj7wn5OdICR7ZXNjYXBlSHRtbChpdGVtLm5vdGVzKX08L3A+YCA6ICcnfQ0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSI+DQogICAgICAgICAgICAgIDxidXR0b24gb25jbGljaz0ib3BlbkVkaXRNb2RhbCgnRmVlZGluZycsICR7aXRlbS5yb3dJbmRleH0pIiB0aXRsZT0i16LXqNeV15og16nXldeo15QiDQogICAgICAgICAgICAgICAgY2xhc3M9InAtMiB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LWluZGlnby02MDAgaG92ZXI6YmctaW5kaWdvLTUwIHJvdW5kZWQtbGcgdHJhbnNpdGlvbiI+DQogICAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9ImVkaXQtMiIgY2xhc3M9InctNCBoLTQiPjwvaT4NCiAgICAgICAgICAgICAgPC9idXR0b24+DQogICAgICAgICAgICAgIDxidXR0b24gb25jbGljaz0iY29uZmlybURlbGV0ZSgnRmVlZGluZycsICR7aXRlbS5yb3dJbmRleH0sICfXkNeo15XXl9eqICR7aXRlbS50eXBlfSDXnteq15DXqNeZ15ogJHtpdGVtLmRhdGV9JykiIHRpdGxlPSLXnteX16cg16nXldeo15QiDQogICAgICAgICAgICAgICAgY2xhc3M9InAtMiB0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXJlZC02MDAgaG92ZXI6YmctcmVkLTUwIHJvdW5kZWQtbGcgdHJhbnNpdGlvbiI+DQogICAgICAg",
    "ICAgICAgICAgPGkgZGF0YS1sdWNpZGU9InRyYXNoLTIiIGNsYXNzPSJ3LTQgaC00Ij48L2k+DQogICAgICAgICAgICAgIDwvYnV0dG9uPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgYDsNCiAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2FyZCk7DQogICAgICAgIH0pOw0KICAgICAgfSBlbHNlIGlmIChkb21haW4gPT09ICdhd2F5Jykgew0KICAgICAgICBoZWFkZXJUZXh0LnRleHRDb250ZW50ID0gJ9eo16nXmdee16og15TXmdei15PXqNeV15nXldeqINeV15DXmdeo15XXl9eZ150nOw0KICAgICAgICB2YXIgbGlzdCA9IChzdGF0ZS5kYXRhLmF3YXlMb2cgfHwgW10pLnNsaWNlKCkucmV2ZXJzZSgpOw0KICAgICAgICBiYWRnZS50ZXh0Q29udGVudCA9IGxpc3QubGVuZ3RoICsgJyDXlNeZ16LXk9eo15XXmdeV16onOw0KDQogICAgICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkgew0KICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz0icC02IHRleHQtY2VudGVyIHRleHQtc2xhdGUtNDAwIHRleHQteHMiPtei15PXmdeZ158g15DXmdefINeU15nXoteT16jXldeZ15XXqiDXnteq15XXoteT15XXqi48L2Rpdj4nOw0KICAgICAgICAgIHJldHVybjsNCiAgICAgICAgfQ0KDQogICAgICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7DQogICAgICAgICAgdmFyIGNhcmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsNCiAgICAgICAgICBjYXJkLmNsYXNz",
    "TmFtZSA9ICdwLTMuNSBzbTpwLTQgaG92ZXI6Ymctc2xhdGUtNTAvNzAgdHJhbnNpdGlvbiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTMnOw0KICAgICAgICAgIGNhcmQuaW5uZXJIVE1MID0gYA0KICAgICAgICAgICAgPGRpdiBjbGFzcz0ic3BhY2UteS0xIj4NCiAgICAgICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIiPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJmb250LWJvbGQgdGV4dC1zbGF0ZS04MDAgdGV4dC1zbSI+JHtpdGVtLnN0YXJ0RGF0ZX0g16LXkyAke2l0ZW0uZW5kRGF0ZX08L3NwYW4+DQogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQteHMgZm9udC1ib2xkIHRleHQtaW5kaWdvLTYwMCBiZy1pbmRpZ28tNTAgcHgtMiBweS0wLjUgcm91bmRlZC1tZCI+JHtpdGVtLmRheXNDb3VudH0g15nXnteZ1508L3NwYW4+DQogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTcwMCBiZy1zbGF0ZS0xMDAgcHgtMiBweS0wLjUgcm91bmRlZC1tZCI+8J+TjSAke2l0ZW0ubG9jYXRpb259PC9zcGFuPg0KICAgICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgICAgJHtpdGVtLm5vdGVzID8gYDxwIGNsYXNzPSJ0ZXh0LXhzIHRleHQtc2xhdGUtNjAwIGxlYWRpbmctc251ZyI+8J+TnSAke2VzY2FwZUh0bWwoaXRlbS5ub3Rlcyl9PC9wPmAgOiAnJ30NCiAgICAgICAgICAgIDwv",
    "ZGl2Pg0KICAgICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEiPg0KICAgICAgICAgICAgICA8YnV0dG9uIG9uY2xpY2s9Im9wZW5FZGl0TW9kYWwoJ0F3YXlfTG9nJywgJHtpdGVtLnJvd0luZGV4fSkiIHRpdGxlPSLXoteo15XXmiDXqdeV16jXlCINCiAgICAgICAgICAgICAgICBjbGFzcz0icC0yIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtaW5kaWdvLTYwMCBob3ZlcjpiZy1pbmRpZ28tNTAgcm91bmRlZC1sZyB0cmFuc2l0aW9uIj4NCiAgICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT0iZWRpdC0yIiBjbGFzcz0idy00IGgtNCI+PC9pPg0KICAgICAgICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJjb25maXJtRGVsZXRlKCdBd2F5X0xvZycsICR7aXRlbS5yb3dJbmRleH0sICfXlNeZ16LXk9eo15XXqiAke2l0ZW0ubG9jYXRpb259ICgke2l0ZW0uc3RhcnREYXRlfSknKSIgdGl0bGU9Itee15fXpyDXqdeV16jXlCINCiAgICAgICAgICAgICAgICBjbGFzcz0icC0yIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtcmVkLTYwMCBob3ZlcjpiZy1yZWQtNTAgcm91bmRlZC1sZyB0cmFuc2l0aW9uIj4NCiAgICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT0idHJhc2gtMiIgY2xhc3M9InctNCBoLTQiPjwvaT4NCiAgICAgICAgICAgICAgPC9idXR0b24+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICBgOw0KICAgICAgICAgIGNvbnRh",
    "aW5lci5hcHBlbmRDaGlsZChjYXJkKTsNCiAgICAgICAgfSk7DQogICAgICB9IGVsc2UgaWYgKGRvbWFpbiA9PT0gJ3Rhc2tzJykgew0KICAgICAgICBoZWFkZXJUZXh0LnRleHRDb250ZW50ID0gJ9eR15nXpteV16LXmSDXntep15nXnteV16og15XXqteo15LXmdec15nXnSc7DQogICAgICAgIHZhciBsaXN0ID0gKHN0YXRlLmRhdGEudGFza0xvZ3MgfHwgW10pLnNsaWNlKCkucmV2ZXJzZSgpOw0KICAgICAgICBiYWRnZS50ZXh0Q29udGVudCA9IGxpc3QubGVuZ3RoICsgJyDXkdeZ16bXldei15nXnSc7DQoNCiAgICAgICAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7DQogICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPSJwLTYgdGV4dC1jZW50ZXIgdGV4dC1zbGF0ZS00MDAgdGV4dC14cyI+16LXk9eZ15nXnyDXkNeZ158g15HXmdem15XXoteZINee16nXmdee15XXqiDXnteq15XXoteT15nXnS48L2Rpdj4nOw0KICAgICAgICAgIHJldHVybjsNCiAgICAgICAgfQ0KDQogICAgICAgIGxpc3QuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7DQogICAgICAgICAgdmFyIGNhcmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsNCiAgICAgICAgICBjYXJkLmNsYXNzTmFtZSA9ICdwLTMuNSBzbTpwLTQgaG92ZXI6Ymctc2xhdGUtNTAvNzAgdHJhbnNpdGlvbiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTMnOw0KICAgICAgICAgIGNhcmQuaW5uZXJIVE1MID0gYA0KICAg",
    "ICAgICAgICAgPGRpdiBjbGFzcz0ic3BhY2UteS0xIj4NCiAgICAgICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIiPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJmb250LWJvbGQgdGV4dC1zbGF0ZS04MDAgdGV4dC1zbSI+JHtpdGVtLmRhdGV9PC9zcGFuPg0KICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LWluZGlnby03MDAgYmctaW5kaWdvLTUwIHB4LTIgcHktMC41IHJvdW5kZWQtbWQiPiR7aXRlbS50YXNrTmFtZX08L3NwYW4+DQogICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtNzAwIGJnLXNsYXRlLTEwMCBweC0yIHB5LTAuNSByb3VuZGVkLW1kIj7XpteZ15XXnzogJHtpdGVtLnN1Y2Nlc3N9LzUg4q2QPC9zcGFuPg0KICAgICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgICAgJHtpdGVtLm5vdGVzID8gYDxwIGNsYXNzPSJ0ZXh0LXhzIHRleHQtc2xhdGUtNjAwIGxlYWRpbmctc251ZyI+8J+TnSAke2VzY2FwZUh0bWwoaXRlbS5ub3Rlcyl9PC9wPmAgOiAnJ30NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEiPg0KICAgICAgICAgICAgICA8YnV0dG9uIG9uY2xpY2s9Im9wZW5FZGl0TW9kYWwoJ1Rhc2tMb2dzJywgJHtpdGVtLnJvd0luZGV4fSkiIHRpdGxlPSLXoteo15XXmiDXqdeV16jXlCIN",
    "CiAgICAgICAgICAgICAgICBjbGFzcz0icC0yIHRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtaW5kaWdvLTYwMCBob3ZlcjpiZy1pbmRpZ28tNTAgcm91bmRlZC1sZyB0cmFuc2l0aW9uIj4NCiAgICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT0iZWRpdC0yIiBjbGFzcz0idy00IGgtNCI+PC9pPg0KICAgICAgICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJjb25maXJtRGVsZXRlKCdUYXNrTG9ncycsICR7aXRlbS5yb3dJbmRleH0sICfXkdeZ16bXldeiICR7aXRlbS50YXNrTmFtZX0g157XqteQ16jXmdeaICR7aXRlbS5kYXRlfScpIiB0aXRsZT0i157Xl9enINep15XXqNeUIg0KICAgICAgICAgICAgICAgIGNsYXNzPSJwLTIgdGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1yZWQtNjAwIGhvdmVyOmJnLXJlZC01MCByb3VuZGVkLWxnIHRyYW5zaXRpb24iPg0KICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPSJ0cmFzaC0yIiBjbGFzcz0idy00IGgtNCI+PC9pPg0KICAgICAgICAgICAgICA8L2J1dHRvbj4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIGA7DQogICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNhcmQpOw0KICAgICAgICB9KTsNCiAgICAgIH0NCg0KICAgICAgbHVjaWRlLmNyZWF0ZUljb25zKCk7DQogICAgfQ0KDQogICAgLyoqDQogICAgICogT3BlbnMgZHluYW1pYyBlZGl0IG1vZGFsIGZvciBhbnkgb2YgdGhlIDQgc2hlZXRzDQogICAg",
    "ICovDQogICAgZnVuY3Rpb24gb3BlbkVkaXRNb2RhbChzaGVldE5hbWUsIHJvd0luZGV4KSB7DQogICAgICB2YXIgbW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZWRpdE1vZGFsJyk7DQogICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VkaXRGaWVsZHNDb250YWluZXInKTsNCiAgICAgIHZhciB0aXRsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlZGl0TW9kYWxUaXRsZScpOw0KICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VkaXRTaGVldE5hbWUnKS52YWx1ZSA9IHNoZWV0TmFtZTsNCiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlZGl0Um93SW5kZXgnKS52YWx1ZSA9IHJvd0luZGV4Ow0KICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9ICcnOw0KDQogICAgICBpZiAoc2hlZXROYW1lID09PSAnVHJhaW5pbmcnKSB7DQogICAgICAgIHRpdGxlLnRleHRDb250ZW50ID0gJ9ei16jXmdeb16og15DXmdee15XXnyAo16nXldeo15QgJyArIHJvd0luZGV4ICsgJyknOw0KICAgICAgICB2YXIgcmVjID0gc3RhdGUuZGF0YS50cmFpbmluZy5maW5kKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHIucm93SW5kZXggPT09IHJvd0luZGV4OyB9KTsNCiAgICAgICAgaWYgKCFyZWMpIHJldHVybjsNCg0KICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gYA0KICAgICAgICAgIDxkaXYgY2xhc3M9ImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTMiPg0KICAgICAgICAgICAg",
    "PGRpdj4NCiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAgbWItMSI+8J+ThSDXqteQ16jXmdeaPC9sYWJlbD4NCiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9ImRhdGUiIGlkPSJtX2VkaXRfZGF0ZSIgdmFsdWU9IiR7cmVjLmRhdGV9IiByZXF1aXJlZCBjbGFzcz0idy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIj4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAgbWItMSI+4o+wINep16LXlDwvbGFiZWw+DQogICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJ0aW1lIiBpZD0ibV9lZGl0X3RpbWUiIHZhbHVlPSIke3JlYy50aW1lIHx8ICcxMDowMCd9IiByZXF1aXJlZCBjbGFzcz0iaW5wdXQtdGltZSB3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0yLjUgcHktMS41IHRleHQteHMgZm9udC1zZW1pYm9sZCI+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8ZGl2IGNsYXNzPSJncmlkIGdyaWQtY29scy0yIGdhcC0zIj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sg",
    "dGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPuKPsyDXntep15ogKNep16LXldeqKTwvbGFiZWw+DQogICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJudW1iZXIiIGlkPSJtX2VkaXRfZHVyIiBzdGVwPSIwLjI1IiBtaW49IjAuMjUiIG1heD0iMTIiIHZhbHVlPSIke3JlYy5kdXJhdGlvbn0iIHJlcXVpcmVkIGNsYXNzPSJpbnB1dC1sdHIgdy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LWNlbnRlciI+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPvCfmLAg15zXl9elICgxLTUpPC9sYWJlbD4NCiAgICAgICAgICAgICAgPHNlbGVjdCBpZD0ibV9lZGl0X3N0cmVzcyIgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC14cyBmb250LXNlbWlib2xkIj4NCiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSIxIiAke3JlYy5zdHJlc3NMZXZlbCA9PT0gMSA/ICdzZWxlY3RlZCcgOiAnJ30+MSAtINeo15LXldei15Qg15zXl9ec15XXmNeZ158g8J+fojwvb3B0aW9uPg0KICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IjIiICR7",
    "cmVjLnN0cmVzc0xldmVsID09PSAyID8gJ3NlbGVjdGVkJyA6ICcnfT4yIC0g15DXmS3Xqden15gg16fXnCDwn5+hPC9vcHRpb24+DQogICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0iMyIgJHtyZWMuc3RyZXNzTGV2ZWwgPT09IDMgPyAnc2VsZWN0ZWQnIDogJyd9PjMgLSDXnNeX16Ug15HXmdeg15XXoNeZIPCfn6A8L29wdGlvbj4NCiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSI0IiAke3JlYy5zdHJlc3NMZXZlbCA9PT0gNCA/ICdzZWxlY3RlZCcgOiAnJ30+NCAtINee16bXlden15Qg15LXkdeV15TXlCDwn5S0PC9vcHRpb24+DQogICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0iNSIgJHtyZWMuc3RyZXNzTGV2ZWwgPT09IDUgPyAnc2VsZWN0ZWQnIDogJyd9PjUgLSDXpNeQ16DXmden15Qg8J+aqDwvb3B0aW9uPg0KICAgICAgICAgICAgICA8L3NlbGVjdD4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7wn5OdINeU16LXqNeV16o8L2xhYmVsPg0KICAgICAgICAgICAgPGlucHV0IHR5cGU9InRleHQiIGlkPSJtX2VkaXRfbm90ZXMiIHZhbHVlPSIke2VzY2FwZUh0bWwocmVjLm5vdGVzIHx8ICcnKX0iIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBw",
    "eC0yLjUgcHktMS41IHRleHQteHMiPg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICBgOw0KICAgICAgfSBlbHNlIGlmIChzaGVldE5hbWUgPT09ICdGZWVkaW5nJykgew0KICAgICAgICB0aXRsZS50ZXh0Q29udGVudCA9ICfXoteo15nXm9eqINeQ16jXldeX15QgKNep15XXqNeUICcgKyByb3dJbmRleCArICcpJzsNCiAgICAgICAgdmFyIHJlYyA9IHN0YXRlLmRhdGEuZmVlZGluZy5maW5kKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHIucm93SW5kZXggPT09IHJvd0luZGV4OyB9KTsNCiAgICAgICAgaWYgKCFyZWMpIHJldHVybjsNCg0KICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gYA0KICAgICAgICAgIDxkaXYgY2xhc3M9ImdyaWQgZ3JpZC1jb2xzLTMgZ2FwLTMiPg0KICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAgbWItMSI+16rXkNeo15nXmjwvbGFiZWw+DQogICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJkYXRlIiBpZD0ibV9lZGl0X2ZlZWRfZGF0ZSIgdmFsdWU9IiR7cmVjLmRhdGV9IiByZXF1aXJlZCBjbGFzcz0idy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIj4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhz",
    "IGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAgbWItMSI+16nXoteUPC9sYWJlbD4NCiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9InRpbWUiIGlkPSJtX2VkaXRfZmVlZF90aW1lIiB2YWx1ZT0iJHtyZWMudGltZSB8fCAnMDg6MDAnfSIgcmVxdWlyZWQgY2xhc3M9ImlucHV0LXRpbWUgdy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQiPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7XodeV15I8L2xhYmVsPg0KICAgICAgICAgICAgICA8c2VsZWN0IGlkPSJtX2VkaXRfZmVlZF90eXBlIiBjbGFzcz0idy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQiPg0KICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IteR15XXp9eoIiAke3JlYy50eXBlID09PSAn15HXlden16gnID8gJ3NlbGVjdGVkJyA6ICcnfT7XkdeV16fXqCDimIDvuI88L29wdGlvbj4NCiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSLXoteo15EiICR7cmVjLnR5cGUgPT09ICfXoteo15EnID8gJ3NlbGVjdGVkJyA6ICcnfT7Xoteo15Eg8J+MmTwvb3B0aW9uPg0K",
    "ICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IteQ15fXqCIgJHtyZWMudHlwZSA9PT0gJ9eQ15fXqCcgPyAnc2VsZWN0ZWQnIDogJyd9PteQ15fXqCDinKg8L29wdGlvbj4NCiAgICAgICAgICAgICAgPC9zZWxlY3Q+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICA8ZGl2IGNsYXNzPSJncmlkIGdyaWQtY29scy0yIGdhcC0zIGl0ZW1zLWNlbnRlciI+DQogICAgICAgICAgICA8ZGl2Pg0KICAgICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7Xm9ee15XXqiAo15vXldeh15XXqik8L2xhYmVsPg0KICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0ibnVtYmVyIiBpZD0ibV9lZGl0X2ZlZWRfYW1vdW50IiBzdGVwPSIwLjI1IiBtaW49IjAuMjUiIG1heD0iNCIgdmFsdWU9IiR7cmVjLmFtb3VudH0iIHJlcXVpcmVkIGNsYXNzPSJpbnB1dC1sdHIgdy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LWNlbnRlciI+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXYgY2xhc3M9InB0LTQgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIiPg0KICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0iY2hlY2tib3giIGlkPSJtX2VkaXRfZmVlZF9maW4iICR7cmVjLmZpbmlzaGVkID09PSAn15vX",
    "nycgPyAnY2hlY2tlZCcgOiAnJ30gY2xhc3M9InctNCBoLTQgdGV4dC1pbmRpZ28tNjAwIHJvdW5kZWQiPg0KICAgICAgICAgICAgICA8bGFiZWwgZm9yPSJtX2VkaXRfZmVlZF9maW4iIGNsYXNzPSJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTcwMCBjdXJzb3ItcG9pbnRlciI+16HXmdeZ157XlCDXlNeb15w/IPCfpaM8L2xhYmVsPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPteU16LXqNeV16o8L2xhYmVsPg0KICAgICAgICAgICAgPGlucHV0IHR5cGU9InRleHQiIGlkPSJtX2VkaXRfZmVlZF9ub3RlcyIgdmFsdWU9IiR7ZXNjYXBlSHRtbChyZWMubm90ZXMgfHwgJycpfSIgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC14cyI+DQogICAgICAgICAgPC9kaXY+DQogICAgICAgIGA7DQogICAgICB9IGVsc2UgaWYgKHNoZWV0TmFtZSA9PT0gJ0F3YXlfTG9nJykgew0KICAgICAgICB0aXRsZS50ZXh0Q29udGVudCA9ICfXoteo15nXm9eqINeU15nXoteT16jXldeqICjXqdeV16jXlCAnICsgcm93SW5kZXggKyAnKSc7DQogICAgICAgIHZhciByZWMgPSBzdGF0ZS5kYXRhLmF3YXlMb2cuZmluZChmdW5jdGlvbihyKSB7IHJldHVybiBy",
    "LnJvd0luZGV4ID09PSByb3dJbmRleDsgfSk7DQogICAgICAgIGlmICghcmVjKSByZXR1cm47DQoNCiAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IGANCiAgICAgICAgICA8ZGl2IGNsYXNzPSJncmlkIGdyaWQtY29scy0yIGdhcC0zIj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPteq15DXqNeZ15og15TXqteX15zXlDwvbGFiZWw+DQogICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJkYXRlIiBpZD0ibV9lZGl0X2F3YXlfc3RhcnQiIHZhbHVlPSIke3JlYy5zdGFydERhdGV9IiByZXF1aXJlZCBjbGFzcz0idy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIj4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzPSJibG9jayB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS02MDAgbWItMSI+16rXkNeo15nXmiDXl9eW16jXlDwvbGFiZWw+DQogICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJkYXRlIiBpZD0ibV9lZGl0X2F3YXlfZW5kIiB2YWx1ZT0iJHtyZWMuZW5kRGF0ZX0iIHJlcXVpcmVkIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0yLjUgcHktMS41IHRl",
    "eHQteHMiPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPtee15nXp9eV1508L2xhYmVsPg0KICAgICAgICAgICAgPHNlbGVjdCBpZD0ibV9lZGl0X2F3YXlfbG9jIiBjbGFzcz0idy1mdWxsIGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQteGwgcHgtMi41IHB5LTEuNSB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQiPg0KICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSLXkNem15wg15nXkNeZ16gg15HXntep16cg8J+anCIgJHtyZWMubG9jYXRpb24gPT09ICfXkNem15wg15nXkNeZ16gg15HXntep16cg8J+anCcgPyAnc2VsZWN0ZWQnIDogJyd9PteQ16bXnCDXmdeQ15nXqCDXkdee16nXpyDwn5qcPC9vcHRpb24+DQogICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IteQ16bXnCDXkNeR15Ag15HXntep16cg8J+anCIgJHtyZWMubG9jYXRpb24gPT09ICfXkNem15wg15DXkdeQINeR157XqdenIPCfmpwnID8gJ3NlbGVjdGVkJyA6ICcnfT7XkNem15wg15DXkdeQINeR157XqdenIPCfmpw8L29wdGlvbj4NCiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0i15DXptecINeg15nXp9eV15wg15HXlNeo16bXnNeZ15Qg8J+Plu+4jyIgJHtyZWMubG9jYXRpb24gPT09ICfXkNem15wg16DXmden15XXnCDXkdeU16jX",
    "ptec15nXlCDwn4+W77iPJyA/ICdzZWxlY3RlZCcgOiAnJ30+15DXptecINeg15nXp9eV15wg15HXlNeo16bXnNeZ15Qg8J+Plu+4jzwvb3B0aW9uPg0KICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSLXkNem15wg15jXqNeZ15nXodeZINeR157XoNeV16Mg8J+PoSIgJHsocmVjLmxvY2F0aW9uIHx8ICcnKS5pbmRleE9mKCfXmNeo15nXmdeh15knKSAhPT0gLTEgPyAnc2VsZWN0ZWQnIDogJyd9PteQ16bXnCDXmNeo15nXmdeh15kg15HXnteg15XXoyDwn4+hPC9vcHRpb24+DQogICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IteQ16bXnCDXl9eR16jXmdedINeR16rXnCDXkNeR15nXkSDwn4+Z77iPIiAke3JlYy5sb2NhdGlvbiA9PT0gJ9eQ16bXnCDXl9eR16jXmdedINeR16rXnCDXkNeR15nXkSDwn4+Z77iPJyA/ICdzZWxlY3RlZCcgOiAnJ30+15DXptecINeX15HXqNeZ150g15HXqtecINeQ15HXmdeRIPCfj5nvuI88L29wdGlvbj4NCiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0i15HXkdeZ16og15vXqdee15nXqdeU15Ug16nXldee16gg16LXnNeZ15Qg8J+PoCIgJHtyZWMubG9jYXRpb24gPT09ICfXkdeR15nXqiDXm9ep157Xmdep15TXlSDXqdeV157XqCDXotec15nXlCDwn4+gJyA/ICdzZWxlY3RlZCcgOiAnJ30+15HXkdeZ16og15vXqdee15nXqdeU15Ug16nXldee16gg16LXnNeZ15Qg8J+PoDwvb3B0aW9uPg0KICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSLXpNeg16HXmdeV158g8J+QviIgJHty",
    "ZWMubG9jYXRpb24gPT09ICfXpNeg16HXmdeV158g8J+QvicgPyAnc2VsZWN0ZWQnIDogJyd9Ptek16DXodeZ15XXnyDwn5C+PC9vcHRpb24+DQogICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9IteQ15fXqCDinKgiICR7cmVjLmxvY2F0aW9uID09PSAn15DXl9eoIOKcqCcgPyAnc2VsZWN0ZWQnIDogJyd9PteQ15fXqCDinKg8L29wdGlvbj4NCiAgICAgICAgICAgIDwvc2VsZWN0Pg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7XlNei16jXldeqPC9sYWJlbD4NCiAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJ0ZXh0IiBpZD0ibV9lZGl0X2F3YXlfbm90ZXMiIHZhbHVlPSIke2VzY2FwZUh0bWwocmVjLm5vdGVzIHx8ICcnKX0iIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0yLjUgcHktMS41IHRleHQteHMiPg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICBgOw0KICAgICAgfSBlbHNlIGlmIChzaGVldE5hbWUgPT09ICdUYXNrTG9ncycpIHsNCiAgICAgICAgdGl0bGUudGV4dENvbnRlbnQgPSAn16LXqNeZ15vXqiDXkdeZ16bXldeiINee16nXmdee15QgKNep15XXqNeUICcgKyByb3dJbmRleCArICcpJzsNCiAgICAgICAgdmFyIHJlYyA9IHN0YXRlLmRhdGEudGFza0xvZ3MuZmluZChmdW5jdGlvbihy",
    "KSB7IHJldHVybiByLnJvd0luZGV4ID09PSByb3dJbmRleDsgfSk7DQogICAgICAgIGlmICghcmVjKSByZXR1cm47DQoNCiAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IGANCiAgICAgICAgICA8ZGl2IGNsYXNzPSJncmlkIGdyaWQtY29scy0yIGdhcC0zIj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPteq15DXqNeZ15o8L2xhYmVsPg0KICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0iZGF0ZSIgaWQ9Im1fZWRpdF90YXNrX2RhdGUiIHZhbHVlPSIke3JlYy5kYXRlfSIgcmVxdWlyZWQgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC14cyI+DQogICAgICAgICAgICA8L2Rpdj4NCiAgICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPtem15nXldefICgxLTUpPC9sYWJlbD4NCiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9Im51bWJlciIgaWQ9Im1fZWRpdF90YXNrX3Njb3JlIiBtaW49IjEiIG1heD0iNSIgdmFsdWU9IiR7cmVjLnN1Y2Nlc3N9IiByZXF1aXJlZCBjbGFzcz0iaW5wdXQtbHRyIHctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVk",
    "LXhsIHB4LTIuNSBweS0xLjUgdGV4dC14cyBmb250LWJvbGQgdGV4dC1jZW50ZXIiPg0KICAgICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPC9kaXY+DQogICAgICAgICAgPGRpdj4NCiAgICAgICAgICAgIDxsYWJlbCBjbGFzcz0iYmxvY2sgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtNjAwIG1iLTEiPtep150g15TXqteo15LXmdecPC9sYWJlbD4NCiAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJ0ZXh0IiBpZD0ibV9lZGl0X3Rhc2tfbmFtZSIgdmFsdWU9IiR7ZXNjYXBlSHRtbChyZWMudGFza05hbWUpfSIgcmVxdWlyZWQgY2xhc3M9InctZnVsbCBiZy1zbGF0ZS01MCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCByb3VuZGVkLXhsIHB4LTIuNSBweS0xLjUgdGV4dC14cyBmb250LWJvbGQiPg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICAgIDxkaXY+DQogICAgICAgICAgICA8bGFiZWwgY2xhc3M9ImJsb2NrIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTYwMCBtYi0xIj7XlNei16jXldeqPC9sYWJlbD4NCiAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJ0ZXh0IiBpZD0ibV9lZGl0X3Rhc2tfbm90ZXMiIHZhbHVlPSIke2VzY2FwZUh0bWwocmVjLm5vdGVzIHx8ICcnKX0iIGNsYXNzPSJ3LWZ1bGwgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZC14bCBweC0yLjUgcHktMS41IHRleHQteHMiPg0KICAgICAgICAgIDwvZGl2Pg0KICAgICAgICBgOw0KICAgICAgfQ0K",
    "DQogICAgICBtb2RhbC5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTsNCiAgICAgIG1vZGFsLmNsYXNzTGlzdC5hZGQoJ2ZsZXgnKTsNCiAgICB9DQoNCiAgICBmdW5jdGlvbiBjbG9zZUVkaXRNb2RhbCgpIHsNCiAgICAgIHZhciBtb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlZGl0TW9kYWwnKTsNCiAgICAgIG1vZGFsLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpOw0KICAgICAgbW9kYWwuY2xhc3NMaXN0LnJlbW92ZSgnZmxleCcpOw0KICAgIH0NCg0KICAgIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUVkaXRNb2RhbFN1Ym1pdChlKSB7DQogICAgICBlLnByZXZlbnREZWZhdWx0KCk7DQogICAgICB2YXIgc2hlZXROYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VkaXRTaGVldE5hbWUnKS52YWx1ZTsNCiAgICAgIHZhciByb3dJbmRleCA9IHBhcnNlSW50KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlZGl0Um93SW5kZXgnKS52YWx1ZSwgMTApOw0KICAgICAgdmFyIHJvd0RhdGEgPSBbXTsNCg0KICAgICAgaWYgKHNoZWV0TmFtZSA9PT0gJ1RyYWluaW5nJykgew0KICAgICAgICB2YXIgZGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtX2VkaXRfZGF0ZScpLnZhbHVlOw0KICAgICAgICB2YXIgdGltZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtX2VkaXRfdGltZScpLnZhbHVlOw0KICAgICAgICB2YXIgZHVyID0gcGFyc2VGbG9hdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0",
    "X2R1cicpLnZhbHVlKTsNCiAgICAgICAgdmFyIHN0cmVzcyA9IHBhcnNlSW50KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtX2VkaXRfc3RyZXNzJykudmFsdWUsIDEwKTsNCiAgICAgICAgdmFyIG5vdGVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21fZWRpdF9ub3RlcycpLnZhbHVlOw0KICAgICAgICByb3dEYXRhID0gW2RhdGUsIHRpbWUsIGR1ciwgc3RyZXNzLCBub3Rlc107DQoNCiAgICAgICAgLy8gVXBkYXRlIGxvY2FsIHN0YXRlIGl0ZW0NCiAgICAgICAgdmFyIHJlYyA9IHN0YXRlLmRhdGEudHJhaW5pbmcuZmluZChmdW5jdGlvbihyKSB7IHJldHVybiByLnJvd0luZGV4ID09PSByb3dJbmRleDsgfSk7DQogICAgICAgIGlmIChyZWMpIHsNCiAgICAgICAgICByZWMuZGF0ZSA9IGRhdGU7DQogICAgICAgICAgcmVjLnRpbWUgPSB0aW1lOw0KICAgICAgICAgIHJlYy5kdXJhdGlvbiA9IGR1cjsNCiAgICAgICAgICByZWMuc3RyZXNzTGV2ZWwgPSBzdHJlc3M7DQogICAgICAgICAgcmVjLm5vdGVzID0gbm90ZXM7DQogICAgICAgIH0NCiAgICAgIH0gZWxzZSBpZiAoc2hlZXROYW1lID09PSAnRmVlZGluZycpIHsNCiAgICAgICAgdmFyIGRhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0X2ZlZWRfZGF0ZScpLnZhbHVlOw0KICAgICAgICB2YXIgdGltZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtX2VkaXRfZmVlZF90aW1lJykudmFsdWU7DQogICAgICAgIHZhciB0eXBlID0gZG9jdW1l",
    "bnQuZ2V0RWxlbWVudEJ5SWQoJ21fZWRpdF9mZWVkX3R5cGUnKS52YWx1ZTsNCiAgICAgICAgdmFyIGFtdCA9IHBhcnNlRmxvYXQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21fZWRpdF9mZWVkX2Ftb3VudCcpLnZhbHVlKTsNCiAgICAgICAgdmFyIGZpbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtX2VkaXRfZmVlZF9maW4nKS5jaGVja2VkID8gJ9eb158nIDogJ9ec15AnOw0KICAgICAgICB2YXIgbm90ZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0X2ZlZWRfbm90ZXMnKS52YWx1ZTsNCiAgICAgICAgcm93RGF0YSA9IFtkYXRlLCB0aW1lLCB0eXBlLCBhbXQsIGZpbiwgbm90ZXNdOw0KDQogICAgICAgIHZhciByZWMgPSBzdGF0ZS5kYXRhLmZlZWRpbmcuZmluZChmdW5jdGlvbihyKSB7IHJldHVybiByLnJvd0luZGV4ID09PSByb3dJbmRleDsgfSk7DQogICAgICAgIGlmIChyZWMpIHsNCiAgICAgICAgICByZWMuZGF0ZSA9IGRhdGU7DQogICAgICAgICAgcmVjLnRpbWUgPSB0aW1lOw0KICAgICAgICAgIHJlYy50eXBlID0gdHlwZTsNCiAgICAgICAgICByZWMuYW1vdW50ID0gYW10Ow0KICAgICAgICAgIHJlYy5maW5pc2hlZCA9IGZpbjsNCiAgICAgICAgICByZWMubm90ZXMgPSBub3RlczsNCiAgICAgICAgfQ0KICAgICAgfSBlbHNlIGlmIChzaGVldE5hbWUgPT09ICdBd2F5X0xvZycpIHsNCiAgICAgICAgdmFyIHN0YXJ0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21fZWRpdF9hd2F5",
    "X3N0YXJ0JykudmFsdWU7DQogICAgICAgIHZhciBlbmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0X2F3YXlfZW5kJykudmFsdWU7DQogICAgICAgIHZhciBsb2MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0X2F3YXlfbG9jJykudmFsdWU7DQogICAgICAgIHZhciBub3RlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtX2VkaXRfYXdheV9ub3RlcycpLnZhbHVlOw0KICAgICAgICB2YXIgZGF5cyA9IE1hdGgucm91bmQoKG5ldyBEYXRlKGVuZCkgLSBuZXcgRGF0ZShzdGFydCkpIC8gKDEwMDAgKiA2MCAqIDYwICogMjQpKTsNCiAgICAgICAgcm93RGF0YSA9IFtzdGFydCwgZW5kLCBsb2MsIGRheXMsIG5vdGVzXTsNCg0KICAgICAgICB2YXIgcmVjID0gc3RhdGUuZGF0YS5hd2F5TG9nLmZpbmQoZnVuY3Rpb24ocikgeyByZXR1cm4gci5yb3dJbmRleCA9PT0gcm93SW5kZXg7IH0pOw0KICAgICAgICBpZiAocmVjKSB7DQogICAgICAgICAgcmVjLnN0YXJ0RGF0ZSA9IHN0YXJ0Ow0KICAgICAgICAgIHJlYy5lbmREYXRlID0gZW5kOw0KICAgICAgICAgIHJlYy5sb2NhdGlvbiA9IGxvYzsNCiAgICAgICAgICByZWMuZGF5c0NvdW50ID0gZGF5czsNCiAgICAgICAgICByZWMubm90ZXMgPSBub3RlczsNCiAgICAgICAgfQ0KICAgICAgfSBlbHNlIGlmIChzaGVldE5hbWUgPT09ICdUYXNrTG9ncycpIHsNCiAgICAgICAgdmFyIGRhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0",
    "X3Rhc2tfZGF0ZScpLnZhbHVlOw0KICAgICAgICB2YXIgdE5hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0X3Rhc2tfbmFtZScpLnZhbHVlOw0KICAgICAgICB2YXIgc2NvcmUgPSBwYXJzZUludChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0X3Rhc2tfc2NvcmUnKS52YWx1ZSwgMTApOw0KICAgICAgICB2YXIgbm90ZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbV9lZGl0X3Rhc2tfbm90ZXMnKS52YWx1ZTsNCiAgICAgICAgcm93RGF0YSA9IFtkYXRlLCB0TmFtZSwgc2NvcmUsIG5vdGVzXTsNCg0KICAgICAgICB2YXIgcmVjID0gc3RhdGUuZGF0YS50YXNrTG9ncy5maW5kKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHIucm93SW5kZXggPT09IHJvd0luZGV4OyB9KTsNCiAgICAgICAgaWYgKHJlYykgew0KICAgICAgICAgIHJlYy5kYXRlID0gZGF0ZTsNCiAgICAgICAgICByZWMudGFza05hbWUgPSB0TmFtZTsNCiAgICAgICAgICByZWMuc3VjY2VzcyA9IHNjb3JlOw0KICAgICAgICAgIHJlYy5ub3RlcyA9IG5vdGVzOw0KICAgICAgICB9DQogICAgICB9DQoNCiAgICAgIHNob3dTcGlubmVyKCfXntei15PXm9efINep15XXqNeUINeR15LXmdec15nXldefLi4uJyk7DQogICAgICB0cnkgew0KICAgICAgICB2YXIgcmVzID0gYXdhaXQgY2FsbFNlcnZlcigndXBkYXRlUm93Jywgc2hlZXROYW1lLCByb3dJbmRleCwgcm93RGF0YSk7DQogICAgICAgIGlmIChyZXMuc3VjY2Vzcykgew0KICAgICAg",
    "ICAgIHNob3dUb2FzdChyZXMubWVzc2FnZSB8fCAn15TXqdeV16jXlCDXoteV15PXm9eg15Qg15HXlNem15zXl9eUIScsICdzdWNjZXNzJyk7DQogICAgICAgICAgaWYgKHNoZWV0TmFtZSA9PT0gJ1RyYWluaW5nJykgew0KICAgICAgICAgICAgcmVjYWxjRGVmYXVsdER1cmF0aW9uKCk7DQogICAgICAgICAgfQ0KICAgICAgICAgIGNsb3NlRWRpdE1vZGFsKCk7DQogICAgICAgICAgcmVuZGVyVHJhaW5pbmdDaGFydCgpOw0KICAgICAgICAgIHJlbmRlckZlZWRpbmdDaGFydCgpOw0KICAgICAgICAgIHJlbmRlclRhc2tzQ2hhcnQoKTsNCiAgICAgICAgICByZW5kZXJIaXN0b3J5TGlzdCgpOw0KICAgICAgICB9IGVsc2Ugew0KICAgICAgICAgIHNob3dUb2FzdCgn16nXkteZ15DXlCDXkdei15PXm9eV1586ICcgKyAocmVzLmVycm9yIHx8ICfXqten15zXlCcpLCAnZXJyb3InKTsNCiAgICAgICAgfQ0KICAgICAgfSBjYXRjaCAoZXJyKSB7DQogICAgICAgIHNob3dUb2FzdCgn16rXp9ec16og16rXp9ep15XXqNeqOiAnICsgZXJyLnRvU3RyaW5nKCksICdlcnJvcicpOw0KICAgICAgfSBmaW5hbGx5IHsNCiAgICAgICAgaGlkZVNwaW5uZXIoKTsNCiAgICAgIH0NCiAgICB9DQoNCiAgICBmdW5jdGlvbiBjb25maXJtRGVsZXRlKHNoZWV0TmFtZSwgcm93SW5kZXgsIGRlc2NyaXB0aW9uKSB7DQogICAgICBzdGF0ZS5kZWxldGVQZW5kaW5nID0geyBzaGVldE5hbWU6IHNoZWV0TmFtZSwgcm93SW5kZXg6IHJvd0luZGV4IH07DQog",
    "ICAgICB2YXIgbXNnID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbGV0ZU1vZGFsTWVzc2FnZScpOw0KICAgICAgaWYgKG1zZykgbXNnLnRleHRDb250ZW50ID0gZGVzY3JpcHRpb24gfHwgKCfXqdeV16jXlCAnICsgcm93SW5kZXggKyAnINeRLScgKyBzaGVldE5hbWUpOw0KICAgICAgdmFyIG1vZGFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlbGV0ZU1vZGFsJyk7DQogICAgICBtb2RhbC5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTsNCiAgICAgIG1vZGFsLmNsYXNzTGlzdC5hZGQoJ2ZsZXgnKTsNCiAgICB9DQoNCiAgICBmdW5jdGlvbiBjbG9zZURlbGV0ZU1vZGFsKCkgew0KICAgICAgc3RhdGUuZGVsZXRlUGVuZGluZyA9IG51bGw7DQogICAgICB2YXIgbW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVsZXRlTW9kYWwnKTsNCiAgICAgIG1vZGFsLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpOw0KICAgICAgbW9kYWwuY2xhc3NMaXN0LnJlbW92ZSgnZmxleCcpOw0KICAgIH0NCg0KICAgIGFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVEZWxldGVSZWNvcmQoKSB7DQogICAgICBpZiAoIXN0YXRlLmRlbGV0ZVBlbmRpbmcpIHJldHVybjsNCiAgICAgIHZhciBzaGVldE5hbWUgPSBzdGF0ZS5kZWxldGVQZW5kaW5nLnNoZWV0TmFtZTsNCiAgICAgIHZhciByb3dJbmRleCA9IHN0YXRlLmRlbGV0ZVBlbmRpbmcucm93SW5kZXg7DQoNCiAgICAgIHNob3dTcGlubmVyKCfXnteV15fXpyDXqdeV16jXlC4u",
    "LicpOw0KICAgICAgdHJ5IHsNCiAgICAgICAgdmFyIHJlcyA9IGF3YWl0IGNhbGxTZXJ2ZXIoJ2RlbGV0ZVJvdycsIHNoZWV0TmFtZSwgcm93SW5kZXgpOw0KICAgICAgICBpZiAocmVzLnN1Y2Nlc3MpIHsNCiAgICAgICAgICBzaG93VG9hc3QocmVzLm1lc3NhZ2UgfHwgJ9eU16nXldeo15Qg16DXnteX16fXlCEnLCAnc3VjY2VzcycpOw0KICAgICAgICAgIA0KICAgICAgICAgIC8vIFJlbW92ZSBmcm9tIGxvY2FsIHN0YXRlDQogICAgICAgICAgaWYgKHNoZWV0TmFtZSA9PT0gJ1RyYWluaW5nJykgew0KICAgICAgICAgICAgc3RhdGUuZGF0YS50cmFpbmluZyA9IHN0YXRlLmRhdGEudHJhaW5pbmcuZmlsdGVyKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHIucm93SW5kZXggIT09IHJvd0luZGV4OyB9KTsNCiAgICAgICAgICAgIHJlY2FsY0RlZmF1bHREdXJhdGlvbigpOw0KICAgICAgICAgIH0gZWxzZSBpZiAoc2hlZXROYW1lID09PSAnRmVlZGluZycpIHsNCiAgICAgICAgICAgIHN0YXRlLmRhdGEuZmVlZGluZyA9IHN0YXRlLmRhdGEuZmVlZGluZy5maWx0ZXIoZnVuY3Rpb24ocikgeyByZXR1cm4gci5yb3dJbmRleCAhPT0gcm93SW5kZXg7IH0pOw0KICAgICAgICAgIH0gZWxzZSBpZiAoc2hlZXROYW1lID09PSAnQXdheV9Mb2cnKSB7DQogICAgICAgICAgICBzdGF0ZS5kYXRhLmF3YXlMb2cgPSBzdGF0ZS5kYXRhLmF3YXlMb2cuZmlsdGVyKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHIucm93SW5kZXggIT09IHJvd0luZGV4OyB9",
    "KTsNCiAgICAgICAgICB9IGVsc2UgaWYgKHNoZWV0TmFtZSA9PT0gJ1Rhc2tMb2dzJykgew0KICAgICAgICAgICAgc3RhdGUuZGF0YS50YXNrTG9ncyA9IHN0YXRlLmRhdGEudGFza0xvZ3MuZmlsdGVyKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHIucm93SW5kZXggIT09IHJvd0luZGV4OyB9KTsNCiAgICAgICAgICB9DQoNCiAgICAgICAgICBjbG9zZURlbGV0ZU1vZGFsKCk7DQogICAgICAgICAgcmVuZGVyVHJhaW5pbmdDaGFydCgpOw0KICAgICAgICAgIHJlbmRlckZlZWRpbmdDaGFydCgpOw0KICAgICAgICAgIHJlbmRlclRhc2tzQ2hhcnQoKTsNCiAgICAgICAgICByZW5kZXJIaXN0b3J5TGlzdCgpOw0KICAgICAgICB9IGVsc2Ugew0KICAgICAgICAgIHNob3dUb2FzdCgn16nXkteZ15DXlCDXkdee15fXmden15Q6ICcgKyAocmVzLmVycm9yIHx8ICfXqten15zXlCcpLCAnZXJyb3InKTsNCiAgICAgICAgfQ0KICAgICAgfSBjYXRjaCAoZXJyKSB7DQogICAgICAgIHNob3dUb2FzdCgn16rXp9ec16og16rXp9ep15XXqNeqOiAnICsgZXJyLnRvU3RyaW5nKCksICdlcnJvcicpOw0KICAgICAgfSBmaW5hbGx5IHsNCiAgICAgICAgaGlkZVNwaW5uZXIoKTsNCiAgICAgIH0NCiAgICB9DQoNCiAgICAvKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09DQogICAgICogVUkgVVRJTElUSUVTIChUT0FTVFMsIFNQSU5ORVIsIEVTQ0FQSU5HKQ0KICAg",
    "ICAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi8NCiAgICBmdW5jdGlvbiBzaG93VG9hc3QobWVzc2FnZSwgdHlwZSkgew0KICAgICAgdHlwZSA9IHR5cGUgfHwgJ2luZm8nOw0KICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b2FzdENvbnRhaW5lcicpOw0KICAgICAgaWYgKCFjb250YWluZXIpIHJldHVybjsNCg0KICAgICAgdmFyIHRvYXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7DQogICAgICB2YXIgYmcgPSAnYmctc2xhdGUtODAwIHRleHQtd2hpdGUnOw0KICAgICAgdmFyIGljb24gPSAn4oS577iPJzsNCg0KICAgICAgaWYgKHR5cGUgPT09ICdzdWNjZXNzJykgew0KICAgICAgICBiZyA9ICdiZy1lbWVyYWxkLTYwMCB0ZXh0LXdoaXRlJzsNCiAgICAgICAgaWNvbiA9ICfinIUnOw0KICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnZXJyb3InKSB7DQogICAgICAgIGJnID0gJ2JnLXJvc2UtNjAwIHRleHQtd2hpdGUnOw0KICAgICAgICBpY29uID0gJ+KaoO+4jyc7DQogICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICd3YXJuaW5nJykgew0KICAgICAgICBiZyA9ICdiZy1hbWJlci02MDAgdGV4dC13aGl0ZSc7DQogICAgICAgIGljb24gPSAn8J+UlCc7DQogICAgICB9DQoNCiAgICAgIHRvYXN0LmNsYXNzTmFtZSA9IGJnICsgJyBweC00IHB5LTIuNSByb3VuZGVkLXhsIHNo",
    "YWRvdy1sZyB0ZXh0LXhzIGZvbnQtYm9sZCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBwb2ludGVyLWV2ZW50cy1hdXRvIHRyYW5zaXRpb24gdHJhbnNmb3JtIHRyYW5zbGF0ZS15LTIgb3BhY2l0eS0wIGR1cmF0aW9uLTIwMCc7DQogICAgICB0b2FzdC5pbm5lckhUTUwgPSAnPHNwYW4+JyArIGljb24gKyAnPC9zcGFuPjxzcGFuPicgKyBlc2NhcGVIdG1sKG1lc3NhZ2UpICsgJzwvc3Bhbj4nOw0KDQogICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodG9hc3QpOw0KICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsNCiAgICAgICAgdG9hc3QuY2xhc3NMaXN0LnJlbW92ZSgndHJhbnNsYXRlLXktMicsICdvcGFjaXR5LTAnKTsNCiAgICAgIH0sIDEwKTsNCg0KICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsNCiAgICAgICAgdG9hc3QuY2xhc3NMaXN0LmFkZCgnb3BhY2l0eS0wJywgJ3RyYW5zbGF0ZS15LTInKTsNCiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsNCiAgICAgICAgICBpZiAodG9hc3QucGFyZW50Tm9kZSkgdG9hc3QucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0b2FzdCk7DQogICAgICAgIH0sIDIwMCk7DQogICAgICB9LCAzNTAwKTsNCiAgICB9DQoNCiAgICBmdW5jdGlvbiBzaG93U3Bpbm5lcihtc2cpIHsNCiAgICAgIHZhciBvdmVybGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvYWRpbmdPdmVybGF5Jyk7DQogICAgICB2YXIgbGFiZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJ",
    "ZCgnbG9hZGluZ01lc3NhZ2UnKTsNCiAgICAgIGlmIChsYWJlbCAmJiBtc2cpIGxhYmVsLnRleHRDb250ZW50ID0gbXNnOw0KICAgICAgaWYgKG92ZXJsYXkpIHsNCiAgICAgICAgb3ZlcmxheS5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTsNCiAgICAgICAgb3ZlcmxheS5jbGFzc0xpc3QuYWRkKCdmbGV4Jyk7DQogICAgICB9DQogICAgfQ0KDQogICAgZnVuY3Rpb24gaGlkZVNwaW5uZXIoKSB7DQogICAgICB2YXIgb3ZlcmxheSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2FkaW5nT3ZlcmxheScpOw0KICAgICAgaWYgKG92ZXJsYXkpIHsNCiAgICAgICAgb3ZlcmxheS5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTsNCiAgICAgICAgb3ZlcmxheS5jbGFzc0xpc3QucmVtb3ZlKCdmbGV4Jyk7DQogICAgICB9DQogICAgfQ0KDQogICAgZnVuY3Rpb24gZXNjYXBlSHRtbChzdHIpIHsNCiAgICAgIGlmICghc3RyKSByZXR1cm4gJyc7DQogICAgICByZXR1cm4gU3RyaW5nKHN0cikNCiAgICAgICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JykNCiAgICAgICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKQ0KICAgICAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpDQogICAgICAgIC5yZXBsYWNlKC8iL2csICcmcXVvdDsnKQ0KICAgICAgICAucmVwbGFjZSgvJy9nLCAnJiMwMzk7Jyk7DQogICAgfQ0KDQogICAgdmFyIENBTk9OSUNBTF9XRUJfQVBQX1VSTCA9ICdodHRwczovL3NjcmlwdC5nb29nbGUuY29tL21hY3Jvcy9zL0FLZnlj",
    "YnlVRDBTTEhMdFhRQWJBeGlMOFY1aHFvTXRpRFh6ZVo3MGNvWDRpdEljOElXRWp3RTMxZXBrTV94ZXFXRjlPSzhkS2xRL2V4ZWMnOw0KDQogICAgZnVuY3Rpb24gZ2V0UmVzb2x2ZWRBcHBVcmwoKSB7DQogICAgICBpZiAoc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLndlYkFwcFVybCAmJiBzdGF0ZS5kYXRhLndlYkFwcFVybC5pbmRleE9mKCdtYWNyb3Mvcy8nKSAhPT0gLTEpIHsNCiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEud2ViQXBwVXJsOw0KICAgICAgfQ0KICAgICAgcmV0dXJuIENBTk9OSUNBTF9XRUJfQVBQX1VSTDsNCiAgICB9DQoNCiAgICBmdW5jdGlvbiBvcGVuUXJNb2RhbCgpIHsNCiAgICAgIHZhciB1cmwgPSBnZXRSZXNvbHZlZEFwcFVybCgpOw0KICAgICAgdmFyIHFySW1nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3FyTW9kYWxJbWcnKTsNCiAgICAgIGlmIChxckltZykgew0KICAgICAgICBxckltZy5zcmMgPSAnaHR0cHM6Ly9hcGkucXJzZXJ2ZXIuY29tL3YxL2NyZWF0ZS1xci1jb2RlLz9zaXplPTI1MHgyNTAmZGF0YT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHVybCk7DQogICAgICB9DQogICAgICB2YXIgbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdxck1vZGFsJyk7DQogICAgICBpZiAobSkgew0KICAgICAgICBtLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpOw0KICAgICAgICBtLmNsYXNzTGlzdC5hZGQoJ2ZsZXgnKTsNCiAgICAgIH0NCiAgICAgIGlmICh0eXBlb2YgbHVjaWRl",
    "ICE9PSAndW5kZWZpbmVkJyAmJiBsdWNpZGUuY3JlYXRlSWNvbnMpIHsNCiAgICAgICAgbHVjaWRlLmNyZWF0ZUljb25zKCk7DQogICAgICB9DQogICAgfQ0KDQogICAgZnVuY3Rpb24gY2xvc2VRck1vZGFsKCkgew0KICAgICAgdmFyIG0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncXJNb2RhbCcpOw0KICAgICAgaWYgKG0pIHsNCiAgICAgICAgbS5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTsNCiAgICAgICAgbS5jbGFzc0xpc3QucmVtb3ZlKCdmbGV4Jyk7DQogICAgICB9DQogICAgfQ0KDQogICAgZnVuY3Rpb24gY29weUFwcFVybCgpIHsNCiAgICAgIHZhciB1cmwgPSBnZXRSZXNvbHZlZEFwcFVybCgpOw0KICAgICAgaWYgKG5hdmlnYXRvci5jbGlwYm9hcmQgJiYgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQpIHsNCiAgICAgICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQodXJsKS50aGVuKGZ1bmN0aW9uKCkgew0KICAgICAgICAgIHNob3dUb2FzdCgn15TXp9eZ16nXldeoINeU15XXoteq16cg15HXlNem15zXl9eUISDwn5OLJywgJ3N1Y2Nlc3MnKTsNCiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oKSB7DQogICAgICAgICAgcHJvbXB0KCfXlNei16rXpyDXkNeqINeU16fXmdep15XXqCDXnNeQ16TXnNeZ16fXpteZ15Q6JywgdXJsKTsNCiAgICAgICAgfSk7DQogICAgICB9IGVsc2Ugew0KICAgICAgICB2YXIgdGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpOw0KICAgICAg",
    "ICB0YS52YWx1ZSA9IHVybDsNCiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0YSk7DQogICAgICAgIHRhLnNlbGVjdCgpOw0KICAgICAgICB0cnkgew0KICAgICAgICAgIGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7DQogICAgICAgICAgc2hvd1RvYXN0KCfXlNen15nXqdeV16gg15TXldei16rXpyDXkdeU16bXnNeX15QhIPCfk4snLCAnc3VjY2VzcycpOw0KICAgICAgICB9IGNhdGNoIChlKSB7DQogICAgICAgICAgcHJvbXB0KCfXlNei16rXpyDXkNeqINeU16fXmdep15XXqCDXnNeQ16TXnNeZ16fXpteZ15Q6JywgdXJsKTsNCiAgICAgICAgfQ0KICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRhKTsNCiAgICAgIH0NCiAgICB9DQogIDwvc2NyaXB0Pg0KPC9ib2R5Pg0KPC9odG1sPg0K"
  ];
  var b64 = b64Parts.join("");
  return Utilities.newBlob(Utilities.base64Decode(b64)).getDataAsString("UTF-8");
}
