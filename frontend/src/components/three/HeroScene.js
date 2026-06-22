import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const HeroScene = () => {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // ─── Scene ───
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f7);
    scene.fog = new THREE.Fog(0xf5f5f7, 8, 20);

    // ─── Camera ───
    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(2.5, 1.8, 4.5);

    // ─── Renderer ───
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // ─── Controls ───
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.5;
    controls.maxDistance = 10;
    controls.target.set(0, 0.8, 0);
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;

    // Stop auto-rotate on user interaction
    controls.addEventListener('start', () => { controls.autoRotate = false; });

    // ─── Apple-style Lighting ───
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.0001;
    keyLight.shadow.radius = 4;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdde4ff, 0.5);
    fillLight.position.set(-5, 3, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.4);
    rimLight.position.set(-2, 2, -5);
    scene.add(rimLight);

    const bottomLight = new THREE.PointLight(0x0071e3, 0.15, 10);
    bottomLight.position.set(0, -1, 2);
    scene.add(bottomLight);

    // ─── Ground Plane (reflection) ───
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f7,
      roughness: 0.85,
      metalness: 0.05,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.02;
    plane.receiveShadow = true;
    scene.add(plane);

    // ─── Contact Shadow (fake soft shadow) ───
    const shadowGeometry = new THREE.CircleGeometry(1.2, 64);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.15,
    });
    const contactShadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.005;
    scene.add(contactShadow);

    // ─── Floating Particles ───
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 80;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x0071e3,
      size: 0.025,
      transparent: true,
      opacity: 0.4,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // ─── Load GLB Model ───
    let modelGroup = null;
    let mixer = null;
    let clock = new THREE.Clock();
    let idleTime = 0;
    let animFrameId = null;

    const loader = new GLTFLoader();
    loader.load(
      '/models/robot_arm_animation.glb',
      (gltf) => {
        modelGroup = gltf.scene;

        // Scale and position
        const box = new THREE.Box3().setFromObject(modelGroup);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.8 / maxDim;
        modelGroup.scale.setScalar(scale);

        // Center the model
        const center = box.getCenter(new THREE.Vector3());
        modelGroup.position.sub(center.clone().multiplyScalar(scale));
        modelGroup.position.y += 0.02; // just above ground

        // Enable shadows on all meshes
        modelGroup.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            // Improve materials
            if (child.material) {
              child.material.envMapIntensity = 1.0;
            }
          }
        });

        scene.add(modelGroup);

        // ─── Animation ───
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(modelGroup);
          const action = mixer.clipAction(gltf.animations[0]);
          action.setEffectiveTimeScale(0.6); // slow it down for elegance
          action.play();
        }

        setLoading(false);
      },
      (xhr) => {
        const progress = Math.round((xhr.loaded / xhr.total) * 100);
        setLoadProgress(progress);
      },
      (error) => {
        console.error('Error loading GLB model:', error);
        setLoading(false);
      }
    );

    // ─── Animation Loop ───
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      if (mixer) mixer.update(dt);

      // Idle: resume auto-rotate after 6 seconds of inactivity
      idleTime += dt;
      if (!controls.autoRotate && idleTime > 6.0) {
        controls.autoRotate = true;
      }
      controls.update();

      // Particle drift
      particles.rotation.y += 0.0003;
      const posArray = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 1] += Math.sin(clock.elapsedTime + i) * 0.0003;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      // Contact shadow breathes with model
      if (modelGroup) {
        contactShadow.scale.setScalar(
          1 + Math.sin(clock.elapsedTime * 0.5) * 0.05
        );
      }

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
      cancelAnimationFrame(animFrameId);
      if (mixer) mixer.stopAllAction();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            background: '#f5f5f7',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(0, 113, 227, 0.15)',
              borderTop: '3px solid #0071e3',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px',
            }}
          />
          <div style={{ fontSize: '14px', color: '#86868b', fontWeight: 500 }}>
            Loading Model... {loadProgress}%
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default HeroScene;
