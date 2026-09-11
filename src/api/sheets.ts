/** Extract spreadsheet ID from a normal Google Sheets URL */
export function parseSpreadsheetId(urlOrId: string): string | null {
  const raw = urlOrId.trim()
  if (!raw) return null
  if (/^[a-zA-Z0-9-_]{20,}$/.test(raw) && !raw.includes('/')) return raw
  const m = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return m?.[1] || null
}

export type SheetBridgeResponse = {
  ok?: boolean
  appended?: number
  skipped?: number
  headers?: string[]
  sheetName?: string
  error?: string
  service?: string
}

async function postToSheetWebApp(webAppUrl: string, body: unknown): Promise<SheetBridgeResponse> {
  const url = webAppUrl.trim()
  if (!url) throw new Error('Web App URL missing')

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
    redirect: 'follow',
    credentials: 'omit',
  })

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      `${res.status} Forbidden — Deploy Web App as Execute as: Me + Who has access: Anyone. Open /exec once in browser → Allow.`
    )
  }

  const text = await res.text()
  let json: SheetBridgeResponse = {}
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(
      `Sheet bridge failed (${res.status}) — update Apps Script, redeploy (Me + Anyone), open /exec once, retry.`
    )
  }

  if (!res.ok || json.ok === false) {
    throw new Error(json.error || `Sheet bridge failed (${res.status})`)
  }

  return json
}

export async function testSheetWebApp(webAppUrl: string): Promise<{ ok: boolean; message: string }> {
  const url = webAppUrl.trim()
  if (!url) throw new Error('Web App URL missing')

  const res = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    credentials: 'omit',
  })
  const text = await res.text()

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      `${res.status} Forbidden — Redeploy: Execute as Me, Who has access Anyone. Open /exec URL once → Allow.`
    )
  }

  try {
    const json = JSON.parse(text) as SheetBridgeResponse
    if (json.ok) return { ok: true, message: json.service || 'Web App OK' }
    throw new Error(json.error || 'Web App responded but not OK')
  } catch (err: any) {
    if (err?.message && !err.message.includes('JSON')) throw err
    if (!res.ok) throw new Error(`Web App test failed (${res.status}). Open URL in browser and Allow.`)
    throw new Error('Web App did not return JSON — check deploy settings and script.')
  }
}

export async function fetchSheetHeaders(opts: {
  webAppUrl: string
  spreadsheetId: string
  sheetName: string
}): Promise<string[]> {
  const json = await postToSheetWebApp(opts.webAppUrl, {
    action: 'getHeaders',
    spreadsheetId: opts.spreadsheetId,
    sheetName: opts.sheetName || 'Sheet1',
  })
  // Use Sheet row-1, then sanitize jammed/duplicate leftovers
  const headers = sanitizeSheetHeaders(
    (json.headers || []).map((h) => String(h || '').trim()).filter(Boolean)
  )
  if (!headers.length) {
    throw new Error(
      'No headers found on row 1. Put column names in the first row of your sheet tab, then Load columns again.'
    )
  }
  return headers
}

export async function appendSheetRows(opts: {
  webAppUrl: string
  spreadsheetId: string
  sheetName: string
  headers: string[]
  rows: string[][]
  /** Prefer objects so Apps Script can align to Sheet columns by name */
  rowMaps?: Record<string, string>[]
  skipDuplicates?: boolean
}): Promise<{ appended: number; skipped: number }> {
  const json = await postToSheetWebApp(opts.webAppUrl, {
    action: 'append',
    spreadsheetId: opts.spreadsheetId,
    sheetName: opts.sheetName || 'Sheet1',
    headers: opts.headers,
    rows: opts.rows,
    rowMaps: opts.rowMaps || [],
    skipDuplicates: !!opts.skipDuplicates,
    writeHeadersIfEmpty: true,
  })
  return {
    appended: json.appended ?? opts.rows.length,
    skipped: json.skipped ?? 0,
  }
}

/** Collapse spaces + lower-case for header matching */
export function normalizeHeaderKey(h: string): string {
  return String(h || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Read a value from a row map using exact or fuzzy header match */
export function getValueForHeader(values: Record<string, string>, header: string): string {
  if (!values) return ''
  if (Object.prototype.hasOwnProperty.call(values, header)) {
    return String(values[header] ?? '').trim()
  }
  const want = normalizeHeaderKey(header)
  for (const [k, v] of Object.entries(values)) {
    if (normalizeHeaderKey(k) === want) return String(v ?? '').trim()
  }
  // Role-based fallback (handles TaskName vs TASKNAME, Assigned To vs ASSIGNED TO)
  const role = headerRole(header)
  if (role) {
    for (const [k, v] of Object.entries(values)) {
      if (headerRole(k) === role) return String(v ?? '').trim()
    }
  }
  return ''
}

function headerRole(header: string): string | null {
  const h = normalizeHeaderKey(header)
  if (/^(task\s*name|taskname|title|n)$/.test(h) || /^work\s*item$/.test(h)) return 'task'
  if (/assigned|owner|developer/.test(h)) return 'assigned'
  if (/^(end\s*)?date$|due|deadline|work\s*date/.test(h)) return 'date'
  if (/^status$|state|progress/.test(h)) return 'status'
  if (/^remarks?$|^notes?$|^comments?$/.test(h)) return 'remark'
  return null
}

/** True if one cell contains multiple column titles jammed together */
export function isJammedHeader(header: string): boolean {
  const h = normalizeHeaderKey(header)
  if (!h || !/\s/.test(h)) return false
  let hits = 0
  if (/task\s*name|taskname/.test(h)) hits++
  if (/\bassigned\b/.test(h)) hits++
  if (/end\s*date|(^|\s)date(\s|$)/.test(h)) hits++
  if (/\bstatus\b/.test(h)) hits++
  if (/\bremarks?\b/.test(h)) hits++
  return hits >= 2
}

/**
 * Clean headers for UI + upload:
 * - drop jammed multi-title cells
 * - dedupe by name / role
 * - keep stable team-sheet order
 */
export function sanitizeSheetHeaders(raw: string[]): string[] {
  const list = (raw || []).map((h) => String(h || '').trim()).filter(Boolean)
  const hadJammed = list.some(isJammedHeader)
  const proper = list.filter((h) => !isJammedHeader(h))

  const out: string[] = []
  const seenKeys = new Set<string>()
  const seenRoles = new Set<string>()

  for (const h of proper) {
    const key = normalizeHeaderKey(h)
    if (seenKeys.has(key)) continue
    const role = headerRole(h)
    if (role && seenRoles.has(role)) continue
    seenKeys.add(key)
    if (role) seenRoles.add(role)
    out.push(h)
  }

  if (hadJammed && !seenRoles.has('task')) {
    out.unshift('TaskName')
    seenRoles.add('task')
  }

  return orderSheetHeaders(out)
}

const ROLE_ORDER = ['task', 'assigned', 'date', 'status', 'remark'] as const

function orderSheetHeaders(headers: string[]): string[] {
  const byRole = new Map<string, string>()
  const extras: string[] = []
  for (const h of headers) {
    const role = headerRole(h)
    if (role && !byRole.has(role)) byRole.set(role, h)
    else if (!role) extras.push(h)
  }
  const ordered: string[] = []
  for (const role of ROLE_ORDER) {
    const h = byRole.get(role)
    if (h) ordered.push(h)
  }
  return [...ordered, ...extras]
}

/**
 * Keep Sheet headers as-is (one cell = one column), then sanitize junk.
 */
export function normalizeSheetHeaders(raw: string[]): string[] {
  return sanitizeSheetHeaders(raw)
}

/** Suggest default cell value from column header name */
export function suggestDefaultForHeader(
  header: string,
  opts?: { assignedTo?: string; status?: string; today?: string }
): string {
  const role = headerRole(header)
  if (role === 'assigned') return opts?.assignedTo || ''
  if (role === 'date') return opts?.today || new Date().toISOString().slice(0, 10)
  if (role === 'status') return opts?.status || ''
  return ''
}

/** Map a DevLog task onto dynamic Sheet columns by header name */
export function mapTaskToSheetValues(
  task: {
    title: string
    status: 'pending' | 'completed'
    workDate?: string | null
    remarks?: string
    description?: string
  },
  headers: string[],
  opts?: { assignedTo?: string; statusTodo?: string; statusDone?: string }
): Record<string, string> {
  const today = new Date().toISOString().slice(0, 10)
  const assignedTo = opts?.assignedTo || ''
  const statusTodo = opts?.statusTodo || 'To Do'
  const statusDone = opts?.statusDone || 'Done'
  const values: Record<string, string> = {}

  for (const header of headers) {
    const role = headerRole(header)
    if (role === 'task') values[header] = task.title
    else if (role === 'assigned') values[header] = assignedTo
    else if (role === 'date') values[header] = task.workDate || today
    else if (role === 'status') values[header] = task.status === 'completed' ? statusDone : statusTodo
    else if (role === 'remark') values[header] = (task.remarks || task.description || '').trim()
    else {
      values[header] = suggestDefaultForHeader(header, {
        assignedTo,
        status: statusTodo,
        today,
      })
    }
  }
  return values
}

/** Build row array in header order from a values map (fuzzy header match) */
export function valuesToRow(headers: string[], values: Record<string, string>): string[] {
  return headers.map((h) => getValueForHeader(values, h))
}

/** Build a row map keyed by exact Sheet headers */
export function valuesToRowMap(
  headers: string[],
  values: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const h of headers) out[h] = getValueForHeader(values, h)
  return out
}

/** Legacy fixed DevLog task headers (optional task upload) */
export const SHEET_HEADERS = [
  'id',
  'title',
  'status',
  'priority',
  'type',
  'board',
  'workDate',
  'estimatedHours',
  'actualHours',
  'gitCommit',
  'branch',
  'remarks',
  'completedAt',
  'createdAt',
  'updatedAt',
] as const

/** Paste into Extensions → Apps Script, then redeploy Web App */
export const APPS_SCRIPT_SOURCE = `/**
 * DevLog → Google Sheet bridge
 * Deploy: Execute as Me · Who has access: Anyone
 *
 * Append always aligns to Sheet row-1 headers (by name).
 * Sheet.getRange(row, column, numRows, numColumns) — 3rd/4th are COUNTS.
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action || 'append';
    var ss = body.spreadsheetId
      ? SpreadsheetApp.openById(body.spreadsheetId)
      : SpreadsheetApp.getActiveSpreadsheet();
    var name = body.sheetName || 'Sheet1';
    var sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);

    if (action === 'getHeaders') {
      return json_(getHeaders_(sheet, name));
    }

    if (action === 'append') {
      return json_(appendRows_(sheet, body));
    }

    return json_({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function getHeaders_(sheet, name) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) {
    return { ok: true, headers: [], sheetName: name };
  }
  var row = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var headers = [];
  for (var i = 0; i < row.length; i++) {
    var cell = row[i] === null || row[i] === undefined ? '' : String(row[i]).trim();
    if (cell) headers.push(cell);
    else if (headers.length) break;
  }
  return { ok: true, headers: headers, sheetName: name };
}

function normKey_(h) {
  return String(h || '').toLowerCase().replace(/\\s+/g, ' ').trim();
}

function roleOf_(h) {
  var k = normKey_(h);
  if (/^(task\\s*name|taskname|title|n)$/.test(k) || /^work\\s*item$/.test(k)) return 'task';
  if (/assigned|owner|developer/.test(k)) return 'assigned';
  if (/^(end\\s*)?date$|due|deadline|work\\s*date/.test(k)) return 'date';
  if (/^status$|state|progress/.test(k)) return 'status';
  if (/^remarks?$|^notes?$|^comments?$/.test(k)) return 'remark';
  return '';
}

function pickValue_(map, header) {
  if (!map) return '';
  if (map[header] !== undefined && map[header] !== null) return String(map[header]);
  var want = normKey_(header);
  var keys = Object.keys(map);
  for (var i = 0; i < keys.length; i++) {
    if (normKey_(keys[i]) === want) return String(map[keys[i]] == null ? '' : map[keys[i]]);
  }
  var role = roleOf_(header);
  if (role) {
    for (var j = 0; j < keys.length; j++) {
      if (roleOf_(keys[j]) === role) return String(map[keys[j]] == null ? '' : map[keys[j]]);
    }
  }
  return '';
}

function appendRows_(sheet, body) {
  var clientHeaders = body.headers || [];
  var rows = body.rows || [];
  var rowMaps = body.rowMaps || [];
  var skipDuplicates = !!body.skipDuplicates;
  var writeHeadersIfEmpty = body.writeHeadersIfEmpty !== false;

  if (writeHeadersIfEmpty && clientHeaders.length && sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, clientHeaders.length).setValues([clientHeaders]);
  }

  var sheetHeaders = getHeaders_(sheet, '').headers;
  if (!sheetHeaders.length) {
    return { ok: false, error: 'Sheet has no headers on row 1' };
  }

  var width = sheetHeaders.length;
  var normalized = [];

  var count = Math.max(rowMaps.length, rows.length);
  for (var r = 0; r < count; r++) {
    var map = rowMaps[r] || null;
    if (!map && rows[r] && clientHeaders.length) {
      map = {};
      for (var c = 0; c < clientHeaders.length; c++) {
        map[clientHeaders[c]] = rows[r][c] == null ? '' : rows[r][c];
      }
    }
    var out = [];
    for (var i = 0; i < width; i++) {
      out.push(pickValue_(map || {}, sheetHeaders[i]));
    }
    normalized.push(out);
  }

  if (!normalized.length) {
    return { ok: true, appended: 0, skipped: 0 };
  }

  var toAppend = normalized;
  var skipped = 0;

  if (skipDuplicates) {
    var last = sheet.getLastRow();
    var existing = {};
    if (last >= 2) {
      var idCount = last - 1;
      var ids = sheet.getRange(2, 1, idCount, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (ids[i][0]) existing[String(ids[i][0])] = true;
      }
    }
    toAppend = [];
    for (var j = 0; j < normalized.length; j++) {
      var key = String(normalized[j][0] || '');
      if (key && existing[key]) {
        skipped++;
        continue;
      }
      toAppend.push(normalized[j]);
      if (key) existing[key] = true;
    }
  }

  if (toAppend.length) {
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, toAppend.length, width).setValues(toAppend);
  }

  return { ok: true, appended: toAppend.length, skipped: skipped, headers: sheetHeaders };
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ ok: true, service: 'DevLog Sheet Bridge' });
}
`
