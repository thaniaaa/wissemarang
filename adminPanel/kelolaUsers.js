$(document).ready(function() {
    // Fungsi untuk mengambil data user dari API tanpa autentikasi
    function loadUserData() {
        fetch("http://localhost:5000/api/public/users", {
            method: 'GET',
        })
        .then(response => response.json())
        .then(data => {
            console.log("Data pengguna dari API:", data);  // Debugging untuk melihat data yang diterima

            if (!Array.isArray(data)) {
                console.error("Data dari API bukan array:", data);
                return;
            }

            // Menginisialisasi DataTable
            let userTable = $('#userTable').DataTable();
            userTable.clear();  // Kosongkan tabel sebelum memasukkan data baru

            let idCounter = 1;

            data.forEach(item => {

                let createdAtFormatted = moment(item.created_at).format("DD-MM-YYYY HH:mm:ss"); // Format tanggal dengan waktu
                // Menambahkan baris ke DataTable
                userTable.row.add([
                    idCounter++,  // ID urut yang bertambah setiap baris
                    item.username || "Tidak ada username",
                    item.email || "Tidak ada email",
                    //item.password || "Tidak ada password", // Perhatikan, biasanya password tidak ditampilkan di frontend
                    item.role || "Tidak ada role",
                    createdAtFormatted || "Tidak ada tanggal",
                    `<img src="${item.profile_picture}" width="50" onerror="this.onerror=null; this.src='assets/images/no-image.png';">`,
                    `<button class="btn btn-sm custom-edit edit-btn" data-id="${item.id}">Edit</button> 
<button class="btn btn-sm custom-delete delete-btn" data-id="${item.id}">Delete</button>`
                ]).draw();
            });
        })
        .catch(error => {
            console.error("Gagal memuat data pengguna:", error);
            alert("Gagal memuat data pengguna.");
        });
    }

    // Memanggil fungsi untuk memuat data pengguna saat halaman pertama kali dimuat
    loadUserData();

    //menambah data

    document.getElementById("addUserForm").addEventListener("submit", async function(event) {
        event.preventDefault();
    
        // Ambil data dari form
        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();
        const role = document.getElementById("role").value.trim();
        const messageDiv = document.getElementById("message");
    
        // Validasi form: Pastikan semua input tidak kosong
        if (!username || !email || !password || !confirmPassword || !role) {
            messageDiv.className = "alert alert-danger";
            messageDiv.textContent = "Semua kolom harus diisi!";
            messageDiv.classList.remove("d-none");
            return;
        }
    
        // Pastikan password dan konfirmasi password cocok
        if (password !== confirmPassword) {
            messageDiv.className = "alert alert-danger";
            messageDiv.textContent = "Password dan konfirmasi password tidak cocok!";
            messageDiv.classList.remove("d-none");
            return;
        }
    
        // Buat data untuk dikirimkan dalam format JSON
        const userData = {
            username,
            email,
            password,
            confirmPassword,
            role
        };
    
        const token = localStorage.getItem("token"); // Ambil token dari localStorage
    
        // Cek apakah token tersedia
        if (!token) {
            messageDiv.className = "alert alert-danger";
            messageDiv.textContent = "Token tidak ditemukan! Silakan login ulang.";
            messageDiv.classList.remove("d-none");
            return;
        }
    
        try {
            // Kirim data ke API dengan menggunakan token yang ada di localStorage
            const response = await fetch("http://localhost:5000/api/admin/users", {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",  // Mengirim data dalam format JSON
                    "Authorization": `Bearer ${token}`  // Menyertakan token di header
                },
                body: JSON.stringify(userData)  // Mengirimkan data dalam format JSON
            });
    
            const data = await response.json();
    
            // Menangani respons dari server
            if (response.ok) {
                messageDiv.className = "alert alert-success";
                messageDiv.textContent = "Pengguna berhasil ditambahkan!";
                $('#addUserModal').modal('hide');  // Tutup modal
                loadUserData();  // Perbarui tabel
            } else {
                messageDiv.className = "alert alert-danger";
                messageDiv.textContent = data.error || "Gagal menambahkan pengguna!";
            }
        } catch (error) {
            messageDiv.className = "alert alert-danger";
            messageDiv.textContent = "Terjadi kesalahan. Coba lagi!";
        }
    
        // Menampilkan pesan
        messageDiv.classList.remove("d-none");
    });    

    $(document).on('click', '.edit-btn', function() {
        const userId = $(this).data('id');
    
        // Ambil data user yang akan diedit berdasarkan ID
        fetch(`http://localhost:5000/api/public/users/${userId}`)
            .then(response => response.json())
            .then(data => {
                // Isi data pada modal edit
                $('#edit-user-id').val(data.id);
                $('#edit-user-username').val(data.username);
                $('#edit-user-email').val(data.email);
                $('#edit-user-role').val(data.role);
        
                $('#editUserModal').modal('show'); // Tampilkan modal
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
            });
    });
    
    // Submit form edit user
    $('#editUserForm').on('submit', function(e) {
        e.preventDefault();
    
        const userId = $('#edit-user-id').val().trim();
        const username = $('#edit-user-username').val().trim();
        const email = $('#edit-user-email').val().trim();
        const role = $('#edit-user-role').val().trim();
        const password = $('#edit-user-password').val().trim();  // Ambil password baru jika ada
    
        const userData = { username, email, role, password };
    
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Token tidak ditemukan! Silakan login ulang.");
            return;
        }
    
        // Kirim data ke API untuk mengedit data user
        fetch(`http://localhost:5000/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, // Pastikan Authorization header ada
            },
            body: JSON.stringify(userData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                $('#editUserModal').modal('hide');  // Tutup modal
                loadUserData();  // Perbarui tabel
            } else {
                alert(data.error || 'Gagal memperbarui data pengguna');
            }
        })
        .catch(error => {
            console.error("Error updating user:", error);
            alert("Terjadi kesalahan. Coba lagi.");
        });
        
    });

     //delete user
     $(document).on('click', '.delete-btn', function() {
        // Mendapatkan ID pengguna dari atribut data-id pada tombol
        const userId = $(this).data('id');
        
        // Menanyakan konfirmasi sebelum melakukan penghapusan
        if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
            
            // Mengambil token dari localStorage untuk verifikasi
            const token = localStorage.getItem("token");
            
            // Cek apakah token tersedia
            if (!token) {
                alert("Token tidak ditemukan! Silakan login ulang.");
                return;  // Menghentikan eksekusi jika token tidak ada
            }
    
            // Melakukan permintaan DELETE ke API untuk menghapus pengguna berdasarkan ID
            fetch(`http://localhost:5000/api/admin/users/${userId}`, {
                method: 'DELETE',  // Menentukan metode HTTP DELETE
                headers: {
                    "Content-Type": "application/json",  // Menyatakan bahwa data yang dikirimkan dalam format JSON
                    "Authorization": `Bearer ${token}`,  // Menyertakan token di header untuk otorisasi
                }
            })
            .then(response => response.json())  // Mengonversi respons menjadi JSON
            .then(data => {
                if (data.message) {
                    // Jika sukses, tampilkan pesan sukses dan muat ulang data pengguna
                    alert(data.message);
                    loadUserData();  // Memuat ulang data pengguna setelah penghapusan
                } else {
                    // Jika terjadi kesalahan, tampilkan pesan error
                    alert(data.error || 'Gagal menghapus pengguna');
                }
            })
            .catch(error => {
                // Jika ada error dalam permintaan fetch
                console.error("Error deleting user:", error);
                alert("Terjadi kesalahan. Coba lagi.");
            });
        }
    });
    

});
