# Audit Tool — B2B Lead Generation

A high-converting, serverless Next.js diagnostic tool. Users paste their URL, get a real PageSpeed performance audit, and must submit their email to unlock the full results. Leads are silently pushed to Google Sheets.

---

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

**Test mode:** Type `test.com` as the URL to see a demo with fake data.

---

## Setup

### 1. Google Sheets Webhook

1. Open a Google Sheet
2. **Extensions → Apps Script**
3. Paste this code:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);

  // Add header row if empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Submitted At', 'Email', 'URL', 'Score',
      'Ad Loss %', 'Bounce Rate Increase', 'Annual Loss ($)',
      'Severity', 'Audit Timestamp'
    ]);
  }

  sheet.appendRow([
    data.submittedAt,
    data.email,
    data.url,
    data.score,
    data.adLossPercent,
    data.bounceRateIncrease,
    data.annualRevenueLoss,
    data.severity,
    data.timestamp
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. **Deploy → New Deployment → Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the deployment URL

### 2. Environment Variables

```bash
cp .env.example .env.local
# Paste your webhook URL into GOOGLE_SHEETS_WEBHOOK_URL
```

### 3. Deploy to Vercel

```bash
npx vercel
# Add GOOGLE_SHEETS_WEBHOOK_URL in Vercel Dashboard → Settings → Environment Variables
```

---

## Customisation

| What to change | Where |
|---|---|
| Agency name & CTA copy | `app/page.tsx` → `ResultsPanel` → CTA section |
| Booking call link | `app/page.tsx` → `<a href="#">` in ResultsPanel |
| Revenue loss calculation | `app/lib/audit.ts` → `calcAdLoss()` |
| Color theme | `app/globals.css` → `:root` CSS variables |
| Stats in hero ("4.2s avg LCP...") | `app/page.tsx` → social proof row |

---

## Architecture

```
app/
├── page.tsx              # All frontend UI & logic
├── layout.tsx            # HTML shell + metadata
├── globals.css           # Theme, typography, animations
├── lib/
│   └── audit.ts          # Types, PSI API call, calculation engine
└── api/
    └── capture/
        └── route.ts      # Serverless lead capture → Google Sheets
```

---

## How Revenue Loss Is Calculated

Based on published Google research:

- **LCP** > 2.5s → ~7% ad revenue loss per extra second
- **TBT** > 200ms → ~4% loss per 200ms overage
- **CLS** > 0.1 → ~5% loss per 0.1 unit overage
- **Performance score** < 50 → amplifier penalty up to +15%
- **Cap:** 90% max loss (never show 100% — leaves room for urgency without feeling fake)

Annual leakage estimate assumes $8k/month average SMB ad spend (adjustable in `audit.ts`).
