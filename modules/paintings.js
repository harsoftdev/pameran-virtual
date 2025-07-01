import * as THREE from 'three';

import { paintingData } from './paintingData.js';

export function createPaintings(scene, textureLoader) {

	let paintings = [];

	paintingData.forEach((data) => {

		const painting = new THREE.Mesh(
			new THREE.PlaneGeometry(data.width, data.height),
			new THREE.MeshLambertMaterial({ map: textureLoader.load(data.imgSrc) })
		);

		painting.position.set(data.position.x, data.position.y, data.position.z);
		painting.rotation.y = data.rotationY;


		painting.userData = {
			type: 'painting',
			info: data.info,
			url: data.info.link
		};

		painting.castShadow = true;
		painting.receiveShadow = true;

		paintings.push(painting);
	});

	return paintings;
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
	const doorHeight = 3;

	// Ketinggian lantai
	const floorY = 0;

	// Jadi posisi Y pintu = dasar lantai + setengah tinggi pintu
	door.position.y = floorY + (doorHeight / 2); // = 3.5

	// Tempel ke dinding belakang
	door.position.z = 20 - 0.05; // Mundur sedikit supaya nggak z-fighting
	door.rotation.y = Math.PI;

	scene.add(door);
};


