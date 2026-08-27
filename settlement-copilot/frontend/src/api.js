/** Centralized API client for Settlement Copilot backend. */

const BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

/** Register a new user */
export async function register(name, email, password) {
  return request('/auth/register', {
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

/** 1-click demo run using pre-loaded synthetic dataset. */
export async function runDemoReconciliation(threshold = 0.70) {
  return request(`/run-demo?threshold=${threshold}`, { method: 'POST' })
}

/** Get match results for a run. */
export async function getMatches(runId, threshold = 0, matchType = null, limit = 200) {
  const params = new URLSearchParams({ run_id: runId, threshold, limit })
  if (matchType) params.append('match_type', matchType)
  return request(`/matches?${params}`)
}

/** Get exception list. */
export async function getExceptions(runId, category = null, limit = 200) {
  const params = new URLSearchParams({ run_id: runId, limit })
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
  if (runId) fd.append('run_id', runId)

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
