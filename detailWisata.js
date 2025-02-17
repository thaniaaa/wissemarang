document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const wisataId = urlParams.get('id'); // Mendapatkan ID wisata dari URL

    if (!wisataId) {
        alert("ID wisata tidak ditemukan.");
        return;
    }

    // Ambil token pengguna yang login dari localStorage
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Anda harus login terlebih dahulu.');
        return;
    } else {
        const decodedToken = JSON.parse(atob(token.split('.')[1])); // Mendekode JWT
        const userId = decodedToken.id;

        // Mengambil data wisata dari server berdasarkan ID
        fetch(`http://localhost:5000/api/wisata/${wisataId}`)
            .then(response => response.json())
            .then(wisataData => {
                displayWisataDetails(wisataData); // Menampilkan detail wisata
                loadWisataGallery(wisataId); // Menampilkan gambar dari gallery
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

        // Mengambil data review berdasarkan wisataId dan userId
        fetch(`http://localhost:5000/api/rating/${wisataId}?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => response.json())
            .then(reviewData => {
                if (reviewData) {
                    // Jika ada review, tampilkan dan izinkan untuk mengedit
                    displayReview(reviewData);
                } else {
                    // Jika tidak ada review, tampilkan tombol untuk submit review
                    document.querySelector('.edit-review-form').style.display = 'none';
                    document.getElementById('submit-review').style.display = 'block';
                }
            })
            .catch(error => console.error('Error fetching review:', error));

            function displayReview(reviewData) {
                // Menampilkan rating
                const stars = document.querySelectorAll('.star');
                stars.forEach(star => {
                    const starValue = parseInt(star.getAttribute('data-value'));
                    if (starValue <= reviewData.rating) {
                        star.classList.add('active'); // Beri kelas 'active' pada bintang yang sesuai
                    } else {
                        star.classList.remove('active');
                    }
                });
            
                // Menampilkan ulasan
                document.getElementById('review-text').value = reviewData.review_text;
            
                // Menampilkan form untuk edit
                document.querySelector('.edit-review-form').style.display = 'block';
                document.getElementById('submit-review').style.display = 'none'; // Hide submit if editing
                document.getElementById('submit-edit').style.display = 'block'; // Show edit button
            }
            

        // Menangani klik pada bintang untuk memberikan rating
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

        // Mengupdate warna bintang
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

        // Mendapatkan rating yang dipilih
        function getSelectedRating() {
            let rating = 0;
            stars.forEach(star => {
                if (star.classList.contains('active')) {
                    rating = parseInt(star.getAttribute('data-value'));
                }
            });
            return rating;
        }

        // Kirim update untuk review
        document.getElementById('submit-edit').addEventListener('click', function () {
            const updatedReviewText = document.getElementById('edit-review-text').value;
            const rating = getSelectedRating();

            if (!updatedReviewText || rating === 0) {
                alert('Silakan isi ulasan dan rating.');
                return;
            }

            const updatedReview = {
                reviewText: updatedReviewText,
                rating
            };

            fetch(`http://localhost:5000/api/rating/${wisataId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedReview)
            })
                .then(response => response.json())
                .then(data => {
                    alert('Review berhasil diperbarui');
                    displayReview(data);
                })
                .catch(error => console.error('Error updating review:', error));
        });

        // Kirim review baru
        document.getElementById('submit-review').addEventListener('click', function () {
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
                    displayReview(data);
                })
                .catch(error => console.error('Error submitting review:', error));
        });
    }
});
