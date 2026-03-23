const fetch = require('node-fetch')

// ─── Parse text with Sarvam-m ────────────────────────────────────────────────
async function parseTextWithAI(text) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': process.env.SARVAM_API_KEY
      },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: [
          {
            role: 'system',
            content: `You are a financial transaction parser for an Indian finance app. Extract transaction details from text (English, Hindi, or Bengali) and return ONLY valid JSON.

Categories available:
Expense: Food & Dining, Transport, Shopping, Bills & Utilities, Entertainment, Health, Education, Rent, Groceries, Personal Care, Other
Income: Salary, Freelance, Business, Investment, Gift

Return this exact JSON format:
{
  "amount": <number only, no currency symbols>,
  "type": "income" or "expense",
  "category": "<exact category name from list above>",
  "note": "<brief description in English>",
  "date": "<YYYY-MM-DD format, use today if not mentioned>"
}

Today's date: ${today}
Return ONLY the JSON object, no explanation, no markdown.`
          },
          { role: 'user', content: text }
        ],
        max_tokens: 600,
        temperature: 0.1
      })
    })

    const data = await response.json()
    if (data.error) { console.error('Sarvam error:', data.error); return null }

    let content = data.choices?.[0]?.message?.content
    if (!content) return null

    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    try {
      return JSON.parse(jsonMatch[0])
    } catch(e) {
      let attempt = jsonMatch[0]
      const opens = (attempt.match(/\{/g) || []).length
      const closes = (attempt.match(/\}/g) || []).length
      attempt += '}'.repeat(Math.max(0, opens - closes))
      return JSON.parse(attempt)
    }
  } catch (err) {
    console.error('Text parse error:', err.message)
    return null
  }
}

// ─── Parse receipt photo with Gemini ─────────────────────────────────────────
async function parsePhotoWithAI(base64Image, mimeType = 'image/jpeg') {
  try {
    const today = new Date().toISOString().split('T')[0]
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Image } },
              { text: `Analyze this receipt or bill image and extract transaction details. Return ONLY valid JSON:
{
  "amount": <total amount as number, no currency symbols>,
  "type": "expense",
  "category": "<one of: Food & Dining, Transport, Shopping, Bills & Utilities, Entertainment, Health, Education, Groceries, Personal Care, Other>",
  "note": "<merchant name or brief description, max 50 chars>",
  "date": "<YYYY-MM-DD, use today ${today} if not visible>"
}
Return ONLY the JSON object, no explanation, no markdown.` }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
        })
      }
    )

    const data = await response.json()
    if (data.error) { console.error('Gemini error:', data.error); return null }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!content) return null

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    return JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error('Photo parse error:', err.message)
    return null
  }
}

// ─── Download WhatsApp media ──────────────────────────────────────────────────
async function downloadWhatsAppMedia(mediaId) {
  try {
    // Step 1: Get media URL
    const urlRes = await fetch(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      { headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}` } }
    )
    const urlData = await urlRes.json()
    if (!urlData.url) return null

    // Step 2: Download media
    const mediaRes = await fetch(urlData.url, {
      headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}` }
    })
    const buffer = await mediaRes.buffer()
    const base64 = buffer.toString('base64')
    const mimeType = urlData.mime_type || 'image/jpeg'

    return { base64, mimeType }
  } catch (err) {
    console.error('Media download error:', err.message)
    return null
  }
}

module.exports = { parseTextWithAI, parsePhotoWithAI, downloadWhatsAppMedia }
