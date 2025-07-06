import * as THREE from 'three';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.js', import.meta.url).toString();

export async function createPaintings(scene, textureLoader) {
	let paintings = [];

	// const API_URL = 'http://127.0.0.1:8000/api/exhibition-archives';
	const API_URL = 'https://silat.bekasikab.go.id/api/exhibition-archives';
	const res = await fetch(API_URL);
	const data = await res.json();

	if (!data.success) {
		console.error('Failed to fetch:', data.message);
		return paintings;
	}

	const frontWall = data.data.static || [];
	const leftWall = data.data.inactive || [];
	const rightWall = data.data.vital || [];

	const wallLength = 80;  // panjang tembok real
	const margin = 5;       // offset ujung
	const usable = wallLength - margin * 2;

	// FRONT WALL → static
	if (frontWall.length > 0) {
		const spacing = usable / frontWall.length;
		const start = -usable / 2 + spacing / 2;

		for (let i = 0; i < frontWall.length; i++) {
			const painting = await createPaintingMesh(frontWall[i]);
			painting.position.set(start + spacing * i, 4, -39.5); // nempel front wall
			painting.rotation.y = 0;
			painting.userData.category = 'static';
			paintings.push(painting);
		}
	}

	// LEFT WALL → inactive
	if (leftWall.length > 0) {
		const spacing = usable / leftWall.length;
		const start = -usable / 2 + spacing / 2;

		for (let i = 0; i < leftWall.length; i++) {
			const painting = await createPaintingMesh(leftWall[i]);
			painting.position.set(-39.5, 4, start + spacing * i); // nempel left wall
			painting.rotation.y = Math.PI / 2;
			painting.userData.category = 'inactive';
			paintings.push(painting);
		}
	}

	// RIGHT WALL → vital
	if (rightWall.length > 0) {
		const spacing = usable / rightWall.length;
		const start = -usable / 2 + spacing / 2;

		for (let i = 0; i < rightWall.length; i++) {
			const painting = await createPaintingMesh(rightWall[i]);
			painting.position.set(39.5, 4, start + spacing * i); // nempel right wall
			painting.rotation.y = -Math.PI / 2;
			painting.userData.category = 'vital';
			paintings.push(painting);
		}
	}

	return paintings;
}

// Helper bikin painting
async function createPaintingMesh(item) {
	// const FILE_URL = 'http://127.0.0.1:8000/ViewerJS/#/';
	const FILE_URL = 'https://silat.bekasikab.go.id/ViewerJS/#/';

	const loadingTask = pdfjsLib.getDocument(item.Url);
	const pdf = await loadingTask.promise;
	const page = await pdf.getPage(1);

	const scale = 1.5;
	const viewport = page.getViewport({ scale: scale });

	const canvas = document.createElement('canvas');
	canvas.width = viewport.width;
	canvas.height = viewport.height;

	const context = canvas.getContext('2d');
	const renderContext = {
		canvasContext: context,
		viewport: viewport,
	};
	await page.render(renderContext).promise;

	const pdfTexture = new THREE.CanvasTexture(canvas);

	const width = 5;
	const height = 4.5;

	const geometry = new THREE.PlaneGeometry(width, height);
	const material = new THREE.MeshLambertMaterial({ map: pdfTexture });

	const painting = new THREE.Mesh(geometry, material);

	painting.userData = {
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

	painting.castShadow = true;
	painting.receiveShadow = true;

	// return painting;

	const frameThickness = 0.2;
	const frameDepth = 0.05;
	const outerWidth = width + frameThickness * 2;
	const outerHeight = height + frameThickness * 2;

	const frameGeo = new THREE.BoxGeometry(outerWidth, outerHeight, frameDepth);
	const frameMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
	const frame = new THREE.Mesh(frameGeo, frameMat);

	// Taruh painting di depan frame
	painting.position.z = frameDepth / 2 + 0.005;

	// Gabung group
	const group = new THREE.Group();
	group.add(frame);
	group.add(painting);

	// userData di group juga bisa
	group.userData = painting.userData;

	group.castShadow = true;
	group.receiveShadow = true;

	return group;
}

export const createDoor = (scene, textureLoader) => {
	const doorTexture = textureLoader.load('images/door.png');
	const doorGeometry = new THREE.PlaneGeometry(5, 10);
	const doorMaterial = new THREE.MeshStandardMaterial({
		map: doorTexture,
		side: THREE.DoubleSide,
	});

	const door = new THREE.Mesh(doorGeometry, doorMaterial);

	// Tinggi pintu
	const doorHeight = 5;

	// Ketinggian lantai
	const floorY = 0;

	// Jadi posisi Y pintu = dasar lantai + setengah tinggi pintu
	door.position.y = floorY + (doorHeight / 1); // = 3.5

	// Tempel ke dinding belakang
	door.position.z = 40 - 0.05; // Mundur sedikit supaya nggak z-fighting
	door.rotation.y = Math.PI;

	scene.add(door);
};
