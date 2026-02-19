// ============================================================
// DATABASE.JS — Supabase Cloud Only
// Inisialisasi Supabase dilakukan di sini langsung.
// Tidak ada `let supabase` agar tidak bentrok dengan CDN.
// ============================================================

const _SUPABASE_URL = 'https://rnpvfhllrmdwgoxpmapr.supabase.co';
const _SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucHZmaGxscm1kd2dveHBtYXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MDk2MDUsImV4cCI6MjA4NDM4NTYwNX0.9-PufKDfndh6GTlvR756_n_92mVOOYuC0r3qbS4n3Nk';

/**
 * initDB() — inisialisasi Supabase client.
 * Dipanggil dari app.js dan login.html.
 */
function initDB() {
    if (!window._supabaseClient) {
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
            window._supabaseClient = window.supabase.createClient(_SUPABASE_URL, _SUPABASE_ANON_KEY);
            console.log('[DB] Supabase client ready ✓');
        } else {
            console.error('[DB] Supabase CDN library not found!');
        }
    }
    return Promise.resolve();
}

// Shorthand — ambil client, throw jika belum siap
function _db() {
    if (!window._supabaseClient) {
        // Coba inisialisasi lagi jika belum
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            window._supabaseClient = window.supabase.createClient(_SUPABASE_URL, _SUPABASE_ANON_KEY);
        } else {
            throw new Error('[DB] Supabase belum siap. Pastikan CDN dimuat sebelum database.js.');
        }
    }
    return window._supabaseClient;
}

// ============================================================
// ===== PRODUCTS =====
// ============================================================

async function addProduct(product) {
    const id = generateId();
    const { data, error } = await _db()
        .from('products')
        .insert([{
            id,
            name: product.name,
            category: product.category || 'lainnya',
            price: parseFloat(product.price),
            stock: parseInt(product.stock),
            barcode: product.barcode || null,
            created_at: new Date().toISOString()
        }])
        .select()
        .single();
    if (error) throw error;
    console.log('[DB] Product added:', data.id);
    return data.id;
}

async function getAllProducts() {
    const { data, error } = await _db()
        .from('products')
        .select('*')
        .order('name');
    if (error) throw error;
    return data.map(p => ({ ...p, createdAt: p.created_at, updatedAt: p.updated_at }));
}

async function getProduct(id) {
    const { data, error } = await _db()
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return { ...data, createdAt: data.created_at, updatedAt: data.updated_at };
}

async function updateProduct(id, updates) {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    delete payload.createdAt; delete payload.updatedAt; delete payload.created_at;
    const { error } = await _db().from('products').update(payload).eq('id', id);
    if (error) throw error;
}

async function deleteProduct(id) {
    const { error } = await _db().from('products').delete().eq('id', id);
    if (error) throw error;
}

async function updateStock(id, quantityChange) {
    const { data: product, error: fetchError } = await _db()
        .from('products').select('stock').eq('id', id).single();
    if (fetchError) throw fetchError;

    const newStock = product.stock + quantityChange;
    if (newStock < 0) throw new Error('Stok tidak mencukupi');

    const { error } = await _db()
        .from('products')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw error;
    return newStock;
}

async function getProductByBarcode(barcode) {
    const { data, error } = await _db()
        .from('products').select('*').eq('barcode', barcode).maybeSingle();
    if (error) throw error;
    return data ? { ...data, createdAt: data.created_at } : null;
}

// ============================================================
// ===== TRANSACTIONS =====
// ============================================================

async function addTransaction(transactionData) {
    const id = generateId();
    const { data, error } = await _db()
        .from('transactions')
        .insert([{
            id,
            created_at: new Date().toISOString(),
            items: transactionData.items,
            subtotal: transactionData.subtotal || 0,
            discount: transactionData.discount || 0,
            total: transactionData.total,
            payment_method: transactionData.paymentMethod,
            customer_name: transactionData.customerName || null
        }])
        .select()
        .single();
    if (error) throw error;
    console.log('[DB] Transaction added:', data.id);
    return data.id;
}

async function getAllTransactions(filter = null) {
    let query = _db().from('transactions').select('*');
    if (filter && filter.from && filter.to) {
        query = query
            .gte('created_at', filter.from.toISOString())
            .lt('created_at', filter.to.toISOString());
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(t => ({
        ...t,
        date: t.created_at,
        paymentMethod: t.payment_method,
        customerName: t.customer_name
    }));
}

async function getTransaction(id) {
    const { data, error } = await _db()
        .from('transactions').select('*').eq('id', id).single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return { ...data, date: data.created_at, paymentMethod: data.payment_method, customerName: data.customer_name };
}

// ============================================================
// ===== EXPENSES =====
// ============================================================

async function addExpense(expense) {
    const id = generateId();
    const { data, error } = await _db()
        .from('expenses')
        .insert([{
            id,
            date: expense.date || new Date().toISOString().split('T')[0],
            description: expense.description || null,
            amount: parseFloat(expense.amount),
            category: expense.category || 'lainnya',
            created_at: new Date().toISOString()
        }])
        .select()
        .single();
    if (error) throw error;
    return data.id;
}

async function getAllExpenses(filter = null) {
    let query = _db().from('expenses').select('*');
    if (filter && filter.from && filter.to) {
        query = query
            .gte('date', filter.from.toISOString().split('T')[0])
            .lt('date', filter.to.toISOString().split('T')[0]);
    }
    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    return data;
}

async function deleteExpense(id) {
    const { error } = await _db().from('expenses').delete().eq('id', id);
    if (error) throw error;
}

// ============================================================
// ===== USERS =====
// ============================================================

async function addUser(user) {
    const id = generateId();
    const { data, error } = await _db()
        .from('users')
        .insert([{
            id,
            username: user.username,
            password: user.password,
            role: user.role || 'kasir',
            name: user.name,
            created_at: new Date().toISOString()
        }])
        .select()
        .single();
    if (error) throw error;
    return data.id;
}

async function getAllUsers() {
    const { data, error } = await _db()
        .from('users').select('*').order('name');
    if (error) throw error;
    return data.map(u => ({ ...u, createdAt: u.created_at }));
}

async function getUserByUsername(username) {
    const { data, error } = await _db()
        .from('users').select('*').eq('username', username).maybeSingle();
    if (error) throw error;
    return data ? { ...data, createdAt: data.created_at } : null;
}

async function getUser(id) {
    const { data, error } = await _db()
        .from('users').select('*').eq('id', id).single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return { ...data, createdAt: data.created_at };
}

async function updateUser(id, updates) {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    delete payload.createdAt; delete payload.updatedAt; delete payload.created_at;
    const { error } = await _db().from('users').update(payload).eq('id', id);
    if (error) throw error;
}

async function deleteUser(id) {
    const { error } = await _db().from('users').delete().eq('id', id);
    if (error) throw error;
}

async function seedDefaultUsers() {
    try {
        const users = await getAllUsers();
        if (users.length === 0) {
            await addUser({ username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' });
            await addUser({ username: 'kasir', password: 'kasir123', role: 'kasir', name: 'Kasir' });
            console.log('[DB] Default users seeded.');
        }
    } catch (error) {
        console.error('[DB] Error seeding users:', error);
    }
}

// ============================================================
// ===== DISCOUNTS =====
// ============================================================

async function addDiscount(discount) {
    const id = generateId();
    const { data, error } = await _db()
        .from('discounts')
        .insert([{
            id,
            name: discount.name,
            type: discount.type || 'percentage',
            value: parseFloat(discount.value),
            applicable_to: discount.applicableTo || 'all',
            product_ids: discount.productIds || [],
            category_ids: discount.categoryIds || [],
            valid_from: discount.validFrom || new Date().toISOString(),
            valid_to: discount.validTo || null,
            active: discount.active !== false,
            created_at: new Date().toISOString()
        }])
        .select()
        .single();
    if (error) throw error;
    return data.id;
}

async function getAllDiscounts() {
    const { data, error } = await _db()
        .from('discounts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(d => ({
        ...d,
        applicableTo: d.applicable_to,
        productIds: d.product_ids || [],
        categoryIds: d.category_ids || [],
        validFrom: d.valid_from,
        validTo: d.valid_to,
        createdAt: d.created_at
    }));
}

async function getActiveDiscounts() {
    const all = await getAllDiscounts();
    const now = new Date();
    return all.filter(d => {
        if (!d.active) return false;
        if (d.validFrom && new Date(d.validFrom) > now) return false;
        if (d.validTo && new Date(d.validTo) < now) return false;
        return true;
    });
}

async function calculateProductDiscount(item, quantity) {
    const discounts = await getActiveDiscounts();
    let best = 0;
    for (const d of discounts) {
        const isForAll = d.applicableTo === 'all';
        const isForProduct = d.applicableTo === 'product' && (d.productIds || []).includes(item.id);
        const isForCat = d.applicableTo === 'category' && (d.categoryIds || []).includes(item.category);
        if (!isForAll && !isForProduct && !isForCat) continue;
        const subtotal = item.price * quantity;
        const amount = d.type === 'percentage' ? (subtotal * d.value / 100) : d.value;
        if (amount > best) best = amount;
    }
    return best;
}

async function updateDiscount(id, updates) {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    if (payload.applicableTo !== undefined) { payload.applicable_to = payload.applicableTo; delete payload.applicableTo; }
    if (payload.productIds !== undefined) { payload.product_ids = payload.productIds; delete payload.productIds; }
    if (payload.categoryIds !== undefined) { payload.category_ids = payload.categoryIds; delete payload.categoryIds; }
    if (payload.validFrom !== undefined) { payload.valid_from = payload.validFrom; delete payload.validFrom; }
    if (payload.validTo !== undefined) { payload.valid_to = payload.validTo; delete payload.validTo; }
    delete payload.createdAt; delete payload.created_at;
    const { error } = await _db().from('discounts').update(payload).eq('id', id);
    if (error) throw error;
}

async function deleteDiscount(id) {
    const { error } = await _db().from('discounts').delete().eq('id', id);
    if (error) throw error;
}

// ============================================================
// ===== CUSTOMERS =====
// ============================================================

async function addCustomer(customer) {
    const id = generateId();
    const { data, error } = await _db()
        .from('customers')
        .insert([{
            id,
            name: customer.name,
            phone: customer.phone || '',
            address: customer.address || '',
            total_debt: 0,
            created_at: new Date().toISOString()
        }])
        .select()
        .single();
    if (error) throw error;
    return data.id;
}

async function getAllCustomers() {
    const { data, error } = await _db()
        .from('customers').select('*').order('name');
    if (error) throw error;
    return data.map(c => ({ ...c, totalDebt: c.total_debt || 0, createdAt: c.created_at }));
}

async function getCustomer(id) {
    const { data, error } = await _db()
        .from('customers').select('*').eq('id', id).single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return { ...data, totalDebt: data.total_debt || 0, createdAt: data.created_at };
}

async function updateCustomer(id, updates) {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    if (payload.totalDebt !== undefined) { payload.total_debt = payload.totalDebt; delete payload.totalDebt; }
    delete payload.createdAt; delete payload.created_at;
    const { error } = await _db().from('customers').update(payload).eq('id', id);
    if (error) throw error;
}

async function deleteCustomer(id) {
    const { error } = await _db().from('customers').delete().eq('id', id);
    if (error) throw error;
}

// ============================================================
// ===== DEBTS =====
// ============================================================

async function addDebt(debt) {
    const id = generateId();
    const amount = parseFloat(debt.amount);
    const { data, error } = await _db()
        .from('debts')
        .insert([{
            id,
            customer_id: debt.customerId || null,
            customer_name: debt.customerName || null,
            transaction_id: debt.transactionId || null,
            amount,
            paid: 0,
            remaining: amount,
            due_date: debt.dueDate || null,
            status: 'pending',
            payments: [],
            notes: debt.notes || '',
            created_at: new Date().toISOString()
        }])
        .select()
        .single();
    if (error) throw error;
    return data.id;
}

async function getAllDebts(filter = null) {
    let query = _db().from('debts').select('*');
    if (filter) query = query.eq('status', filter);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(_mapDebt);
}

async function getDebt(id) {
    const { data, error } = await _db()
        .from('debts').select('*').eq('id', id).single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return _mapDebt(data);
}

async function getDebtsByCustomer(customerId) {
    const { data, error } = await _db()
        .from('debts').select('*').eq('customer_id', customerId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(_mapDebt);
}

function _mapDebt(d) {
    return {
        ...d,
        customerId: d.customer_id || d.customerId,
        customerName: d.customer_name || d.customerName,
        transactionId: d.transaction_id || d.transactionId,
        dueDate: d.due_date || d.dueDate,
        createdAt: d.created_at,
        payments: d.payments || []
    };
}

async function updateDebt(id, updates) {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    if (payload.customerId !== undefined) { payload.customer_id = payload.customerId; delete payload.customerId; }
    if (payload.customerName !== undefined) { payload.customer_name = payload.customerName; delete payload.customerName; }
    if (payload.transactionId !== undefined) { payload.transaction_id = payload.transactionId; delete payload.transactionId; }
    if (payload.dueDate !== undefined) { payload.due_date = payload.dueDate; delete payload.dueDate; }
    delete payload.createdAt; delete payload.created_at;
    const { error } = await _db().from('debts').update(payload).eq('id', id);
    if (error) throw error;
}

async function recordDebtPayment(debtId, payment) {
    const debt = await getDebt(debtId);
    if (!debt) throw new Error('Hutang tidak ditemukan');

    const paymentAmount = parseFloat(payment.amount);
    const newPaid = (debt.paid || 0) + paymentAmount;
    const newRemaining = debt.amount - newPaid;
    let newStatus = newRemaining <= 0 ? 'paid' : (newPaid > 0 ? 'partial' : debt.status);

    const newPayments = [
        ...(debt.payments || []),
        { date: payment.date || new Date().toISOString(), amount: paymentAmount, method: payment.method || 'tunai', notes: payment.notes || '' }
    ];

    const { data, error } = await _db()
        .from('debts')
        .update({ paid: newPaid, remaining: Math.max(0, newRemaining), status: newStatus, payments: newPayments, updated_at: new Date().toISOString() })
        .eq('id', debtId)
        .select()
        .single();
    if (error) throw error;
    return _mapDebt(data);
}

async function updateDebtStatus(id) {
    const debt = await getDebt(id);
    if (!debt || debt.status === 'paid') return;
    if (debt.dueDate && new Date(debt.dueDate) < new Date()) {
        const { error } = await _db()
            .from('debts')
            .update({ status: 'overdue', updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
    }
}

async function deleteDebt(id) {
    const { error } = await _db().from('debts').delete().eq('id', id);
    if (error) throw error;
}
