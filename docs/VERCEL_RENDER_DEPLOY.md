# Deploying RaaS Platform Live to Vercel & Render

Follow this guide to deploy the backend to **Render** and the frontend to **Vercel** with a free, serverless configuration.

---

## 1. Deploy the Backend to Render

1. Go to [Render](https://render.com) and log in.
2. Click **New +** and select **Web Service**.
3. Connect your Git repository.
4. Set the following options:
   - **Name**: `raas-backend`
   - **Root Directory**: `backend` (important!)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. In the **Environment** tab, add the following environment variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: Your Vercel frontend domain (e.g., `https://your-raas-frontend.vercel.app` — you can update this later)
6. Click **Deploy Web Service**.
7. Once deployed, note down your Render Web Service URL (e.g., `https://raas-backend.onrender.com`).

---

## 2. Deploy the Frontend to Vercel

1. Go to [Vercel](https://vercel.com) and log in.
2. Click **Add New** ➔ **Project**.
3. Import your Git repository.
4. Set the following options:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend` (important!)
5. Expand **Environment Variables** and add:
   - `REACT_APP_API_URL`: Your Render backend URL (e.g., `https://raas-backend.onrender.com`)
   - `REACT_APP_SOCKET_URL`: Your Render backend URL (e.g., `https://raas-backend.onrender.com`)
6. Click **Deploy**.
7. Once deployed, copy your live Vercel URL and add it to your Render web service's `CORS_ORIGIN` env variable so they can communicate securely.

### Troubleshooting Vercel 404 NOT_FOUND
If you receive a `404: NOT_FOUND` error on Vercel:
1. **Ensure the Root Directory is set to `frontend`**: When importing your repository in Vercel, you *must* edit the "Root Directory" option and select the `frontend` folder. Otherwise, Vercel will attempt to serve the repository root which has no frontend static pages.
2. **Client-Side Routing**: Single Page React apps use browser routing. To support pages like `/dashboard` or `/barista` when reloaded or opened directly, we have created a [vercel.json](file:///Users/jeevanhr/Desktop/Mtech/Project-FSD/Raas-Platform/frontend/vercel.json) configuration file in the `frontend` directory that redirects all routes back to `index.html`.

---

## 3. Database Credentials (Optional)
If you want to connect real GCP Firestore instead of running in Mock Development Mode, add your Firebase config keys and GCP service account credentials to the Render Environment Variables tab as described in `.env.example`.
