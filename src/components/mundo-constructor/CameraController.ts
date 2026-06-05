import * as THREE from "three";

export class CameraController {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLCanvasElement;
  
  yaw: number = 0.78; // 45 degrees
  pitch: number = 0.6;
  zoom: number = 14.0;
  isFirstPerson: boolean = false;
  isDragging: boolean = false;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLCanvasElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.initListeners();
  }

  private initListeners() {
    const onMouseDown = () => {
      this.isDragging = true;
    };

    const onMouseUp = () => {
      this.isDragging = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (this.isDragging) {
        this.yaw -= e.movementX * 0.007;
        this.pitch = Math.max(0.1, Math.min(Math.PI / 2.2, this.pitch + e.movementY * 0.007));
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (this.isFirstPerson) return;
      this.zoom = Math.max(4.0, Math.min(45.0, this.zoom + e.deltaY * 0.02));
    };

    this.domElement.addEventListener("mousedown", onMouseDown);
    this.domElement.addEventListener("mouseup", onMouseUp);
    this.domElement.addEventListener("mousemove", onMouseMove);
    this.domElement.addEventListener("wheel", onWheel, { passive: true });
  }

  toggleViewMode() {
    this.isFirstPerson = !this.isFirstPerson;
    if (this.isFirstPerson) {
      this.zoom = 0.1;
      this.pitch = 0.1;
    } else {
      this.zoom = 14.0;
      this.pitch = 0.6;
    }
  }

  update(playerPos: THREE.Vector3, playerRotationY: number) {
    if (this.isFirstPerson) {
      // First Person: Camera placed exactly at eye level looking forward
      this.camera.position.set(
        playerPos.x,
        playerPos.y + 1.45,
        playerPos.z
      );
      const lookTarget = new THREE.Vector3(
        playerPos.x - Math.sin(this.yaw),
        playerPos.y + 1.45 - Math.sin(this.pitch),
        playerPos.z - Math.cos(this.yaw)
      );
      this.camera.lookAt(lookTarget);
    } else {
      // Third Person: Camera follows the player with distance
      const targetCamPos = new THREE.Vector3(
        playerPos.x + this.zoom * Math.sin(this.yaw) * Math.cos(this.pitch),
        playerPos.y + this.zoom * Math.sin(this.pitch) + 1.2,
        playerPos.z + this.zoom * Math.cos(this.yaw) * Math.cos(this.pitch)
      );
      
      this.camera.position.lerp(targetCamPos, 0.15);
      this.camera.lookAt(playerPos.clone().add(new THREE.Vector3(0, 1.0, 0)));
    }
  }
}
