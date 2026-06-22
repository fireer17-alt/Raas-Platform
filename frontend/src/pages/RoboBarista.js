import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

import { RobotArm } from '../components/barista/RobotArm.js';
import { CafeEnvironment } from '../components/barista/CafeEnvironment.js';
import { audio } from '../components/barista/AudioEngine.js';

import './RoboBarista.css';

const RoboBarista = () => {
  const mountRef = useRef(null);
  
  // High-frequency telemetry DOM refs to bypass React render bottleneck
  const tempReadoutRef = useRef(null);
  const pressReadoutRef = useRef(null);
  const processReadoutRef = useRef(null);
  const sysStatusRef = useRef(null);
  
  const diagTempRef = useRef(null);
  const diagHeaterRef = useRef(null);
  const diagWaterRef = useRef(null);
  const diagGrinderRef = useRef(null);
  
  const diagTempBarRef = useRef(null);
  const diagHeaterBarRef = useRef(null);
  const diagWaterBarRef = useRef(null);
  const diagGrinderBarRef = useRef(null);

  const consoleLogRef = useRef(null);

  // Joint sliders refs
  const jointSliderRefs = {
    j1: useRef(null), j2: useRef(null), j3: useRef(null),
    j4: useRef(null), j5: useRef(null), j6: useRef(null)
  };
  const jointValRefs = {
    j1: useRef(null), j2: useRef(null), j3: useRef(null),
    j4: useRef(null), j5: useRef(null), j6: useRef(null)
  };

  // React State for interactive configurations
  const [activeTab, setActiveTab] = useState('menu');
  const [activeCoffee, setActiveCoffee] = useState('Espresso');
  const [activeBean, setActiveBean] = useState('Arabica');
  const [activeMilk, setActiveMilk] = useState('Whole');
  const [sweetness, setSweetness] = useState(0);
  const [extraShot, setExtraShot] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(100);
  const [soundOn, setSoundOn] = useState(false);
  const [lightingTheme, setLightingTheme] = useState('cyberpunk');
  const [loading, setLoading] = useState(true);
  const [brewingActive, setBrewingActive] = useState(false);

  // Nutrition calculations
  const [nutrition, setNutrition] = useState({ caffeine: 80, calories: 5, time: 12 });

  // Scene references
  const sceneRef = useRef(null);
  const robotRef = useRef(null);
  const envRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);
  const labelRendererRef = useRef(null);
  const requestRef = useRef(null);
  
  // State machine logic trackers
  const machineStateRef = useRef('idle'); // idle | reach_cup | grab_cup ...
  const stateTimerRef = useRef(0);
  const fillProgressRef = useRef(0.0);
  const idleTimeRef = useRef(0);
  const clockRef = useRef(null);
  const confettiBurstsRef = useRef([]);

  // Dynamic values
  const telemetryRefs = useRef({
    boilerTemp: 93.4,
    pressure: 0.0,
    waterReservoir: 92.0,
    heaterPower: 12,
    servoTemp: 42.5,
    grinderWear: 14.8
  });

  // Calculate nutrition changes
  useEffect(() => {
    let caffeine = 80;
    let calories = 5;
    let time = 12;

    if (activeCoffee === 'Americano') {
      time = 14;
    } else if (activeCoffee === 'Latte') {
      calories = 120;
      time = 18;
      if (activeMilk === 'Oat') calories = 90;
      if (activeMilk === 'Almond') calories = 55;
    } else if (activeCoffee === 'Cappuccino') {
      calories = 100;
      time = 20;
      if (activeMilk === 'Oat') calories = 75;
      if (activeMilk === 'Almond') calories = 45;
    }

    if (activeBean === 'Cyber') {
      caffeine = 160;
    } else if (activeBean === 'Robusta') {
      caffeine = 110;
    }

    if (extraShot) {
      caffeine += 75;
      calories += 5;
      time += 4;
    }

    calories += Math.round(sweetness * 0.45);

    setNutrition({ caffeine, calories, time });
  }, [activeCoffee, activeBean, activeMilk, sweetness, extraShot]);

  // Terminal logging helper
  const addLog = (message, type = 'sys') => {
    if (!consoleLogRef.current) return;
    const p = document.createElement('p');
    p.className = type;
    const time = new Date().toLocaleTimeString().split(' ')[0];
    p.textContent = `[${time}] ${message}`;
    consoleLogRef.current.appendChild(p);
    consoleLogRef.current.scrollTop = consoleLogRef.current.scrollHeight;
  };

  // Clean log console
  const clearConsole = () => {
    audio.playClick();
    if (consoleLogRef.current) consoleLogRef.current.innerHTML = '';
  };

  // Start brew workflow
  const startOrder = () => {
    if (machineStateRef.current !== 'idle') return;
    audio.init();
    audio.resume();

    // Reset liquid and telemetry
    envRef.current.emptyCup();
    fillProgressRef.current = 0.0;
    telemetryRefs.current.waterReservoir = 98.0;
    
    // Increment grinder wear
    telemetryRefs.current.grinderWear = Math.min(100.0, telemetryRefs.current.grinderWear + 0.02);
    if (diagGrinderRef.current) diagGrinderRef.current.textContent = `${telemetryRefs.current.grinderWear.toFixed(1)}%`;
    if (diagGrinderBarRef.current) diagGrinderBarRef.current.style.width = `${telemetryRefs.current.grinderWear}%`;

    // Engage locks
    setBrewingActive(true);
    machineStateRef.current = 'reach_cup';
    stateTimerRef.current = 0;

    robotRef.current.setLEDColor(0xffaa44);
    addLog(`New order: ${activeCoffee} (${activeBean} beans, ${activeMilk} milk). Brewing started.`, 'info');
  };

  // Toggle override
  const handleOverrideToggle = (e) => {
    audio.playClick();
    const enabled = e.target.checked;
    setManualOverride(enabled);
    
    robotRef.current.setManualOverride(enabled);

    if (enabled) {
      addLog('[WARNING] Manual control override engaged. Auto-sequencing disabled.', 'warning');
      if (sysStatusRef.current) {
        sysStatusRef.current.textContent = 'MANUAL OVERRIDE';
        sysStatusRef.current.className = 'val status-active';
      }
    } else {
      addLog('[INFO] Manual control disengaged. Resuming automatic sensor feedback.', 'info');
      if (sysStatusRef.current) {
        sysStatusRef.current.textContent = 'STANDBY';
        sysStatusRef.current.className = 'val status-idle';
      }
      syncSlidersToRobot();
    }
  };

  // Joint slider changes
  const handleJointChange = (joint, e) => {
    const val = parseFloat(e.target.value);
    let finalRad = val;

    if (joint === 'j6') {
      if (jointValRefs[joint].current) jointValRefs[joint].current.textContent = `${Math.round(val)}%`;
      finalRad = 0.1 + (val / 100) * 0.3;
    } else {
      if (jointValRefs[joint].current) jointValRefs[joint].current.textContent = `${val.toFixed(1)}°`;
      finalRad = val * Math.PI / 180;
    }

    robotRef.current.setJoint(joint, finalRad);

    // Feed slider movement speed back to audio servo whine
    audio.init();
    audio.resume();
    audio.updateServos(0.12);
    setTimeout(() => audio.updateServos(0), 100);
  };

  // Apply Poses
  const triggerPose = (pose) => {
    audio.playClick();
    robotRef.current.setPose(pose);
    syncSlidersToRobot();
    addLog(`[INFO] Robot arm command: Move to ${pose.toUpperCase()} pose.`, 'info');
  };

  const syncSlidersToRobot = () => {
    for (const key in jointSliderRefs) {
      const slider = jointSliderRefs[key].current;
      if (!slider) continue;

      const radVal = robotRef.current.joints[key];
      if (key === 'j6') {
        const pct = Math.max(0, Math.min(100, ((radVal - 0.1) / 0.3) * 100));
        slider.value = pct;
        if (jointValRefs[key].current) jointValRefs[key].current.textContent = `${Math.round(pct)}%`;
      } else {
        const deg = radVal * 180 / Math.PI;
        slider.value = deg;
        if (jointValRefs[key].current) jointValRefs[key].current.textContent = `${deg.toFixed(1)}°`;
      }
    }
  };

  // Sound Toggle
  const handleSoundToggle = () => {
    const active = audio.toggleSound();
    setSoundOn(active);
    audio.playClick();
  };

  // Theme Toggle
  const handleThemeToggle = () => {
    audio.playClick();
    const nextTheme = lightingTheme === 'cyberpunk' ? 'warm' : 'cyberpunk';
    setLightingTheme(nextTheme);

    const scene = sceneRef.current;
    if (nextTheme === 'warm') {
      scene.background.setHex(0x0e0906);
      scene.fog.color.setHex(0x0e0906);
      addLog('Lighting theme changed to: Warm Industrial.', 'info');
    } else {
      scene.background.setHex(0x05060b);
      scene.fog.color.setHex(0x05060b);
      addLog('Lighting theme changed to: Neon Cyberpunk.', 'info');
    }
  };

  // Confetti helper
  const spawnConfetti = (position) => {
    const pCount = 30;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(pCount * 3);
    const colors = new Float32Array(pCount * 3);
    const velocities = [];

    const colorChoices = [
      new THREE.Color(0xffaa44),
      new THREE.Color(0x5fe1ff),
      new THREE.Color(0x4ff3a6),
      new THREE.Color(0xffdfb3)
    ];

    for (let i = 0; i < pCount; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y + 0.2;
      positions[i * 3 + 2] = position.z;

      const col = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      const theta = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.2;
      velocities.push(new THREE.Vector3(
        Math.cos(theta) * speed,
        1.5 + Math.random() * 2.0,
        Math.sin(theta) * speed
      ));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    sceneRef.current.add(points);

    confettiBurstsRef.current.push({
      mesh: points,
      vels: velocities,
      life: 0,
      maxLife: 1.5
    });
  };

  // Main 3D Mounting Effect
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Setup Scene, Fog, Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05060b);
    scene.fog = new THREE.FogExp2(0x05060b, 0.045);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(7.5, 4.5, 9.0);

    // 2. Setup Renderers
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    // 3. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3.5;
    controls.maxDistance = 18;
    controls.target.set(0, 1.3, 0);
    controls.minPolarAngle = 0.1;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controlsRef.current = controls;

    const stopAutoRotate = () => {
      controls.autoRotate = false;
      idleTimeRef.current = 0;
    };
    renderer.domElement.addEventListener('pointerdown', stopAutoRotate);
    renderer.domElement.addEventListener('wheel', stopAutoRotate);

    // 4. Lights
    const ambient = new THREE.AmbientLight(0x1a243d, 0.6);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 1.0);
    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 512;
    keyLight.shadow.mapSize.height = 512;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x769eff, 0.4);
    fillLight.position.set(-5, 4, -2);
    scene.add(fillLight);

    // Under-glow spotlights on the counter
    const neonAccent = new THREE.PointLight(0x5fe1ff, 0.7, 8, 2);
    neonAccent.position.set(-1.8, 1.25, 0.8);
    scene.add(neonAccent);

    // 5. Instantiation
    const robot = new RobotArm();
    scene.add(robot.group);
    robotRef.current = robot;

    const env = new CafeEnvironment(scene);
    envRef.current = env;

    setLoading(false);
    clockRef.current = new THREE.Clock();
    addLog('RaaS Autonomous Barista initialized.', 'success');

    // 6. Animation ticker
    const tick = () => {
      const dt = Math.min(clockRef.current.getDelta(), 0.05);
      stateTimerRef.current += dt;
      idleTimeRef.current += dt;

      // 1. Robot update
      robot.update(dt);

      // 2. Automatics workflow execution
      if (!robot.manualMode) {
        executeStateChoreography(dt);
      }

      // 3. Environment updates
      env.update(dt, machineStateRef.current, activeCoffee, {
        fillProgress: fillProgressRef.current
      });

      // 4. Update HUD panel numbers
      updateTelemetryDOM(dt);

      // 5. Update confetti particles
      updateConfetti(dt);

      // Orbit controls
      if (!controls.autoRotate && idleTimeRef.current > 6.0) {
        controls.autoRotate = true;
      }
      controls.update();

      // Render frames
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);

      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      labelRenderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup mounting hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
      
      // Stop all sounds
      audio.stopGrinder();
      audio.stopPump();
      audio.stopSteam();
      
      // Mute audio Context
      if (audio.enabled) audio.toggleSound();

      // Dispose geometries & materials
      robot.group.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });

      env.cupGroup.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });

      renderer.dispose();
      container.innerHTML = '';
    };
  }, [activeCoffee, activeBean, activeMilk]);

  // State Machine Choreography Loop
  const executeStateChoreography = (dt) => {
    const toRad = Math.PI / 180;
    const robot = robotRef.current;
    const env = envRef.current;
    
    switch (machineStateRef.current) {
      case 'idle':
        robot.setLEDColor(0x5fe1ff);
        break;

      case 'reach_cup':
        robot.setTargets({
          j1: -36 * toRad,
          j2: 24 * toRad,
          j3: -42 * toRad,
          j4: 18 * toRad,
          j5: -35 * toRad,
          j6: 0.35
        });

        if (stateTimerRef.current > 1.4) {
          machineStateRef.current = 'grab_cup';
          stateTimerRef.current = 0;
          addLog('Engaging gripper stack clamp.', 'sys');
        }
        break;

      case 'grab_cup':
        robot.setTargets({ j6: 0.12 });

        if (stateTimerRef.current > 0.6) {
          env.setCupLocation('robot', robot);
          machineStateRef.current = 'lift_cup';
          stateTimerRef.current = 0;
          addLog('Cup clamped. Lifting stack.', 'sys');
        }
        break;

      case 'lift_cup':
        robot.setTargets({
          j2: 8 * toRad,
          j3: -20 * toRad,
          j4: 10 * toRad
        });

        if (stateTimerRef.current > 1.0) {
          machineStateRef.current = 'place_cup';
          stateTimerRef.current = 0;
          addLog('Transporting cup to brewing bay.', 'sys');
        }
        break;

      case 'place_cup':
        robot.setTargets({
          j1: 53 * toRad,
          j2: 44 * toRad,
          j3: -65 * toRad,
          j4: 21 * toRad,
          j5: 0
        });

        if (stateTimerRef.current > 1.6) {
          env.setCupLocation('spout', robot);
          machineStateRef.current = 'release_cup';
          stateTimerRef.current = 0;
          addLog('Cup aligned. Releasing gripper clamping.', 'sys');
        }
        break;

      case 'release_cup':
        robot.setTargets({
          j1: 35 * toRad,
          j6: 0.35
        });

        if (stateTimerRef.current > 0.9) {
          machineStateRef.current = 'grind';
          stateTimerRef.current = 0;
          addLog('Grinding custom beans...', 'info');
          audio.startGrinder();
        }
        break;

      case 'grind':
        if (stateTimerRef.current > 2.5) {
          audio.stopGrinder();
          machineStateRef.current = 'brew';
          stateTimerRef.current = 0;
          addLog('Pre-heating boiler infusion chamber.', 'info');
        }
        break;

      case 'brew':
        if (stateTimerRef.current > 1.5) {
          machineStateRef.current = 'pour';
          stateTimerRef.current = 0;
          addLog('Extracting espresso shot.', 'info');
          audio.startPump();
        }
        break;

      case 'pour':
        fillProgressRef.current = Math.min(1.0, stateTimerRef.current / 5.2);
        
        if (stateTimerRef.current > 5.5) {
          audio.stopPump();
          
          if (activeCoffee === 'Latte' || activeCoffee === 'Cappuccino') {
            machineStateRef.current = 'froth';
            stateTimerRef.current = 0;
            addLog('Steaming microfoam milk.', 'info');
            audio.startSteam();
          } else {
            machineStateRef.current = 'retrieve_cup_reach';
            stateTimerRef.current = 0;
            addLog('Moving robot to retrieve cup.', 'sys');
          }
        }
        break;

      case 'froth':
        fillProgressRef.current = 1.0;

        if (stateTimerRef.current > 3.0) {
          audio.stopSteam();
          machineStateRef.current = 'retrieve_cup_reach';
          stateTimerRef.current = 0;
          addLog('Steaming complete. Retrieving cup.', 'sys');
        }
        break;

      case 'retrieve_cup_reach':
        robot.setTargets({
          j1: 53 * toRad,
          j2: 44 * toRad,
          j3: -65 * toRad,
          j4: 21 * toRad,
          j5: 0,
          j6: 0.35
        });

        if (stateTimerRef.current > 1.2) {
          machineStateRef.current = 'retrieve_cup_grab';
          stateTimerRef.current = 0;
        }
        break;

      case 'retrieve_cup_grab':
        robot.setTargets({ j6: 0.12 });

        if (stateTimerRef.current > 0.6) {
          env.setCupLocation('robot', robot);
          machineStateRef.current = 'retrieve_cup_lift';
          stateTimerRef.current = 0;
          addLog('Cup clamped. Lifting.', 'sys');
        }
        break;

      case 'retrieve_cup_lift':
        robot.setTargets({
          j2: 15 * toRad,
          j3: -30 * toRad,
          j4: 12 * toRad
        });

        if (stateTimerRef.current > 0.9) {
          machineStateRef.current = 'present_cup';
          stateTimerRef.current = 0;
          addLog('Transporting coffee to serving area.', 'sys');
        }
        break;

      case 'present_cup':
        robot.setTargets({
          j1: -15 * toRad,
          j2: 36 * toRad,
          j3: -38 * toRad,
          j4: 2 * toRad,
          j5: 0
        });

        if (stateTimerRef.current > 1.6) {
          machineStateRef.current = 'present_wait';
          stateTimerRef.current = 0;
          robot.setLEDColor(0x4ff3a6); // complete green
          addLog(`SUCCESS: ${activeCoffee} ready!`, 'success');
          
          audio.playChime();
          const cupWorldPos = new THREE.Vector3();
          env.cupGroup.getWorldPosition(cupWorldPos);
          spawnConfetti(cupWorldPos);
        }
        break;

      case 'present_wait':
        if (stateTimerRef.current > 4.5) {
          machineStateRef.current = 'take_cup';
          stateTimerRef.current = 0;
          addLog('Customer retrieved drink.', 'info');
        }
        break;

      case 'take_cup':
        env.setCupLocation('serve', robot);
        
        robot.setTargets({
          j2: 12 * toRad,
          j3: -15 * toRad,
          j6: 0.35
        });

        env.cupGroup.visible = false;

        if (stateTimerRef.current > 1.0) {
          machineStateRef.current = 'return_home';
          stateTimerRef.current = 0;
        }
        break;

      case 'return_home':
        robot.setTargets({
          j1: 0,
          j2: 12 * toRad,
          j3: -10 * toRad,
          j4: 8 * toRad,
          j5: 0,
          j6: 0.12
        });

        if (stateTimerRef.current > 1.5) {
          env.setCupLocation('rack', robot);
          env.cupGroup.visible = true;
          env.emptyCup();

          machineStateRef.current = 'idle';
          stateTimerRef.current = 0;
          
          setBrewingActive(false);
          addLog('Barista system returned to STANDBY.', 'success');
        }
        break;
      
      default:
        break;
    }
  };

  // High-frequency telemetry updates directly via textContent
  const updateTelemetryDOM = (dt) => {
    const t = performance.now() * 0.001;
    const robot = robotRef.current;
    const systemState = machineStateRef.current;

    // 1. Temperature Simulation
    let nextTemp = telemetryRefs.current.boilerTemp;
    let nextPower = telemetryRefs.current.heaterPower;
    if (systemState === 'brew' || systemState === 'pour') {
      nextTemp = 94.5 + Math.sin(t * 12) * 0.4;
      nextPower = Math.round(78 + Math.sin(t * 8) * 10);
    } else if (systemState === 'idle') {
      nextTemp = 93.4 + Math.sin(t * 0.3) * 0.15;
      nextPower = Math.round(12 + Math.sin(t * 0.2) * 2);
    } else {
      nextTemp = 93.0 + Math.sin(t * 2) * 0.35;
      nextPower = Math.round(35 + Math.sin(t) * 5);
    }
    telemetryRefs.current.boilerTemp = nextTemp;
    telemetryRefs.current.heaterPower = nextPower;

    if (tempReadoutRef.current) tempReadoutRef.current.textContent = `${nextTemp.toFixed(1)} °C`;
    if (diagHeaterRef.current) diagHeaterRef.current.textContent = `${nextPower}%`;
    if (diagHeaterBarRef.current) diagHeaterBarRef.current.style.width = `${nextPower}%`;

    // 2. Pressure Simulation
    let nextPress = telemetryRefs.current.pressure;
    if (systemState === 'pour') {
      nextPress = THREE.MathUtils.lerp(nextPress, 9.2 + Math.sin(t * 18) * 0.12, 0.08);
    } else {
      nextPress = THREE.MathUtils.lerp(nextPress, 0.0, 0.15);
    }
    telemetryRefs.current.pressure = nextPress;
    if (pressReadoutRef.current) pressReadoutRef.current.textContent = `${nextPress.toFixed(1)} bar`;

    // 3. Water reservoir
    if (systemState === 'pour') {
      telemetryRefs.current.waterReservoir = Math.max(20.0, telemetryRefs.current.waterReservoir - dt * 0.55);
      if (diagWaterRef.current) diagWaterRef.current.textContent = `${Math.round(telemetryRefs.current.waterReservoir)}%`;
      if (diagWaterBarRef.current) diagWaterBarRef.current.style.width = `${telemetryRefs.current.waterReservoir}%`;
    }

    // 4. Servo Core heating
    let nextServoTemp = telemetryRefs.current.servoTemp;
    if (robot.totalVelocity > 0.01) {
      nextServoTemp = Math.min(85.0, nextServoTemp + dt * robot.totalVelocity * 0.04);
    } else {
      nextServoTemp = Math.max(38.0, nextServoTemp - dt * 0.05);
    }
    telemetryRefs.current.servoTemp = nextServoTemp;
    if (diagTempRef.current) diagTempRef.current.textContent = `${nextServoTemp.toFixed(1)} °C`;
    if (diagTempBarRef.current) diagTempBarRef.current.style.width = `${(nextServoTemp / 85) * 100}%`;

    // 5. System Readout Labels
    if (processReadoutRef.current) processReadoutRef.current.textContent = systemState.toUpperCase();
    if (sysStatusRef.current) {
      if (systemState === 'idle') {
        sysStatusRef.current.textContent = 'STANDBY';
        sysStatusRef.current.className = 'val status-idle';
      } else if (systemState === 'present_wait') {
        sysStatusRef.current.textContent = 'READY TO SERVE';
        sysStatusRef.current.className = 'val status-ready';
      } else {
        sysStatusRef.current.textContent = 'ACTIVE';
        sysStatusRef.current.className = 'val status-active';
      }
    }

    // 6. Joint slider synchronizer labels (under auto mode)
    if (!manualOverride) {
      for (const key in jointSliderRefs) {
        const slider = jointSliderRefs[key].current;
        if (!slider) continue;

        const radVal = robot.joints[key];
        if (key === 'j6') {
          const pct = Math.max(0, Math.min(100, ((radVal - 0.1) / 0.3) * 100));
          slider.value = pct;
          if (jointValRefs[key].current) jointValRefs[key].current.textContent = `${Math.round(pct)}%`;
        } else {
          const deg = radVal * 180 / Math.PI;
          slider.value = deg;
          if (jointValRefs[key].current) jointValRefs[key].current.textContent = `${deg.toFixed(1)}°`;
        }
      }
    }
  };

  // Confetti physics updates
  const updateConfetti = (dt) => {
    const bursts = confettiBurstsRef.current;
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.life += dt;
      
      if (b.life >= b.maxLife) {
        sceneRef.current.remove(b.mesh);
        b.mesh.geometry.dispose();
        b.mesh.material.dispose();
        bursts.splice(i, 1);
      } else {
        const positions = b.mesh.geometry.attributes.position.array;
        for (let j = 0; j < b.vels.length; j++) {
          b.vels[j].y -= 3.8 * dt;
          positions[j * 3] += b.vels[j].x * dt;
          positions[j * 3 + 1] += b.vels[j].y * dt;
          positions[j * 3 + 2] += b.vels[j].z * dt;
        }
        b.mesh.geometry.attributes.position.needsUpdate = true;
        b.mesh.material.opacity = 1.0 - (b.life / b.maxLife);
      }
    }
  };

  return (
    <div className="barista-dashboard">
      {/* Loading Overlay */}
      {loading && (
        <div className="barista-loader">
          <div className="loader-content">
            <div className="spinner"></div>
            <h2>CONNECTING TO BARISTA NODES</h2>
            <p>Spinning up joint telemetry engines...</p>
          </div>
        </div>
      )}

      {/* Top Header Controls */}
      <div className="barista-top-bar">
        <div className="system-title">
          <span className="pulse-indicator green"></span>
          <h2>RaaS BARISTA CORE v5.0</h2>
        </div>
        <div className="system-controls">
          <button onClick={handleSoundToggle} className={`btn-icon ${soundOn ? 'active' : ''}`}>
            {soundOn ? '🔔 AUDIO ON' : '🔕 MUTED'}
          </button>
          <button onClick={handleThemeToggle} className="btn-icon">
            {lightingTheme === 'cyberpunk' ? '🌃 CYBERPUNK' : '☕ INDUSTRIAL'}
          </button>
        </div>
      </div>

      {/* Center Telemetry Readouts */}
      <div className="barista-telemetry-header">
        <div className="stat-box">
          <span className="label">SYS STATUS</span>
          <span ref={sysStatusRef} className="val status-idle">STANDBY</span>
        </div>
        <div className="stat-box">
          <span className="label">INFUSION TEMP</span>
          <span ref={tempReadoutRef} className="val">93.4 °C</span>
        </div>
        <div className="stat-box">
          <span className="label">BAR PRESSURE</span>
          <span ref={pressReadoutRef} className="val">0.0 bar</span>
        </div>
        <div className="stat-box">
          <span className="label">ACTIVE NODE</span>
          <span ref={processReadoutRef} className="val">IDLE</span>
        </div>
      </div>

      {/* Scoped Sidebar Controls Panel */}
      <div className="barista-hud-panel">
        <div className="tab-headers">
          <button onClick={() => { audio.playClick(); setActiveTab('menu'); }} className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}>DRINK RECIPES</button>
          <button onClick={() => { audio.playClick(); setActiveTab('robot'); }} className={`tab-btn ${activeTab === 'robot' ? 'active' : ''}`}>6-DOF MANUAL</button>
          <button onClick={() => { audio.playClick(); setActiveTab('diagnostics'); }} className={`tab-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}>DIAGNOSTICS</button>
        </div>

        <div className="tab-contents">
          {/* Tab 1: Menu */}
          {activeTab === 'menu' && (
            <div className="tab-panel active">
              <h3 className="section-title">DRINK BAR</h3>
              <div className="barista-drink-grid">
                <button onClick={() => { audio.playClick(); setActiveCoffee('Espresso'); }} className={`barista-drink-card ${activeCoffee === 'Espresso' ? 'selected' : ''}`}>
                  <span className="icon">☕</span>
                  <span className="name">Espresso</span>
                  <span className="desc">Intense crema shot</span>
                </button>
                <button onClick={() => { audio.playClick(); setActiveCoffee('Americano'); }} className={`barista-drink-card ${activeCoffee === 'Americano' ? 'selected' : ''}`}>
                  <span className="icon">💧</span>
                  <span className="name">Americano</span>
                  <span className="desc">Espresso & hot water</span>
                </button>
                <button onClick={() => { audio.playClick(); setActiveCoffee('Latte'); }} className={`barista-drink-card ${activeCoffee === 'Latte' ? 'selected' : ''}`}>
                  <span className="icon">🥛</span>
                  <span className="name">Latte</span>
                  <span className="desc">Silky milk & froth</span>
                </button>
                <button onClick={() => { audio.playClick(); setActiveCoffee('Cappuccino'); }} className={`barista-drink-card ${activeCoffee === 'Cappuccino' ? 'selected' : ''}`}>
                  <span className="icon">☁️</span>
                  <span className="name">Cappuccino</span>
                  <span className="desc">Thick, dense microfoam</span>
                </button>
              </div>

              <h3 className="section-title">CUSTOMIZE STACK</h3>
              <div className="customizer-options">
                <div className="control-group">
                  <label>Bean Variant</label>
                  <div className="barista-segmented">
                    <button onClick={() => { audio.playClick(); setActiveBean('Arabica'); }} className={`seg-btn ${activeBean === 'Arabica' ? 'active' : ''}`}>Arabica</button>
                    <button onClick={() => { audio.playClick(); setActiveBean('Robusta'); }} className={`seg-btn ${activeBean === 'Robusta' ? 'active' : ''}`}>Robusta</button>
                    <button onClick={() => { audio.playClick(); setActiveBean('Cyber'); }} className={`seg-btn ${activeBean === 'Cyber' ? 'active' : ''}`}>Cyber Blend</button>
                  </div>
                </div>

                <div className="control-group">
                  <label>Milk Substitution</label>
                  <div className="barista-segmented">
                    <button onClick={() => { audio.playClick(); setActiveMilk('Whole'); }} className={`seg-btn ${activeMilk === 'Whole' ? 'active' : ''}`}>Whole</button>
                    <button onClick={() => { audio.playClick(); setActiveMilk('Oat'); }} className={`seg-btn ${activeMilk === 'Oat' ? 'active' : ''}`}>Oat</button>
                    <button onClick={() => { audio.playClick(); setActiveMilk('Almond'); }} className={`seg-btn ${activeMilk === 'Almond' ? 'active' : ''}`}>Almond</button>
                  </div>
                </div>

                <div className="control-group">
                  <label>Syrup/Sweetness</label>
                  <div className="slider-row">
                    <input type="range" min="0" max="100" value={sweetness} onChange={e => setSweetness(parseInt(e.target.value))} />
                    <span>{sweetness > 70 ? 'Extra' : sweetness > 40 ? 'Med' : sweetness > 10 ? 'Light' : 'None'}</span>
                  </div>
                </div>

                <div className="control-group inline">
                  <label htmlFor="reactExtraShot">Add Double Shot</label>
                  <input type="checkbox" id="reactExtraShot" className="barista-checkbox" checked={extraShot} onChange={e => setExtraShot(e.target.checked)} />
                </div>
              </div>

              <div className="barista-summary">
                <div className="summary-line"><span>Total Caffeine:</span><span>{nutrition.caffeine} mg</span></div>
                <div className="summary-line"><span>Nutrition Count:</span><span>{nutrition.calories} kcal</span></div>
                <div className="summary-line"><span>Operation Duration:</span><span>{nutrition.time}s</span></div>
              </div>

              <button onClick={startOrder} className="barista-btn-primary" disabled={brewingActive || manualOverride}>
                RUN AUTONOMOUS BREW
              </button>
            </div>
          )}

          {/* Tab 2: Manual Control */}
          {activeTab === 'robot' && (
            <div className="tab-panel active">
              <div className="barista-override-warning">
                <label className="barista-switch">
                  <input type="checkbox" checked={manualOverride} onChange={handleOverrideToggle} />
                  <span className="barista-switch-slider"></span>
                </label>
                <div className="warning-text">
                  <h3>MANUAL SLIDER OVERRIDE</h3>
                  <p>Disables the target planning engine and routes commands directly to the joints.</p>
                </div>
              </div>

              <div className={`barista-joints-panel ${!manualOverride ? 'locked' : ''}`}>
                <div className="barista-joint-row">
                  <div className="joint-info">
                    <span>Base Rotation (J1)</span>
                    <span ref={jointValRefs.j1} className="joint-value">0.0°</span>
                  </div>
                  <input ref={jointSliderRefs.j1} type="range" min="-180" max="180" defaultValue="0" onChange={e => handleJointChange('j1', e)} disabled={!manualOverride} />
                </div>
                
                <div className="barista-joint-row">
                  <div className="joint-info">
                    <span>Shoulder Pitch (J2)</span>
                    <span ref={jointValRefs.j2} className="joint-value">11.4°</span>
                  </div>
                  <input ref={jointSliderRefs.j2} type="range" min="-90" max="90" defaultValue="11" onChange={e => handleJointChange('j2', e)} disabled={!manualOverride} />
                </div>

                <div className="barista-joint-row">
                  <div className="joint-info">
                    <span>Elbow Pitch (J3)</span>
                    <span ref={jointValRefs.j3} className="joint-value">-5.7°</span>
                  </div>
                  <input ref={jointSliderRefs.j3} type="range" min="-120" max="120" defaultValue="-5" onChange={e => handleJointChange('j3', e)} disabled={!manualOverride} />
                </div>

                <div className="barista-joint-row">
                  <div className="joint-info">
                    <span>Wrist Pitch (J4)</span>
                    <span ref={jointValRefs.j4} className="joint-value">2.8°</span>
                  </div>
                  <input ref={jointSliderRefs.j4} type="range" min="-90" max="90" defaultValue="3" onChange={e => handleJointChange('j4', e)} disabled={!manualOverride} />
                </div>

                <div className="barista-joint-row">
                  <div className="joint-info">
                    <span>Wrist Roll (J5)</span>
                    <span ref={jointValRefs.j5} className="joint-value">0.0°</span>
                  </div>
                  <input ref={jointSliderRefs.j5} type="range" min="-180" max="180" defaultValue="0" onChange={e => handleJointChange('j5', e)} disabled={!manualOverride} />
                </div>

                <div className="barista-joint-row">
                  <div className="joint-info">
                    <span>Gripper Clamp (J6)</span>
                    <span ref={jointValRefs.j6} className="joint-value">30%</span>
                  </div>
                  <input ref={jointSliderRefs.j6} type="range" min="0" max="100" defaultValue="30" onChange={e => handleJointChange('j6', e)} disabled={!manualOverride} />
                </div>

                <div className="barista-presets">
                  <button onClick={() => triggerPose('home')} className="barista-btn-sec" disabled={!manualOverride}>HOME</button>
                  <button onClick={() => triggerPose('calibrate')} className="barista-btn-sec" disabled={!manualOverride}>CALIBRATE</button>
                  <button onClick={() => triggerPose('zero')} className="barista-btn-sec" disabled={!manualOverride}>ZERO</button>
                </div>
              </div>

              <div className="control-group" style={{ marginTop: '15px' }}>
                <label>Joint Movement Velocity</label>
                <div className="slider-row">
                  <input type="range" min="10" max="250" value={speedMultiplier} onChange={e => {
                    const val = parseInt(e.target.value);
                    setSpeedMultiplier(val);
                    robotRef.current.setSpeedMultiplier(val / 100);
                  }} />
                  <span>{(speedMultiplier / 100).toFixed(1)}x</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Diagnostics */}
          {activeTab === 'diagnostics' && (
            <div className="tab-panel active">
              <h3 className="section-title" style={{ marginTop: 0 }}>TELEMETRY</h3>
              <div className="barista-telemetry-grid">
                <div className="barista-telemetry-card">
                  <span className="t-label">Servo Core Temp</span>
                  <span ref={diagTempRef} className="t-value">42.5 °C</span>
                  <div className="progress-bar"><div ref={diagTempBarRef} className="fill" style={{ width: '50%', background: 'var(--cyan)' }}></div></div>
                </div>
                <div className="barista-telemetry-card">
                  <span class="t-label">Heater Power</span>
                  <span ref={diagHeaterRef} className="t-value">12%</span>
                  <div className="progress-bar"><div ref={diagHeaterBarRef} className="fill" style={{ width: '12%', background: 'var(--cyan)' }}></div></div>
                </div>
                <div className="barista-telemetry-card">
                  <span className="t-label">Infusion Water</span>
                  <span ref={diagWaterRef} className="t-value">92%</span>
                  <div className="progress-bar"><div ref={diagWaterBarRef} className="fill" style={{ width: '92%', background: 'var(--green)' }}></div></div>
                </div>
                <div className="barista-telemetry-card">
                  <span className="t-label">Grinder Blades</span>
                  <span ref={diagGrinderRef} className="t-value">14.8%</span>
                  <div className="progress-bar"><div ref={diagGrinderBarRef} className="fill" style={{ width: '14.8%', background: 'var(--green)' }}></div></div>
                </div>
              </div>

              <h3 className="section-title">CORE LOGGER</h3>
              <div className="barista-console">
                <div className="console-header">
                  <span>barista-telemetry@node-fsd</span>
                  <button onClick={clearConsole} className="btn-small">CLEAR</button>
                </div>
                <div ref={consoleLogRef} className="console-log">
                  <p className="sys">[SYSTEM] Calibration successful. System idle.</p>
                  <p className="info">[INFO] Boilers ready at 93.4°C.</p>
                  <p className="success">[READY] Awaiting custom order command.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guide Help Overlay */}
      <div className="barista-hint">
        🖱️ Drag to Rotate | 🖱️ Scroll to Zoom
      </div>

      {/* Three.js Canvas Container Mount */}
      <div ref={mountRef} className="barista-canvas-container"></div>
    </div>
  );
};

export default RoboBarista;
