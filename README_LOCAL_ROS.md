# RaaS Platform - Local ROS Integration Setup

## Overview

This branch contains a complete local ROS setup for the RaaS platform with:
- **ROS Master** running in Docker
- **ROSBridge** WebSocket server for real-time communication
- **Robot Simulator** publishing realistic telemetry data
- **Express Backend** connected to ROS via ROSBridge
- **React Frontend** with real-time dashboard

## Quick Start (2 minutes)

### Prerequisites
```bash
# Install Docker and Docker Compose
# - Docker: https://docs.docker.com/get-docker/
# - Docker Compose: https://docs.docker.com/compose/install/
```

### Start Everything

```bash
# 1. Checkout the local ROS integration branch
git checkout feature/local-ros-integration

# 2. Start all services
docker-compose -f docker-compose-ros.yml up -d

# 3. Wait for services to be healthy (30-60 seconds)
docker-compose -f docker-compose-ros.yml ps

# 4. Open in browser
# Frontend: http://localhost:3000
# API: http://localhost:5000/health
```

## Services

### ROS Master (Port 11311)
```bash
Container: ros-master
Image: ros:noetic-ros-core
Function: Core ROS infrastructure
```

### ROSBridge Server (Port 9090)
```bash
Container: rosbridge-server
Image: ros:noetic-ros-core
Function: WebSocket interface to ROS
URL: ws://localhost:9090
```

### Robot Simulator
```bash
Container: robot-simulator
Language: Python 3 + ROS
Function: Publishes realistic robot telemetry
Topics:
  - /robot_1/telemetry (JSON telemetry data)
  - /robot_1/battery (BatteryState message)
  - /robot_1/status (Robot status JSON)
  - /robot_1/odom (Odometry data)
  - /robot_1/pose (Pose stamped)
Listens to:
  - /robot_1/cmd_vel (Velocity commands)
  - /robot_1/commands (High-level commands)
```

### Backend API (Port 5000)
```bash
Container: raas-backend
Framework: Node.js + Express
Function: REST API + WebSocket server
Endpoints: /api/robots, /api/robots/:id/command, etc.
WebSocket: Publishes real-time telemetry
```

### Frontend (Port 3000)
```bash
Container: raas-frontend
Framework: React
Function: Real-time dashboard
Features: Robot control, status monitoring, task management
```

## Usage

### View Dashboard
```bash
# Open browser
http://localhost:3000

# You should see:
# - 1 warehouse robot (robot_1) registered
# - Real-time battery level
# - Live position tracking
# - Robot status (idle, moving, performing_charge, etc.)
```

### Control Robots via API

#### Get all robots
```bash
curl http://localhost:5000/api/robots
```

#### Get robot status
```bash
curl http://localhost:5000/api/robots/robot_1
```

#### Send command to robot
```bash
curl -X POST http://localhost:5000/api/robots/robot_1/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "move_to",
    "params": {"x": 5, "y": 10}
  }'
```

#### Available Commands
- `move_to` - Move to coordinates: `{x, y, z?}`
- `stop` - Stop moving
- `pick` - Pick up item
- `drop` - Drop item
- `charge` - Start charging
- `reset` - Reset robot to origin

### Control Robots via WebSocket

```javascript
// JavaScript client example
const socket = io('http://localhost:5000');

// Subscribe to robot
socket.emit('subscribe:robot', 'robot_1');

// Receive telemetry
socket.on('robot:telemetry', (data) => {
  console.log('Robot telemetry:', data);
});

// Send command
socket.emit('command:robot', {
  robotId: 'robot_1',
  command: 'move_to',
  params: {x: 10, y: 20}
});

// Listen for command acknowledgment
socket.on('command:ack', (data) => {
  console.log('Command acknowledged:', data);
});
```

## ROS Topics & Services

### Available Topics

#### Robot Telemetry
```bash
# View published data
rostopic echo /robot_1/telemetry

# Example output:
data: '{"robot_id": "robot_1", "type": "warehouse", "status": "idle", "battery": 95.5, "position": {"x": 2.1, "y": 3.4, "z": 0.0}}'
```

#### Robot Status
```bash
rostopic echo /robot_1/status
```

#### Battery State
```bash
rostopic echo /robot_1/battery
```

#### Odometry
```bash
rostopic echo /robot_1/odom
```

### Publishing Commands

```bash
# Send move command
rostopic pub /robot_1/commands std_msgs/String \
  "data: '{\"command\": \"move_to\", \"params\": {\"x\": 5, \"y\": 10}}'"

# Send stop command
rostopic pub /robot_1/commands std_msgs/String \
  "data: '{\"command\": \"stop\"}'"

# Send pick command
rostopic pub /robot_1/commands std_msgs/String \
  "data: '{\"command\": \"pick\"}'"
```

## Debugging

### Check ROS Master
```bash
# SSH into ROS master
docker exec -it ros-master bash

# List all nodes
rosnode list

# List all topics
rostopic list

# Check connections
rostopic echo /robot_1/telemetry
```

### Check Robot Simulator Logs
```bash
docker logs -f robot-simulator
```

### Check Backend Logs
```bash
docker logs -f raas-backend
```

### Check Frontend Logs
```bash
docker logs -f raas-frontend
```

### Test ROSBridge Connectivity
```bash
# From host machine
curl http://localhost:9090

# Should return HTML content (ROSBridge UI)
```

## Adding More Robots

### Option 1: Update docker-compose-ros.yml

```yaml
services:
  robot-simulator-2:
    build:
      context: ./robot-simulator
      dockerfile: Dockerfile
    container_name: robot-simulator-2
    depends_on:
      ros-master:
        condition: service_healthy
    environment:
      ROS_MASTER_URI: http://ros-master:11311
      ROS_HOSTNAME: robot-simulator-2
      ROBOT_TYPE: delivery
      ROBOT_ID: robot_2
    networks:
      - ros-network
    volumes:
      - ./robot-simulator:/app
```

Then restart:
```bash
docker-compose -f docker-compose-ros.yml up -d
```

### Option 2: Register via API

```bash
curl -X POST http://localhost:5000/api/robots \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Delivery Bot 1",
    "type": "delivery",
    "location": "Warehouse B"
  }'
```

## Stopping Services

```bash
# Stop all containers
docker-compose -f docker-compose-ros.yml down

# Stop and remove volumes
docker-compose -f docker-compose-ros.yml down -v

# View logs
docker-compose -f docker-compose-ros.yml logs -f
```

## File Structure

```
feature/local-ros-integration/
├── docker-compose-ros.yml        # Main compose file
├── robot-simulator/
│   ├── Dockerfile                # Python + ROS environment
│   └── simulator.py              # Robot simulation logic
├── backend/
│   ├── src/
│   │   ├── index-local-ros.js   # Local ROS version of backend
│   │   ├── ros-bridge.js        # ROSBridge wrapper
│   │   └── robot-controller.js  # Robot control logic
│   └── package.json             # Updated with ros scripts
├── frontend/
│   └── Dockerfile.dev           # Development Dockerfile
└── README_LOCAL_ROS.md          # This file
```

## Common Issues

### "Connection refused" when accessing localhost:3000
**Solution:**
```bash
# Wait for containers to start
docker-compose -f docker-compose-ros.yml ps

# If not all running, check logs
docker-compose -f docker-compose-ros.yml logs
```

### ROSBridge not connecting
**Solution:**
```bash
# Check if ROSBridge is running
docker ps | grep rosbridge

# Check logs
docker logs rosbridge-server

# Ensure ROS Master is healthy
docker logs ros-master
```

### Frontend not updating with robot telemetry
**Solution:**
```bash
# Check WebSocket connection in browser console
# Open DevTools (F12) -> Console tab

# Check backend logs
docker logs -f raas-backend

# Test API endpoint
curl http://localhost:5000/api/robots
```

### Robot simulator not publishing
**Solution:**
```bash
# Check simulator logs
docker logs -f robot-simulator

# Verify ROS Master is healthy
docker exec ros-master rosnode list
```

## Performance Tips

1. **Increase telemetry rate:**
   Edit `robot-simulator/simulator.py`, change `self.rate = rospy.Rate(10)` to higher value (e.g., 20)

2. **Multiple simulators:**
   Add more robot-simulator services in docker-compose-ros.yml with different ROBOT_ID

3. **Optimize network:**
   Use `--network host` for Docker containers to reduce latency (Linux only)

## Next Steps

1. **Add more robot types** - Edit simulator.py to add cleaning robot, security robot logic
2. **Create task scheduler** - Implement task queue and assignment logic
3. **Add collision detection** - Track robot positions and prevent collisions
4. **Implement charging stations** - Create dock detection and charging logic
5. **Deploy to Kubernetes** - Use the main branch k8s configs

## Documentation

- ROS Documentation: http://wiki.ros.org/
- ROSBridge Documentation: http://wiki.ros.org/rosbridge_suite
- roslibjs Documentation: http://wiki.ros.org/roslibjs

## Support

For issues or questions:
1. Check logs: `docker-compose -f docker-compose-ros.yml logs <service>`
2. Review this README
3. Check GitHub Issues: https://github.com/fireer17-alt/Raas-Platform/issues
