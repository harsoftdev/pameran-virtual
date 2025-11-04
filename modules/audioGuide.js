import * as THREE from "three";

const API_URL = 'https://silat.bekasikab.go.id/api/exhibitions';
let exhibitionData = null;
let sound;
let bufferLoaded = false; // flag to track if audio buffer is loaded
let audioPlaying = false; // flag to track if audio is currently playing

// Fetch exhibition data
const fetchExhibitionData = async () => {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        exhibitionData = data;
        return data;
    } catch (error) {
        console.warn('Could not fetch exhibition data for audio:', error);
        exhibitionData = { data: {} }; // fallback empty data
        return exhibitionData;
    }
};

// setup audio for the scene
export const setupAudio = async (camera) => {
    // Fetch exhibition data first if not already loaded
    if (!exhibitionData) {
        await fetchExhibitionData();
    }

    // create an audio listener and add it to the camera
    const listener = new THREE.AudioListener();
    camera.add(listener);

    sound = new THREE.Audio(listener); // creating the audio source

    const audioLoader = new THREE.AudioLoader(); // create an audio loader
    
    // Get backsound URL from API or fallback to default
    const backsoundUrl = exhibitionData?.data?.backsound || "sounds/Hymne_Kabupaten_Bekasi.mp3";
    
    audioLoader.load(backsoundUrl, function (buffer) {
        // load the audio file
        sound.setBuffer(buffer); // set the audio source buffer
        sound.setLoop(true); // set the audio source to loop
        sound.setVolume(0.8); // increased volume for better audibility
        bufferLoaded = true; // set bufferLoaded flag to true once the audio buffer is loaded
    });

    // // Original code (commented out) - load from static file
    // // audioLoader.load("sounds/Hymne_Kabupaten_Bekasi.mp3", function (buffer) {
    // //     // load the audio file
    // //     sound.setBuffer(buffer); // set the audio source buffer
    // //     sound.setLoop(true); // set the audio source to loop
    // //     sound.setVolume(0.8); // increased volume for better audibility
    // //     bufferLoaded = true; // set bufferLoaded flag to true once the audio buffer is loaded
    // // });
};

// play audio
export const startAudio = () => {
    if (sound && bufferLoaded) {
        // check if the buffer is loaded before playing
        sound.play();
        audioPlaying = true;
        console.log("Audio started");
    } else {
        console.warn("Cannot start audio - buffer not loaded or sound not initialized");
    }
};

// pause audio
export const stopAudio = () => {
    if (sound) {
        sound.pause();
        audioPlaying = false;
        console.log("Audio paused");
    }
};

// toggle audio on/off
export const toggleAudio = () => {
    if (!sound || !bufferLoaded) {
        console.warn("Cannot toggle audio - buffer not loaded or sound not initialized");
        return;
    }

    if (audioPlaying) {
        stopAudio();
        showAudioStatus("🔇 Audio OFF");
    } else {
        startAudio();
        showAudioStatus("🔊 Audio ON");
    }
};

// show audio status feedback
const showAudioStatus = (message) => {
    // Remove existing status if any
    const existingStatus = document.getElementById("audio-status");
    if (existingStatus) {
        existingStatus.remove();
    }

    // Create new status indicator
    const statusDiv = document.createElement("div");
    statusDiv.id = "audio-status";
    statusDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 1000;
            font-family: Arial, sans-serif;
        ">
            ${message}
        </div>
    `;
    document.body.appendChild(statusDiv);

    // Auto-hide after 2 seconds
    setTimeout(() => {
        const status = document.getElementById("audio-status");
        if (status) {
            status.remove();
        }
    }, 2000);
};
