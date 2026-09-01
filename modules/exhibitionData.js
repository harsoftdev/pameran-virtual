// Ambil data exhibition dari API sekali saja, lalu cache promise-nya.
// Semua modul (main, audioGuide, middleWall) pakai fungsi ini supaya
// tidak ada fetch berulang ke endpoint yang sama.

const API_URL = 'https://silat.bekasikab.go.id/api/exhibitions';

let cached = null;

export const getExhibitionData = () => {
	if (!cached) {
		cached = fetch(API_URL)
			.then((res) => res.json())
			.then((json) => json.data ?? null)
			.catch((err) => {
				console.warn('Gagal fetch exhibition data:', err);
				return null;
			});
	}
	return cached;
};
