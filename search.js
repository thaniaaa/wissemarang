document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem('token');
    
    // Ambil data dari API atau data yang sudah ada
    fetch("http://localhost:5000/api/wisata/kategori/Hotel")
      .then(response => response.json())
      .then(data => {
        const hotelList = document.getElementById("hotel-list");
  
        // Fungsi untuk memfilter hasil berdasarkan input pencarian
        function filterHotels(searchText) {
          const filteredData = data.filter(hotel => {
            return hotel.nama_tempat.toLowerCase().includes(searchText) || 
                   hotel.kategori.toLowerCase().includes(searchText) || 
                   hotel.alamat.toLowerCase().includes(searchText);
          });
          renderHotels(filteredData);
        }
  
        // Render hotel berdasarkan data
        function renderHotels(hotels) {
          hotelList.innerHTML = ''; // Clear previous data
          hotels.forEach(hotel => {
            const hotelItem = document.createElement("div");
            hotelItem.classList.add("col-lg-4", "col-sm-6", "mb-4");
  
            hotelItem.innerHTML = `
              <div class="item">
                <div class="thumb">
                  <img src="http://localhost:5000/${hotel.foto}" alt="${hotel.nama_tempat}">
                </div>
                <div class="down-content">
                  <h4>${hotel.nama_tempat}</h4>
                  <p>${hotel.alamat}</p>
                  <p>Category: ${hotel.kategori}</p>
                  <button class="btn btn-warning">Edit</button>
                  <button class="btn btn-danger">Delete</button>
                </div>
              </div>
            `;
            hotelList.appendChild(hotelItem);
          });
        }
  
        // Panggil filter saat mengetik di kolom pencarian
        document.getElementById("searchText").addEventListener("input", function () {
          const searchText = this.value.toLowerCase();
          filterHotels(searchText);
        });
  
        // Render initial data
        renderHotels(data);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
      });
  });
  