import * as THREE from 'three';
import { clickableOverlays } from './furniture.js';

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let isPointerLocked = false;

// Export function untuk update pointer lock status
function updatePointerLockStatus(locked) {
	isPointerLocked = locked;
}

function clickHandling(renderer, camera, paintings) {
	renderer.domElement.addEventListener(
		'click',
		(event) => {
			// Hanya proses click jika pointer TIDAK sedang terkunci (cursor terlihat)
			if (isPointerLocked) {
				return;
			}
			
			mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
			onClick(camera, paintings);
		},
		false
	);
}

function onClick(camera, paintings) {
	raycaster.setFromCamera(mouse, camera);
	
	// Periksa klik pada overlay YouTube terlebih dahulu
	// Untuk CSS3D objects, kita perlu menggunakan pendekatan yang berbeda
	for (let i = 0; i < clickableOverlays.length; i++) {
		const overlay = clickableOverlays[i];
		if (overlay.css3dObject) {
			// Untuk CSS3D objects, kita bisa menggunakan event listener langsung pada element
			// atau menggunakan raycasting dengan bounding box
			const css3dObject = overlay.css3dObject;

			// Buat bounding box untuk CSS3D object
			const box = new THREE.Box3().setFromObject(css3dObject);
			if (raycaster.ray.intersectsBox(box)) {
				console.log('Clicked YouTube iframe overlay:', overlay.youtubeUrl);

				// Fokus pada iframe untuk interaksi yang lebih baik
				if (overlay.iframe) {
					overlay.iframe.focus();
				}

				// Buka URL di tab baru seperti sebelumnya
				window.open(overlay.youtubeUrl, '_blank');
				return;
			}
		}
	}
	
	// Jika tidak klik overlay, periksa klik pada paintings
	const intersects = raycaster.intersectObjects(paintings);
	if (intersects.length > 0 && intersects[0].object.parent) {
		const painting = intersects[0].object.parent;
		// Perform the desired action, e.g., open a modal or redirect to another page
		console.log('Clicked painting:', painting.userData.info.title);
		window.open(painting.userData.info.link, '_blank');
	}
}

export { clickHandling, updatePointerLockStatus };
