import * as THREE from "three";
import { getTerrainHeight } from "./WorldGenerator";

export interface PlacedBlock {
  type: "brick" | "wood" | "glass" | "roof" | "concrete" | "steel" | "marble" | "asphalt" | "solar";
  x: number;
  y: number;
  z: number;
  rotation: number; // 0, 90, 180, 270 degrees (in radians: 0, PI/2, PI, 3PI/2)
  scale: number;    // 1, 2, 3
}

export class ConstructionSystem {
  scene: THREE.Scene;
  instancedBlocks: Map<string, THREE.InstancedMesh> = new Map();
  placedBlocks: PlacedBlock[] = [];
  previewMesh: THREE.Mesh | null = null;

  // Material Palette colors
  private materialsConfig = {
    brick: { color: 0xc62828, emissive: 0x000000 },
    wood: { color: 0x8d6e63, emissive: 0x000000 },
    glass: { color: 0xe0f7fa, transparent: true, opacity: 0.5, emissive: 0x000000 },
    roof: { color: 0x3e2723, emissive: 0x000000 },
    concrete: { color: 0xb0bec5, emissive: 0x000000 },
    steel: { color: 0x37474f, emissive: 0x000000 },
    marble: { color: 0xf5f5f5, emissive: 0x000000 },
    asphalt: { color: 0x212121, emissive: 0x000000 },
    solar: { color: 0x1a237e, emissive: 0x00e5ff } // Glowing solar blue
  };

  constructor(scene: THREE.Scene, initialBlocks: PlacedBlock[]) {
    this.scene = scene;
    this.placedBlocks = initialBlocks;
    this.initInstancedMeshes();
    this.rebuildInstances();
  }

  private initInstancedMeshes() {
    const geom = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    
    Object.keys(this.materialsConfig).forEach(key => {
      const config = this.materialsConfig[key as keyof typeof this.materialsConfig];
      const mat = new THREE.MeshLambertMaterial({
        color: config.color,
        transparent: (config as any).transparent || false,
        opacity: (config as any).opacity !== undefined ? (config as any).opacity : 1.0,
        emissive: config.emissive
      });

      // Spawn InstancedMesh for max 2000 instances per type
      const instancedMesh = new THREE.InstancedMesh(geom, mat, 2000);
      instancedMesh.count = 0;
      instancedMesh.frustumCulled = true;
      
      this.scene.add(instancedMesh);
      this.instancedBlocks.set(key, instancedMesh);
    });
  }

  rebuildInstances() {
    // Group placed blocks by type
    const grouped: Record<string, PlacedBlock[]> = {};
    Object.keys(this.materialsConfig).forEach(k => { grouped[k] = []; });

    this.placedBlocks.forEach(b => {
      if (grouped[b.type]) {
        grouped[b.type].push(b);
      }
    });

    // Update InstancedMesh matrices
    const dummy = new THREE.Object3D();
    this.instancedBlocks.forEach((mesh, type) => {
      const blocks = grouped[type] || [];
      mesh.count = blocks.length;

      blocks.forEach((b, idx) => {
        dummy.position.set(b.x, b.y, b.z);
        dummy.rotation.set(0, b.rotation, 0);
        dummy.scale.set(b.scale, b.scale, b.scale);
        dummy.updateMatrix();
        
        mesh.setMatrixAt(idx, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  }

  // CREATE OR MOVE THE GHOST PREVIEW HOLOGRAM IN FRONT OF PLAYER
  updatePreview(playerPos: THREE.Vector3, cameraYaw: number, type: PlacedBlock["type"], activeRotation: number, activeScale: number) {
    if (!this.previewMesh) {
      const geom = new THREE.BoxGeometry(1.0, 1.0, 1.0);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.4
      });
      this.previewMesh = new THREE.Mesh(geom, mat);
      this.scene.add(this.previewMesh);
    }

    // Snap target grid coords in front of player
    const bx = Math.round(playerPos.x - Math.sin(cameraYaw) * 3.5);
    const bz = Math.round(playerPos.z - Math.cos(cameraYaw) * 3.5);
    const by = Math.round(getTerrainHeight(bx, bz) + 0.5);

    this.previewMesh.position.set(bx, by, bz);
    this.previewMesh.rotation.set(0, activeRotation, 0);
    this.previewMesh.scale.set(activeScale, activeScale, activeScale);
    this.previewMesh.visible = true;
  }

  hidePreview() {
    if (this.previewMesh) {
      this.previewMesh.visible = false;
    }
  }

  placeBlock(playerPos: THREE.Vector3, cameraYaw: number, type: PlacedBlock["type"], rotation: number, scale: number): PlacedBlock {
    const bx = Math.round(playerPos.x - Math.sin(cameraYaw) * 3.5);
    const bz = Math.round(playerPos.z - Math.cos(cameraYaw) * 3.5);
    const by = Math.round(getTerrainHeight(bx, bz) + 0.5);

    const newBlock: PlacedBlock = {
      type,
      x: bx,
      y: by,
      z: bz,
      rotation,
      scale
    };

    this.placedBlocks.push(newBlock);
    this.rebuildInstances();
    return newBlock;
  }

  deleteBlockAt(playerPos: THREE.Vector3, cameraYaw: number): boolean {
    const bx = Math.round(playerPos.x - Math.sin(cameraYaw) * 3.5);
    const bz = Math.round(playerPos.z - Math.cos(cameraYaw) * 3.5);
    const by = Math.round(getTerrainHeight(bx, bz) + 0.5);

    const index = this.placedBlocks.findIndex(b => b.x === bx && b.z === bz);
    if (index >= 0) {
      this.placedBlocks.splice(index, 1);
      this.rebuildInstances();
      return true;
    }
    return false;
  }

  duplicateBlockAt(playerPos: THREE.Vector3, cameraYaw: number): PlacedBlock | null {
    const bx = Math.round(playerPos.x - Math.sin(cameraYaw) * 3.5);
    const bz = Math.round(playerPos.z - Math.cos(cameraYaw) * 3.5);
    
    // Find target block at horizontal coordinate
    const target = this.placedBlocks.find(b => b.x === bx && b.z === bz);
    return target || null;
  }

  dispose() {
    this.instancedBlocks.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.dispose();
    });
    this.instancedBlocks.clear();
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      this.previewMesh.geometry.dispose();
      (this.previewMesh.material as THREE.Material).dispose();
      this.previewMesh = null;
    }
  }
}
