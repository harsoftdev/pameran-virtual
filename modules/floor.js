import * as THREE from "three";

export const setupFloor = (scene) => {
	const textureLoader = new THREE.TextureLoader();

	const colorTexture = textureLoader.load("WoodFloor040_4K-JPG/WoodFloor040_4K_Color.jpg");
	const displacementTexture = textureLoader.load("WoodFloor040_4K-JPG/WoodFloor040_4K_Displacement.jpg");
	const normalTexture = textureLoader.load("WoodFloor040_4K-JPG/WoodFloor040_4K_NormalGL.jpg");
	const roughnessTexture = textureLoader.load("WoodFloor040_4K-JPG/WoodFloor040_4K_Roughness.jpg");
	const aoTexture = textureLoader.load("WoodFloor040_4K-JPG/WoodFloor040_4K_AmbientOcclusion.jpg");

	colorTexture.wrapS = colorTexture.wrapT = THREE.RepeatWrapping;
	displacementTexture.wrapS = displacementTexture.wrapT = THREE.RepeatWrapping;
	normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
	roughnessTexture.wrapS = roughnessTexture.wrapT = THREE.RepeatWrapping;
	aoTexture.wrapS = aoTexture.wrapT = THREE.RepeatWrapping;

	// Repeat UV biar tekstur tile ulang
	colorTexture.repeat.set(4, 4);
	displacementTexture.repeat.set(4, 4);
	normalTexture.repeat.set(4, 4);
	roughnessTexture.repeat.set(4, 4);
	aoTexture.repeat.set(4, 4);

	const planeGeometry = new THREE.PlaneGeometry(102, 102);
	planeGeometry.setAttribute(
		'uv2',
		new THREE.BufferAttribute(planeGeometry.attributes.uv.array, 2)
	);

	const planeMaterial = new THREE.MeshStandardMaterial({
		map: colorTexture,
		displacementMap: displacementTexture,
		normalMap: normalTexture,
		roughnessMap: roughnessTexture,
		aoMap: aoTexture,
		displacementScale: 0.1,
		side: THREE.DoubleSide,
	});

	const floorPlane = new THREE.Mesh(planeGeometry, planeMaterial);
	floorPlane.rotation.x = -Math.PI / 2;
	floorPlane.position.y = 0;

	scene.add(floorPlane);
};
