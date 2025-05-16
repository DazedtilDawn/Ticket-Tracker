# Railway Migration Checklist <!-- Plan Approved -->

## Phase 1: Manual Setup & Core Deployment (User-led, AI-assisted)

- [ ] **Step 0: Prepare Your Repo (Manual)**
    - (Files: `.`, Goal: Ensure local changes are committed and pushed to `main` branch, and Docker builds locally)
    - Action: Run the following commands in your project folder:
        ```bash
        git add .
        git commit -m "ready for Railway"
        git push origin main
        ```
    - Verify: `Dockerfile` exists *and* `docker build .` succeeds locally.

- [ ] **Step 1: Launch Railway Project (Manual)**
    - (Files: Railway UI, Goal: Deploy GitHub repo to Railway)
    - Action:
        1. Go to **https://railway.app** → **New Project** → **Deploy from GitHub**.
        2. Authorize, pick your repo, hit **Deploy**.
    - Verify: Build logs show "listening on port 5000 (or the port Railway injects)".

- [ ] **Step 2: Provision Postgres & Object Storage on Railway (Manual)**
    - (Files: Railway UI, Goal: Set up database and S3-compatible storage, configure necessary environment variables)
    - Action:
        1. Add Postgres: Click **Add** → **Database** → **Postgres** → **Provision**.
        2. Copy Postgres Connection URL: Click new Postgres plugin → **Connect** → **Copy Connection URL**.
        3. Add `DATABASE_URL` to service variables.
        4. Add S3 Storage: Click **Add** → **Storage** → **S3-Compatible Object Storage** → **Provision**.
        5. Railway shows three strings: **ENDPOINT**, **ACCESS_KEY**, **SECRET_KEY**.
        6. Add these as `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` in the Variables tab.
        7. Also add/verify these environment variables in Railway for your service:
            - `PLAYWRIGHT_BROWSERS_PATH=/home/nodejs/.cache/ms-playwright`
            - `PORT=5000` (optional—keeps local & prod identical)
    - Verify: Environment variables are correctly set in Railway service settings.

## Phase 2: Application Configuration (AI-led, then Manual Redeploy)

- [ ] **Step 3: Re-point Multer to S3**
    - (Files: `server/lib/upload.ts`, router file (e.g., `server/index.ts` or similar), Goal: Configure file uploads to use Railway's S3-compatible storage)
    - Action (AI-led for edits, then manual for commit/push):
        - [ ] Edit `server/lib/upload.ts` and router file as per patch (AI will provide patch)
        - [ ] Commit & push changes – this triggers a new Railway deploy (Manual)
    - Verify: Upload an image in prod, confirm URL points to Railway object storage (Manual).

## Phase 3: Database Migration (User-led, AI-assisted)

- [ ] **Step 4: Run Database Migrations (Manual via Railway CLI)**
    - (Files: Railway CLI, Database Schema, Goal: Apply Drizzle migrations to the new Railway Postgres instance)
    - Action: Run `railway run npx drizzle-kit push`
    - Verify:
        - [ ] `drizzle-kit push` command completes successfully.
        - [ ] Tables are created in the Railway SQL console.
- [ ] **Step 4.1 (Optional): Import existing data (Manual via Railway CLI)**
    - (Files: Railway CLI, `replit.sql` (example dump file), Goal: Transfer data from an existing database to Railway Postgres)
    - Action: Run `railway db:dump > replit.sql` (or similar, to get your current data) then `cat replit.sql | railway sql` (or `railway db:restore < replit.sql` if supported directly by CLI for your use-case).
    - Verify: Data is present in the Railway database tables.

## Phase 4: AI Automation Enhancements (AI-led)

- [ ] **Automation 1: Secrets Sync Script**
    - (Files: `scripts/sync-env.mjs` (new), `.env` (generated), Goal: Create a script to pull Railway environment variables to a local `.env` file)
    - Action: Implement the `sync-env.mjs` script.

- [ ] **Automation 2: Database Backup/Restore Make Targets**
    - (Files: `Makefile` (new or existing), Goal: Create `make` targets for easy database backup and restore using Railway CLI)
    - Action: Add `db-backup` and `db-restore` targets to a Makefile.

- [ ] **Automation 3: Starter GitHub Actions CI**
    - (Files: `.github/workflows/ci.yml` (new), Goal: Set up a basic CI pipeline to build Docker image and run tests on push/PR)
    - Action: Create the GitHub Actions workflow file.

- [ ] **Automation 4: First-time Windows Setup Script**
    - (Files: `scripts/setup-windows.ps1` (new), Goal: Create a PowerShell script for easy Windows development environment setup)
    - Action: Implement the PowerShell setup script.

## Phase 5: Finalization

- [ ] **Final Review and Cleanup**
    - (Files: All changed files, Railway dashboard, Goal: Ensure application is working correctly on Railway, all checklist items are addressed, and no outstanding issues remain)
    - Action: Perform a full application test on the Railway-assigned URL (signup, image upload, etc.). Review all checklist items.
    - Verify: Application is fully functional in the Railway environment.
- [ ] **(Optional) Configure Custom Domain / HTTPS**
    - (Files: Railway UI, DNS Provider UI, Goal: Make the application accessible via a custom domain with SSL)
    - Action: Follow Railway's guide for adding a custom domain.
    - Verify: Application is accessible via `https://your.custom.domain`. 