import * as THREE from "three";
import { PointerLockControls } from "three-stdlib";
import { CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";

export const scene = new THREE.Scene(); // create a scene
const css3dScene = new THREE.Scene(); // create CSS3D scene
let camera;
let controls;
let renderer;
let css3dRenderer;

export const setupScene = (isLowEnd = false) => {
    // PerspectiveCamera is a type of camera that mimics the way the human eye sees things. It takes 4 parameters: field of view, aspect ratio, near clipping plane, and far clipping plane. The field of view is the extent of the scene that is seen on the display at any given moment. The aspect ratio should be the width of the element divided by the height (in this case, the screen width and height). The camera will not render objects that are closer to the camera than the near clipping plane or further away than the far clipping plane. Objects that are exactly on the clipping plane will not be rendered.
    camera = new THREE.PerspectiveCamera(
        60, // fov = field of view
        window.innerWidth / window.innerHeight, // aspect ratio
        0.1, // near clipping plane
        1000 // far clipping plane
    );
    scene.add(camera); // add the camera to the scene
    camera.position.set(0, 4, 25); // move the camera up 3 units in the Y axis

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = !isLowEnd; // Disable shadows for low-end devices
    scene.add(directionalLight);

    renderer = new THREE.WebGLRenderer({ 
        antialias: !isLowEnd, // Disable antialias for low-end devices
        powerPreference: isLowEnd ? "low-power" : "high-performance" // Use low power mode for low-end
    }); // create a WebGLRenderer and set its antialias property to true to enable antialiasing which smooths out the edges of what is rendered
    renderer.setSize(window.innerWidth, window.innerHeight); // set the size of the renderer to the inner width and height of the window
    renderer.setClearColor(0xffffff, 1); // set the background color of the renderer to white
    renderer.setPixelRatio(isLowEnd ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio); // Limit pixel ratio for low-end devices
    document.body.appendChild(renderer.domElement); // append the renderer to the body of the document (the <canvas> element that the renderer uses will be added to the body)

    // Create CSS3D renderer for iframe overlays
    css3dRenderer = new CSS3DRenderer();
    css3dRenderer.setSize(window.innerWidth, window.innerHeight);
    css3dRenderer.domElement.style.position = 'absolute';
    css3dRenderer.domElement.style.top = '0px';
    css3dRenderer.domElement.style.left = '0px';
    css3dRenderer.domElement.style.pointerEvents = 'none'; // Allow clicks to pass through
    document.body.appendChild(css3dRenderer.domElement);

    controls = new PointerLockControls(camera, renderer.domElement); // create a PointerLockControls object that takes the camera and the renderer's domElement as arguments. PointerLockControls is a class that allows the camera to be controlled by the mouse and keyboard.
    scene.add(controls.getObject()); // add the PointerLockControls object to the scene

    window.addEventListener("resize", onWindowResize, false); // add an event listener to the window that calls the onWindowResize function when the window is resized. Its work is to update the camera's aspect ratio and the renderer's size. The third parameter is set to false to indicate that the event listener should be triggered in the bubbling phase instead of the capturing phase. The bubbling phase is when the event bubbles up from the target element to the parent elements. The capturing phase is when the event trickles down from the parent elements to the target element. The default value is false, so we don't need to include it, but I included it for clarity. The capturing phase is rarely used, so you can ignore it for now. You can read more about the capturing and bubbling phases here: https://javascript.info/bubbling-and-capturing

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight; // update the camera's aspect ratio
        camera.updateProjectionMatrix(); // update the camera's projection matrix. The projection matrix is used to determine how 3D points are mapped to the 2D space of the screen. It is used to calculate the frustum of the camera which is a truncated pyramid that represents the camera's field of view. Anything outside the frustum is not rendered. The projection matrix is used to calculate the frustum every time the window is resized.
        renderer.setSize(window.innerWidth, window.innerHeight); // update the size of the renderer
        css3dRenderer.setSize(window.innerWidth, window.innerHeight); // update the size of the CSS3D renderer
    }

    return { camera, controls, renderer, css3dRenderer, css3dScene }; // return the camera, controls, renderer, css3dRenderer, and css3dScene
};
