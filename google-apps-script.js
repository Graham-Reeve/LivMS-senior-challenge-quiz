/*
  Paste this code into Google Apps Script attached to a Google Sheet.

  Suggested sheet name: Results
  Header row:
  timestamp | competitionYear | studentName | studentSchool | score | totalQuestions | elapsedSeconds | startedAt | finishedAt | answerLogJson

  Then deploy as a Web App:
  - Execute as: Me
  - Who has access: Anyone

  IMPORTANT:
  Replace ADMIN_KEY below with a secret value.
*/

const SHEET_NAME = 'Results';
const ADMIN_KEY = 'CHANGE_ME_TO_A_PRIVATE_SECRET';

function doGet(e) {
  const action = (e.parameter.action || '').trim();

  if (action === 'leaderboard') {
    return jsonOutput(getLeaderboard_(e.parameter));
  }

  return jsonOutput({ ok: true, message: 'Quiz API is running.' });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const action = (payload.action || '').trim();

    if (action === 'submit') {
      return jsonOutput(submitResult_(payload));
    }

    return jsonOutput({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    return jsonOutput({ ok: false, error: err.message || 'Invalid request.' });
  }
}

function submitResult_(payload) {
  validateSubmission_(payload);

  const sheet = getSheet_();
  sheet.appendRow([
    new Date(),
    payload.competitionYear || '',
    payload.studentName || '',
    payload.studentSchool || '',
    Number(payload.score || 0),
    Number(payload.totalQuestions || 0),
    Number(payload.elapsedSeconds || 0),
    payload.startedAt || '',
    payload.finishedAt || '',
    JSON.stringify(payload.answerLog || [])
  ]);

  return { ok: true };
}

function getLeaderboard_(params) {
  if ((params.adminKey || '').trim() !== ADMIN_KEY) {
    return { ok: false, error: 'Invalid admin key.' };
  }

  const competitionYear = (params.competitionYear || '').trim();
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return { ok: true, rows: [] };
  }

  const rows = values.slice(1)
    .map(function (row) {
      return {
        timestamp: row[0],
        competitionYear: String(row[1] || ''),
        studentName: String(row[2] || ''),
        studentSchool: String(row[3] || ''),
        score: Number(row[4] || 0),
        totalQuestions: Number(row[5] || 0),
        elapsedSeconds: Number(row[6] || 0),
        startedAt: String(row[7] || ''),
        finishedAt: String(row[8] || ''),
        answerLogJson: String(row[9] || '[]')
      };
    })
    .filter(function (row) {
      return !competitionYear || row.competitionYear === competitionYear;
    })
    .sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      if (a.elapsedSeconds !== b.elapsedSeconds) return a.elapsedSeconds - b.elapsedSeconds;
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

  return { ok: true, rows: rows };
}

function validateSubmission_(payload) {
  if (!payload.studentName || !String(payload.studentName).trim()) {
    throw new Error('Missing student name.');
  }

  if (!Array.isArray(payload.answerLog)) {
    throw new Error('Missing answer log.');
  }

  if (Number(payload.totalQuestions || 0) <= 0) {
    throw new Error('Invalid question count.');
  }

  if (Number(payload.score || 0) < 0) {
    throw new Error('Invalid score.');
  }

  if (Number(payload.elapsedSeconds || 0) < 0) {
    throw new Error('Invalid elapsed time.');
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'timestamp',
      'competitionYear',
      'studentName',
      'studentSchool',
      'score',
      'totalQuestions',
      'elapsedSeconds',
      'startedAt',
      'finishedAt',
      'answerLogJson'
    ]);
  }

  return sheet;
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
