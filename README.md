# Warsaw Building Intelligence

Search any Warsaw address for apartments for sale, long-term rent, short-term rent, and official city records.

## Deploy to Vercel (free, 5 minutes)

### 1. Get an Anthropic API key
Go to https://console.anthropic.com/keys and create a key. Copy it.

### 2. Upload this folder to GitHub
- Go to github.com → New repository → name it `warsaw-app` → Create
- Click "uploading an existing file"
- Upload all files keeping the folder structure:
  ```
  api/search.js
  public/index.html
  vercel.json
  ```

### 3. Deploy on Vercel
- Go to https://vercel.com and sign in with your GitHub account
- Click "Add New Project" → import your `warsaw-app` repository
- Click "Deploy" (no build settings needed)

### 4. Add your API key (secret)
- In Vercel, go to your project → Settings → Environment Variables
- Add: Name = `ANTHROPIC_API_KEY`, Value = your key from step 1
- Click Save, then go to Deployments → click the 3 dots → Redeploy

Your site is live at `https://warsaw-app.vercel.app` (or similar URL Vercel assigns).
