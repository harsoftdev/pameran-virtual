import * as THREE from "three";
import { scene, setupScene } from "./modules/scene.js";
import { createPaintings } from "./modules/paintings.js";
import { createDoor, createSkyBehindDoor, createSkyOutside, createWalls, createWindow } from "./modules/walls.js";
import { setupFloor } from "./modules/floor.js";
import { createCeiling } from "./modules/ceiling.js";
import { createBoundingBoxes } from "./modules/boundingBox.js";
import { setupRendering } from "./modules/rendering.js";
import { setupEventListeners } from "./modules/eventListeners.js";
import { addObjectsToScene } from "./modules/sceneHelpers.js";
import { setupPlayButton } from "./modules/menu.js";
import { clickHandling, updatePointerLockStatus } from "./modules/clickHandling.js";
import { createFurniture, createPots } from "./modules/furniture.js";
import { createMiddleWall, createTitleBox } from "./modules/middleWall.js";

// === LOADING MANAGER SETUP ===
const manager = new THREE.LoadingManager();

const startTime = Date.now();

// Update progress bar setiap kali ada asset di-load
manager.onProgress = function (url, itemsLoaded, itemsTotal) {
	const percent = (itemsLoaded / itemsTotal) * 100;
	document.getElementById("progress-bar").style.width = percent + "%";
	document.getElementById("progress-text").textContent =
		// `Memuat Pameran Virtual... ${Math.round(percent)}%`;
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
		setTimeout(() => (loaderDiv.style.display = "none"), 500);
	}, wait);
};

// Gunakan manager di TextureLoader
const textureLoader = new THREE.TextureLoader(manager);

let camera, controls, renderer;

(async () => {
	// setup scene
	({ camera, controls, renderer } = setupScene());

	// bikin objek scene
	const walls = createWalls(scene, textureLoader);
	const middleWalls = await createMiddleWall(scene, textureLoader);
	setupFloor(scene);
	const furniture = await createFurniture(scene);
	createCeiling(scene, textureLoader);
	const door = createDoor(scene, textureLoader);
	createSkyBehindDoor(scene, door, textureLoader);
	createPots(scene);
	const [leftWindow, rightWindow] = createWindow(scene, textureLoader);
	createSkyOutside(scene, [leftWindow, rightWindow], textureLoader);
	// Tambahkan ambient + hemi light untuk penerangan seluruh ruangan
	const ambient = new THREE.AmbientLight(0xffffff, 0.3);
	scene.add(ambient);
	const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
	hemiLight.position.set(0, 20, 0);
	scene.add(hemiLight);

	const paintings = await createPaintings(scene, textureLoader);

	// bounding box
	createBoundingBoxes(walls);
	createBoundingBoxes(middleWalls);
	createBoundingBoxes(paintings);

	const allWalls = [...walls.children, ...middleWalls.children, ...furniture];

	await createTitleBox(scene);

	// add ke scene
	addObjectsToScene(scene, paintings);

	// setup controls & event
	setupPlayButton(controls);
	setupEventListeners(controls);
	clickHandling(renderer, camera, paintings);
	setupRendering(scene, camera, renderer, paintings, controls, allWalls);

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
