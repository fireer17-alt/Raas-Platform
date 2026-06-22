import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const HeroScene = () => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f7);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting - Apple style soft lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 20;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe8e8ff, 0.4);
    fillLight.position.set(-5, 3, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.3);
    rimLight.position.set(0, 2, -5);
    scene.add(rimLight);

    // Robot Arm Group
    const robotGroup = new THREE.Group();
    scene.add(robotGroup);

    // Materials - Apple style aluminum + glass
    const aluminumMaterial = new THREE.MeshStandardMaterial({
      color: 0xd0d0d5,
      metalness: 0.9,
      roughness: 0.15,
      envMapIntensity: 1.0
    });

    const darkMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c2c2e,
      metalness: 0.8,
      roughness: 0.2
    });

    const jointMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1c,
      metalness: 0.7,
      roughness: 0.3
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x0071e3,
      metalness: 0.3,
      roughness: 0.2,
      emissive: 0x0071e3,
      emissiveIntensity: 0.3
    });

    // Base
    const baseGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.2, 32);
    const base = new THREE.Mesh(baseGeometry, darkMetalMaterial);
    base.position.y = -1.5;
    base.castShadow = true;
    base.receiveShadow = true;
    robotGroup.add(base);

    // Base accent ring
    const ringGeometry = new THREE.TorusGeometry(0.52, 0.02, 16, 64);
    const ring = new THREE.Mesh(ringGeometry, accentMaterial);
    ring.position.y = -1.4;
    ring.rotation.x = Math.PI / 2;
    robotGroup.add(ring);

    // Shoulder joint
    const shoulderJointGeometry = new THREE.SphereGeometry(0.22, 32, 32);
    const shoulderJoint = new THREE.Mesh(shoulderJointGeometry, jointMaterial);
    shoulderJoint.position.y = -1.3;
    robotGroup.add(shoulderJoint);

    // Upper arm
    const upperArmGeometry = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 16);
    const upperArm = new THREE.Mesh(upperArmGeometry, aluminumMaterial);
    upperArm.position.y = -0.6;
    upperArm.castShadow = true;
    robotGroup.add(upperArm);

    // Elbow joint
    const elbowJointGeometry = new THREE.SphereGeometry(0.18, 32, 32);
    const elbowJoint = new THREE.Mesh(elbowJointGeometry, jointMaterial);
    elbowJoint.position.y = 0;
    robotGroup.add(elbowJoint);

    // Forearm
    const forearmGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 16);
    const forearm = new THREE.Mesh(forearmGeometry, aluminumMaterial);
    forearm.position.y = 0.6;
    forearm.castShadow = true;
    robotGroup.add(forearm);

    // Wrist joint
    const wristJointGeometry = new THREE.SphereGeometry(0.14, 32, 32);
    const wristJoint = new THREE.Mesh(wristJointGeometry, jointMaterial);
    wristJoint.position.y = 1.1;
    robotGroup.add(wristJoint);

    // Gripper base
    const gripperBaseGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.3, 16);
    const gripperBase = new THREE.Mesh(gripperBaseGeometry, darkMetalMaterial);
    gripperBase.position.y = 1.3;
    gripperBase.castShadow = true;
    robotGroup.add(gripperBase);

    // Gripper fingers
    const fingerGeometry = new THREE.BoxGeometry(0.04, 0.3, 0.08);
    const leftFinger = new THREE.Mesh(fingerGeometry, aluminumMaterial);
    leftFinger.position.set(-0.08, 1.55, 0);
    leftFinger.rotation.z = 0.1;
    robotGroup.add(leftFinger);

    const rightFinger = new THREE.Mesh(fingerGeometry, aluminumMaterial);
    rightFinger.position.set(0.08, 1.55, 0);
    rightFinger.rotation.z = -0.1;
    robotGroup.add(rightFinger);

    // LED indicator on gripper
    const ledGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const led = new THREE.Mesh(ledGeometry, accentMaterial);
    led.position.set(0, 1.45, 0.12);
    robotGroup.add(led);

    // Floating particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 60;
    const positions = new Float32Array(particleCount * 3);
    const particleSpeeds = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      particleSpeeds.push({
        x: (Math.random() - 0.5) * 0.002,
        y: (Math.random() - 0.5) * 0.002,
        z: (Math.random() - 0.5) * 0.002
      });
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x0071e3,
      size: 0.02,
      transparent: true,
      opacity: 0.6
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Ground reflection plane
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f7,
      roughness: 0.8,
      metalness: 0.1
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -2;
    plane.receiveShadow = true;
    scene.add(plane);

    // Animation
    let time = 0;
    const animate = () => {
      time += 0.005;

      // Gentle floating animation
      robotGroup.position.y = Math.sin(time) * 0.1;
      robotGroup.rotation.y = Math.sin(time * 0.5) * 0.15;

      // LED pulse
      const pulseIntensity = 0.3 + Math.sin(time * 3) * 0.2;
      led.material.emissiveIntensity = pulseIntensity;

      // Ring glow
      ring.material.emissiveIntensity = 0.2 + Math.sin(time * 2) * 0.1;

      // Particles movement
      const posArray = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3] += particleSpeeds[i].x;
        posArray[i * 3 + 1] += particleSpeeds[i].y;
        posArray[i * 3 + 2] += particleSpeeds[i].z;

        // Reset if too far
        if (Math.abs(posArray[i * 3]) > 3) particleSpeeds[i].x *= -1;
        if (Math.abs(posArray[i * 3 + 1]) > 2) particleSpeeds[i].y *= -1;
        if (Math.abs(posArray[i * 3 + 2]) > 2) particleSpeeds[i].z *= -1;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y += 0.001;

      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default HeroScene;
