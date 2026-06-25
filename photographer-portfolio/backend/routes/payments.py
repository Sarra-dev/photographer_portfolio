from flask import Blueprint, jsonify, request, current_app
from datetime import date
import json

payments_bp = Blueprint('payments', __name__)


def get_db():
    return current_app.mysql.connection.cursor()


def serial(obj):
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    return str(obj)


@payments_bp.route('/', methods=['GET'])
def get_payments():
    cur = get_db()
    status = request.args.get('status')
    query = """
        SELECT p.*, c.name AS client_name, s.title AS shooting_title,
               s.shoot_date
        FROM payments p
        JOIN clients c ON p.client_id = c.id
        JOIN shootings s ON p.shooting_id = s.id
    """
    if status:
        cur.execute(query + " WHERE p.status=%s ORDER BY p.due_date ASC", (status,))
    else:
        cur.execute(query + " ORDER BY p.due_date ASC")
    rows = cur.fetchall()
    return jsonify(json.loads(json.dumps(rows, default=serial)))


@payments_bp.route('/<int:pid>', methods=['PUT'])
def update_payment(pid):
    data = request.json
    cur = get_db()

    # Auto-set paid_date if marking as paid
    paid_date = data.get('paid_date')
    if data.get('status') == 'paid' and not paid_date:
        paid_date = date.today().isoformat()

    cur.execute("""
        UPDATE payments SET amount=%s, status=%s, due_date=%s, paid_date=%s,
            method=%s, notes=%s
        WHERE id=%s
    """, (data['amount'], data['status'], data.get('due_date'),
          paid_date, data.get('method', 'cash'), data.get('notes'), pid))
    current_app.mysql.connection.commit()
    return jsonify({'message': 'Payment updated'})


@payments_bp.route('/<int:pid>/mark-paid', methods=['POST'])
def mark_paid(pid):
    cur = get_db()
    cur.execute("""
        UPDATE payments SET status='paid', paid_date=%s WHERE id=%s
    """, (date.today().isoformat(), pid))
    current_app.mysql.connection.commit()
    return jsonify({'message': 'Marked as paid'})


@payments_bp.route('/', methods=['POST'])
def create_payment():
    data = request.json
    cur = get_db()
    cur.execute("""
        INSERT INTO payments (shooting_id, client_id, amount, status, due_date, method, notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (data['shooting_id'], data['client_id'], data['amount'],
          data.get('status', 'pending'), data.get('due_date'),
          data.get('method', 'cash'), data.get('notes')))
    current_app.mysql.connection.commit()
    return jsonify({'id': cur.lastrowid, 'message': 'Payment created'}), 201
