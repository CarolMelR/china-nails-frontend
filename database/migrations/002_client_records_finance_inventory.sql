USE china_nails;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(20) NOT NULL,
  description VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS client_profiles (
  client_id BIGINT UNSIGNED NOT NULL,
  nail_type VARCHAR(80) NULL,
  preferred_shape VARCHAR(80) NULL,
  preferred_length VARCHAR(80) NULL,
  general_notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id),
  CONSTRAINT fk_client_profiles_user
    FOREIGN KEY (client_id) REFERENCES users (user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO client_profiles (client_id)
SELECT user_id FROM users WHERE role = 'client';

CREATE TABLE IF NOT EXISTS allergy_catalog (
  allergy_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (allergy_id),
  UNIQUE KEY uq_allergy_catalog_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS client_allergies (
  client_id BIGINT UNSIGNED NOT NULL,
  allergy_id SMALLINT UNSIGNED NOT NULL,
  severity ENUM('mild', 'moderate', 'severe', 'unknown')
    NOT NULL DEFAULT 'unknown',
  reaction_notes VARCHAR(1000) NULL,
  recorded_by BIGINT UNSIGNED NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id, allergy_id),
  CONSTRAINT fk_client_allergies_profile
    FOREIGN KEY (client_id) REFERENCES client_profiles (client_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_client_allergies_allergy
    FOREIGN KEY (allergy_id) REFERENCES allergy_catalog (allergy_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_client_allergies_recorder
    FOREIGN KEY (recorded_by) REFERENCES users (user_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  KEY idx_client_allergies_allergy (allergy_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nail_color_catalog (
  color_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  hex_code CHAR(7) NULL,
  color_family VARCHAR(60) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (color_id),
  UNIQUE KEY uq_nail_colors_name (name),
  CONSTRAINT chk_nail_colors_hex
    CHECK (hex_code IS NULL OR hex_code REGEXP '^#[0-9A-Fa-f]{6}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS decoration_catalog (
  decoration_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (decoration_id),
  UNIQUE KEY uq_decorations_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appointment_colors (
  appointment_id BIGINT UNSIGNED NOT NULL,
  position SMALLINT UNSIGNED NOT NULL,
  color_id INT UNSIGNED NOT NULL,
  placement_notes VARCHAR(500) NULL,
  PRIMARY KEY (appointment_id, position),
  CONSTRAINT fk_appointment_colors_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_appointment_colors_color
    FOREIGN KEY (color_id) REFERENCES nail_color_catalog (color_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  KEY idx_appointment_colors_color (color_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appointment_decorations (
  appointment_id BIGINT UNSIGNED NOT NULL,
  position SMALLINT UNSIGNED NOT NULL,
  decoration_id INT UNSIGNED NOT NULL,
  placement_notes VARCHAR(500) NULL,
  PRIMARY KEY (appointment_id, position),
  CONSTRAINT fk_appointment_decorations_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_appointment_decorations_catalog
    FOREIGN KEY (decoration_id) REFERENCES decoration_catalog (decoration_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  KEY idx_appointment_decorations_catalog (decoration_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_methods (
  payment_method_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(60) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (payment_method_id),
  UNIQUE KEY uq_payment_methods_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS financial_categories (
  category_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  transaction_type ENUM('income', 'expense') NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (category_id),
  UNIQUE KEY uq_financial_categories_name (transaction_type, name),
  UNIQUE KEY uq_financial_categories_type_id (category_id, transaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_name VARCHAR(160) NOT NULL,
  contact_name VARCHAR(120) NULL,
  email VARCHAR(254) NULL,
  phone VARCHAR(30) NULL,
  tax_identifier VARCHAR(40) NULL,
  address VARCHAR(500) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (supplier_id),
  UNIQUE KEY uq_suppliers_tax_identifier (tax_identifier),
  KEY idx_suppliers_business_name (business_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_units (
  unit_code VARCHAR(20) NOT NULL,
  name VARCHAR(60) NOT NULL,
  PRIMARY KEY (unit_code),
  UNIQUE KEY uq_inventory_units_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_items (
  item_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sku VARCHAR(60) NULL,
  name VARCHAR(160) NOT NULL,
  description VARCHAR(500) NULL,
  unit_code VARCHAR(20) NOT NULL,
  reorder_level DECIMAL(12, 3) UNSIGNED NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (item_id),
  UNIQUE KEY uq_inventory_items_sku (sku),
  CONSTRAINT fk_inventory_items_unit
    FOREIGN KEY (unit_code) REFERENCES inventory_units (unit_code)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_inventory_reorder_level CHECK (reorder_level >= 0),
  KEY idx_inventory_items_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS purchases (
  purchase_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  supplier_id BIGINT UNSIGNED NOT NULL,
  invoice_number VARCHAR(100) NULL,
  purchased_at DATETIME NOT NULL,
  status ENUM('draft', 'received', 'cancelled') NOT NULL DEFAULT 'draft',
  notes VARCHAR(1000) NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (purchase_id),
  CONSTRAINT fk_purchases_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers (supplier_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_purchases_creator
    FOREIGN KEY (created_by) REFERENCES users (user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uq_purchases_supplier_invoice (supplier_id, invoice_number),
  KEY idx_purchases_date_status (purchased_at, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS purchase_items (
  purchase_id BIGINT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(12, 3) UNSIGNED NOT NULL,
  unit_cost DECIMAL(12, 2) UNSIGNED NOT NULL,
  PRIMARY KEY (purchase_id, item_id),
  CONSTRAINT fk_purchase_items_purchase
    FOREIGN KEY (purchase_id) REFERENCES purchases (purchase_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_purchase_items_inventory_item
    FOREIGN KEY (item_id) REFERENCES inventory_items (item_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_purchase_items_quantity CHECK (quantity > 0),
  CONSTRAINT chk_purchase_items_unit_cost CHECK (unit_cost >= 0),
  KEY idx_purchase_items_item (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_movements (
  movement_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id BIGINT UNSIGNED NOT NULL,
  movement_type ENUM('consumption', 'adjustment') NOT NULL,
  direction ENUM('in', 'out') NOT NULL,
  quantity DECIMAL(12, 3) UNSIGNED NOT NULL,
  appointment_id BIGINT UNSIGNED NULL,
  note VARCHAR(500) NULL,
  recorded_by BIGINT UNSIGNED NOT NULL,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (movement_id),
  CONSTRAINT fk_inventory_movements_item
    FOREIGN KEY (item_id) REFERENCES inventory_items (item_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_inventory_movements_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_inventory_movements_recorder
    FOREIGN KEY (recorded_by) REFERENCES users (user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_inventory_movement_quantity CHECK (quantity > 0),
  CONSTRAINT chk_inventory_consumption_direction
    CHECK (movement_type <> 'consumption' OR direction = 'out'),
  KEY idx_inventory_movements_item_date (item_id, occurred_at),
  KEY idx_inventory_movements_appointment (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS financial_transactions (
  transaction_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  transaction_type ENUM('income', 'expense') NOT NULL,
  category_id SMALLINT UNSIGNED NOT NULL,
  payment_method_id SMALLINT UNSIGNED NOT NULL,
  appointment_id BIGINT UNSIGNED NULL,
  purchase_id BIGINT UNSIGNED NULL,
  amount DECIMAL(12, 2) UNSIGNED NOT NULL,
  reference VARCHAR(120) NULL,
  notes VARCHAR(1000) NULL,
  recorded_by BIGINT UNSIGNED NOT NULL,
  occurred_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (transaction_id),
  CONSTRAINT fk_financial_transactions_category_type
    FOREIGN KEY (category_id, transaction_type)
    REFERENCES financial_categories (category_id, transaction_type)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_financial_transactions_method
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods (payment_method_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_financial_transactions_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_financial_transactions_purchase
    FOREIGN KEY (purchase_id) REFERENCES purchases (purchase_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_financial_transactions_recorder
    FOREIGN KEY (recorded_by) REFERENCES users (user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_financial_transaction_amount CHECK (amount > 0),
  CONSTRAINT chk_financial_transaction_source CHECK (
    (transaction_type = 'income' AND appointment_id IS NOT NULL AND purchase_id IS NULL)
    OR
    (transaction_type = 'expense' AND appointment_id IS NULL)
  ),
  KEY idx_financial_transactions_date_type (occurred_at, transaction_type),
  KEY idx_financial_transactions_appointment (appointment_id),
  KEY idx_financial_transactions_purchase (purchase_id),
  KEY idx_financial_transactions_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO inventory_units (unit_code, name)
VALUES ('piece', 'Pieza'), ('ml', 'Mililitro'), ('g', 'Gramo'), ('box', 'Caja')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO payment_methods (name)
VALUES ('Efectivo'), ('Transferencia'), ('Tarjeta')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO financial_categories (transaction_type, name)
VALUES
  ('income', 'Pago de servicio'),
  ('expense', 'Compra de insumos'),
  ('expense', 'Gasto operativo')
ON DUPLICATE KEY UPDATE name = VALUES(name);

CREATE OR REPLACE VIEW inventory_stock AS
SELECT item.item_id, item.sku, item.name, item.unit_code,
       CAST(
         COALESCE(received_stock.quantity, 0) +
         COALESCE(movement_stock.quantity_change, 0)
         AS DECIMAL(14, 3)
       ) AS current_stock,
       item.reorder_level
FROM inventory_items item
LEFT JOIN (
  SELECT item.item_id, item.sku, item.name, item.unit_code,
         SUM(purchase_item.quantity) AS quantity
  FROM inventory_items item
  JOIN purchase_items purchase_item ON purchase_item.item_id = item.item_id
  JOIN purchases purchase
    ON purchase.purchase_id = purchase_item.purchase_id
   AND purchase.status = 'received'
  GROUP BY item.item_id, item.sku, item.name, item.unit_code
) received_stock ON received_stock.item_id = item.item_id
LEFT JOIN (
  SELECT item_id,
         SUM(CASE direction WHEN 'in' THEN quantity ELSE -quantity END)
           AS quantity_change
  FROM inventory_movements
  GROUP BY item_id
) movement_stock ON movement_stock.item_id = item.item_id;

CREATE OR REPLACE VIEW financial_ledger AS
SELECT transaction_record.transaction_id,
       transaction_record.transaction_type,
       category.name AS category,
       method.name AS payment_method,
       transaction_record.appointment_id,
       transaction_record.purchase_id,
       transaction_record.amount,
       transaction_record.reference,
       transaction_record.notes,
       transaction_record.occurred_at,
       transaction_record.recorded_by
FROM financial_transactions transaction_record
JOIN financial_categories category
  ON category.category_id = transaction_record.category_id
 AND category.transaction_type = transaction_record.transaction_type
JOIN payment_methods method
  ON method.payment_method_id = transaction_record.payment_method_id;

INSERT INTO schema_migrations (version, description)
VALUES ('001', 'Core users, services, and appointments')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO schema_migrations (version, description)
VALUES ('002', 'Client technical records, finance, and inventory')
ON DUPLICATE KEY UPDATE description = VALUES(description);
