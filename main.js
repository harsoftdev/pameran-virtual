import * as THREE from "three";
import { scene, setupScene } from "./modules/scene.js";
import { createPaintings } from "./modules/paintings.js";
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

// === LOADING MANAGER SETUP ===
const manager = new THREE.LoadingManager();

// Detect device and performance capability
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

// Check for low-end desktop (optional optimization)
const isLowEndDesktop = !isMobile && (
    navigator.hardwareConcurrency <= 4 || // CPU cores
    !window.WebGL2RenderingContext // No WebGL2 support
);


console.log('Device type:', isMobile ? 'Mobile' : (isLowEndDesktop ? 'Low-end Desktop' : 'Desktop'));

const startTime = Date.now();
let maxPercent = 0;

// Update progress bar setiap kali ada asset di-load
manager.onProgress = function (url, itemsLoaded, itemsTotal) {
	const percent = (itemsLoaded / itemsTotal) * 100;
	maxPercent = Math.max(maxPercent, percent);
	document.getElementById("progress-bar").style.width = maxPercent + "%";
	document.getElementById("progress-text").textContent =
		// `Memuat Pameran Virtual... ${Math.round(maxPercent)}%`;
		`Memuat Pameran Virtual...`;
};

// Ketika semua asset selesai di-load
manager.onLoad = function () {
	const elapsed = Date.now() - startTime;
	const minDuration = 1500; // minimal 1.5 detik tampil biar smooth

	const wait = Math.max(0, minDuration - elapsed);

	setTimeout(async () => {
		// pastikan shader sudah compile sebelum loader hilang
		if (renderer.compileAsync) {
			await renderer.compileAsync(scene, camera);
		} else {
			renderer.render(scene, camera); // fallback render sekali
		}

		// fade-in canvas
		document.querySelector("canvas").classList.add("loaded");

		// hilangkan loader
		const loaderDiv = document.getElementById("loader");
		loaderDiv.style.opacity = 0;
		setTimeout(() => {
			loaderDiv.style.display = "none";
		}, 500);
	}, wait);
};

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
	// Ambil data exhibition untuk validasi dan YouTube links
	let exhibitionData = null;
	try {
		const response = await fetch('https://silat.bekasikab.go.id/api/exhibitions');
		const data = await response.json();
		exhibitionData = data.data;
	} catch (error) {
		console.warn('Could not fetch exhibition data:', error);
		// Jika gagal fetch, lanjutkan tanpa validasi
	}

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

	// setup scene
	({ camera, controls, renderer, css3dRenderer, css3dScene } = setupScene(isMobile || isLowEndDesktop));

	// setup audio
	await setupAudio(camera);
	// bikin objek scene
	const walls = createWalls(scene, textureLoader, isMobile, isLowEndDesktop);
	const middleWalls = await createMiddleWall(scene, textureLoader);
	setupFloor(scene, isMobile || isLowEndDesktop);
	const furniture = await createFurniture(scene, isMobile || isLowEndDesktop);
	createCeiling(scene, textureLoader, isMobile || isLowEndDesktop);
	createDoor(scene, textureLoader);
	createPots(scene, isMobile || isLowEndDesktop);
	const [leftWindow, rightWindow] = createWindow(scene, textureLoader);
	createSkyOutside(scene, [leftWindow, rightWindow], textureLoader);

	const tvMonitors = await createTvMonitor(scene, css3dScene, exhibitionData?.youtube_link_1, exhibitionData?.youtube_link_2, isMobile || isLowEndDesktop);
	// Tambahkan ambient + hemi light untuk penerangan seluruh ruangan
	const ambient = new THREE.AmbientLight(0xffffff, 0.3);
	scene.add(ambient);
	const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
	hemiLight.position.set(0, 20, 0);
	scene.add(hemiLight);

	const paintings = await createPaintings(scene, textureLoader, manager, isMobile || isLowEndDesktop);

	// bounding box
	createBoundingBoxes(walls);
	createBoundingBoxes(middleWalls);
	createBoundingBoxes(paintings);
	createBoundingBoxes(tvMonitors);

	const allWalls = [...walls.children, ...middleWalls.children, ...furniture, ...tvMonitors];

	await createTitleBox(scene);

	// add ke scene
	addObjectsToScene(scene, paintings);

	// setup controls & event
	setupPlayButton(controls);
	setupAutoTourButton(controls);
	initAutoTour(paintings, camera, controls);
	setupEventListeners(controls, camera, scene, renderer);
	clickHandling(renderer, camera, paintings);
	setupRendering(scene, camera, renderer, paintings, controls, allWalls, css3dRenderer, css3dScene);

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
		const infoElement = document.getElementById("painting-info");
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
