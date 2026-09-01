# Optimasi Pameran Virtual

Ringkasan pembersihan + optimasi yang dikerjakan pada 2026-08-28.
Aplikasi sebelumnya sangat berat: aset `public/` 304 MB, banyak dead code,
puluhan light dinamis, dan fetch API berulang.

## Hasil

| | Sebelum | Sesudah |
|---|--:|--:|
| Folder `public/` | **304 MB** | **6.5 MB** |
| Hasil `npm run build` (`dist/`) | ~308 MB | **11 MB** (2 MB di antaranya `pdf.worker`) |
| Tekstur 4K (12 file) | 135 MB | 1.8 MB |
| Model GLB (4 file) | 21.7 MB | 2.4 MB |
| Light dinamis di scene | 4 statis + **1 SpotLight per arsip** (bisa 30+) | 3 statis, 0 per arsip |
| Fetch `GET /api/exhibitions` saat load | 3x (main, audioGuide, middleWall) | 1x (cached) |

Semua file lama masih ada di histori git kalau perlu dikembalikan.

---

## 1. Pembersihan kode (dead code)

- **`modules/middleWall.js`** — hapus `drawWoodFrame` & `createFramedBox`
  (tak pernah dipakai), buang ratusan baris blok komentar. 513 → ~205 baris.
- **`modules/eventListeners.js`** — hapus import & listener mati, state yang
  tak pernah dibaca (`lockPointer`, `escPressed`, `showMenuOnUnlock`), dan
  **bug listener-leak**: `addEventListener("keyup")` dulu dipasang ulang tiap
  kali tombol ditekan. 159 → 87 baris.
- **`modules/autoTour.js`** — hapus ~35 `console.log` debug + `handleUserInteraction`
  (stub yang tak pernah di-wire).
- **`modules/audioGuide.js`**, **`index.html`**, **`style.css`** — blok
  komentar & rule `#logo-wrapper` yang yatim.
- **`.gitignore`** — tambah `.DS_Store`, untrack 8 file `.DS_Store`.
- **`package.json`** — hapus `lil-gui` (dependency tak terpakai).

### Rename konsep: `painting` → `archive`

Project ini fork dari contoh galeri lukisan; isinya sebenarnya **arsip PDF**.

| Lama | Baru |
|---|---|
| `modules/paintings.js` | `modules/archives.js` |
| `modules/paintingInfo.js` | `modules/archiveInfo.js` |
| `createPaintings()` / `displayPaintingInfo()` | `createArchives()` / `displayArchiveInfo()` |
| `#painting-info`, `#prev-painting`, `#next-painting`, `#painting-counter` | `#archive-info`, `#prev-archive`, `#next-archive`, `#archive-counter` |
| `userData.type: 'painting'` | `'archive'` |

3 blok kode spotlight yang identik di `archives.js` digabung jadi helper.

---

## 2. Optimasi aset

### Tekstur — resize + WebP (`scripts/optimize-assets.mjs`)

Semua tekstur 4K (4096²) di-resize ke **1024** (AO ke 512) dan dikonversi ke
WebP. Untuk permukaan ruangan yang di-tile dan dilihat dari jarak, 1K tak
terlihat bedanya.

```
npm run optimize:assets     # butuh devDependency `sharp`
```

Contoh hasil: `OfficeCeiling…_NormalGL.jpg` 37 MB → 392 KB, `WoodFloor…_Color.jpg`
11 MB → 92 KB. Total 135 MB → 1.8 MB.

### Map yang dibuang dari kode (bukan hanya dikompres)

| Map | Alasan |
|---|---|
| `displacementMap` lantai & langit-langit | `PlaneGeometry(102,102)` hanya 2 segitiga → displacement tak berefek, cuma beban download (~17 MB) |
| `emissiveMap` langit-langit | `material.emissive` default hitam → hasil perkalian = 0, no-op |
| `metalnessMap` langit-langit | tanpa environment map hanya bikin gelap; bukan permukaan metal |
| `leather_white_diff_4k` | `middleWall.js` salah pasang (diffuse dijadikan normalMap). Diperbaiki agar sama dengan `walls.js` (`nor_gl` → normalMap, `rough` → roughnessMap); file diffuse jadi tak terpakai |

### File aset yang dihapus (tak direferensikan kode mana pun, ~128 MB)

- `*_NormalDX.jpg` & `*_PREVIEW.jpg` (lantai + langit-langit)
- `public/ViewerJS/` — PDF dibuka via ViewerJS **remote** (`silat.bekasikab.go.id`)
- `images/bupati.png`, `logo/bekasi.png`, `logo/silat-icon.png`
- `sounds/hymne_kabupaten_bekasi_instrumentals.mp3`

### Model GLB — `@gltf-transform/cli`

```
npx @gltf-transform/cli optimize <in>.glb <out>.glb \
  --compress quantize --texture-compress webp --texture-size 1024 --simplify false
```

Hanya `dedup` + `weld` + `quantize` + tekstur→WebP — **tanpa** decimation mesh,
jadi bentuk tak berubah. `KHR_mesh_quantization` & `EXT_texture_webp` didukung
`GLTFLoader` bawaan (tak perlu decoder tambahan).

| Model | Sebelum | Sesudah | Catatan |
|---|--:|--:|---|
| `plant_with_pot.glb` | 8.3 MB | 144 KB | 98% isinya mesh daun duplikat |
| `pot_plant_dracena.glb` | 7.9 MB | 1.49 MB | |
| `Couch.glb` | 4.2 MB | 128 KB | vertex duplikat, tanpa quantize |
| `tv_monitor.glb` | 1.4 MB | 680 KB | |

---

## 3. Optimasi runtime (FPS)

- **`modules/scene.js`** — pencahayaan: 1 `AmbientLight` + 1 `HemisphereLight`
  + 1 `DirectionalLight` (dulu ambient dobel + directional `castShadow` tanpa
  shadow map aktif). `renderer.setPixelRatio(min(dpr, 1.5))` → di layar retina
  jauh lebih ringan. `outputColorSpace = SRGBColorSpace`.
- **`modules/archives.js`** — arsip pakai `MeshBasicMaterial` (scan PDF selalu
  terbaca, tak butuh light). Sorotan lampu galeri: dulu **1 `SpotLight` per
  arsip** (30–50 light dinamis → tiap light memberatkan shader semua
  `MeshStandardMaterial` di ruangan). Sekarang **pool berukuran tetap**
  (10 di desktop, 4 di mobile) yang di-render loop "ditempelkan" ke arsip
  terdekat ke kamera → efek pool cahaya di dinding tetap ada, jumlah light
  konstan (tak ada rekompilasi shader). Fixture lampu fisik (silinder + cone)
  tetap di tiap arsip; geometry/material dibuat sekali & dipakai ulang.
  Geometry bidang arsip + texture bingkai + texture placeholder juga di-share.
- **`modules/rendering.js`** — `displayArchiveInfo()` dulu dipanggil tiap frame
  saat dekat arsip (rebuild `innerHTML` terus); sekarang hanya saat arsip
  berganti. `updateOverlayVisibility()` (raycast ke seluruh scene) dibatasi
  1x per 6 frame dan hanya kalau ada overlay YouTube.
- **`modules/exhibitionData.js`** (baru) — fetch `GET /api/exhibitions` sekali,
  promise-nya di-cache. `main.js`, `audioGuide.js`, `middleWall.js` memakainya.
  `middleWall.js` tak lagi pakai top-level `await fetch` (dulu bikin seluruh
  modul blocking + crash kalau API lambat).

---

## 4. Loading & streaming PDF

Gejala sebelumnya: pertama kali dibuka, menu langsung muncul di atas layar
hitam sementara Network masih men-download puluhan MB. Penyebab:

1. `LoadingManager.onLoad` kepicu **prematur** — di sela `await` (fetch API,
   load model) jumlah item sempat `loaded === total`, loader hilang padahal
   scene belum jadi.
2. Render halaman PDF dilacak di `LoadingManager` yang sama → loader "menunggu"
   ~50 PDF selesai (40 detik), sekaligus tiap `getDocument()` bikin **worker
   pdf.js sendiri** (`pdf.worker.js` diminta puluhan kali, "resources" ~124 MB).
3. Gambar panel dinding tengah di-`await` tanpa timeout → kalau koneksi API
   menggantung, proses boot **macet selamanya**.

Perbaikan:

- **Sentinel `__boot__`** di `main.js` — `manager.itemStart('__boot__')` sebelum
  scene dibangun, `itemEnd('__boot__')` setelah selesai. Loader tidak akan
  hilang sebelum scene benar-benar siap.
- **Progress bar tampilkan `%` asli** (`Memuat Pameran Virtual... 42%`), reveal
  di-guard supaya jalan sekali. Model & tekstur lantai kini ikut dilacak
  manager (loader honest).
- **PDF keluar dari `LoadingManager`.** Arsip tampil dengan placeholder
  "Loading…", halaman PDF di-render di background lewat antrian
  (`MAX_CONCURRENT_PDF = 4`, timeout 25 dtk/tugas) dan **satu `PDFWorker`
  bersama** untuk semua arsip.
- **Gambar dinding tengah + title image tidak lagi memblokir.** `createPlainBox`
  mengembalikan box langsung; tekstur di-swap saat gambar API siap. `loadImage`
  punya timeout 8 dtk → fallback `no-image.webp`.
- **Backsound** — kalau URL dari API gagal, fallback ke `Hymne_Kabupaten_Bekasi.mp3`.

Hasil (Chromium headless, dev server): loader **~2.5 dtk**, `pdf.worker.js`
**1 request** (dari ~15–50), lalu PDF mengalir masuk di belakang layar.

---

## 5. Perbaikan Tur Otomatis (`modules/autoTour.js`)

Tur otomatis ("MULAI OTOMATIS") ditujukan untuk mobile (tanpa mouse-look).
Masalah sebelumnya + perbaikan:

| Masalah | Perbaikan |
|---|---|
| `controls.lock()` dipanggil → di desktop kursor hilang, tombol Prev/Next tak bisa diklik (harus tekan SPASI dulu) | **Tur tidak mengunci pointer** sama sekali. Kamera digerakkan langsung. Kursor tetap terlihat → tombol bisa diklik / di-tap. |
| Rotasi kamera salah — `direction` dihitung sekali lalu kamera "menggeser" sambil pandangan mengarah tetap; `Object3D.lookAt` malah membalik arah | Interpolasi **posisi (lerp) + orientasi (quaternion slerp)**; orientasi tujuan dihitung via `Matrix4.lookAt` (gaya kamera). Kamera memutar mulus menghadap tiap arsip. |
| Urutan lompat-lompat | Urut **dinding kiri → depan (tengah) → kanan**, tiap dinding disortir supaya jalurnya menyambung (kamera menyapu ~180° tanpa patah). |
| Tidak ada cara keluar tur (khususnya mobile) | Tombol **"✕ Keluar Tur"** di panel navigasi + tombol **E/Esc** → `stopGuidedTour()` (kamera balik ke posisi awal, menu muncul). |
| WASD / panel info jarak masih aktif saat tur | `rendering.js` melewati `updateMovement` + cek jarak arsip selama `isAutoTourRunning()`. |
| Petunjuk "Tekan SPASI…" muncul saat tur | `displayArchiveInfo(info, hideHints=true)` saat tur. |

Diuji Chromium headless: kamera menghadap tiap arsip dengan benar, Prev/Next/Keluar
berfungsi tanpa pointer lock, tanpa error konsol.

---

## 6. Membuka arsip (klik) — tetap ViewerJS

**Bottleneck ada di server**, bukan di kode: file PDF di
`silat.bekasikab.go.id` di-serve **~40 KB/s** (TTFB cepat ~0.25 dtk, tapi PDF
1 MB butuh ~25–30 dtk). Solusi sebenarnya: bandwidth / CDN / kompres PDF di
sisi server.

Klik arsip → `window.open('…/ViewerJS/#/' + item.Path, '_blank')` (tab baru).
ViewerJS dipertahankan **sengaja**: dokumen tidak gampang di-download langsung,
dan watermark tetap terlihat. Loading-nya lambat & tanpa progress bar tapi
akhirnya muncul.

> Sempat dicoba: (a) buka `item.Url` langsung → viewer bawaan browser (ada
> tombol download), (b) viewer pdf.js di dalam app dengan progress bar. Opsi (b)
> intermittently blank di sebagian browser (kemungkinan cache PDF separuh dari
> range request) → dikembalikan ke ViewerJS. Kode viewer dalam-app dihapus
> (`modules/archiveViewer.js`, `modules/pdfSetup.js`).

Render tekstur halaman-1 di dinding tetap pakai pdf.js + `item.Url` (lihat §4).

---

## Yang belum dikerjakan (opsi lanjutan)

- **Simplifikasi mesh** model (decimation) — bisa perkecil lagi, tapi berisiko
  visual. Jalankan `gltf-transform simplify --ratio 0.5` lalu cek manual.
- **Code-split** — bundle `index.js` 930 KB (three + pdfjs) + `pdf.worker` 1.9 MB.
  Bisa lazy-load pdfjs karena arsip di-render setelah scene siap.
- **Audio** `Hymne_Kabupaten_Bekasi.mp3` 2.4 MB — re-encode bitrate lebih rendah.
- **Collision** — arsip & pintu belum punya bounding box; tak ada batas lantai/langit.
- **PDF hanya halaman 1** yang di-render; kalau server API PDF lambat, arsip
  akan lama pakai placeholder (tidak memblokir scene).

---

## Cara verifikasi (manual)

`yarn dev`, lalu cek:

1. Progress bar naik sampai 100%, lalu loader hilang & scene muncul (lantai
   kayu, dinding, langit-langit bertekstur) — **bukan** layar hitam.
2. Judul pameran di dinding tengah muncul (mula-mula teks, lalu gambar API);
   panel kiri/kanan/belakang terisi gambar (atau abu-abu → no-image).
3. Jalan dengan WASD mendekati arsip → panel info muncul; placeholder
   "Loading…" berganti jadi halaman PDF dalam beberapa detik.
4. Model: sofa (3), pot tanaman (4 sudut + 2 di dinding tengah), monitor TV (2).
5. Monitor TV: iframe YouTube muncul & ke-hide saat terhalang dinding.
6. Backsound jalan setelah interaksi pertama; tombol M mute/unmute.
7. "MULAI OTOMATIS" → auto tour jalan, tombol Prev/Next.
8. DevTools Network: `pdf.worker.js` hanya **1×** (dulu belasan).

Sudah diuji via Chromium headless: loader ~2.5 dtk, scene render benar
(lantai/model/judul), 1 worker pdf.js, tanpa error konsol.
