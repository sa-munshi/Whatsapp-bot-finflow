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

// Clean up sessions older than 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [phone, session] of sessions.entries()) {
    if (session.timestamp && now - session.timestamp > 10 * 60 * 1000) {
      sessions.delete(phone)
    }
  }
}, 5 * 60 * 1000)

module.exports = { getSession, setSession, clearSession }
