#!/usr/bin/env python3
"""
Robot Simulator - Simulates physical robots publishing to ROS topics
"""

import rospy
import json
import os
import math
import random
from geometry_msgs.msg import Twist, Point, Quaternion, PoseStamped
from sensor_msgs.msg import BatteryState
from std_msgs.msg import String, Float32, Bool
from nav_msgs.msg import Odometry
import tf
from tf.transformations import quaternion_from_euler

class RobotSimulator:
    def __init__(self, robot_type='warehouse', robot_id='robot_1'):
        self.robot_type = robot_type
        self.robot_id = robot_id
        
        # Robot state
        self.position = {'x': 0.0, 'y': 0.0, 'z': 0.0}
        self.velocity = {'x': 0.0, 'y': 0.0}
        self.battery_level = 100.0
        self.is_charging = False
        self.current_task = None
        self.status = 'idle'
        
        # Initialize ROS node
        rospy.init_node(f'{self.robot_id}_simulator', anonymous=False)
        
        # Publishers
        self.pub_telemetry = rospy.Publisher(
            f'/{self.robot_id}/telemetry',
            String,
            queue_size=10
        )
        self.pub_battery = rospy.Publisher(
            f'/{self.robot_id}/battery',
            BatteryState,
            queue_size=10
        )
        self.pub_status = rospy.Publisher(
            f'/{self.robot_id}/status',
            String,
            queue_size=10
        )
        self.pub_odometry = rospy.Publisher(
            f'/{self.robot_id}/odom',
            Odometry,
            queue_size=10
        )
        self.pub_pose = rospy.Publisher(
            f'/{self.robot_id}/pose',
            PoseStamped,
            queue_size=10
        )
        
        # Subscribers
        rospy.Subscriber(
            f'/{self.robot_id}/cmd_vel',
            Twist,
            self.cmd_vel_callback
        )
        rospy.Subscriber(
            f'/{self.robot_id}/commands',
            String,
            self.command_callback
        )
        
        # TF broadcaster
        self.br = tf.TransformBroadcaster()
        
        # Timer
        self.rate = rospy.Rate(10)  # 10 Hz
        
        rospy.loginfo(f'Robot simulator started: {self.robot_id} (type: {self.robot_type})')
    
    def cmd_vel_callback(self, msg):
        """Handle velocity commands"""
        self.velocity = {'x': msg.linear.x, 'y': msg.linear.y}
        self.status = 'moving' if (msg.linear.x != 0 or msg.linear.y != 0) else 'idle'
    
    def command_callback(self, msg):
        """Handle high-level commands"""
        try:
            cmd = json.loads(msg.data)
            command_type = cmd.get('command')
            params = cmd.get('params', {})
            
            rospy.loginfo(f'Received command: {command_type} with params: {params}')
            
            if command_type == 'move_to':
                self.move_to(params.get('x', 0), params.get('y', 0))
            elif command_type == 'pick':
                self.perform_task('pick')
            elif command_type == 'drop':
                self.perform_task('drop')
            elif command_type == 'charge':
                self.perform_task('charge')
            elif command_type == 'reset':
                self.reset()
            elif command_type == 'stop':
                self.stop()
        except Exception as e:
            rospy.logerr(f'Error processing command: {e}')
    
    def move_to(self, x, y):
        """Move robot to target position"""
        self.status = 'moving'
        self.current_task = f'move_to_{x}_{y}'
        target_dist = math.sqrt((x - self.position['x'])**2 + (y - self.position['y'])**2)
        
        # Simulate movement
        if target_dist > 0.1:
            direction_x = (x - self.position['x']) / target_dist
            direction_y = (y - self.position['y']) / target_dist
            self.velocity = {'x': direction_x * 0.5, 'y': direction_y * 0.5}
    
    def perform_task(self, task_type):
        """Perform a task (pick, drop, charge, etc.)"""
        self.status = f'performing_{task_type}'
        self.current_task = task_type
        rospy.loginfo(f'{self.robot_id} performing task: {task_type}')
    
    def stop(self):
        """Stop the robot"""
        self.velocity = {'x': 0.0, 'y': 0.0}
        self.status = 'idle'
        self.current_task = None
    
    def reset(self):
        """Reset robot to origin"""
        self.position = {'x': 0.0, 'y': 0.0, 'z': 0.0}
        self.velocity = {'x': 0.0, 'y': 0.0}
        self.battery_level = 100.0
        self.status = 'idle'
        self.current_task = None
    
    def update(self):
        """Update robot state and publish data"""
        # Update position based on velocity
        dt = 0.1  # 100ms
        self.position['x'] += self.velocity['x'] * dt
        self.position['y'] += self.velocity['y'] * dt
        
        # Update battery
        if self.status == 'performing_charge':
            self.battery_level = min(100.0, self.battery_level + 2.0)
        else:
            self.battery_level = max(0.0, self.battery_level - 0.1)
        
        # Publish telemetry
        self.publish_telemetry()
        self.publish_battery()
        self.publish_status()
        self.publish_odometry()
        self.publish_pose()
    
    def publish_telemetry(self):
        """Publish robot telemetry"""
        telemetry = {
            'robot_id': self.robot_id,
            'type': self.robot_type,
            'timestamp': rospy.get_time(),
            'position': self.position,
            'velocity': self.velocity,
            'battery': round(self.battery_level, 2),
            'status': self.status,
            'current_task': self.current_task
        }
        self.pub_telemetry.publish(json.dumps(telemetry))
    
    def publish_battery(self):
        """Publish battery state"""
        battery_msg = BatteryState()
        battery_msg.header.stamp = rospy.Time.now()
        battery_msg.voltage = 24.0
        battery_msg.current = 10.0
        battery_msg.charge = self.battery_level / 100.0
        battery_msg.capacity = 1.0
        battery_msg.percentage = self.battery_level / 100.0
        battery_msg.power_supply_status = BatteryState.POWER_SUPPLY_STATUS_DISCHARGING
        self.pub_battery.publish(battery_msg)
    
    def publish_status(self):
        """Publish robot status"""
        status_msg = {
            'robot_id': self.robot_id,
            'status': self.status,
            'battery_level': round(self.battery_level, 2),
            'position': self.position,
            'task': self.current_task
        }
        self.pub_status.publish(json.dumps(status_msg))
    
    def publish_odometry(self):
        """Publish odometry data"""
        odom = Odometry()
        odom.header.stamp = rospy.Time.now()
        odom.header.frame_id = 'odom'
        odom.child_frame_id = f'{self.robot_id}/base_link'
        
        # Position
        odom.pose.pose.position.x = self.position['x']
        odom.pose.pose.position.y = self.position['y']
        odom.pose.pose.position.z = self.position['z']
        
        # Orientation (identity quaternion)
        odom.pose.pose.orientation.w = 1.0
        
        # Velocity
        odom.twist.twist.linear.x = self.velocity['x']
        odom.twist.twist.linear.y = self.velocity['y']
        
        self.pub_odometry.publish(odom)
    
    def publish_pose(self):
        """Publish pose stamped"""
        pose = PoseStamped()
        pose.header.stamp = rospy.Time.now()
        pose.header.frame_id = 'map'
        
        pose.pose.position.x = self.position['x']
        pose.pose.position.y = self.position['y']
        pose.pose.position.z = self.position['z']
        
        pose.pose.orientation.w = 1.0
        
        self.pub_pose.publish(pose)
    
    def run(self):
        """Main loop"""
        try:
            while not rospy.is_shutdown():
                self.update()
                self.rate.sleep()
        except KeyboardInterrupt:
            rospy.loginfo(f'{self.robot_id} simulator stopped')

def main():
    robot_type = os.getenv('ROBOT_TYPE', 'warehouse')
    robot_id = os.getenv('ROBOT_ID', 'robot_1')
    
    simulator = RobotSimulator(robot_type=robot_type, robot_id=robot_id)
    simulator.run()

if __name__ == '__main__':
    main()
