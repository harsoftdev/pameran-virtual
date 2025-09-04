import { GLTFLoader } from "three/addons/loaders/GLTFLoader";

export const createFurniture = async (scene) => {
    const loader = new GLTFLoader();
    const basePath = import.meta.env.BASE_URL;

    const gltf = await loader.loadAsync(`${basePath}models/Couch.glb`);
    const furnitureOriginal = gltf.scene;

    const scale = 3;

    // Front wall
    const front = furnitureOriginal.clone();
    front.scale.set(scale, scale, scale);
    front.position.set(0, 0, -20);
    front.rotation.y = -Math.PI / 2;
    scene.add(front);

    // Left wall
    const left = furnitureOriginal.clone();
    left.scale.set(scale, scale, scale);
    left.position.set(-20, 0, 0); // X ke kiri
    scene.add(left);

    // Right wall
    const right = furnitureOriginal.clone();
    right.scale.set(scale, scale, scale);
    right.position.set(20, 0, 0); // X ke kanan
    right.rotation.y = Math.PI;
    scene.add(right);
};
