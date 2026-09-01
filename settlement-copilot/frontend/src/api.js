/** Centralized API client for Settlement Copilot backend. */

const BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, opts = {}) {
  const defaultOpts = { credentials: 'include' }
  const finalOpts = { ...defaultOpts, ...opts }
  if (opts.headers) {
    finalOpts.headers = { ...defaultOpts.headers, ...opts.headers }
  }
  
  const res = await fetch(`${BASE}${path}`, finalOpts)
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    try {
      const jsonErr = JSON.parse(err);
      throw new Error(jsonErr.detail || `HTTP ${res.status}`);
    } catch (e) {
      if (e.message.startsWith('HTTP ') || e.message.includes('detail')) {
        throw e;
      }
      throw new Error(err || `HTTP ${res.status}`)
    }
  }
  return res.json()
}

/** Register a new user */
export async function register(name, email, password) {
  return request('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  })
}

/** Login */
export async function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
}

/** Logout */
export async function logout() {
  return request('/auth/logout', { method: 'POST' })
}

/** Get current user session */
export async function getMe() {
  return request('/auth/me')
}

/** Upload CSV files and run the matching engine. */
export async function uploadAndMatch(gateway, bank, ledger, threshold = 0.70) {
  const fd = new FormData()
  if (gateway) fd.append('gateway', gateway)
  if (bank) fd.append('bank', bank)
  if (ledger) fd.append('ledger', ledger)
  fd.append('threshold', String(threshold))
  return request('/upload', { method: 'POST', body: fd })
}


export async function getMatches(runId, threshold = 0, matchType = null, limit = 200) {
  const params = new URLSearchParams({ threshold, limit })
  if (runId && runId !== 'undefined' && runId !== 'null') {
    params.append('run_id', runId)
  }
  if (matchType) params.append('match_type', matchType)
  return request(`/matches?${params}`)
}

export async function getExceptions(runId, category = null, limit = 200) {
  const params = new URLSearchParams({ limit })
  if (runId && runId !== 'undefined' && runId !== 'null') {
    params.append('run_id', runId)
  }
  if (category) params.append('category', category)
  return request(`/exceptions?${params}`)
}

/** Get report for a run. */
export async function getReport(runId) {
  return request(`/report/${runId}`)
}

/** Get all reports. */
export async function listReports() {
  return request('/reports')
}

/** Re-run matching with a new threshold (for the slider). */
export async function rematch(runId, threshold) {
  return request(`/rematch?run_id=${runId}&threshold=${threshold}`, { method: 'POST' })
}

/** Stream an AI answer for a question. */
export async function askQuestion(question, runId, onChunk) {
  const fd = new FormData()
  fd.append('question', question)
  if (runId && runId !== 'undefined' && runId !== 'null') {
    fd.append('run_id', runId)
  }

  const res = await fetch(`${BASE}/ask`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value, { stream: true })
    const lines = text.split('\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return
        try {
          const parsed = JSON.parse(data)
          onChunk(parsed)
        } catch (e) {
          // Fallback if not JSON
          onChunk(data)
        }
      }
    }
  }
}

/** Check backend health. */
export async function checkHealth() {
  return request('/health')
}

/** Utility: Real CSV Export Download for any dataset. */
export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) return
  const headers = Object.keys(rows[0])
  const csvContent = [
    headers.join(','),
    ...rows.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/** Get settlements and resolved exceptions */
export async function getSettlements() {
  return request('/settlements')
}
