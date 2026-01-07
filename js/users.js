// Users Management Module

let allUsers = [];
let editingUserId = null;

/**
 * Initialize users page
 */
async function initUsers() {
    try {
        await loadUsers();
        setupUserEventListeners();
    } catch (error) {
        console.error('Error initializing users page:', error);
        showToast('Gagal memuat halaman pengguna', 'error');
    }
}

/**
 * Setup event listeners for users page
 */
function setupUserEventListeners() {
    // Add user button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            openUserModal();
        });
    }

    // User form submit
    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', handleUserFormSubmit);
    }

    // Close modal buttons
    const closeUserModal = document.getElementById('close-user-modal');
    const cancelUserBtn = document.getElementById('cancel-user-btn');
    
    if (closeUserModal) {
        closeUserModal.addEventListener('click', () => {
            document.getElementById('user-modal').classList.remove('active');
            resetUserForm();
        });
    }
    
    if (cancelUserBtn) {
        cancelUserBtn.addEventListener('click', () => {
            document.getElementById('user-modal').classList.remove('active');
            resetUserForm();
        });
    }
}

/**
 * Load all users and display in table
 */
async function loadUsers() {
    try {
        allUsers = await getAllUsers();
        displayUsers(allUsers);
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Gagal memuat data pengguna', 'error');
    }
}

/**
 * Display users in table
 */
function displayUsers(users) {
    const tbody = document.getElementById('users-tbody');
    
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">
                    <div class="empty-state">
                        <p>Belum ada pengguna. Klik "Tambah Pengguna" untuk memulai.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.username)}</td>
            <td>
                <span class="badge ${user.role === 'admin' ? 'badge-success' : 'badge-info'}">
                    ${user.role === 'admin' ? 'Admin' : 'Kasir'}
                </span>
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="editUser('${user.id}')" title="Edit">
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" fill="currentColor"/>
                        </svg>
                    </button>
                    <button class="btn-icon btn-danger" onclick="confirmDeleteUser('${user.id}', '${escapeHtml(user.name)}')" title="Hapus">
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Open user modal for adding or editing
 */
function openUserModal(userId = null) {
    const modal = document.getElementById('user-modal');
    const modalTitle = document.getElementById('user-modal-title');
    
    if (!modal || !modalTitle) return;

    resetUserForm();
    
    if (userId) {
        // Edit mode
        editingUserId = userId;
        modalTitle.textContent = 'Edit Pengguna';
        loadUserData(userId);
    } else {
        // Add mode
        editingUserId = null;
        modalTitle.textContent = 'Tambah Pengguna';
    }
    
    modal.classList.add('active');
}

/**
 * Load user data into form for editing
 */
async function loadUserData(userId) {
    try {
        const user = allUsers.find(u => u.id === userId);
        
        if (!user) {
            showToast('Pengguna tidak ditemukan', 'error');
            return;
        }

        document.getElementById('user-id').value = user.id;
        document.getElementById('user-name-input').value = user.name;
        document.getElementById('user-username').value = user.username;
        document.getElementById('user-role').value = user.role;
        
        // Make password optional for editing
        const passwordInput = document.getElementById('user-password');
        passwordInput.required = false;
        passwordInput.placeholder = 'Kosongkan jika tidak ingin mengubah password';
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Gagal memuat data pengguna', 'error');
    }
}

/**
 * Handle user form submit
 */
async function handleUserFormSubmit(e) {
    e.preventDefault();
    
    const userId = document.getElementById('user-id').value;
    const name = document.getElementById('user-name-input').value.trim();
    const username = document.getElementById('user-username').value.trim();
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;

    if (!name || !username || !role) {
        showToast('Mohon lengkapi semua field yang wajib diisi', 'warning');
        return;
    }

    try {
        if (userId) {
            // Update existing user
            const updates = {
                name: name,
                username: username,
                role: role
            };
            
            // Only update password if provided
            if (password) {
                updates.password = password;
            }
            
            await updateUser(userId, updates);
            showToast('Pengguna berhasil diperbarui', 'success');
        } else {
            // Add new user
            if (!password) {
                showToast('Password wajib diisi untuk pengguna baru', 'warning');
                return;
            }

            // Check if username already exists
            const existingUser = await getUserByUsername(username);
            if (existingUser) {
                showToast('Username sudah digunakan', 'warning');
                return;
            }

            await addUser({
                name: name,
                username: username,
                password: password,
                role: role
            });
            
            showToast('Pengguna berhasil ditambahkan', 'success');
        }

        // Close modal and reload users
        document.getElementById('user-modal').classList.remove('active');
        resetUserForm();
        await loadUsers();
        
    } catch (error) {
        console.error('Error saving user:', error);
        showToast('Gagal menyimpan pengguna', 'error');
    }
}

/**
 * Reset user form
 */
function resetUserForm() {
    const form = document.getElementById('user-form');
    if (form) {
        form.reset();
    }
    
    document.getElementById('user-id').value = '';
    editingUserId = null;
    
    // Reset password field
    const passwordInput = document.getElementById('user-password');
    passwordInput.required = true;
    passwordInput.placeholder = '';
}

/**
 * Edit user
 */
function editUser(userId) {
    openUserModal(userId);
}

/**
 * Confirm delete user
 */
function confirmDeleteUser(userId, userName) {
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${userName}"?\n\nPeringatan: Tindakan ini tidak dapat dibatalkan.`)) {
        deleteUserById(userId);
    }
}

/**
 * Delete user by ID
 */
async function deleteUserById(userId) {
    try {
        // Prevent deleting current user
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            showToast('Tidak dapat menghapus pengguna yang sedang login', 'warning');
            return;
        }

        await deleteUser(userId);
        showToast('Pengguna berhasil dihapus', 'success');
        await loadUsers();
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Gagal menghapus pengguna', 'error');
    }
}
