// Simple in-memory session store
// Stores pending parsed transaction per user phone
const sessions = new Map()

function getSession(phone) {
  return sessions.get(phone) || { pending: null }
}

function setSession(phone, data) {
  sessions.set(phone, data)
}

function clearSession(phone) {
  sessions.delete(phone)
}

// ─── Preview preference (persists in-memory, resets on server restart) ────────
const previewEnabled = new Map()

function getPreview(phone) {
  return previewEnabled.get(phone) || false
}

function setPreview(phone, enabled) {
  previewEnabled.set(phone, enabled)
}

// ─── Pending bulk transactions for preview confirmation ───────────────────────
function getPendingBulk(phone) {
  const session = sessions.get(phone)
  return (session && session.pendingBulk) ? session.pendingBulk : null
}

function setPendingBulk(phone, transactions) {
  const session = sessions.get(phone) || {}
  sessions.set(phone, { ...session, pendingBulk: transactions, timestamp: Date.now() })
}

function clearPendingBulk(phone) {
  const session = sessions.get(phone)
  if (session) {
    delete session.pendingBulk
    sessions.set(phone, session)
  }
}

// Clean up sessions older than 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [phone, session] of sessions.entries()) {
    if (session.timestamp && now - session.timestamp > 10 * 60 * 1000) {
      sessions.delete(phone)
    }
  }
}, 5 * 60 * 1000)

module.exports = {
  getSession, setSession, clearSession,
  getPreview, setPreview,
  getPendingBulk, setPendingBulk, clearPendingBulk
}
