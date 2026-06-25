-- ============================================================
-- Photographer Portfolio & Business Management
-- Database: photographer_db
-- Run this in phpMyAdmin (Laragon) or MySQL CLI
-- ============================================================

CREATE DATABASE IF NOT EXISTS photographer_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE photographer_db;

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(30),
    company VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SHOOTINGS (sessions photo)
-- ============================================================
CREATE TABLE IF NOT EXISTS shootings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    location VARCHAR(200),
    shoot_date DATE NOT NULL,
    shoot_time TIME,
    duration_hours DECIMAL(4,1) DEFAULT 2.0,
    status ENUM('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shooting_id INT NOT NULL,
    client_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'TND',
    status ENUM('pending','partial','paid','overdue') DEFAULT 'pending',
    due_date DATE,
    paid_date DATE,
    method ENUM('cash','bank_transfer','card','cheque','other') DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shooting_id) REFERENCES shootings(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ============================================================
-- APPOINTMENTS / RENDEZ-VOUS (meetings, not shoots)
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT,
    title VARCHAR(200) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME,
    duration_minutes INT DEFAULT 60,
    type ENUM('meeting','call','delivery','revision','other') DEFAULT 'meeting',
    status ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- ============================================================
-- SEED DATA (sample records)
-- ============================================================
INSERT INTO clients (name, email, phone, company, notes) VALUES
('Aziz Benaissa', 'aziz@restaurant-levant.tn', '+216 22 345 678', 'Restaurant Le Levant', 'Beach restaurant in Hammamet. Needs monthly shoots.'),
('Sonia Mhenni', 'sonia@laperle.tn', '+216 55 987 654', 'La Perle Bleue', 'High-end seafood. Prefers golden hour shots.'),
('Karim Tlili', 'karim@sunsetgrill.tn', '+216 98 112 233', 'Sunset Grill Sousse', 'New client. First shoot this month.');

INSERT INTO shootings (client_id, title, location, shoot_date, shoot_time, duration_hours, status, notes) VALUES
(1, 'Menu Photography - Summer 2025', 'Hammamet Beach', '2025-07-10', '17:00:00', 3.0, 'completed', 'Cocktails and seafood platter shots.'),
(2, 'Interior & Ambiance Shoot', 'La Marsa, Tunis', '2025-07-18', '18:30:00', 2.5, 'scheduled', 'Focus on candlelight table settings.'),
(3, 'Grand Opening Coverage', 'Sousse Marina', '2025-07-25', '19:00:00', 4.0, 'scheduled', 'Full event coverage + food photography.');

INSERT INTO payments (shooting_id, client_id, amount, status, due_date, paid_date, method) VALUES
(1, 1, 850.00, 'paid', '2025-07-15', '2025-07-12', 'bank_transfer'),
(2, 2, 650.00, 'pending', '2025-07-22', NULL, 'cash'),
(3, 3, 1200.00, 'partial', '2025-07-28', NULL, 'bank_transfer');

INSERT INTO appointments (client_id, title, appointment_date, appointment_time, duration_minutes, type, status) VALUES
(2, 'Pre-shoot briefing call', '2025-07-16', '10:00:00', 30, 'call', 'scheduled'),
(3, 'Contract signing & deposit', '2025-07-20', '14:00:00', 60, 'meeting', 'scheduled'),
(1, 'Photo delivery & review', '2025-07-14', '11:00:00', 45, 'delivery', 'completed');
