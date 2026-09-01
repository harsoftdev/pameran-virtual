import * as THREE from "three";
import { scene, setupScene } from "./modules/scene.js";
import { createArchives } from "./modules/archives.js";
import { createDoor, createSkyOutside, createWalls, createWindow } from "./modules/walls.js";
import { setupFloor } from "./modules/floor.js";
import { createCeiling } from "./modules/ceiling.js";
import { createBoundingBoxes } from "./modules/boundingBox.js";
import { setupRendering } from "./modules/rendering.js";
import { setupEventListeners } from "./modules/eventListeners.js";
import { addObjectsToScene } from "./modules/sceneHelpers.js";
import { setupPlayButton } from "./modules/menu.js";
import { clickHandling, updatePointerLockStatus } from "./modules/clickHandling.js";
import { createFurniture, createPots, createTvMonitor } from "./modules/furniture.js";
import { createMiddleWall, createTitleBox } from "./modules/middleWall.js";
import { setupAudio, startAudio } from "./modules/audioGuide.js";
import { initAutoTour, setupAutoTourButton } from "./modules/autoTour.js";
import { getExhibitionData } from "./modules/exhibitionData.js";

// === LOADING MANAGER ===
// Manager ini hanya melacak aset SCENE (tekstur ruangan + model). PDF arsip
// TIDAK dilacak di sini -- jumlahnya banyak & lambat, jadi di-stream terpisah
// dengan placeholder (lihat modules/archives.js). Loader tampil sampai scene
// benar-benar siap, bukan sampai semua PDF selesai.
const manager = new THREE.LoadingManager();
const startTime = Date.now();
let revealed = false;

const setProgress = (pct) => {
	pct = Math.round(pct);
	document.getElementById("progress-bar").style.width = pct + "%";
	document.getElementById("progress-text").textContent = `Memuat Pameran Virtual... ${pct}%`;
};

manager.onProgress = (url, itemsLoaded, itemsTotal) => {
	setProgress((itemsLoaded / itemsTotal) * 100);
};

manager.onLoad = () => revealScene();

async function revealScene() {
	if (revealed) return; // cukup sekali
	revealed = true;
	setProgress(100);

	// tahan minimal 1.5 detik biar transisi loader tidak berkedip
	const elapsed = Date.now() - startTime;
	await new Promise((r) => setTimeout(r, Math.max(0, 1500 - elapsed)));

	// pastikan shader ter-compile sebelum loader hilang
	if (renderer?.compileAsync) {
		await renderer.compileAsync(scene, camera);
	} else {
		renderer.render(scene, camera);
	}

	document.querySelector("canvas").classList.add("loaded"); // fade-in canvas

	const loaderDiv = document.getElementById("loader");
	loaderDiv.style.opacity = 0;
	setTimeout(() => { loaderDiv.style.display = "none"; }, 500);
}

// Gunakan manager di TextureLoader
const textureLoader = new THREE.TextureLoader(manager);

let camera, controls, renderer, css3dRenderer, css3dScene;

// Function to track visitor
const trackVisitor = async () => {
	try {
		// Get user's IP address from external service
		let ipAddress = null;
		try {
			const ipResponse = await fetch('https://api.ipify.org?format=json');
			const ipData = await ipResponse.json();
			ipAddress = ipData.ip;
		} catch (ipError) {
			console.warn('Could not get IP address:', ipError);
			// Continue without IP if service fails
		}

		// Get user agent
		const userAgent = navigator.userAgent;
		
		// Prepare payload
		const payload = {
			user_agent: userAgent
		};
		
		// Add IP address if successfully retrieved
		if (ipAddress) {
			payload.ip_address = ipAddress;
		}
		
		// Send tracking data to API
		const response = await fetch('https://silat.bekasikab.go.id/api/exhibition/track', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload)
		});

		if (response.ok) {
			console.log('Visitor tracking successful', ipAddress ? `(IP: ${ipAddress})` : '(no IP)');
		} else {
			console.warn('Visitor tracking failed:', response.status);
		}
	} catch (error) {
		console.warn('Visitor tracking error:', error);
		// Don't stop execution if tracking fails
	}
};

(async () => {
	// Ambil data exhibition (cached, dipakai bareng audioGuide & middleWall)
	const exhibitionData = await getExhibitionData();

	// Validasi berdasarkan is_periodic
	if (exhibitionData && exhibitionData.is_periodic) {
		const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
		const startDate = exhibitionData.start_date;
		const endDate = exhibitionData.end_date;

		if (currentDate < startDate) {
			// Belum dimulai
			document.getElementById("progress-container").style.display = "none";
			document.getElementById("progress-text").textContent = "Pameran Virtual belum dimulai";
			document.getElementById("progress-text").style.fontSize = "2em";
			document.getElementById("progress-bar").style.display = "none";
			document.getElementById("loader-logos").style.display = "block";
			return; // Stop eksekusi
		} else if (currentDate > endDate) {
			// Sudah selesai
			document.getElementById("progress-container").style.display = "none";
			document.getElementById("progress-text").textContent = "Pameran Virtual Sudah Selesai";
			document.getElementById("progress-text").style.fontSize = "2em";
			document.getElementById("progress-bar").style.display = "none";
			document.getElementById("loader-logos").style.display = "block";
			return; // Stop eksekusi
		}
		// Jika dalam rentang, lanjutkan
	}

	// Track visitor - only if exhibition is valid and active
	if (exhibitionData && exhibitionData.is_periodic) {
		await trackVisitor();
	}

	// Sentinel: jaga manager tetap "loading" selama scene dibangun, supaya
	// onLoad tidak kepicu prematur di sela-sela await (fetch API, load model).
	manager.itemStart("__boot__");

	// setup scene
	({ camera, controls, renderer, css3dRenderer, css3dScene } = setupScene());

	// setup audio
	await setupAudio(camera);
	// bikin objek scene
	const walls = createWalls(scene, textureLoader);
	const middleWalls = await createMiddleWall(scene, textureLoader);
	setupFloor(scene, manager);
	const furniture = await createFurniture(scene, manager);
	createCeiling(scene, textureLoader);
	createDoor(scene, textureLoader);
	createPots(scene, manager);
	const [leftWindow, rightWindow] = createWindow(scene, textureLoader);
	createSkyOutside(scene, [leftWindow, rightWindow], textureLoader);

	const tvMonitors = await createTvMonitor(scene, css3dScene, manager, exhibitionData?.youtube_link_1, exhibitionData?.youtube_link_2);

	// PDF arsip di-stream terpisah (tidak lewat loading manager)
	const archives = await createArchives(scene, textureLoader);

	// bounding box
	createBoundingBoxes(walls);
	createBoundingBoxes(middleWalls);
	createBoundingBoxes(archives);
	createBoundingBoxes(tvMonitors);

	const allWalls = [...walls.children, ...middleWalls.children, ...furniture, ...tvMonitors];

	await createTitleBox(scene);

	// add ke scene
	addObjectsToScene(scene, archives);

	// setup controls & event
	setupPlayButton(controls);
	setupAutoTourButton();
	initAutoTour(archives, camera);
	setupEventListeners(controls);
	clickHandling(renderer, camera, archives);
	setupRendering(scene, camera, renderer, archives, controls, allWalls, css3dRenderer, css3dScene);

	// Scene selesai dibangun -> lepas sentinel. onLoad jalan begitu semua
	// tekstur & model yang dilacak manager juga selesai.
	manager.itemEnd("__boot__");

	// Add one-time user interaction handler for audio autoplay
	let audioStarted = false;
	const startAudioOnInteraction = () => {
		if (!audioStarted) {
			startAudio();
			audioStarted = true;
			// Remove the listener after first use
			document.removeEventListener("click", startAudioOnInteraction);
			document.removeEventListener("keydown", startAudioOnInteraction);
		}
	};

	document.addEventListener("click", startAudioOnInteraction);
	document.addEventListener("keydown", startAudioOnInteraction);

	document.addEventListener("pointerlockchange", () => {
		const infoElement = document.getElementById("archive-info");
		const isLocked = !!document.pointerLockElement;

		if (isLocked) {
			infoElement.classList.add("locked");
		} else {
			infoElement.classList.remove("locked");
		}

		// Update click handling status
		updatePointerLockStatus(isLocked);
	});
})();
