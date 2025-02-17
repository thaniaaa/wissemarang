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
                    `<img src="http://localhost:5000/${item.foto}" width="80" onerror="this.onerror=null; this.src='assets/images/no-image.png';">`,
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

// Fungsi Edit Data
function editData(id) {
    console.log("Mengedit wisata dengan ID:", id); // Debugging

    fetch(`http://localhost:5000/api/wisata/${id}`)
        .then(response => response.json())
        .then(data => {
            console.log("Data yang diterima untuk edit:", data); // Debugging

            // Tampilkan data dalam form modal
            document.getElementById("edit-id").value = id;
            document.getElementById("edit-nama").value = data.nama_tempat || data.nama || "";
            document.getElementById("edit-kategori").value = data.kategori || "";
            document.getElementById("edit-deskripsi").value = data.deskripsi || "";
            document.getElementById("edit-alamat").value = data.alamat || "";
            document.getElementById("edit-rating").value = data.rating || "0";
            document.getElementById("edit-foto-preview").src = data.foto 
                ? `http://localhost:5000/${data.foto}`
                : "assets/images/no-image.png";

            $("#editModal").modal("show");
        })
        .catch(error => console.error("Gagal mengambil data wisata:", error));
}

// Fungsi untuk menyimpan perubahan
document.getElementById("editForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const id = document.getElementById("edit-id").value;
    const updatedData = {
        nama_tempat: document.getElementById("edit-nama").value,
        kategori: document.getElementById("edit-kategori").value,
        deskripsi: document.getElementById("edit-deskripsi").value,
        alamat: document.getElementById("edit-alamat").value,
        rating: parseFloat(document.getElementById("edit-rating").value),
    };

    const token = localStorage.getItem("token"); // Ambil token dari local storage

fetch(`http://localhost:5000/api/wisata/${id}`, {
    method: "PUT",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // Tambahkan token ke header
    },
    body: JSON.stringify(updatedData),
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401) {
                        alert("Unauthorized! Silakan login kembali.");
                        window.location.href = "../login.html"; // Redirect ke login jika tidak authorized
                    }
                    throw new Error("Gagal menyimpan perubahan.");
                }
                return response.json();
            })
            .then(result => {
                alert("Data berhasil diperbarui!");
                $("#editModal").modal("hide");
                loadWisataData(); // Reload data tanpa refresh halaman
            })
            .catch(error => console.error("Gagal menyimpan perubahan:", error));

});

// Fungsi untuk Menghapus Data
function deleteData(id) {
    if (confirm("Yakin ingin menghapus data ini?")) {
        fetch(`http://localhost:5000/api/wisata/${id}`, {
            method: "DELETE",
        })
        .then(response => response.json())
        .then(result => {
            alert("Data berhasil dihapus!");
            loadWisataData(); // Memuat ulang data tanpa refresh halaman
        })
        .catch(error => console.error("Gagal menghapus data:", error));
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
