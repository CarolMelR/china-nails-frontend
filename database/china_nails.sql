CREATE DATABASE IF NOT EXISTS china_nails
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE china_nails;

CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  role ENUM('admin', 'client') NOT NULL DEFAULT 'client',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_active (role, is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS services (
  service_code VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL,
  price DECIMAL(10, 2) UNSIGNED NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (service_code),
  CONSTRAINT chk_services_duration CHECK (duration_minutes > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointments (
  appointment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  client_id BIGINT UNSIGNED NOT NULL,
  service_code VARCHAR(40) NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL,
  price_at_booking DECIMAL(10, 2) UNSIGNED NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled')
    NOT NULL DEFAULT 'pending',
  notes VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (appointment_id),
  CONSTRAINT fk_appointments_client
    FOREIGN KEY (client_id) REFERENCES users (user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_appointments_service
    FOREIGN KEY (service_code) REFERENCES services (service_code)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_appointments_duration CHECK (duration_minutes > 0),
  CONSTRAINT chk_appointments_price CHECK (price_at_booking >= 0),
  KEY idx_appointments_schedule (appointment_date, start_time, status),
  KEY idx_appointments_client_date (client_id, appointment_date),
  KEY idx_appointments_service (service_code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(20) NOT NULL,
  description VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (version, description)
VALUES ('001', 'Core users, services, and appointments')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO services
  (service_code, name, description, duration_minutes, price)
VALUES
  ('acrilico', 'Aplicación Acrílico (Clásico)', 'Aplicación clásica de acrílico.', 90, 350.00),
  ('retoque', 'Retoque Acrílico', 'Retoque de aplicación acrílica.', 60, 250.00),
  ('gelish', 'Gelish en uña natural', 'Aplicación de gelish en uña natural.', 40, 150.00),
  ('spa', 'Manicura Spa', 'Manicura y cuidado spa.', 45, 200.00)
ON DUPLICATE KEY UPDATE service_code = VALUES(service_code);
