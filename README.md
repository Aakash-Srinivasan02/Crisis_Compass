# The Bridge — static prototype

This repository contains a small, accessible static prototype for *The Bridge* — a centralized directory of local, verified services for housing, substance use, and mental health support.

Quick start (serve locally):

```bash
# from the project root
python3 -m http.server 8000
# then open http://localhost:8000 in a browser
```

What’s included:
- `index.html` — single-page UI with search and CTAs
- `styles.css` — simple accessible styling
- `scripts.js` — client-side search against `resources.json`
- `resources.json` — sample entries (replace with your verified data)

Next steps:
- Replace `resources.json` with your verified local dataset or connect an API.
- Add server-side verification, rate limiting, and privacy safeguards.
- Provide translations and an offline-first PWA for people with limited connectivity.

Security & deployment notes:
- Serve the site over HTTPS (Let’s Encrypt or a hosting platform that enforces TLS). HTTPS is required for geolocation and for user trust.
- The quick-exit button uses `location.replace()` to limit browser history exposure, but cannot fully erase a session; hosters should consider additional privacy-hardening measures.

Admin features to add:
- A lightweight CMS or admin panel (Flask/Express + simple auth) to add and verify listings.
- A CSV import page and verification workflow to mark `verifiedDate` after staff checks.
- If you plan to accept donations, integrate Stripe or PayPal with proper security and PCI compliance.

If you want, I can:
- Add a small admin CSV upload to bulk import/verify data.
- Wire a lightweight server (Flask/Express) for authenticated updates.
# Crisis_Compass