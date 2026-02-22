// Barcode Scanning Module using html5-qrcode library

let html5QrcodeScanner = null;
let isScanning = false;
let onScanCallback = null;

/**
 * Initialize barcode scanner
 * @param {Function} callback - Function to call when barcode is detected
 */
function initBarcodeScanner(callback) {
    onScanCallback = callback;

    // Check camera permission
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera not supported on this device');
        showToast('Kamera tidak didukung pada perangkat ini', 'error');
        return false;
    }

    return true;
}

/**
 * Start barcode scanning
 * @param {string} elementId - ID of the HTML element to render scanner
 */
async function startScanning(elementId = 'barcode-scanner-container') {
    if (isScanning) {
        console.log('Scanner already running');
        return;
    }

    try {
        // Request camera permission
        await navigator.mediaDevices.getUserMedia({ video: true });

        // Initialize scanner
        html5QrcodeScanner = new Html5Qrcode(elementId);

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.QR_CODE
            ]
        };

        await html5QrcodeScanner.start(
            { facingMode: "environment" }, // Use back camera
            config,
            onScanSuccess,
            onScanFailure
        );

        isScanning = true;
        console.log('Barcode scanner started');

    } catch (error) {
        console.error('Error starting scanner:', error);
        showToast('Gagal memulai scanner: ' + error.message, 'error');
        isScanning = false;
    }
}

/**
 * Stop barcode scanning
 */
async function stopScanning() {
    if (!isScanning || !html5QrcodeScanner) {
        return;
    }

    try {
        await html5QrcodeScanner.stop();
        html5QrcodeScanner.clear();
        html5QrcodeScanner = null;
        isScanning = false;
        console.log('Barcode scanner stopped');
    } catch (error) {
        console.error('Error stopping scanner:', error);
    }
}

/**
 * Handle successful barcode scan
 * @param {string} decodedText - The barcode value
 * @param {object} decodedResult - Full scan result
 */
function onScanSuccess(decodedText, decodedResult) {
    console.log(`Barcode detected: ${decodedText}`, decodedResult);

    // Vibrate if supported
    if (navigator.vibrate) {
        navigator.vibrate(200);
    }

    // Play beep sound (optional)
    playBeepSound();

    // Call the callback function
    if (onScanCallback && typeof onScanCallback === 'function') {
        onScanCallback(decodedText, decodedResult);
    }

    // Auto-stop after successful scan
    stopScanning();
}

/**
 * Handle scan failure (not an error, just no barcode detected)
 * @param {string} error - Error message
 */
function onScanFailure(error) {
    // This is called frequently when no barcode is in view
    // Don't log or show errors here
}

/**
 * Play beep sound on successful scan
 */
function playBeepSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        // Silently fail if audio not supported
    }
}

/**
 * Show barcode scanner modal
 */
function showBarcodeScannerModal() {
    const modal = document.getElementById('barcode-scanner-modal');
    if (!modal) {
        createBarcodeScannerModal();
    }

    document.getElementById('barcode-scanner-modal').classList.add('active');
    startScanning('barcode-scanner-container');
}

/**
 * Hide barcode scanner modal
 */
function hideBarcodeScannerModal() {
    stopScanning();
    const modal = document.getElementById('barcode-scanner-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Create barcode scanner modal HTML
 */
function createBarcodeScannerModal() {
    const modalHTML = `
        <div id="barcode-scanner-modal" class="modal">
            <div class="modal-content modal-scanner">
                <div class="modal-header">
                    <h3>Scan Barcode</h3>
                    <button class="modal-close" onclick="hideBarcodeScannerModal()">×</button>
                </div>
                <div class="modal-body">
                    <div id="barcode-scanner-container" class="scanner-container"></div>
                    <div class="scanner-instructions">
                        <p>Arahkan kamera ke barcode produk</p>
                        <p class="scanner-tip">Pastikan barcode terlihat jelas dan dalam fokus</p>
                    </div>
                    <div class="manual-entry">
                        <p>Atau masukkan barcode secara manual:</p>
                        <div class="form-group">
                            <input type="text" id="manual-barcode-input" class="input" placeholder="Masukkan kode barcode">
                            <button class="btn btn-primary" onclick="submitManualBarcode()">Submit</button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="hideBarcodeScannerModal()">Batal</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Submit manually entered barcode
 */
function submitManualBarcode() {
    const input = document.getElementById('manual-barcode-input');
    const barcode = input.value.trim();

    if (!barcode) {
        showToast('Masukkan kode barcode', 'warning');
        return;
    }

    // Call the callback with manual barcode
    if (onScanCallback && typeof onScanCallback === 'function') {
        onScanCallback(barcode, { format: 'MANUAL' });
    }

    input.value = '';
    hideBarcodeScannerModal();
}

/**
 * Lookup product by barcode
 * @param {string} barcode - Barcode to search for
 * @returns {Promise} Promise that resolves with product or null
 */
async function lookupProductByBarcode(barcode) {
    try {
        const product = await getProductByBarcode(barcode);
        return product;
    } catch (error) {
        console.error('Error looking up product:', error);
        return null;
    }
}

/**
 * Generate random barcode for product (EAN-13 format)
 * @returns {string} Generated barcode
 */
function generateBarcode() {
    // Generate 12 random digits
    let barcode = '';
    for (let i = 0; i < 12; i++) {
        barcode += Math.floor(Math.random() * 10);
    }

    // Calculate check digit (EAN-13)
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(barcode[i]);
        sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;

    return barcode + checkDigit;
}

/**
 * Validate barcode format
 * @param {string} barcode - Barcode to validate
 * @returns {boolean} True if valid
 */
function validateBarcode(barcode) {
    if (!barcode || typeof barcode !== 'string') {
        return false;
    }

    // Remove spaces and dashes
    barcode = barcode.replace(/[\s-]/g, '');

    // Check if it's numeric
    if (!/^\d+$/.test(barcode)) {
        return false;
    }

    // Check common barcode lengths
    const validLengths = [8, 12, 13, 14]; // EAN-8, UPC-A, EAN-13, ITF-14
    return validLengths.includes(barcode.length);
}

/**
 * Format barcode for display
 * @param {string} barcode - Barcode to format
 * @returns {string} Formatted barcode
 */
function formatBarcodeDisplay(barcode) {
    if (!barcode) return '';

    // Add spaces for readability based on length
    if (barcode.length === 13) {
        // EAN-13: XXX XXXX XXXX X
        return barcode.replace(/(\d{3})(\d{4})(\d{4})(\d{1})/, '$1 $2 $3 $4');
    } else if (barcode.length === 12) {
        // UPC-A: XXX XXX XXX XXX
        return barcode.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    } else if (barcode.length === 8) {
        // EAN-8: XXXX XXXX
        return barcode.replace(/(\d{4})(\d{4})/, '$1 $2');
    }

    return barcode;
}

// Initialize scanner when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Barcode module loaded');
    });
} else {
    console.log('Barcode module loaded');
}
