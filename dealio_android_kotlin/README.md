# Dealio Android

Native Android app for the Dealio real-estate marketplace — Kotlin + Jetpack Compose.

Currently implemented: **splash**, **login** and **signup** (phone OTP), wired to the
Dealio backend (`/api/auth/*`), plus a minimal signed-in landing screen.

## Stack

- Kotlin 2.0, Jetpack Compose (Material 3), Navigation Compose
- Retrofit + OkHttp + Gson against the backend's `{ ok, message, data }` envelope
- Tokens stored in `SharedPreferences` (`TokenStore`), mirroring the web app's keys

## Running

1. Start the backend: `cd ../Dealio_Backend && npm run dev` (port 8090).
2. Open this folder in Android Studio and run on an **emulator** — debug builds
   point at `http://10.0.2.2:8090/api/` (the host machine's localhost).
   - For a physical device, change `API_BASE_URL` in `app/build.gradle.kts` to your
     machine's LAN IP and add that IP to `res/xml/network_security_config.xml`.
3. Outside production the backend echoes the OTP back (`demoCode`) — the app shows a
   "Dev code — tap to fill" chip. The fixed code `123456` also works in dev.

The release build's `API_BASE_URL` is a `REPLACE_WITH_BACKEND_DOMAIN` placeholder —
set it when the AWS backend URL exists (see `../docs/AWS_DEPLOYMENT.md`).

## Auth flow

`SplashScreen` → checks `TokenStore` → `LoginScreen` / `HomeScreen`.

- Login: `POST auth/login/phone/send-otp` → `POST auth/login/phone/verify-otp`
- Signup: `POST auth/signup/phone/send-otp` → `POST auth/signup/phone/verify-otp`
  with `fullName`, `role` (CUSTOMER / CP / BUILDER / BANK / NRI) and optional `referralCode`

Both verify endpoints return `{ accessToken, refreshToken, expiresIn, user }`,
persisted by `TokenStore`.
