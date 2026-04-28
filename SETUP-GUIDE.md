# Melanu Technologies — Setup Guide

## 📦 What's Included

- `index.html` — Home with animated hero + carousel + 5 sectors
- `products.html` — All 5 sectors (Semi, EV, Aerospace, **Automobile**, Robotics) with carousel
- `about.html` — Company info with carousel
- `contact.html` — Enquiry form + contact info
- `style.css` — Complete styling (white/green theme)
- `script.js` — All interactions (form, carousel, AI chatbot)
- `logo.svg` — Animated orbital rings logo
- `cloudflare-worker.js` — AI chatbot backend (deploy separately)

---

## ✅ Step 1: Setup Supabase Table (5 mins)

Go to Supabase → SQL Editor → run this:

```sql
CREATE TABLE enquiries (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  sector TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert enquiries" ON enquiries
  FOR INSERT TO anon
  WITH CHECK (true);
```

---

## ✅ Step 2: Push 7 Files to GitHub (5 mins)

Upload these to your `Melanu` repo (delete old ones first):

- index.html, products.html, about.html, contact.html
- style.css, script.js, logo.svg

**Don't upload `cloudflare-worker.js` to GitHub** — that's deployed separately.

Cloudflare Pages auto-deploys in ~30 seconds.

---

## ✅ Step 3: Deploy AI Chatbot Worker (10 mins)

### 3a. Create Worker
1. Go to **Cloudflare dashboard** → **Workers & Pages** → **Create** → **Workers** → **Create worker**
2. Name: `melanu-chatbot`
3. Click **Deploy** (deploys default code)
4. Click **Edit code**
5. Delete everything, paste the contents of `cloudflare-worker.js`
6. Click **Deploy**

### 3b. Add Anthropic API Key
1. In your worker → **Settings** → **Variables and Secrets**
2. Click **+ Add** → choose **Secret** (NOT plaintext)
3. Name: `ANTHROPIC_API_KEY`
4. Value: your Anthropic API key (starts with `sk-ant-...`)
5. Click **Save and deploy**

### 3c. Get your worker URL
- Look at the top of your worker page — you'll see something like:
  `https://melanu-chatbot.YOUR-USERNAME.workers.dev`
- **Copy this URL**

### 3d. Update script.js
Open `script.js` and replace this line:
```js
const AI_CHAT_URL = 'https://melanu-chatbot.YOUR-CLOUDFLARE-USERNAME.workers.dev';
```
With your actual worker URL. Re-upload to GitHub.

> If you skip step 3, the chatbot still works using rule-based fallback replies.

---

## ✅ Step 4: Get Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / Log in
3. **API Keys** → **Create Key**
4. Copy the key (only shown once!) → add it to your Cloudflare Worker as a secret

You'll need to add credits ($5 minimum) to your Anthropic account. With Claude Haiku 4.5, that lasts a LONG time for chatbot usage.

---

## 🎨 Customization Tips

**Change colors:** Edit CSS variables at the top of `style.css`:
- `--green-700: #14644a` (primary)
- `--green-900: #0a3d2e` (dark)

**Change images:** Replace Unsplash URLs in HTML files with your own.

**Add more enquiry fields:** Add to the form in `contact.html` AND the Supabase table.

---

## 🆘 Troubleshooting

**Form not saving to Supabase?**
- Check browser console (F12) for errors
- Verify the SQL table exists
- Verify RLS policy allows anon INSERT

**Chatbot says "fallback" replies?**
- Worker URL not set correctly in `script.js`
- API key not added to Cloudflare worker
- Check worker logs in Cloudflare dashboard

**Logo not showing?**
- Make sure `logo.svg` is in the same folder as HTML files
