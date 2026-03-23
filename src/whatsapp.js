const fetch = require('node-fetch')

const PHONE_ID = process.env.WHATSAPP_PHONE_ID
const TOKEN = process.env.WHATSAPP_TOKEN
const API_URL = `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`

// Send a plain text message
async function sendMessage(to, text) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text }
      })
    })
    const data = await res.json()
    if (data.error) console.error('[WA Send Error]', data.error)
    return data
  } catch (err) {
    console.error('[WA Send Failed]', err.message)
  }
}

// Send interactive buttons (confirm/cancel)
async function sendButtons(to, bodyText, buttons) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText },
          action: {
            buttons: buttons.map(b => ({
              type: 'reply',
              reply: { id: b.id, title: b.title }
            }))
          }
        }
      })
    })
    const data = await res.json()
    if (data.error) console.error('[WA Button Error]', data.error)
    return data
  } catch (err) {
    console.error('[WA Button Failed]', err.message)
  }
}

// Mark message as read
async function markRead(messageId) {
  try {
    await fetch(API_URL.replace('/messages', '/messages'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      })
    })
  } catch (err) { /* silent */ }
}

function formatINR(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

module.exports = { sendMessage, sendButtons, markRead, formatINR }
