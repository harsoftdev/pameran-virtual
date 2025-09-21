import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader";

export const createMiddleWall = async (scene, textureLoader) => {
    const wallGroup = new THREE.Group();
    scene.add(wallGroup);

    const normalTexture = textureLoader.load(
        "leather_white_4k.gltf/textures/leather_white_diff_4k.jpg"
    );
    const roughnessTexture = textureLoader.load(
        "leather_white_4k.gltf/textures/leather_white_nor_gl_4k.jpg"
    );
    normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
    roughnessTexture.wrapS = roughnessTexture.wrapT = THREE.RepeatWrapping;

    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xadadae,
        normalMap: normalTexture,
        roughnessMap: roughnessTexture,
        side: THREE.DoubleSide,
    });

    const wallWidth = 16;
    const wallHeight = 20;
    const wallDepth = 16;

    const middleWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth),
        wallMaterial
    );
    middleWall.position.set(0, wallHeight / 2, 0);

    wallGroup.add(middleWall);

    const loader = new GLTFLoader();
    const basePath = import.meta.env.BASE_URL;
    const vaseGLBPath = `${basePath}models/pot_plant_dracena.glb`;

    const createVase = async (xPos) => {
        const gltf = await loader.loadAsync(vaseGLBPath);
        const vase = gltf.scene;

        // scaling & posisi
        vase.scale.set(0.3, 0.3, 0.3); // sesuaikan ukuran
        vase.position.set(xPos, -10, wallDepth / 2 + 1); // pos di depan middleWall
        middleWall.add(vase);
    };

    // panggil untuk kiri & kanan
    await createVase(-6); // kiri
    await createVase(6);

    return wallGroup;
};

export const createTitleBox = (scene) => {
    const boxWidth = 12;
    const boxHeight = 5;
    const boxDepth = 0.3;

    const titleMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00 });

    const titleBox = new THREE.Mesh(
        new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth),
        titleMaterial
    );

    // Posisi di tengah dinding depan
    const wallHeight = 14;
    const middleWallZ = 0;
    const wallDepth = 16;
    titleBox.position.set(0, wallHeight / 2, middleWallZ + wallDepth / 2 + boxDepth / 2);

    scene.add(titleBox);

    // --- buat canvas text ---
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#FFA000'); // atas
    gradient.addColorStop(1, '#FFD54F'); // bawah

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Judul Pameran', canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const planeMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(boxWidth, boxHeight), planeMaterial);

    plane.position.set(0, 0, boxDepth / 2 + 0.01); // di atas kotak
    titleBox.add(plane);

    return titleBox;
};
