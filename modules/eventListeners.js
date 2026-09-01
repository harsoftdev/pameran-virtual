import { keysPressed } from "./movement.js"; // import the keysPressed object
import { showMenu, hideMenu, hideControls, showConstrols } from "./menu.js";
import { updatePointerLockStatus } from "./clickHandling.js";
import { toggleAudio } from "./audioGuide.js";
import { isAutoTourRunning, stopGuidedTour } from "./autoTour.js";

// controls is the PointerLockControls instance, passed from main.js
export const setupEventListeners = (controls) => {
	document.addEventListener("keydown", (event) => onKeyDown(event, controls), false);
	document.addEventListener("keyup", (event) => onKeyUp(event, controls), false);

	controls.addEventListener("unlock", () => updatePointerLockStatus(false));
	controls.addEventListener("lock", () => updatePointerLockStatus(true));
};

function onKeyDown(event, controls) {
	if (event.key in keysPressed) {
		keysPressed[event.key] = true;
	}

	// WASD button visual feedback
	const key = event.key.toLowerCase();
	if (["w", "a", "s", "d"].includes(key)) {
		document.getElementById(`${key}-button`)?.classList.add("pressed");
	}

	if (event.key === "Escape" || event.key === "e") {
		// Kalau sedang tur otomatis, hentikan dulu (dia yang urus menu)
		if (isAutoTourRunning()) {
			stopGuidedTour();
			return;
		}
		// Kembali ke menu awal (tampilan selamat datang)
		showMenu();
		hideControls();
		if (document.pointerLockElement) {
			controls.unlock();
		}
		return;
	}

	if (event.key === "p") {
		controls.unlock();
	}

	if (event.key === "Enter" || event.key === "Return") {
		hideMenu();
		showConstrols();
		controls.lock();
	}

	if (event.key === " ") {
		// SPASI = toggle pointer lock (tidak ke menu)
		event.preventDefault(); // Prevent browser default scroll behavior

		if (document.pointerLockElement) {
			controls.unlock();
		} else {
			controls.lock();
		}
		document.getElementById("space-button")?.classList.add("pressed");
	}

	if (event.key === "m") {
		toggleAudio();
		document.getElementById("sound-button")?.classList.add("pressed");
	}

	if (event.key === "r") {
		location.reload();
	}
}

function onKeyUp(event, controls) {
	if (event.key in keysPressed) {
		keysPressed[event.key] = false;
	}

	// Remove the "pressed" visual state from the on-screen buttons
	const key = event.key.toLowerCase();
	if (["w", "a", "s", "d"].includes(key)) {
		document.getElementById(`${key}-button`)?.classList.remove("pressed");
	}
	if (event.key === " ") {
		document.getElementById("space-button")?.classList.remove("pressed");
	}
	if (event.key === "m") {
		document.getElementById("sound-button")?.classList.remove("pressed");
	}
}
