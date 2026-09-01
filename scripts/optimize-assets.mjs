/**
 * Asset optimizer — resize + convert tekstur berat ke WebP.
 *
 * Jalankan: node scripts/optimize-assets.mjs
 * Butuh devDependency `sharp`. Idempotent: menulis file .webp baru,
 * file sumber (.jpg/.png) dihapus manual lewat git setelah kode di-update.
 */
import sharp from 'sharp';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

// width: target lebar (px). Tinggi mengikuti rasio. quality: kualitas WebP.
const JOBS = [
	// --- Lantai kayu (tiling 4x4, dilihat dari jauh) ---
	['WoodFloor040_4K-JPG/WoodFloor040_4K_Color.jpg', 1024, 82],
	['WoodFloor040_4K-JPG/WoodFloor040_4K_NormalGL.jpg', 1024, 90],
	['WoodFloor040_4K-JPG/WoodFloor040_4K_Roughness.jpg', 1024, 78],
	['WoodFloor040_4K-JPG/WoodFloor040_4K_AmbientOcclusion.jpg', 512, 78],

	// --- Langit-langit ---
	['OfficeCeiling005_4K-JPG/OfficeCeiling005_4K_Color.jpg', 1024, 82],
	['OfficeCeiling005_4K-JPG/OfficeCeiling005_4K_NormalGL.jpg', 1024, 90],
	['OfficeCeiling005_4K-JPG/OfficeCeiling005_4K_Roughness.jpg', 1024, 78],
	['OfficeCeiling005_4K-JPG/OfficeCeiling005_4K_AmbientOcclusion.jpg', 512, 78],

	// --- Dinding (leather white) ---
	['leather_white_4k.gltf/textures/leather_white_diff_4k.jpg', 1024, 82],
	['leather_white_4k.gltf/textures/leather_white_nor_gl_4k.jpg', 1024, 90],
	['leather_white_4k.gltf/textures/leather_white_rough_4k.jpg', 1024, 78],

	// --- Misc ---
	['images/frame.jpg', 418, 82],
	['images/background-window.jpg', 1280, 80],
	['images/window.png', 1024, 86],
	['images/door.png', 500, 86],
	['images/no-image.png', 375, 86],
	['images/logo/disarpus.png', 900, 90],
];

let before = 0;
let after = 0;

for (const [rel, width, quality] of JOBS) {
	const src = join(PUBLIC, rel);
	const out = src.replace(/\.(jpe?g|png)$/i, '.webp');

	const srcBytes = statSync(src).size;
	await sharp(src)
		.resize({ width, withoutEnlargement: true })
		.webp({ quality, effort: 6 })
		.toFile(out);
	const outBytes = statSync(out).size;

	before += srcBytes;
	after += outBytes;
	const pct = ((1 - outBytes / srcBytes) * 100).toFixed(0);
	console.log(
		`${(srcBytes / 1024).toFixed(0).padStart(7)}KB -> ${(outBytes / 1024).toFixed(0).padStart(6)}KB  (-${pct}%)  ${rel}`
	);
}

console.log(
	`\nTotal: ${(before / 1024 / 1024).toFixed(1)}MB -> ${(after / 1024 / 1024).toFixed(1)}MB ` +
	`(-${((1 - after / before) * 100).toFixed(0)}%)`
);
