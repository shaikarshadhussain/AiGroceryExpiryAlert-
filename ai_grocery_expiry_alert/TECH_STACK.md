# ð AI Grocery Expiry Alert â Tech Stack & Tools Explanation

This document explains every technology, library, and tool used in the
**AI Grocery Expiry Alert** project, organised by layer: Frontend, Backend, and Database.

---

## ð Project Architecture Overview

```
âââââââââââââââââââââââââââââââââââââââââââââââ
â              BROWSER (Client)               â
â  HTML5 + CSS3 + Vanilla JS + QuaggaJS       â
â  Fetch API ââââââââââââââââââââââââââââââââ â
âââââââââââââââââââââââ¬ââââââââââââââââââââââââ
                      â  HTTP / REST API
âââââââââââââââââââââââ¼ââââââââââââââââââââââââ
â              BACKEND (Server)               â
â       Python  Â·  Flask  Â·  Flask-CORS       â
âââââââââââââââââââââââ¬ââââââââââââââââââââââââ
                      â  Read / Write
âââââââââââââââââââââââ¼ââââââââââââââââââââââââ
â              DATABASE (Storage)             â
â          products.json  (flat file)         â
âââââââââââââââââââââââââââââââââââââââââââââââ
```

---

## ð¨ FRONTEND

The frontend is entirely **plain / vanilla** â no heavyweight framework (no React,
Vue, or Angular). It is built with the three core web technologies.

### 1. HTML5
| Detail | Info |
|--------|------|
| **What it is** | The markup language that structures every page |
| **How it is used** | Four Jinja2 template files rendered by Flask |
| **Template files** | `index.html`, `admin.html`, `billing.html`, `dashboard.html` |
| **Special features used** | Semantic elements, `<form>`, `<table>`, `<nav>`, `<code>`, viewport meta tag |

The templates are served with **Jinja2** â Flask's built-in template engine.
`{{ url_for('static', filename='...') }}` is a Jinja2 expression that generates
the correct static-file path automatically.

---

### 2. CSS3
| Detail | Info |
|--------|------|
| **What it is** | Stylesheet language for visual design |
| **File** | `static/style.css` (â 12 KB) |
| **Features used** | CSS Custom Properties (`--red`, `--green`, `--orange`), Flexbox, CSS Grid, media queries, keyframe animations (`@keyframes`), transitions |

Key UI components styled entirely with custom CSS (no Bootstrap or Tailwind):
- `.card` â white rounded panels
- `.badge`, `.badge-valid`, `.badge-expiring`, `.badge-expired` â colour-coded status labels
- `.alert`, `.alert-error`, `.alert-warning`, `.alert-success` â notification banners
- `.scanner-viewport`, `.scan-frame`, `.scan-line` â animated camera overlay
- `#toast` â slide-up notification toast
- `.stats-grid`, `.stat-card` â dashboard summary tiles

---

### 3. Vanilla JavaScript (ES6+)
| Detail | Info |
|--------|------|
| **What it is** | Native browser scripting language, no external JS framework |
| **Files** | `static/scanner.js`, `static/billing.js`, `static/admin.js` |
| **Key ES6+ features** | `async/await`, arrow functions, template literals, destructuring, spread operator (`...`), `const`/`let` |

#### Responsibilities per file

| File | Responsibility |
|------|---------------|
| `scanner.js` | Camera scanner control, barcode lookup, cart management, AI expiry logic (client-side mirror) |
| `billing.js` | Cart rendering, quantity changes, bill generation, print |
| `admin.js` | Product list table, add / edit product form, REST calls |
| `dashboard.html` (inline) | Parallel data fetching, stat cards, AI alert banners |

#### Browser Web APIs used
| API | Where | Purpose |
|-----|-------|---------|
| **Fetch API** | All JS files | `fetch('/product/...')` â calls Flask REST endpoints asynchronously |
| **sessionStorage** | `scanner.js`, `billing.js` | Persists the shopping cart between Scanner â Billing pages without a backend session |
| **MediaDevices / getUserMedia** | `scanner.js` via QuaggaJS | Accesses the device camera for live barcode scanning |
| **window.print()** | `billing.js` | Prints the generated bill receipt directly from the browser |
| **Promise.all()** | `dashboard.html` | Fetches `/products`, `/expired-products`, `/expiring-soon` in parallel |

---

### 4. QuaggaJS  *(External JS Library)*
| Detail | Info |
|--------|------|
| **What it is** | An open-source, in-browser barcode-scanner library |
| **Version** | `0.12.1` |
| **Loaded via** | CDN â `https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js` |
| **Used in** | `index.html` + `scanner.js` |

**How QuaggaJS works in this project:**

1. `Quagga.init({ inputStream: { type: 'LiveStream', ... }, decoder: { readers: [...] } })` â
   opens the rear camera (`facingMode: 'environment'`) and starts the video stream inside
   `#scanner-viewport`.
2. `Quagga.start()` â begins frame-by-frame barcode detection.
3. `Quagga.onDetected(result => { ... })` â fires a callback every time a barcode is
   successfully read; the decoded string is passed to `fetchProduct(code)`.
4. `Quagga.stop()` â shuts the camera down when the user clicks "Stop Camera" or leaves
   the page (`beforeunload` event).

**Barcode formats supported:**
`EAN-13`, `EAN-8`, `Code-128`, `Code-39`, `UPC-A`, `UPC-E`

---

## âï¸ BACKEND

### 5. Python 3
| Detail | Info |
|--------|------|
| **What it is** | The server-side programming language |
| **Main file** | `app.py` |
| **Standard library modules used** | `json`, `os`, `datetime`, `timedelta` |

#### Key Python logic

- **`datetime` / `timedelta`** â calculates the difference between today's date and the
  product's expiry date to determine the status:
  - `expired` â expiry date is **before** today
  - `expiring_soon` â expiry date is within **3 days** from today
  - `valid` â more than 3 days remaining

---

### 6. Flask  *(Python Web Framework)*
| Detail | Info |
|--------|------|
| **What it is** | A lightweight WSGI micro web-framework for Python |
| **Install** | `pip install flask` (listed in `requirements.txt`) |
| **Version constraint** | Latest stable (no pinned version) |

Flask handles two roles in this project:

**A. Page Serving (Template Routes)**

| Route | Function | Template |
|-------|----------|----------|
| `GET /` | `index()` | `index.html` |
| `GET /admin` | `admin()` | `admin.html` |
| `GET /billing` | `billing()` | `billing.html` |
| `GET /dashboard` | `dashboard()` | `dashboard.html` |

**B. REST API Endpoints**

| Route | Method | Description |
|-------|--------|-------------|
| `/product/<barcode>` | GET | Fetch a single product by barcode + compute status |
| `/add-product` | POST | Add a new product or update an existing one (JSON body) |
| `/products` | GET | Return all products with computed status |
| `/expired-products` | GET | Return only expired products |
| `/expiring-soon` | GET | Return only products expiring within 3 days |

All API responses are **JSON** (`flask.jsonify`).
The `request.get_json()` method parses the JSON body sent by the admin form.

---

### 7. Flask-CORS  *(Flask Extension)*
| Detail | Info |
|--------|------|
| **What it is** | Adds Cross-Origin Resource Sharing (CORS) headers to Flask responses |
| **Install** | `pip install flask-cors` (listed in `requirements.txt`) |
| **Usage** | `CORS(app)` on line 8 of `app.py` â enables all origins for all routes |
| **Why it is needed** | Allows browser JavaScript (potentially served from a different port or domain) to call the Flask API without being blocked by the browser's same-origin policy |

---

### 8. Jinja2  *(Templating Engine â bundled with Flask)*
| Detail | Info |
|--------|------|
| **What it is** | A fast Python templating engine included with Flask |
| **No separate install needed** | Ships as a Flask dependency |
| **Used for** | Rendering HTML templates with `render_template('index.html')` |
| **Expressions used** | `{{ url_for('static', filename='style.css') }}` generates hashed-safe static URLs |

---

## ðï¸ DATABASE

### 9. JSON Flat File (`products.json`)
| Detail | Info |
|--------|------|
| **What it is** | A plain JSON array stored on disk as the application's data store |
| **Location** | `ai_grocery_expiry_alert/products.json` |
| **Why not SQLite / PostgreSQL?** | Project is intentionally lightweight; no ORM or SQL engine required |

**Product record structure:**
```json
{
  "barcode": "8901234567890",
  "name":    "Milk",
  "price":   50,
  "expiry":  "2026-03-15"
}
```

**How it is accessed in Python:**

| Function | Description |
|----------|-------------|
| `load_products()` | Opens `products.json`, parses it with `json.load()`, returns a list |
| `save_products(products)` | Serialises the list with `json.dump(..., indent=2)` and writes back to disk |

> â ï¸ **Limitation:** Because the file is read/written on every request, this
> approach is suitable for a single-user demo only.  For production, replace with
> SQLite (`sqlite3`) or a proper database (PostgreSQL, MySQL, MongoDB).

---

## ð§° TOOLS SUMMARY TABLE

| # | Tool / Technology | Category | Version | Purpose |
|---|-------------------|----------|---------|---------|
| 1 | **Python 3** | Language | 3.x | Server-side logic |
| 2 | **Flask** | Backend Framework | Latest | Web server, routing, template rendering |
| 3 | **Flask-CORS** | Flask Extension | Latest | Allow cross-origin API requests |
| 4 | **Jinja2** | Template Engine | (with Flask) | Render HTML templates server-side |
| 5 | **HTML5** | Markup | 5 | Page structure |
| 6 | **CSS3** | Styling | 3 | Custom responsive UI without any CSS framework |
| 7 | **Vanilla JavaScript** | Scripting | ES6+ | Client logic, API calls, cart, billing |
| 8 | **QuaggaJS** | JS Library (CDN) | 0.12.1 | Real-time barcode scanning via webcam |
| 9 | **Fetch API** | Browser API | Native | Async HTTP requests to Flask REST API |
| 10 | **sessionStorage** | Browser API | Native | Temporary cart storage across pages |
| 11 | **MediaDevices API** | Browser API | Native | Camera access for barcode scanning |
| 12 | **window.print()** | Browser API | Native | Print billing receipt |
| 13 | **JSON flat file** | Database | â | Persistent product data storage |
| 14 | **Python `json` module** | Std Library | Built-in | Read/write JSON database file |
| 15 | **Python `datetime` module** | Std Library | Built-in | Expiry date calculation & status logic |
| 16 | **Python `os` module** | Std Library | Built-in | Resolve database file path portably |

---

## ð File-to-Technology Mapping

```
ai_grocery_expiry_alert/
â
âââ app.py                  â Python Â· Flask Â· flask-cors Â· datetime Â· json Â· os
âââ products.json           â JSON Database
âââ requirements.txt        â Package list: flask, flask-cors
â
âââ static/
â   âââ style.css           â CSS3 (Flexbox, Grid, animations, variables)
â   âââ scanner.js          â Vanilla JS Â· QuaggaJS Â· Fetch API Â· sessionStorage
â   âââ billing.js          â Vanilla JS Â· sessionStorage Â· window.print()
â   âââ admin.js            â Vanilla JS Â· Fetch API
â
âââ templates/              â Jinja2 templates
    âââ index.html          â HTML5 Â· QuaggaJS CDN Â· scanner.js
    âââ admin.html          â HTML5 Â· admin.js
    âââ billing.html        â HTML5 Â· billing.js
    âââ dashboard.html      â HTML5 Â· inline JS Â· Fetch API Â· Promise.all()
```

---

## ð How to Run

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Start the Flask development server
python app.py

# 3. Open in browser
#    http://127.0.0.1:5000
```

> The Flask dev server (`debug=True`) auto-reloads on code changes and is
> suitable for local development only.  For production, use **Gunicorn** or
> **uWSGI** behind an **Nginx** reverse proxy.
