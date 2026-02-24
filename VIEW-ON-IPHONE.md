# View Mission Control on Your iPhone

The frontend and backend are running. Follow these steps to open the app on your iPhone.

---

## 1. Same Wi‑Fi

- Connect your **iPhone** and your **Mac** to the **same Wi‑Fi network**.

---

## 2. Use your Mac’s IP address

- In the terminal where you ran `npm run dev -- --host`, Vite prints a **Network** URL, for example:
  - `http://10.0.0.250:5173/`
  - or `http://192.168.x.x:5173/`
- That host (e.g. `10.0.0.250` or `192.168.x.x`) is your **Mac’s IP**. Use it in the steps below as **YOUR_MAC_IP**.

If you don’t see it, on your Mac run:

```bash
ipconfig getifaddr en0
```

(or check **System Settings → Network → Wi‑Fi → Details**).

---

## 3. Point the app on the phone to your backend

Right now the app is built to call the API at `localhost`, which on the phone means the phone itself. You need the app to call your **Mac’s** backend.

**Option A – Restart frontend with API URL (recommended)**

1. In the terminal where the frontend is running, stop it (Ctrl+C).
2. Start it again with your Mac’s IP (replace `YOUR_MAC_IP` with the IP from step 2, e.g. `10.0.0.250`):

   ```bash
   cd /Users/emmanuelmiller/Projects/MissionControl
   VITE_API_URL=http://YOUR_MAC_IP:3002/api npm run dev -- --host
   ```

3. Leave this terminal running.

**Option B – Change .env.local**

1. In the project root, open `.env.local`.
2. Set (or add) this line (replace `YOUR_MAC_IP` with your Mac’s IP):

   ```
   VITE_API_URL=http://YOUR_MAC_IP:3002/api
   ```

3. Save the file, then restart the frontend (stop with Ctrl+C, then run `npm run dev -- --host` again).

---

## 4. Open the app on your iPhone

1. On your **iPhone**, open **Safari**.
2. In the address bar, go to: **http://YOUR_MAC_IP:5173**  
   (e.g. `http://10.0.0.250:5173`).
3. You should see Mission Control (login/onboarding or the app if already logged in).

---

## 5. (Optional) Add to Home Screen (PWA)

1. In Safari on the iPhone, with Mission Control open, tap the **Share** button (square with arrow).
2. Tap **Add to Home Screen**.
3. Name it (e.g. “Mission Control”) and tap **Add**.
4. Open the app from the home screen; it will run fullscreen like a native app.

---

## Google Sign-In from the phone: use a public URL (required)

**Google does not allow IP addresses** (e.g. `http://10.0.0.250:5173`) or other non‑public domains for OAuth. You will see:

- *"Invalid Origin: must end with a public top-level domain (such as .com or .org)"*
- *"Invalid Redirect: must use a domain that is a valid top private domain"*

So to use **Sign in with Google** from your iPhone, the app must be opened at a **public URL** (a hostname with a real TLD like `.com` or `.ngrok-free.app`). Two ways to get that:

---

### Option A: ngrok (quick, works with Google)

1. **Install ngrok:** [ngrok.com](https://ngrok.com) → sign up (free), then install and add your auth token.
2. **Tunnel the backend** (in one terminal):
   ```bash
   ngrok http 3002
   ```
   Note the HTTPS URL ngrok gives you, e.g. `https://abc123.ngrok-free.app`.
3. **Tunnel the frontend** (in another terminal):
   ```bash
   ngrok http 5173
   ```
   Note this HTTPS URL, e.g. `https://xyz789.ngrok-free.app`.
4. **Start the frontend** so it uses the **backend** ngrok URL:
   ```bash
   cd /Users/emmanuelmiller/Projects/MissionControl
   VITE_API_URL=https://YOUR_BACKEND_NGROK_URL/api npm run dev -- --host
   ```
   (Use the URL from step 2, e.g. `https://abc123.ngrok-free.app/api`.)
5. **Add the frontend URL to Google OAuth:**
   - [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials** → your OAuth 2.0 Client ID.
   - **Authorized JavaScript origins:** add `https://xyz789.ngrok-free.app` (the URL from step 3).
   - **Authorized redirect URIs:** add `https://xyz789.ngrok-free.app/auth/google/callback`.
   - Save.
6. On your **iPhone**, in Safari open **https://xyz789.ngrok-free.app** (your frontend ngrok URL). Sign in with Google should work.

(If you only have one ngrok domain, you can serve the built frontend from the backend and use a single tunnel to port 3002; that requires the backend to serve the `dist` folder and a bit of config.)

---

### Option B: Tailscale

If you use **Tailscale**, your machine gets a hostname like `your-machine.your-tailnet.ts.net`. Expose the app with `tailscale serve` (see README “Access from Anywhere with Tailscale”). Then in Google OAuth add:

- **Authorized JavaScript origins:** `https://your-machine.your-tailnet.ts.net` (or the exact URL you use, including port if needed).
- **Authorized redirect URIs:** `https://your-machine.your-tailnet.ts.net/auth/google/callback`.

Google may accept `.ts.net` as a valid domain; if you get the same “must end with a public top-level domain” error, use Option A (ngrok) instead.

---

## Troubleshooting

- **“Can’t reach the server” / blank or stuck screen**  
  The phone can’t reach the API. Check:
  - You restarted the frontend with the correct `VITE_API_URL` (your Mac IP for same‑WiFi, or your ngrok/Tailscale backend URL).
  - Backend is running on the Mac (`PORT=3002 node server.js` in the `server` folder).
  - iPhone and Mac on same Wi‑Fi when using IP; when using ngrok, any network is fine.

- **Google: “Invalid Origin” / “Invalid Redirect”**  
  You cannot use `http://10.0.0.250:5173` or any raw IP. Use a public URL (ngrok or Tailscale) and add that URL in Google Cloud Console as above.
