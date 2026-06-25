from flask import Blueprint, jsonify, request, current_app
import json

shootings_bp = Blueprint('shootings', __name__)


def get_db():
    return current_app.mysql.connection.cursor()


def serial(obj):
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    return str(obj)


@shootings_bp.route('/', methods=['GET'])
def get_shootings():
    cur = get_db()
    status = request.args.get('status')
    query = """
        SELECT s.*, c.name AS client_name, c.phone AS client_phone,
               p.amount, p.status AS payment_status, p.id AS payment_id
        FROM shootings s
        JOIN clients c ON s.client_id = c.id
        LEFT JOIN payments p ON p.shooting_id = s.id
    """
    if status:
        query += " WHERE s.status = %s"
        cur.execute(query + " ORDER BY s.shoot_date DESC", (status,))
    else:
        cur.execute(query + " ORDER BY s.shoot_date DESC")
    rows = cur.fetchall()
    return jsonify(json.loads(json.dumps(rows, default=serial)))


@shootings_bp.route('/<int:sid>', methods=['GET'])
def get_shooting(sid):
    cur = get_db()
    cur.execute("""
        SELECT s.*, c.name AS client_name, c.email AS client_email,
               p.amount, p.status AS payment_status
        FROM shootings s
        JOIN clients c ON s.client_id = c.id
        LEFT JOIN payments p ON p.shooting_id = s.id
        WHERE s.id = %s
    """, (sid,))
    row = cur.fetchone()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(json.loads(json.dumps(row, default=serial)))


@shootings_bp.route('/', methods=['POST'])
def create_shooting():
    data = request.json
    cur = get_db()
    cur.execute("""
        INSERT INTO shootings (client_id, title, location, shoot_date, shoot_time,
                               duration_hours, status, notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (data['client_id'], data['title'], data.get('location'),
          data['shoot_date'], data.get('shoot_time'), data.get('duration_hours', 2.0),
          data.get('status', 'scheduled'), data.get('notes')))
    current_app.mysql.connection.commit()
    shoot_id = cur.lastrowid

    # Auto-create payment record if amount provided
    if data.get('amount'):
        cur.execute("""
            INSERT INTO payments (shooting_id, client_id, amount, status, due_date, method)
            VALUES (%s, %s, %s, 'pending', %s, %s)
        """, (shoot_id, data['client_id'], data['amount'],
              data.get('due_date'), data.get('payment_method', 'cash')))
        current_app.mysql.connection.commit()

    return jsonify({'id': shoot_id, 'message': 'Shooting created'}), 201


@shootings_bp.route('/<int:sid>', methods=['PUT'])
def update_shooting(sid):
    data = request.json
    cur = get_db()
    cur.execute("""
        UPDATE shootings SET client_id=%s, title=%s, location=%s, shoot_date=%s,
            shoot_time=%s, duration_hours=%s, status=%s, notes=%s
        WHERE id=%s
    """, (data['client_id'], data['title'], data.get('location'),
          data['shoot_date'], data.get('shoot_time'), data.get('duration_hours', 2.0),
          data.get('status', 'scheduled'), data.get('notes'), sid))
    current_app.mysql.connection.commit()
    return jsonify({'message': 'Updated'})


@shootings_bp.route('/<int:sid>', methods=['DELETE'])
def delete_shooting(sid):
    cur = get_db()
    cur.execute("DELETE FROM shootings WHERE id=%s", (sid,))
    current_app.mysql.connection.commit()
    return jsonify({'message': 'Deleted'})
