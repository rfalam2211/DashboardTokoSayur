# 🏪 Ida Buah - Offline Store Management App

A modern, user-friendly offline store management application designed for small to medium-sized businesses. Built with vanilla HTML, CSS, and JavaScript, this app works completely offline using IndexedDB for local data storage.

## ✨ Features

### 📊 Dashboard
- Real-time overview of store performance
- Key metrics: total products, today's sales, total revenue
- Quick access to all modules

### 📦 Product Management
- **Add Products**: Create new products with name, price, stock quantity, and category
- **Edit Products**: Update product information
- **Delete Products**: Remove products from inventory
- **Search & Filter**: Quickly find products by name or category
- **Stock Tracking**: Monitor inventory levels in real-time

### 💰 Point of Sale (POS)
- Fast and intuitive sales interface
- Product search and selection
- Quantity adjustment
- Real-time total calculation
- Transaction processing
- Receipt generation

### 📝 Transaction History
- Complete record of all sales transactions
- Transaction details: date, time, items, quantities, total amount
- Search and filter capabilities
- Transaction summary

### 📈 Financial Reports
- Daily, weekly, and monthly sales reports
- Revenue tracking
- Sales analytics
- Export capabilities

## 🎨 Design

- **Color Scheme**: Clean white and green theme
- **User Experience**: Intuitive and easy to navigate
- **Responsive**: Works on various screen sizes
- **Offline-First**: No internet connection required

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- No server or internet connection required!

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ida-buah.git
   cd ida-buah
   ```

2. **Open the application**
   - Simply open `index.html` in your web browser
   - Or use a local development server:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js (http-server)
     npx http-server
     ```

3. **Start using the app**
   - The app will automatically initialize the database
   - Begin by adding products in the Product Management section
   - Process sales through the POS interface
   - View reports and analytics in the Reports section

## 📁 Project Structure

```
ida-buah/
├── index.html              # Main application entry point
├── styles.css              # Application styles
├── js/
│   ├── database.js         # IndexedDB setup and operations
│   ├── products.js         # Product management module
│   ├── pos.js              # Point of Sale module
│   ├── transactions.js     # Transaction history module
│   ├── reports.js          # Financial reports module
│   └── utils.js            # Utility functions
└── README.md               # This file
```

## 💾 Data Storage

This application uses **IndexedDB** for local data storage, which means:
- ✅ All data is stored locally on your device
- ✅ No internet connection required
- ✅ Fast and reliable performance
- ✅ Data persists between sessions
- ⚠️ Data is browser-specific (clearing browser data will delete the database)

## 🔧 Technologies Used

- **HTML5**: Structure and semantics
- **CSS3**: Styling and layout
- **JavaScript (ES6+)**: Application logic
- **IndexedDB**: Local database storage

## 📱 Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

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

Created with ❤️ for small business owners

## 🙏 Acknowledgments

- Built for the Ida Buah store management needs
- Designed with user-friendliness in mind
- Inspired by modern POS systems

---

**Note**: This is an offline-first application. For multi-device synchronization or cloud backup features, consider adding a backend service in the future.
