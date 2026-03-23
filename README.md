# FinFlow WhatsApp Bot

Minimal WhatsApp bot for FinFlow — add transactions via natural language.

## Features
- Natural language transaction parsing (Sarvam-m AI)
- Confirm / Cancel buttons before saving
- Budget alert notifications after saving
- Supports English, Hindi, Bengali

## Setup

### 1. Clone and install
```bash
git clone your-repo
cd finflow-whatsapp
npm install
cp .env.example .env
# Fill in your .env values
```

### 2. Environment Variables
| Variable | Where to get |
|---|---|
| `WHATSAPP_TOKEN` | Meta Developer Console → WhatsApp → API Setup |
| `WHATSAPP_PHONE_ID` | Meta Developer Console → WhatsApp → API Setup |
| `WHATSAPP_VERIFY_TOKEN` | Any string you choose (e.g. finflow_verify_2026) |
| `SUPABASE_URL` | Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings → API |
| `SARVAM_API_KEY` | dashboard.sarvam.ai |
| `APP_URL` | Your Vercel deployment URL |
| `WEBHOOK_SECRET` | Same as Telegram bot |

### 3. Add whatsapp_phone column to Supabase
Run this SQL in Supabase SQL Editor:
```sql
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;
```

### 4. Deploy to Render
- New Web Service → connect GitHub repo
- Build Command: `npm install`
- Start Command: `node src/index.js`
- Add all environment variables

### 5. Set Webhook in Meta Developer Console
- Go to WhatsApp → Configuration
- Webhook URL: `https://your-bot.onrender.com/webhook`
- Verify Token: `finflow_verify_2026` (or whatever you set)
- Subscribe to: `messages`

### 6. Add UptimeRobot
Ping `https://your-bot.onrender.com` every 5 minutes to keep alive.

## Usage
User sends: "spent 500 on lunch"
Bot replies with preview + Save/Cancel buttons
User taps Save → saved to FinFlow

## Next.js App Changes Needed
In your Settings page, when user connects WhatsApp,
save their phone number (without + prefix):
```typescript
// e.g. for +91 98765 43210 → store as "919876543210"
await supabase
  .from('settings')
  .update({ whatsapp_phone: phoneNumber })
  .eq('user_id', userId)
```
