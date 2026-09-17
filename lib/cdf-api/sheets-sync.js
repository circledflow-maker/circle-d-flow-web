/**
 * Google Sheets sync for Circle D Flow registrations
 * Sheet: https://docs.google.com/spreadsheets/d/1w3rYMUNGSU7X0w68jVo6q_ZTM0tEG0Y20liEMaxAfWs
 *
 * Configure either:
 *   GOOGLE_SHEETS_WEBHOOK_URL  — Apps Script Web App (recommended)
 *   GOOGLE_SHEETS_ID           — defaults to the sheet above
 *
 * Apps Script (Extensions → Apps Script on the sheet):
 *   function doPost(e) {
 *     const body = JSON.parse(e.postData.contents || '{}');
 *     const ss = SpreadsheetApp.openById(body.sheetId || SpreadsheetApp.getActive().getId());
 *     const sh = ss.getSheetByName(body.tab || 'Registrations') || ss.insertSheet(body.tab || 'Registrations');
 *     if (body.clear) sh.clear();
 *     if (body.headers) sh.getRange(1,1,1,body.headers.length).setValues([body.headers]);
 *     if (body.rows && body.rows.length) {
 *       const start = body.replace ? 2 : Math.max(2, sh.getLastRow() + 1);
 *       if (body.replace) {
 *         const last = sh.getLastRow();
 *         if (last > 1) sh.getRange(2, 1, last - 1, body.headers.length).clearContent();
 *       }
 *       sh.getRange(start, 1, body.rows.length, body.rows[0].length).setValues(body.rows);
 *     }
 *     if (body.summary) {
 *       const sum = ss.getSheetByName('Summary') || ss.insertSheet('Summary');
 *       sum.clear();
 *       sum.getRange(1,1,body.summary.length,body.summary[0].length).setValues(body.summary);
 *     }
 *     return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
 *   }
 * Deploy → Web app → Anyone → copy URL into GOOGLE_SHEETS_WEBHOOK_URL
 */

const DEFAULT_SHEET_ID = '1w3rYMUNGSU7X0w68jVo6q_ZTM0tEG0Y20liEMaxAfWs';

function sheetId() {
  return process.env.GOOGLE_SHEETS_ID || DEFAULT_SHEET_ID;
}

function webhookUrl() {
  return process.env.GOOGLE_SHEETS_WEBHOOK_URL || process.env.SHEETS_WEBHOOK_URL || '';
}

async function pushToSheet(payload) {
  const url = webhookUrl();
  if (!url) {
    return {
      ok: false,
      skipped: true,
      reason: 'Set GOOGLE_SHEETS_WEBHOOK_URL (Apps Script web app) on Vercel',
      sheetId: sheetId(),
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId()}/edit`,
    };
  }

  const body = {
    sheetId: sheetId(),
    ...payload,
    syncedAt: new Date().toISOString(),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch (_) {
    data = { raw: text.slice(0, 200) };
  }
  if (!res.ok) {
    return { ok: false, status: res.status, data, sheetId: sheetId() };
  }
  return { ok: true, data, sheetId: sheetId(), sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId()}/edit` };
}

module.exports = { DEFAULT_SHEET_ID, sheetId, webhookUrl, pushToSheet };
