from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import json
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

DB_FILE = os.path.join(os.path.dirname(__file__), 'products.json')


def load_products():
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, 'w') as f:
            json.dump([], f)
    with open(DB_FILE, 'r') as f:
        return json.load(f)


def save_products(products):
    with open(DB_FILE, 'w') as f:
        json.dump(products, f, indent=2)


def get_expiry_status(expiry_str):
    today = datetime.now().date()
    try:
        expiry_date = datetime.strptime(expiry_str, '%Y-%m-%d').date()
    except ValueError:
        return 'unknown'
    if expiry_date < today:
        return 'expired'
    elif expiry_date <= today + timedelta(days=3):
        return 'expiring_soon'
    else:
        return 'valid'


# ─── Pages ────────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/admin')
def admin():
    return render_template('admin.html')


@app.route('/billing')
def billing():
    return render_template('billing.html')


@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')


# ─── APIs ─────────────────────────────────────────────────────────────────────

@app.route('/product/<barcode>', methods=['GET'])
def get_product(barcode):
    products = load_products()
    product = next((p for p in products if p['barcode'] == barcode), None)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    status = get_expiry_status(product['expiry'])
    return jsonify({**product, 'status': status})


@app.route('/add-product', methods=['POST'])
def add_product():
    data = request.get_json()
    required = ['barcode', 'name', 'price', 'expiry']
    if not all(k in data for k in required):
        return jsonify({'error': 'Missing fields'}), 400
    products = load_products()
    # Update if exists
    for i, p in enumerate(products):
        if p['barcode'] == data['barcode']:
            products[i] = data
            save_products(products)
            return jsonify({'message': 'Product updated', 'product': data})
    products.append(data)
    save_products(products)
    return jsonify({'message': 'Product added', 'product': data}), 201


@app.route('/products', methods=['GET'])
def get_all_products():
    products = load_products()
    result = [{**p, 'status': get_expiry_status(p['expiry'])} for p in products]
    return jsonify(result)


@app.route('/expired-products', methods=['GET'])
def get_expired():
    products = load_products()
    expired = [p for p in products if get_expiry_status(p['expiry']) == 'expired']
    return jsonify(expired)


@app.route('/expiring-soon', methods=['GET'])
def get_expiring_soon():
    products = load_products()
    soon = [p for p in products if get_expiry_status(p['expiry']) == 'expiring_soon']
    return jsonify(soon)


if __name__ == '__main__':
    app.run(debug=True)
