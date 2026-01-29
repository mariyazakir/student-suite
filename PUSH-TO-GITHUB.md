# Push "Student Suite" to GitHub

You created a repo named **Student Suite** on GitHub. Follow these steps to put your code there.

---

## 1. Open a terminal in your project

- Open the folder: `C:\Users\mariy\.cursor\resume-builder`
- This is the folder that **contains** the `code` folder (your Next.js app).

---

## 2. Check if Git is already set up

Run:

```bash
git status
```

- **If it says "not a git repository"** → do Step 3 (init + add remote + push).
- **If it shows files** → you already have Git. Skip "Initialize" in Step 3 and only do "Add remote" and "Push".

---

## 3. Connect to your GitHub repo and push

Replace `YOUR_USERNAME` with your GitHub username.  
Your repo URL is usually: `https://github.com/YOUR_USERNAME/student-suite`  
(GitHub often turns "Student Suite" into `student-suite` in the URL.)

**If this is a brand‑new Git setup (no repo yet):**

```bash
git init
git add .
git commit -m "Initial commit: Student Suite"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/student-suite.git
git push -u origin main
```

**If you already had Git and a different remote (e.g. old repo):**

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/student-suite.git
git push -u origin main
```

(If your default branch is `master` instead of `main`, use `master` in the commands above.)

---

## 4. Then on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. **Import** your **student-suite** (or "Student Suite") repo from GitHub.
3. When Vercel asks for **Root Directory**, click **Edit** and type: **`code`**
4. Add your env vars (**DATABASE_URL**, **JWT_SECRET**, optional **GOOGLE_API_KEY**).
5. Click **Deploy**.

Your app will be "Student Suite" on Vercel; you can rename the Vercel project to "Student Suite" in project settings if you like.
