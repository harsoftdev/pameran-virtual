import * as THREE from 'three';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.js', import.meta.url).toString();

// SATU worker pdf.js dipakai semua render tekstur arsip.
let _pdfWorker = null;
const getPdfWorker = () => (_pdfWorker ??= new pdfjsLib.PDFWorker({ name: 'archives-worker' }));

// Batasi berapa PDF yang di-fetch+render bersamaan supaya tab tidak tercekik.
const MAX_CONCURRENT_PDF = 4;
const PDF_TASK_TIMEOUT = 25000; // 1 PDF nyangkut jangan sampai kunci antrian
let pdfActive = 0;
const pdfQueue = [];

const runPdfTask = (task) => {
	pdfQueue.push(task);
	pumpPdfQueue();
};

const pumpPdfQueue = () => {
	while (pdfActive < MAX_CONCURRENT_PDF && pdfQueue.length) {
		const task = pdfQueue.shift();
		pdfActive++;
		Promise.race([
			Promise.resolve().then(task),
			new Promise((_, rej) => setTimeout(() => rej(new Error('PDF timeout')), PDF_TASK_TIMEOUT)),
		])
			.catch((err) => console.warn('Lewati PDF:', err.message))
			.finally(() => { pdfActive--; pumpPdfQueue(); });
	}
};

const WALL_LENGTH = 80;
const WALL_MARGIN = 5;
const ARCHIVE_OFFSET_Y = 5;

const ARCHIVE_W = 5 * 1.3;
const ARCHIVE_H = 4.5 * 1.3;

// Aset yang sama untuk semua arsip -> dibuat sekali, dipakai ulang
let _frameTexture = null;
let _pageGeo = null;
let _frameGeo = null;
let _placeholderTexture = null;

const sharedFrameTexture = (textureLoader) => {
	if (!_frameTexture) _frameTexture = textureLoader.load('images/frame.webp');
	return _frameTexture;
};

const sharedPageGeo = () => (_pageGeo ??= new THREE.PlaneGeometry(ARCHIVE_W, ARCHIVE_H));
const sharedFrameGeo = () => (_frameGeo ??= new THREE.PlaneGeometry(ARCHIVE_W * 1.2, ARCHIVE_H * 1.2));

const sharedPlaceholderTexture = () => {
	if (!_placeholderTexture) {
		const c = document.createElement('canvas');
		c.width = c.height = 256;
		const ctx = c.getContext('2d');
		ctx.fillStyle = '#ccc';
		ctx.fillRect(0, 0, 256, 256);
		ctx.fillStyle = '#000';
		ctx.font = '20px sans-serif';
		ctx.fillText('Loading...', 50, 130);
		_placeholderTexture = new THREE.CanvasTexture(c);
	}
	return _placeholderTexture;
};

// Layout tiap dinding: fungsi posisi + rotasi menghadap ruangan
const WALL_LAYOUTS = [
	{ rotationY: 0, position: (v) => [v, ARCHIVE_OFFSET_Y, -39.5] },        // front
	{ rotationY: Math.PI / 2, position: (v) => [-39.5, ARCHIVE_OFFSET_Y, v] }, // left
	{ rotationY: -Math.PI / 2, position: (v) => [39.5, ARCHIVE_OFFSET_Y, v] }, // right
];

export async function createArchives(scene, textureLoader) {
	const archives = [];

	const API_URL = 'https://silat.bekasikab.go.id/api/exhibition-archives';
	const res = await fetch(API_URL);
	const data = await res.json();

	if (!data.success) {
		console.error('Failed to fetch archives:', data.message);
		return archives;
	}

	const items = data.data || [];
	const perWall = Math.ceil(items.length / WALL_LAYOUTS.length);
	const usable = WALL_LENGTH - WALL_MARGIN * 2;

	for (let w = 0; w < WALL_LAYOUTS.length; w++) {
		const layout = WALL_LAYOUTS[w];
		const wallItems = items.slice(w * perWall, (w + 1) * perWall);
		if (wallItems.length === 0) continue;

		const spacing = usable / wallItems.length;
		const start = -usable / 2 + spacing / 2;

		for (let i = 0; i < wallItems.length; i++) {
			const archive = createArchiveMesh(wallItems[i], textureLoader);
			archive.position.set(...layout.position(start + spacing * i));
			archive.rotation.y = layout.rotationY;
			archives.push(archive);

			addArchiveLamp(scene, archive);
		}
	}

	createSpotlightPool(scene, archives);
	return archives;
}

// ---- Sorotan lampu galeri ----
// Dulu: 1 SpotLight per arsip (bisa 30-50 light dinamis -> berat). Sekarang:
// pool berukuran tetap yang "mengikuti" arsip terdekat ke kamera. Jumlah light
// konstan -> tidak ada rekompilasi shader saat berjalan.
const SPOTLIGHT_POOL_SIZE = (typeof window !== 'undefined' && window.innerWidth <= 768) ? 4 : 10;
const _spotPool = [];
let _spotArchives = [];
let _spotKey = '';

function createSpotlightPool(scene, archives) {
	_spotArchives = archives;
	for (let i = 0; i < Math.min(SPOTLIGHT_POOL_SIZE, archives.length); i++) {
		const spot = new THREE.SpotLight(0xffffff, 0, 60, Math.PI / 5, 0.35);
		spot.castShadow = false;
		const target = new THREE.Object3D();
		scene.add(spot, target);
		spot.target = target;
		_spotPool.push(spot);
	}
}

// Dipanggil dari render loop (di-throttle). Assign tiap light ke arsip terdekat.
export function updateArchiveSpotlights(camera) {
	if (!_spotPool.length) return;

	const nearest = _spotArchives
		.map((a) => [a, camera.position.distanceToSquared(a.position)])
		.sort((x, y) => x[1] - y[1])
		.slice(0, _spotPool.length);

	const key = nearest.map(([a]) => a.uuid).join(',');
	if (key === _spotKey) return; // himpunan terdekat tidak berubah
	_spotKey = key;

	_spotPool.forEach((spot, i) => {
		const hit = nearest[i];
		if (!hit) { spot.intensity = 0; return; }
		const p = hit[0].position;
		spot.position.set(p.x, p.y + 7, p.z);
		spot.target.position.copy(p);
		spot.intensity = 4;
	});
}

// Geometry & material fixture lampu dibuat sekali, dipakai ulang semua arsip
let _lampGeo = null;
let _coneGeo = null;
let _lampMat = null;
let _coneMat = null;

function lampAssets() {
	if (!_lampGeo) {
		_lampGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12).rotateX(Math.PI / 2);
		_coneGeo = new THREE.ConeGeometry(0.5, 1, 12, 1, true).rotateX(Math.PI / 2).rotateX(Math.PI);
		_lampMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
		_coneMat = new THREE.MeshStandardMaterial({ color: 0x444444, side: THREE.DoubleSide });
	}
	return { _lampGeo, _coneGeo, _lampMat, _coneMat };
}

// Fixture lampu fisik (silinder + reflektor) di atas tiap arsip. Sorotan
// cahayanya di-handle pool terbatas -> lihat createSpotlightPool.
function addArchiveLamp(scene, archive) {
	const { _lampGeo, _coneGeo, _lampMat, _coneMat } = lampAssets();
	const pos = new THREE.Vector3(archive.position.x, archive.position.y + 7, archive.position.z);

	const lamp = new THREE.Mesh(_lampGeo, _lampMat);
	lamp.position.copy(pos);
	lamp.lookAt(archive.position);
	scene.add(lamp);

	const cone = new THREE.Mesh(_coneGeo, _coneMat);
	cone.position.copy(pos);
	cone.lookAt(archive.position);
	scene.add(cone);
}

function createArchiveMesh(item, textureLoader) {
	// Arsip pakai MeshBasicMaterial: selalu terbaca, tak butuh light. Texture
	// diganti ke hasil render PDF setelah selesai (lihat bawah).
	const material = new THREE.MeshBasicMaterial({ map: sharedPlaceholderTexture() });
	const page = new THREE.Mesh(sharedPageGeo(), material);

	// ===== Bingkai =====
	const frameMat = new THREE.MeshBasicMaterial({
		map: sharedFrameTexture(textureLoader),
		transparent: true,
	});
	const frame = new THREE.Mesh(sharedFrameGeo(), frameMat);

	page.position.z = 0.01;

	const group = new THREE.Group();
	group.add(frame);
	group.add(page);

	group.userData = {
		type: 'archive',
		info: {
			title: item.Name,
			classification: item.Klasifikasi,
			year: item.Year,
			amount: item.Amount,
			// Dibuka di tab baru lewat ViewerJS (tidak gampang di-download)
			link: 'https://silat.bekasikab.go.id/ViewerJS/#/' + item.Path,
		},
		url: item.Url, // dipakai untuk render tekstur (pdf.js)
	};

	// Render halaman pertama PDF di background (antri, pakai worker bersama).
	// Arsip tetap tampil dengan placeholder sampai texture-nya siap.
	runPdfTask(async () => {
		const pdf = await pdfjsLib.getDocument({ url: item.Url, worker: getPdfWorker() }).promise;
		const firstPage = await pdf.getPage(1);
		const viewport = firstPage.getViewport({ scale: 1.5 });

		const canvas = document.createElement('canvas');
		canvas.width = viewport.width;
		canvas.height = viewport.height;

		const context = canvas.getContext('2d');
		await firstPage.render({ canvasContext: context, viewport }).promise;

		// Naikkan brightness/contrast supaya scan lebih terbaca
		const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
		const px = imageData.data;
		const brightness = 50; // -255 .. +255
		const contrast = 1.5;  // 1.0 = normal
		for (let i = 0; i < px.length; i += 4) {
			px[i] = Math.min(255, Math.max(0, contrast * (px[i] - 128) + 128 + brightness));
			px[i + 1] = Math.min(255, Math.max(0, contrast * (px[i + 1] - 128) + 128 + brightness));
			px[i + 2] = Math.min(255, Math.max(0, contrast * (px[i + 2] - 128) + 128 + brightness));
		}
		context.putImageData(imageData, 0, 0);

		material.map = new THREE.CanvasTexture(canvas);
		material.needsUpdate = true;

		pdf.destroy(); // lepas dokumen dari memori (worker tetap hidup, dipakai arsip lain)
	});

	return group;
}
