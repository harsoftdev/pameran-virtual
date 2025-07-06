// Display painting info in the DOM
export const displayPaintingInfo = (info) => {
	const infoElement = document.getElementById('painting-info'); // Get the reference

	// Set the html content inside info element
	infoElement.innerHTML = `
		<h3>${info.title}</h3>
		<p><span class="label">Klasifikasi</span> : ${info.classification}</p>
		<p><span class="label">Tahun</span> : ${info.year}</p>
		<p><span class="label">Jumlah</span> : ${info.amount}</p>
		<a href="${info.link}" class="btn-link" target="_blank">Lihat Arsip</a>
    `;
	infoElement.classList.add('show'); // Add the 'show' class
};

// Hide painting info in the DOM
export const hidePaintingInfo = () => {
	const infoElement = document.getElementById('painting-info'); // Get the reference
	infoElement.classList.remove('show'); // Remove the 'show' class
};

