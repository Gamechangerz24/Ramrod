# CREATORS Scanapp

AI-assisted inventory intake and channel-routing prototype for the Strongvision / CREATORS RAMROD workflow.

## Current Prototype

- Static local web app
- Drive image import
- EXIF/orientation normalization
- OpenAI image analysis
- AI article export
- Channel router and listing plan
- eBay/Whatnot/Strongvision connector strategy docs

## Local Run

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

For another device on the same Wi-Fi, use the Mac hostname:

```text
http://MacBook-Pro-von-MICHAEL.local:3000
```

If that does not resolve on iPhone, start a server bound to all interfaces:

```bash
python3 -m http.server 3000 --bind 0.0.0.0
```

Then open the Mac's local network IP on the iPhone.

## Sensitive Data

Do not commit:

- `.env.local`
- imported client photos
- Drive folder HTML
- OpenAI analysis output for real client inventory
- generated channel plans containing client item data

## Mobile Direction

The current app can be tested on iPhone in Safari as a mobile web app. Expo Go is the next step when we need native capabilities:

- camera capture
- barcode scanning
- offline scan queue
- haptics
- better photo handling
- device-level upload retries

Recommended rollout:

1. Keep web app for backoffice and orchestration.
2. Add Expo scanner app for intake workers.
3. Share the same backend API, SKU model, and image pipeline.
