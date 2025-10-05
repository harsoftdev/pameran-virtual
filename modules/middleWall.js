import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader";

// Reusable wood frame component
export const drawWoodFrame = (ctx, canvas, frameWidth) => {
    // Outer frame (dark brown)
    ctx.fillStyle = '#3d2914';
    ctx.fillRect(0, 0, canvas.width, frameWidth); // Top
    ctx.fillRect(0, 0, frameWidth, canvas.height); // Left
    ctx.fillRect(canvas.width - frameWidth, 0, frameWidth, canvas.height); // Right
    ctx.fillRect(0, canvas.height - frameWidth, canvas.width, frameWidth); // Bottom

    // Inner frame (medium brown)
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(frameWidth - 20, frameWidth - 20, canvas.width - 2 * (frameWidth - 20), 20); // Top inner
    ctx.fillRect(frameWidth - 20, frameWidth - 20, 20, canvas.height - 2 * (frameWidth - 20)); // Left inner
    ctx.fillRect(canvas.width - frameWidth + 20, frameWidth - 20, 20, canvas.height - 2 * (frameWidth - 20)); // Right inner
    ctx.fillRect(frameWidth - 20, canvas.height - frameWidth + 20, canvas.width - 2 * (frameWidth - 20), 20); // Bottom inner

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
    const scaledKnotSize = Math.floor(8 * (canvas.width / 3584)); // Scale knot size proportionally
    const knotPositions = [
        [frameWidth + Math.floor(30 * (canvas.width / 3584)), frameWidth + Math.floor(40 * (canvas.width / 3584))],
        [canvas.width - frameWidth - Math.floor(30 * (canvas.width / 3584)), frameWidth + Math.floor(60 * (canvas.width / 3584))],
        [frameWidth + Math.floor(50 * (canvas.width / 3584)), canvas.height - frameWidth - Math.floor(30 * (canvas.width / 3584))],
        [canvas.width - frameWidth - Math.floor(40 * (canvas.width / 3584)), canvas.height - frameWidth - Math.floor(50 * (canvas.width / 3584))]
    ];
    knotPositions.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, scaledKnotSize, 0, Math.PI * 2);
        ctx.fill();
    });
};

// Reusable framed box component
export const createFramedBox = async (parentGroup, position, boxSize, frameImagePath = null) => {
    const { x, y, z } = position;
    const { width, height, depth } = boxSize;

    const boxMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: false
    });
    const box = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        boxMaterial
    );
    box.position.set(x, y, z); // Position as specified
    parentGroup.add(box);

    // Create canvas for the framed content (same size as front banner for consistency)
    const canvas = document.createElement('canvas');
    canvas.width = 4096;  // Same as front banner
    canvas.height = 2048; // Same as front banner
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw wood frame (identical to front banner)
    const frameWidth = 120; // Same absolute width as front banner
    drawWoodFrame(ctx, canvas, frameWidth);

    // Load and draw image if provided
    if (frameImagePath) {
        const basePath = import.meta.env.BASE_URL;
        const loadImage = (src) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = src;
            });
        };

        try {
            const image = await loadImage(`${basePath}${frameImagePath}`);
            console.log('Successfully loaded image:', `${basePath}${frameImagePath}`);
            const imageSize = 600; // Consistent image size across all frames
            const imageX = (canvas.width - imageSize) / 2;
            const imageY = (canvas.height - imageSize) / 2;
            ctx.drawImage(image, imageX, imageY, imageSize, imageSize);

            // Add fallback text if image loads but appears blank
            ctx.font = 'bold 96px Arial'; // Consistent with front banner scale
            ctx.fillStyle = '#666666';
            ctx.textAlign = 'center';
            ctx.fillText('No Image', canvas.width / 2, canvas.height / 2 + 400);
        } catch (error) {
            console.warn('Could not load frame image:', error);
            // Draw fallback content when image fails to load
            ctx.font = 'bold 128px Arial'; // Consistent with front banner scale
            ctx.fillStyle = '#666666';
            ctx.textAlign = 'center';
            ctx.fillText('No Image Available', canvas.width / 2, canvas.height / 2);
        }
    }

    // Create texture and apply to box
    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    const planeMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), planeMaterial);

    // Position plane at the front face of the box (works for all rotations)
    plane.position.set(0, 0, depth / 2 + 0.01);
    box.add(plane);

    console.log('Created framed box with texture at position:', position);
    return box;
};

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

    // Add left and right wall boxes with framed no-image display
    // Position them to attach directly to the sides of the middle wall
    const sideBoxWidth = 10; // Same width as front banner height
    const sideBoxHeight = 8; // Same height as front banner

    // Left wall box - rotated to face left (-X direction)
    const leftWallBox = await createFramedBox(
        wallGroup,
        { x: -wallWidth / 2 - 0.1, y: wallHeight / 2 - 3, z: 0 }, // Much closer to wall and raised position
        { width: sideBoxWidth, height: sideBoxHeight, depth: 0.2 }, // Match front banner dimensions
        'images/no-image.png'
    );
    leftWallBox.rotation.y = -Math.PI / 2; // Rotate -90 degrees to face left

    // Right wall box - rotated to face right (+X direction)
    const rightWallBox = await createFramedBox(
        wallGroup,
        { x: wallWidth / 2 + 0.1, y: wallHeight / 2 - 3, z: 0 }, // Much closer to wall and raised position
        { width: sideBoxWidth, height: sideBoxHeight, depth: 0.2 }, // Match front banner dimensions
        'images/no-image.png'
    );
    rightWallBox.rotation.y = Math.PI / 2; // Rotate +90 degrees to face right

    return wallGroup;
};

export const createTitleBox = async (scene) => {
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

    // Use reusable wood frame component (original size)
    const frameWidth = 120; // Original frame width
    drawWoodFrame(ctx, canvas, frameWidth);

    ctx.font = 'bold 224px Arial'; // Scaled up for new canvas size
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Auto-wrap text to fit within white content area
    const text = 'Dinas Arsip Kabupaten Bekasi';
    const maxWidth = canvas.width - (frameWidth * 2) - 60; // Available width minus frame and smaller margins
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

        // Position Bekasi logo (left side) - smaller size as requested
        const bekasiX = frameWidth + 40; // Adjusted position for smaller frame
        const bekasiY = canvas.height - frameWidth - bekasiLogoSize - 40;
        ctx.drawImage(logo1, bekasiX, bekasiY, bekasiLogoSize, bekasiLogoSize);

        // Position Disarpus logo (right side) - wider format as requested
        const disarpusX = canvas.width - frameWidth - disarpusLogoWidth - 40;
        const disarpusY = canvas.height - frameWidth - disarpusLogoHeight - 40;
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

