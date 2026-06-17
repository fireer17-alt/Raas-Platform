# GCP Setup Guide for RaaS Platform

## 1. Create GCP Project

```bash
# Set your project ID
GCP_PROJECT_ID="your-project-id"

# Create project
gcloud projects create $GCP_PROJECT_ID

# Set as current project
gcloud config set project $GCP_PROJECT_ID
```

## 2. Enable Required APIs

```bash
gcloud services enable \
  firestore.googleapis.com \
  pubsub.googleapis.com \
  container.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  cloudrun.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com
```

## 3. Create Firestore Database

```bash
# Create Firestore database
gcloud firestore databases create --region=us-central1
```

## 4. Create Pub/Sub Topics

```bash
# Create topics
gcloud pubsub topics create robot-telemetry
gcloud pubsub topics create robot-commands

# Create subscriptions
gcloud pubsub subscriptions create robot-telemetry-sub \
  --topic=robot-telemetry

gcloud pubsub subscriptions create robot-commands-sub \
  --topic=robot-commands
```

## 5. Create Service Account

```bash
# Create service account
gcloud iam service-accounts create raas-backend \
  --display-name="RaaS Backend Service"

# Grant necessary roles
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:raas-backend@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/editor"

# Create and download key
gcloud iam service-accounts keys create service-account-key.json \
  --iam-account=raas-backend@${GCP_PROJECT_ID}.iam.gserviceaccount.com
```

## 6. Setup GKE Cluster (Optional)

```bash
# Create GKE cluster (free tier - 1 node)
gcloud container clusters create raas-cluster \
  --zone=us-central1-a \
  --num-nodes=1 \
  --machine-type=e2-micro \
  --enable-stackdriver-kubernetes

# Get credentials
gcloud container clusters get-credentials raas-cluster \
  --zone=us-central1-a

# Create secret for service account
kubectl create secret generic gcp-key \
  --from-file=key.json=service-account-key.json
```

## 7. Deploy to Cloud Run

```bash
# Build and push backend
cd backend
gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/raas-backend

# Deploy to Cloud Run
gcloud run deploy raas-backend \
  --image gcr.io/$GCP_PROJECT_ID/raas-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$GCP_PROJECT_ID"

# Build and push frontend
cd ../frontend
gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/raas-frontend

# Deploy to Cloud Run
gcloud run deploy raas-frontend \
  --image gcr.io/$GCP_PROJECT_ID/raas-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 8. Setup Cloud Build CI/CD

```bash
# Connect GitHub repository
gcloud builds connect --repository-name=Raas-Platform \
  --repository-owner=fireer17-alt

# Create trigger
gcloud builds triggers create github \
  --name=raas-platform \
  --repo-name=Raas-Platform \
  --repo-owner=fireer17-alt \
  --branch-pattern="^main$" \
  --build-config=gcp/cloud-build.yaml
```

## 9. Setup Monitoring

```bash
# Create notification channel
gcloud alpha monitoring channels create \
  --display-name="RaaS Alerts" \
  --type=email \
  --channel-labels=email_address=your-email@example.com

# Create uptime check
gcloud monitoring uptime-checks create \
  --display-name="RaaS Backend Health" \
  --resource-type=uptime-url \
  --monitored-resource-labels=host=<YOUR_CLOUD_RUN_URL>
```

## 10. Environment Variables

Update `.env` files with your GCP project details:

```bash
# backend/.env
GOOGLE_CLOUD_PROJECT=$GCP_PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

## Cost Estimation

### Free Tier Usage (Monthly)
- **Firestore**: 50k read + 20k write operations FREE
- **Pub/Sub**: 10 GB data FREE
- **Cloud Run**: 2M requests FREE
- **Cloud Storage**: 5 GB FREE
- **Cloud Build**: 120 min/day FREE

### Expected Costs
- GKE node (e2-micro): ~$12/month
- **Total**: ~$12-20/month (if staying within free tier)

## Troubleshooting

### Issue: Firebase Auth not working
```bash
# Ensure Firebase Admin SDK is initialized
gcloud auth application-default login
```

### Issue: Firestore connection errors
```bash
# Check if Firestore is properly created
gcloud firestore databases list
```

### Issue: Pub/Sub messages not flowing
```bash
# List topics and subscriptions
gcloud pubsub topics list
gcloud pubsub subscriptions list

# Test topic
gcloud pubsub topics publish robot-telemetry --message="test"
```
