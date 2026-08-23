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

/**
 * Upload CSV files and run the matching engine.
 * @param {File|null} gateway
 * @param {File|null} bank
 * @param {File|null} ledger
 * @param {number} threshold  0.0 – 1.0
 */
export async function uploadAndMatch(gateway, bank, ledger, threshold = 0.70) {
  const fd = new FormData()
  if (gateway) fd.append('gateway', gateway)
  if (bank) fd.append('bank', bank)
  if (ledger) fd.append('ledger', ledger)
  fd.append('threshold', String(threshold))
  return request('/upload', { method: 'POST', body: fd })
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

/**
 * Re-run matching with a new threshold (for the slider).
 */
export async function rematch(runId, threshold) {
  return request(`/rematch?run_id=${runId}&threshold=${threshold}`, { method: 'POST' })
}

/**
 * Stream an AI answer for a question.
 * Calls `onChunk(text)` for each streamed token.
 * Returns when the stream ends.
 */
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
    // Parse SSE lines
    const lines = text.split('\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return
        onChunk(data)
      }
    }
  }
}

/** Check backend health. */
export async function checkHealth() {
  return request('/health')
}
