#!/usr/bin/env bash
# =============================================================================
#  Dealio — GCP deployment script
#  Deploys: Backend (Cloud Run) + Frontend (Cloud Run) + Database (Cloud SQL)
#  Region : asia-south1 (Mumbai)
# =============================================================================
set -euo pipefail

# ─── Colours ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERR]${NC}   $*"; exit 1; }

# ─── Config — edit these before running ──────────────────────────────────────
PROJECT_ID="${GCP_PROJECT_ID:-}"          # e.g. dealio-prod-123456
REGION="asia-south1"
REPO="dealio-repo"                        # Artifact Registry repo name
DB_INSTANCE="dealio-db"                  # Cloud SQL instance name
DB_NAME="dealio"
DB_USER="dealio_user"

# Secrets — must be set in environment before running this script
# Required: DB_PASSWORD, JWT_SECRET, GOOGLE_CLIENT_ID
DB_PASSWORD="${DB_PASSWORD:-}"
JWT_SECRET="${JWT_SECRET:-}"
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-673292166083-q6vv1alnlv95avim75psia1jq4fsjcui.apps.googleusercontent.com}"
SUPABASE_URL="${VITE_SUPABASE_URL:-https://gpatbmyichpohjenpiyj.supabase.co}"
SUPABASE_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwYXRibXlpY2hwb2hqZW5waXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0ODIwOTEsImV4cCI6MjA5NDA1ODA5MX0.ZJBUVb1t1RZnSVpAZOHW397EOc6U_E8OaFB2WVhxNBk}"

# ─── Preflight checks ─────────────────────────────────────────────────────────
[[ -z "$PROJECT_ID" ]]   && error "Set GCP_PROJECT_ID env var before running. e.g.\n  GCP_PROJECT_ID=my-project-id ./deploy.sh"
[[ -z "$DB_PASSWORD" ]]  && error "Set DB_PASSWORD env var (choose a strong password)."
[[ -z "$JWT_SECRET" ]]   && error "Set JWT_SECRET env var (a long random string)."
command -v gcloud  &>/dev/null || error "gcloud CLI not found. Install from https://cloud.google.com/sdk/docs/install"
command -v docker  &>/dev/null || error "Docker not found. Install from https://docs.docker.com/get-docker/"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/Dealio_Backend"
FRONTEND_DIR="$SCRIPT_DIR/Dealio_frontend"
REGISTRY="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO"

echo ""
echo "=================================================================="
echo "  Dealio GCP Deployment"
echo "  Project : $PROJECT_ID"
echo "  Region  : $REGION"
echo "  Registry: $REGISTRY"
echo "=================================================================="
echo ""

# ─── 1. Set active project ────────────────────────────────────────────────────
info "Setting active GCP project..."
gcloud config set project "$PROJECT_ID"
success "Active project: $PROJECT_ID"

# ─── 2. Enable required APIs ─────────────────────────────────────────────────
info "Enabling GCP APIs (this may take a minute)..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  --project "$PROJECT_ID"
success "APIs enabled."

# ─── 3. Artifact Registry ────────────────────────────────────────────────────
info "Creating Artifact Registry repository..."
if gcloud artifacts repositories describe "$REPO" --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  warn "Repository '$REPO' already exists — skipping."
else
  gcloud artifacts repositories create "$REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --description="Dealio Docker images"
  success "Repository created: $REPO"
fi

info "Configuring Docker for Artifact Registry..."
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet
success "Docker configured."

# ─── 4. Cloud SQL instance ───────────────────────────────────────────────────
info "Creating Cloud SQL PostgreSQL instance (this takes ~5 minutes)..."
if gcloud sql instances describe "$DB_INSTANCE" --project="$PROJECT_ID" &>/dev/null; then
  warn "Cloud SQL instance '$DB_INSTANCE' already exists — skipping creation."
else
  gcloud sql instances create "$DB_INSTANCE" \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region="$REGION" \
    --storage-type=SSD \
    --storage-size=10GB \
    --no-backup \
    --project="$PROJECT_ID"
  success "Cloud SQL instance created: $DB_INSTANCE"
fi

info "Creating database '$DB_NAME'..."
gcloud sql databases create "$DB_NAME" \
  --instance="$DB_INSTANCE" \
  --project="$PROJECT_ID" 2>/dev/null || warn "Database '$DB_NAME' already exists."

info "Creating database user '$DB_USER'..."
gcloud sql users create "$DB_USER" \
  --instance="$DB_INSTANCE" \
  --password="$DB_PASSWORD" \
  --project="$PROJECT_ID" 2>/dev/null || warn "User '$DB_USER' already exists."

DB_CONNECTION_NAME=$(gcloud sql instances describe "$DB_INSTANCE" \
  --project="$PROJECT_ID" --format="value(connectionName)")
success "Cloud SQL connection name: $DB_CONNECTION_NAME"

# ─── 5. Secret Manager ───────────────────────────────────────────────────────
info "Storing secrets in Secret Manager..."

store_secret() {
  local name="$1" value="$2"
  if gcloud secrets describe "$name" --project="$PROJECT_ID" &>/dev/null; then
    echo "$value" | gcloud secrets versions add "$name" --data-file=- --project="$PROJECT_ID"
    warn "Secret '$name' updated with new version."
  else
    echo "$value" | gcloud secrets create "$name" \
      --data-file=- \
      --replication-policy=automatic \
      --project="$PROJECT_ID"
    success "Secret '$name' created."
  fi
}

# Cloud SQL socket URL for Prisma
DB_URL="postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$DB_CONNECTION_NAME&schema=public"
store_secret "dealio-database-url" "$DB_URL"
store_secret "dealio-jwt-secret"   "$JWT_SECRET"

# Grant Cloud Run SA access to secrets
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
CR_SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
info "Granting Cloud Run service account access to secrets..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$CR_SA" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None --quiet
success "IAM binding applied."

# ─── 6. Build & push backend image ──────────────────────────────────────────
BACKEND_IMAGE="$REGISTRY/dealio-backend:latest"
info "Building backend Docker image..."
docker build --platform linux/amd64 \
  -t "$BACKEND_IMAGE" \
  "$BACKEND_DIR"
info "Pushing backend image..."
docker push "$BACKEND_IMAGE"
success "Backend image pushed: $BACKEND_IMAGE"

# ─── 7. Deploy backend to Cloud Run ─────────────────────────────────────────
info "Deploying backend to Cloud Run..."
gcloud run deploy dealio-backend \
  --image="$BACKEND_IMAGE" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8090 \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1 \
  --add-cloudsql-instances="$DB_CONNECTION_NAME" \
  --set-secrets="DATABASE_URL=dealio-database-url:latest,JWT_SECRET=dealio-jwt-secret:latest" \
  --set-env-vars="NODE_ENV=production,PORT=8090" \
  --project="$PROJECT_ID"

BACKEND_URL=$(gcloud run services describe dealio-backend \
  --region="$REGION" --project="$PROJECT_ID" \
  --format="value(status.url)")
success "Backend deployed: $BACKEND_URL"

# ─── 8. Run Prisma migrations ────────────────────────────────────────────────
info "Running Prisma DB push via Cloud Run job..."
# Use a one-off Cloud Run job to run migrations against Cloud SQL
gcloud run jobs create dealio-migrate \
  --image="$BACKEND_IMAGE" \
  --region="$REGION" \
  --add-cloudsql-instances="$DB_CONNECTION_NAME" \
  --set-secrets="DATABASE_URL=dealio-database-url:latest" \
  --set-env-vars="NODE_ENV=production" \
  --command="npm" \
  --args="run,migrate" \
  --project="$PROJECT_ID" 2>/dev/null || \
gcloud run jobs update dealio-migrate \
  --image="$BACKEND_IMAGE" \
  --region="$REGION" \
  --add-cloudsql-instances="$DB_CONNECTION_NAME" \
  --set-secrets="DATABASE_URL=dealio-database-url:latest" \
  --set-env-vars="NODE_ENV=production" \
  --command="npm" \
  --args="run,migrate" \
  --project="$PROJECT_ID"

gcloud run jobs execute dealio-migrate \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --wait
success "Database schema applied."

# ─── 9. Build & push frontend image ─────────────────────────────────────────
FRONTEND_IMAGE="$REGISTRY/dealio-frontend:latest"
info "Building frontend Docker image (with backend URL baked in)..."
docker build --platform linux/amd64 \
  -t "$FRONTEND_IMAGE" \
  --build-arg "VITE_AUTH_URL=$BACKEND_URL/api" \
  --build-arg "VITE_BUILDER_URL=$BACKEND_URL/api" \
  --build-arg "VITE_CUSTOMER_URL=$BACKEND_URL/api" \
  --build-arg "VITE_SUPABASE_URL=$SUPABASE_URL" \
  --build-arg "VITE_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_KEY" \
  --build-arg "VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID" \
  "$FRONTEND_DIR"
info "Pushing frontend image..."
docker push "$FRONTEND_IMAGE"
success "Frontend image pushed: $FRONTEND_IMAGE"

# ─── 10. Deploy frontend to Cloud Run ────────────────────────────────────────
info "Deploying frontend to Cloud Run..."
gcloud run deploy dealio-frontend \
  --image="$FRONTEND_IMAGE" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --min-instances=0 \
  --max-instances=10 \
  --memory=256Mi \
  --cpu=1 \
  --project="$PROJECT_ID"

FRONTEND_URL=$(gcloud run services describe dealio-frontend \
  --region="$REGION" --project="$PROJECT_ID" \
  --format="value(status.url)")
success "Frontend deployed: $FRONTEND_URL"

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "=================================================================="
echo -e "  ${GREEN}Deployment complete!${NC}"
echo "=================================================================="
echo ""
echo -e "  🌐 Frontend  : ${GREEN}$FRONTEND_URL${NC}"
echo -e "  🔧 Backend   : ${GREEN}$BACKEND_URL${NC}"
echo -e "  🏥 Health    : ${GREEN}$BACKEND_URL/api/health${NC}"
echo -e "  🗄  Cloud SQL : ${BLUE}$DB_CONNECTION_NAME${NC}"
echo ""
echo "  Next steps:"
echo "  1. Add $FRONTEND_URL to Google OAuth Authorized JavaScript origins"
echo "     https://console.cloud.google.com/apis/credentials"
echo "  2. Add $FRONTEND_URL to your Supabase allowed URLs (if using Supabase auth)"
echo "  3. Update CORS in backend if needed (currently allows all origins)"
echo ""
