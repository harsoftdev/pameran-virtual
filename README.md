# Pameran Virtual Arsip dan Perpustakaan Kabupaten Bekasi

Proyek pameran virtual interaktif yang menampilkan koleksi arsip dan perpustakaan Kabupaten Bekasi dalam lingkungan 3D yang imersif.

## Deskripsi

Aplikasi ini adalah pengalaman virtual reality yang memungkinkan pengguna menjelajahi pameran arsip dan perpustakaan Kabupaten Bekasi. Dibangun menggunakan Three.js untuk rendering 3D, aplikasi ini menyediakan navigasi bebas di dalam ruang pameran dengan berbagai elemen interaktif.

## Fitur Utama

### 🏛️ Lingkungan 3D
- Ruang pameran dengan dinding, lantai, dan langit-langit yang realistis
- Sistem pencahayaan ambient dan hemisphere untuk pencahayaan alami
- Tekstur material yang detail untuk dinding dan lantai

### 🎨 Konten Pameran
- **Dinding Tengah**: Menampilkan judul pameran, gambar dinamis dari API, dan gambar bupati
- **Lukisan Interaktif**: Koleksi lukisan yang dapat diklik untuk informasi detail
- **Monitor TV**: Menampilkan video YouTube dari API
- **Elemen Dekoratif**: Pot tanaman dan furnitur untuk atmosfer yang lebih hidup

### 🔒 Validasi Periode
- Sistem validasi berdasarkan API untuk periode pameran
- Menampilkan pesan jika pameran belum dimulai atau sudah selesai
- Kontrol akses otomatis berdasarkan tanggal mulai dan akhir

### 🎮 Kontrol Interaktif
- Navigasi pointer lock untuk pengalaman first-person
- Klik pada lukisan untuk informasi popup
- Kontrol audio latar dengan autoplay pada interaksi pertama
- Menu awal dengan tombol play

## Teknologi

- **Three.js**: Engine 3D untuk rendering dan animasi
- **Vite**: Build tool dan development server
- **JavaScript ES6+**: Bahasa pemrograman utama
- **HTML5 Canvas**: Untuk rendering teks dan frame kayu
- **WebGL**: Rendering hardware-accelerated

## Struktur Proyek

```
pameran-virtual/
├── index.html          # Entry point HTML
├── main.js            # Main application logic
├── style.css          # Styling
├── vite.config.js     # Vite configuration
├── package.json       # Dependencies
└── modules/           # Modular components
    ├── scene.js       # Scene setup
    ├── walls.js       # Wall and door components
    ├── floor.js       # Floor setup
    ├── ceiling.js     # Ceiling setup
    ├── paintings.js   # Interactive paintings
    ├── middleWall.js  # Center wall with framed content
    ├── furniture.js   # Furniture and decor
    ├── boundingBox.js # Collision detection
    ├── rendering.js   # Render loop
    ├── eventListeners.js # User input handling
    ├── clickHandling.js # Click interactions
    ├── menu.js        # Start menu
    ├── audioGuide.js  # Background audio
    └── sceneHelpers.js # Utility functions
├── public/            # Static assets
    ├── images/        # Image assets
    │   ├── logo/      # Logo files
    │   └── ...        # Other images
    ├── models/        # 3D models (GLTF)
    ├── sounds/        # Audio files
    └── ViewerJS/      # PDF viewer
```

## Instalasi dan Menjalankan

### Prasyarat
- Node.js (versi 16 atau lebih baru)
- Yarn atau npm

### Instalasi
```bash
# Clone repository
git clone https://github.com/harsoftdev/pameran-virtual.git
cd pameran-virtual

# Install dependencies
yarn install
# atau
npm install
```

### Menjalankan Development Server
```bash
yarn dev
# atau
npm run dev
```

### Build untuk Production
```bash
yarn build
# atau
npm run build
```

### Preview Build
```bash
yarn preview
# atau
npm run preview
```

## API Integration

Aplikasi terintegrasi dengan API eksternal di `https://silat.bekasikab.go.id/api/exhibitions` untuk:

- Data judul dan deskripsi pameran
- Gambar kutipan untuk dinding samping
- Link YouTube untuk monitor TV
- Pengaturan periode pameran (`is_periodic`, `start_date`, `end_date`)

## Kontrol Pengguna

### Navigasi
- **WASD**: Gerak maju/mundur/kiri/kanan
- **Mouse**: Putar kamera
- **Spasi**: Toggle pointer lock

### Interaksi
- **Klik Kiri**: Pilih lukisan atau objek
- **E**: Keluar dari mode VR
- **ESC**: Kembali ke menu

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Pengembang

Dikembangkan oleh Dinas Arsip dan Perpustakaan Kabupaten Bekasi dengan dukungan teknologi dari Harsoft Development.
