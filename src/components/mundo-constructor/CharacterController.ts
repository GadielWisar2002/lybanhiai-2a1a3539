import * as THREE from "three";
import { getTerrainHeight } from "./WorldGenerator";

export class CharacterController {
  playerGroup: THREE.Group;
  velocity: THREE.Vector3 = new THREE.Vector3();
  isGrounded: boolean = true;
  keys: Record<string, boolean> = {};

  constructor(playerGroup: THREE.Group) {
    this.playerGroup = playerGroup;
    this.initListeners();
  }

  private initListeners() {
    const handleKeyDown = (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
  }

  update(dt: number, cameraYaw: number, placedBlocks: any[], ridingVehicle: boolean) {
    if (ridingVehicle) return; // Physics handled by vehicle

    let moveX = 0;
    let moveZ = 0;

    if (this.keys["w"] || this.keys["arrowup"]) moveZ = 1;
    if (this.keys["s"] || this.keys["arrowdown"]) moveZ = -1;
    if (this.keys["a"] || this.keys["arrowleft"]) moveX = 1;
    if (this.keys["d"] || this.keys["arrowright"]) moveX = -1;

    const moveDir = new THREE.Vector3(moveX, 0, moveZ).normalize();
    moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);

    const isRunning = this.keys["shift"];
    const speed = isRunning ? 16.0 : 8.5;

    this.velocity.x = moveDir.x * speed;
    this.velocity.z = moveDir.z * speed;

    // Gravity application
    if (!this.isGrounded) {
      this.velocity.y -= 28.0 * dt;
    }

    this.playerGroup.position.x += this.velocity.x * dt;
    this.playerGroup.position.z += this.velocity.z * dt;
    this.playerGroup.position.y += this.velocity.y * dt;

    // Colisión Y con Bloques colocados y Terreno
    let groundHeight = getTerrainHeight(this.playerGroup.position.x, this.playerGroup.position.z);

    // Check custom blocks below player
    placedBlocks.forEach((block: any) => {
      const dx = Math.abs(block.x - this.playerGroup.position.x);
      const dz = Math.abs(block.z - this.playerGroup.position.z);
      // If player is directly inside the 1x1 area of the block
      if (dx < 0.8 && dz < 0.8) {
        const blockTop = block.y + 0.5; // Top face of the block
        // If player is falling or walking near the top of the block, support stand-on
        if (this.playerGroup.position.y >= blockTop - 0.6) {
          if (blockTop > groundHeight) {
            groundHeight = blockTop;
          }
        }
      }
    });

    if (this.playerGroup.position.y <= groundHeight) {
      this.playerGroup.position.y = groundHeight;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Jump execution
    if (this.keys[" "] && this.isGrounded) {
      this.velocity.y = 11.0;
      this.isGrounded = false;
    }

    // Rotation of player model to face movement direction
    if (moveX !== 0 || moveZ !== 0) {
      this.playerGroup.rotation.y = Math.atan2(moveDir.x, moveDir.z);
    }
  }

  dispose() {
    // No explicit teardown needed, listeners can persist or be cleaned up if required
  }
}
