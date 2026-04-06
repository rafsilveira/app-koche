# AGENTS.md

## Project Shape
- Single-package React + Vite app. No monorepo, no test runner, no CI workflows in-repo.
- Runtime entrypoint is `src/main.jsx` -> `src/App.jsx`. Navigation is a local view state machine in `App.jsx`, not `react-router`.
- `AuthContext` is the main gate: unauthenticated users see `Login`, users without `userProfile.phone` are forced through `ProfileForm` before the rest of the app.

## Verified Commands
- `npm run dev` starts the Vite dev server.
- `npm run build` is the main reliable verification step.
- Deploy is not an npm script: run `npm run build` then `node deploy.js`.
- FTP troubleshooting helper: `node debug_ftp.js`.
- `npm run lint` currently fails on pre-existing repo issues, including Node-side helper scripts being linted with browser globals plus existing app errors (`ResultCard.jsx`, `WelcomeScreen.jsx`, etc.). Do not assume lint is a clean gate before your change.

## Data And Backend Truths
- Trust the code, not the prose docs, for data flow. README and `.koche_memory/*.md` still mention `Data_Carros_Koche_App.json` as the source of truth, but the running app uses Firestore.
- Vehicle data comes from Firestore collection `vehicles` via `src/services/dataService.js`.
- `fetchVehicleData()` caches the full vehicle dataset in `localStorage` under `koche_vehicle_data_v1` for 24 hours. Admin CRUD clears that cache; manual verification can otherwise look stale.
- Admin access is granted by either the hardcoded email in `src/contexts/AuthContext.jsx` or a matching document in Firestore collection `admins`.
- User profiles live in Firestore collection `users`.
- `ResultCard.jsx` still tolerates both legacy camelCase fields and current snake_case fields; preserve that compatibility unless you are intentionally normalizing all stored data.

## Env And Secrets
- Gemini uses `VITE_GEMINI_API_KEY` from Vite env. `.env.example` does not mention it.
- FTP deploy uses `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`, `FTP_PORT`, and optional `REMOTE_PATH` from `.env`.
- Firebase config is currently hardcoded in `src/services/firebase.js`, so changing Firebase projects is a code change, not an env-only change.

## Hosting And PWA Quirks
- The app is built for the subpath `/guia-de-aplicacao/` via `vite.config.js`. Keep asset paths and links compatible with that base path.
- PWA behavior is currently disabled in practice: `VitePWA(...)` is commented out in `vite.config.js`, `src/main.jsx` unregisters all service workers on load, and `public/sw.js` unregisters itself on activation.
- If a task mentions offline installability or manifest behavior, inspect all three places above before assuming PWA support is active.

## Navigation And Feature Traps
- There is no URL routing. Internal navigation is `currentView` state in `src/App.jsx`, so refreshes and deep links do not preserve sub-screen state.
- `App.jsx` preloads vehicle data for `AssistantScreen`, and `Dashboard.jsx` fetches it again for the guide flow. The duplication is real but mostly hidden by the 24h local cache.
- `AssistantScreen.jsx` currently ignores structured AI actions from `aiService.js` and only renders `response.message`. Wiring new AI actions requires UI work in the screen, not just prompt/service changes.
- `updateProfileData()` sends the external lead webhook whenever `phone` is included. Changes in `ProfileForm` or `UserArea` can therefore create duplicate lead submissions.

## Docs And Memory Files
- Preserve `.koche_memory/`; README explicitly treats it as long-term agent context.
- Update `.koche_memory` only when changing architecture or durable workflow facts, and verify against the code first because some current entries are stale.

## Manual Checks That Matter
- For UI/auth changes, manually walk `Login` -> `ProfileForm` -> `WelcomeScreen` and the relevant destination screen (`Dashboard`, `AssistantScreen`, `AdminScreen`, or `UserArea`).
- For data changes, verify both the main guide flow and `AdminScreen`, because both depend on `src/services/dataService.js` and shared Firestore data.
- For profile changes, test both the first-time phone gate in `ProfileForm` and later edits in `UserArea`, because both go through the same side-effectful profile update path.
- For assistant changes, verify both missing-key behavior (`VITE_GEMINI_API_KEY` absent) and live-response behavior, because the service has a fallback error contract and the UI only consumes the text field.
