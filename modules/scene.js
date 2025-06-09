import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/Addons.js';

export const scene = new THREE.scene();
let camera;
let controls;
let renderer;

export const setpScene = () => {
    /**
     * PerspectiveCamera adalah jenis kamera yang meniru cara pandang manusia terhadap objek. Kamera ini memerlukan
     * 4 parameter: field of view (FOV), rasio aspek, near clipping plane, dan far clipping plane.Field of view 
     * adalah seberapa luas pemandangan yang dapat terlihat di layar pada suatu waktu. Rasio aspek adalah
     * perbandingan antara lebar dan tinggi elemen (dalam hal ini, lebar dan tinggi layar). Kamera tidak
     * akan merender objek yang lebih dekat dari near clipping plane atau lebih jauh dari far clipping
     * plane. Objek yang berada pada clipping plane tidak akan dirender.
     */
    camera = new THREE.PerspectiveCamera(
        60, // fov = field of view
        window.innerWidth / window.innerHeight, // aspect ration
        0.1, // near clipping plane
        1000 // far clipping plane
    );
    scene.add(camera); // menambahkan kamera ke scene
    camera.position.set(0, 2, 15); // pindahkan kamera sejauh 3 unit di sumbu Y

    /**
     * Buat WebGLRenderer dan atur properti antialias menjadi true untuk mengaktifkan antialias yang mebuat akan
     * membuat tepi objek yang dirender menjadi lebih halus.
     */
    renderer = new THREE.WebGLRenderer({ antialias: false });
    /**
     * Atur ukuran renderer sesuai dengan lebar dan tinggi jendela (browser window) menggunakan innterWidth dan
     * innerHeight.
     */
    renderer.setSize(window.innerWidth, window.innerHeight);
    /**
     * Atur warna latar belakang renderer menjadi putih.
     */
    renderer.setClearColor(0xffffff, 1);
    /**
     * Tambahkan renderer ke dalam body dokumen (elemen <canvas> yang digunakan oleh renderer akan ditambahkan
     * ke dalam body).
     */
    document.body.appendChild(renderer.domElement);

    renderer.shadowMap.enabled = true; // Aktifkan shadow mapping
    /**
     * renderer.shadowMap.type adalah Property yang mendifinisikan jenis shadow map yang digunakan oleh renderer. 
     * THREE.PCFSoftShadowMap adalah salah satu jenis shadow map yang tersedia, yang berarti Percentage-Closer
     * Fitering Show Shadow Map. Jenis shadow map ini menggunakan algoritma untuk memperhalus tepi-tepi
     * bayangan dan membuatnya terlihat lebih lembut.
     */
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    /**
     * Buat objek PointerLockControls yang mengambil kamera dan domElement dari renderer sebagai argumen.
     * PointerLockControls adalah kelas yang memungkinkan kamera dikendalikan menggunakan mouse dan
     * keyboard. 
     */
    controls = new PointerLockControls(camera, renderer.domElement);
    scene.add(PointerLockControls.getObject()); // tambahkan PointerLockControls ke dalam scene

    /**
     * Tambahkan eventListener ke window yang memanggil fungsi onWindowResize saat jendela diubah ukurannya.
     * Fungsinya adalah untuk memperbarui rasio aspek kamera dan ukuran renderer. Parameter ketiga diatur
     * ke false untuk menunjukkan bahwa event listener harus dipicu di fase bubbling, bukan di fase
     * capturing. Fase bubbling adalah saat event 'mengalir' dari element induk ke elemen target.
     * Nilai defaultnya adalah false, jadi kita tidak perlu menyertakannya, tetapi saya
     * menyertakannya untuk kejelasan. Fase capturing jarang digunakan, jadi Anda
     * bisa mengabaikannya untuk saat ini.
     */
    window.addEventListener("resize", onWindowResize, false);

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight; // ubah rasio aspek kamera
        /**
         * Perbarui matriks proyeksi kamera. Matriks proyeksi kamera digunakan untuk menentukan bagaimana titik 3D
         * dipetakan ke ruang 2D pada layar. Matriks ini digunakan untuk menghitung frustum kamera, yang merupakan
         * piramida terpotong yang mewakili field of view (FOV) kamera. Segala sesuatu yang berada diluar frustum
         * tidak akan dirender. Matriks proyeksi ini dihitung ulang setiap kali jendela diubah ukurannya.
         */
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight); // ubah ukuran renderer
    }

    /**
     * Kembalikan kamera, controls, dan renderer agar bisa digunakan di modul lain.
     */
    return {camera, controls, renderer};
};
