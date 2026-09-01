import * as THREE from 'three';
import { hideMenu, showMenu, hideControls } from './menu.js';
import { displayArchiveInfo, hideArchiveInfo } from './archiveInfo.js';

// Tur terpandu otomatis. Hands-free: TIDAK mengunci pointer, jadi tombol
// Prev/Next/Keluar tetap bisa diklik di desktop (dan di-tap di mobile).
// Kamera digerakkan langsung (lerp posisi + slerp rotasi) dari arsip ke arsip.

let isActive = false;
let currentIndex = 0;
let archives = [];
let camera = null;

const TRANSITION_MS = 1800;
const VIEW_DISTANCE = 10; // jarak kamera dari arsip saat berhenti
const HOME_POS = new THREE.Vector3(0, 4, 25);
const HOME_LOOK = new THREE.Vector3(0, 4, 0);

// Urutan tur: dinding kiri -> depan (tengah) -> kanan, membentuk jalur menyambung
// sehingga kamera cukup memutar mulus tanpa lompatan.
const sortForTour = (list) => {
    const left = [];
    const front = [];
    const right = [];
    const wp = (o) => {
        const v = new THREE.Vector3();
        o.getWorldPosition(v);
        return v;
    };

    list.forEach((a) => {
        const r = a.rotation.y;
        if (Math.abs(r - Math.PI / 2) < 0.1) left.push(a);
        else if (Math.abs(r) < 0.1) front.push(a);
        else if (Math.abs(r + Math.PI / 2) < 0.1) right.push(a);
    });

    left.sort((a, b) => wp(b).z - wp(a).z);  // belakang -> depan
    front.sort((a, b) => wp(a).x - wp(b).x); // kiri -> kanan
    right.sort((a, b) => wp(a).z - wp(b).z); // depan -> belakang

    return [...left, ...front, ...right];
};

export const initAutoTour = (list, cam) => {
    archives = sortForTour(list);
    camera = cam;
};

export const setupAutoTourButton = () => {
    document.getElementById('auto_tour_button')
        ?.addEventListener('click', () => { if (!isActive) startGuidedTour(); });
};

export const isAutoTourRunning = () => isActive;

export const startGuidedTour = () => {
    if (isActive || archives.length === 0 || !camera) return;
    isActive = true;
    currentIndex = 0;
    hideMenu();
    hideControls(); // sembunyikan dpad + tombol kanan-atas + hint mouse
    buildNavUI();
    goTo(0);
};

export const stopGuidedTour = () => {
    if (!isActive) return;
    isActive = false;
    hideNavUI();
    hideArchiveInfo();
    // kembalikan kamera ke posisi awal, lalu tampilkan menu
    camera.position.copy(HOME_POS);
    camera.lookAt(HOME_LOOK);
    showMenu();
};

export const nextArchive = () => {
    if (isActive && currentIndex < archives.length - 1) goTo(currentIndex + 1);
};

export const prevArchive = () => {
    if (isActive && currentIndex > 0) goTo(currentIndex - 1);
};

const goTo = (i) => {
    if (i < 0 || i >= archives.length) return;
    currentIndex = i;
    updateNavUI();
    hideArchiveInfo();

    const archive = archives[i];
    const targetPos = new THREE.Vector3();
    archive.getWorldPosition(targetPos);

    // Posisi kamera: VIEW_DISTANCE tegak lurus di depan arsip
    const camPos = targetPos.clone();
    const r = archive.rotation.y;
    if (Math.abs(r) < 0.1) camPos.z += VIEW_DISTANCE;                 // dinding depan
    else if (Math.abs(r - Math.PI / 2) < 0.1) camPos.x += VIEW_DISTANCE; // dinding kiri
    else if (Math.abs(r + Math.PI / 2) < 0.1) camPos.x -= VIEW_DISTANCE; // dinding kanan

    animateCamera(camPos, targetPos, () => {
        if (isActive && currentIndex === i) displayArchiveInfo(archive.userData.info, true);
    });
};

const _lookMatrix = new THREE.Matrix4();
let animToken = 0;

const animateCamera = (toPos, lookAt, onDone) => {
    const fromPos = camera.position.clone();
    const fromQuat = camera.quaternion.clone();

    // Orientasi tujuan: pakai Matrix4.lookAt (gaya kamera: eye -> target).
    // Object3D.lookAt untuk objek biasa arahnya kebalik, jadi hitung manual.
    _lookMatrix.lookAt(toPos, lookAt, camera.up);
    const toQuat = new THREE.Quaternion().setFromRotationMatrix(_lookMatrix);

    const t0 = performance.now();
    const token = ++animToken;

    const step = () => {
        if (!isActive || token !== animToken) return;
        const t = Math.min((performance.now() - t0) / TRANSITION_MS, 1);
        const e = t * t * (3 - 2 * t); // smoothstep
        camera.position.lerpVectors(fromPos, toPos, e);
        camera.quaternion.slerpQuaternions(fromQuat, toQuat, e);
        if (t < 1) requestAnimationFrame(step);
        else onDone?.();
    };
    step();
};

// ---------- Navigation UI ----------
const buildNavUI = () => {
    let el = document.getElementById('guided-tour-nav');
    if (!el) {
        el = document.createElement('div');
        el.id = 'guided-tour-nav';
        el.innerHTML = `
            <div class="nav-container">
                <button id="prev-archive" class="nav-button"><span>❮</span></button>
                <span id="archive-counter" class="nav-info">1 / ${archives.length}</span>
                <button id="next-archive" class="nav-button"><span>❯</span></button>
            </div>
            <button id="exit-tour" class="nav-button nav-exit"><span>✕ Keluar Tur</span></button>
        `;
        document.body.appendChild(el);
        document.getElementById('prev-archive').addEventListener('click', prevArchive);
        document.getElementById('next-archive').addEventListener('click', nextArchive);
        document.getElementById('exit-tour').addEventListener('click', stopGuidedTour);
    }
    el.style.display = 'block';
    updateNavUI();
};

const hideNavUI = () => {
    const el = document.getElementById('guided-tour-nav');
    if (el) el.style.display = 'none';
};

const updateNavUI = () => {
    const prev = document.getElementById('prev-archive');
    const next = document.getElementById('next-archive');
    const counter = document.getElementById('archive-counter');

    if (prev) prev.disabled = currentIndex === 0;
    if (next) next.disabled = currentIndex === archives.length - 1;
    if (counter) counter.textContent = `${currentIndex + 1} / ${archives.length}`;
};
