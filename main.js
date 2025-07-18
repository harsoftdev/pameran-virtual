import * as THREE from "three";
import { scene, setupScene } from "./modules/scene.js";
import { createDoor, createPaintings } from "./modules/paintings.js";
import { createWalls } from "./modules/walls.js";
import { setupFloor } from "./modules/floor.js";
import { createCeiling } from "./modules/ceiling.js";
import { createBoundingBoxes } from "./modules/boundingBox.js";
import { setupRendering } from "./modules/rendering.js";
import { setupEventListeners } from "./modules/eventListeners.js";
import { addObjectsToScene } from "./modules/sceneHelpers.js";
import { setupPlayButton } from "./modules/menu.js";
import { clickHandling } from "./modules/clickHandling.js";

let { camera, controls, renderer } = setupScene();

const textureLoader = new THREE.TextureLoader();

const walls = createWalls(scene, textureLoader);
const floor = setupFloor(scene);
const ceiling = createCeiling(scene, textureLoader);
const door = createDoor(scene, textureLoader);
const paintings = await createPaintings(scene, textureLoader);

createBoundingBoxes(walls);
createBoundingBoxes(paintings);

addObjectsToScene(scene, paintings);

setupPlayButton(controls);

setupEventListeners(controls);

clickHandling(renderer, camera, paintings);

setupRendering(scene, camera, renderer, paintings, controls, walls);

document.addEventListener('pointerlockchange', () => {
    const infoElement = document.getElementById('painting-info');
    if (document.pointerLockElement) {
        infoElement.classList.add('locked');
    } else {
        infoElement.classList.remove('locked');
    }
});

const loaderDiv = document.getElementById('loader');
loaderDiv.style.opacity = 0;
setTimeout(() => loaderDiv.style.display = 'none', 500);
