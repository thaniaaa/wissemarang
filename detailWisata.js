document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const wisataId = urlParams.get('id'); // Mendapatkan ID wisata dari URL

    if (!wisataId) {
        alert("ID wisata tidak ditemukan.");
        return;
    }

    // Ambil data wisata dari server berdasarkan ID tanpa cek login
    fetch(`http://localhost:5000/api/wisata/${wisataId}`)
        .then(response => response.json())
        .then(wisataData => {
            displayWisataDetails(wisataData); // Menampilkan detail wisata
            loadWisataGallery(wisataId); // Menampilkan gambar dari gallery
            loadKomentar(wisataId); // Menampilkan komentar
        })
        .catch(error => {
            console.error('Error fetching wisata details:', error);
        });

    // Menampilkan detail wisata
    function displayWisataDetails(wisata) {
        const wisataDetailContent = document.getElementById('wisata-detail-content');
        wisataDetailContent.innerHTML = `
            <div class="row">
                <div class="col-lg-6">
                    <div class="left-info">
                        <div class="left">
                            <h4>${wisata.nama_tempat}</h4>
                            <span>${wisata.alamat}</span>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <img src="http://localhost:5000/${wisata.foto}" alt="${wisata.nama_tempat}" class="img-fluid" />
                </div>
            </div>
            <p>${wisata.deskripsi}</p>
        `;
    }

    // Mengambil gambar dari tabel wisata_gallery
    function loadWisataGallery(wisataId) {
        fetch(`http://localhost:5000/api/wisata/gallery/${wisataId}`)
            .then(response => response.json())  // Parsing data sebagai JSON
            .then(galleryData => {
                const galleryContainer = document.createElement('div');
                galleryContainer.classList.add('row');

                galleryData.forEach(galleryItem => {
                    const imgElement = document.createElement('div');
                    imgElement.classList.add('col-lg-4');
                    imgElement.innerHTML = `<img src="http://localhost:5000/${galleryItem.foto}" alt="Gallery Image" class="img-fluid" />`;
                    galleryContainer.appendChild(imgElement);
                });

                const wisataDetailContent = document.getElementById('wisata-detail-content');
                wisataDetailContent.appendChild(galleryContainer);
            })
            .catch(error => {
                console.error('Error fetching gallery images:', error);
            });
    }

    // Menampilkan komentar wisata
    function loadKomentar(wisataId) {
        fetch(`http://localhost:5000/api/rating/${wisataId}`)  // Menyesuaikan dengan endpoint yang benar
            .then(response => response.json())
            .then(komentarData => {
                const komentarContainer = document.getElementById('komentar-container');
                komentarContainer.innerHTML = ''; // Clear previous comments

                komentarData.forEach(komentar => {
                    const komentarElement = document.createElement('div');
                    komentarElement.classList.add('komentar-item');
                    komentarElement.innerHTML = `
                        <p><strong>${komentar.username}</strong>: ${komentar.review_text}</p>
                    `;
                    komentarContainer.appendChild(komentarElement);
                });
            })
            .catch(error => {
                console.error('Error fetching komentar:', error);
            });
    }

    // Menangani pengiriman komentar dan review (hanya jika login)
    document.getElementById('submit-review').addEventListener('click', function () {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Anda harus login terlebih dahulu untuk memberikan review.');
            return;
        }

        const decodedToken = JSON.parse(atob(token.split('.')[1])); // Mendekode JWT
        const userId = decodedToken.id;

        const rating = getSelectedRating();
        const reviewText = document.getElementById('review-text').value;

        if (rating === 0 || !reviewText) {
            alert("Silakan pilih rating dan tulis ulasan.");
            return;
        }

        const review = {
            userId,
            wisataId,
            rating,
            reviewText
        };

        fetch('http://localhost:5000/api/rating', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(review)
        })
            .then(response => response.json())
            .then(data => {
                alert('Review berhasil dikirim');
                displayReview(data); // Menampilkan review yang baru saja dikirim
            })
            .catch(error => console.error('Error submitting review:', error));
    });

    // Fungsi untuk mendapatkan rating yang dipilih
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', function () {
            const rating = parseInt(star.getAttribute('data-value'));
            updateStars(rating);
        });
        star.addEventListener('mouseover', function () {
            const rating = parseInt(star.getAttribute('data-value'));
            updateStars(rating);
        });
        star.addEventListener('mouseout', function () {
            const selectedRating = getSelectedRating();
            updateStars(selectedRating);
        });
    });

    function updateStars(rating) {
        stars.forEach(star => {
            const starValue = parseInt(star.getAttribute('data-value'));
            if (starValue <= rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    function getSelectedRating() {
        let rating = 0;
        stars.forEach(star => {
            if (star.classList.contains('active')) {
                rating = parseInt(star.getAttribute('data-value'));
            }
        });
        return rating;
    }

});
