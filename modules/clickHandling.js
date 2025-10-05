import * as THREE from 'three';

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
	const intersects = raycaster.intersectObjects(paintings);
	if (intersects.length > 0 && intersects[0].object.parent) {
		const painting = intersects[0].object.parent;
		// Perform the desired action, e.g., open a modal or redirect to another page
		console.log('Clicked painting:', painting.userData.info.title);
		window.open(painting.userData.info.link, '_blank');
	}
}

export { clickHandling, updatePointerLockStatus };
