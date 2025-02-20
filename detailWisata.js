document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const wisataId = urlParams.get('id'); // Mendapatkan ID wisata dari URL

    if (!wisataId) {
        alert("ID wisata tidak ditemukan.");
        return;
    }

    // Fungsi untuk mengirim review
    document.getElementById('submit-review').addEventListener('click', function () {
        const token = localStorage.getItem('token'); // Ambil token dari localStorage
        if (!token) {
            alert('Anda harus login terlebih dahulu untuk memberikan review.');
            return;
        }

        const decodedToken = JSON.parse(atob(token.split('.')[1])); // Mendekode JWT
        const userId = decodedToken.id; // Ambil userId dari token

        const rating = getSelectedRating(); // Mendapatkan rating yang dipilih
        const reviewText = document.getElementById('review-text').value; // Mengambil teks review
        const wisataId = new URLSearchParams(window.location.search).get('id'); // Mendapatkan wisataId dari URL

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

        // Mengirimkan request POST untuk menambahkan review
        fetch(`http://localhost:5000/api/rating/${wisataId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(review)
        })
        .then(response => response.json())
        .then(data => {
            console.log("Data review yang diterima:", data);
            alert('Review berhasil dikirim');
            loadKomentar(wisataId); // Reload comments after submitting a review
            loadAverageRating(wisataId); // Reload average rating after submitting a review
            resetReviewForm(); // Reset the form after review submission
        })
        .catch(error => {
            console.error('Error submitting review:', error);
        });
    });

    // Fungsi untuk menampilkan review yang baru saja dikirim
    function displayReview(reviewData) {
        const komentarContainer = document.getElementById('komentar-container');
        const komentarElement = document.createElement('div');
        komentarElement.classList.add('komentar-item');

        const rating = reviewData.rating || 0; // Default to 0 if rating is missing
        const reviewText = reviewData.review_text || 'No review provided'; // Default review text
        const username = reviewData.username || 'Unknown User'; // Fallback to 'Unknown User' if no username
        const postDate = new Date(reviewData.created_at).toLocaleDateString() || 'Invalid Date'; // Fallback to 'Invalid Date' if no created_at

        const ratingStars = createRatingStars(rating);

        komentarElement.innerHTML = `
            <div class="review-header">
                <span class="username">${username}</span>
                <span class="rating">${ratingStars} ${rating}</span>
            </div>
            <div class="review-text">${reviewText}</div>
            <div class="review-footer">
                <span class="purchased">Post on ${postDate}</span>
            </div>
        `;
        
        komentarContainer.appendChild(komentarElement);
    }

    // Fungsi untuk menghasilkan bintang berdasarkan rating
    function createRatingStars(rating) {
        let stars = '';
        for (let i = 0; i < 5; i++) {
            if (i < rating) {
                stars += ' &#9733;'; // Bintang penuh
            } else {
                stars += ' &#9734;'; // Bintang kosong
            }
        }
        return stars;
    }

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

    function resetReviewForm() {
        // Reset the textarea
        document.getElementById('review-text').value = '';
        
        // Reset the stars
        stars.forEach(star => {
            star.classList.remove('active');
        });
    }

    // Fungsi untuk menampilkan rata-rata rating
    function loadAverageRating(wisataId) {
        fetch(`http://localhost:5000/api/rating/wisata/${wisataId}`)
            .then(response => response.json())
            .then(data => {
                const averageRating = data.averageRating || 0; // Ambil rata-rata rating
                const totalRatings = data.totalRatings || 0; // Ambil jumlah rating
                const ratingElement = document.getElementById('average-rating');
                ratingElement.innerHTML = `
                    <h5 style="color: black;">Rata-rata Rating: ${averageRating.toFixed(1)} ⭐ (${totalRatings} ratings)</h5>

                `;
            })
            .catch(error => {
                console.error('Error fetching average rating:', error);
            });
    }

    // Menampilkan detail wisata
    fetch(`http://localhost:5000/api/wisata/${wisataId}`)
        .then(response => response.json())
        .then(wisataData => {
            displayWisataDetails(wisataData); // Menampilkan detail wisata
            //loadWisataGallery(wisataId); // Menampilkan gambar dari gallery
            loadKomentar(wisataId); // Menampilkan komentar
            loadAverageRating(wisataId); // Menampilkan rata-rata rating
        })
        .catch(error => {
            console.error('Error fetching wisata details:', error);
        });

    // Menampilkan detail wisata
    function displayWisataDetails(wisata) {
        const wisataDetailContent = document.getElementById('wisata-detail-content');
        wisataDetailContent.innerHTML = `
            <div class="row">
                <div class="col-lg-12">
                    <div class="left-info text-center">
                        
                            <h4>${wisata.nama_tempat}</h4>
                            <span>${wisata.alamat}</span>
                        
                    </div>
                </div>
                <div class="col-lg-12 text-center">
                    <img src="http://localhost:5000/${wisata.foto}" alt="${wisata.nama_tempat}" class="img-fluid" />
                </div>
            </div>
            <div class="deskripsi mt-3">
            <p>${wisata.deskripsi}</p>
            </div>
        `;
    }

    // Mengambil gambar dari tabel wisata_gallery
    // function loadWisataGallery(wisataId) {
    //     fetch(`http://localhost:5000/api/wisata/gallery/${wisataId}`)
    //         .then(response => response.json())
    //         .then(galleryData => {
    //             const galleryContainer = document.createElement('div');
    //             galleryContainer.classList.add('row');

    //             galleryData.forEach(galleryItem => {
    //                 const imgElement = document.createElement('div');
    //                 imgElement.classList.add('col-lg-4');
    //                 imgElement.innerHTML = `<img src="http://localhost:5000/${galleryItem.foto}" alt="Gallery Image" class="img-fluid" />`;
    //                 galleryContainer.appendChild(imgElement);
    //             });

    //             const wisataDetailContent = document.getElementById('wisata-detail-content');
    //             wisataDetailContent.appendChild(galleryContainer);
    //         })
    //         .catch(error => {
    //             console.error('Error fetching gallery images:', error);
    //         });
    // }

    // Menampilkan komentar wisata
    function loadKomentar(wisataId) {
        fetch(`http://localhost:5000/api/rating/${wisataId}`)
            .then(response => response.json())
            .then(komentarData => {
                const komentarContainer = document.getElementById('komentar-container');
                komentarContainer.innerHTML = ''; // Clear previous comments

                komentarData.forEach(komentar => {
                    const komentarElement = document.createElement('div');
                    komentarElement.classList.add('komentar-item');
                    const ratingStars = createRatingStars(komentar.rating);

                    komentarElement.innerHTML = `
                       <div class="review-header">
                            <span class="username">${komentar.username}</span>
                             <span class="rating">${ratingStars} ${komentar.rating}</span>
                        </div>
                        <div class="review-text">${komentar.review_text}</div>
                        <div class="review-footer">
                            <span class="purchased">Post on ${new Date(komentar.created_at).toLocaleDateString()}</span>
                        </div>
                    `;
                    komentarContainer.appendChild(komentarElement);
                });
            })
            .catch(error => {
                console.error('Error fetching komentar:', error);
            });
    }
});
