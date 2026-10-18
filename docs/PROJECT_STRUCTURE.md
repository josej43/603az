# Project structure

- `website/index.html` — entry point, navigation, animated intro and app shell.
- `website/assets/css/styles.css` — cinematic dark design, responsive layout, 3D CSS city and accessibility.
- `website/assets/js/config.js` — public API/Cognito IDs.
- `website/assets/js/auth.js` — Cognito sign-up, confirmation, sign-in/out, password recovery and refresh.
- `website/assets/js/auth-ui.js` — authentication dialogs and form events.
- `website/assets/js/api.js` — authenticated API calls and S3 presigned uploads.
- `website/assets/js/reports-ui.js` — report form, dashboards, detail views and staff editing.
- `website/assets/js/sections.js` — homepage, help, about, terms and privacy content.
- `website/assets/js/content.js` — categories, statuses, FAQs and feature descriptions.
- `website/assets/js/utils.js` — HTML escaping, dates, badges and helpers.
- `website/assets/js/motion.js` — intro timing, pointer glow, reveals and tilt.
- `website/assets/js/app.js` — navigation and page orchestration.
- `backend/index.py` — Lambda business logic, data access, report authorization and notifications.
- `cloudformation/updated-stack.yaml` — existing stack update for Cognito password flow.
- `scripts/` — Lambda packaging and configuration checks.
- `tests/` — offline tests.
- `docs/` — deployment, API, security and architecture notes.
