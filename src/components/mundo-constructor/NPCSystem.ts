import * as THREE from "three";
import { getTerrainHeight } from "./WorldGenerator";

export interface NPC {
  id: string;
  mesh: THREE.Group;
  role: "Estudiante" | "Profesor" | "Científico" | "Ingeniero";
  vx: number;
  vz: number;
  tx: number;
  tz: number;
  targetTimer: number;
  isSitting: boolean;
  activeActivity: string;
}

export class NPCSystem {
  scene: THREE.Scene;
  npcs: NPC[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.spawnNPCs();
  }

  private spawnNPCs() {
    const roles = ["Estudiante", "Profesor", "Científico", "Ingeniero"] as const;
    const colors = [0xe91e63, 0x9c27b0, 0x00bcd4, 0xffeb3b]; // pink, purple, cyan, yellow
    
    const matSkin = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
    const matPants = new THREE.MeshLambertMaterial({ color: 0x37474f });

    for (let i = 0; i < 24; i++) {
      const roleIdx = i % 4;
      const role = roles[roleIdx];
      const mesh = new THREE.Group();

      // Optimize: primitive low poly humanoid (<200 polygons)
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), matSkin);
      head.position.y = 1.15;
      mesh.add(head);

      // Hat/Accessory based on role
      if (role === "Profesor") {
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), new THREE.MeshLambertMaterial({ color: 0x000000 }));
        cap.position.set(0, 1.35, 0);
        mesh.add(cap);
      } else if (role === "Ingeniero") {
        const hardhat = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.15, 6), new THREE.MeshLambertMaterial({ color: 0xffd54f }));
        hardhat.position.set(0, 1.35, 0);
        mesh.add(hardhat);
      } else if (role === "Científico") {
        const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.8 }));
        goggles.position.set(0, 1.15, 0.18);
        mesh.add(goggles);
      }

      const shirtMat = new THREE.MeshLambertMaterial({ color: colors[roleIdx] });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), shirtMat);
      torso.position.y = 0.65;
      mesh.add(torso);

      const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.18), matPants);
      lLeg.position.set(-0.12, 0.2, 0);
      mesh.add(lLeg);

      const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.18), matPants);
      rLeg.position.set(0.12, 0.2, 0);
      mesh.add(rLeg);

      // Random position on campus center
      const nx = (Math.random() - 0.5) * 400;
      const nz = (Math.random() - 0.5) * 400;
      const ny = getTerrainHeight(nx, nz);
      mesh.position.set(nx, ny, nz);
      mesh.frustumCulled = true;

      this.scene.add(mesh);

      this.npcs.push({
        id: `npc_${i}`,
        mesh,
        role,
        vx: 0,
        vz: 0,
        tx: nx + (Math.random() - 0.5) * 80,
        tz: nz + (Math.random() - 0.5) * 80,
        targetTimer: 100 + Math.random() * 100,
        isSitting: false,
        activeActivity: "Paseando por el campus"
      });
    }
  }

  update(dt: number, timeOfDay: number, structures: any[]) {
    const time = Date.now();

    this.npcs.forEach(npc => {
      // Routines based on time of day
      const isNight = timeOfDay < 40 || timeOfDay > 200;
      const isClassTime = timeOfDay >= 60 && timeOfDay <= 120;

      if (isNight) {
        // Night routine: head towards home or disappear
        npc.activeActivity = "Descansando en residencias";
        npc.isSitting = false;
        // Move towards a dormitory
        const dorms = structures.filter(s => s.type === "dormitorio" && s.status === "completado");
        if (dorms.length > 0) {
          const targetDorm = dorms[0];
          npc.tx = targetDorm.x + (Math.random() - 0.5) * 4;
          npc.tz = targetDorm.z + (Math.random() - 0.5) * 4;
        }
      } else if (isClassTime) {
        // Study routine: enter classrooms
        npc.activeActivity = "Asistiendo a clase";
        const classrooms = structures.filter(s => (s.type === "aula" || s.type === "universidad" || s.type === "computo") && s.status === "completado");
        if (classrooms.length > 0) {
          // Select classroom randomly
          const targetClass = classrooms[Math.floor(Math.random() * classrooms.length)];
          npc.tx = targetClass.x;
          npc.tz = targetClass.z;
          
          const dx = npc.mesh.position.x - targetClass.x;
          const dz = npc.mesh.position.z - targetClass.z;
          if (Math.sqrt(dx*dx + dz*dz) < 3.0) {
            npc.isSitting = true;
            npc.activeActivity = "Estudiando en clase 📚";
          }
        }
      } else {
        // Leisure time: walk in parks or talk
        npc.activeActivity = "Conversando y descansando en áreas verdes";
        npc.isSitting = false;
      }

      if (npc.isSitting) {
        // Animate sitting pose (hide legs or rotate them)
        const lLeg = npc.mesh.children[3] as THREE.Mesh;
        const rLeg = npc.mesh.children[4] as THREE.Mesh;
        if (lLeg && rLeg) {
          lLeg.rotation.x = -Math.PI / 2;
          rLeg.rotation.x = -Math.PI / 2;
        }
        npc.mesh.position.y = getTerrainHeight(npc.mesh.position.x, npc.mesh.position.z) - 0.15;
      } else {
        // Normal walking physics
        const dx = npc.tx - npc.mesh.position.x;
        const dz = npc.tz - npc.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        const lLeg = npc.mesh.children[3] as THREE.Mesh;
        const rLeg = npc.mesh.children[4] as THREE.Mesh;

        if (dist > 1.5) {
          const speed = 2.8 * dt;
          npc.mesh.position.x += (dx / dist) * speed;
          npc.mesh.position.z += (dz / dist) * speed;
          npc.mesh.position.y = getTerrainHeight(npc.mesh.position.x, npc.mesh.position.z);
          npc.mesh.rotation.y = Math.atan2(dx, dz);

          // Limb walking oscillation
          if (lLeg && rLeg) {
            lLeg.rotation.x = Math.sin(time * 0.008) * 0.5;
            rLeg.rotation.x = -Math.sin(time * 0.008) * 0.5;
          }
        } else {
          if (lLeg && rLeg) {
            lLeg.rotation.x = 0;
            rLeg.rotation.x = 0;
          }
          npc.targetTimer -= 1;
          if (npc.targetTimer <= 0) {
            npc.tx = npc.mesh.position.x + (Math.random() - 0.5) * 100;
            npc.tz = npc.mesh.position.z + (Math.random() - 0.5) * 100;
            npc.targetTimer = 150 + Math.random() * 100;
          }
        }
      }
    });
  }

  dispose() {
    this.npcs.forEach(npc => {
      this.scene.remove(npc.mesh);
      // dispose geometries
      npc.mesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.npcs = [];
  }
}
