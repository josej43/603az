# CivicPulse — Cinematic Frontend Upgrade

Adds a continuously animated pseudo-3D isometric city (HTML Canvas), interactive perspective movement, animated infrastructure network pulses, pointer-reactive glow, glass-card lighting, button ripple feedback, ambient animated lighting, and a redesigned 2.45-second intro. No external 3D libraries or CDN are required. Supports prefers-reduced-motion.

## Run
Extract the ZIP. In VS Code, open the **website** folder and right-click **index.html** → Open with Live Server. Alternatively, deploy the website directory through your Amplify build.

If the old version appears, hard-refresh using Ctrl+Shift+R and verify you extracted the NEW ZIP. The first intro plays once per tab session; open an Incognito window to replay it, or in browser DevTools execute `sessionStorage.removeItem('civicpulse.introSeen')` and refresh.

This visual upgrade preserves your Lambda code, AWS config, authentication, report forms, privacy content, and API URL. AWS functionality still requires live end-to-end testing and correct account/service permissions.
