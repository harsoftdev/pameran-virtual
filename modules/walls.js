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
