import * as THREE from "three";
import { getExhibitionData } from "./exhibitionData.js";

let sound;
let bufferLoaded = false; // flag to track if audio buffer is loaded
let audioPlaying = false; // flag to track if audio is currently playing

// setup audio for the scene
export const setupAudio = async (camera) => {
    const exhibitionData = await getExhibitionData();

    // create an audio listener and add it to the camera
    const listener = new THREE.AudioListener();
    camera.add(listener);

    sound = new THREE.Audio(listener); // creating the audio source

    const audioLoader = new THREE.AudioLoader();
    const fallbackUrl = "sounds/Hymne_Kabupaten_Bekasi.mp3";

    const applyBuffer = (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.8);
        bufferLoaded = true;
    };

    // Backsound dari API; kalau gagal, pakai file lokal
    const backsoundUrl = exhibitionData?.backsound || fallbackUrl;
    audioLoader.load(backsoundUrl, applyBuffer, undefined, () => {
        console.warn('Backsound API gagal dimuat, pakai file lokal');
        if (backsoundUrl !== fallbackUrl) audioLoader.load(fallbackUrl, applyBuffer);
    });
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
