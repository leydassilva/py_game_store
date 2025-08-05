# inicio
from flask import Flask, request, jsonify, render_template
import sqlite3
from datetime import datetime
import os
import argparse

app = Flask(__name__)
DATABASE = 'game_store.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with open('database.sql', 'r') as f:
        sql = f.read()
    conn = get_db()
    conn.executescript(sql)
    conn.close()

def get_latest_price(product_id):
    conn = get_db()
    price = conn.execute('SELECT new_price FROM price_history WHERE product_id = ? ORDER BY updated_at DESC LIMIT 1', (product_id,)).fetchone()
    conn.close()
    return price['new_price'] if price else 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/products', methods=['GET', 'POST'])
def manage_products():
    conn = get_db()
    if request.method == 'POST':
        data = request.json
        cursor = conn.execute('''INSERT INTO products (name, type, brand, model, notes, status, image_path, supplier_name)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                            (data['name'], data['type'], data['brand'], data['model'], data['notes'], data['status'], data.get('image_path'), data['supplier_name']))
        product_id = cursor.lastrowid
        if 'cost' in data and 'purchase_date' in data and data['cost']:
            conn.execute('INSERT INTO purchases (product_id, cost, purchase_date) VALUES (?, ?, ?)',
                        (product_id, data['cost'], data['purchase_date']))
            conn.execute('INSERT INTO price_history (product_id, old_price, new_price, reason) VALUES (?, ?, ?, ?)',
                        (product_id, 0, data['cost'], 'Cadastro inicial'))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Produto cadastrado com sucesso'}), 201
    else:
        products = conn.execute('SELECT * FROM products').fetchall()
        products_with_price = []
        for product in products:
            product_dict = dict(product)
            product_dict['current_cost'] = get_latest_price(product['id'])
            products_with_price.append(product_dict)
        conn.close()
        return jsonify(products_with_price)

@app.route('/api/products/<int:product_id>', methods=['PUT', 'DELETE'])
def update_or_delete_product(product_id):
    conn = get_db()
    if request.method == 'PUT':
        data = request.json
        current_cost = get_latest_price(product_id)
        new_cost = float(data.get('cost', current_cost))
        conn.execute('''UPDATE products SET name = ?, type = ?, brand = ?, model = ?, notes = ?, status = ?, image_path = ?, supplier_name = ?
                        WHERE id = ?''',
                    (data['name'], data['type'], data['brand'], data['model'], data['notes'], data['status'], data.get('image_path'), data['supplier_name'], product_id))
        if new_cost != current_cost:
            conn.execute('UPDATE purchases SET cost = ? WHERE product_id = ?', (new_cost, product_id))
            conn.execute('INSERT INTO price_history (product_id, old_price, new_price, reason) VALUES (?, ?, ?, ?)',
                        (product_id, current_cost, new_cost, 'Edição de custo'))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Produto atualizado com sucesso'}), 200
    else:  # DELETE
        conn.execute('DELETE FROM purchases WHERE product_id = ?', (product_id,))
        conn.execute('DELETE FROM maintenances WHERE product_id = ?', (product_id,))
        conn.execute('DELETE FROM sales WHERE product_id = ?', (product_id,))
        conn.execute('DELETE FROM price_history WHERE product_id = ?', (product_id,))
        conn.execute('DELETE FROM products WHERE id = ?', (product_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Produto excluído com sucesso'}), 200

@app.route('/api/purchases', methods=['POST'])
def add_purchase():
    data = request.json
    conn = get_db()
    conn.execute('INSERT INTO purchases (product_id, cost, purchase_date) VALUES (?, ?, ?)',
                (data['product_id'], data['cost'], data['purchase_date']))
    conn.execute('INSERT INTO price_history (product_id, old_price, new_price, reason) VALUES (?, ?, ?, ?)',
                (data['product_id'], 0, data['cost'], 'Cadastro inicial'))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Compra registrada com sucesso'}), 201

@app.route('/api/maintenances', methods=['POST'])
def add_maintenance():
    data = request.json
    conn = get_db()
    current_cost = get_latest_price(data['product_id'])
    new_cost = current_cost + float(data['cost'])
    conn.execute('INSERT INTO maintenances (product_id, service_type, date, cost, notes) VALUES (?, ?, ?, ?, ?)',
                (data['product_id'], data['service_type'], data['date'], data['cost'], data['notes']))
    conn.execute('INSERT INTO price_history (product_id, old_price, new_price, reason) VALUES (?, ?, ?, ?)',
                (data['product_id'], current_cost, new_cost, 'Manutenção'))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Manutenção registrada com sucesso'}), 201

@app.route('/api/maintenances/<int:maintenance_id>', methods=['PUT', 'DELETE'])
def update_or_delete_maintenance(maintenance_id):
    conn = get_db()
    if request.method == 'PUT':
        data = request.json
        maintenance = conn.execute('SELECT product_id, cost FROM maintenances WHERE id = ?', (maintenance_id,)).fetchone()
        if not maintenance:
            conn.close()
            return jsonify({'error': 'Manutenção não encontrada'}), 404
        product_id = maintenance['product_id']
        old_maintenance_cost = float(maintenance['cost'])
        new_maintenance_cost = float(data['cost'])
        conn.execute('''UPDATE maintenances SET service_type = ?, date = ?, cost = ?, notes = ?
                        WHERE id = ?''',
                    (data['service_type'], data['date'], data['cost'], data['notes'], maintenance_id))
        if new_maintenance_cost != old_maintenance_cost:
            current_cost = get_latest_price(product_id)
            new_cost = current_cost - old_maintenance_cost + new_maintenance_cost
            conn.execute('INSERT INTO price_history (product_id, old_price, new_price, reason) VALUES (?, ?, ?, ?)',
                        (product_id, current_cost, new_cost, 'Edição de manutenção'))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Manutenção atualizada com sucesso'}), 200
    else:  # DELETE
        maintenance = conn.execute('SELECT product_id, cost FROM maintenances WHERE id = ?', (maintenance_id,)).fetchone()
        if not maintenance:
            conn.close()
            return jsonify({'error': 'Manutenção não encontrada'}), 404
        product_id = maintenance['product_id']
        maintenance_cost = maintenance['cost']
        current_cost = get_latest_price(product_id)
        new_cost = current_cost - maintenance_cost
        conn.execute('INSERT INTO price_history (product_id, old_price, new_price, reason) VALUES (?, ?, ?, ?)',
                    (product_id, current_cost, new_cost, 'Exclusão de manutenção'))
        conn.execute('DELETE FROM maintenances WHERE id = ?', (maintenance_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Manutenção excluída com sucesso'}), 200

@app.route('/api/maintenances/<int:product_id>', methods=['GET'])
def get_maintenances(product_id):
    conn = get_db()
    maintenances = conn.execute('SELECT id, service_type, date, cost, notes FROM maintenances WHERE product_id = ?', (product_id,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in maintenances])

@app.route('/api/price_history/<int:product_id>', methods=['GET'])
def get_price_history(product_id):
    conn = get_db()
    price_history = conn.execute('SELECT old_price, new_price, updated_at, reason FROM price_history WHERE product_id = ? ORDER BY updated_at DESC', (product_id,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in price_history])

@app.route('/api/sales', methods=['POST'])
def add_sale():
    data = request.json
    conn = get_db()
    conn.execute('INSERT INTO sales (product_id, sale_date, sale_price, payment_method, customer_name) VALUES (?, ?, ?, ?, ?)',
                (data['product_id'], data['sale_date'], data['sale_price'], data['payment_method'], data['customer_name']))
    conn.execute('UPDATE products SET status = ? WHERE id = ?', ('vendido', data['product_id']))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Venda registrada com sucesso'}), 201

@app.route('/api/quote/<int:product_id>', methods=['POST'])
def generate_quote(product_id):
    data = request.json
    margin = float(data['margin'])
    conn = get_db()
    current_cost = get_latest_price(product_id)
    purchase = conn.execute('SELECT purchase_date FROM purchases WHERE product_id = ?', (product_id,)).fetchone()
    purchase_date = purchase['purchase_date'] if purchase else datetime.now().strftime('%Y-%m-%d')
    ipca = float(data.get('ipca', 0))
    months = (datetime.now() - datetime.strptime(purchase_date, '%Y-%m-%d')).days / 30
    adjusted_cost = current_cost * (1 + ipca / 100) ** (months / 12)
    sale_price = adjusted_cost * (1 + margin / 100)
    conn.close()
    return jsonify({'adjusted_cost': round(adjusted_cost, 2), 'sale_price': round(sale_price, 2)})

@app.route('/api/reports/<report_type>')
def generate_report(report_type):
    conn = get_db()
    if report_type == 'stock':
        data = conn.execute("SELECT * FROM products WHERE status = 'em_estoque'").fetchall()
    elif report_type == 'sold':
        data = conn.execute('SELECT p.*, s.sale_date, s.sale_price FROM products p JOIN sales s ON p.id = s.product_id').fetchall()
    elif report_type == 'maintenance':
        data = conn.execute("SELECT * FROM products WHERE status = 'em_manutencao'").fetchall()
    elif report_type == 'profit':
        data = conn.execute('''
            SELECT p.name, s.sale_price, s.sale_date,
                   (SELECT new_price FROM price_history WHERE product_id = p.id ORDER BY updated_at DESC LIMIT 1) as purchase_cost,
                   (SELECT SUM(cost) FROM maintenances WHERE product_id = p.id) as maintenance_cost
            FROM products p JOIN sales s ON p.id = s.product_id
        ''').fetchall()
    conn.close()
    products_with_price = []
    for product in data:
        product_dict = dict(product)
        if report_type != 'profit':
            product_dict['current_cost'] = get_latest_price(product['id'])
        products_with_price.append(product_dict)
    return jsonify(products_with_price)

@app.route('/api/search', methods=['GET'])
def search_products():
    query = request.args.get('query', '')
    search_type = request.args.get('type', '')
    conn = get_db()
    if search_type == 'name':
        products = conn.execute('SELECT * FROM products WHERE name LIKE ?', (f'%{query}%',)).fetchall()
    elif search_type == 'type':
        products = conn.execute('SELECT * FROM products WHERE type LIKE ?', (f'%{query}%',)).fetchall()
    elif search_type == 'status':
        products = conn.execute('SELECT * FROM products WHERE status LIKE ?', (f'%{query}%',)).fetchall()
    else:
        products = conn.execute('SELECT * FROM products').fetchall()
    products_with_price = []
    for product in products:
        product_dict = dict(product)
        product_dict['current_cost'] = get_latest_price(product['id'])
        products_with_price.append(product_dict)
    conn.close()
    return jsonify(products_with_price)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=80, help='Port to run the application on')
    args = parser.parse_args()
    if not os.path.exists(DATABASE):
        init_db()
    app.run(debug=True, host='0.0.0.0', port=args.port)
    #fim