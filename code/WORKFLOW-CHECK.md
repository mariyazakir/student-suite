# How to Check the Student Suite Workflow

## 1. Start the app locally

From the **`code`** folder:

```bash
cd C:\Users\mariy\.cursor\resume-builder\code
npm run dev
```

Wait until you see something like: **Ready on http://localhost:3000**.  
Open **http://localhost:3000** in your browser.

---

## 2. Workflow checklist

### A. Homepage first (not logged in)

1. **Clear or don’t log in**  
   If you were logged in, log out (e.g. from Topbar) or use a private/incognito window.

2. **Open the root URL**  
   Go to: **http://localhost:3000/** (or your deployed URL).

3. **Check:**  
   - You see the **public homepage** (title “Student Suite”, “Free tools for students”, Get Started, Login, tools list, trust bullets, footer).  
   - You do **not** see the dashboard or a redirect to login.

4. **Try a protected URL**  
   Type: **http://localhost:3000/dashboard** (or **/tools/resume-builder**).

5. **Check:**  
   - You are **redirected to /** (homepage), not to `/login`.  
   - You see the **same homepage** again.

---

### B. From homepage → Login / Sign up

1. On the homepage, click **“Get Started”**.

2. **Check:**  
   - You go to **/signup** (sign-up page).

3. Go back to the homepage (e.g. **http://localhost:3000/**), then click **“Login”**.

4. **Check:**  
   - You go to **/login** (login page).

5. Click a **tool card** (e.g. “Resume Builder”) on the homepage.

6. **Check:**  
   - You are sent to **/login** (or, if AuthGate sends unauthenticated users to `/`, you may land on `/` again; either is acceptable).

---

### C. After login → Dashboard

1. On **/login**, enter your email and password and log in.

2. **Check:**  
   - You are **redirected to /** (root URL).  
   - You see the **dashboard** (e.g. “Student Suite Dashboard”, tool cards: Resume Builder, Notes → PDF, etc.), not the public homepage.

3. **Check sidebar:**  
   - You see links like Dashboard, Resume Builder, Notes → PDF, Assignment Formatter, PDF Tools, Templates.  
   - Clicking them opens the right tools.

---

### D. After signup → Dashboard

1. On **/signup**, create a new account and complete signup.

2. **Check:**  
   - You are **redirected to /** (or the app’s post-signup URL).  
   - You see the **dashboard** (same as after login).

---

### E. Logout → Homepage again

1. While logged in, click **Logout** (e.g. in the Topbar).

2. **Check:**  
   - You are sent to **/login**.

3. Go to **http://localhost:3000/**.

4. **Check:**  
   - You see the **public homepage** again (not the dashboard).

---

## 3. Quick summary

| Step | What to do | What should happen |
|------|------------|--------------------|
| 1 | Open site (not logged in) | Homepage at `/` |
| 2 | Open `/dashboard` or a tool URL (not logged in) | Redirect to `/` (homepage) |
| 3 | On homepage, click Get Started | Go to `/signup` |
| 4 | On homepage, click Login | Go to `/login` |
| 5 | Log in or sign up | Redirect to `/` and see **dashboard** |
| 6 | Use sidebar / tool links | Tools open as before |
| 7 | Log out, then open `/` | Homepage again |

---

## 4. Testing on the deployed site

If the app is deployed (e.g. Vercel):

1. Open **https://your-app.vercel.app/** (or your real URL).  
2. Run the same checks as in **Section 2** (homepage first, then login/signup, then dashboard, then logout and homepage again).

Use a private/incognito window (or a second browser) to test “not logged in” without your existing session.
