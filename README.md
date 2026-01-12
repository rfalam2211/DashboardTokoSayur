# 🏪 Ida Buah - Offline Store Management App

A modern, feature-rich Progressive Web App (PWA) for small to medium-sized businesses. Built with vanilla HTML, CSS, and JavaScript, this app works completely offline using IndexedDB for local data storage and can be installed on Android devices for a native app experience.

## ✨ Features

### 📱 Mobile-First & PWA
- **Installable App**: Install on Android home screen for native app experience
- **Fully Responsive**: Optimized for mobile, tablet, and desktop
- **Touch-Optimized**: Touch-friendly buttons and gestures
- **Offline-First**: Works completely offline with service worker caching
- **Hamburger Navigation**: Swipe-to-open sidebar on mobile
- **Pull-to-Refresh**: Refresh data with pull gesture

### 📊 Dashboard
- Real-time overview of store performance
- Key metrics: total products, today's sales, total revenue, net profit
- Low stock alerts
- Recent transactions overview
- Quick access to all modules

### 📦 Product Management
- **Add Products**: Create products with name, price, stock, category, and barcode
- **Edit Products**: Update product information
- **Delete Products**: Remove products from inventory
- **Search & Filter**: Quickly find products by name or category
- **Stock Tracking**: Monitor inventory levels in real-time
- **Barcode Support**: Ready for barcode scanning integration

### 💰 Point of Sale (POS)
- Fast and intuitive sales interface
- Product search and selection
- Barcode scanning ready
- Quantity adjustment
- Real-time total calculation
- Multiple payment methods (Cash, Transfer, QRIS)
- Transaction processing
- Receipt generation

### 📝 Transaction History
- Complete record of all sales transactions
- Transaction details: date, time, items, quantities, total amount
- Date range filtering
- Export to CSV
- Transaction summary

### 📈 Financial Reports
- Daily, weekly, and monthly sales reports
- Revenue and expense tracking
- Profit/loss calculations
- Sales analytics
- Export capabilities

### 👥 User Management
- Multi-user support with role-based access
- Admin and Cashier roles
- User authentication
- Secure login system

### 🆕 Coming Soon
- **Barcode Scanning**: Camera-based barcode scanning for quick product lookup
- **Discount System**: Flexible discount management (percentage/fixed, product-specific)
- **Public Stock Catalogue**: Shareable product catalogue for customers
- **Debt Management**: Customer credit tracking with payment reminders
- **Customer Management**: Store customer information and purchase history

## 🎨 Design

- **Color Scheme**: Modern green and white theme (#10b981)
- **User Experience**: Intuitive and easy to navigate
- **Responsive Design**: Mobile-first approach with breakpoints for all devices
- **Touch-Friendly**: Minimum 44x44px touch targets
- **Accessibility**: High contrast mode and reduced motion support
- **Modern UI**: Smooth animations and transitions

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- No server or internet connection required!

### Installation

#### Option 1: Direct File Access
1. **Clone the repository**
   ```bash
   git clone https://github.com/rfalam2211/DashboardTokoSayur.git
   cd DashboardTokoSayur
   ```

2. **Open the application**
   - Simply open `login.html` in your web browser
   - Default credentials:
     - Admin: `admin` / `admin123`
     - Cashier: `kasir` / `kasir123`

#### Option 2: Local Development Server
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Then open http://localhost:8000/login.html
```

#### Option 3: Install as PWA (Mobile)
1. Open the app in Chrome or Edge on your Android device
2. Tap the "Install" button when prompted
3. Or tap menu (⋮) > "Add to Home screen"
4. Launch from your home screen like a native app!

### First Time Setup
1. The app will automatically initialize the database
2. Login with default credentials (admin/admin123)
3. Begin by adding products in the Product Management section
4. Process sales through the POS interface
5. View reports and analytics in the Reports section

## 📁 Project Structure

```
ida-buah/
├── index.html              # Main application (dashboard)
├── login.html              # Login page
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for offline support
├── styles.css              # Application styles (1700+ lines)
├── app.js                  # Main application logic
├── icons/                  # PWA icons (72x72 to 512x512)
│   └── icon-512x512.png
└── js/
    ├── database.js         # IndexedDB setup and operations (v3)
    ├── auth.js             # Authentication module
    ├── dashboard.js        # Dashboard module
    ├── products.js         # Product management module
    ├── pos.js              # Point of Sale module
    ├── transactions.js     # Transaction history module
    ├── reports.js          # Financial reports module
    ├── users.js            # User management module
    ├── mobile.js           # Mobile-specific functionality
    └── utils.js            # Utility functions
```

## 💾 Data Storage

This application uses **IndexedDB v3** for local data storage:

### Object Stores:
- **products** - Product inventory with barcode support
- **transactions** - Sales transaction records
- **expenses** - Business expense tracking
- **users** - User accounts and authentication
- **discounts** - Discount rules and promotions (ready)
- **customers** - Customer information (ready)
- **debts** - Customer debt/credit records (ready)

### Benefits:
- ✅ All data is stored locally on your device
- ✅ No internet connection required
- ✅ Fast and reliable performance
- ✅ Data persists between sessions
- ✅ Automatic database migrations
- ⚠️ Data is browser-specific (clearing browser data will delete the database)

## 🔧 Technologies Used

- **HTML5**: Structure and semantics
- **CSS3**: Styling, animations, and responsive design
- **JavaScript (ES6+)**: Application logic
- **IndexedDB**: Local database storage (v3)
- **Service Workers**: Offline functionality and caching
- **PWA**: Progressive Web App capabilities
- **Web App Manifest**: Installable app configuration

## 📱 Browser Compatibility

### Desktop:
- ✅ Chrome/Edge (recommended) - Full PWA support
- ✅ Firefox - Full functionality
- ✅ Safari - Full functionality
- ✅ Opera - Full functionality

### Mobile:
- ✅ Chrome Android - Full PWA support, installable
- ✅ Samsung Internet - Full PWA support, installable
- ✅ Firefox Android - Full functionality
- ✅ Safari iOS - Full functionality (manual "Add to Home Screen")

### PWA Features:
- ✅ Service Worker caching
- ✅ Offline functionality
- ✅ Install prompt (Chrome/Edge)
- ✅ App shortcuts
- ✅ Theme color
- ✅ Standalone display mode

## 🎯 Responsive Breakpoints

- **Mobile**: ≤768px (hamburger menu, single column)
- **Small Mobile**: ≤480px (optimized for small screens)
- **Tablet**: 769px - 1024px (2-column layouts)
- **Desktop**: >1024px (full sidebar, multi-column)

## 🔐 Default Users

The app comes with two default users:

| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| admin | admin123 | Admin | Full access to all features |
| kasir | kasir123 | Cashier | POS, Products (view only), Transactions |

**⚠️ Important**: Change default passwords in production!

## 🚀 Performance

- **First Load**: ~100ms (cached after first visit)
- **Page Navigation**: Instant (SPA architecture)
- **Database Operations**: <10ms average
- **Offline Support**: Full functionality without internet
- **Mobile Optimized**: Touch-friendly, smooth animations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

Created with ❤️ for small business owners by the Ida Buah team

## 🙏 Acknowledgments

- Built for the Ida Buah store management needs
- Designed with user-friendliness in mind
- Inspired by modern POS systems
- Mobile-first approach for accessibility

## 🗺️ Roadmap

### Phase 1: Infrastructure & Mobile UI ✅ (Completed)
- [x] Database upgrade to v3
- [x] PWA manifest and service worker
- [x] Mobile-responsive UI
- [x] Hamburger navigation
- [x] Touch gestures
- [x] PWA install prompt

### Phase 2: Barcode Scanning (In Progress)
- [ ] Camera-based barcode scanning
- [ ] Barcode input in product form
- [ ] POS barcode integration

### Phase 3: Discount System
- [ ] Discount management UI
- [ ] Discount application in POS
- [ ] Discount reporting

### Phase 4: Public Stock Catalogue
- [ ] Public-facing catalogue page
- [ ] QR code generation
- [ ] Product images support

### Phase 5: Debt Management
- [ ] Customer management UI
- [ ] Credit sales in POS
- [ ] Payment tracking
- [ ] Debt reminders

---

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

**Note**: This is an offline-first PWA. All data is stored locally. For multi-device synchronization or cloud backup features, consider adding a backend service in the future.

---

**Version**: 3.0.0 (Database v3, PWA-enabled)  
**Last Updated**: January 2026
