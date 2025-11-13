import * as THREE from 'three';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.js', import.meta.url).toString();

export async function createPaintings(scene, textureLoader, manager, isLowEnd = false) {
	let paintings = [];

	const API_URL = 'https://silat.bekasikab.go.id/api/exhibition-archives';
	const res = await fetch(API_URL);
	const data = await res.json();

	if (!data.success) {
		console.error('Failed to fetch:', data.message);
		return paintings;
	}

	const artworks = data.data || [];

	const wallLength = 80;
	const margin = 5;
	const usable = wallLength - margin * 2;

	// --- Tinggi lukisan di dinding (bisa disesuaikan) ---
	const paintingOffsetY = 5;

	// Bagi static ke 3 tembok: front, left, right
	const total = artworks.length;
	const perWall = Math.ceil(total / 3);

	const frontWall = artworks.slice(0, perWall);
	const leftWall = artworks.slice(perWall, perWall * 2);
	const rightWall = artworks.slice(perWall * 2);

	// Front Wall
	if (frontWall.length > 0) {
		const spacing = usable / frontWall.length;
		const start = -usable / 2 + spacing / 2;

		for (let i = 0; i < frontWall.length; i++) {
			const painting = await createPaintingMesh(frontWall[i], textureLoader, manager, isLowEnd);
			painting.position.set(start + spacing * i, paintingOffsetY, -39.5);
			painting.rotation.y = 0;
			painting.userData.category = 'static';
			paintings.push(painting);

			// Biar dapat efek cahaya
			const spot = new THREE.SpotLight(0xffffff, 4, 60, Math.PI / 5, 0.3);
			spot.position.set(painting.position.x, painting.position.y + 7, painting.position.z);
			spot.target = painting;
			scene.add(spot);
			scene.add(spot.target);

						// --- Lampu fisik (cylinder body) ---
			const lampGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16);
			lampGeo.rotateX(Math.PI / 2);
			
			const lampMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
			const lampMesh = new THREE.Mesh(lampGeo, lampMat);
			lampMesh.position.copy(spot.position);
			lampMesh.lookAt(painting.position);
			scene.add(lampMesh);

			// --- Cone reflektor ---
			const coneGeo = new THREE.ConeGeometry(0.5, 1, 16, 1, true);
			coneGeo.rotateX(Math.PI / 2);
			coneGeo.rotateX(Math.PI);

			const coneMat = new THREE.MeshStandardMaterial({
				color: 0x444444,
				side: THREE.DoubleSide
			});
			const coneMesh = new THREE.Mesh(coneGeo, coneMat);
			coneMesh.position.copy(spot.position);
			coneMesh.lookAt(painting.position);
			scene.add(coneMesh);
		}
	}

	// Left Wall
	if (leftWall.length > 0) {
		const spacing = usable / leftWall.length;
		const start = -usable / 2 + spacing / 2;

		for (let i = 0; i < leftWall.length; i++) {
			const painting = await createPaintingMesh(leftWall[i], textureLoader, manager, isLowEnd);
			painting.position.set(-39.5, paintingOffsetY, start + spacing * i);
			painting.rotation.y = Math.PI / 2;
			painting.userData.category = 'static';
			paintings.push(painting);

			// Biar dapat efek cahaya
			const spot = new THREE.SpotLight(0xffffff, 4, 60, Math.PI / 5, 0.3);
			spot.position.set(painting.position.x, painting.position.y + 7, painting.position.z);
			spot.target = painting;
			scene.add(spot);
			scene.add(spot.target);

						// --- Lampu fisik (cylinder body) ---
			const lampGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16);
			lampGeo.rotateX(Math.PI / 2);
			
			const lampMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
			const lampMesh = new THREE.Mesh(lampGeo, lampMat);
			lampMesh.position.copy(spot.position);
			lampMesh.lookAt(painting.position);
			scene.add(lampMesh);

			// --- Cone reflektor ---
			const coneGeo = new THREE.ConeGeometry(0.5, 1, 16, 1, true);
			coneGeo.rotateX(Math.PI / 2);
			coneGeo.rotateX(Math.PI);

			const coneMat = new THREE.MeshStandardMaterial({
				color: 0x444444,
				side: THREE.DoubleSide
			});
			const coneMesh = new THREE.Mesh(coneGeo, coneMat);
			coneMesh.position.copy(spot.position);
			coneMesh.lookAt(painting.position);
			scene.add(coneMesh);
		}
	}

	// Right Wall
	if (rightWall.length > 0) {
		const spacing = usable / rightWall.length;
		const start = -usable / 2 + spacing / 2;

		for (let i = 0; i < rightWall.length; i++) {
			const painting = await createPaintingMesh(rightWall[i], textureLoader, manager, isLowEnd);
			painting.position.set(39.5, paintingOffsetY, start + spacing * i);
			painting.rotation.y = -Math.PI / 2;
			painting.userData.category = 'static';
			paintings.push(painting);

			// Biar dapat efek cahaya
			const spot = new THREE.SpotLight(0xffffff, 4, 60, Math.PI / 5, 0.3);
			spot.position.set(painting.position.x, painting.position.y + 7, painting.position.z);
			spot.target = painting;
			scene.add(spot);
			scene.add(spot.target);

			// --- Lampu fisik (cylinder body) ---
			const lampGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16);
			lampGeo.rotateX(Math.PI / 2);
			
			const lampMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
			const lampMesh = new THREE.Mesh(lampGeo, lampMat);
			lampMesh.position.copy(spot.position);
			lampMesh.lookAt(painting.position);
			scene.add(lampMesh);

			// --- Cone reflektor ---
			const coneGeo = new THREE.ConeGeometry(0.5, 1, 16, 1, true);
			coneGeo.rotateX(Math.PI / 2);
			coneGeo.rotateX(Math.PI);

			const coneMat = new THREE.MeshStandardMaterial({
				color: 0x444444,
				side: THREE.DoubleSide
			});
			const coneMesh = new THREE.Mesh(coneGeo, coneMat);
			coneMesh.position.copy(spot.position);
			coneMesh.lookAt(painting.position);
			scene.add(coneMesh);
		}
	}

	return paintings;
}

async function createPaintingMesh(item, textureLoader, manager, isLowEnd = false) {
	const FILE_URL = 'https://silat.bekasikab.go.id/ViewerJS/#/';

	// --- Placeholder (biar objek langsung muncul) ---
	const placeholderCanvas = document.createElement('canvas');
	placeholderCanvas.width = 256;
	placeholderCanvas.height = 256;
	const ctx = placeholderCanvas.getContext('2d');
	ctx.fillStyle = '#ccc';
	ctx.fillRect(0, 0, placeholderCanvas.width, placeholderCanvas.height);
	ctx.fillStyle = '#000';
	ctx.font = '20px sans-serif';
	ctx.fillText('Loading...', 50, 130);

	const pdfTexture = new THREE.CanvasTexture(placeholderCanvas);

	const scaleFactor = 1.3;
	const width = 5 * scaleFactor;
	const height = 4.5 * scaleFactor;

	// Painting pakai texture sementara
	const geometry = new THREE.PlaneGeometry(width, height);
	const material = new THREE.MeshLambertMaterial({ map: pdfTexture });
	const painting = new THREE.Mesh(geometry, material);
	painting.castShadow = false;
	painting.receiveShadow = false;

	// ===== Frame =====
	const frameTexture = textureLoader.load('img/frame.jpg');
	const frameWidth = width * 1.2;
	const frameHeight = height * 1.2;

	const frameGeo = new THREE.PlaneGeometry(frameWidth, frameHeight);
	const frameMat = new THREE.MeshBasicMaterial({
		map: frameTexture,
		transparent: true,
	});
	const frame = new THREE.Mesh(frameGeo, frameMat);

	painting.position.z = 0.01;

	const group = new THREE.Group();
	group.add(frame);
	group.add(painting);

	group.userData = {
		type: 'painting',
		info: {
			title: item.Name,
			classification: item.Klasifikasi,
			year: item.Year,
			amount: item.Amount,
			link: FILE_URL + item.Path,
		},
		url: item.Url,
	};

	// --- Render PDF async, update setelah selesai ---
	manager.itemStart(item.Url); // Track PDF loading
	pdfjsLib.getDocument(item.Url).promise.then(async (pdf) => {
		const page = await pdf.getPage(1);
		const scale = isLowEnd ? 1.0 : 1.5; // Lower resolution for low-end devices
		const viewport = page.getViewport({ scale });

		const canvas = document.createElement('canvas');
		canvas.width = viewport.width;
		canvas.height = viewport.height;

		const context = canvas.getContext('2d');
		await page.render({ canvasContext: context, viewport }).promise;

		// === adjust brightness/contrast ===
		const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
		const data = imageData.data;

		// misal +20 brightness, contrast = 1.1
		const brightness = 50; // -255 s/d +255
		const contrast = 1.5;  // 1.0 normal

		for (let i = 0; i < data.length; i += 4) {
			// r, g, b
			data[i] = Math.min(255, Math.max(0, contrast * (data[i] - 128) + 128 + brightness));
			data[i + 1] = Math.min(255, Math.max(0, contrast * (data[i + 1] - 128) + 128 + brightness));
			data[i + 2] = Math.min(255, Math.max(0, contrast * (data[i + 2] - 128) + 128 + brightness));
		}

		context.putImageData(imageData, 0, 0);
		// ================================

		const newTexture = new THREE.CanvasTexture(canvas);
		material.map = newTexture;
		material.needsUpdate = true;

		manager.itemEnd(item.Url); // End tracking
	}).catch((error) => {
		console.error('Error loading PDF:', error);
		manager.itemEnd(item.Url); // End even on error
	});

	return group;
}
