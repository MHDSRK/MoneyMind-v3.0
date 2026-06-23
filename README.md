# MoneyMind v2.0 - Personal Finance Dashboard

A modern, privacy-first personal finance management application built with React, TypeScript, and Tailwind CSS. Manage accounts, credit cards, loans, and track all transactions with automatic backups and cloud sync.

## 🎯 Features

### Core Finance Management
- **Dashboard (Home Tab):** Overview with net worth, today's totals, and quick transaction entry
- **Today's Transactions:** View all transactions for the current day with income/expense breakdown
- **Accounts Management:** Track bank accounts, cash, business, investments, and other asset types
- **Credit Cards:** Monitor credit card balance, available credit, and statement tracking
- **Loans:** Track loan EMI, outstanding balance, and payment progress
- **Liabilities Overview:** See all debts (loans + credit cards) in one view

### Data Entry & Organization
- **Transaction Logging:** Quick add Money In/Out with date, amount, account, ledger, category, and notes
- **Flexible Categories:** Organize transactions with custom categories
- **Account Types:** Bank, Cash, Business, Investments, Insurance, Lent Money
- **Tags & Notes:** Add context to every transaction

### Data Protection & Backup
- **Automatic Daily Backup:** Enabled by default, backups store locally with 24-hour intervals
- **Manual Backup:** Create snapshots anytime with one click
- **Local Backup Storage:** Up to 10 backups stored in browser (auto-cleanup of oldest)
- **Backup Management:** View, restore, download, or delete any backup
- **Google Drive Sync:** (Optional) Upload backups to Google Drive for cloud protection
- **File Import/Export:** Download backups as JSON files or restore from uploaded files

### Reporting & Export
- **Excel Export:** Export all transactions, accounts, credit cards, and loans to Excel spreadsheet
- **Date Filtering:** Export by Today, This Month, Last 6 Months, All Time, or custom date range
- **Monthly Reports:** Generate XLSX files for financial analysis

### User Experience
- **Dark Theme:** Easy on the eyes with neon accents
- **Mobile Responsive:** Fully functional on smartphones and tablets
- **Fast & Lightweight:** Built with Vite for instant load times
- **Privacy-First:** All data stored locally in browser, never uploaded without permission

---

## 🚀 Quick Start

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/moneymind-v2.0.git
cd moneymind-v2.0

# Install dependencies
pnpm install  # or npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### First Time Setup
1. The app loads with sample data - you can delete it or modify as needed
2. All data is stored locally in your browser (localStorage)
3. Enable auto-backup in Profile Menu → Backup & Restore
4. (Optional) Connect Google Drive for cloud sync

---

## 📋 Data Structure

### Transactions
- Date, Type (Money In/Out), Amount, Category
- From/To Account, Ledger (name), Tags, Notes
- Automatic soft-delete support

### Accounts
- Name, Type, Current Balance
- Types: Cash, Bank, Business, Investments, Insurance, Other

### Credit Cards
- Name, Provider, Credit Limit, Outstanding Balance
- Unbilled transactions tracking for accurate available balance
- Statement & due date tracking

### Loans
- Name, Lender, Principal, Interest Rate
- EMI Amount, Frequency, Payment Progress
- Outstanding balance and next EMI date

### Categories
- Custom categories for Money In and Money Out transactions
- Reusable across all transactions

---

## 🛠️ Technology Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **UI Components:** Radix UI (headless)
- **Icons:** Lucide React
- **Data Format:** JSON (localStorage)
- **Export:** XLSX (Excel)
- **Deployment:** Vercel (recommended)

---

## 💾 Data Backup & Recovery

### Automatic Backup
- Runs daily (configurable toggle)
- No user action required
- Keeps last 10 backups automatically

### Manual Backup
1. Profile Menu → Backup & Restore
2. Click "Backup Now"
3. Backup stored immediately

### Restore from Backup
1. Profile Menu → Backup & Restore → View Backups
2. Click "Restore" on desired backup
3. Confirm replacement
4. All data restored instantly

### Export & Import
- Download backup as JSON file (portable)
- Import previously downloaded backup files
- Keep offline copies for safety

### Google Drive Cloud Sync (Optional)
1. Profile Menu → Google Drive Sync
2. Click "Connect" and authorize Google account
3. Click "Upload Now" to backup to Google Drive
4. View/restore/download from cloud backups
5. Requires setup (see DEPLOYMENT.md)

---

## 📊 Usage Examples

### Adding a Transaction
1. Go to **Home** tab
2. Fill in "Money In" or "Money Out" form:
   - Amount
   - Select Account/Credit Card
   - Ledger/Name (optional)
   - Category
   - (Optional) Notes
3. Click Submit

### Checking Today's Total
1. Go to **Today** tab
2. See income and expense breakdown
3. View all transactions for current day
4. Filter by category if needed

### Exporting Financial Report
1. Profile Menu → Export
2. Select time period (Today/Month/6 Months/Custom)
3. Click Download
4. Opens XLSX file with all data

### Creating Backup
1. Profile Menu → Backup & Restore
2. Click "Backup Now" (or enable auto-backup)
3. Confirm in notification
4. Backup created and stored

---

## 🔐 Privacy & Security

- **No Backend Server:** All data stays in your browser
- **No Cloud Upload (unless you choose):** Data never leaves your device unless manually backed up to Google Drive
- **No Tracking:** No user tracking or analytics
- **Open Source:** Code is transparent and auditable
- **Offline Capable:** Works without internet connection
- **localStorage Only:** Uses browser's built-in storage, no third-party services

---

## 🚦 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📱 Mobile Usage

- Fully responsive design
- Touch-friendly buttons and inputs
- Safe area padding for notch devices
- Optimized for landscape and portrait

---

## 🐛 Known Issues & Limitations

- localStorage limited to ~5-10MB per domain
- Backups only stored locally unless using Google Drive
- No synchronization across devices (cloud sync to come)
- No automatic recurring transactions yet

---

## 📈 Future Roadmap

- [ ] Multi-device sync with authentication
- [ ] Recurring transactions and budgets
- [ ] Investment portfolio tracking
- [ ] Bill reminders and alerts
- [ ] Mobile app (React Native)
- [ ] OCR receipt scanning
- [ ] Shared family accounts

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - feel free to use and modify

---

## 📞 Support

- **Documentation:** See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
- **Development Status:** See [DEV_STATUS.md](DEV_STATUS.md)
- **Issues:** Report bugs via GitHub Issues

---

## 🎉 Version History

### v2.0 (Current)
- ✅ Complete UI/UX redesign
- ✅ Automatic backup system
- ✅ Google Drive sync
- ✅ Excel export
- ✅ Dark theme optimization

### v1.0
- Initial release with basic finance tracking

---

**Made with ❤️ for better personal finance management**