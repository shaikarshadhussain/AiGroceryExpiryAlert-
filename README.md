# AI Grocery Expiry Alert

AI Grocery Expiry Alert is a smart retail demo project that helps detect whether grocery products are expired, expiring soon, or safe to sell. It combines barcode-based product lookup, expiry-date intelligence, billing support, and an admin dashboard in one simple Flask application.

## Live Demo

Open the project here:

[View Live Website](https://ai-grocery-expiry-alert.vercel.app)

## Project Highlights

- Barcode scanner interface for product lookup
- AI-style expiry status detection
- Billing page with cart flow
- Admin page to manage products
- Dashboard for store insights
- Clean frontend built with HTML, CSS, and JavaScript
- Flask backend with JSON-based product data

## Tech Stack

- Frontend: HTML, CSS, JavaScript, QuaggaJS
- Backend: Python, Flask, Flask-CORS
- Storage: JSON (`products.json`)
- Deployment: Vercel

## Features

### 1. Barcode Scanner
- Scan grocery items using the camera
- Manual barcode input is also supported

### 2. Expiry Detection Logic
- Expired products are flagged clearly
- Products expiring within 3 days show a warning
- Fresh products are marked valid

### 3. Billing System
- Add valid products to cart
- Calculate item totals during billing

### 4. Admin Panel
- Add or update product details
- Manage barcode, name, price, and expiry date

### 5. Dashboard
- View product-related store information in one place

## Live Pages

- Home / Scanner: `https://ai-grocery-expiry-alert.vercel.app/`
- Admin Panel: `https://ai-grocery-expiry-alert.vercel.app/admin`
- Billing: `https://ai-grocery-expiry-alert.vercel.app/billing`
- Dashboard: `https://ai-grocery-expiry-alert.vercel.app/dashboard`

## Local Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the app

```bash
python app.py
```

### 3. Open locally

- Home: `http://127.0.0.1:5000`
- Admin: `http://127.0.0.1:5000/admin`
- Billing: `http://127.0.0.1:5000/billing`
- Dashboard: `http://127.0.0.1:5000/dashboard`

## Expiry Logic

| Condition | Status | Action |
|----------|--------|--------|
| Expiry date is before today | Expired | Block billing and show alert |
| Expiry date is within 3 days | Expiring Soon | Show warning and allow billing |
| Expiry date is after 3 days | Valid | Allow billing |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/product/<barcode>` | Get product details by barcode |
| POST | `/add-product` | Add or update a product |
| GET | `/products` | Get all products |
| GET | `/expired-products` | Get expired products |
| GET | `/expiring-soon` | Get products that are expiring soon |

## Sample Test Barcodes

| Barcode | Product |
|--------|---------|
| 8901234567890 | Milk |
| 8909876543210 | Bread |
| 8901111111111 | Butter |
| 8902222222222 | Cheese |
| 8903333333333 | Yogurt |

## Note

This deployed version runs on Vercel. Product changes made in the live demo may not be permanently saved because Vercel serverless storage is temporary. For permanent storage, the next upgrade would be a real database such as PostgreSQL or MongoDB.

## Author

Shaik Arshad Hussain
