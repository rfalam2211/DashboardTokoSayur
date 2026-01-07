// IndexedDB Database Management

const DB_NAME = 'TokoKuDB';
const DB_VERSION = 1;

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

            // Products store
            if (!db.objectStoreNames.contains('products')) {
                const productsStore = db.createObjectStore('products', { keyPath: 'id' });
                productsStore.createIndex('name', 'name', { unique: false });
                productsStore.createIndex('category', 'category', { unique: false });
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

            console.log('Database setup complete');
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
