# AWS Deployment

CI/CD lives in `.github/workflows/deploy-aws.yml`: every push to `main` builds and
deploys whatever changed (backend → ECS Fargate, frontend → S3 + CloudFront).
The pipeline is **disabled by default** — it skips all jobs until you flip the
switch (step 5), so you can keep pushing to `main` while the AWS account is
being set up.

Architecture:

| Piece | AWS service | Why |
|---|---|---|
| Backend (Express, port 8090) | ECS Fargate behind an ALB | ALB supports the WebSocket (socket.io) and SSE connections the app uses |
| Database | RDS PostgreSQL | Same Prisma `DATABASE_URL` flow |
| Frontend (Vite SPA) | S3 + CloudFront | Static files; cheap and fast |
| Uploads (`/app/uploads`) | EFS volume (stopgap) or S3 (proper fix) | Fargate's local disk is wiped on every deploy |

## 1. AWS resources to create (region: ap-south-1)

1. **ECR repository** `dealio-backend`.
2. **RDS PostgreSQL** instance, database `dealio`. Note the endpoint + password.
3. **ECS cluster** `dealio` and a **Fargate task definition** `dealio-backend`:
   - Container name `dealio-backend`, image `<account>.dkr.ecr.ap-south-1.amazonaws.com/dealio-backend:latest`
     (**must be the `:latest` tag** — deploys work by pushing a new `:latest` and
     forcing a new deployment; the one-off migration task also relies on it).
   - Port 8090. Environment from `Dealio_Backend/.env.production` (put
     `DATABASE_URL`, `JWT_SECRET`, API keys in SSM Parameter Store / Secrets
     Manager and reference them under "secrets").
4. **ECS service** `dealio-backend` on that cluster, behind an **ALB**:
   - Target group → port 8090, health check path `/api/health`.
   - Raise the ALB **idle timeout** (e.g. 300s+) — the app uses long-lived SSE
     connections.
   - If you ever run more than 1 task, enable **sticky sessions** on the target
     group (socket.io needs it).
5. **S3 bucket** for the frontend (block public access ON) + **CloudFront
   distribution** with the bucket as origin (Origin Access Control):
   - Default root object `index.html`.
   - Custom error responses: 403 and 404 → `/index.html`, HTTP 200 (SPA routing).
6. **IAM user for CI** with programmatic access. Needs: ECR push
   (`AmazonEC2ContainerRegistryPowerUser`), `ecs:UpdateService`,
   `ecs:DescribeServices`, `ecs:RunTask`, `ecs:DescribeTasks`, `iam:PassRole`
   (for the task execution/task roles), S3 read/write on the frontend bucket,
   `cloudfront:CreateInvalidation`.

## 2. Values to replace

In `.github/workflows/deploy-aws.yml` (env block at the top):

| Placeholder | Value |
|---|---|
| `MIGRATE_SUBNET_IDS` | Two private subnet IDs in the VPC (with NAT, able to reach RDS) |
| `MIGRATE_SECURITY_GROUP` | Security group allowed to reach RDS on 5432 |
| `FRONTEND_S3_BUCKET` | The frontend bucket name |
| `CLOUDFRONT_DISTRIBUTION_ID` | The CloudFront distribution ID |

(The resource names — `dealio-backend`, cluster `dealio` — are pre-filled;
change them only if you name things differently.)

In `Dealio_frontend/.env.production`: the three `VITE_*_URL` values → the
backend's public URL (ALB DNS or custom domain) + `/api`.

In the ECS task definition (from `Dealio_Backend/.env.production` template):
`DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`/`FRONTEND_URL` → the CloudFront
domain, plus the optional integrations (SMTP, WhatsApp, SMS, Anthropic).

## 3. GitHub configuration

Repo → Settings → Secrets and variables → Actions:

- **Secrets:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (the CI IAM user).
- **Variables:** `AWS_DEPLOY_ENABLED` = `true` ← this is the on/off switch.

## 4. First deploy

Run the workflow manually: GitHub → Actions → "Deploy to AWS" → Run workflow.
A manual run deploys both services and applies the Prisma schema regardless of
what changed. After that, pushes to `main` deploy only what changed
(`Dealio_Backend/**` → backend, `Dealio_frontend/**` → frontend; schema changes
trigger a one-off `prisma db push` task before the service rolls over).

## 5. Post-deploy

1. Add the CloudFront/custom frontend domain to **Authorized JavaScript
   origins** of the Google OAuth client (console.cloud.google.com → Credentials).
2. WhatsApp OTP: set `WHATSAPP_TOKEN` (permanent System User token),
   `WHATSAPP_PHONE_ID`, `WHATSAPP_OTP_TEMPLATE`, `WHATSAPP_LANG` in the task
   definition. In production OTPs are **not** echoed to the client, so WhatsApp
   or SMS (Twilio/MSG91) must be working or login is impossible.
3. Rotate `JWT_SECRET` and the DB password — the old Railway values were
   committed to git history.
