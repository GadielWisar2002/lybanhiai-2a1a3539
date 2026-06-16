import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Avatar } from "@/lib/avatar";
import { toast } from "sonner";
import { Play, Pause, RotateCcw, Save, Sliders, Sparkles, User, Settings, Info } from "lucide-react";

interface AvatarConfig {
  height: number;
  animation: "none" | "walk" | "wave" | "dance";
  jointRotations: {
    head: { x: number; y: number; z: number };
    spine: { x: number; y: number; z: number };
    leftArm: { x: number; y: number; z: number };
    rightArm: { x: number; y: number; z: number };
    leftLeg: { x: number; y: number; z: number };
    rightLeg: { x: number; y: number; z: number };
  };
}

export const AvatarCustomizer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const avatarRef = useRef<Avatar | null>(null);

  // States
  const [height, setHeight] = useState<number>(2.0);
  const [animation, setAnimation] = useState<"none" | "walk" | "wave" | "dance">("none");
  const [speed, setSpeed] = useState<number>(1.0);
  
  // Joint rotation states (in radians, range -Math.PI/2 to Math.PI/2)
  const [headY, setHeadY] = useState<number>(0);
  const [headX, setHeadX] = useState<number>(0);
  const [spineX, setSpineX] = useState<number>(0);
  const [leftArmZ, setLeftArmZ] = useState<number>(0);
  const [leftArmX, setLeftArmX] = useState<number>(0);
  const [rightArmZ, setRightArmZ] = useState<number>(0);
  const [rightArmX, setRightArmX] = useState<number>(0);
  const [leftLegX, setLeftLegX] = useState<number>(0);
  const [rightLegX, setRightLegX] = useState<number>(0);

  // We use refs for rotations to update Three.js bones directly inside the animation loop
  // without triggering continuous component re-renders that would disrupt canvas rendering.
  const rotationsRef = useRef({
    headY, headX, spineX, leftArmZ, leftArmX, rightArmZ, rightArmX, leftLegX, rightLegX, animation, speed
  });

  useEffect(() => {
    rotationsRef.current = {
      headY, headX, spineX, leftArmZ, leftArmX, rightArmZ, rightArmX, leftLegX, rightLegX, animation, speed
    };
  }, [headY, headX, spineX, leftArmZ, leftArmX, rightArmZ, rightArmX, leftLegX, rightLegX, animation, speed]);

  // Load configuration from local storage
  useEffect(() => {
    const saved = localStorage.getItem("lybanhi_custom_avatar_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AvatarConfig;
        if (parsed.height) setHeight(parsed.height);
        if (parsed.animation) setAnimation(parsed.animation);
        if (parsed.jointRotations) {
          const rot = parsed.jointRotations;
          setHeadY(rot.head.y);
          setHeadX(rot.head.x);
          setSpineX(rot.spine.x);
          setLeftArmZ(rot.leftArm.z);
          setLeftArmX(rot.leftArm.x);
          setRightArmZ(rot.rightArm.z);
          setRightArmX(rot.rightArm.x);
          setLeftLegX(rot.leftLeg.x);
          setRightLegX(rot.rightLeg.x);
        }
      } catch (e) {
        console.error("Error loading avatar config", e);
      }
    }
  }, []);

  // Three.js Lifecycle
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const heightVal = containerRef.current.clientHeight || 450;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0f1d); // Sleek cyber-dark blue background
    scene.fog = new THREE.FogExp2(0x0c0f1d, 0.15);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / heightVal, 0.1, 100);
    camera.position.set(0, 1.4, 4.0); // Focus on avatar chest/face height
    camera.lookAt(0, 1.0, 0);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, heightVal);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 15;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xa855f7, 2, 8); // Vibrant purple neon accent light
    pointLight.position.set(-2, 1.5, 1);
    scene.add(pointLight);

    // 5. Floor grid and helper
    const gridHelper = new THREE.GridHelper(10, 20, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x070913, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 6. Spawn Avatar SkinnedMesh
    const avatar = new Avatar(height);
    avatarRef.current = avatar;
    scene.add(avatar.mesh);

    // Bone reference guides for visualization
    const skeletonHelper = new THREE.SkeletonHelper(avatar.mesh);
    skeletonHelper.visible = false;
    scene.add(skeletonHelper);

    // 7. Animation Loop
    let lastTime = Date.now();
    let clock = 0;
    let animationId: number;

    const tick = () => {
      animationId = requestAnimationFrame(tick);
      
      const currentTime = Date.now();
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const currentRot = rotationsRef.current;
      clock += dt * currentRot.speed;

      // Reset base bones to start posing/animating
      avatar.resetPose();

      // Apply animations or manual joint angles
      if (currentRot.animation === "walk") {
        const swing = Math.sin(clock * 5);
        // Legs swing forwards/backwards
        avatar.rotateJoint("leftLeg", swing * 0.5, 0, 0);
        avatar.rotateJoint("rightLeg", -swing * 0.5, 0, 0);
        // Arms swing opposite to legs
        avatar.rotateJoint("leftArm", -swing * 0.5, 0, 0);
        avatar.rotateJoint("rightArm", swing * 0.5, 0, 0);
        // Hips sway side to side slightly
        avatar.rotateJoint("hips", 0, 0, Math.sin(clock * 5) * 0.05);
        // Spine counter-rotates
        avatar.rotateJoint("spine", Math.abs(swing) * 0.05, 0, -Math.sin(clock * 5) * 0.03);
      } else if (currentRot.animation === "wave") {
        // Salute pose: raise right arm and wave
        avatar.rotateJoint("rightArm", 0, 0, -Math.PI / 2.5); // raise arm
        avatar.rotateJoint("rightArm", Math.sin(clock * 10) * 0.3, 0, -Math.PI / 2.5); // wave back and forth
        avatar.rotateJoint("leftArm", 0, 0, 0.1); // rest left arm slightly out
        avatar.rotateJoint("head", 0, Math.sin(clock * 3) * 0.1, 0); // look around slightly
      } else if (currentRot.animation === "dance") {
        // Groovy body dance
        const hipBob = Math.sin(clock * 6);
        const shoulderBob = Math.cos(clock * 6);
        
        avatar.rotateJoint("hips", 0, hipBob * 0.2, hipBob * 0.1);
        avatar.rotateJoint("spine", shoulderBob * 0.1, -hipBob * 0.1, 0);
        
        avatar.rotateJoint("leftArm", Math.sin(clock * 3) * 0.5, 0, Math.cos(clock * 3) * 0.5);
        avatar.rotateJoint("rightArm", Math.cos(clock * 3) * 0.5, 0, Math.sin(clock * 3) * 0.5);
        avatar.rotateJoint("leftLeg", hipBob * 0.2, 0, 0);
        avatar.rotateJoint("rightLeg", -hipBob * 0.2, 0, 0);
        avatar.rotateJoint("head", Math.sin(clock * 6) * 0.1, Math.cos(clock * 3) * 0.2, 0);
      } else {
        // "none" - Manual Posing Mode
        avatar.rotateJoint("head", currentRot.headX, currentRot.headY, 0);
        avatar.rotateJoint("spine", currentRot.spineX, 0, 0);
        avatar.rotateJoint("leftArm", currentRot.leftArmX, 0, currentRot.leftArmZ);
        avatar.rotateJoint("rightArm", currentRot.rightArmX, 0, currentRot.rightArmZ);
        avatar.rotateJoint("leftLeg", currentRot.leftLegX, 0, 0);
        avatar.rotateJoint("rightLeg", currentRot.rightLegX, 0, 0);
      }

      // Rotate whole mesh slowly in viewer for dynamic display
      avatar.mesh.rotation.y += 0.3 * dt;

      // Update renderer sizes and aspect
      if (canvasRef.current) {
        camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      }
    };
    tick();

    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, [height]);

  const handleReset = () => {
    setHeadY(0);
    setHeadX(0);
    setSpineX(0);
    setLeftArmZ(0);
    setLeftArmX(0);
    setRightArmZ(0);
    setRightArmX(0);
    setLeftLegX(0);
    setRightLegX(0);
    setAnimation("none");
    toast.success("Pose restablecida al estado original (T-Pose)");
  };

  const handleSave = () => {
    const config: AvatarConfig = {
      height,
      animation,
      jointRotations: {
        head: { x: headX, y: headY, z: 0 },
        spine: { x: spineX, y: 0, z: 0 },
        leftArm: { x: leftArmX, y: 0, z: leftArmZ },
        rightArm: { x: rightArmX, y: 0, z: rightArmZ },
        leftLeg: { x: leftLegX, y: 0, z: 0 },
        rightLeg: { x: rightLegX, y: 0, z: 0 },
      }
    };
    localStorage.setItem("lybanhi_custom_avatar_config", JSON.stringify(config));
    toast.success("¡Avatar y pose guardados con éxito! ✨");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-6xl mx-auto p-4 lg:p-6 bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
      
      {/* Background neon ambient glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* 3D Viewer Container (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-4 bg-slate-900/60 backdrop-blur border border-slate-800/80 p-4 rounded-2xl relative" ref={containerRef}>
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="size-5 text-purple-400" />
            <h3 className="font-display font-bold text-lg">Visor 3D del Avatar</h3>
          </div>
          <span className="text-xs font-mono bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-full text-slate-300">
            Three.js SkinnedMesh
          </span>
        </div>

        {/* The 3D Canvas */}
        <div className="relative w-full h-[380px] lg:h-[450px] bg-slate-950/80 rounded-xl overflow-hidden border border-slate-900 shadow-inner flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
          
          {/* Debug Color Code Overlay */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-lg text-[10px] space-y-1 backdrop-blur shadow-lg">
            <p className="font-bold text-slate-400 mb-1 border-b border-slate-800 pb-0.5">Segmentos Orgánicos</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-medium text-slate-300">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded bg-[#44ff44]" /> Cabeza (Esfera)</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded bg-[#f97316]" /> Cuello (Cilindro)</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded bg-[#ff4444]" /> Torso (Cilindro Elíp.)</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded bg-[#4f46e5]" /> Caderas (Cilindro)</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded bg-[#eab308]" /> Brazos (Cilindros)</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded bg-[#06b6d4]" /> Manos (Esferas)</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded bg-[#3b82f6]" /> Piernas (Cilindros)</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded bg-[#8b5cf6]" /> Pies (Esferas)</span>
            </div>
          </div>
        </div>

        {/* Preset Animation Selector */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          {(["none", "walk", "wave", "dance"] as const).map((anim) => (
            <button
              key={anim}
              onClick={() => setAnimation(anim)}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                animation === anim
                  ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/25 scale-[1.02]"
                  : "bg-slate-800/40 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {anim === "none" && <Pause className="size-3.5" />}
              {anim === "walk" && <Play className="size-3.5" />}
              {anim === "wave" && <Sparkles className="size-3.5" />}
              {anim === "dance" && <Sparkles className="size-3.5" />}
              {anim === "none" ? "Pausar" : anim === "walk" ? "Caminar" : anim === "wave" ? "Saludar" : "Bailar"}
            </button>
          ))}
        </div>
      </div>

      {/* Control Panel (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-5 bg-slate-900/40 backdrop-blur border border-slate-800/80 p-5 rounded-2xl">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Sliders className="size-5 text-purple-400" />
          <h3 className="font-display font-bold text-lg">Panel de Rigging</h3>
        </div>

        {/* Global properties */}
        <div className="space-y-3">
          <label className="flex justify-between items-center text-xs font-bold text-slate-300">
            <span>Estatura (Metros)</span>
            <span className="text-purple-400 font-mono text-sm font-black">{height.toFixed(2)} m</span>
          </label>
          <input
            type="range"
            min="1.40"
            max="2.50"
            step="0.05"
            value={height}
            onChange={(e) => setHeight(parseFloat(e.target.value))}
            className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 leading-normal flex items-start gap-1">
            <Info className="size-3 shrink-0 mt-0.5 text-slate-400" />
            <span>Escala automáticamente los huesos y volúmenes de malla respetando el canon de 8 cabezas.</span>
          </p>
        </div>

        {/* Joints adjustment - only visible in pose mode */}
        {animation === "none" ? (
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-800">
            
            {/* Cabeza */}
            <div className="bg-slate-800/30 border border-slate-800/60 p-3 rounded-xl space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-2 border-[#44ff44] pl-2">Cabeza</p>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-300">Rotación Lateral (Yaw)</span>
                  <span className="text-purple-400 font-mono">{Math.round(headY * 57.29)}°</span>
                </div>
                <input
                  type="range" min="-1.2" max="1.2" step="0.05" value={headY}
                  onChange={(e) => setHeadY(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-900 h-1 rounded appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-300">Rotación Vertical (Pitch)</span>
                  <span className="text-purple-400 font-mono">{Math.round(headX * 57.29)}°</span>
                </div>
                <input
                  type="range" min="-0.6" max="0.6" step="0.05" value={headX}
                  onChange={(e) => setHeadX(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-900 h-1 rounded appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Torso */}
            <div className="bg-slate-800/30 border border-slate-800/60 p-3 rounded-xl space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-2 border-[#ff4444] pl-2">Torso</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-300">Inclinación (Spine)</span>
                  <span className="text-purple-400 font-mono">{Math.round(spineX * 57.29)}°</span>
                </div>
                <input
                  type="range" min="-0.4" max="0.8" step="0.05" value={spineX}
                  onChange={(e) => setSpineX(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-900 h-1 rounded appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Brazos */}
            <div className="bg-slate-800/30 border border-slate-800/60 p-3 rounded-xl space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-2 border-[#ff44ff] pl-2">Brazos (Hombros)</p>
              
              {/* Brazo Izquierdo */}
              <div className="space-y-2 border-b border-slate-800/60 pb-2.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-300">Separar Brazo Izquierdo</span>
                  <span className="text-purple-400 font-mono">{Math.round(leftArmZ * 57.29)}°</span>
                </div>
                <input
                  type="range" min="-1.5" max="0.5" step="0.05" value={leftArmZ}
                  onChange={(e) => setLeftArmZ(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-900 h-1 rounded appearance-none cursor-pointer"
                />
              </div>

              {/* Brazo Derecho */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-300">Separar Brazo Derecho</span>
                  <span className="text-purple-400 font-mono">{Math.round(rightArmZ * -57.29)}°</span>
                </div>
                <input
                  type="range" min="-0.5" max="1.5" step="0.05" value={rightArmZ}
                  onChange={(e) => setRightArmZ(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-900 h-1 rounded appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Piernas */}
            <div className="bg-slate-800/30 border border-slate-800/60 p-3 rounded-xl space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-2 border-[#4444ff] pl-2">Piernas (Cadera)</p>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-300">Avanzar Pierna Izquierda</span>
                  <span className="text-purple-400 font-mono">{Math.round(leftLegX * 57.29)}°</span>
                </div>
                <input
                  type="range" min="-0.8" max="0.8" step="0.05" value={leftLegX}
                  onChange={(e) => setLeftLegX(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-900 h-1 rounded appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-300">Avanzar Pierna Derecha</span>
                  <span className="text-purple-400 font-mono">{Math.round(rightLegX * 57.29)}°</span>
                </div>
                <input
                  type="range" min="-0.8" max="0.8" step="0.05" value={rightLegX}
                  onChange={(e) => setRightLegX(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-900 h-1 rounded appearance-none cursor-pointer"
                />
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center p-6 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl space-y-3 text-center">
            <Settings className="size-8 text-purple-400/80 animate-spin-slow" />
            <div>
              <p className="text-sm font-semibold text-slate-200">Animación Activa</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                Los controles de rigging manual están desactivados mientras se reproduce una animación en bucle.
              </p>
            </div>
            
            {/* Speed slider during animation */}
            <div className="w-full max-w-[200px] pt-4 space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>Velocidad de Animación</span>
                <span>{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range" min="0.2" max="2.0" step="0.1" value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-purple-500 bg-slate-900 h-1 rounded appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
          <button
            onClick={handleReset}
            className="h-11 border border-slate-700 bg-slate-800/30 hover:bg-slate-800 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="size-4" />
            Restablecer
          </button>
          <button
            onClick={handleSave}
            className="h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save className="size-4" />
            Guardar Pose
          </button>
        </div>
      </div>
    </div>
  );
};
