import * as THREE from 'three';

export class CafeEnvironment {
  constructor(scene) {
    this.scene = scene;
    
    this.positions = {
      rack: new THREE.Vector3(1.6, 1.2, -0.6),
      spout: new THREE.Vector3(-1.8, 1.2, -0.2),
      serve: new THREE.Vector3(0.0, 1.2, 1.6)
    };

    this.spoutWorldPos = new THREE.Vector3(-1.8, 1.76, 0.1);

    this.createMaterials();
    this.buildRoom();
    this.buildCounter();
    this.buildEspressoMachine();
    this.buildCupRack();
    this.buildPendantLights();
    this.buildCoffeeCup();
    this.buildFluidStream();
  }

  createMaterials() {
    this.materials = {
      marble: new THREE.MeshStandardMaterial({
        color: 0x181a22,
        roughness: 0.08,
        metalness: 0.1,
        bumpScale: 0.01
      }),
      wood: new THREE.MeshStandardMaterial({
        color: 0x221a15,
        roughness: 0.7,
        metalness: 0.05
      }),
      brass: new THREE.MeshStandardMaterial({
        color: 0xcca662,
        roughness: 0.15,
        metalness: 0.85
      }),
      iron: new THREE.MeshStandardMaterial({
        color: 0x2e353d,
        roughness: 0.4,
        metalness: 0.7
      }),
      glass: new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.25,
        roughness: 0.05,
        metalness: 0.1
      }),
      neonSign: new THREE.MeshBasicMaterial({
        color: 0xff7733
      }),
      gridLine: new THREE.MeshBasicMaterial({
        color: 0x00ccff,
        transparent: true,
        opacity: 0.15
      }),
      fluidEspresso: new THREE.MeshStandardMaterial({
        color: 0x2b1506,
        roughness: 0.1,
        metalness: 0.1,
        emissive: 0x221100,
        emissiveIntensity: 0.1
      }),
      foamMilk: new THREE.MeshStandardMaterial({
        color: 0xfbf7eb,
        roughness: 0.7,
        metalness: 0.0
      }),
      saucerCeramic: new THREE.MeshStandardMaterial({
        color: 0xfcfcfc,
        roughness: 0.18,
        metalness: 0.1
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
      })
    };
  }

  buildRoom() {
    const size = 32;
    const divisions = 32;
    const gridHelper = new THREE.GridHelper(size, divisions, 0x5fe1ff, 0x1d2c38);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshStandardMaterial({
        color: 0x05060a,
        roughness: 0.22,
        metalness: 0.8
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const wallGeo = new THREE.CylinderGeometry(14, 14, 10, 32, 1, true, -Math.PI / 2, Math.PI);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x090a12,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.BackSide
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 5, -8);
    this.scene.add(wall);

    const signBox = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.8, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x111322, roughness: 0.5 })
    );
    signBox.position.set(0, 6.2, -6.5);
    this.scene.add(signBox);

    const signTextBack = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.6, 0.02),
      this.materials.neonSign
    );
    signTextBack.position.set(0, 6.2, -6.44);
    this.scene.add(signTextBack);
    
    const signLight = new THREE.PointLight(0xff7733, 1.2, 10, 1.5);
    signLight.position.set(0, 6.2, -6.0);
    this.scene.add(signLight);
  }

  buildCounter() {
    const counterGeo = new THREE.BoxGeometry(6.5, 1.2, 2.6);
    const counter = new THREE.Mesh(counterGeo, this.materials.marble);
    counter.position.set(0, 0.6, 0.3);
    counter.receiveShadow = true;
    counter.castShadow = true;
    this.scene.add(counter);

    const panelGeo = new THREE.BoxGeometry(6.3, 1.15, 2.7);
    const woodPanel = new THREE.Mesh(panelGeo, this.materials.wood);
    woodPanel.position.set(0, 0.57, 0.3);
    woodPanel.receiveShadow = true;
    this.scene.add(woodPanel);

    const basePlate = new THREE.Mesh(
      new THREE.BoxGeometry(6.6, 0.06, 2.8),
      this.materials.iron
    );
    basePlate.position.y = 0.03;
    basePlate.position.z = 0.3;
    this.scene.add(basePlate);

    const ledStrip = new THREE.PointLight(0x5fe1ff, 0.8, 5, 2);
    ledStrip.position.set(0, 1.15, 1.6);
    this.scene.add(ledStrip);
  }

  buildEspressoMachine() {
    this.machineGroup = new THREE.Group();
    this.machineGroup.position.copy(this.positions.spout).add(new THREE.Vector3(0, 0.6, 0));
    this.scene.add(this.machineGroup);

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.1), this.materials.iron);
    body.position.y = 0.55;
    body.castShadow = true;
    body.receiveShadow = true;
    this.machineGroup.add(body);

    const bracketFL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.12, 0.12), this.materials.brass);
    bracketFL.position.set(-0.76, 0.56, 0.51);
    const bracketFR = bracketFL.clone();
    bracketFR.position.x = 0.76;
    const bracketBL = bracketFL.clone();
    bracketBL.position.z = -0.51;
    const bracketBR = bracketFR.clone();
    bracketBR.position.z = -0.51;
    this.machineGroup.add(bracketFL, bracketFR, bracketBL, bracketBR);

    const glassSleeve = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.6, 0.05), this.materials.glass);
    glassSleeve.position.set(0, 0.6, 0.53);
    this.machineGroup.add(glassSleeve);

    const coilL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.4, 8), this.materials.accentNeon);
    coilL.position.set(-0.35, 0.6, 0.35);
    coilL.rotation.x = Math.PI / 2;
    const coilR = coilL.clone();
    coilR.position.x = 0.35;
    coilR.material = this.materials.accentOrange;
    this.machineGroup.add(coilL, coilR);

    const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), this.materials.chrome);
    gauge.rotation.x = Math.PI / 2;
    gauge.position.set(0.5, 0.95, 0.56);
    this.machineGroup.add(gauge);

    const gaugeFace = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 12), this.materials.saucerCeramic);
    gaugeFace.position.set(0.5, 0.95, 0.6);
    gaugeFace.rotation.x = Math.PI / 2;
    this.machineGroup.add(gaugeFace);

    const tray = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.8), this.materials.iron);
    tray.position.set(0, 0.04, 0.6);
    tray.receiveShadow = true;
    this.machineGroup.add(tray);

    const portafilter = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.2, 12), this.materials.brass);
    portafilter.position.set(0, 0.7, 0.5);
    this.machineGroup.add(portafilter);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.5, 8), this.materials.iron);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0.35, 0.7, 0.5);
    this.machineGroup.add(handle);

    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.15, 8), this.materials.chrome);
    nozzle.position.set(0, 0.58, 0.5);
    this.machineGroup.add(nozzle);

    const wandL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), this.materials.brass);
    wandL.position.set(-0.5, 0.65, 0.5);
    wandL.rotation.z = 0.3;
    wandL.rotation.x = 0.4;
    const wandR = wandL.clone();
    wandR.position.x = 0.5;
    wandR.rotation.z = -0.3;
    this.machineGroup.add(wandL, wandR);
  }

  buildCupRack() {
    this.rackGroup = new THREE.Group();
    this.rackGroup.position.copy(this.positions.rack).add(new THREE.Vector3(0, 0.6, 0));
    this.scene.add(this.rackGroup);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.9), this.materials.iron);
    frame.position.y = 0.025;
    this.rackGroup.add(frame);

    const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), this.materials.chrome);
    pole1.position.set(-0.35, 0.3, -0.35);
    const pole2 = pole1.clone(); pole2.position.x = 0.35;
    const pole3 = pole1.clone(); pole3.position.z = 0.35;
    const pole4 = pole2.clone(); pole4.position.z = 0.35;
    this.rackGroup.add(pole1, pole2, pole3, pole4);

    const rackTop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.9), this.materials.glass);
    rackTop.position.y = 0.6;
    this.rackGroup.add(rackTop);

    const cupMesh1 = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.45, 16), this.materials.saucerCeramic);
    cupMesh1.rotation.x = Math.PI;
    cupMesh1.position.set(-0.2, 0.25, -0.2);
    
    const cupMesh2 = cupMesh1.clone();
    cupMesh2.position.set(0.2, 0.25, -0.2);

    const cupMesh3 = cupMesh1.clone();
    cupMesh3.position.set(0, 0.25, 0.2);

    this.rackGroup.add(cupMesh1, cupMesh2, cupMesh3);
  }

  buildPendantLights() {
    const buildPendant = (x, z, color) => {
      const g = new THREE.Group();
      g.position.set(x, 7.5, z);

      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 3.5, 6), this.materials.iron);
      rod.position.y = -1.75;
      g.add(rod);

      const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.55, 0.35, 16, 1, false),
        this.materials.brass
      );
      shade.position.y = -3.5;
      g.add(shade);

      const bulbMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 2.0,
        roughness: 0.1
      });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), bulbMat);
      bulb.position.y = -3.65;
      g.add(bulb);

      const light = new THREE.PointLight(color, 1.4, 6.5, 1.8);
      light.position.y = -3.75;
      g.add(light);

      this.scene.add(g);
    };

    buildPendant(0.5, 0.6, 0xffaa55);
    buildPendant(-1.8, 0.6, 0xff8844);
    buildPendant(1.8, 0.6, 0xffaa55);
  }

  buildCoffeeCup() {
    this.cupGroup = new THREE.Group();
    this.cupGroup.position.copy(this.positions.rack).add(new THREE.Vector3(-0.2, 0.62, 0.25));
    this.scene.add(this.cupGroup);

    const saucer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.52, 0.06, 24),
      this.materials.saucerCeramic
    );
    saucer.castShadow = true;
    saucer.receiveShadow = true;
    this.cupGroup.add(saucer);

    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.28, 0.46, 24),
      this.materials.saucerCeramic
    );
    cup.position.y = 0.23;
    cup.castShadow = true;
    cup.receiveShadow = true;
    this.cupGroup.add(cup);

    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.03, 8, 12),
      this.materials.saucerCeramic
    );
    handle.position.set(0.36, 0.22, 0);
    handle.rotation.y = Math.PI / 2;
    handle.scale.set(0.7, 0.7, 0.5);
    handle.castShadow = true;
    this.cupGroup.add(handle);

    this.liquidMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.29, 0.38, 20),
      this.materials.fluidEspresso
    );
    this.liquidMesh.position.y = 0.23;
    this.liquidMesh.visible = false;
    this.cupGroup.add(this.liquidMesh);

    this.foamMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.33, 0.32, 0.1, 20),
      this.materials.foamMilk
    );
    this.foamMesh.visible = false;
    this.cupGroup.add(this.foamMesh);

    const artCanvas = document.createElement('canvas');
    artCanvas.width = 128;
    artCanvas.height = 128;
    const ctx = artCanvas.getContext('2d');
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#6e4428';
    ctx.beginPath();
    ctx.arc(64, 64, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fdfbf7';
    ctx.beginPath();
    ctx.moveTo(64, 45);
    ctx.bezierCurveTo(64, 40, 48, 28, 38, 48);
    ctx.bezierCurveTo(28, 68, 56, 88, 64, 94);
    ctx.bezierCurveTo(72, 88, 100, 68, 90, 48);
    ctx.bezierCurveTo(80, 28, 64, 40, 64, 45);
    ctx.fill();
    ctx.strokeStyle = '#6e4428';
    ctx.lineWidth = 4;
    ctx.stroke();

    const artTex = new THREE.CanvasTexture(artCanvas);
    const artMat = new THREE.MeshBasicMaterial({ map: artTex });
    
    this.artMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.31, 0.31, 0.01, 20),
      artMat
    );
    this.artMesh.visible = false;
    this.cupGroup.add(this.artMesh);

    this.steamGroup = new THREE.Group();
    this.steamGroup.position.set(0, 0.5, 0);
    this.cupGroup.add(this.steamGroup);

    this.steamParticles = [];
    const steamMat = new THREE.MeshBasicMaterial({
      color: 0xeeeeee,
      transparent: true,
      opacity: 0
    });

    for (let i = 0; i < 8; i++) {
      const sp = new THREE.Mesh(
        new THREE.SphereGeometry(0.015 + Math.random() * 0.02, 6, 6),
        steamMat.clone()
      );
      sp.position.set((Math.random() - 0.5) * 0.15, Math.random() * 0.3, (Math.random() - 0.5) * 0.15);
      sp.userData = {
        speed: 0.15 + Math.random() * 0.12,
        drift: (Math.random() - 0.5) * 0.06,
        t0: Math.random() * 5
      };
      this.steamGroup.add(sp);
      this.steamParticles.push(sp);
    }
  }

  buildFluidStream() {
    this.streamGroup = new THREE.Group();
    this.streamGroup.position.copy(this.spoutWorldPos);
    this.scene.add(this.streamGroup);

    const length = 0.56;
    const streamGeo = new THREE.CylinderGeometry(0.015, 0.012, length, 8);
    streamGeo.translate(0, -length / 2, 0);

    this.streamMesh = new THREE.Mesh(streamGeo, this.materials.fluidEspresso);
    this.streamMesh.visible = false;
    this.streamGroup.add(this.streamMesh);

    this.splashParticles = [];
    const splashMat = new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.8
    });

    this.splashGroup = new THREE.Group();
    this.splashGroup.position.y = -length;
    this.streamGroup.add(this.splashGroup);

    for (let i = 0; i < 15; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01), splashMat.clone());
      this.resetSplashParticle(p);
      this.splashGroup.add(p);
      this.splashParticles.push(p);
    }
  }

  resetSplashParticle(p) {
    p.position.set(0, 0, 0);
    const theta = Math.random() * Math.PI * 2;
    const speed = 0.15 + Math.random() * 0.25;
    p.userData = {
      velocity: new THREE.Vector3(Math.cos(theta) * speed, 0.2 + Math.random() * 0.3, Math.sin(theta) * speed),
      life: 0,
      maxLife: 0.2 + Math.random() * 0.25
    };
  }

  setCupLocation(parentName, robot) {
    if (parentName === 'robot') {
      robot.heldCoffeeGroup.attach(this.cupGroup);
      this.cupGroup.position.set(0, 0.32, 0);
      this.cupGroup.rotation.set(0, 0, 0);
    } else if (parentName === 'spout') {
      this.scene.attach(this.cupGroup);
      this.cupGroup.position.copy(this.positions.spout).add(new THREE.Vector3(0, 0.64, 0.5));
      this.cupGroup.rotation.set(0, 0, 0);
    } else if (parentName === 'serve') {
      this.scene.attach(this.cupGroup);
      this.cupGroup.position.copy(this.positions.serve).add(new THREE.Vector3(0, 0.62, 0));
      this.cupGroup.rotation.set(0, 0, 0);
    } else if (parentName === 'rack') {
      this.scene.attach(this.cupGroup);
      this.cupGroup.position.copy(this.positions.rack).add(new THREE.Vector3(-0.2, 0.62, 0.25));
      this.cupGroup.rotation.set(0, 0, 0);
    }
  }

  update(dt, phase, activeCoffee, config = {}) {
    const isPouring = (phase === 'pour');
    
    let liquidColor = 0x2b1506;
    let hasFoam = false;
    let foamMax = 0.12;

    if (activeCoffee === 'Americano') {
      liquidColor = 0x3d210d;
    } else if (activeCoffee === 'Latte') {
      liquidColor = 0x5a391f;
      hasFoam = true;
      foamMax = 0.15;
    } else if (activeCoffee === 'Cappuccino') {
      liquidColor = 0x5a391f;
      hasFoam = true;
      foamMax = 0.26;
    }

    this.materials.fluidEspresso.color.setHex(liquidColor);
    this.materials.fluidEspresso.emissive.setHex(liquidColor);

    if (isPouring) {
      this.streamMesh.visible = true;
      this.streamMesh.scale.x = 0.9 + Math.sin(performance.now() * 0.05) * 0.1;
      this.streamMesh.scale.z = this.streamMesh.scale.x;

      const fillProgress = config.fillProgress || 0.0;
      if (hasFoam && fillProgress > 0.6) {
        this.materials.fluidEspresso.color.lerp(new THREE.Color(0xffffff), 0.06);
        this.materials.fluidEspresso.emissive.lerp(new THREE.Color(0xffffff), 0.06);
      }

      this.splashParticles.forEach(p => {
        p.visible = true;
        p.userData.life += dt;
        if (p.userData.life >= p.userData.maxLife) {
          this.resetSplashParticle(p);
        } else {
          p.userData.velocity.y -= 1.8 * dt;
          p.position.addScaledVector(p.userData.velocity, dt);
          p.material.opacity = 1.0 - (p.userData.life / p.userData.maxLife);
        }
      });
    } else {
      this.streamMesh.visible = false;
      this.splashParticles.forEach(p => p.visible = false);
    }

    const fillProgress = config.fillProgress || 0;
    if (fillProgress > 0.01) {
      this.liquidMesh.visible = true;
      
      const maxLiquidHeight = 0.34;
      const progressHeight = fillProgress * maxLiquidHeight;
      this.liquidMesh.scale.y = Math.max(0.001, progressHeight / 0.38);
      this.liquidMesh.position.y = 0.04 + progressHeight / 2;

      if (hasFoam && fillProgress > 0.3) {
        const foamProgress = (fillProgress - 0.3) / 0.7;
        this.foamMesh.visible = true;
        const currentFoamH = foamProgress * foamMax;
        this.foamMesh.scale.y = Math.max(0.001, currentFoamH / 0.1);
        this.foamMesh.position.y = 0.04 + progressHeight + currentFoamH / 2;

        if (foamProgress > 0.8) {
          this.artMesh.visible = true;
          this.artMesh.position.y = 0.04 + progressHeight + currentFoamH + 0.005;
        } else {
          this.artMesh.visible = false;
        }
      } else {
        this.foamMesh.visible = false;
        this.artMesh.visible = false;
      }
    } else {
      this.liquidMesh.visible = false;
      this.foamMesh.visible = false;
      this.artMesh.visible = false;
    }

    const steamIntensity = (fillProgress > 0.1) ? 1.0 : 0.0;
    this.steamParticles.forEach(sp => {
      const { speed, drift, t0 } = sp.userData;
      const time = performance.now() * 0.0015 + t0;
      
      sp.position.y += speed * dt;
      sp.position.x += Math.sin(time) * drift * dt;
      sp.position.z += Math.cos(time) * drift * dt;

      if (sp.position.y > 0.7) {
        sp.position.y = 0.1;
        sp.position.x = (Math.random() - 0.5) * 0.12;
        sp.position.z = (Math.random() - 0.5) * 0.12;
      }

      const heightFrac = (sp.position.y - 0.1) / 0.6;
      sp.material.opacity = steamIntensity * 0.18 * (1.0 - heightFrac) * (0.5 + Math.sin(time * 2) * 0.5);
    });
  }

  emptyCup() {
    this.liquidMesh.visible = false;
    this.foamMesh.visible = false;
    this.artMesh.visible = false;
  }
}
