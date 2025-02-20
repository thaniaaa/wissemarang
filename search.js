// Fungsi untuk menangani pencarian
function handleSearch() {
    const searchText = document.getElementById('searchText').value.toLowerCase();  // Ambil input pencarian dan ubah menjadi huruf kecil

    if (searchText.length > 0) {
        loadDataAndSearch(searchText);
    } else {
        document.getElementById('searchResults').innerHTML = ''; // Kosongkan hasil jika input kosong
    }
}

// Ambil data dari API dan tampilkan di halaman
function loadDataAndSearch(searchText) {
    fetch('http://localhost:5000/api/wisata')  // Ganti dengan endpoint API yang sesuai
    .then(response => response.json())
    .then(data => {
        // Filter data berdasarkan nama, kategori, atau alamat yang mengandung kata kunci
        const filteredData = data.filter(item => {
            return item.name.toLowerCase().includes(searchText) ||
                   item.category.toLowerCase().includes(searchText) ||
                   item.address.toLowerCase().includes(searchText); // Menambahkan kategori dan alamat
        });
        displaySearchResults(filteredData); // Tampilkan hasil pencarian
    })
    .catch(error => {
        console.error('Error fetching data:', error); // Menangani jika terjadi kesalahan saat mengambil data
    });
}

// Fungsi untuk menampilkan hasil pencarian
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';  // Bersihkan hasil pencarian sebelumnya

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>Tidak ada hasil ditemukan</p>';
    } else {
        results.forEach(result => {
            const resultDiv = document.createElement('div');
            resultDiv.classList.add('search-result-item');
            
            // Gambar, Nama, Kategori, dan Alamat
            resultDiv.innerHTML = `
                <div class="search-result-content">
                    <img src="${result.imageUrl}" alt="${result.name}" class="search-result-image" />
                    <div class="search-result-text">
                        <h4>${result.name}</h4>
                        <p>${result.category}</p>
                        <p>${result.address}</p>
                    </div>
                </div>
            `;
            resultsContainer.appendChild(resultDiv);
        });
    }
}
