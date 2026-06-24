import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Play, Pause, RefreshCw, Info, SkipBack, SkipForward, 
  Volume2, VolumeX, ChevronDown, Settings, Maximize2, List 
} from 'lucide-react';
import { RobotArm } from '../components/barista/RobotArm.js';
import './RvizView.css';

// ─── Trajectory Generator for the 6-DOF Robot Arm ───
// Generates natural, continuous joint motions over a 28.5s timeline.
const getJointAnglesAtTime = (t) => {
  // j1 (turntable): rotation in horizontal plane (-1.2 to 1.2 rad)
  const j1 = Math.sin(t * 0.22) * 1.0;
  // j2 (shoulder): sagittal rotation (0.1 to 0.8 rad)
  const j2 = 0.45 + Math.cos(t * 0.18) * 0.3;
  // j3 (elbow): sagittal rotation (-0.6 to 0.2 rad)
  const j3 = -0.25 + Math.sin(t * 0.25) * 0.35;
  // j4 (wrist pitch): (-0.4 to 0.4 rad)
  const j4 = 0.1 + Math.cos(t * 0.4) * 0.3;
  // j5 (wrist roll): rotation (-1.5 to 1.5 rad)
  const j5 = Math.sin(t * 0.3) * 1.2;
  // j6 (gripper offset): opening width (0.05 to 0.3 rad)
  const j6 = 0.17 + Math.sin(t * 0.75) * 0.09;

  return { j1, j2, j3, j4, j5, j6 };
};

// Calculates joint velocities at time t (derivative of the angle sinusoids)
const getJointVelocitiesAtTime = (t) => {
  const v1 = 0.22 * Math.cos(t * 0.22) * 1.0;
  const v2 = -0.18 * Math.sin(t * 0.18) * 0.3;
  const v3 = 0.25 * Math.cos(t * 0.25) * 0.35;
  const v4 = -0.4 * Math.sin(t * 0.4) * 0.3;
  const v5 = 0.3 * Math.cos(t * 0.3) * 1.2;
  const v6 = 0.75 * Math.cos(t * 0.75) * 0.09;
  
  const total = Math.abs(v1) + Math.abs(v2) + Math.abs(v3) + Math.abs(v4) + Math.abs(v5) + Math.abs(v6);
  return { v1, v2, v3, v4, v5, v6, total };
};

// SVG dimensions for scrolling plots
const plotDimensions = { width: 180, height: 42 };

const RvizView = () => {
  const mountRef = useRef(null);
  const depthCanvasRef = useRef(null);

  // Playback Control States
  const [currentTime, setCurrentTime] = useState(0.0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const playbackSpeedRef = useRef(1.0);
  const [isMuted, setIsMuted] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected'); // connected | disconnected | connecting

  // Layout View Toggles
  const [activeTopics, setActiveTopics] = useState({
    grid: true,
    tf: true,
    robot: true,
    cameras: true,
    plots: true
  });

  // Highlighted element on inspection
  const [selectedTopic, setSelectedTopic] = useState('robot');

  // Diagnostics Console log list
  const [logs, setLogs] = useState([
    { time: '09:46:55.002', source: 'MCAP', msg: 'Loaded recording: example-017-droid-ds.mcap' },
    { time: '09:46:55.024', source: 'TF', msg: 'Broadcasting static transforms: world -> base_link' },
    { time: '09:46:55.048', source: 'ROBOT', msg: 'Initializing 6-DOF manipulator node handshake...' },
    { time: '09:46:55.105', source: 'CAM', msg: 'Subscribed to topic: /depth_anything_v2/ext1/left' },
    { time: '09:46:55.140', source: 'SYSTEM', msg: 'Playback started at speed 1.0x' }
  ]);

  const addLog = (source, msg) => {
    const now = new Date();
    const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    setLogs(prev => [{ time: timeStr, source, msg }, ...prev.slice(0, 20)]);
  };

  // Scene references
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const robotInstanceRef = useRef(null);
  const gridHelperRef = useRef(null);
  const axesHelperRef = useRef(null);
  const tfLinesRef = useRef(null);
  
  // Keep the current playback time in a ref for the animation loop
  const currentTimeRef = useRef(0.0);
  const lastTimeRef = useRef(performance.now());

  // Format timestamp for display (matches "2023-05-31 9:46:55.140 AM IST")
  const formattedTimestamp = useMemo(() => {
    const baseMs = new Date('2023-05-31T09:46:55.140').getTime();
    const currentMs = baseMs + currentTime * 1000;
    const dateObj = new Date(currentMs);
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    let hours = dateObj.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    const ms = String(dateObj.getMilliseconds()).padStart(3, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms} ${ampm} IST`;
  }, [currentTime]);

  // Pre-generate SVG Paths for the 7 scrolling plots on the right sidebar (saves computation)
  const plotData = useMemo(() => {
    const joints = ['j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'totalVelocity'];
    const results = {};

    joints.forEach(key => {
      const points = [];
      const steps = 140;
      let minVal = Infinity;
      let maxVal = -Infinity;

      // 1. Determine min and max
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * 28.5;
        let val = 0;
        if (key === 'totalVelocity') {
          val = getJointVelocitiesAtTime(t).total;
        } else {
          val = getJointAnglesAtTime(t)[key];
        }
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }

      // Add safety padding
      const range = maxVal - minVal;
      const padding = range * 0.15 || 0.1;
      const displayMin = minVal - padding;
      const displayMax = maxVal + padding;

      // 2. Generate SVG coordinates
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * 28.5;
        let val = 0;
        if (key === 'totalVelocity') {
          val = getJointVelocitiesAtTime(t).total;
        } else {
          val = getJointAnglesAtTime(t)[key];
        }

        const x = (i / steps) * plotDimensions.width;
        const y = plotDimensions.height - 4 - ((val - displayMin) / (displayMax - displayMin)) * (plotDimensions.height - 8);
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }

      results[key] = {
        path: `M ${points.join(' L ')}`,
        min: displayMin,
        max: displayMax
      };
    });

    return results;
  }, []);

  // ─── Three.js 3D Viewport Initialization ───
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);
    scene.fog = new THREE.FogExp2(0x07090e, 0.04);
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(4, 5, 7);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.01; // stay above floor
    controlsRef.current = controls;

    // 5. Ambient & Directional Lighting (designed for rich metallic shades)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight1.position.set(6, 12, 8);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x5fe1ff, 0.4);
    dirLight2.position.set(-6, 4, -4);
    scene.add(dirLight2);

    // 6. Grid Helper (glowing slate/cyan colors)
    const gridHelper = new THREE.GridHelper(24, 24, 0x06b6d4, 0x1f2937);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // 7. Coordinate origin axes (Red=X, Green=Y, Blue=Z)
    const axesHelper = new THREE.AxesHelper(1.2);
    axesHelper.position.set(0, 0.01, 0);
    scene.add(axesHelper);
    axesHelperRef.current = axesHelper;

    // 8. Load the 6-DOF Manipulator Arm
    const arm = new RobotArm();
    // Position arm at origin, scale slightly down for fitting
    arm.group.scale.set(0.65, 0.65, 0.65);
    arm.group.position.set(0, 0, 0);
    scene.add(arm.group);
    robotInstanceRef.current = arm;

    // 9. Dotted TF Links (rendering lines connecting base -> shoulder -> elbow -> wrist)
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xa78bfa,
      dashSize: 0.1,
      gapSize: 0.05,
      linewidth: 1.5
    });
    const tfPoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(0, 2.5, 0)
    ];
    const tfLineGeo = new THREE.BufferGeometry().setFromPoints(tfPoints);
    const tfLines = new THREE.Line(tfLineGeo, lineMat);
    tfLines.computeLineDistances();
    scene.add(tfLines);
    tfLinesRef.current = tfLines;

    // ─── Animation Ticker ───
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      // Update Playback Clock
      if (isPlaying && connectionStatus === 'connected') {
        currentTimeRef.current += dt * playbackSpeedRef.current;
        if (currentTimeRef.current >= 28.5) {
          currentTimeRef.current = 0;
          addLog('SYSTEM', 'Timeline looped to 0.0s');
        }
        setCurrentTime(currentTimeRef.current);
      }

      const t = currentTimeRef.current;
      const angles = getJointAnglesAtTime(t);

      // 1. Update 3D Robot Arm mesh joints directly
      if (robotInstanceRef.current) {
        robotInstanceRef.current.setJoint('j1', angles.j1);
        robotInstanceRef.current.setJoint('j2', angles.j2);
        robotInstanceRef.current.setJoint('j3', angles.j3);
        robotInstanceRef.current.setJoint('j4', angles.j4);
        robotInstanceRef.current.setJoint('j5', angles.j5);
        robotInstanceRef.current.setJoint('j6', angles.j6);
        // Step critically damped solver inside the mesh instance
        robotInstanceRef.current.update(dt);
      }

      // 2. Update TF dotted trace points dynamically
      if (tfLinesRef.current && robotInstanceRef.current) {
        const linePos = tfLinesRef.current.geometry.attributes.position.array;
        
        // base (0,0,0)
        linePos[0] = 0; linePos[1] = 0; linePos[2] = 0;
        
        // shoulder (Z rotation is turntable j1, height ~0.45)
        const cosJ1 = Math.cos(angles.j1);
        const sinJ1 = Math.sin(angles.j1);
        linePos[3] = 0; linePos[4] = 0.45; linePos[5] = 0;
        
        // elbow (rotated by j2)
        const L1 = 1.15;
        const x1 = Math.sin(angles.j2 - Math.PI / 2) * cosJ1 * L1;
        const z1 = Math.sin(angles.j2 - Math.PI / 2) * sinJ1 * L1;
        const y1 = 0.45 - Math.cos(angles.j2 - Math.PI / 2) * L1;
        linePos[6] = x1 * 0.65; linePos[7] = y1 * 0.65; linePos[8] = z1 * 0.65;

        // wrist
        const L2 = 1.0;
        const x2 = x1 + Math.sin(angles.j2 + angles.j3 - Math.PI / 2) * cosJ1 * L2;
        const z2 = z1 + Math.sin(angles.j2 + angles.j3 - Math.PI / 2) * sinJ1 * L2;
        const y2 = y1 - Math.cos(angles.j2 + angles.j3 - Math.PI / 2) * L2;
        linePos[9] = x2 * 0.65; linePos[10] = y2 * 0.65; linePos[11] = z2 * 0.65;

        tfLinesRef.current.geometry.attributes.position.needsUpdate = true;
        tfLinesRef.current.computeLineDistances();
      }

      // 3. Draw bottom depth map canvas
      if (depthCanvasRef.current && activeTopics.cameras) {
        drawDepthMap(depthCanvasRef.current, t);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // ─── Resize Handler ───
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // ─── Cleanup ───
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isPlaying, activeTopics.cameras, connectionStatus]);

  // Handle visibility toggles from topic tree
  useEffect(() => {
    if (gridHelperRef.current) gridHelperRef.current.visible = activeTopics.grid;
    if (axesHelperRef.current) axesHelperRef.current.visible = activeTopics.tf;
    if (tfLinesRef.current) tfLinesRef.current.visible = activeTopics.tf;
    if (robotInstanceRef.current) {
      robotInstanceRef.current.group.visible = activeTopics.robot;
    }
  }, [activeTopics.grid, activeTopics.tf, activeTopics.robot]);

  // ─── Canvas Depth Map Painting Logic ───
  const drawDepthMap = (canvas, time) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#07090e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid Scanline Overlay
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.02)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < canvas.height; y += 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Retrieve joint trajectories
    const angles = getJointAnglesAtTime(time);

    // Base coordinates
    const x0 = canvas.width / 2;
    const y0 = canvas.height - 20;

    // Projection constants (scaling pixels)
    const L1 = 35;
    const L2 = 30;
    const L3 = 14;

    const cosJ1 = Math.cos(angles.j1);

    // 2D forward kinematics side-projection
    const angle2 = angles.j2 - Math.PI / 2;
    const x1 = x0 + L1 * Math.sin(angle2) * cosJ1;
    const y1 = y0 - L1 * Math.cos(angle2);

    const angle3 = angle2 + angles.j3;
    const x2 = x1 + L2 * Math.sin(angle3) * cosJ1;
    const y2 = y1 - L2 * Math.cos(angle3);

    const angle4 = angle3 + angles.j4;
    const x3 = x2 + L3 * Math.sin(angle4) * cosJ1;
    const y3 = y2 - L3 * Math.cos(angle4);

    // Draw mock workspace table/surface in background (farthest depth = low intensity blue)
    ctx.fillStyle = '#0a0d17';
    ctx.fillRect(0, y0, canvas.width, 20);
    ctx.strokeStyle = '#182038';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.lineTo(canvas.width, y0);
    ctx.stroke();

    // Draw a coffee espresso machine skeleton in background
    ctx.fillStyle = 'rgba(10, 15, 30, 0.4)';
    ctx.fillRect(45, 50, 45, 75);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.strokeRect(45, 50, 45, 75);

    // Color gradient mapping based on Depth Z (Near = Yellow, Far = Blue)
    const getDepthColor = (z) => {
      // z range from 0 (farthest, blue) to 1 (closest, yellow)
      const hue = 230 - z * 170; // maps from HSL 230 (blue) to 60 (yellow)
      return `hsl(${hue}, 95%, 48%)`;
    };

    // Calculate approximate depth coordinates (incorporating rotation of turntable)
    const zBase = 0.35 + Math.sin(angles.j1) * 0.05;
    const z1 = 0.5 + Math.sin(angles.j1 + angles.j2) * 0.2;
    const z2 = 0.65 + Math.sin(angles.j1 + angles.j2 + angles.j3) * 0.25;
    const z3 = 0.8 + Math.sin(angles.j1 + angles.j2 + angles.j3 + angles.j4) * 0.3;

    // Draw Link 1 (Shoulder to Elbow)
    const grad1 = ctx.createLinearGradient(x0, y0, x1, y1);
    grad1.addColorStop(0, getDepthColor(zBase));
    grad1.addColorStop(1, getDepthColor(z1));
    ctx.strokeStyle = grad1;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    // Draw Link 2 (Elbow to Wrist)
    const grad2 = ctx.createLinearGradient(x1, y1, x2, y2);
    grad2.addColorStop(0, getDepthColor(z1));
    grad2.addColorStop(1, getDepthColor(z2));
    ctx.strokeStyle = grad2;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw Link 3 (Wrist to Gripper)
    const grad3 = ctx.createLinearGradient(x2, y2, x3, y3);
    grad3.addColorStop(0, getDepthColor(z2));
    grad3.addColorStop(1, getDepthColor(z3));
    ctx.strokeStyle = grad3;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();

    // Draw Joint Hubs
    // Turntable Base
    ctx.fillStyle = getDepthColor(zBase);
    ctx.beginPath();
    ctx.arc(x0, y0, 9, 0, Math.PI * 2);
    ctx.fill();

    // Shoulder/Elbow
    ctx.fillStyle = getDepthColor(z1);
    ctx.beginPath();
    ctx.arc(x1, y1, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Wrist
    ctx.fillStyle = getDepthColor(z2);
    ctx.beginPath();
    ctx.arc(x2, y2, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Gripper Tip
    ctx.fillStyle = getDepthColor(z3);
    ctx.beginPath();
    ctx.arc(x3, y3, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw Starbucks paper cup target
    const cupX = canvas.width - 65;
    const cupY = y0 - 8;
    const distToCup = Math.hypot(x3 - cupX, y3 - cupY);
    const isGripping = distToCup < 16;
    ctx.fillStyle = isGripping ? '#e07a5f' : '#006241'; // changes depth-color signature when interacting
    ctx.fillRect(cupX - 5, cupY, 10, 10);
  };

  const handleReconnect = () => {
    setConnectionStatus('connecting');
    addLog('SYSTEM', 'Attempting connection handshake to local rosbridge client...');
    setTimeout(() => {
      setConnectionStatus('connected');
      addLog('SYSTEM', 'Connection restored successfully. Subscribing to telemetry streams.');
    }, 1200);
  };

  const handleDisconnect = () => {
    setConnectionStatus('disconnected');
    addLog('SYSTEM', 'Disconnected from local rosbridge websocket server.');
  };

  // Playback Control Handlers
  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
    addLog('SYSTEM', isPlaying ? 'Playback paused' : `Playback resumed (speed ${playbackSpeed}x)`);
  };

  const handleStepBack = () => {
    currentTimeRef.current = Math.max(currentTimeRef.current - 0.1, 0);
    setCurrentTime(currentTimeRef.current);
    addLog('SYSTEM', 'Stepped playback backward by 100ms');
  };

  const handleStepForward = () => {
    currentTimeRef.current = Math.min(currentTimeRef.current + 0.1, 28.5);
    setCurrentTime(currentTimeRef.current);
    addLog('SYSTEM', 'Stepped playback forward by 100ms');
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    playbackSpeedRef.current = speed;
    addLog('SYSTEM', `Playback speed set to ${speed}x`);
  };

  // Topic tree toggle handler
  const toggleTopic = (key) => {
    setActiveTopics(prev => ({ ...prev, [key]: !prev[key] }));
    addLog('TOPICS', `Display toggled: ${key} -> ${!activeTopics[key]}`);
  };

  // Current values mapping for the sidebar telemetry frame details
  const currentJoints = getJointAnglesAtTime(currentTime);
  const currentVels = getJointVelocitiesAtTime(currentTime);

  return (
    <div className="rviz-workspace">
      {/* ─── Top Control Bar (Replica of Foxglove header) ─── */}
      <div className="rviz-control-bar">
        <div className="rviz-logo" onClick={() => setSelectedTopic('robot')}>
          <img src="/logo.png" alt="RaaS Logo" className="rviz-logo-img" />
          <span>RaaS Platform</span>
          <span className="layout-badge">example-017-droid-ds.mcap</span>
        </div>

        <div className="rviz-action-buttons">
          <button 
            className={`rviz-btn ${isPlaying ? 'active' : ''}`}
            onClick={handlePlayPause}
            title={isPlaying ? 'Pause simulation stream' : 'Resume simulation stream'}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          
          <button 
            className="rviz-btn"
            onClick={() => {
              currentTimeRef.current = 0.0;
              setCurrentTime(0.0);
              addLog('SYSTEM', 'Timeline reset to 0.0s');
            }}
          >
            <RefreshCw size={14} />
            <span>Reset</span>
          </button>
        </div>

        <div className="rviz-connection">
          <span className={`connection-dot ${connectionStatus}`}></span>
          <span className="connection-url">ws://localhost:9090</span>
          {connectionStatus === 'disconnected' ? (
            <button className="reconnect-btn" onClick={handleReconnect}>Connect</button>
          ) : connectionStatus === 'connecting' ? (
            <span className="connecting-text">Connecting...</span>
          ) : (
            <button className="disconnect-btn" onClick={handleDisconnect}>Disconnect</button>
          )}
        </div>
      </div>

      {/* ─── Main Workspace Grid Layout ─── */}
      <div className="rviz-grid">
        
        {/* Left Display tree Sidebar */}
        <div className="rviz-panel rviz-sidebar-left">
          <div className="panel-tabs">
            <span className="tab active">Panel</span>
            <span className="tab">Topics</span>
            <span className="tab">Metadata</span>
          </div>

          <div className="display-tree-list">
            <div className="tree-group">
              <span className="tree-heading">3D Viewer Nodes</span>
              
              <div className="tree-item">
                <input 
                  type="checkbox" 
                  checked={activeTopics.grid} 
                  onChange={() => toggleTopic('grid')} 
                  id="chk-grid"
                />
                <label htmlFor="chk-grid" className={`item-label ${activeTopics.grid ? 'enabled' : ''}`}>Grid Floor</label>
              </div>

              <div className="tree-item">
                <input 
                  type="checkbox" 
                  checked={activeTopics.tf} 
                  onChange={() => toggleTopic('tf')} 
                  id="chk-tf"
                />
                <label htmlFor="chk-tf" className={`item-label ${activeTopics.tf ? 'enabled' : ''}`}>TF Origin Axes</label>
              </div>

              <div className="tree-item">
                <input 
                  type="checkbox" 
                  checked={activeTopics.robot} 
                  onChange={() => toggleTopic('robot')} 
                  id="chk-robot"
                />
                <label 
                  htmlFor="chk-robot" 
                  className={`item-label ${activeTopics.robot ? 'enabled' : ''}`}
                  onClick={() => setSelectedTopic('robot')}
                >
                  6-DOF Robot Arm
                </label>
              </div>
            </div>

            <div className="tree-group" style={{ marginTop: '18px' }}>
              <span className="tree-heading">Diagnostics Panels</span>
              
              <div className="tree-item">
                <input 
                  type="checkbox" 
                  checked={activeTopics.cameras} 
                  onChange={() => toggleTopic('cameras')} 
                  id="chk-cams"
                />
                <label 
                  htmlFor="chk-cams" 
                  className={`item-label ${activeTopics.cameras ? 'enabled' : ''}`}
                  onClick={() => setSelectedTopic('depth')}
                >
                  Depth Camera Grid
                </label>
              </div>

              <div className="tree-item">
                <input 
                  type="checkbox" 
                  checked={activeTopics.plots} 
                  onChange={() => toggleTopic('plots')} 
                  id="chk-plots"
                />
                <label 
                  htmlFor="chk-plots" 
                  className={`item-label ${activeTopics.plots ? 'enabled' : ''}`}
                  onClick={() => setSelectedTopic('plots')}
                >
                  Telemetry Plots
                </label>
              </div>
            </div>
          </div>

          <div className="sidebar-info-card">
            <div className="info-header">
              <Info size={13} style={{ color: 'var(--accent-cyan)' }} />
              <span>Workspace Inspector</span>
            </div>
            <p className="info-desc">
              Interact with the 3D scene: Left-click and drag to rotate, right-click to pan, and scroll to zoom. Double-click joints to highlight topics.
            </p>
          </div>
        </div>

        {/* Center Section: Split 3D Canvas (Top) & Depth Camera Feeds (Bottom) */}
        <div className="rviz-center-area">
          
          {/* Top Pane: 3D Viewport */}
          <div className="rviz-viewport-container">
            <div className="panel-header-overlay">
              <span className="panel-title-text">3D Viewer Panel</span>
              <span className="panel-topic-tag">/tf /joint_states</span>
            </div>
            <div ref={mountRef} className="rviz-canvas" />
          </div>

          {/* Bottom Pane: 3-Camera Grid (Only shows if toggled in Display Tree) */}
          {activeTopics.cameras && (
            <div className="rviz-cameras-grid">
              
              {/* Camera 1: Dynamic depth feed */}
              <div className="camera-box">
                <div className="camera-header">
                  <span className="camera-name">/depth_anything_v2/ext1/left</span>
                  <span className="camera-status active">15 Hz</span>
                </div>
                <div className="camera-canvas-wrapper">
                  <canvas ref={depthCanvasRef} width={220} height={120} className="camera-canvas" />
                </div>
              </div>

              {/* Camera 2: Waiting */}
              <div className="camera-box">
                <div className="camera-header">
                  <span className="camera-name">/depth_anything_v2/ext2/left</span>
                  <span className="camera-status idle">OFF</span>
                </div>
                <div className="camera-empty-state">
                  <span className="waiting-spinner"></span>
                  <span>Waiting for image messages...</span>
                </div>
              </div>

              {/* Camera 3: Waiting */}
              <div className="camera-box">
                <div className="camera-header">
                  <span className="camera-name">/depth_anything_v2/wrist/left</span>
                  <span className="camera-status idle">OFF</span>
                </div>
                <div className="camera-empty-state">
                  <span className="waiting-spinner"></span>
                  <span>Waiting for image messages...</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Sidebar: Telemetry Plots (Only shows if toggled in Display Tree) */}
        {activeTopics.plots ? (
          <div className="rviz-panel rviz-sidebar-right">
            <div className="sidebar-header-row">
              <h3>Telemetry Plots</h3>
              <Settings size={13} className="header-icon" />
            </div>

            <div className="plots-container">
              {/* Plot 1: Turntable Angle */}
              <div className="plot-card" onClick={() => setSelectedTopic('j1')}>
                <div className="plot-card-header">
                  <span className="plot-title">Plot - Turntable J1</span>
                  <div className="plot-actions">
                    <List size={11} />
                    <Maximize2 size={11} />
                  </div>
                </div>
                <div className="plot-canvas-area">
                  <div className="plot-y-labels">
                    <span>{plotData.j1.max.toFixed(1)}</span>
                    <span>0.0</span>
                    <span>{plotData.j1.min.toFixed(1)}</span>
                  </div>
                  <div className="svg-wrapper">
                    <svg viewBox={`0 0 ${plotDimensions.width} ${plotDimensions.height}`} width="100%" height="100%">
                      <path d={plotData.j1.path} fill="none" stroke="#3b82f6" strokeWidth="1.2" />
                      {/* Current Time cursor */}
                      <line 
                        x1={(currentTime / 28.5) * plotDimensions.width} 
                        y1="0" 
                        x2={(currentTime / 28.5) * plotDimensions.width} 
                        y2={plotDimensions.height} 
                        stroke="rgba(255, 255, 255, 0.45)" 
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                      />
                    </svg>
                  </div>
                </div>
                <div className="plot-footer">
                  <span className="topic-text">/joint_states/position[0]</span>
                  <span className="value-text">{currentJoints.j1.toFixed(2)} rad</span>
                </div>
              </div>

              {/* Plot 2: Shoulder Angle */}
              <div className="plot-card" onClick={() => setSelectedTopic('j2')}>
                <div className="plot-card-header">
                  <span className="plot-title">Plot - Shoulder J2</span>
                  <div className="plot-actions">
                    <List size={11} />
                    <Maximize2 size={11} />
                  </div>
                </div>
                <div className="plot-canvas-area">
                  <div className="plot-y-labels">
                    <span>{plotData.j2.max.toFixed(1)}</span>
                    <span>0.0</span>
                    <span>{plotData.j2.min.toFixed(1)}</span>
                  </div>
                  <div className="svg-wrapper">
                    <svg viewBox={`0 0 ${plotDimensions.width} ${plotDimensions.height}`} width="100%" height="100%">
                      <path d={plotData.j2.path} fill="none" stroke="#f97316" strokeWidth="1.2" />
                      <line 
                        x1={(currentTime / 28.5) * plotDimensions.width} 
                        y1="0" 
                        x2={(currentTime / 28.5) * plotDimensions.width} 
                        y2={plotDimensions.height} 
                        stroke="rgba(255, 255, 255, 0.45)" 
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                      />
                    </svg>
                  </div>
                </div>
                <div className="plot-footer">
                  <span className="topic-text">/joint_states/position[1]</span>
                  <span className="value-text">{currentJoints.j2.toFixed(2)} rad</span>
                </div>
              </div>

              {/* Plot 3: Elbow Angle */}
              <div className="plot-card" onClick={() => setSelectedTopic('j3')}>
                <div className="plot-card-header">
                  <span className="plot-title">Plot - Elbow J3</span>
                  <div className="plot-actions">
                    <List size={11} />
                    <Maximize2 size={11} />
                  </div>
                </div>
                <div className="plot-canvas-area">
                  <div className="plot-y-labels">
                    <span>{plotData.j3.max.toFixed(1)}</span>
                    <span>0.0</span>
                    <span>{plotData.j3.min.toFixed(1)}</span>
                  </div>
                  <div className="svg-wrapper">
                    <svg viewBox={`0 0 ${plotDimensions.width} ${plotDimensions.height}`} width="100%" height="100%">
                      <path d={plotData.j3.path} fill="none" stroke="#eab308" strokeWidth="1.2" />
                      <line 
                        x1={(currentTime / 28.5) * plotDimensions.width} 
                        y1="0" 
                        x2={(currentTime / 28.5) * plotDimensions.width} 
                        y2={plotDimensions.height} 
                        stroke="rgba(255, 255, 255, 0.45)" 
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                      />
                    </svg>
                  </div>
                </div>
                <div className="plot-footer">
                  <span className="topic-text">/joint_states/position[2]</span>
                  <span className="value-text">{currentJoints.j3.toFixed(2)} rad</span>
                </div>
              </div>

              {/* Plot 4: Wrist Pitch */}
              <div className="plot-card" onClick={() => setSelectedTopic('j4')}>
                <div className="plot-card-header">
                  <span className="plot-title">Plot - Wrist Pitch J4</span>
                  <div className="plot-actions">
                    <List size={11} />
                    <Maximize2 size={11} />
                  </div>
                </div>
                <div className="plot-canvas-area">
                  <div className="plot-y-labels">
                    <span>{plotData.j4.max.toFixed(1)}</span>
                    <span>0.0</span>
                    <span>{plotData.j4.min.toFixed(1)}</span>
                  </div>
                  <div className="svg-wrapper">
                    <svg viewBox={`0 0 ${plotDimensions.width} ${plotDimensions.height}`} width="100%" height="100%">
                      <path d={plotData.j4.path} fill="none" stroke="#22c55e" strokeWidth="1.2" />
                      <line 
                        x1={(currentTime / 28.5) * plotDimensions.width} 
                        y1="0" 
                        x2={(currentTime / 28.5) * plotDimensions.width} 
                        y2={plotDimensions.height} 
                        stroke="rgba(255, 255, 255, 0.45)" 
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                      />
                    </svg>
                  </div>
                </div>
                <div className="plot-footer">
                  <span className="topic-text">/joint_states/position[3]</span>
                  <span className="value-text">{currentJoints.j4.toFixed(2)} rad</span>
                </div>
              </div>

              {/* Plot 5: Wrist Roll */}
              <div className="plot-card" onClick={() => setSelectedTopic('j5')}>
                <div className="plot-card-header">
                  <span className="plot-title">Plot - Wrist Roll J5</span>
                  <div className="plot-actions">
                    <List size={11} />
                    <Maximize2 size={11} />
                  </div>
                </div>
                <div className="plot-canvas-area">
                  <div className="plot-y-labels">
                    <span>{plotData.j5.max.toFixed(1)}</span>
                    <span>0.0</span>
                    <span>{plotData.j5.min.toFixed(1)}</span>
                  </div>
                  <div className="svg-wrapper">
                    <svg viewBox={`0 0 ${plotDimensions.width} ${plotDimensions.height}`} width="100%" height="100%">
                      <path d={plotData.j5.path} fill="none" stroke="#ec4899" strokeWidth="1.2" />
                      <line 
                        x1={(currentTime / 28.5) * plotDimensions.width} 
                        y1="0" 
                        x2={(currentTime / 28.5) * plotDimensions.width} 
                        y2={plotDimensions.height} 
                        stroke="rgba(255, 255, 255, 0.45)" 
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                      />
                    </svg>
                  </div>
                </div>
                <div className="plot-footer">
                  <span className="topic-text">/joint_states/position[4]</span>
                  <span className="value-text">{currentJoints.j5.toFixed(2)} rad</span>
                </div>
              </div>

              {/* Plot 6: Gripper Offset */}
              <div className="plot-card" onClick={() => setSelectedTopic('j6')}>
                <div className="plot-card-header">
                  <span className="plot-title">Plot - Gripper J6</span>
                  <div className="plot-actions">
                    <List size={11} />
                    <Maximize2 size={11} />
                  </div>
                </div>
                <div className="plot-canvas-area">
                  <div className="plot-y-labels">
                    <span>{plotData.j6.max.toFixed(2)}</span>
                    <span>0.0</span>
                    <span>{plotData.j6.min.toFixed(2)}</span>
                  </div>
                  <div className="svg-wrapper">
                    <svg viewBox={`0 0 ${plotDimensions.width} ${plotDimensions.height}`} width="100%" height="100%">
                      <path d={plotData.j6.path} fill="none" stroke="#a855f7" strokeWidth="1.2" />
                      <line 
                        x1={(currentTime / 28.5) * plotDimensions.width} 
                        y1="0" 
                        x2={(currentTime / 28.5) * plotDimensions.width} 
                        y2={plotDimensions.height} 
                        stroke="rgba(255, 255, 255, 0.45)" 
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                      />
                    </svg>
                  </div>
                </div>
                <div className="plot-footer">
                  <span className="topic-text">/joint_states/position[5]</span>
                  <span className="value-text">{currentJoints.j6.toFixed(2)} m</span>
                </div>
              </div>

              {/* Plot 7: Total Velocity */}
              <div className="plot-card" onClick={() => setSelectedTopic('velocity')}>
                <div className="plot-card-header">
                  <span className="plot-title">Plot - Total Velocity</span>
                  <div className="plot-actions">
                    <List size={11} />
                    <Maximize2 size={11} />
                  </div>
                </div>
                <div className="plot-canvas-area">
                  <div className="plot-y-labels">
                    <span>{plotData.totalVelocity.max.toFixed(2)}</span>
                    <span>0.0</span>
                    <span>{plotData.totalVelocity.min.toFixed(2)}</span>
                  </div>
                  <div className="svg-wrapper">
                    <svg viewBox={`0 0 ${plotDimensions.width} ${plotDimensions.height}`} width="100%" height="100%">
                      <path d={plotData.totalVelocity.path} fill="none" stroke="#ef4444" strokeWidth="1.2" />
                      <line 
                        x1={(currentTime / 28.5) * plotDimensions.width} 
                        y1="0" 
                        x2={(currentTime / 28.5) * plotDimensions.width} 
                        y2={plotDimensions.height} 
                        stroke="rgba(255, 255, 255, 0.45)" 
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                      />
                    </svg>
                  </div>
                </div>
                <div className="plot-footer">
                  <span className="topic-text">/joint_states/velocity_sum</span>
                  <span className="value-text">{currentVels.total.toFixed(2)} rad/s</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Inspect details fallback when plots are hidden */
          <div className="rviz-panel rviz-sidebar-right">
            <h3>TF Frames</h3>
            <div className="properties-list">
              <div className="prop-group">
                <span className="prop-heading">base_link -> link_1</span>
                <div className="prop-item">
                  <span className="prop-label">Translation</span>
                  <span className="prop-value">X: 0.00, Y: 0.45, Z: 0.00</span>
                </div>
                <div className="prop-item">
                  <span className="prop-label">Rotation</span>
                  <span className="prop-value">Yaw: {(currentJoints.j1 * 180 / Math.PI).toFixed(1)}°</span>
                </div>
              </div>
              
              <div className="prop-group" style={{ marginTop: '16px' }}>
                <span className="prop-heading">link_1 -> link_2</span>
                <div className="prop-item">
                  <span className="prop-label">Rotation Pitch</span>
                  <span className="prop-value">{(currentJoints.j2 * 180 / Math.PI).toFixed(1)}°</span>
                </div>
              </div>

              <div className="prop-group" style={{ marginTop: '16px' }}>
                <span className="prop-heading">link_2 -> link_3</span>
                <div className="prop-item">
                  <span className="prop-label">Rotation Pitch</span>
                  <span className="prop-value">{(currentJoints.j3 * 180 / Math.PI).toFixed(1)}°</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ─── Bottom Console Logs (Collapsible/Diagnostics) ─── */}
      <div className="rviz-diagnostics-console">
        <div className="console-header">
          <div className="console-header-left">
            <span>Diagnostics Console</span>
            <span className="topic-indicator">● 5 active nodes</span>
          </div>
          <div className="console-actions">
            <span>{selectedTopic === 'robot' ? 'Target: 6-DOF manipulator' : `Target: Topic /${selectedTopic}`}</span>
          </div>
        </div>
        <div className="console-logs">
          {logs.map((log, index) => (
            <div key={index} className="log-row">
              <span className="log-time">[{log.time}]</span>
              <span className={`log-source ${log.source.toLowerCase()}`}>{log.source}</span>
              <span className="log-msg">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Playback Timeline Bar (Foxglove-style bottom tray) ─── */}
      <div className="rviz-timeline-bar">
        
        {/* Playback action items */}
        <div className="timeline-controls-left">
          <button className="timeline-btn" onClick={handleStepBack} title="Step back 100ms">
            <SkipBack size={14} />
          </button>
          
          <button className="timeline-play-btn" onClick={handlePlayPause}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <button className="timeline-btn" onClick={handleStepForward} title="Step forward 100ms">
            <SkipForward size={14} />
          </button>

          <div className="playback-speed-select">
            <span className="speed-val">{playbackSpeed}x</span>
            <ChevronDown size={10} className="select-arrow" />
            <div className="speed-dropdown">
              <div className="speed-option" onClick={() => handleSpeedChange(0.1)}>0.1x</div>
              <div className="speed-option" onClick={() => handleSpeedChange(0.5)}>0.5x</div>
              <div className="speed-option" onClick={() => handleSpeedChange(1.0)}>1.0x</div>
              <div className="speed-option" onClick={() => handleSpeedChange(2.0)}>2.0x</div>
            </div>
          </div>
        </div>

        {/* Progress Slider */}
        <div className="timeline-slider-container">
          <input 
            type="range"
            min="0.0"
            max="28.5"
            step="0.05"
            value={currentTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              currentTimeRef.current = val;
              setCurrentTime(val);
              addLog('SYSTEM', `Seeking timeline to ${val.toFixed(2)}s`);
            }}
            className="timeline-slider"
          />
          <div className="slider-labels">
            <span className="slider-start-label">0.0s</span>
            <span className="slider-end-label">28.5s</span>
          </div>
        </div>

        {/* Audio mute & formatted running timestamp */}
        <div className="timeline-controls-right">
          <button className="timeline-btn" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <div className="timestamp-display">
            {formattedTimestamp}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RvizView;
