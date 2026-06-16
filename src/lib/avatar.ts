import * as THREE from "three";

export class Avatar {
  public mesh: THREE.SkinnedMesh;
  public skeleton: THREE.Skeleton;
  public bones: THREE.Bone[];

  constructor(height: number = 2.0) {
    // Proportions mapping to preserve identical bone attachment points
    const torsoHeight = height * 0.35;   // 0.70m
    const legHeight = height * 0.48;     // 0.96m
    const neckHeight = height * 0.045;   // 0.09m

    const torsoWidth = height * 0.22;
    const armWidth = height * 0.07;

    // Bone reference heights in world coordinates (feet base at Y = 0)
    const hipsY = legHeight;

    // Create Skeleton Bones
    const hipsBone = new THREE.Bone();
    const spineBone = new THREE.Bone();
    const headBone = new THREE.Bone();
    const leftLegBone = new THREE.Bone();
    const rightLegBone = new THREE.Bone();
    const leftArmBone = new THREE.Bone();
    const rightArmBone = new THREE.Bone();

    hipsBone.name = "hips";
    spineBone.name = "spine";
    headBone.name = "head";
    leftLegBone.name = "leftLeg";
    rightLegBone.name = "rightLeg";
    leftArmBone.name = "leftArm";
    rightArmBone.name = "rightArm";

    // Establish skeleton hierarchy (identical attachment structure)
    hipsBone.add(spineBone);
    spineBone.add(headBone);
    hipsBone.add(leftLegBone);
    hipsBone.add(rightLegBone);
    spineBone.add(leftArmBone);
    spineBone.add(rightArmBone);

    // Set bone bind positions relative to their parents (identical to previous version)
    hipsBone.position.set(0, hipsY, 0);
    spineBone.position.set(0, 0, 0); 
    headBone.position.set(0, torsoHeight + neckHeight, 0); 
    leftLegBone.position.set(-torsoWidth * 0.3, 0, 0); 
    rightLegBone.position.set(torsoWidth * 0.3, 0, 0); 
    leftArmBone.position.set(-torsoWidth * 0.6, torsoHeight - armWidth * 0.5, 0); 
    rightArmBone.position.set(torsoWidth * 0.6, torsoHeight - armWidth * 0.5, 0); 

    this.bones = [hipsBone, spineBone, headBone, leftLegBone, rightLegBone, leftArmBone, rightArmBone];
    this.skeleton = new THREE.Skeleton(this.bones);

    // Build organic geometries according to strict guidelines
    const torsoGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.50, 12);
    torsoGeo.scale(1.3, 1.0, 1.0); // Make wider than deep (elliptical torso)

    const handLeftGeo = new THREE.SphereGeometry(0.045, 16, 16);
    handLeftGeo.scale(1.2, 0.8, 0.9); // Flatten hands

    const handRightGeo = new THREE.SphereGeometry(0.045, 16, 16);
    handRightGeo.scale(1.2, 0.8, 0.9); // Flatten hands

    const footLeftGeo = new THREE.SphereGeometry(0.06, 16, 16);
    footLeftGeo.scale(1.8, 0.6, 1.1); // Foot shape

    const footRightGeo = new THREE.SphereGeometry(0.06, 16, 16);
    footRightGeo.scale(1.8, 0.6, 1.1); // Foot shape

    // Segment specifications with offset coordinates (meters)
    const segments = [
      {
        name: "hips",
        geometry: new THREE.CylinderGeometry(0.14, 0.16, 0.22, 10),
        boneIndex: 0, // hipsBone index
        color: 0x4f46e5, // Indigo/Purple
        offset: new THREE.Vector3(0, 1.10, 0),
      },
      {
        name: "torso",
        geometry: torsoGeo,
        boneIndex: 1, // spineBone index
        color: 0xff4444, // Red
        offset: new THREE.Vector3(0, 1.35, 0),
      },
      {
        name: "neck",
        geometry: new THREE.CylinderGeometry(0.05, 0.06, 0.10, 12),
        boneIndex: 1, // spineBone index (neck attaches to spine)
        color: 0xf97316, // Orange
        offset: new THREE.Vector3(0, 1.65, 0),
      },
      {
        name: "head",
        geometry: new THREE.SphereGeometry(0.12, 16, 16),
        boneIndex: 2, // headBone index
        color: 0x44ff44, // Green
        offset: new THREE.Vector3(0, 1.82, 0),
      },
      {
        name: "leftUpperArm",
        geometry: new THREE.CylinderGeometry(0.04, 0.035, 0.28, 8),
        boneIndex: 5, // leftArmBone index
        color: 0xeab308, // Yellow
        offset: new THREE.Vector3(-0.28, 1.46, 0),
      },
      {
        name: "rightUpperArm",
        geometry: new THREE.CylinderGeometry(0.04, 0.035, 0.28, 8),
        boneIndex: 6, // rightArmBone index
        color: 0xeab308, // Yellow
        offset: new THREE.Vector3(0.28, 1.46, 0),
      },
      {
        name: "leftLowerArm",
        geometry: new THREE.CylinderGeometry(0.035, 0.03, 0.26, 8),
        boneIndex: 5, // leftArmBone index
        color: 0x84cc16, // Lime
        offset: new THREE.Vector3(-0.32, 1.19, 0),
      },
      {
        name: "rightLowerArm",
        geometry: new THREE.CylinderGeometry(0.035, 0.03, 0.26, 8),
        boneIndex: 6, // rightArmBone index
        color: 0x84cc16, // Lime
        offset: new THREE.Vector3(0.32, 1.19, 0),
      },
      {
        name: "leftHand",
        geometry: handLeftGeo,
        boneIndex: 5, // leftArmBone index
        color: 0x06b6d4, // Cyan
        offset: new THREE.Vector3(-0.34, 1.024, 0),
      },
      {
        name: "rightHand",
        geometry: handRightGeo,
        boneIndex: 6, // rightArmBone index
        color: 0x06b6d4, // Cyan
        offset: new THREE.Vector3(0.34, 1.024, 0),
      },
      {
        name: "leftUpperLeg",
        geometry: new THREE.CylinderGeometry(0.07, 0.055, 0.40, 8),
        boneIndex: 3, // leftLegBone index
        color: 0x3b82f6, // Blue
        offset: new THREE.Vector3(-0.08, 0.79, 0),
      },
      {
        name: "rightUpperLeg",
        geometry: new THREE.CylinderGeometry(0.07, 0.055, 0.40, 8),
        boneIndex: 4, // rightLegBone index
        color: 0x3b82f6, // Blue
        offset: new THREE.Vector3(0.08, 0.79, 0),
      },
      {
        name: "leftLowerLeg",
        geometry: new THREE.CylinderGeometry(0.055, 0.04, 0.38, 8),
        boneIndex: 3, // leftLegBone index
        color: 0x0ea5e9, // Sky
        offset: new THREE.Vector3(-0.09, 0.40, 0),
      },
      {
        name: "rightLowerLeg",
        geometry: new THREE.CylinderGeometry(0.055, 0.04, 0.38, 8),
        boneIndex: 4, // rightLegBone index
        color: 0x0ea5e9, // Sky
        offset: new THREE.Vector3(0.09, 0.40, 0),
      },
      {
        name: "leftFoot",
        geometry: footLeftGeo,
        boneIndex: 3, // leftLegBone index
        color: 0x8b5cf6, // Violet
        offset: new THREE.Vector3(-0.09, 0.174, 0.06), // forward-facing foot offset
      },
      {
        name: "rightFoot",
        geometry: footRightGeo,
        boneIndex: 4, // rightLegBone index
        color: 0x8b5cf6, // Violet
        offset: new THREE.Vector3(0.09, 0.174, 0.06), // forward-facing foot offset
      }
    ];

    // Merge geometries and inject skinIndex / skinWeight attributes
    const mergedPositions: number[] = [];
    const mergedNormals: number[] = [];
    const mergedUvs: number[] = [];
    const mergedSkinIndices: number[] = [];
    const mergedSkinWeights: number[] = [];
    const mergedIndices: number[] = [];

    const materials: THREE.MeshStandardMaterial[] = [];
    const groups: { start: number; count: number; materialIndex: number }[] = [];

    let vertexOffset = 0;
    let indexOffset = 0;

    const SmoothShadingVal = (THREE as any).SmoothShading ?? 1;

    segments.forEach((seg, idx) => {
      const geom = seg.geometry;
      const boneIdx = seg.boneIndex;

      // Translate geometry vertices to bind pose position
      geom.translate(seg.offset.x, seg.offset.y, seg.offset.z);

      const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
      const normAttr = geom.getAttribute("normal") as THREE.BufferAttribute;
      const uvAttr = geom.getAttribute("uv") as THREE.BufferAttribute;
      const indexAttr = geom.index;

      const vertexCount = posAttr.count;

      for (let i = 0; i < vertexCount; i++) {
        mergedPositions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        mergedNormals.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i));
        mergedUvs.push(uvAttr.getX(i), uvAttr.getY(i));

        // Bone bindings (rigged to target boneIndex)
        mergedSkinIndices.push(boneIdx, 0, 0, 0);
        mergedSkinWeights.push(1.0, 0.0, 0.0, 0.0);
      }

      let indexCount = 0;
      if (indexAttr) {
        indexCount = indexAttr.count;
        for (let i = 0; i < indexCount; i++) {
          mergedIndices.push(indexAttr.getX(i) + vertexOffset);
        }
      } else {
        indexCount = vertexCount;
        for (let i = 0; i < indexCount; i++) {
          mergedIndices.push(i + vertexOffset);
        }
      }

      // Group range for multi-material debug colors
      groups.push({
        start: indexOffset,
        count: indexCount,
        materialIndex: idx
      });

      // Construct a material with smooth shading and skinning support
      const material = new THREE.MeshStandardMaterial({
        color: seg.color,
        roughness: 0.5,
        metalness: 0.15,
        flatShading: false,
      });

      // Inject the required smoothShading setting
      (material as any).smoothShading = SmoothShadingVal;

      materials.push(material);

      vertexOffset += vertexCount;
      indexOffset += indexCount;

      geom.dispose();
    });

    const mergedGeometry = new THREE.BufferGeometry();
    mergedGeometry.setAttribute("position", new THREE.Float32BufferAttribute(mergedPositions, 3));
    mergedGeometry.setAttribute("normal", new THREE.Float32BufferAttribute(mergedNormals, 3));
    mergedGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(mergedUvs, 2));
    mergedGeometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(mergedSkinIndices, 4));
    mergedGeometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(mergedSkinWeights, 4));
    mergedGeometry.setIndex(mergedIndices);

    // Apply groups for material assignment
    groups.forEach(group => {
      mergedGeometry.addGroup(group.start, group.count, group.materialIndex);
    });

    // Create the SkinnedMesh and bind skeleton
    this.mesh = new THREE.SkinnedMesh(mergedGeometry, materials);
    this.mesh.add(hipsBone); 
    this.mesh.bind(this.skeleton);

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  /**
   * Directly sets rotation of specific skeleton joints
   */
  public rotateJoint(jointName: "hips" | "spine" | "head" | "leftLeg" | "rightLeg" | "leftArm" | "rightArm", x: number, y: number, z: number) {
    const bone = this.bones.find(b => b.name === jointName);
    if (bone) {
      bone.rotation.set(x, y, z);
    }
  }

  /**
   * Resets joints rotation to default bind pose (T-Pose)
   */
  public resetPose() {
    this.bones.forEach(b => b.rotation.set(0, 0, 0));
  }
}
