// Fetch Data Wisata
function loadWisataData() {
    fetch("http://localhost:5000/api/wisata")
        .then(response => response.json())
        .then(data => {
            console.log("Data dari API:", data); // Debugging untuk melihat struktur data

            if (!Array.isArray(data)) {
                console.error("Data dari API bukan array:", data);
                return;
            }

            let wisataTable = $('#wisataTable').DataTable();
            wisataTable.clear();

            data.forEach(item => {
                wisataTable.row.add([
                    item.id || "N/A",
                    item.nama_tempat || "Tidak ada nama",
                    item.kategori || "Tidak ada kategori",
                    `<img src="http://localhost:5000/${item.foto}" width="80" onerror="this.onerror=null; this.src='http://localhost:5000/wisataImage/no-image.png';">`,
                    item.deskripsi ? item.deskripsi.substring(0, 50) + "..." : "Tidak ada deskripsi",
                    item.alamat || "Tidak ada alamat",
                    item.rating || "0",
                    `<button class="btn btn-sm custom-edit edit-btn" data-id="${item.id}">Edit</button> 
<button class="btn btn-sm custom-delete delete-btn" data-id="${item.id}">Delete</button>`

                ]).draw();
            });
        })
        .catch(error => console.error("Gagal memuat data wisata:", error));
}

// Menambah data wisata
document.getElementById("addForm").addEventListener("submit", function(event) {
    event.preventDefault();

    // Ambil data dari form
    const newWisataData = new FormData();
    newWisataData.append("nama_tempat", document.getElementById("add-nama").value);
    newWisataData.append("kategori", document.getElementById("add-kategori").value);
    newWisataData.append("deskripsi", document.getElementById("add-deskripsi").value);
    newWisataData.append("alamat", document.getElementById("add-alamat").value);
    newWisataData.append("rating", parseFloat(document.getElementById("add-rating").value));

    // Ambil foto dari input file
    const fotoFile = document.getElementById("add-foto").files[0];
    if (fotoFile) {
        newWisataData.append("foto", fotoFile);  // Mengambil file gambar
    }

    // Ambil token dari localStorage
    const token = localStorage.getItem("token"); 

    // Kirim data ke server menggunakan FormData
    fetch('http://localhost:5000/api/wisata', {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`  // Menambahkan token pada header
        },
        body: newWisataData,  // Kirim FormData
    })
    .then(response => response.json())
    .then(result => {
        console.log("Hasil respons setelah tambah data:", result); // Debugging respons
        // Cek jika ada error
        if (result.error) {
            alert(result.error);
        } else {
            alert("Data wisata berhasil ditambahkan!");
            $("#addModal").modal("hide"); // Tutup modal setelah data berhasil ditambahkan
            //loadWisataData(); // Reload data tanpa refresh halaman

            // // Buat elemen baru untuk data yang ditambahkan
            // const newRow = `
            //     <tr>
            //         <td>${result.id}</td>
            //         <td>${result.nama_tempat}</td>
            //         <td>${result.kategori}</td>
            //         <td>${result.deskripsi}</td>
            //         <td>${result.alamat}</td>
            //         <td>${result.rating}</td>
            //         <td><img src="http://localhost:5000/${result.foto}" width="80" alt="Gambar"></td>
            //         <td>
            //             <button class="btn btn-warning btn-sm edit-btn" data-id="${result.id}">Edit</button>
            //             <button class="btn btn-danger btn-sm delete-btn" data-id="${result.id}">Delete</button>
            //         </td>
            //     </tr>
            // `;

            // // Menambahkan baris baru di atas tabel
            // $('#wisataTable').find('tbody').prepend(newRow); // prepend menambahkan baris di atas
        }
    })
    .catch(error => {
        console.error("Gagal menambah data wisata:", error);
        alert("Terjadi kesalahan saat menambah data wisata.");
    });
});


// Fungsi Edit Data Wisata
function editData(id) {
    console.log("Mengedit wisata dengan ID:", id); // Debugging

    fetch(`http://localhost:5000/api/wisata/${id}`)
        .then(response => response.json())
        .then(data => {
            console.log("Data yang diterima untuk edit:", data); // Debugging

            // Tampilkan data dalam form modal
            document.getElementById("edit-wisata-id").value = id;
            document.getElementById("edit-nama").value = data.nama_tempat || "";
            document.getElementById("edit-kategori").value = data.kategori || "";
            document.getElementById("edit-deskripsi").value = data.deskripsi || "";
            document.getElementById("edit-alamat").value = data.alamat || "";
            document.getElementById("edit-rating").value = data.rating || "0";
            // document.getElementById("edit-foto-preview").src = data.foto 
            //     ? `http://localhost:5000/wisataImage/${data.foto}` // URL gambar wisata
            //     : "assets/images/no-image.png"; // Default image if none

            $("#editWisataModal").modal("show");
        })
        .catch(error => console.error("Gagal mengambil data wisata:", error));
}

// Handle form submit untuk edit wisata
document.getElementById("editWisataForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const id = document.getElementById("edit-wisata-id").value;
    const updatedData = {
        nama_tempat: document.getElementById("edit-nama").value,
        kategori: document.getElementById("edit-kategori").value,
        deskripsi: document.getElementById("edit-deskripsi").value,
        alamat: document.getElementById("edit-alamat").value,
        rating: parseFloat(document.getElementById("edit-rating").value),
    };

    const token = localStorage.getItem("token"); // Ambil token dari local storage
    const formData = new FormData();
    formData.append("nama_tempat", updatedData.nama_tempat);
    formData.append("kategori", updatedData.kategori);
    formData.append("deskripsi", updatedData.deskripsi);
    formData.append("alamat", updatedData.alamat);
    formData.append("rating", updatedData.rating);

    const foto = document.getElementById("edit-foto").files[0];
    if (foto) {
        formData.append("foto", foto); // Jika ada foto baru
    }

    try {
        const response = await fetch(`http://localhost:5000/api/wisata/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text(); 
            throw new Error(`Gagal memperbarui wisata: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        alert("Wisata berhasil diperbarui!");
        location.reload();
    } catch (error) {
        console.error("Gagal memperbarui wisata:", error);
        alert("Terjadi kesalahan saat memperbarui wisata!");
    }
});


// Fungsi untuk menghapus data wisata
function deleteData(id) {
    if (confirm("Yakin ingin menghapus data wisata ini?")) {
        const token = localStorage.getItem("token"); // Ambil token dari localStorage

        if (!token) {
            alert("Token tidak ditemukan! Silakan login ulang.");
            return; // Jika token tidak ada, hentikan eksekusi
        }

        // Kirim request DELETE ke API
        fetch(`http://localhost:5000/api/wisata/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,  // Menambahkan token pada header untuk otorisasi
            },
        })
        .then(response => response.json())
        .then(result => {
            alert(result.message); // Tampilkan pesan berhasil
            loadWisataData(); // Muat ulang data wisata tanpa refresh halaman
        })
        .catch(error => {
            console.error("Gagal menghapus data wisata:", error);
            alert("Terjadi kesalahan saat menghapus data wisata.");
        });
    }
}

// Event Listener untuk Tombol Edit & Delete
$(document).ready(function () {
    $('#wisataTable').DataTable();
    loadWisataData();

    // Delegasi event untuk tombol Edit
    $(document).on("click", ".edit-btn", function () {
        const wisataId = $(this).data("id");
        if (wisataId) {
            editData(wisataId);
        } else {
            console.error("ID tidak ditemukan pada tombol edit");
        }
    });

    // Delegasi event untuk tombol Delete
    $(document).on("click", ".delete-btn", function () {
        const wisataId = $(this).data("id");
        if (wisataId) {
            deleteData(wisataId);
        } else {
            console.error("ID tidak ditemukan pada tombol delete");
        }
    });

    $("#editModal .btn-secondary, #editModal .close").on("click", function () {
        $("#editModal").modal("hide");
    });
    
});
