// munculkan painting info di DOM
export const displayPaintingInfo = (info) => {
    const infoElement = document.getElementById('painting-info');

    // Atur kontent HTML di dalam elemen info 
    infoElement.innerHTML =`
        <h3>${info.title}</h3>
        <p>Artist: ${info.artist}</p>
        <p>Description: ${info.description}</h3>
        <p>Year: ${info.year}</p>
    `;
    infoElement.classList.add('show'); // tambahkan class 'show'
};

// sembunyikan painting info di DOM
export const hidePaintingInfo = () => {
    const infoElement = document.getElementById('painting-info');
    infoElement.classList.remove('show'); // hapus class 'show'
};