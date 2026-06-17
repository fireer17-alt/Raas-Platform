# ROS-Integrated MERN RaaS Platform for GCP

A cost-optimized Robotics-as-a-Service platform for warehouse automation, delivery robots, and cleaning/security robots.

**Features:**
- Multi-robot fleet management
- Real-time monitoring & control via React dashboard
- ROS integration via rosbridge_suite
- Billing/subscription system
- Digital twin simulation (basic)
- Optimized for GCP free tier

## Tech Stack

- **Frontend**: React + Redux + Socket.io
- **Backend**: Node.js + Express + Firebase Admin SDK
- **Database**: Google Cloud Firestore
- **Message Queue**: Google Pub/Sub
- **Deployment**: Cloud Run + GKE (free tier)
- **Storage**: Cloud Storage
- **Monitoring**: Cloud Logging + Cloud Monitoring

## Quick Start

### Prerequisites
```bash
# Install Node.js 18+
# Install Docker
# Setup GCP account with free tier
```

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/fireer17-alt/Raas-Platform.git
   cd Raas-Platform
   ```

2. **Setup GCP**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   gcloud services enable firestore.googleapis.com pubsub.googleapis.com
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your GCP credentials
   npm run dev
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm start
   ```

## Project Structure

```
Raas-Platform/
├── backend/              # Express API server
├── frontend/             # React dashboard
├── gcp/                  # GCP configuration
│   ├── cloud-build.yaml  # CI/CD pipeline
│   ├── kubernetes/       # GKE manifests
│   └── firestore/        # Database schemas
├── docs/                 # Setup guides
└── docker-compose.yml    # Local development
```

## GCP Deployment

### Option 1: Cloud Run (Serverless - Cheapest)
```bash
cd backend
gcloud run deploy raas-backend --source . --region us-central1
```

### Option 2: GKE (Free tier - 3 nodes)
```bash
gcloud container clusters create raas-cluster --zone us-central1-a --num-nodes 1
kubectl apply -f gcp/kubernetes/
```

## Cost Breakdown (Free Tier)

| Service | Monthly Cost |
|---------|-------------|
| Firestore | FREE (50k read/20k write ops) |
| Pub/Sub | FREE (10 GB/month) |
| Cloud Run | FREE (2M requests/month) |
| Cloud Storage | FREE (5 GB) |
| Cloud Build | FREE (120 min/day) |
| GKE | FREE (3 nodes, charges for compute) |
| **Total** | **~$0-20** (compute only) |

## API Documentation

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Robots
- `GET /api/robots` - List all robots
- `POST /api/robots` - Register new robot
- `GET /api/robots/:id` - Get robot status
- `POST /api/robots/:id/command` - Send command to robot

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task status

### Billing
- `GET /api/billing/subscription` - Get subscription info
- `POST /api/billing/update-plan` - Change plan

## WebSocket Events

Real-time robot telemetry via Socket.io:

```javascript
// Client
socket.on('robot:telemetry', (data) => {
  console.log('Robot status:', data);
});

// Server (triggered by Pub/Sub)
socket.emit('robot:telemetry', {
  robotId: '123',
  battery: 85,
  location: { x: 10, y: 20 },
  status: 'idle'
});
```

## ROS Integration

### Connect Robot to Platform

```bash
# On robot (ROS machine)
rosbridge_server

# Backend auto-connects and subscribes to topics:
# - /robot/telemetry
# - /robot/status
# - /robot/battery
```

## Database Schema (Firestore)

### Collections
- `users` - User accounts & subscriptions
- `robots` - Robot inventory & status
- `tasks` - Task queue
- `telemetry` - Robot sensor data (time-series)
- `commands` - Command history

## Environment Variables

See `.env.example` files in `backend/` and `frontend/`

## License

MIT

## Support

For issues and questions, create a GitHub issue.
