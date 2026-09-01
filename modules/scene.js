import * as THREE from "three";
import { PointerLockControls } from "three-stdlib";
import { CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";

export const scene = new THREE.Scene();
const css3dScene = new THREE.Scene(); // scene khusus overlay iframe (CSS3D)
let camera;
let controls;
let renderer;
let css3dRenderer;

export const setupScene = () => {
    camera = new THREE.PerspectiveCamera(
        60, // fov
        window.innerWidth / window.innerHeight, // aspect ratio
        0.1, // near
        1000 // far
    );
    scene.add(camera);
    camera.position.set(0, 4, 25);

    // Pencahayaan ruangan: cukup 3 light statis (dulu ada ambient dobel + N spotlight per arsip)
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Batasi pixel ratio -> di layar retina render jauh lebih ringan tanpa beda kasat mata
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0xffffff, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(renderer.domElement);

    // CSS3D renderer untuk overlay iframe YouTube
    css3dRenderer = new CSS3DRenderer();
    css3dRenderer.setSize(window.innerWidth, window.innerHeight);
    css3dRenderer.domElement.style.position = 'absolute';
    css3dRenderer.domElement.style.top = '0px';
    css3dRenderer.domElement.style.left = '0px';
    css3dRenderer.domElement.style.pointerEvents = 'none'; // klik tembus ke canvas
    document.body.appendChild(css3dRenderer.domElement);

    controls = new PointerLockControls(camera, renderer.domElement);
    scene.add(controls.getObject());

    window.addEventListener("resize", onWindowResize, false);

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        css3dRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    return { camera, controls, renderer, css3dRenderer, css3dScene };
};
