import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader";
import { getExhibitionData } from "./exhibitionData.js";

const DEFAULT_IMAGE = `${import.meta.env.BASE_URL}images/no-image.webp`;

// Load gambar dengan crossOrigin + timeout. Penting: tanpa timeout, koneksi API
// yang menggantung bikin onload/onerror tidak pernah kepanggil -> proses boot
// scene macet total.
const loadImage = (src, timeoutMs = 8000) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => {
            img.src = '';
            reject(new Error(`Timeout load image: ${src}`));
        }, timeoutMs);
        img.onload = () => { clearTimeout(timer); resolve(img); };
        img.onerror = () => { clearTimeout(timer); reject(new Error(`Failed to load image: ${src}`)); };
        img.src = src;
    });
};

// Coba src dari API, fallback ke gambar default kalau gagal/timeout
const loadImageOrDefault = async (src) => {
    try {
        return await loadImage(src);
    } catch (error) {
        console.warn('Gambar tidak bisa dimuat, pakai default:', error.message);
        return loadImage(DEFAULT_IMAGE).catch(() => null);
    }
};

// Panel gambar di sisi dinding tengah. Box langsung dikembalikan (tidak
// menunggu gambar); tekstur di-swap saat gambar API selesai / timeout.
export const createPlainBox = (parentGroup, position, boxSize, imagePath = null) => {
    const { x, y, z } = position;
    const { width, height, depth } = boxSize;

    const box = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    box.position.set(x, y, z);
    parentGroup.add(box);

    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e9e9e9'; // isian netral sebelum gambar siap
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
    );
    plane.position.set(0, 0, depth / 2 + 0.01);
    box.add(plane);

    // Muat gambar di background lalu swap tekstur
    if (imagePath) {
        loadImageOrDefault(imagePath).then((image) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (image) {
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            } else {
                ctx.fillStyle = '#e9e9e9';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.font = 'bold 128px Arial';
                ctx.fillStyle = '#666666';
                ctx.textAlign = 'center';
                ctx.fillText('No Image Available', canvas.width / 2, canvas.height / 2);
            }
            texture.needsUpdate = true;
        });
    }

    return box;
};

export const createMiddleWall = async (scene, textureLoader) => {
    const exhData = await getExhibitionData();
    const wallGroup = new THREE.Group();
    scene.add(wallGroup);

    // Resolve URL gambar dari API (absolute atau relatif ke BASE_URL).
    // Load + fallback ditangani createPlainBox (loadImageOrDefault, ada timeout).
    const resolveImg = (p) => {
        if (!p) return DEFAULT_IMAGE;
        return p.startsWith('http') ? p : `${import.meta.env.BASE_URL}${p}`;
    };

    const frameImagePath1 = resolveImg(exhData?.quotes_image_1);
    const frameImagePath2 = resolveImg(exhData?.quotes_image_2);
    const frameImagePath3 = resolveImg(exhData?.bupati_image);

    // Samakan dengan dinding luar (walls.js): nor_gl -> normalMap, rough -> roughnessMap
    const normalTexture = textureLoader.load(
        "leather_white_4k.gltf/textures/leather_white_nor_gl_4k.webp"
    );
    const roughnessTexture = textureLoader.load(
        "leather_white_4k.gltf/textures/leather_white_rough_4k.webp"
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

    const loader = new GLTFLoader(textureLoader.manager);
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

    // Add left and right wall boxes with framed no-image display
    // Position them to attach directly to the sides of the middle wall
    const sideBoxWidth = 10; // Same width as front banner height
    const sideBoxHeight = 8; // Same height as front banner

    // Panel kiri (menghadap -X)
    const leftWallBox = createPlainBox(
        wallGroup,
        { x: -wallWidth / 2 - 0.1, y: wallHeight / 2 - 3, z: 0 },
        { width: sideBoxWidth, height: sideBoxHeight, depth: 0.2 },
        frameImagePath1
    );
    leftWallBox.rotation.y = -Math.PI / 2;

    // Panel kanan (menghadap +X)
    const rightWallBox = createPlainBox(
        wallGroup,
        { x: wallWidth / 2 + 0.1, y: wallHeight / 2 - 3, z: 0 },
        { width: sideBoxWidth, height: sideBoxHeight, depth: 0.2 },
        frameImagePath2
    );
    rightWallBox.rotation.y = Math.PI / 2;

    // Panel belakang (menghadap -Z)
    const backWallBox = createPlainBox(
        wallGroup,
        { x: 0, y: wallHeight / 2 - 3, z: -wallDepth / 2 - 0.1 },
        { width: sideBoxWidth, height: sideBoxHeight, depth: 0.2 },
        frameImagePath3
    );
    backWallBox.rotation.y = Math.PI;

    return wallGroup;
};

export const createTitleBox = async (scene) => {
    const exhData = await getExhibitionData();
    const boxWidth = 14;
    const boxHeight = 8;
    const boxDepth = 0.3;

    const titleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

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
    canvas.width = 4096;
    canvas.height = 2048; // Power of 2 dimensions for optimal texture rendering
    const ctx = canvas.getContext('2d');

    const drawTitleText = (text) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 224px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    };

    // Tampilkan teks judul dulu; kalau ada title_image dari API, swap saat siap.
    drawTitleText(exhData?.title || 'Pameran Virtual Arsip dan Perpustakaan Kabupaten Bekasi');

    const texture = new THREE.CanvasTexture(canvas);

    const titleImageUrl = exhData?.title_image;
    if (titleImageUrl) {
        loadImage(titleImageUrl)
            .then((image) => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                texture.needsUpdate = true;
            })
            .catch((err) => console.warn('Title image gagal dimuat:', err.message));
    }

    // Set texture filtering for maximum sharpness
    texture.generateMipmaps = false;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    // Additional settings for sharp rendering
    texture.premultiplyAlpha = false;
    texture.format = THREE.RGBAFormat;

    const planeMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(boxWidth, boxHeight), planeMaterial);

    plane.position.set(0, 0, boxDepth / 2 + 0.01); // di atas kotak
    titleBox.add(plane);

    return titleBox;
};
