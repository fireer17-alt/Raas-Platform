const ROSBridge = require('./ros-bridge');

class RobotController {
  constructor(rosBridge) {
    this.ros = rosBridge;
    this.robotStates = new Map();
    this.subscriptions = new Map();
  }

  async initializeRobot(robotId, robotType = 'warehouse') {
    console.log(`Initializing robot: ${robotId} (type: ${robotType})`);
    
    const robot = this.ros.registerRobot(robotId, robotType);
    this.robotStates.set(robotId, {
      ...robot,
      lastUpdate: null,
      commands: [],
      telemetryHistory: []
    });

    // Subscribe to telemetry
    try {
      this.ros.subscribeToRobotTelemetry(robotId, (error, data) => {
        if (!error) {
          this.updateRobotState(robotId, data);
        }
      });
    } catch (error) {
      console.error(`Failed to subscribe to ${robotId} telemetry:`, error);
    }

    // Subscribe to status
    try {
      this.ros.subscribeToRobotStatus(robotId, (error, data) => {
        if (!error) {
          this.updateRobotStatus(robotId, data);
        }
      });
    } catch (error) {
      console.error(`Failed to subscribe to ${robotId} status:`, error);
    }

    return robot;
  }

  updateRobotState(robotId, telemetry) {
    const robot = this.robotStates.get(robotId);
    if (!robot) return;

    robot.status = telemetry.status || 'unknown';
    robot.battery = telemetry.battery || 0;
    robot.position = telemetry.position || { x: 0, y: 0, z: 0 };
    robot.lastUpdate = new Date();

    // Store in history (keep last 100 entries)
    if (!robot.telemetryHistory) {
      robot.telemetryHistory = [];
    }
    robot.telemetryHistory.push({
      timestamp: new Date(),
      ...telemetry
    });
    if (robot.telemetryHistory.length > 100) {
      robot.telemetryHistory.shift();
    }
  }

  updateRobotStatus(robotId, status) {
    const robot = this.robotStates.get(robotId);
    if (!robot) return;

    robot.status = status.status || robot.status;
    robot.battery = status.battery_level || robot.battery;
    robot.currentTask = status.task || null;
  }

  getRobotState(robotId) {
    return this.robotStates.get(robotId);
  }

  getAllRobots() {
    const robots = [];
    for (const [robotId, state] of this.robotStates) {
      robots.push({
        id: robotId,
        ...state
      });
    }
    return robots;
  }

  async moveRobot(robotId, x, y, z = 0) {
    console.log(`Moving robot ${robotId} to (${x}, ${y}, ${z})`);
    this.ros.sendRobotCommand(robotId, 'move_to', { x, y, z });
  }

  async stopRobot(robotId) {
    console.log(`Stopping robot ${robotId}`);
    this.ros.sendRobotCommand(robotId, 'stop', {});
  }

  async pickItem(robotId) {
    console.log(`Robot ${robotId} picking item`);
    this.ros.sendRobotCommand(robotId, 'pick', {});
  }

  async dropItem(robotId) {
    console.log(`Robot ${robotId} dropping item`);
    this.ros.sendRobotCommand(robotId, 'drop', {});
  }

  async chargeRobot(robotId) {
    console.log(`Robot ${robotId} starting charge`);
    this.ros.sendRobotCommand(robotId, 'charge', {});
  }

  async resetRobot(robotId) {
    console.log(`Resetting robot ${robotId}`);
    this.ros.sendRobotCommand(robotId, 'reset', {});
    this.robotStates.delete(robotId);
  }

  getTelemetryHistory(robotId, limit = 50) {
    const robot = this.robotStates.get(robotId);
    if (!robot || !robot.telemetryHistory) return [];
    
    return robot.telemetryHistory.slice(-limit);
  }
}

module.exports = RobotController;
