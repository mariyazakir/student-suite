# Deploy to Vercel

## 1. Connect repository

- Push your code to GitHub/GitLab/Bitbucket.
- In [Vercel](https://vercel.com), import the project and set **Root Directory** to `code` if the repo root is one level above the `code` folder.

## 2. Environment variables

In the Vercel project → **Settings → Environment Variables**, add:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. Vercel Postgres) | Yes (for auth/resume/usage) |
| `JWT_SECRET` | Long random string for auth tokens | Yes |
| `GOOGLE_API_KEY` | For AI features (Gemini); omit for mock mode | No |
| `AUTH_TOKEN_EXPIRES_IN` | e.g. `7d` | No (defaults in code) |

- Use **Postgres** from Vercel Storage or any hosted Postgres; set `DATABASE_URL` in Vercel.
- Run migrations (e.g. `prisma migrate deploy`) via Vercel’s build or a one-off script if you use migrations.

## 3. Build

- **Build Command:** `prisma generate && next build` (or leave default and rely on `package.json` scripts).
- **Output Directory:** leave default (Next.js).
- **Install Command:** `npm install` (default).

`postinstall` runs `prisma generate`; the build script also runs it before `next build`.

## 4. Deploy

Click **Deploy**. The first build may take a few minutes.

## Troubleshooting

- **Prisma errors:** Ensure `DATABASE_URL` is set and `prisma generate` runs (postinstall + build).
- **API route build errors:** API routes use `runtime = 'nodejs'` and `dynamic = 'force-dynamic'` and skip heavy logic during build.
- **Missing env:** Set all required variables in Vercel; redeploy after adding them.
