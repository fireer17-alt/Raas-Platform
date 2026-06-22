import * as THREE from 'three';

export class RobotArm {
  constructor() {
    this.group = new THREE.Group();
    
    this.joints = {
      j1: 0,
      j2: 0.2,
      j3: -0.1,
      j4: 0.05,
      j5: 0,
      j6: 0.12
    };

    this.targets = { ...this.joints };
    this.velocities = { j1:0, j2:0, j3:0, j4:0, j5:0, j6:0 };
    this.totalVelocity = 0;
    this.manualMode = false;
    this.speedMult = 1.0;

    this.createMaterials();
    this.buildArm();
  }

  createMaterials() {
    this.materials = {
      armMetal: new THREE.MeshStandardMaterial({
        color: 0x242d38,
        roughness: 0.25,
        metalness: 0.85,
        emissive: 0x050b11,
        emissiveIntensity: 0.2
      }),
      joints: new THREE.MeshStandardMaterial({
        color: 0x3d4b5c,
        roughness: 0.2,
        metalness: 0.9
      }),
      chrome: new THREE.MeshStandardMaterial({
        color: 0xe0e6ed,
        roughness: 0.1,
        metalness: 0.95
      }),
      accentNeon: new THREE.MeshStandardMaterial({
        color: 0x5fe1ff,
        emissive: 0x5fe1ff,
        emissiveIntensity: 1.8,
        roughness: 0.1
      }),
      accentOrange: new THREE.MeshStandardMaterial({
        color: 0xff7733,
        emissive: 0xff7733,
        emissiveIntensity: 1.2,
        roughness: 0.1
      }),
      gripper: new THREE.MeshStandardMaterial({
        color: 0x68788c,
        roughness: 0.3,
        metalness: 0.6
      }),
      carbon: new THREE.MeshStandardMaterial({
        color: 0x111317,
        roughness: 0.4,
        metalness: 0.2
      }),
      headEye: new THREE.MeshStandardMaterial({
        color: 0x5fe1ff,
        emissive: 0x5fe1ff,
        emissiveIntensity: 2.0,
        roughness: 0.1
      })
    };
  }

  buildArm() {
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.7, 32);
    const baseMesh = new THREE.Mesh(baseGeo, this.materials.armMetal);
    baseMesh.position.y = 0.35;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    const gearRing = new THREE.Mesh(
      new THREE.CylinderGeometry(1.82, 1.82, 0.2, 40),
      this.materials.joints
    );
    gearRing.position.y = 0.25;
    this.group.add(gearRing);

    this.turntable = new THREE.Group();
    this.turntable.position.y = 0.7;
    this.group.add(this.turntable);

    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.4, 0.3, 24),
      this.materials.joints
    );
    plate.position.y = 0.15;
    plate.castShadow = true;
    this.turntable.add(plate);

    const glowTrack = new THREE.Mesh(
      new THREE.TorusGeometry(1.0, 0.04, 8, 32),
      this.materials.accentNeon
    );
    glowTrack.rotation.x = Math.PI / 2;
    glowTrack.position.y = 0.301;
    this.turntable.add(glowTrack);

    this.shoulderGroup = new THREE.Group();
    this.shoulderGroup.position.set(0, 0.3, 0);
    this.turntable.add(this.shoulderGroup);

    const bPlateL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, 0.8), this.materials.carbon);
    bPlateL.position.set(-0.55, 0.45, 0);
    bPlateL.castShadow = true;
    const bPlateR = bPlateL.clone();
    bPlateR.position.x = 0.55;
    this.shoulderGroup.add(bPlateL, bPlateR);

    const sCap = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.25, 16), this.materials.joints);
    sCap.rotation.z = Math.PI / 2;
    sCap.position.y = 0.7;
    sCap.castShadow = true;
    this.shoulderGroup.add(sCap);

    const sCapGlowL = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.03, 8, 16), this.materials.accentNeon);
    sCapGlowL.position.set(-0.63, 0.7, 0);
    sCapGlowL.rotation.y = Math.PI / 2;
    const sCapGlowR = sCapGlowL.clone();
    sCapGlowR.position.x = 0.63;
    this.shoulderGroup.add(sCapGlowL, sCapGlowR);

    const upperArmLength = 1.8;
    this.upperArmGroup = new THREE.Group();
    this.upperArmGroup.position.set(0, 0.7, 0);
    this.shoulderGroup.add(this.upperArmGroup);

    const strutL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, upperArmLength, 10), this.materials.chrome);
    strutL.position.set(-0.35, upperArmLength / 2, 0);
    strutL.castShadow = true;
    const strutR = strutL.clone();
    strutR.position.x = 0.35;
    this.upperArmGroup.add(strutL, strutR);

    const centerHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.28, upperArmLength - 0.4, 12),
      this.materials.armMetal
    );
    centerHousing.position.y = upperArmLength / 2;
    centerHousing.castShadow = true;
    this.upperArmGroup.add(centerHousing);

    this.pistonBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), this.materials.armMetal);
    this.pistonBase.position.set(0, 0.1, -0.35);
    this.pistonBase.rotation.x = -0.3;
    this.upperArmGroup.add(this.pistonBase);

    this.pistonShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.7, 8), this.materials.chrome);
    this.pistonShaft.position.set(0, 0.45, -0.2);
    this.pistonShaft.rotation.x = -0.3;
    this.upperArmGroup.add(this.pistonShaft);

    this.elbowGroup = new THREE.Group();
    this.elbowGroup.position.set(0, upperArmLength, 0);
    this.upperArmGroup.add(this.elbowGroup);

    const elbowJointMesh = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 20), this.materials.joints);
    elbowJointMesh.castShadow = true;
    this.elbowGroup.add(elbowJointMesh);

    const elbowBoltL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.95, 12), this.materials.chrome);
    elbowBoltL.rotation.z = Math.PI / 2;
    this.elbowGroup.add(elbowBoltL);

    const forearmLength = 1.6;
    this.forearmGroup = new THREE.Group();
    this.elbowGroup.add(this.forearmGroup);

    const forearmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.34, forearmLength, 12),
      this.materials.armMetal
    );
    forearmMesh.position.y = forearmLength / 2;
    forearmMesh.castShadow = true;
    forearmMesh.receiveShadow = true;
    this.forearmGroup.add(forearmMesh);

    const armShield = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.36, forearmLength * 0.7, 12, 1, true),
      this.materials.carbon
    );
    armShield.position.y = forearmLength / 2;
    this.forearmGroup.add(armShield);

    this.wristGroup = new THREE.Group();
    this.wristGroup.position.set(0, forearmLength, 0);
    this.forearmGroup.add(this.wristGroup);

    const wristJointMesh = new THREE.Mesh(new THREE.SphereGeometry(0.33, 16, 16), this.materials.joints);
    wristJointMesh.castShadow = true;
    this.wristGroup.add(wristJointMesh);

    const wristPitchMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.55, 12), this.materials.armMetal);
    wristPitchMesh.rotation.z = Math.PI / 2;
    wristPitchMesh.castShadow = true;
    this.wristGroup.add(wristPitchMesh);

    this.wristRollGroup = new THREE.Group();
    this.wristRollGroup.position.set(0, 0.2, 0);
    this.wristGroup.add(this.wristRollGroup);

    const wristRollShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.22, 0.4, 12),
      this.materials.joints
    );
    wristRollShaft.position.y = 0.1;
    wristRollShaft.castShadow = true;
    this.wristRollGroup.add(wristRollShaft);

    const wristGlow = new THREE.Mesh(
      new THREE.TorusGeometry(0.21, 0.02, 6, 16),
      this.materials.accentNeon
    );
    wristGlow.rotation.x = Math.PI / 2;
    wristGlow.position.y = 0.2;
    this.wristRollGroup.add(wristGlow);

    this.gripperGroup = new THREE.Group();
    this.gripperGroup.position.set(0, 0.3, 0);
    this.wristRollGroup.add(this.gripperGroup);

    const gripperBase = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.16, 0.64), this.materials.gripper);
    gripperBase.position.y = 0.08;
    gripperBase.castShadow = true;
    this.gripperGroup.add(gripperBase);

    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.68, 8), this.materials.chrome);
    rail.rotation.z = Math.PI / 2;
    rail.position.y = 0.08;
    this.gripperGroup.add(rail);

    this.fingerLGroup = new THREE.Group();
    this.fingerLGroup.position.set(-0.2, 0.16, 0);
    this.gripperGroup.add(this.fingerLGroup);

    const fingerBaseL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.44), this.materials.gripper);
    fingerBaseL.position.y = 0.125;
    fingerBaseL.castShadow = true;
    this.fingerLGroup.add(fingerBaseL);

    const rubberTipL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.35), this.materials.carbon);
    rubberTipL.position.set(0.06, 0.2, 0);
    this.fingerLGroup.add(rubberTipL);

    this.fingerRGroup = new THREE.Group();
    this.fingerRGroup.position.set(0.2, 0.16, 0);
    this.gripperGroup.add(this.fingerRGroup);

    const fingerBaseR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.44), this.materials.gripper);
    fingerBaseR.position.y = 0.125;
    fingerBaseR.castShadow = true;
    this.fingerRGroup.add(fingerBaseR);

    const rubberTipR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.35), this.materials.carbon);
    rubberTipR.position.set(-0.06, 0.2, 0);
    this.fingerRGroup.add(rubberTipR);

    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0.7, 0.8, -0.2);
    this.shoulderGroup.add(this.headGroup);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.3, 8), this.materials.joints);
    neck.position.y = -0.15;
    this.headGroup.add(neck);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), this.materials.armMetal);
    skull.castShadow = true;
    this.headGroup.add(skull);

    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.materials.carbon);
    visor.rotation.x = Math.PI / 2;
    visor.scale.set(0.95, 0.75, 0.95);
    visor.position.set(0, 0, 0.06);
    this.headGroup.add(visor);

    this.eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), this.materials.headEye);
    this.eyeL.position.set(-0.09, 0.01, 0.24);
    this.eyeR = this.eyeL.clone();
    this.eyeR.position.x = 0.09;
    this.headGroup.add(this.eyeL, this.eyeR);

    this.headStatusLight = new THREE.PointLight(0x5fe1ff, 0.6, 2.5);
    this.headStatusLight.position.set(0, 0.1, 0.35);
    this.headGroup.add(this.headStatusLight);

    this.heldCoffeeGroup = new THREE.Group();
    this.heldCoffeeGroup.position.set(0, 0.32, 0);
    this.gripperGroup.add(this.heldCoffeeGroup);
  }

  setLEDColor(hex) {
    this.materials.headEye.color.setHex(hex);
    this.materials.headEye.emissive.setHex(hex);
    this.headStatusLight.color.setHex(hex);
  }

  setSpeedMultiplier(mult) {
    this.speedMult = mult;
  }

  setPose(pose) {
    const toRad = Math.PI / 180;
    if (pose === 'home') {
      this.setTargets({ j1: 0, j2: 12*toRad, j3: -10*toRad, j4: 8*toRad, j5: 0, j6: 0.12 });
    } else if (pose === 'calibrate') {
      this.setTargets({ j1: 30*toRad, j2: 40*toRad, j3: -30*toRad, j4: -10*toRad, j5: 45*toRad, j6: 0.3 });
    } else if (pose === 'zero') {
      this.setTargets({ j1: 0, j2: 0, j3: 0, j4: 0, j5: 0, j6: 0.1 });
    }
  }

  setTargets(newTargets) {
    for (const key in newTargets) {
      if (this.targets[key] !== undefined) {
        this.targets[key] = newTargets[key];
      }
    }
  }

  setJoint(name, radians) {
    if (this.joints[name] !== undefined) {
      this.joints[name] = radians;
      this.targets[name] = radians;
    }
  }

  setManualOverride(enable) {
    this.manualMode = enable;
    if (enable) {
      this.setLEDColor(0xff5566);
    } else {
      this.setLEDColor(0x5fe1ff);
      this.targets = { ...this.joints };
    }
  }

  update(dt) {
    let velocitySum = 0;
    const baseInterpSpeed = 3.6;
    const interpSpeed = baseInterpSpeed * this.speedMult;

    for (const key in this.joints) {
      if (!this.manualMode || key === 'j6') {
        const current = this.joints[key];
        const target = this.targets[key];
        
        if (Math.abs(target - current) > 0.0001) {
          const dir = Math.sign(target - current);
          let step = interpSpeed * dt;
          
          const dist = Math.abs(target - current);
          if (dist < 0.25) {
            step *= (dist / 0.25);
          }
          
          const delta = dir * Math.max(step, 0.005) * dt * 60;
          
          if (Math.abs(delta) >= dist) {
            this.joints[key] = target;
            this.velocities[key] = 0;
          } else {
            this.joints[key] += delta;
            this.velocities[key] = Math.abs(delta) / dt;
          }
        } else {
          this.joints[key] = target;
          this.velocities[key] = 0;
        }
      } else {
        this.velocities[key] = 0;
      }
      
      if (key !== 'j6') {
        velocitySum += this.velocities[key];
      }
    }

    this.totalVelocity = velocitySum;

    this.turntable.rotation.y = this.joints.j1;
    this.shoulderGroup.rotation.x = this.joints.j2;
    this.elbowGroup.rotation.x = this.joints.j3;
    this.wristGroup.rotation.x = this.joints.j4;
    this.wristRollGroup.rotation.z = this.joints.j5;

    const gripperOffset = this.joints.j6;
    this.fingerLGroup.position.x = -0.2 - (gripperOffset - 0.1);
    this.fingerRGroup.position.x = 0.2 + (gripperOffset - 0.1);

    const time = performance.now() * 0.0015;
    if (!this.manualMode) {
      this.headGroup.rotation.y = Math.sin(time * 0.5) * 0.25;
      this.headGroup.rotation.x = Math.cos(time * 0.8) * 0.05;
      
      const blink = (Math.sin(time * 6) > 0.98) ? 0.1 : 1.0;
      this.eyeL.scale.y = blink;
      this.eyeR.scale.y = blink;
    } else {
      this.headGroup.rotation.set(0, 0, 0);
      this.eyeL.scale.y = 1.0;
      this.eyeR.scale.y = 1.0;
    }
  }
}
