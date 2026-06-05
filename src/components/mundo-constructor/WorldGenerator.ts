import * as THREE from "three";

export const CHUNK_SIZE = 64;
export const MAX_ACTIVE_CHUNKS = 9;

// 1. DETERMINISTIC HEIGHTMAP
export function getTerrainHeight(x: number, z: number): number {
  const distFromCenter = Math.sqrt(x * x + z * z);
  
  // Ocean / Central Lake
  const lakeDist = Math.sqrt(x * x + (z + 200) * (z + 200));
  let lakeDepth = 0;
  if (lakeDist < 300) {
    const factor = lakeDist / 300;
    lakeDepth = (1 - Math.cos(factor * Math.PI)) * 8 - 16;
  }

  // Winding River
  const riverX = Math.sin(z / 150) * 150;
  const distToRiver = Math.abs(x - riverX);
  let riverDepth = 0;
  if (distToRiver < 60 && distFromCenter < 900) {
    const factor = distToRiver / 60;
    riverDepth = (1 - Math.cos(factor * Math.PI)) * 6 - 12;
  }

  // Mountains
  let mountainHeight = 0;
  if (distFromCenter > 750) {
    const factor = (distFromCenter - 750) / 250;
    mountainHeight = Math.pow(Math.max(0, factor), 1.8) * 80;
  }

  // Noise
  let noise = Math.sin(x / 40) * Math.cos(z / 40) * 3;
  if (x < -350 && z < -350) {
    noise += Math.sin(x / 15) * Math.cos(z / 15) * 12 + Math.cos(x / 5) * 4;
  } else if (x > 350 && z > 350) {
    noise += Math.sin(x / 80) * 8;
  }

  const base = noise + mountainHeight;
  const waterInterference = Math.min(lakeDepth, riverDepth);
  return waterInterference < 0 ? waterInterference : base;
}

// 2. BIOME CALCULATION
export function getBiomeAt(x: number, z: number): "VALLE" | "MONTANA" | "TECNO" | "HISTORICO" | "CAMPUS" | "COSTA" {
  const dist = Math.sqrt(x * x + z * z);
  const lakeDist = Math.sqrt(x * x + (z + 200) * (z + 200));
  if (lakeDist < 320 || dist > 950) return "COSTA";

  if (x < -350 && z < -350) return "MONTANA";
  if (x > 350 && z < -350) return "TECNO";
  if (x < -350 && z > 350) return "VALLE";
  if (x > 350 && z > 350) return "HISTORICO";
  return "CAMPUS";
}

// 3. CHUNK MANAGEMENT
export class Chunk {
  key: string;
  cx: number;
  cz: number;
  mesh: THREE.Mesh;
  trees: THREE.InstancedMesh | null = null;
  rocks: THREE.InstancedMesh | null = null;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    this.key = `${cx},${cz}`;

    // Generate terrain segment
    const geom = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, 8, 8);
    geom.rotateX(-Math.PI / 2);

    const colors: number[] = [];
    const pos = geom.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i) + cx * CHUNK_SIZE;
      const vz = pos.getZ(i) + cz * CHUNK_SIZE;
      const vy = getTerrainHeight(vx, vz);
      
      pos.setX(i, pos.getX(i));
      pos.setY(i, vy);
      pos.setZ(i, pos.getZ(i));

      // Color coding
      const biome = getBiomeAt(vx, vz);
      let r = 0.3, g = 0.7, b = 0.3; // Green grass

      if (vy < -4) {
        r = 0.15; g = 0.25; b = 0.3;
      } else if (vy < 0) {
        r = 0.95; g = 0.85; b = 0.5;
      } else if (biome === "MONTANA") {
        if (vy > 35) {
          r = 0.95; g = 0.95; b = 0.95;
        } else {
          r = 0.55; g = 0.55; b = 0.55;
        }
      } else if (biome === "TECNO") {
        r = 0.18; g = 0.18; b = 0.22;
      } else if (biome === "HISTORICO") {
        r = 0.55; g = 0.45; b = 0.35;
      } else if (biome === "VALLE") {
        r = 0.25; g = 0.65; b = 0.25;
      }
      colors.push(r, g, b);
    }
    
    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.position.set(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE);
    this.mesh.frustumCulled = true;

    // Scatter low poly trees
    this.generateVegetation();
  }

  private generateVegetation() {
    const biome = getBiomeAt(this.cx * CHUNK_SIZE, this.cz * CHUNK_SIZE);
    if (biome === "COSTA" || biome === "TECNO") return;

    // Generate up to 12 trees
    const count = 4 + Math.floor(Math.random() * 8);
    const geomCone = new THREE.ConeGeometry(1.2, 3, 4);
    const matCone = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
    this.trees = new THREE.InstancedMesh(geomCone, matCone, count);
    this.trees.frustumCulled = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const rx = (Math.random() - 0.5) * CHUNK_SIZE;
      const rz = (Math.random() - 0.5) * CHUNK_SIZE;
      const vx = this.cx * CHUNK_SIZE + rx;
      const vz = this.cz * CHUNK_SIZE + rz;
      const vy = getTerrainHeight(vx, vz);

      if (vy > 0) {
        dummy.position.set(rx, vy + 1.5, rz);
        dummy.updateMatrix();
        this.trees.setMatrixAt(i, dummy.matrix);
      }
    }
    this.trees.instanceMatrix.needsUpdate = true;
    this.mesh.add(this.trees);
  }

  dispose() {
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach(m => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
    if (this.trees) this.trees.dispose();
    if (this.rocks) this.rocks.dispose();
  }
}

export class WorldGenerator {
  activeChunks: Map<string, Chunk> = new Map();
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  update(px: number, pz: number) {
    const pcx = Math.round(px / CHUNK_SIZE);
    const pcz = Math.round(pz / CHUNK_SIZE);

    const neededKeys = new Set<string>();

    // Load 3x3 chunks around player
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        const key = `${cx},${cz}`;
        neededKeys.add(key);

        if (!this.activeChunks.has(key)) {
          const chunk = new Chunk(cx, cz);
          this.scene.add(chunk.mesh);
          this.activeChunks.set(key, chunk);
        }
      }
    }

    // Unload far chunks
    this.activeChunks.forEach((chunk, key) => {
      if (!neededKeys.has(key)) {
        this.scene.remove(chunk.mesh);
        chunk.dispose();
        this.activeChunks.delete(key);
      }
    });
  }

  disposeAll() {
    this.activeChunks.forEach(chunk => {
      this.scene.remove(chunk.mesh);
      chunk.dispose();
    });
    this.activeChunks.clear();
  }
}
