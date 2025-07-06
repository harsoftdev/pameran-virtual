export const hideMenu = () => {
	const menu = document.getElementById('menu');
	menu.style.display = 'none'; // Hide the menu
};

export const showMenu = () => {
	const menu = document.getElementById('menu');
	menu.style.display = 'block'; // Show the menu
};

// Lock the pointer (controls are activated) and hide the menu when the experience starts
export const startExperience = (controls) => {
	controls.lock(); // Lock the pointer (controls are activated)
	hideMenu();
	showConstrols();
};

export const setupPlayButton = (controls) => {
	const playButton = document.getElementById('play_button'); // Get the reference
	playButton.addEventListener('click', () => startExperience(controls)); // Add the click event listener to the play button to start the experience
};

export const showConstrols = () => {
	const controlWrapper = document.getElementById('control-wrapper');
	const directionWrapper = document.getElementById('direction-wrapper');
	const mouseHint = document.getElementById('mouse-hint');
	const mouseHintText = document.getElementById('mouse-hint-text');

	controlWrapper.style.display = 'flex';
	directionWrapper.style.display = 'block';
	mouseHint.style.display = 'flex';
  	mouseHintText.style.display = 'block';
}

export const hideControls = () => {
	const controlWrapper = document.getElementById('control-wrapper');
	const directionWrapper = document.getElementById('direction-wrapper');
	const mouseHint = document.getElementById('mouse-hint');
	const mouseHintText = document.getElementById('mouse-hint-text');

	controlWrapper.style.display = 'none';
	directionWrapper.style.display = 'none';
	mouseHint.style.display = 'none';
	mouseHintText.style.display = 'none';
}
