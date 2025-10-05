import { keysPressed } from "./movement.js"; // import the keysPressed object
import { showMenu, hideMenu, hideControls, showConstrols } from "./menu.js"; // import the showMenu function
import { updatePointerLockStatus } from "./clickHandling.js"; // import untuk update pointer lock status

let lockPointer = false; // Awalnya pointer belum terkunci
let showMenuOnUnlock = false;
let escPressed = false; // Flag khusus untuk ESC

// add the controls parameter which is the pointer lock controls and is passed from main.js where setupEventListeners is called
export const setupEventListeners = (controls, camera, scene) => {
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

	controls.addEventListener("unlock", () => {
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
		updatePointerLockStatus(true); // Update status click handling
	});
};

function onKeyDown(event, controls) {
	// event is the event object that has the key property
	if (event.key in keysPressed) {
		// check if the key pressed by the user is in the keysPressed object
		keysPressed[event.key] = true; // if yes, set the value of the key pressed to true
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
		if (lockPointer) {
			controls.unlock(); // unlock the pointer
		} else {
			controls.lock(); // lock the pointer
		}
		lockPointer = !lockPointer; // toggle the lockPointer variable

		const button = document.getElementById(`space-button`);
		if (button) {
			button.classList.add("pressed");
		}
	}

	if (event.key === "m") {
		// if the "h" key is pressed
		showMenu(); // show the menu
		hideControls();
		showMenuOnUnlock = true;
		controls.unlock(); // unlock the pointer
		lockPointer = false;
	}

	if (event.key === "r") {
		// if the "r" key is pressed
		location.reload(); // reload the page
	}

	// Perbaiki logika untuk tombol A, S, W, D
	document.addEventListener("keydown", (event) => {
		const key = event.key.toLowerCase();
		if (["w", "a", "s", "d"].includes(key)) {
			const button = document.getElementById(`${key}-button`);
			if (button) {
				button.classList.add("pressed");
			}
		}
	});

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
	});
}

function onKeyUp(event, controls) {
	// same but for keyup
	if (event.key in keysPressed) {
		keysPressed[event.key] = false; // set to false when the key is released
	}
}