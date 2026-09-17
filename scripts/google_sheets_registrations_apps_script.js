/**
 * Paste into: Google Sheet → Extensions → Apps Script
 * Sheet ID: 1w3rYMUNGSU7X0w68jVo6q_ZTM0tEG0Y20liEMaxAfWs
 *
 * Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Copy the Web App URL → Vercel env GOOGLE_SHEETS_WEBHOOK_URL
 */
function doPost(e) {
  const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  const ss = SpreadsheetApp.openById(
    body.sheetId || '1w3rYMUNGSU7X0w68jVo6q_ZTM0tEG0Y20liEMaxAfWs'
  );
  const tab = body.tab || 'Registrations';
  const sh = ss.getSheetByName(tab) || ss.insertSheet(tab);

  if (body.headers && body.headers.length) {
    sh.getRange(1, 1, 1, body.headers.length).setValues([body.headers]);
  }

  if (body.replace) {
    const last = sh.getLastRow();
    if (last > 1) {
      sh.getRange(2, 1, last - 1, Math.max(1, (body.headers || []).length || 8)).clearContent();
    }
  }

  if (body.rows && body.rows.length) {
    const cols = body.rows[0].length;
    sh.getRange(2, 1, body.rows.length, cols).setValues(body.rows);
  }

  if (body.summary && body.summary.length) {
    const sum = ss.getSheetByName('Summary') || ss.insertSheet('Summary');
    sum.clear();
    sum.getRange(1, 1, body.summary.length, body.summary[0].length).setValues(body.summary);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, rows: (body.rows && body.rows.length) || 0 })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, service: 'cdf-sheets-sync' })
  ).setMimeType(ContentService.MimeType.JSON);
}
