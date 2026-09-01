# Pameran Virtual Arsip dan Perpustakaan Kabupaten Bekasi

Proyek pameran virtual interaktif yang menampilkan koleksi **arsip (PDF)** dan
perpustakaan Kabupaten Bekasi dalam lingkungan 3D yang imersif.

## Deskripsi

Aplikasi web 3D first-person berbasis Three.js. Pengguna menjelajahi ruang
pameran secara bebas, melihat arsip yang dipajang di dinding (halaman pertama
PDF dirender langsung sebagai tekstur), menonton video YouTube di monitor TV,
dan bisa mengikuti tur otomatis terpandu. Seluruh konten diambil dinamis dari
API `silat.bekasikab.go.id`.

## Fitur Utama

### 🏛️ Lingkungan 3D
- Ruang pameran dengan dinding, lantai, dan langit-langit bertekstur PBR
- Pencahayaan ambient + hemisphere + directional
- Furnitur & tanaman dekoratif (model glTF)

### 🎨 Konten Pameran
- **Dinding Tengah** — judul pameran, gambar kutipan, dan gambar bupati (dari API)
- **Arsip Interaktif** — koleksi arsip PDF dari API, dibagi rata ke 3 dinding;
  klik untuk membuka dokumen lengkap di ViewerJS (tab baru)
- **Monitor TV** — menampilkan video YouTube dari API lewat overlay `CSS3DRenderer`

### 🎬 Tur Otomatis
- Tombol "MULAI OTOMATIS" menjalankan tur terpandu dari arsip ke arsip
  (urutan dinding kiri → depan → kanan) dengan navigasi Prev/Next

### 🔒 Validasi Periode
- Jika `is_periodic` aktif, akses dibatasi antara `start_date` dan `end_date`
- Menampilkan pesan bila pameran belum dimulai / sudah selesai

### 📊 Tracking Pengunjung
- Mengirim user-agent + IP ke `POST /api/exhibition/track` saat pameran aktif

### 🎮 Kontrol Interaktif
- Navigasi pointer-lock (first-person)
- Kontrol audio latar (autoplay pada interaksi pertama)
- Tombol on-screen untuk perangkat sentuh

## Teknologi

- **Three.js** `0.171` — rendering 3D (WebGLRenderer + CSS3DRenderer)
- **three-stdlib** — `PointerLockControls`
- **pdf.js** (`pdfjs-dist`) — render halaman PDF ke canvas/tekstur
- **Vite** `6` — dev server & build (target ES2022)
- **Aset teroptimasi** — tekstur WebP 1K, model glTF ter-quantize
  (`KHR_mesh_quantization` + `EXT_texture_webp`)

## Struktur Proyek

```
pameran-virtual/
├── index.html            # Entry point HTML + overlay UI
├── main.js               # Orkestrasi: loading manager, boot scene
├── style.css
├── vite.config.js
├── docs/
│   └── OPTIMIZATION.md    # Catatan pembersihan & optimasi
├── scripts/
│   └── optimize-assets.mjs  # Resize + konversi tekstur ke WebP (butuh sharp)
├── modules/
│   ├── scene.js          # Scene, kamera, renderer, pencahayaan, controls
│   ├── walls.js          # Dinding luar, pintu, jendela + latar langit
│   ├── floor.js          # Lantai (tekstur PBR)
│   ├── ceiling.js        # Langit-langit
│   ├── middleWall.js     # Dinding tengah: judul, kutipan, gambar bupati
│   ├── archives.js       # Arsip PDF dari API + fixture lampu + pool spotlight
│   ├── archiveInfo.js    # Panel info arsip di DOM
│   ├── furniture.js      # Sofa, pot, monitor TV + overlay iframe YouTube
│   ├── movement.js       # Pergerakan kamera + deteksi tabrakan
│   ├── boundingBox.js    # Bounding box untuk collision
│   ├── rendering.js      # Render loop
│   ├── eventListeners.js # Input keyboard
│   ├── clickHandling.js  # Interaksi klik (buka arsip / YouTube)
│   ├── menu.js           # Menu awal & panel kontrol
│   ├── autoTour.js       # Tur terpandu otomatis
│   ├── audioGuide.js     # Backsound (dari API / fallback)
│   ├── exhibitionData.js # Fetch data exhibition (sekali, di-cache)
│   └── sceneHelpers.js   # Utility
└── public/
    ├── WoodFloor040_4K-JPG/     # Tekstur lantai (WebP)
    ├── OfficeCeiling005_4K-JPG/ # Tekstur langit-langit (WebP)
    ├── leather_white_4k.gltf/   # Tekstur dinding (WebP)
    ├── images/                  # Gambar UI, jendela, pintu, logo, Bingkai arsip
    ├── models/                  # Model 3D (.glb)
    └── sounds/                  # Audio backsound
```

## Instalasi dan Menjalankan

Proyek ini memakai **yarn** (jangan campur dengan npm — lihat `.gitignore`).

### Prasyarat
- Node.js 18+
- Yarn 1.x

### Instalasi
```bash
git clone https://github.com/harsoftdev/pameran-virtual.git
cd pameran-virtual
yarn install
```

### Development
```bash
yarn dev
```

### Build produksi
```bash
yarn build      # output ke dist/
yarn preview    # cek hasil build
```

### Deploy (GitHub Pages)
```bash
yarn deploy     # build + push dist/ via gh-pages
```

## Optimasi Aset

Tekstur sumber ber-resolusi 4K dikonversi ke WebP 1K lewat script:

```bash
yarn optimize:assets   # scripts/optimize-assets.mjs, butuh devDependency `sharp`
```

Model `.glb` dioptimasi terpisah dengan `@gltf-transform/cli`
(dedup + weld + quantize + tekstur WebP). Detail lengkap—termasuk daftar file
yang dihapus dan perubahan runtime—ada di [`docs/OPTIMIZATION.md`](docs/OPTIMIZATION.md).

## Integrasi API

Base: `https://silat.bekasikab.go.id`

| Endpoint | Kegunaan |
|---|---|
| `GET /api/exhibitions` | judul, gambar kutipan/bupati, link YouTube, backsound, periode (`is_periodic`, `start_date`, `end_date`) |
| `GET /api/exhibition-archives` | daftar arsip PDF (`Name`, `Klasifikasi`, `Year`, `Amount`, `Url`, `Path`) |
| `POST /api/exhibition/track` | tracking pengunjung (user-agent + IP) |
| `GET /api/pdf/archive/static/<file>.pdf` (`Url`) | file PDF — dipakai untuk render tekstur halaman 1 |
| `…/ViewerJS/#/<Path>` | viewer PDF, dibuka di tab baru saat arsip diklik |

## Kontrol Pengguna

### Navigasi
| Tombol | Aksi |
|---|---|
| **W A S D** | Gerak maju / kiri / mundur / kanan |
| **Mouse** | Putar kamera (saat pointer terkunci) |
| **Spasi** | Toggle pointer lock |
| **Enter** | Mulai menjelajah dari menu |

### Interaksi
| Tombol | Aksi |
|---|---|
| **Klik kiri** | Buka arsip PDF / video YouTube (saat pointer tidak terkunci) |
| **E** / **Esc** | Kembali ke menu awal |
| **M** | Toggle suara |
| **R** | Muat ulang halaman |

## Browser Support

Chrome/Edge 88+, Firefox 85+, Safari 14+ (butuh WebGL2 & WebP).

## Pengembang

Dikembangkan oleh Dinas Arsip dan Perpustakaan Kabupaten Bekasi dengan dukungan
teknologi dari Harsoft Development.
