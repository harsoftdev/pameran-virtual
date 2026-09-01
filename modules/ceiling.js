import * as THREE from "three";

// create a function that takes a scene and a textureLoader as arguments that will be passed in from main.js where the createCeiling is called
export const createCeiling = (scene, textureLoader) => {
	const colorTexture = textureLoader.load("OfficeCeiling005_4K-JPG/OfficeCeiling005_4K_Color.webp");
	const aoTexture = textureLoader.load("OfficeCeiling005_4K-JPG/OfficeCeiling005_4K_AmbientOcclusion.webp");
	const normalGLTexture = textureLoader.load("OfficeCeiling005_4K-JPG/OfficeCeiling005_4K_NormalGL.webp");
	const roughnessTexture = textureLoader.load("OfficeCeiling005_4K-JPG/OfficeCeiling005_4K_Roughness.webp");

	for (const tex of [colorTexture, aoTexture, normalGLTexture, roughnessTexture]) {
		tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
	}
	colorTexture.colorSpace = THREE.SRGBColorSpace;

	// Plane 2 segitiga: displacementMap dibuang (tak berefek). emissiveMap & metalnessMap
	// juga dibuang -> emissive default hitam = no-op, metalness bikin gelap tanpa env map.
	const ceilingGeometry = new THREE.PlaneGeometry(102, 102);

	const ceilingMaterial = new THREE.MeshStandardMaterial({
		map: colorTexture,
		aoMap: aoTexture,
		normalMap: normalGLTexture,
		roughnessMap: roughnessTexture,
		side: THREE.DoubleSide,
	});
	const ceilingPlane = new THREE.Mesh(ceilingGeometry, ceilingMaterial);

	ceilingPlane.rotation.x = Math.PI / 2;
	ceilingPlane.position.y = 15;

	scene.add(ceilingPlane);
};
