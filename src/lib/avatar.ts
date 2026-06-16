import * as THREE from "three";

export class Avatar {
  public mesh: THREE.SkinnedMesh;
  public skeleton: THREE.Skeleton;
  public bones: THREE.Bone[];

  constructor(height: number = 2.0) {
    // Proportions
    const headHeight = height * 0.125;  // 1/8 (12.5% of total height)
    const torsoHeight = height * 0.35;   // 35% of total height
    const legHeight = height * 0.48;     // 48% of total height
    const neckHeight = height * 0.045;   // Remaining 4.5% of total height

    // Box dimensions (widths & depths proportional to height for realistic body shape)
    const torsoWidth = height * 0.22;
    const torsoDepth = height * 0.12;
    const headSize = headHeight; // Cubic head shape
    const legWidth = height * 0.08;
    const legDepth = height * 0.08;
    const armWidth = height * 0.07;
    const armHeight = torsoHeight; // Arms length proportional to torso
    const armDepth = height * 0.07;

    // Bone reference heights in world coordinates (feet base at Y = 0)
    const hipsY = legHeight;
    const neckY = hipsY + torsoHeight;
    const headY = neckY + neckHeight;

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

    // Establish skeleton hierarchy
    hipsBone.add(spineBone);
    spineBone.add(headBone);
    hipsBone.add(leftLegBone);
    hipsBone.add(rightLegBone);
    spineBone.add(leftArmBone);
    spineBone.add(rightArmBone);

    // Set bone bind positions relative to their parents
    hipsBone.position.set(0, hipsY, 0);
    spineBone.position.set(0, 0, 0); // Spine starts at hips
    headBone.position.set(0, torsoHeight + neckHeight, 0); // Head sits on neck relative to spine
    leftLegBone.position.set(-torsoWidth * 0.3, 0, 0); // Left leg hip offset
    rightLegBone.position.set(torsoWidth * 0.3, 0, 0); // Right leg hip offset
    leftArmBone.position.set(-torsoWidth * 0.6, torsoHeight - armWidth * 0.5, 0); // Left shoulder offset
    rightArmBone.position.set(torsoWidth * 0.6, torsoHeight - armWidth * 0.5, 0); // Right shoulder offset

    this.bones = [hipsBone, spineBone, headBone, leftLegBone, rightLegBone, leftArmBone, rightArmBone];
    this.skeleton = new THREE.Skeleton(this.bones);

    // Segment mappings including geometries, target bone index, debug colors, and world bind offset
    const segments = [
      {
        name: "torso",
        geometry: new THREE.BoxGeometry(torsoWidth, torsoHeight, torsoDepth),
        boneIndex: 1, // spineBone index
        color: 0xff4444, // Red
        offset: new THREE.Vector3(0, hipsY + torsoHeight / 2, 0),
      },
      {
        name: "head",
        geometry: new THREE.BoxGeometry(headSize, headSize, headSize),
        boneIndex: 2, // headBone index
        color: 0x44ff44, // Green
        offset: new THREE.Vector3(0, headY + headHeight / 2, 0),
      },
      {
        name: "leftLeg",
        geometry: new THREE.BoxGeometry(legWidth, legHeight, legDepth),
        boneIndex: 3, // leftLegBone index
        color: 0x4444ff, // Blue
        offset: new THREE.Vector3(-torsoWidth * 0.3, legHeight / 2, 0),
      },
      {
        name: "rightLeg",
        geometry: new THREE.BoxGeometry(legWidth, legHeight, legDepth),
        boneIndex: 4, // rightLegBone index
        color: 0xffff44, // Yellow
        offset: new THREE.Vector3(torsoWidth * 0.3, legHeight / 2, 0),
      },
      {
        name: "leftArm",
        geometry: new THREE.BoxGeometry(armWidth, armHeight, armDepth),
        boneIndex: 5, // leftArmBone index
        color: 0xff44ff, // Magenta
        offset: new THREE.Vector3(-torsoWidth * 0.6, hipsY + torsoHeight - armWidth * 0.5 - armHeight / 2, 0),
      },
      {
        name: "rightArm",
        geometry: new THREE.BoxGeometry(armWidth, armHeight, armDepth),
        boneIndex: 6, // rightArmBone index
        color: 0x44ffff, // Cyan
        offset: new THREE.Vector3(torsoWidth * 0.6, hipsY + torsoHeight - armWidth * 0.5 - armHeight / 2, 0),
      }
    ];

    // Merge box geometries and inject skinIndices / skinWeights attributes
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

    segments.forEach((seg, idx) => {
      const geom = seg.geometry;
      const boneIdx = seg.boneIndex;

      // Offset geometry to bind pose position
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

        // Bone binding (4 bones per vertex limit, weight of 1.0 on target bone)
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

      // Define multi-material group range
      groups.push({
        start: indexOffset,
        count: indexCount,
        materialIndex: idx
      });

      // Create a debug shader material with skinning support enabled
      materials.push(
        new THREE.MeshStandardMaterial({
          color: seg.color,
          roughness: 0.5,
          metalness: 0.1,
          bumpScale: 0.05,
        })
      );

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

    // Apply groups for coloring segments individually
    groups.forEach(group => {
      mergedGeometry.addGroup(group.start, group.count, group.materialIndex);
    });

    // Create the mesh and bind skeleton
    this.mesh = new THREE.SkinnedMesh(mergedGeometry, materials);
    this.mesh.add(hipsBone); // Hips root must be inside mesh hierarchy
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
