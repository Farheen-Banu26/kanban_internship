# Deployment Guide

## 1. MongoDB Atlas
1. Create a free MongoDB Atlas cluster.
2. Create a database user and allow access from anywhere (`0.0.0.0/0.0.0.0`).
3. Get the connection string in the format:
   `mongodb+srv://<username>:<password>@<cluster-url>/<db-name>?retryWrites=true&w=majority`
4. Set the backend environment variable:
   - `MONGODB_URI=<your-atlas-connection-string>`

## 2. Backend deployment on Render
1. Create a new Web Service in Render.
2. Connect this repository.
3. Set the build command:
   - `cd backend && npm install`
4. Set the start command:
   - `npm start`
5. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `MONGODB_URI=<atlas-connection-string>`
   - `JWT_SECRET=<strong-random-secret>`
   - `CLIENT_URL=https://<your-vercel-app>.vercel.app`
6. Deploy the service.

## 3. Frontend deployment on Vercel
1. Create a Vercel project from the frontend folder.
2. Set the build command:
   - `npm run build`
3. Set the output directory:
   - `dist`
4. Add environment variables:
   - `VITE_API_URL=https://<your-render-app>.onrender.com/api`
5. Deploy the app.

## 4. CORS and production URL
Ensure the backend allows the deployed frontend origin via `CLIENT_URL` and CORS configuration.

## 5. Health check
After deployment, verify:
- Backend health endpoint: `https://<render-app>.onrender.com/api/health`
- Frontend home page: `https://<vercel-app>.vercel.app`
