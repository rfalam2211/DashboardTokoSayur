// IndexedDB Database Management

const DB_NAME = 'TokoKuDB';
const DB_VERSION = 4; // Updated for activity logs and permissions

let db = null;

/**
 * Initialize IndexedDB
 * @returns {Promise} Promise that resolves when DB is ready
 */
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Database failed to open');
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('Database opened successfully');
            resolve(db);
        };

        request.onupgradeneeded = (e) => {
            db = e.target.result;
            const oldVersion = e.oldVersion;

            // Products store
            if (!db.objectStoreNames.contains('products')) {
                const productsStore = db.createObjectStore('products', { keyPath: 'id' });
                productsStore.createIndex('name', 'name', { unique: false });
                productsStore.createIndex('category', 'category', { unique: false });
                productsStore.createIndex('barcode', 'barcode', { unique: false });
            } else if (oldVersion < 3) {
                // Add barcode index to existing products store
                const transaction = e.target.transaction;
                const productsStore = transaction.objectStore('products');
                if (!productsStore.indexNames.contains('barcode')) {
                    productsStore.createIndex('barcode', 'barcode', { unique: false });
                }
            }

            // Transactions store
            if (!db.objectStoreNames.contains('transactions')) {
                const transactionsStore = db.createObjectStore('transactions', { keyPath: 'id' });
                transactionsStore.createIndex('date', 'date', { unique: false });
                transactionsStore.createIndex('paymentMethod', 'paymentMethod', { unique: false });
            }

            // Expenses store
            if (!db.objectStoreNames.contains('expenses')) {
                const expensesStore = db.createObjectStore('expenses', { keyPath: 'id' });
                expensesStore.createIndex('date', 'date', { unique: false });
                expensesStore.createIndex('category', 'category', { unique: false });
            }

            // Users store
            if (!db.objectStoreNames.contains('users')) {
                const usersStore = db.createObjectStore('users', { keyPath: 'id' });
                usersStore.createIndex('username', 'username', { unique: true });
                usersStore.createIndex('role', 'role', { unique: false });
            }

            // Discounts store (NEW)
            if (!db.objectStoreNames.contains('discounts')) {
                const discountsStore = db.createObjectStore('discounts', { keyPath: 'id' });
                discountsStore.createIndex('active', 'active', { unique: false });
                discountsStore.createIndex('type', 'type', { unique: false });
                discountsStore.createIndex('validFrom', 'validFrom', { unique: false });
                discountsStore.createIndex('validTo', 'validTo', { unique: false });
            }

            // Customers store (NEW)
            if (!db.objectStoreNames.contains('customers')) {
                const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
                customersStore.createIndex('name', 'name', { unique: false });
                customersStore.createIndex('phone', 'phone', { unique: false });
            }

            // Debts store (NEW)
            if (!db.objectStoreNames.contains('debts')) {
                const debtsStore = db.createObjectStore('debts', { keyPath: 'id' });
                debtsStore.createIndex('customerId', 'customerId', { unique: false });
                debtsStore.createIndex('status', 'status', { unique: false });
                debtsStore.createIndex('dueDate', 'dueDate', { unique: false });
                debtsStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Activity Logs store (NEW - Version 4)
            if (!db.objectStoreNames.contains('activityLogs')) {
                const logsStore = db.createObjectStore('activityLogs', { keyPath: 'id' });
                logsStore.createIndex('userId', 'userId', { unique: false });
                logsStore.createIndex('module', 'module', { unique: false });
                logsStore.createIndex('action', 'action', { unique: false });
                logsStore.createIndex('timestamp', 'timestamp', { unique: false });
            }

            console.log('Database setup complete - Version', DB_VERSION);
        };
    });
}

// ===== PRODUCTS CRUD =====

/**
 * Add a new product
 * @param {Object} product - Product object
 * @returns {Promise} Promise that resolves with the product ID
 */
function addProduct(product) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['products'], 'readwrite');
        const store = transaction.objectStore('products');

        const productData = {
            id: generateId(),
            name: product.name,
            category: product.category,
            price: parseFloat(product.price),
            stock: parseInt(product.stock),
            createdAt: new Date().toISOString()
        };

        const request = store.add(productData);

        request.onsuccess = () => resolve(productData.id);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all products
 * @returns {Promise} Promise that resolves with array of products
 */
function getAllProducts() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['products'], 'readonly');
        const store = transaction.objectStore('products');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get product by ID
 * @param {string} id - Product ID
 * @returns {Promise} Promise that resolves with product object
 */
function getProduct(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['products'], 'readonly');
        const store = transaction.objectStore('products');
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Update product
 * @param {string} id - Product ID
 * @param {Object} updates - Object with fields to update
 * @returns {Promise} Promise that resolves when update is complete
 */
function updateProduct(id, updates) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['products'], 'readwrite');
        const store = transaction.objectStore('products');

        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const product = getRequest.result;

            if (!product) {
                reject(new Error('Product not found'));
                return;
            }

            // Update fields
            Object.keys(updates).forEach(key => {
                if (key === 'price' || key === 'stock') {
                    product[key] = parseFloat(updates[key]);
                } else {
                    product[key] = updates[key];
                }
            });

            product.updatedAt = new Date().toISOString();

            const updateRequest = store.put(product);
            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = () => reject(updateRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
}

/**
 * Delete product
 * @param {string} id - Product ID
 * @returns {Promise} Promise that resolves when deletion is complete
 */
function deleteProduct(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['products'], 'readwrite');
        const store = transaction.objectStore('products');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Update product stock
 * @param {string} id - Product ID
 * @param {number} quantity - Quantity to add (negative to subtract)
 * @returns {Promise} Promise that resolves when update is complete
 */
function updateStock(id, quantity) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['products'], 'readwrite');
        const store = transaction.objectStore('products');

        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const product = getRequest.result;

            if (!product) {
                reject(new Error('Product not found'));
                return;
            }

            product.stock += quantity;

            if (product.stock < 0) {
                reject(new Error('Insufficient stock'));
                return;
            }

            const updateRequest = store.put(product);
            updateRequest.onsuccess = () => resolve(product.stock);
            updateRequest.onerror = () => reject(updateRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
}

// ===== TRANSACTIONS CRUD =====

/**
 * Add a new transaction
 * @param {Object} transaction - Transaction object
 * @returns {Promise} Promise that resolves with the transaction ID
 */
function addTransaction(transactionData) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transactions'], 'readwrite');
        const store = transaction.objectStore('transactions');

        const data = {
            id: generateId(),
            date: new Date().toISOString(),
            items: transactionData.items,
            total: transactionData.total,
            paymentMethod: transactionData.paymentMethod
        };

        const request = store.add(data);

        request.onsuccess = () => resolve(data.id);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all transactions
 * @param {Object} filter - Optional filter object with from/to dates
 * @returns {Promise} Promise that resolves with array of transactions
 */
function getAllTransactions(filter = null) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transactions'], 'readonly');
        const store = transaction.objectStore('transactions');
        const request = store.getAll();

        request.onsuccess = () => {
            let transactions = request.result;

            // Apply date filter if provided
            if (filter && filter.from && filter.to) {
                transactions = transactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate >= filter.from && tDate < filter.to;
                });
            }

            // Sort by date descending
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            resolve(transactions);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get transaction by ID
 * @param {string} id - Transaction ID
 * @returns {Promise} Promise that resolves with transaction object
 */
function getTransaction(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transactions'], 'readonly');
        const store = transaction.objectStore('transactions');
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ===== EXPENSES CRUD =====

/**
 * Add a new expense
 * @param {Object} expense - Expense object
 * @returns {Promise} Promise that resolves with the expense ID
 */
function addExpense(expense) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['expenses'], 'readwrite');
        const store = transaction.objectStore('expenses');

        const data = {
            id: generateId(),
            date: expense.date || new Date().toISOString(),
            description: expense.description,
            amount: parseFloat(expense.amount),
            category: expense.category
        };

        const request = store.add(data);

        request.onsuccess = () => resolve(data.id);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all expenses
 * @param {Object} filter - Optional filter object with from/to dates
 * @returns {Promise} Promise that resolves with array of expenses
 */
function getAllExpenses(filter = null) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['expenses'], 'readonly');
        const store = transaction.objectStore('expenses');
        const request = store.getAll();

        request.onsuccess = () => {
            let expenses = request.result;

            // Apply date filter if provided
            if (filter && filter.from && filter.to) {
                expenses = expenses.filter(e => {
                    const eDate = new Date(e.date);
                    return eDate >= filter.from && eDate < filter.to;
                });
            }

            resolve(expenses);
        };
        request.onerror = () => reject(request.error);
    });
}

// ===== USERS CRUD =====

/**
 * Add a new user
 * @param {Object} user - User object
 * @returns {Promise} Promise that resolves with the user ID
 */
function addUser(user) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');

        const userData = {
            id: generateId(),
            username: user.username,
            password: user.password, // In production, this should be hashed
            role: user.role, // 'admin' or 'kasir'
            name: user.name,
            createdAt: new Date().toISOString()
        };

        const request = store.add(userData);

        request.onsuccess = () => resolve(userData.id);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get user by username
 * @param {string} username - Username
 * @returns {Promise} Promise that resolves with user object
 */
function getUserByUsername(username) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const index = store.index('username');
        const request = index.get(username);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all users
 * @returns {Promise} Promise that resolves with array of users
 */
function getAllUsers() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Update user
 * @param {string} id - User ID
 * @param {Object} updates - Object with fields to update
 * @returns {Promise} Promise that resolves when update is complete
 */
function updateUser(id, updates) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');

        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const user = getRequest.result;

            if (!user) {
                reject(new Error('User not found'));
                return;
            }

            // Update fields
            Object.keys(updates).forEach(key => {
                user[key] = updates[key];
            });

            user.updatedAt = new Date().toISOString();

            const updateRequest = store.put(user);
            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = () => reject(updateRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
}

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {Promise} Promise that resolves when deletion is complete
 */
function deleteUser(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Seed default users (admin and kasir)
 * @returns {Promise} Promise that resolves when seeding is complete
 */
async function seedDefaultUsers() {
    try {
        const users = await getAllUsers();

        // Only seed if no users exist
        if (users.length === 0) {
            await addUser({
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                name: 'Administrator'
            });

            await addUser({
                username: 'kasir',
                password: 'kasir123',
                role: 'kasir',
                name: 'Kasir'
            });

            console.log('Default users seeded successfully');
        }
    } catch (error) {
        console.error('Error seeding default users:', error);
    }
}

// ===== DISCOUNTS CRUD =====

/**
 * Add a new discount
 * @param {Object} discount - Discount object
 * @returns {Promise} Promise that resolves with the discount ID
 */
function addDiscount(discount) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['discounts'], 'readwrite');
        const store = transaction.objectStore('discounts');

        const discountData = {
            id: generateId(),
            name: discount.name,
            type: discount.type, // 'percentage' or 'fixed'
            value: parseFloat(discount.value),
            applicableTo: discount.applicableTo || 'all', // 'all', 'product', 'category'
            productIds: discount.productIds || [],
            categoryIds: discount.categoryIds || [],
            validFrom: discount.validFrom || new Date().toISOString(),
            validTo: discount.validTo || null,
            active: discount.active !== false,
            createdAt: new Date().toISOString()
        };

        const request = store.add(discountData);

        request.onsuccess = () => resolve(discountData.id);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all discounts
 * @returns {Promise} Promise that resolves with array of discounts
 */
function getAllDiscounts() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['discounts'], 'readonly');
        const store = transaction.objectStore('discounts');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get active discounts
 * @returns {Promise} Promise that resolves with array of active discounts
 */
function getActiveDiscounts() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['discounts'], 'readonly');
        const store = transaction.objectStore('discounts');
        const request = store.getAll();

        request.onsuccess = () => {
            const now = new Date();
            const activeDiscounts = request.result.filter(d => {
                if (!d.active) return false;
                if (d.validFrom && new Date(d.validFrom) > now) return false;
                if (d.validTo && new Date(d.validTo) < now) return false;
                return true;
            });
            resolve(activeDiscounts);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Update discount
 * @param {string} id - Discount ID
 * @param {Object} updates - Object with fields to update
 * @returns {Promise} Promise that resolves when update is complete
 */
function updateDiscount(id, updates) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['discounts'], 'readwrite');
        const store = transaction.objectStore('discounts');

        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const discount = getRequest.result;

            if (!discount) {
                reject(new Error('Discount not found'));
                return;
            }

            Object.keys(updates).forEach(key => {
                if (key === 'value') {
                    discount[key] = parseFloat(updates[key]);
                } else {
                    discount[key] = updates[key];
                }
            });

            discount.updatedAt = new Date().toISOString();

            const updateRequest = store.put(discount);
            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = () => reject(updateRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
}

/**
 * Delete discount
 * @param {string} id - Discount ID
 * @returns {Promise} Promise that resolves when deletion is complete
 */
function deleteDiscount(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['discounts'], 'readwrite');
        const store = transaction.objectStore('discounts');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ===== CUSTOMERS CRUD =====

/**
 * Add a new customer
 * @param {Object} customer - Customer object
 * @returns {Promise} Promise that resolves with the customer ID
 */
function addCustomer(customer) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['customers'], 'readwrite');
        const store = transaction.objectStore('customers');

        const customerData = {
            id: generateId(),
            name: customer.name,
            phone: customer.phone || '',
            address: customer.address || '',
            totalDebt: 0,
            createdAt: new Date().toISOString()
        };

        const request = store.add(customerData);

        request.onsuccess = () => resolve(customerData.id);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all customers
 * @returns {Promise} Promise that resolves with array of customers
 */
function getAllCustomers() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['customers'], 'readonly');
        const store = transaction.objectStore('customers');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get customer by ID
 * @param {string} id - Customer ID
 * @returns {Promise} Promise that resolves with customer object
 */
function getCustomer(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['customers'], 'readonly');
        const store = transaction.objectStore('customers');
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Update customer
 * @param {string} id - Customer ID
 * @param {Object} updates - Object with fields to update
 * @returns {Promise} Promise that resolves when update is complete
 */
function updateCustomer(id, updates) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['customers'], 'readwrite');
        const store = transaction.objectStore('customers');

        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const customer = getRequest.result;

            if (!customer) {
                reject(new Error('Customer not found'));
                return;
            }

            Object.keys(updates).forEach(key => {
                customer[key] = updates[key];
            });

            customer.updatedAt = new Date().toISOString();

            const updateRequest = store.put(customer);
            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = () => reject(updateRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
}

/**
 * Delete customer
 * @param {string} id - Customer ID
 * @returns {Promise} Promise that resolves when deletion is complete
 */
function deleteCustomer(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['customers'], 'readwrite');
        const store = transaction.objectStore('customers');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ===== DEBTS CRUD =====

/**
 * Add a new debt
 * @param {Object} debt - Debt object
 * @returns {Promise} Promise that resolves with the debt ID
 */
function addDebt(debt) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['debts'], 'readwrite');
        const store = transaction.objectStore('debts');

        const debtData = {
            id: generateId(),
            customerId: debt.customerId,
            customerName: debt.customerName,
            transactionId: debt.transactionId || null,
            amount: parseFloat(debt.amount),
            paid: 0,
            remaining: parseFloat(debt.amount),
            dueDate: debt.dueDate || null,
            status: 'pending',
            payments: [],
            notes: debt.notes || '',
            createdAt: new Date().toISOString()
        };

        const request = store.add(debtData);

        request.onsuccess = () => resolve(debtData.id);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all debts
 * @param {string} filter - Optional filter: 'pending', 'partial', 'paid', 'overdue'
 * @returns {Promise} Promise that resolves with array of debts
 */
function getAllDebts(filter = null) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['debts'], 'readonly');
        const store = transaction.objectStore('debts');
        const request = store.getAll();

        request.onsuccess = () => {
            let debts = request.result;

            if (filter) {
                debts = debts.filter(d => d.status === filter);
            }

            // Sort by created date descending
            debts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            resolve(debts);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get debts by customer ID
 * @param {string} customerId - Customer ID
 * @returns {Promise} Promise that resolves with array of debts
 */
function getDebtsByCustomer(customerId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['debts'], 'readonly');
        const store = transaction.objectStore('debts');
        const index = store.index('customerId');
        const request = index.getAll(customerId);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get debt by ID
 * @param {string} id - Debt ID
 * @returns {Promise} Promise that resolves with debt object
 */
function getDebt(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['debts'], 'readonly');
        const store = transaction.objectStore('debts');
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Record payment for a debt
 * @param {string} debtId - Debt ID
 * @param {Object} payment - Payment object {amount, method, date}
 * @returns {Promise} Promise that resolves when payment is recorded
 */
function recordDebtPayment(debtId, payment) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['debts'], 'readwrite');
        const store = transaction.objectStore('debts');

        const getRequest = store.get(debtId);

        getRequest.onsuccess = () => {
            const debt = getRequest.result;

            if (!debt) {
                reject(new Error('Debt not found'));
                return;
            }

            const paymentAmount = parseFloat(payment.amount);
            debt.paid += paymentAmount;
            debt.remaining = debt.amount - debt.paid;

            // Update status
            if (debt.remaining <= 0) {
                debt.status = 'paid';
                debt.remaining = 0;
            } else if (debt.paid > 0) {
                debt.status = 'partial';
            }

            // Add payment record
            debt.payments.push({
                date: payment.date || new Date().toISOString(),
                amount: paymentAmount,
                method: payment.method || 'tunai'
            });

            debt.updatedAt = new Date().toISOString();

            const updateRequest = store.put(debt);
            updateRequest.onsuccess = () => resolve(debt);
            updateRequest.onerror = () => reject(updateRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
}

/**
 * Update debt status (check for overdue)
 * @param {string} id - Debt ID
 * @returns {Promise} Promise that resolves when update is complete
 */
function updateDebtStatus(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['debts'], 'readwrite');
        const store = transaction.objectStore('debts');

        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const debt = getRequest.result;

            if (!debt) {
                reject(new Error('Debt not found'));
                return;
            }

            // Check if overdue
            if (debt.status !== 'paid' && debt.dueDate) {
                const now = new Date();
                const dueDate = new Date(debt.dueDate);
                if (dueDate < now) {
                    debt.status = 'overdue';
                }
            }

            const updateRequest = store.put(debt);
            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = () => reject(updateRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
}

/**
 * Delete debt
 * @param {string} id - Debt ID
 * @returns {Promise} Promise that resolves when deletion is complete
 */
function deleteDebt(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['debts'], 'readwrite');
        const store = transaction.objectStore('debts');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ===== BARCODE FUNCTIONS =====

/**
 * Get product by barcode
 * @param {string} barcode - Barcode string
 * @returns {Promise} Promise that resolves with product object
 */
function getProductByBarcode(barcode) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['products'], 'readonly');
        const store = transaction.objectStore('products');
        const index = store.index('barcode');
        const request = index.get(barcode);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

