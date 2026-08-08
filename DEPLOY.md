# YourFleetAI v2 — Free Deployment Guide

Deploy the entire app **for free forever** using Vercel + Render + MongoDB Atlas. No credit card required.

## Overview

| Piece | Host | Cost | Notes |
|---|---|---|---|
| Frontend (React) | Vercel | Free | Unlimited bandwidth |
| Backend (FastAPI) | Render | Free | Sleeps after 15 min idle · ~30s cold start |
| Database (MongoDB) | MongoDB Atlas M0 | Free | 512MB storage |

Total time: ~30-45 minutes for first-time setup.

---

## Step 1 — MongoDB Atlas (free database)

1. Go to **https://www.mongodb.com/cloud/atlas/register** and sign up (no credit card)
2. Create a new project, then click **"Build a Database"**
3. Pick the **M0 Free** tier · any region close to your users (e.g. Mumbai)
4. Set a username + password (save these — you'll need them)
5. In **Network Access** → **Add IP Address** → click **"Allow Access from Anywhere"** (`0.0.0.0/0`)
6. In **Database → Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<username>` and `<password>` with your actual values.

Save this string — you'll paste it into Render.

---

## Step 2 — Backend on Render (free)

1. Push your code to GitHub if you haven't already (repo: `saransh1718/fleetgpt`)
2. Go to **https://render.com** → sign up with GitHub (no credit card)
3. Click **New +** → **Web Service** → connect the `fleetgpt` repo
4. Fill in the settings:
   - **Name**: `yourfleetai-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Plan**: **Free**
5. Add **Environment Variables** (click "Advanced"):
   ```
   MONGO_URL         = <the Atlas connection string from Step 1>
   DB_NAME           = yourfleetai
   JWT_SECRET        = <any long random string, e.g. from https://1password.com/password-generator>
   EMERGENT_LLM_KEY  = sk-emergent-e0cEc3e1c1f385d2f4
   CORS_ORIGINS      = *
   PYTHON_VERSION    = 3.11
   ```
   *(You'll come back and tighten `CORS_ORIGINS` in Step 4)*
6. Click **Create Web Service** → wait 3-5 min for build
7. Once deployed, copy your backend URL — it looks like `https://yourfleetai-backend.onrender.com`

**Test it**: open `https://yourfleetai-backend.onrender.com/api/` in a browser — you should see `{"message":"Hello World"}`.

---

## Step 3 — Frontend on Vercel (free)

1. Go to **https://vercel.com** → sign up with GitHub (no credit card)
2. Click **Add New → Project** → import the `fleetgpt` repo
3. Fill in the settings:
   - **Framework Preset**: Create React App (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: leave default (`yarn build`)
   - **Output Directory**: leave default (`build`)
4. Add **Environment Variable**:
   ```
   REACT_APP_BACKEND_URL = https://yourfleetai-backend.onrender.com
   ```
   *(Use YOUR Render URL from Step 2)*
5. Click **Deploy** → wait 2-3 min
6. Once live, you'll get a URL like `https://fleetgpt.vercel.app` — this is your live site!

---

## Step 4 — Tighten CORS (security)

Now that Vercel gave you a URL, go back to Render:

1. Render → your service → **Environment** tab
2. Edit `CORS_ORIGINS`:
   ```
   CORS_ORIGINS = https://fleetgpt.vercel.app
   ```
   *(Or whatever your Vercel URL is)*
3. Save — Render will auto-restart the backend

---

## Step 5 — Keep backend warm (optional, still free)

Render free tier sleeps the backend after 15 min. First request wakes it up in ~30-50s. To avoid this:

1. Go to **https://uptimerobot.com** → sign up (free)
2. **Add New Monitor** → HTTP(s)
3. URL: `https://yourfleetai-backend.onrender.com/api/`
4. Interval: 5 minutes
5. Save

Now your backend gets pinged every 5 min and stays awake 24/7. Still totally free.

---

## You're done! 🎉

Your live URL: **https://fleetgpt.vercel.app** (or your custom Vercel name)

- Login with `demo@yourfleetai.com` / `Demo@123`
- Public tracking works at `https://fleetgpt.vercel.app/track/LR-2026-00001`

---

## Troubleshooting

**"Failed to fetch" or CORS errors in browser**
→ Check `CORS_ORIGINS` in Render matches your Vercel URL exactly (including https://)
→ After changing env vars in Render, wait 1-2 min for redeploy

**Backend not seeding demo data**
→ Check Render logs for "Seeded demo company" — if missing, check MONGO_URL is correct

**First request very slow**
→ That's the Render cold start. Set up UptimeRobot (Step 5) to fix it.

**LLM calls timing out**
→ Render free has no timeout limit on requests (unlike Vercel), so Claude/Gemini calls work fine

---

## When you outgrow the free tier

- **MongoDB Atlas**: upgrade to M10 (~$60/mo) when you hit 512MB — thousands of trucks fit before that
- **Render**: upgrade to Starter ($7/mo) if you want no sleeping
- **Vercel**: hobby free tier is very generous — you likely never need to upgrade
