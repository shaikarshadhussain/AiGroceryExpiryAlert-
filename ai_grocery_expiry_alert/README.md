# AI Based Grocery Expiry Alert System using Barcode Scanner

A college DTM project that simulates a grocery store system with AI-based expiry detection.

## Features
- Barcode scanning via camera (QuaggaJS)
- AI expiry alert logic (expired / expiring soon / valid)
- Billing system with cart
- Admin panel for adding products
- Dashboard with store statistics

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript (QuaggaJS)
- **Backend:** Python, Flask
- **Database:** JSON file (`products.json`)

## Setup & Run

### 1. Install dependencies
```bash
pip install flask flask-cors
```

### 2. Run the application
```bash
python app.py
```

### 3. Open in browser
| Page | URL |
|------|-----|
| Home (Scanner) | http://127.0.0.1:5000 |
| Admin Panel | http://127.0.0.1:5000/admin |
| Billing | http://127.0.0.1:5000/billing |
| Dashboard | http://127.0.0.1:5000/dashboard |

## AI Expiry Logic
| Condition | Status | Action |
|-----------|--------|--------|
| Expiry date < Today | Expired | Block billing, show red alert |
| Expiry date within 3 days | Expiring Soon | Show orange warning, allow billing |
| Expiry date > Today + 3 days | Valid | Show green status, allow billing |

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/product/<barcode>` | Get product by barcode |
| POST | `/add-product` | Add new product |
| GET | `/products` | Get all products |
| GET | `/expired-products` | Get expired products |
| GET | `/expiring-soon` | Get products expiring within 3 days |

## Manual Barcode Testing
Since camera permissions vary, you can also type a barcode manually in the input field on the scanner page.

### Sample Barcodes
| Barcode | Product | Status |
|---------|---------|--------|
| 8901234567890 | Milk | Valid |
| 8909876543210 | Bread | Check date |
| 8901111111111 | Butter | Expired |
| 8902222222222 | Cheese | Valid |
| 8903333333333 | Yogurt | Check date |
