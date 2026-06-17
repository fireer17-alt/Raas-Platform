const ROSLIB = require('roslibjs');
const EventEmitter = require('events');

class ROSBridge extends EventEmitter {
  constructor(url = 'ws://localhost:9090') {
    super();
    this.url = url;
    this.ros = null;
    this.connected = false;
    this.topics = new Map();
    this.services = new Map();
    this.robots = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ros = new ROSLIB.Ros({
        url: this.url,
        timeout: 5000
      });

      this.ros.on('connection', () => {
        console.log('✓ Connected to ROS');
        this.connected = true;
        this.emit('connected');
        resolve();
      });

      this.ros.on('error', (error) => {
        console.error('✗ ROS Connection Error:', error);
        this.emit('error', error);
        reject(error);
      });

      this.ros.on('close', () => {
        console.log('✗ Disconnected from ROS');
        this.connected = false;
        this.emit('disconnected');
      });
    });
  }

  disconnect() {
    if (this.ros) {
      this.ros.close();
    }
  }

  subscribeTopic(topicName, messageType) {
    if (this.topics.has(topicName)) {
      return this.topics.get(topicName);
    }

    const topic = new ROSLIB.Topic({
      ros: this.ros,
      name: topicName,
      messageType: messageType,
      throttle_rate: 100
    });

    this.topics.set(topicName, topic);
    return topic;
  }

  unsubscribeTopic(topicName) {
    const topic = this.topics.get(topicName);
    if (topic) {
      topic.unsubscribe();
      this.topics.delete(topicName);
    }
  }

  publishTopic(topicName, messageType, message) {
    if (!this.connected) {
      console.warn('Not connected to ROS');
      return;
    }

    const topic = new ROSLIB.Topic({
      ros: this.ros,
      name: topicName,
      messageType: messageType
    });

    const msg = new ROSLIB.Message(message);
    topic.publish(msg);
  }

  callService(serviceName, serviceType, request = {}) {
    return new Promise((resolve, reject) => {
      const service = new ROSLIB.Service({
        ros: this.ros,
        name: serviceName,
        serviceType: serviceType
      });

      service.callService(new ROSLIB.ServiceRequest(request), (result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }

  // Robot-specific methods
  registerRobot(robotId, robotType = 'warehouse') {
    const robot = {
      id: robotId,
      type: robotType,
      status: 'offline',
      battery: 100,
      position: { x: 0, y: 0, z: 0 },
      topics: {
        telemetry: `/${robotId}/telemetry`,
        battery: `/${robotId}/battery`,
        status: `/${robotId}/status`,
        odom: `/${robotId}/odom`,
        pose: `/${robotId}/pose`,
        cmdVel: `/${robotId}/cmd_vel`,
        commands: `/${robotId}/commands`
      }
    };

    this.robots.set(robotId, robot);
    return robot;
  }

  subscribeToRobotTelemetry(robotId, callback) {
    const topic = this.subscribeTopic(`/${robotId}/telemetry`, 'std_msgs/String');
    
    topic.subscribe((message) => {
      try {
        const data = JSON.parse(message.data);
        callback(null, data);
      } catch (error) {
        callback(error, null);
      }
    });

    return topic;
  }

  subscribeToRobotStatus(robotId, callback) {
    const topic = this.subscribeTopic(`/${robotId}/status`, 'std_msgs/String');
    
    topic.subscribe((message) => {
      try {
        const data = JSON.parse(message.data);
        callback(null, data);
      } catch (error) {
        callback(error, null);
      }
    });

    return topic;
  }

  sendRobotCommand(robotId, command, params = {}) {
    const commandMsg = {
      command: command,
      params: params,
      timestamp: new Date().toISOString()
    };

    this.publishTopic(
      `/${robotId}/commands`,
      'std_msgs/String',
      { data: JSON.stringify(commandMsg) }
    );
  }

  getRobotInfo(robotId) {
    return this.robots.get(robotId);
  }

  getAllRobots() {
    return Array.from(this.robots.values());
  }

  getConnectedStatus() {
    return this.connected;
  }
}

module.exports = ROSBridge;
