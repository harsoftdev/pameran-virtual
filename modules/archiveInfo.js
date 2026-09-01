// Tampilkan info arsip di DOM. hideHints=true saat tur otomatis (petunjuk
// SPASI/klik tidak relevan di sana).
export const displayArchiveInfo = (info, hideHints = false) => {
	const infoElement = document.getElementById('archive-info');

	const showHints = !hideHints && window.innerWidth > 1024;

	const keyboardInstructions = showHints ? `
		<p style="color: #ffa500; font-weight: bold;">Tekan SPASI untuk menampilkan pointer, lalu klik untuk melihat arsip &rarr;</p>
		<p style="color: #ccc; font-size: 0.9em; margin-top: 5px;">Tekan E untuk kembali ke menu awal</p>
	` : '';

	infoElement.innerHTML = `
		<h3>${info.title}</h3>
		<p><span class="label">Klasifikasi</span> : ${info.classification}</p>
		<p><span class="label">Tahun</span> : ${info.year}</p>
		<p><span class="label">Jumlah</span> : ${info.amount}</p>
		${keyboardInstructions}
    `;
	infoElement.classList.add('show');
};

// Sembunyikan info arsip di DOM
export const hideArchiveInfo = () => {
	const infoElement = document.getElementById('archive-info');
	infoElement.classList.remove('show');
};
