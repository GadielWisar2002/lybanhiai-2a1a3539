import * as THREE from "three";

export function createPrefabBuilding(type: string): THREE.Group {
  const group = new THREE.Group();

  // Materials definition
  const matBrick = new THREE.MeshLambertMaterial({ color: 0xc62828 });
  const matWood = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
  const matSteel = new THREE.MeshLambertMaterial({ color: 0x78909c });
  const matConcrete = new THREE.MeshLambertMaterial({ color: 0x90a4ae });
  const matGlass = new THREE.MeshLambertMaterial({ color: 0xe0f7fa, transparent: true, opacity: 0.6 });
  const matRoof = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
  const matGrass = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
  const matGold = new THREE.MeshLambertMaterial({ color: 0xffb300 });

  if (type === "dormitorio") {
    // Student Dorms: 3 nested blocks
    const body = new THREE.Mesh(new THREE.BoxGeometry(4, 5.5, 4), matWood);
    body.position.y = 2.75;
    group.add(body);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.0, 1.5, 4), matRoof);
    roof.position.set(0, 6.25, 0);
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
  } 
  else if (type === "aula") {
    // Primary Classroom: Box + pitched roof
    const body = new THREE.Mesh(new THREE.BoxGeometry(5, 3.2, 5), matBrick);
    body.position.y = 1.6;
    group.add(body);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 2.0, 4), matRoof);
    roof.position.set(0, 4.2, 0);
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
  }
  else if (type === "laboratorio") {
    // Science Lab: cylinder body + dome glass top
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 3.5, 8), matSteel);
    base.position.y = 1.75;
    group.add(base);

    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), matGlass);
    dome.position.y = 3.5;
    group.add(dome);
  }
  else if (type === "biblioteca") {
    // Library: Classic portico base + columns block
    const base = new THREE.Mesh(new THREE.BoxGeometry(7, 3.8, 5), matConcrete);
    base.position.y = 1.9;
    group.add(base);

    const pediment = new THREE.Mesh(new THREE.ConeGeometry(4.5, 1.5, 4), matGold);
    pediment.position.set(0, 4.55, 0);
    pediment.rotation.y = Math.PI / 4;
    group.add(pediment);
  }
  else if (type === "computo") {
    // Tech Hub: Modular glass structure
    const base = new THREE.Mesh(new THREE.BoxGeometry(5.5, 3.8, 5.5), matSteel);
    base.position.y = 1.9;
    group.add(base);

    const plate = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.4, 6.0), matConcrete);
    plate.position.y = 4.0;
    group.add(plate);
  }
  else if (type === "deportivo") {
    // Sports Court: Flat green pitch + hoops posts
    const pitch = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 12), matGrass);
    pitch.position.y = 0.05;
    group.add(pitch);

    const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.5, 6), matSteel);
    post1.position.set(0, 1.25, 5.5);
    group.add(post1);

    const board1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.1), matWood);
    board1.position.set(0, 2.5, 5.5);
    group.add(board1);
  }
  else if (type === "auditorio") {
    // Auditorium: Domed block
    const base = new THREE.Mesh(new THREE.BoxGeometry(10, 5.0, 10), matConcrete);
    base.position.y = 2.5;
    group.add(base);

    const dome = new THREE.Mesh(new THREE.SphereGeometry(4.8, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), matSteel);
    dome.position.y = 5.0;
    group.add(dome);
  }
  else if (type === "gimnasio") {
    // Gymnasium: Long rectangular steel vault
    const base = new THREE.Mesh(new THREE.BoxGeometry(8, 4.2, 12), matSteel);
    base.position.y = 2.1;
    group.add(base);

    const roof = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.0, 12, 8, 1, false, -Math.PI / 2, Math.PI), matRoof);
    roof.position.set(0, 4.2, 0);
    roof.rotateX(Math.PI / 2);
    group.add(roof);
  }
  else if (type === "cafeteria") {
    // Cafeteria: Cozy wood block with large glass panels
    const base = new THREE.Mesh(new THREE.BoxGeometry(6, 3.2, 6), matWood);
    base.position.y = 1.6;
    group.add(base);

    const windows = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.5, 6.2), matGlass);
    windows.position.set(0, 1.6, 0);
    group.add(windows);
  }

  // Optimize all sub-meshes for lower polygon counts and frustum culling
  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.frustumCulled = true;
    }
  });

  return group;
}
