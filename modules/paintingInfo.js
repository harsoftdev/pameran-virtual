// Display painting info in the DOM
export const displayPaintingInfo = (info) => {
	const infoElement = document.getElementById('painting-info'); // Get the reference

	// Check if device is mobile/tablet
	const isMobileOrTablet = window.innerWidth <= 1024;
	
	// Set the html content inside info element
	const keyboardInstructions = isMobileOrTablet ? '' : `
		<p style="color: #ffa500; font-weight: bold;">Tekan SPASI untuk menampilkan pointer, lalu klik untuk melihat arsip &rarr;</p>
		<p style="color: #ccc; font-size: 0.9em; margin-top: 5px;">Tekan E untuk kembali ke menu awal</p>
	`;

	infoElement.innerHTML = `
		<h3>${info.title}</h3>
		<p><span class="label">Klasifikasi</span> : ${info.classification}</p>
		<p><span class="label">Tahun</span> : ${info.year}</p>
		<p><span class="label">Jumlah</span> : ${info.amount}</p>
		${keyboardInstructions}
    `;
	infoElement.classList.add('show'); // Add the 'show' class
};

// Hide painting info in the DOM
export const hidePaintingInfo = () => {
	const infoElement = document.getElementById('painting-info'); // Get the reference
	infoElement.classList.remove('show'); // Remove the 'show' class
};

