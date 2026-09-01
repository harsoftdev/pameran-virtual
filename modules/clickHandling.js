import * as THREE from 'three';
import { clickableOverlays } from './furniture.js';

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let isPointerLocked = false;

function updatePointerLockStatus(locked) {
	isPointerLocked = locked;
}

function clickHandling(renderer, camera, archives) {
	renderer.domElement.addEventListener(
		'click',
		(event) => {
			// Hanya proses klik saat pointer TIDAK terkunci (cursor terlihat)
			if (isPointerLocked) {
				return;
			}

			mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
			onClick(camera, archives);
		},
		false
	);
}

function onClick(camera, archives) {
	raycaster.setFromCamera(mouse, camera);

	// Cek klik pada overlay YouTube (CSS3D) lebih dulu, via bounding box
	for (let i = 0; i < clickableOverlays.length; i++) {
		const overlay = clickableOverlays[i];
		if (overlay.css3dObject) {
			const box = new THREE.Box3().setFromObject(overlay.css3dObject);
			if (raycaster.ray.intersectsBox(box)) {
				if (overlay.iframe) {
					overlay.iframe.focus();
				}
				window.open(overlay.youtubeUrl, '_blank');
				return;
			}
		}
	}

	// Selain itu, cek klik pada arsip -> buka ViewerJS di tab baru
	const intersects = raycaster.intersectObjects(archives);
	if (intersects.length > 0 && intersects[0].object.parent) {
		window.open(intersects[0].object.parent.userData.info.link, '_blank');
	}
}

export { clickHandling, updatePointerLockStatus };
