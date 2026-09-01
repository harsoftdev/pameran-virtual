import * as THREE from "three";
import { displayArchiveInfo, hideArchiveInfo } from "./archiveInfo.js";
import { updateArchiveSpotlights } from "./archives.js";
import { isAutoTourRunning } from "./autoTour.js";
import { updateMovement } from "./movement.js";
import { updateOverlayVisibility, clickableOverlays } from "./furniture.js";

const ARCHIVE_VIEW_DISTANCE = 8;
const OVERLAY_CHECK_EVERY = 6; // frame
const SPOTLIGHT_UPDATE_EVERY = 8; // frame

export const setupRendering = (
	scene,
	camera,
	renderer,
	archives,
	controls,
	walls,
	css3dRenderer,
	css3dScene
) => {
	const clock = new THREE.Clock();
	let frame = 0;
	let shownArchive = null; // arsip yang panel infonya sedang tampil

	const render = () => {
		const delta = clock.getDelta();
		frame++;

		const touring = isAutoTourRunning();

		// Saat tur otomatis, kamera dikendalikan autoTour -> jangan diganggu
		if (!touring) {
			updateMovement(delta, controls, camera, walls);

			// Cari arsip terdekat dalam radius; update DOM hanya saat berganti
			let nearest = null;
			for (const archive of archives) {
				if (camera.position.distanceTo(archive.position) < ARCHIVE_VIEW_DISTANCE) {
					nearest = archive;
				}
			}
			if (nearest !== shownArchive) {
				shownArchive = nearest;
				if (nearest) displayArchiveInfo(nearest.userData.info);
				else hideArchiveInfo();
			}
		} else {
			shownArchive = null;
		}

		// Sorotan lampu galeri mengikuti arsip terdekat
		if (frame % SPOTLIGHT_UPDATE_EVERY === 0) {
			updateArchiveSpotlights(camera);
		}

		renderer.render(scene, camera);

		// Occlusion check overlay iframe: mahal (raycast) -> jangan tiap frame
		if (clickableOverlays.length && frame % OVERLAY_CHECK_EVERY === 0) {
			updateOverlayVisibility(camera, clickableOverlays, scene);
		}

		if (css3dRenderer && css3dScene) {
			css3dRenderer.render(css3dScene, camera);
		}

		requestAnimationFrame(render);
	};

	render();
};
