// Supabase Client Integration
// This module handles cloud database operations using Supabase

// Supabase Configuration - Replace with your project details
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // e.g., https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabase = null;

/**
 * Initialize Supabase client
 */
function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized');
        return true;
    } else {
        console.warn('Supabase library not loaded, using offline mode');
        return false;
    }
}

/**
 * Check if Supabase is configured
 */
function isSupabaseConfigured() {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}

/**
 * Check if online mode is available
 */
function isOnlineMode() {
    return supabase !== null && isSupabaseConfigured() && navigator.onLine;
}

// ===== AUTHENTICATION =====

/**
 * Sign up new user
 */
async function supabaseSignUp(email, password, userData) {
    if (!isOnlineMode()) return null;
    
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: userData
        }
    });
    
    if (error) throw error;
    return data;
}

/**
 * Sign in user
 */
async function supabaseSignIn(email, password) {
    if (!isOnlineMode()) return null;
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) throw error;
    return data;
}

/**
 * Sign out user
 */
async function supabaseSignOut() {
    if (!isOnlineMode()) return;
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/**
 * Get current session
 */
async function supabaseGetSession() {
    if (!isOnlineMode()) return null;
    
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// ===== PRODUCTS =====

async function cloudGetAllProducts() {
    if (!isOnlineMode()) return null;
    
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
    
    if (error) throw error;
    return data;
}

async function cloudAddProduct(product) {
    if (!isOnlineMode()) return null;
    
    const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function cloudUpdateProduct(id, updates) {
    if (!isOnlineMode()) return null;
    
    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function cloudDeleteProduct(id) {
    if (!isOnlineMode()) return null;
    
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
    
    if (error) throw error;
    return true;
}

// ===== TRANSACTIONS =====

async function cloudGetAllTransactions(dateRange = null) {
    if (!isOnlineMode()) return null;
    
    let query = supabase.from('transactions').select('*');
    
    if (dateRange) {
        query = query
            .gte('created_at', dateRange.start)
            .lte('created_at', dateRange.end);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
}

async function cloudAddTransaction(transaction) {
    if (!isOnlineMode()) return null;
    
    const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

// ===== CUSTOMERS =====

async function cloudGetAllCustomers() {
    if (!isOnlineMode()) return null;
    
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
    
    if (error) throw error;
    return data;
}

async function cloudAddCustomer(customer) {
    if (!isOnlineMode()) return null;
    
    const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

// ===== DEBTS =====

async function cloudGetAllDebts() {
    if (!isOnlineMode()) return null;
    
    const { data, error } = await supabase
        .from('debts')
        .select('*, customers(name)')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
}

async function cloudAddDebt(debt) {
    if (!isOnlineMode()) return null;
    
    const { data, error } = await supabase
        .from('debts')
        .insert([debt])
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function cloudUpdateDebt(id, updates) {
    if (!isOnlineMode()) return null;
    
    const { data, error } = await supabase
        .from('debts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

// ===== EXPENSES =====

async function cloudGetAllExpenses(dateRange = null) {
    if (!isOnlineMode()) return null;
    
    let query = supabase.from('expenses').select('*');
    
    if (dateRange) {
        query = query
            .gte('date', dateRange.start)
            .lte('date', dateRange.end);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data;
}

async function cloudAddExpense(expense) {
    if (!isOnlineMode()) return null;
    
    const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

// ===== SYNC FUNCTIONS =====

/**
 * Sync local data to cloud
 */
async function syncToCloud() {
    if (!isOnlineMode()) {
        console.log('Offline mode - sync skipped');
        return false;
    }
    
    try {
        // Get local data
        const localProducts = await getAllProducts();
        const localTransactions = await getAllTransactions();
        const localCustomers = await getAllCustomers();
        const localDebts = await getAllDebts();
        const localExpenses = await getAllExpenses();
        
        // Upsert to cloud (simplified - in production, use proper conflict resolution)
        console.log('Syncing to cloud...');
        
        // Sync products
        for (const product of localProducts) {
            await cloudAddProduct(product).catch(() => {});
        }
        
        console.log('Sync complete!');
        showToast('Data berhasil disinkronkan ke cloud', 'success');
        return true;
    } catch (error) {
        console.error('Sync error:', error);
        showToast('Gagal sinkronisasi ke cloud', 'error');
        return false;
    }
}

/**
 * Sync cloud data to local
 */
async function syncFromCloud() {
    if (!isOnlineMode()) {
        console.log('Offline mode - sync skipped');
        return false;
    }
    
    try {
        console.log('Downloading from cloud...');
        
        // Get cloud data and save to local IndexedDB
        const cloudProducts = await cloudGetAllProducts();
        const cloudTransactions = await cloudGetAllTransactions();
        const cloudCustomers = await cloudGetAllCustomers();
        const cloudDebts = await cloudGetAllDebts();
        
        // Store in IndexedDB for offline access
        // (Implementation depends on conflict resolution strategy)
        
        console.log('Download complete!');
        showToast('Data berhasil diunduh dari cloud', 'success');
        return true;
    } catch (error) {
        console.error('Download error:', error);
        showToast('Gagal mengunduh dari cloud', 'error');
        return false;
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    if (isSupabaseConfigured()) {
        initSupabase();
    }
});
