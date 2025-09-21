import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader";

export const createFurniture = async (scene) => {
    const loader = new GLTFLoader();
    const basePath = import.meta.env.BASE_URL;

    const gltf = await loader.loadAsync(`${basePath}models/Couch.glb`);
    const furnitureOriginal = gltf.scene;

    const scale = 3;
    const furnitures = [];

    // Front wall
    const front = furnitureOriginal.clone();
    front.scale.set(scale, scale, scale);
    front.position.set(0, 0, -20);
    front.rotation.y = -Math.PI / 2;
    scene.add(front);
    furnitures.push(front);

    // Left wall
    const left = furnitureOriginal.clone();
    left.scale.set(scale, scale, scale);
    left.position.set(-20, 0, 0); // X ke kiri
    scene.add(left);
    furnitures.push(left);

    // Right wall
    const right = furnitureOriginal.clone();
    right.scale.set(scale, scale, scale);
    right.position.set(20, 0, 0); // X ke kanan
    right.rotation.y = Math.PI;
    scene.add(right);
    furnitures.push(right);

     // buat bounding box untuk collision
    furnitures.forEach((f) => {
        const bbox = new THREE.Box3().setFromObject(f);
        f.BoundingBox = bbox;
    });

    return furnitures;
};

export const createPots = async (scene) => {
    const loader = new GLTFLoader();
    const basePath = import.meta.env.BASE_URL;

    // load sekali
    const gltf = await loader.loadAsync(`${basePath}models/plant_with_pot.glb`);
    const potOriginal = gltf.scene;

    const scale = 1;
    const offset = 38; // biar nggak keluar dari lantai 102x102

    const positions = [
        [offset, 0, offset], // kanan depan
        [offset, 0, -offset], // kanan belakang
        [-offset, 0, offset], // kiri depan
        [-offset, 0, -offset], // kiri belakang
    ];

    positions.forEach(([x, y, z]) => {
        const pot = potOriginal.clone();
        pot.scale.set(scale, scale, scale);
        pot.position.set(x, y, z);
        scene.add(pot);
    });
};

