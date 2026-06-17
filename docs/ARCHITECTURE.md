# RaaS Platform Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         Users (Web Browser)                                       │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                │
                    ┌───────────────────────┐
                    │  React Frontend       │
                    │  (Cloud Run/Static)   │
                    │  - Dashboard          │
                    │  - Robot Control      │
                    │  - Task Management    │
                    └──────────────┬────────┘
                                │
                    ┌───────────────────────┐
                    │   Express Backend     │
                    │   (Cloud Run/GKE)     │
                    │  - REST API           │
                    │  - Socket.io WS       │
                    │  - ROS Bridge         │
                    │  - Pub/Sub Client     │
                    └──────┬────────────────┘
                    │           │           │
        ┌───────────────┐  ┌──┴───┐  ┌────────────────────┐
        │   Firestore   │  │Pub/S │  │ROS Bridge          │
        │   Database    │  │  ub  │  │(localhost)         │
        │ - Users        │  │     │  │                     │
        │ - Robots       │  │Telemetry           Physical │
        │ - Tasks        │  │Commands            Robots   │
        │ - Telemetry    │  │     │  │                     │
        │ - Commands     │  │     │  │  Physical Robots   │
        │ - Subscriptions│  │     │  │                     │
        └────────────────┘  └─────┘  └─────────────────────┘
```

## Component Details

### Frontend (React)
- Dashboard with real-time metrics
- Robot fleet management
- Task creation and monitoring
- Billing and subscription management
- WebSocket connection for live updates

### Backend (Node.js/Express)
- REST API endpoints
- Socket.io for real-time communication
- Firebase Admin SDK for authentication
- Google Pub/Sub client for message queuing
- ROS bridge integration

### Database (Firestore)
- NoSQL document database
- Real-time subscriptions
- Automatic scaling
- Free tier: 50k read/20k write ops/day

### Message Queue (Pub/Sub)
- Robot telemetry publishing
- Command distribution
- Event streaming
- Decoupled communication

### ROS Integration
- rosbridge_suite for WebSocket communication
- roslibjs library for connections
- Topic subscriptions for telemetry
- Service calls for robot commands

## Data Flow

### 1. Robot Telemetry Flow
```
Robot (ROS)
    ↓ (publishes /robot/telemetry)
ROS Bridge
    ↓ (WebSocket message)
Express Backend
    ↓ (processes data)
Google Pub/Sub Topic
    ↓ (publishes message)
Express Backend Subscriber
    ↓ (receives message)
Socket.io Event
    ↓ (broadcasts to clients)
React Dashboard
    ↓ (updates UI)
User Browser
```

### 2. Command Flow
```
React Dashboard
    ↓ (user clicks command)
Express API
    ↓ (/api/robots/:id/command)
Google Pub/Sub Topic (robot-commands)
    ↓ (publishes command)
Robot Subscriber
    ↓ (receives via Pub/Sub)
ROS Service Call
    ↓
Robot Hardware
    ↓ (executes command)
Telemetry Response
    ↓ (publishes status)
Google Pub/Sub Topic (robot-telemetry)
    ↓
Dashboard Update
```

### 3. Task Assignment Flow
```
User Creates Task
    ↓ (POST /api/tasks)
Firestore (tasks collection)
    ↓ (document created)
Task Scheduler Service
    ↓ (selects available robot)
Firestore (robots collection) - update status
    ↓
Robot Assignment
    ↓ (Pub/Sub message)
Robot Executes Task
    ↓ (publishes telemetry)
Task Status Update
    ↓
User Dashboard
```

## Deployment Architecture (GCP)

### Cloud Run (Recommended for College)
- Fully serverless
- Auto-scaling
- Pay-per-use
- No infrastructure management

```
GitHub Push
    ↓
Cloud Build (automatic)
    ↓ (builds Docker images)
Container Registry
    ↓ (stores images)
Cloud Run
    ↓ (deploys frontend & backend)
Cloud Load Balancer
    ↓
Users
```

### GKE (Kubernetes)
- More control
- Better for complex deployments
- Scaling across multiple nodes
- Higher cost

## Security Architecture

1. **Authentication**: Firebase Auth
   - Email/Password
   - OAuth (Google, GitHub)
   - Custom tokens for robots

2. **Authorization**: Firestore Security Rules
   - User can only access own robots/tasks
   - Robots can only publish telemetry
   - Admin endpoints protected

3. **API Security**:
   - JWT tokens in headers
   - HTTPS/WSS encryption
   - CORS restrictions
   - Request validation

4. **Data Security**:
   - Firestore encryption at rest
   - VPC connectivity (optional)
   - Audit logging

## Scaling Considerations

### Current Setup (Free Tier)
- ~1000 robots
- ~10k concurrent users
- ~100k tasks/day

### If Upgrading:
1. Add Cloud CDN for frontend
2. Enable Firestore auto-scaling
3. Use Cloud Memorystore (Redis) for caching
4. Implement database sharding
5. Setup multi-region deployment

## Cost Breakdown (Monthly)

| Service | Free Tier | Estimate |
|---------|-----------|----------|
| Firestore | 50k reads/20k writes | $0 |
| Pub/Sub | 10 GB/month | $0 |
| Cloud Run | 2M requests | $0 |
| Cloud Storage | 5 GB | $0 |
| Cloud Build | 120 min/day | $0 |
| GKE Nodes | N/A | ~$12 |
| **Total** | | **$0-12** |
