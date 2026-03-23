const fs = require('fs')
const path = require('path')

const DB_FILE = path.join(__dirname, '../data/transactions.json')

// Ensure data directory exists
function ensureDir() {
  const dir = path.dirname(DB_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// Load all data
function loadAll() {
  ensureDir()
  if (!fs.existsSync(DB_FILE)) return {}
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
  } catch (e) {
    return {}
  }
}

// Save all data
function saveAll(data) {
  ensureDir()
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

// ─── TEST USERS ───────────────────────────────────────────────────────────────
// phone → { name, connected }
const TEST_USERS = {
  "919046939869": { name: "Sadab", connected: true }
  // add more: "91xxxxxxxxxx": { name: "Name", connected: true }
}

// Get user by phone
function getUserByPhone(phone) {
  const user = TEST_USERS[phone]
  if (!user || !user.connected) return null
  return { user_id: phone, name: user.name }
}

// Disconnect user
function disconnectUser(phone) {
  if (TEST_USERS[phone]) {
    TEST_USERS[phone].connected = false
    return true
  }
  return false
}

// Reconnect user (for testing)
function reconnectUser(phone) {
  if (TEST_USERS[phone]) {
    TEST_USERS[phone].connected = true
    return true
  }
  return false
}

// Save transaction locally
function saveTransaction(userId, parsed) {
  try {
    const all = loadAll()
    if (!all[userId]) all[userId] = []

    const tx = {
      id: Date.now().toString(),
      amount: Number(parsed.amount),
      type: parsed.type || 'expense',
      category: parsed.category || 'Other',
      note: parsed.note || '',
      date: parsed.date || new Date().toISOString().split('T')[0],
      saved_at: new Date().toISOString()
    }

    all[userId].push(tx)
    saveAll(all)
    console.log('[LOCAL] Saved transaction:', tx)
    return { data: tx, error: null }
  } catch (err) {
    console.error('[LOCAL] Save failed:', err.message)
    return { data: null, error: err.message }
  }
}

// Get last 5 transactions
function getTransactions(userId) {
  const all = loadAll()
  return (all[userId] || []).slice(-5).reverse()
}

// Get balance summary
function getBalance(userId) {
  const all = loadAll()
  const txs = all[userId] || []
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  return { income, expense, balance: income - expense }
}

// Get this month's balance
function getMonthlyBalance(userId) {
  const all = loadAll()
  const txs = all[userId] || []
  const month = new Date().toISOString().slice(0, 7)
  const monthTxs = txs.filter(t => t.date && t.date.startsWith(month))
  const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  return { income, expense, balance: income - expense }
}

// ─── Welcome seen tracker (in-memory) ────────────────────────────────────────
const welcomeSeen = new Set()

function hasSeenWelcome(phone) {
  return welcomeSeen.has(phone)
}

function markWelcomeSeen(phone) {
  welcomeSeen.add(phone)
}

module.exports = {
  getUserByPhone,
  disconnectUser,
  reconnectUser,
  saveTransaction,
  getTransactions,
  getBalance,
  getMonthlyBalance,
  hasSeenWelcome,
  markWelcomeSeen
}
