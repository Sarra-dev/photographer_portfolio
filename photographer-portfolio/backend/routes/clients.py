from flask import Blueprint, jsonify, request, current_app
import json

clients_bp = Blueprint('clients', __name__)


def get_db():
    return current_app.mysql.connection.cursor()


def serial(obj):
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    return str(obj)


@clients_bp.route('/', methods=['GET'])
def get_clients():
    cur = get_db()
    cur.execute("""
        SELECT c.*,
            COUNT(DISTINCT s.id) AS total_shoots,
            COALESCE(SUM(p.amount), 0) AS total_billed,
            COALESCE(SUM(CASE WHEN p.status='paid' THEN p.amount ELSE 0 END), 0) AS total_paid
        FROM clients c
        LEFT JOIN shootings s ON s.client_id = c.id
        LEFT JOIN payments p ON p.client_id = c.id
        GROUP BY c.id
        ORDER BY c.created_at DESC
    """)
    rows = cur.fetchall()
    return jsonify(json.loads(json.dumps(rows, default=serial)))


@clients_bp.route('/<int:cid>', methods=['GET'])
def get_client(cid):
    cur = get_db()
    cur.execute("SELECT * FROM clients WHERE id = %s", (cid,))
    client = cur.fetchone()
    if not client:
        return jsonify({'error': 'Not found'}), 404

    cur.execute("""
        SELECT s.*, p.amount, p.status AS payment_status
        FROM shootings s
        LEFT JOIN payments p ON p.shooting_id = s.id
        WHERE s.client_id = %s
        ORDER BY s.shoot_date DESC
    """, (cid,))
    shootings = cur.fetchall()

    client['shootings'] = shootings
    return jsonify(json.loads(json.dumps(client, default=serial)))


@clients_bp.route('/', methods=['POST'])
def create_client():
    data = request.json
    cur = get_db()
    cur.execute("""
        INSERT INTO clients (name, email, phone, company, notes)
        VALUES (%s, %s, %s, %s, %s)
    """, (data['name'], data.get('email'), data.get('phone'),
          data.get('company'), data.get('notes')))
    current_app.mysql.connection.commit()
    return jsonify({'id': cur.lastrowid, 'message': 'Client created'}), 201


@clients_bp.route('/<int:cid>', methods=['PUT'])
def update_client(cid):
    data = request.json
    cur = get_db()
    cur.execute("""
        UPDATE clients SET name=%s, email=%s, phone=%s, company=%s, notes=%s
        WHERE id=%s
    """, (data['name'], data.get('email'), data.get('phone'),
          data.get('company'), data.get('notes'), cid))
    current_app.mysql.connection.commit()
    return jsonify({'message': 'Updated'})


@clients_bp.route('/<int:cid>', methods=['DELETE'])
def delete_client(cid):
    cur = get_db()
    cur.execute("DELETE FROM clients WHERE id=%s", (cid,))
    current_app.mysql.connection.commit()
    return jsonify({'message': 'Deleted'})
