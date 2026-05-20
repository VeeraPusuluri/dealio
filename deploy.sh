#!/usr/bin/env bash
# =============================================================================
#  Dealio — GCP deployment script
#  Backend + Frontend → Cloud Run (us-east4)
#  Database          → AlloyDB (existing cluster: dealio, us-east4)
# =============================================================================
set -euo pipefail

# ─── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERR]${NC}   $*"; exit 1; }

# ─── Config ───────────────────────────────────────────────────────────────────
PROJECT_ID="dealio-496906"
REGION="us-east4"
REPO="dealio-repo"
VPC_CONNECTOR="dealio-vpc-connector"
VPC_NETWORK="default"

# AlloyDB
ALLOYDB_CLUSTER="dealio"
ALLOYDB_INSTANCE="dealio-primary"
ALLOYDB_IP="10.67.16.2"
DB_NAME="dealio"
DB_USER="postgres"

# Secrets
DB_PASSWORD="C7q*S#*y\$>IZ+IV\$"
JWT_SECRET="C7q*S#*y\$>IZ+IV\$"

# Frontend extras
GOOGLE_CLIENT_ID="673292166083-q6vv1alnlv95avim75psia1jq4fsjcui.apps.googleusercontent.com"
SUPABASE_URL="https://gpatbmyichpohjenpiyj.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwYXRibXlpY2hwb2hqZW5waXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0ODIwOTEsImV4cCI6MjA5NDA1ODA5MX0.ZJBUVb1t1RZnSVpAZOHW397EOc6U_E8OaFB2WVhxNBk"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/Dealio_Backend"
FRONTEND_DIR="$SCRIPT_DIR/Dealio_frontend"
REGISTRY="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO"
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$ALLOYDB_IP:5432/$DB_NAME?schema=public"

echo ""
echo "=================================================================="
echo "  Dealio → GCP Deployment"
echo "  Project : $PROJECT_ID  |  Region: $REGION"
echo "  Database: AlloyDB $ALLOYDB_CLUSTER ($ALLOYDB_IP)"
echo "=================================================================="
echo ""

# ─── 1. Set project ───────────────────────────────────────────────────────────
gcloud config set project "$PROJECT_ID" --quiet

# ─── 2. Enable APIs ───────────────────────────────────────────────────────────
info "Enabling required GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  vpcaccess.googleapis.com \
  alloydb.googleapis.com \
  --project "$PROJECT_ID" --quiet
success "APIs enabled."

# ─── 3. Serverless VPC Access connector ──────────────────────────────────────
info "Setting up Serverless VPC Access connector..."
if gcloud compute networks vpc-access connectors describe "$VPC_CONNECTOR" \
    --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  warn "VPC connector '$VPC_CONNECTOR' already exists — skipping."
else
  gcloud compute networks vpc-access connectors create "$VPC_CONNECTOR" \
    --network="$VPC_NETWORK" \
    --region="$REGION" \
    --range="10.8.0.0/28" \
    --project="$PROJECT_ID"
  success "VPC connector created: $VPC_CONNECTOR"
fi

# ─── 4. Artifact Registry ─────────────────────────────────────────────────────
info "Setting up Artifact Registry..."
if gcloud artifacts repositories describe "$REPO" \
    --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  warn "Repository '$REPO' already exists — skipping."
else
  gcloud artifacts repositories create "$REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --description="Dealio Docker images"
  success "Repository created."
fi
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet
success "Docker authenticated for Artifact Registry."

# ─── 5. Secret Manager ────────────────────────────────────────────────────────
info "Storing secrets..."
store_secret() {
  local name="$1" value="$2"
  if gcloud secrets describe "$name" --project="$PROJECT_ID" &>/dev/null; then
    printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=- --project="$PROJECT_ID" --quiet
    warn "Secret '$name' updated."
  else
    printf '%s' "$value" | gcloud secrets create "$name" \
      --data-file=- --replication-policy=automatic \
      --project="$PROJECT_ID" --quiet
    success "Secret '$name' created."
  fi
}
store_secret "dealio-database-url" "$DATABASE_URL"
store_secret "dealio-jwt-secret"   "$JWT_SECRET"

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
CR_SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
info "Granting Cloud Run SA access to secrets..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$CR_SA" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None --quiet
success "IAM binding done."

# ─── 6. Build & push backend ──────────────────────────────────────────────────
BACKEND_IMAGE="$REGISTRY/dealio-backend:latest"
info "Building backend image..."
docker build --platform linux/amd64 -t "$BACKEND_IMAGE" "$BACKEND_DIR"
info "Pushing backend image..."
docker push "$BACKEND_IMAGE"
success "Backend image pushed."

# ─── 7. Deploy backend to Cloud Run ──────────────────────────────────────────
info "Deploying backend service..."
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
  --vpc-connector="$VPC_CONNECTOR" \
  --vpc-egress=private-ranges-only \
  --set-secrets="DATABASE_URL=dealio-database-url:latest,JWT_SECRET=dealio-jwt-secret:latest" \
  --set-env-vars="NODE_ENV=production,PORT=8090" \
  --project="$PROJECT_ID"

BACKEND_URL=$(gcloud run services describe dealio-backend \
  --region="$REGION" --project="$PROJECT_ID" \
  --format="value(status.url)")
success "Backend live: $BACKEND_URL"

# ─── 8. Run DB init + Prisma migration ───────────────────────────────────────
info "Creating database & pushing Prisma schema..."
if gcloud run jobs describe dealio-migrate \
    --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  gcloud run jobs update dealio-migrate \
    --image="$BACKEND_IMAGE" \
    --region="$REGION" \
    --vpc-connector="$VPC_CONNECTOR" \
    --vpc-egress=private-ranges-only \
    --set-secrets="DATABASE_URL=dealio-database-url:latest" \
    --set-env-vars="NODE_ENV=production" \
    --command="npm" \
    --args="run,migrate" \
    --project="$PROJECT_ID"
else
  gcloud run jobs create dealio-migrate \
    --image="$BACKEND_IMAGE" \
    --region="$REGION" \
    --vpc-connector="$VPC_CONNECTOR" \
    --vpc-egress=private-ranges-only \
    --set-secrets="DATABASE_URL=dealio-database-url:latest" \
    --set-env-vars="NODE_ENV=production" \
    --command="npm" \
    --args="run,migrate" \
    --project="$PROJECT_ID"
fi
gcloud run jobs execute dealio-migrate \
  --region="$REGION" --project="$PROJECT_ID" --wait
success "Database schema applied."

# ─── 9. Build & push frontend ─────────────────────────────────────────────────
FRONTEND_IMAGE="$REGISTRY/dealio-frontend:latest"
info "Building frontend image (backend URL: $BACKEND_URL)..."
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
success "Frontend image pushed."

# ─── 10. Deploy frontend to Cloud Run ─────────────────────────────────────────
info "Deploying frontend service..."
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
success "Frontend live: $FRONTEND_URL"

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "=================================================================="
echo -e "  ${GREEN}✅ Deployment complete!${NC}"
echo "=================================================================="
echo -e "  🌐 Frontend : ${GREEN}$FRONTEND_URL${NC}"
echo -e "  🔧 Backend  : ${GREEN}$BACKEND_URL${NC}"
echo -e "  🏥 Health   : ${GREEN}$BACKEND_URL/api/health${NC}"
echo ""
echo "  Post-deploy:"
echo "  1. Add $FRONTEND_URL to Google OAuth Authorized JavaScript origins"
echo "     → https://console.cloud.google.com/apis/credentials"
echo ""
