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

export const createTitleBox = async (scene) => {
    const boxWidth = 14;
    const boxHeight = 8;
    const boxDepth = 0.3;

    const titleMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

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

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create wood-like frame effect
    const frameWidth = Math.floor(120 * (4096/3584)); // Scaled frame width for new canvas size
    const innerMargin = Math.floor(40 * (4096/3584)); // Scaled inner margin

    // Outer frame (dark brown)
    ctx.fillStyle = '#3d2914';
    ctx.fillRect(0, 0, canvas.width, frameWidth); // Top
    ctx.fillRect(0, 0, frameWidth, canvas.height); // Left
    ctx.fillRect(canvas.width - frameWidth, 0, frameWidth, canvas.height); // Right
    ctx.fillRect(0, canvas.height - frameWidth, canvas.width, frameWidth); // Bottom

    // Inner frame (medium brown)
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(frameWidth - 20, frameWidth - 20, canvas.width - 2*(frameWidth - 20), 20); // Top inner
    ctx.fillRect(frameWidth - 20, frameWidth - 20, 20, canvas.height - 2*(frameWidth - 20)); // Left inner
    ctx.fillRect(canvas.width - frameWidth + 20, frameWidth - 20, 20, canvas.height - 2*(frameWidth - 20)); // Right inner
    ctx.fillRect(frameWidth - 20, canvas.height - frameWidth + 20, canvas.width - 2*(frameWidth - 20), 20); // Bottom inner

    // Wood grain effect (subtle lines)
    ctx.strokeStyle = 'rgba(61, 41, 20, 0.3)';
    ctx.lineWidth = 2;

    // Horizontal grain on top and bottom frames
    for (let y = frameWidth; y < canvas.height - frameWidth; y += 8) {
        if (y > frameWidth + 20 && y < canvas.height - frameWidth - 20) continue; // Skip center area
        ctx.beginPath();
        ctx.moveTo(frameWidth, y);
        ctx.lineTo(canvas.width - frameWidth, y);
        ctx.stroke();
    }

    // Vertical grain on left and right frames
    for (let x = frameWidth; x < canvas.width - frameWidth; x += 8) {
        if (x > frameWidth + 20 && x < canvas.width - frameWidth - 20) continue; // Skip center area
        ctx.beginPath();
        ctx.moveTo(x, frameWidth);
        ctx.lineTo(x, canvas.height - frameWidth);
        ctx.stroke();
    }

    // Add some wood knots (small dark circles)
    ctx.fillStyle = '#2d1f12';
    const scaledKnotSize = Math.floor(8 * (4096/3584)); // Scale knot size
    const knotPositions = [
        [frameWidth + Math.floor(30 * (4096/3584)), frameWidth + Math.floor(40 * (4096/3584))],
        [canvas.width - frameWidth - Math.floor(30 * (4096/3584)), frameWidth + Math.floor(60 * (4096/3584))],
        [frameWidth + Math.floor(50 * (4096/3584)), canvas.height - frameWidth - Math.floor(30 * (4096/3584))],
        [canvas.width - frameWidth - Math.floor(40 * (4096/3584)), canvas.height - frameWidth - Math.floor(50 * (4096/3584))]
    ];
    knotPositions.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, scaledKnotSize, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.font = 'bold 224px Arial'; // Scaled up for new canvas size
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Auto-wrap text to fit within white content area
    const text = 'Dinas Arsip Kabupaten Bekasi';
    const maxWidth = canvas.width - (frameWidth * 2) - 100; // Available width minus frame and margins
    const lineHeight = 292; // Scaled up proportionally

    // Function to wrap text
    function wrapText(context, text, maxWidth, fontSize) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        // Temporarily set font to measure text
        const originalFont = context.font;
        context.font = `bold ${fontSize}px Arial`;

        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = context.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        // Restore original font
        context.font = originalFont;
        return lines;
    }

    // Get wrapped lines
    const lines = wrapText(ctx, text, maxWidth, 224);
    const totalTextHeight = lines.length * lineHeight;
    const startY = canvas.height / 2 - totalTextHeight / 2; // Center vertically

    // Draw each line
    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });

    // Load and draw logos at the bottom
    const basePath = import.meta.env.BASE_URL;

    // Create promises for image loading
    const loadImage = (src) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
        });
    };

    // Load both logos and draw them
    try {
        const logo1 = await loadImage(`${basePath}images/logo/bekasi.png`);
        const logo2 = await loadImage(`${basePath}images/logo/disarpus.png`);

        // Draw logos at the bottom with higher resolution, positioned for rectangular format and frame
        const bekasiLogoSize = 400; // Smaller size as requested
        const disarpusLogoWidth = 600; // Wider Disarpus logo
        const disarpusLogoHeight = 480; // Slightly shorter height for wider appearance
        const frameMargin = 120;
        const scaledFrameMargin = Math.floor(frameMargin * (4096/3584)); // Scale frame margin

        // Position Bekasi logo (left side) - smaller size as requested
        const bekasiX = scaledFrameMargin + 80; // Adjusted position for smaller size
        const bekasiY = canvas.height - scaledFrameMargin - bekasiLogoSize - 80;
        ctx.drawImage(logo1, bekasiX, bekasiY, bekasiLogoSize, bekasiLogoSize);

        // Position Disarpus logo (right side) - wider format as requested
        const disarpusX = canvas.width - scaledFrameMargin - disarpusLogoWidth - 40;
        const disarpusY = canvas.height - scaledFrameMargin - disarpusLogoHeight - 40;
        ctx.drawImage(logo2, disarpusX, disarpusY, disarpusLogoWidth, disarpusLogoHeight);
    } catch (error) {
        console.warn('Could not load logos:', error);
    }

    const texture = new THREE.CanvasTexture(canvas);

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
