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
