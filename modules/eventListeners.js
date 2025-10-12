import { keysPressed } from "./movement.js"; // import the keysPressed object
import { showMenu, hideMenu, hideControls, showConstrols } from "./menu.js"; // import the showMenu function
import { updatePointerLockStatus } from "./clickHandling.js"; // import untuk update pointer lock status
import { toggleAudio } from "./audioGuide.js";
import * as THREE from "three";

let lockPointer = false; // Awalnya pointer belum terkunci
let showMenuOnUnlock = false;
let escPressed = false; // Flag khusus untuk ESC

// add the controls parameter which is the pointer lock controls and is passed from main.js where setupEventListeners is called
export const setupEventListeners = (controls, camera, scene, renderer) => {
	// add the event listeners to the document which is the whole page
	document.addEventListener(
		"keydown",
		(event) => onKeyDown(event, controls),
		false
	);
	document.addEventListener(
		"keyup",
		(event) => onKeyUp(event, controls),
		false
	);

	// Tambahkan mouse click listener untuk interaksi dengan overlay
	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();

	document.addEventListener('click', (event) => {
		// Jangan proses klik jika pointer sedang terkunci (mode 3D navigation)
		if (document.pointerLockElement) {
			return;
		}
		
		// Hitung posisi mouse dalam normalized device coordinates
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

		// Update raycaster
		raycaster.setFromCamera(mouse, camera);

		// Note: YouTube iframes sekarang langsung di 3D space melalui CSS3DRenderer
		// dan handle klik sendiri, jadi tidak perlu raycasting tambahan
	});

	controls.addEventListener("unlock", () => {
		lockPointer = false; // Pastikan state lokal selalu sinkron
		updatePointerLockStatus(false); // Update status click handling

		// Jika unlock dipicu oleh ESC, jangan lakukan apapun
		if (escPressed) {
			escPressed = false; // Reset flag
			return;
		}

		if (showMenuOnUnlock) {
			showMenu();
			hideControls();
		}
		showMenuOnUnlock = false;
	});

	controls.addEventListener("lock", () => {
		lockPointer = true; // Pastikan state lokal selalu sinkron
		updatePointerLockStatus(true); // Update status click handling
	});
};

function onKeyDown(event, controls) {
	// event is the event object that has the key property
	if (event.key in keysPressed) {
		// check if the key pressed by the user is in the keysPressed object
		keysPressed[event.key] = true; // if yes, set the value of the key pressed to true
	}

	// Handle WASD button visual feedback
	const key = event.key.toLowerCase();
	if (["w", "a", "s", "d"].includes(key)) {
		const button = document.getElementById(`${key}-button`);
		if (button) {
			button.classList.add("pressed");
		}
	}

	if (event.key === "Escape" || event.key === "e") {
		// ESC = Langsung kembali ke menu awal (tampilan selamat datang)
		showMenu(); // Tampilkan menu langsung
		hideControls(); // Sembunyikan kontrol langsung

		// Jika pointer sedang terkunci, unlock dulu
		if (document.pointerLockElement) {
			controls.unlock();
		}
		lockPointer = false;
		return; // Pastikan tidak ada logika tambahan yang dijalankan
	}

	if (event.key === "p") {
		// if the "p" key is pressed
		controls.unlock(); // unlock the pointer
		lockPointer = false;
	}

	// if key pressed is enter or return for mac
	if (event.key === "Enter" || event.key === "Return") {
		// if the "ENTER" key is pressed
		hideMenu(); // hide the menu
		showConstrols();
		controls.lock(); // lock the pointer
		lockPointer = true;
	}

	if (event.key === " ") {
		// SPASI = Toggle pointer lock saja (tidak ke menu)
		event.preventDefault(); // Prevent browser default scroll behavior
		
		// Gunakan state aktual dari document.pointerLockElement untuk akurasi
		const currentlyLocked = !!document.pointerLockElement;
		
		if (currentlyLocked) {
			controls.unlock(); // unlock the pointer
			lockPointer = false;
		} else {
			controls.lock(); // lock the pointer
			lockPointer = true;
		}

		const button = document.getElementById(`space-button`);
		if (button) {
			button.classList.add("pressed");
		}
	}

	if (event.key === "m") {
		// if the "m" key is pressed
		toggleAudio(); // toggle audio on/off
		const button = document.getElementById(`sound-button`);
		if (button) {
			button.classList.add("pressed");
		}
	}

	if (event.key === "r") {
		// if the "r" key is pressed
		location.reload(); // reload the page
	}

	// Perbaiki logika untuk tombol A, S, W, D - pindahkan ke dalam onKeyDown function
	// untuk menghindari konflik event listener

	document.addEventListener("keyup", (event) => {
		const key = event.key.toLowerCase();
		if (["w", "a", "s", "d"].includes(key)) {
			const button = document.getElementById(`${key}-button`);
			if (button) {
				button.classList.remove("pressed");
			}
		}

		if (event.key === " ") {
			const button = document.getElementById(`space-button`);
			if (button) {
				button.classList.remove("pressed");
			}
		}
		
		if (event.key === "m") {
			const button = document.getElementById(`sound-button`);
			if (button) {
				button.classList.remove("pressed");
			}
		}
	});
}

function onKeyUp(event, controls) {
	// same but for keyup
	if (event.key in keysPressed) {
		keysPressed[event.key] = false; // set to false when the key is released
	}
}

// Setup event listener - tidak diperlukan lagi karena iframe YouTube handle sendiri
document.addEventListener('DOMContentLoaded', () => {
	// YouTube iframes sekarang langsung di 3D space dan handle event sendiri
});