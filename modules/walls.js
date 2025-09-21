import * as THREE from "three";

export function createWalls(scene, textureLoader) {
	let wallGroup = new THREE.Group();
	scene.add(wallGroup);

	const normalTexture = textureLoader.load(
		"leather_white_4k.gltf/textures/leather_white_nor_gl_4k.jpg"
	);
	const roughnessTexture = textureLoader.load(
		"leather_white_4k.gltf/textures/leather_white_rough_4k.jpg"
	);

	normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
	roughnessTexture.wrapS = roughnessTexture.wrapT = THREE.RepeatWrapping;

	const wallMaterial = new THREE.MeshStandardMaterial({
		color: 0xadadae,
		normalMap: normalTexture,
		roughnessMap: roughnessTexture,
		side: THREE.DoubleSide,
	});

	// Front Wall
	const frontWall = new THREE.Mesh(
		new THREE.BoxGeometry(80, 50, 0.001),
		wallMaterial
	);

	frontWall.position.z = -40;

	// Left Wall
	const leftWall = new THREE.Mesh(
		new THREE.BoxGeometry(80, 50, 0.001),
		wallMaterial
	);

	leftWall.rotation.y = Math.PI / 2;
	leftWall.position.x = -40;

	// Right Wall
	const rightWall = new THREE.Mesh(
		new THREE.BoxGeometry(80, 50, 0.001),
		wallMaterial
	);

	rightWall.position.x = 40;
	rightWall.rotation.y = Math.PI / 2;

	// Back Wall
	const backWall = new THREE.Mesh(
		new THREE.BoxGeometry(80, 50, 0.001),
		wallMaterial
	);
	backWall.position.z = 40;

	wallGroup.add(frontWall, backWall, leftWall, rightWall);

	return wallGroup;
}

export const createDoor = (scene, textureLoader) => {
	const doorTexture = textureLoader.load('images/door.png');
	const doorGeometry = new THREE.PlaneGeometry(5, 10);
	const doorMaterial = new THREE.MeshStandardMaterial({
		map: doorTexture,
		side: THREE.DoubleSide,
		transparent: true,
		depthTest: true,
	});

	const door = new THREE.Mesh(doorGeometry, doorMaterial);
	door.renderOrder = 1;

	const floorY = 0;
	const doorHeight = 10; // sesuaikan dengan geometry
	door.position.y = floorY + doorHeight / 2; // tengah pintu
	door.position.z = 40 - 0.05;
	door.rotation.y = Math.PI;

	scene.add(door);
	return door;
};

export const createWindow = (scene, textureLoader) => {
	const windowTexture = textureLoader.load('images/window.png');
	const windowGeometry = new THREE.PlaneGeometry(12, 8);
	const windowMaterial = new THREE.MeshStandardMaterial({
		map: windowTexture,
		transparent: true,
		side: THREE.DoubleSide,
		depthTest: true,
	});

	const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
	const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);

	// Posisi kiri dan kanan dari pintu
	const doorWidth = 5;
	const windowOffset = 14; // jarak dari pinggir pintu
	const windowHeight = 6;
	const backWallZ = 40 - 0.05;

	leftWindow.position.set(-doorWidth / 2 - windowOffset, windowHeight, backWallZ);
	rightWindow.position.set(doorWidth / 2 + windowOffset, windowHeight, backWallZ);

	leftWindow.rotation.y = Math.PI;
	rightWindow.rotation.y = Math.PI;

	leftWindow.renderOrder = 1;
	rightWindow.renderOrder = 1;

	scene.add(leftWindow, rightWindow);

	return [leftWindow, rightWindow];
};

export const createSkyBehindDoor = (scene, doorMesh, textureLoader) => {
	const skyTexture = textureLoader.load('images/clouds-sky.jpg');
	const { width, height } = doorMesh.geometry.parameters;
	const skyGeometry = new THREE.PlaneGeometry(width, height);
	skyGeometry.scale(0.85, 0.85, 1);
	const skyMaterial = new THREE.MeshStandardMaterial({
		map: skyTexture,
		transparent: true,
		side: THREE.DoubleSide,
	});

	const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
	skyMesh.position.copy(doorMesh.position);
	skyMesh.position.z = doorMesh.position.z + 0.01;
	skyMesh.rotation.copy(doorMesh.rotation);
	skyMesh.renderOrder = 0;

	scene.add(skyMesh);
	return skyMesh;
};

export const createSkyOutside = (scene, windowMeshes, textureLoader) => {
	const skyTexture = textureLoader.load('images/clouds-sky.jpg');
	return windowMeshes.map((win) => {
		const { width, height } = win.geometry.parameters;
		const skyGeometry = new THREE.PlaneGeometry(width, height);
		skyGeometry.scale(0.75, 0.75, 1);
		const skyMaterial = new THREE.MeshStandardMaterial({
			map: skyTexture,
			transparent: true,
			side: THREE.DoubleSide,
		});

		const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
		skyMesh.position.copy(win.position);
		skyMesh.position.z = win.position.z + 0.01;
		skyMesh.rotation.copy(win.rotation);
		skyMesh.renderOrder = 0;

		scene.add(skyMesh);
		return skyMesh;
	});
};

