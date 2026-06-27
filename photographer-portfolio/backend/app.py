from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

from flask_mysqldb import MySQL

# Load environment variables
load_dotenv()

app = Flask(__name__)

# =========================
# CORS CONFIGURATION
# =========================

# =========================
# CORS CONFIGURATION
# =========================

CORS(
    app,
    origins=[
        "http://localhost:5173",
        "https://photographer-portfolio-y95c.vercel.app",
    ],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"]
)

# =========================
# MYSQL CONFIGURATION
# =========================

app.config['MYSQL_HOST'] = os.getenv(
    'MYSQL_HOST',
    'localhost'
)


app.config['MYSQL_PORT'] = int(
    os.getenv('MYSQL_PORT', 17081)
)

app.config['MYSQL_USER'] = os.getenv(
    'MYSQL_USER',
    'root'
)

app.config['MYSQL_PASSWORD'] = os.getenv(
    'MYSQL_PASSWORD',
    ''
)

app.config['MYSQL_DB'] = os.getenv(
    'MYSQL_DB',
    'photographer_db'
)

app.config['MYSQL_CURSORCLASS'] = 'DictCursor'


mysql = MySQL(app)


# Make mysql accessible in routes
app.mysql = mysql



# =========================
# ROUTES / BLUEPRINTS
# =========================

from routes.dashboard import dashboard_bp
from routes.clients import clients_bp
from routes.shootings import shootings_bp
from routes.payments import payments_bp
from routes.appointments import appointments_bp


app.register_blueprint(
    dashboard_bp,
    url_prefix='/api/dashboard'
)

app.register_blueprint(
    clients_bp,
    url_prefix='/api/clients'
)

app.register_blueprint(
    shootings_bp,
    url_prefix='/api/shootings'
)

app.register_blueprint(
    payments_bp,
    url_prefix='/api/payments'
)

app.register_blueprint(
    appointments_bp,
    url_prefix='/api/appointments'
)



# =========================
# HEALTH CHECK
# =========================

@app.route("/")
def index():
    return {
        "status": "ok",
        "message": "Photographer API running"
    }



# =========================
# LOCAL RUN ONLY
# =========================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        debug=False
    )