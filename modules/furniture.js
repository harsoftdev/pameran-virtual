import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader";
import { CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";

// Array untuk menyimpan overlay meshes yang bisa diklik
const clickableOverlays = [];

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

export const createTvMonitor = async (scene, css3dScene, youtubeLink1 = null, youtubeLink2 = null) => {
    const loader = new GLTFLoader();
    const basePath = import.meta.env.BASE_URL;

    const gltf = await loader.loadAsync(`${basePath}models/tv_monitor.glb`);
    const tvMonitorOriginal = gltf.scene;

    const scale = 3;
    const tvMonitors = [];

    // Posisi di wall belakang sebelah jendela kiri dan kanan
    const positions = [
        { x: -25, y: 0.1, z: 38, rotationY: Math.PI + Math.PI / 2 + Math.PI, youtubeUrl: youtubeLink1 }, // Kiri dari jendela kiri
        { x: 25, y: 0.1, z: 38, rotationY: Math.PI + Math.PI / 2 + Math.PI, youtubeUrl: youtubeLink2 }   // Kanan dari jendela kanan
    ];

    positions.forEach((pos, index) => {
        const tvMonitor = tvMonitorOriginal.clone();
        tvMonitor.scale.set(scale, scale, scale);
        tvMonitor.position.set(pos.x, pos.y, pos.z);
        tvMonitor.rotation.y = pos.rotationY;
        scene.add(tvMonitor);

        // Jika ada URL YouTube, buat screen overlay terpisah
        if (pos.youtubeUrl) {
            createYouTubeScreenOverlay(scene, css3dScene, tvMonitor, pos, index);
        }

        // buat bounding box untuk collision
        const bbox = new THREE.Box3().setFromObject(tvMonitor);
        tvMonitor.BoundingBox = bbox;

        tvMonitors.push(tvMonitor);
    });

    return tvMonitors;
};

// Fungsi untuk membuat overlay layar YouTube terpisah
function createYouTubeScreenOverlay(scene, css3dScene, tvMonitor, tvPosition, index) {
    // Ekstrak video ID dari URL YouTube
    const videoId = extractYouTubeVideoId(tvPosition.youtubeUrl);

    if (videoId) {
        // Buat elemen iframe YouTube
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&showinfo=0`;
        iframe.width = '560';
        iframe.height = '315';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.borderRadius = '8px';
        iframe.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';

        // Buat wrapper div untuk kontrol ukuran dan positioning
        const wrapper = document.createElement('div');
        wrapper.style.width = '560px';
        wrapper.style.height = '315px';
        wrapper.style.position = 'relative';
        wrapper.style.overflow = 'hidden';
        wrapper.style.borderRadius = '8px';
        wrapper.appendChild(iframe);

        // Buat CSS3D object
        const css3dObject = new CSS3DObject(wrapper);

        // Posisi layar persis pada area screen TV monitor
        // Sesuaikan dengan geometri tv_monitor.glb
        css3dObject.position.set(
            tvPosition.x + 0.15,
            tvPosition.y + 4.4, // Posisi vertikal yang lebih akurat untuk screen TV
            tvPosition.z - 1   // Sedikit di depan TV
        );

        // Rotasi 90 derajat sesuai permintaan + rotasi TV
        css3dObject.rotation.y = tvPosition.rotationY + Math.PI / 2;

        // Scale untuk menyesuaikan ukuran dengan TV screen
        css3dObject.scale.set(0.006, 0.006, 0.006);

        css3dScene.add(css3dObject);

        // Tambahkan ke array clickable overlays untuk interaksi klik
        clickableOverlays.push({
            css3dObject: css3dObject,
            element: wrapper,
            iframe: iframe,
            videoId: videoId,
            position: css3dObject.position.clone(),
            normal: new THREE.Vector3(0, 0, 1).applyEuler(css3dObject.rotation)
        });
    }
}

// Fungsi untuk mengekstrak video ID dari URL YouTube
function extractYouTubeVideoId(youtubeUrl) {
    if (!youtubeUrl) return null;

    // Ekstrak video ID dari berbagai format URL YouTube
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^"&?\/\s]{11})/
    ];

    for (const pattern of patterns) {
        const match = youtubeUrl.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

// Fungsi untuk memeriksa visibilitas overlay berdasarkan posisi kamera
export const updateOverlayVisibility = (camera, overlays, scene) => {
    const raycaster = new THREE.Raycaster();

    overlays.forEach(overlay => {
        if (overlay.position && overlay.normal) {
            // Hitung vektor dari overlay ke kamera
            const cameraDirection = new THREE.Vector3().subVectors(camera.position, overlay.position).normalize();

            // Hitung dot product untuk menentukan apakah kamera berada di depan overlay
            const dotProduct = cameraDirection.dot(overlay.normal);

            // Tambahkan tolerance kecil untuk menghindari flickering di edge cases
            const tolerance = 0.1;
            let isVisible = dotProduct > tolerance;

            // Jika kamera di depan overlay, periksa occlusion dengan raycasting
            if (isVisible) {
                // Set raycaster dari kamera ke posisi overlay
                raycaster.set(camera.position, overlay.position.clone().sub(camera.position).normalize());

                // Cari objek yang terkena ray (kecuali overlay itu sendiri)
                const intersects = raycaster.intersectObjects(scene.children, true);

                // Filter out the overlay's own CSS3DObject if it's in the scene
                const filteredIntersects = intersects.filter(intersect => {
                    // Skip if it's the overlay's own object or very close to camera
                    return intersect.distance > 0.1 && intersect.object !== overlay.css3dObject;
                });

                // Jika ada objek yang menghalangi (jarak lebih kecil dari jarak ke overlay), sembunyikan
                if (filteredIntersects.length > 0) {
                    const overlayDistance = camera.position.distanceTo(overlay.position);
                    const closestIntersect = filteredIntersects[0];
                    
                    // Jika objek penghalang lebih dekat dari overlay, sembunyikan overlay
                    if (closestIntersect.distance < overlayDistance - 0.5) { // tolerance 0.5 units
                        isVisible = false;
                    }
                }
            }

            // Set visibility CSS3D object
            overlay.css3dObject.visible = isVisible;
            overlay.element.style.display = isVisible ? 'block' : 'none';
        }
    });
};

export { clickableOverlays };
