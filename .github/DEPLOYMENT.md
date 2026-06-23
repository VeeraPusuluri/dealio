# Deployment setup — Frontend (AWS Amplify)

CI runs `npm ci` → `npm run lint` → `npm run build` as a gate, then triggers an
**Amplify release job** (`aws amplify start-job`) and waits for it. Amplify
builds and hosts using the committed `amplify.yml`. Auth uses **GitHub OIDC**.
Triggers: push to `main`, or manual run.

Account `687159379528`, region `us-east-1`.

---

## 1. AWS IAM role

This repo reuses the **same** `dealio-github-deploy` role created for the backend
(its trust policy already allows `repo:VeeraPusuluri/dealio:*`, and its policy
includes `amplify:StartJob` / `amplify:GetJob`). See the backend repo's
`.github/DEPLOYMENT.md` if the role does not exist yet.

Role ARN: `arn:aws:iam::687159379528:role/dealio-github-deploy`

---

## 2. Find your Amplify App ID

Amplify console → your app → **App settings → General**, or:

```bash
aws amplify list-apps --region us-east-1 \
  --query 'apps[].{name:name,appId:appId}' --output table
```

The branch name in the workflow defaults to `main` (`AMPLIFY_BRANCH` env). The
Amplify app must have a branch named `main` connected.

---

## 3. GitHub secrets — repo `VeeraPusuluri/dealio`

Settings → Secrets and variables → Actions → **New repository secret**:

| Secret | Value |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::687159379528:role/dealio-github-deploy` |
| `AMPLIFY_APP_ID` | your Amplify app id (e.g. `d123abc456xyz`) |

The `VITE_*` build variables (API URLs, Google client id, Supabase keys) are set
as **Amplify environment variables** in the Amplify console — `amplify.yml`
already reads them. They do not need to be GitHub secrets.

---

## 4. Avoid double deploys

If the Amplify app has **auto-build enabled** on the `main` branch, a push will
already trigger a build *and* this workflow will trigger another. Pick one:

- **Recommended:** disable auto-build for the branch in the Amplify console
  (App settings → Branch → disable auto-build) so this workflow is the single
  source of deploys (and gets the lint+build gate).
- Or delete the `deploy` job and keep only the `ci` job as a PR check, letting
  Amplify's native Git integration do the deploy.

First deploy: push to `main`, or run **Actions → Deploy Frontend (Amplify) → Run workflow**.
