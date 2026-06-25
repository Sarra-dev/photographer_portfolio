from flask import Blueprint, jsonify, current_app
from datetime import date

dashboard_bp = Blueprint('dashboard', __name__)


def get_db():
    return current_app.mysql.connection.cursor()


@dashboard_bp.route('/', methods=['GET'])
def get_dashboard():
    cur = get_db()
    today = date.today().isoformat()

    # --- KPI: Revenue summary ---
    cur.execute("""
        SELECT
            COALESCE(SUM(amount), 0) AS total_revenue,
            COALESCE(SUM(CASE WHEN status='paid' THEN amount ELSE 0 END), 0) AS collected,
            COALESCE(SUM(CASE WHEN status IN ('pending','partial','overdue') THEN amount ELSE 0 END), 0) AS outstanding
        FROM payments
    """)
    revenue = cur.fetchone()

    # --- KPI: Shooting counts ---
    cur.execute("""
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status='scheduled' THEN 1 ELSE 0 END) AS upcoming,
            SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS cancelled
        FROM shootings
    """)
    shoots = cur.fetchone()

    # --- KPI: Client count ---
    cur.execute("SELECT COUNT(*) AS total FROM clients")
    clients = cur.fetchone()

    # --- Upcoming shootings (next 30 days) ---
    cur.execute("""
        SELECT s.id, s.title, s.shoot_date, s.shoot_time, s.location, s.status,
               c.name AS client_name
        FROM shootings s
        JOIN clients c ON s.client_id = c.id
        WHERE s.shoot_date >= %s AND s.status = 'scheduled'
        ORDER BY s.shoot_date ASC
        LIMIT 5
    """, (today,))
    upcoming_shoots = cur.fetchall()

    # --- Unpaid payments ---
    cur.execute("""
        SELECT p.id, p.amount, p.status, p.due_date, p.currency,
               c.name AS client_name, s.title AS shooting_title
        FROM payments p
        JOIN clients c ON p.client_id = c.id
        JOIN shootings s ON p.shooting_id = s.id
        WHERE p.status IN ('pending', 'partial', 'overdue')
        ORDER BY p.due_date ASC
        LIMIT 6
    """)
    unpaid = cur.fetchall()

    # --- Today's appointments ---
    cur.execute("""
        SELECT a.id, a.title, a.appointment_time, a.type, a.status,
               c.name AS client_name
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
        WHERE a.appointment_date = %s
        ORDER BY a.appointment_time ASC
    """, (today,))
    today_appointments = cur.fetchall()

    # --- Payment status breakdown (for chart) ---
    cur.execute("""
        SELECT status, COUNT(*) AS count, SUM(amount) AS total
        FROM payments
        GROUP BY status
    """)
    payment_breakdown = cur.fetchall()

    # Serialize dates
    def serial(obj):
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        return str(obj)

    import json
    raw = {
        'revenue': revenue,
        'shoots': shoots,
        'clients': clients,
        'upcoming_shoots': upcoming_shoots,
        'unpaid_payments': unpaid,
        'today_appointments': today_appointments,
        'payment_breakdown': payment_breakdown,
    }
    return jsonify(json.loads(json.dumps(raw, default=serial)))
