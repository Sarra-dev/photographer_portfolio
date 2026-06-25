from flask import Blueprint, jsonify, request, current_app
import json

appointments_bp = Blueprint('appointments', __name__)


def get_db():
    return current_app.mysql.connection.cursor()


def serial(obj):
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    return str(obj)


@appointments_bp.route('/', methods=['GET'])
def get_appointments():
    cur = get_db()
    month = request.args.get('month')  # YYYY-MM format
    query = """
        SELECT a.*, c.name AS client_name
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
    """
    if month:
        cur.execute(query + " WHERE DATE_FORMAT(a.appointment_date, '%%Y-%%m') = %s ORDER BY a.appointment_date, a.appointment_time", (month,))
    else:
        cur.execute(query + " ORDER BY a.appointment_date DESC, a.appointment_time")
    rows = cur.fetchall()
    return jsonify(json.loads(json.dumps(rows, default=serial)))


@appointments_bp.route('/calendar', methods=['GET'])
def get_calendar():
    """Returns all shootings + appointments for a given month for the calendar view."""
    cur = get_db()
    month = request.args.get('month')  # YYYY-MM

    cur.execute("""
        SELECT s.id, s.title, s.shoot_date AS event_date, s.shoot_time AS event_time,
               s.status, s.location, c.name AS client_name, 'shooting' AS event_type
        FROM shootings s
        JOIN clients c ON s.client_id = c.id
        WHERE DATE_FORMAT(s.shoot_date, '%%Y-%%m') = %s
    """, (month,))
    shoots = cur.fetchall()

    cur.execute("""
        SELECT a.id, a.title, a.appointment_date AS event_date, a.appointment_time AS event_time,
               a.status, '' AS location, COALESCE(c.name, '') AS client_name, 'appointment' AS event_type
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
        WHERE DATE_FORMAT(a.appointment_date, '%%Y-%%m') = %s
    """, (month,))
    appts = cur.fetchall()

    combined = shoots + appts
    return jsonify(json.loads(json.dumps(combined, default=serial)))


@appointments_bp.route('/', methods=['POST'])
def create_appointment():
    data = request.json
    cur = get_db()
    cur.execute("""
        INSERT INTO appointments (client_id, title, appointment_date, appointment_time,
                                  duration_minutes, type, status, notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (data.get('client_id'), data['title'], data['appointment_date'],
          data.get('appointment_time'), data.get('duration_minutes', 60),
          data.get('type', 'meeting'), data.get('status', 'scheduled'),
          data.get('notes')))
    current_app.mysql.connection.commit()
    return jsonify({'id': cur.lastrowid, 'message': 'Appointment created'}), 201


@appointments_bp.route('/<int:aid>', methods=['PUT'])
def update_appointment(aid):
    data = request.json
    cur = get_db()
    cur.execute("""
        UPDATE appointments SET client_id=%s, title=%s, appointment_date=%s,
            appointment_time=%s, duration_minutes=%s, type=%s, status=%s, notes=%s
        WHERE id=%s
    """, (data.get('client_id'), data['title'], data['appointment_date'],
          data.get('appointment_time'), data.get('duration_minutes', 60),
          data.get('type', 'meeting'), data.get('status', 'scheduled'),
          data.get('notes'), aid))
    current_app.mysql.connection.commit()
    return jsonify({'message': 'Updated'})


@appointments_bp.route('/<int:aid>', methods=['DELETE'])
def delete_appointment(aid):
    cur = get_db()
    cur.execute("DELETE FROM appointments WHERE id=%s", (aid,))
    current_app.mysql.connection.commit()
    return jsonify({'message': 'Deleted'})
