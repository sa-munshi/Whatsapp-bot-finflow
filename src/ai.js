const fetch = require('node-fetch')

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

    // Strip <think> tags
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    try {
      return JSON.parse(jsonMatch[0])
    } catch(e) {
      // Try fixing truncated JSON
      let attempt = jsonMatch[0]
      const opens = (attempt.match(/\{/g) || []).length
      const closes = (attempt.match(/\}/g) || []).length
      attempt += '}'.repeat(Math.max(0, opens - closes))
      return JSON.parse(attempt)
    }
  } catch (err) {
    console.error('Parse error:', err.message)
    return null
  }
}

module.exports = { parseTextWithAI }
