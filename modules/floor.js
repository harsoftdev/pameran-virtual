import * as THREE from "three";

export const setupFloor = (scene, manager) => {
	const textureLoader = new THREE.TextureLoader(manager);

	const colorTexture = textureLoader.load("WoodFloor040_4K-JPG/WoodFloor040_4K_Color.webp");
	const normalTexture = textureLoader.load("WoodFloor040_4K-JPG/WoodFloor040_4K_NormalGL.webp");
	const roughnessTexture = textureLoader.load("WoodFloor040_4K-JPG/WoodFloor040_4K_Roughness.webp");
	const aoTexture = textureLoader.load("WoodFloor040_4K-JPG/WoodFloor040_4K_AmbientOcclusion.webp");

	for (const tex of [colorTexture, normalTexture, roughnessTexture, aoTexture]) {
		tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
		tex.repeat.set(4, 4);
	}
	colorTexture.colorSpace = THREE.SRGBColorSpace;

	// Plane hanya 2 segitiga -> displacementMap tidak diikutkan (tak berefek, hanya beban download)
	const planeGeometry = new THREE.PlaneGeometry(102, 102);

	const planeMaterial = new THREE.MeshStandardMaterial({
		map: colorTexture,
		normalMap: normalTexture,
		roughnessMap: roughnessTexture,
		aoMap: aoTexture,
		side: THREE.DoubleSide,
	});

	const floorPlane = new THREE.Mesh(planeGeometry, planeMaterial);
	floorPlane.rotation.x = -Math.PI / 2;
	floorPlane.position.y = 0;

	scene.add(floorPlane);
};
