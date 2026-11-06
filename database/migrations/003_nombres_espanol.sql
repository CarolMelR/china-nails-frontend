-- Ejecutar una sola vez despues de las migraciones 001 y 002.
USE china_nails;

DROP VIEW IF EXISTS financial_ledger;
DROP VIEW IF EXISTS inventory_stock;

RENAME TABLE
  allergy_catalog TO catalogo_alergias,
  appointments TO citas,
  appointment_colors TO tonos_cita,
  appointment_decorations TO decoraciones_cita,
  client_allergies TO alergias_clientas,
  client_profiles TO perfiles_clientas,
  decoration_catalog TO catalogo_decoraciones,
  financial_categories TO categorias_financieras,
  financial_transactions TO movimientos_financieros,
  inventory_items TO insumos,
  inventory_movements TO movimientos_inventario,
  inventory_units TO unidades_inventario,
  nail_color_catalog TO catalogo_tonos,
  payment_methods TO metodos_pago,
  purchase_items TO detalles_compra,
  purchases TO compras,
  schema_migrations TO migraciones_esquema,
  services TO servicios,
  suppliers TO proveedores,
  users TO usuarios;

ALTER TABLE usuarios
  CHANGE COLUMN user_id id_usuario BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN username nombre_usuario VARCHAR(50) NOT NULL,
  CHANGE COLUMN email correo VARCHAR(254) NOT NULL,
  CHANGE COLUMN password_hash hash_contrasena VARCHAR(255) NOT NULL,
  CHANGE COLUMN full_name nombre_completo VARCHAR(120) NOT NULL,
  CHANGE COLUMN phone telefono VARCHAR(30) NOT NULL,
  CHANGE COLUMN role rol ENUM('admin', 'client') NOT NULL DEFAULT 'client',
  CHANGE COLUMN is_active activo BOOLEAN NOT NULL DEFAULT TRUE,
  CHANGE COLUMN created_at creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHANGE COLUMN updated_at actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE servicios
  CHANGE COLUMN service_code codigo_servicio VARCHAR(40) NOT NULL,
  CHANGE COLUMN name nombre VARCHAR(120) NOT NULL,
  CHANGE COLUMN description descripcion VARCHAR(500) NULL,
  CHANGE COLUMN duration_minutes duracion_minutos SMALLINT UNSIGNED NOT NULL,
  CHANGE COLUMN price precio DECIMAL(10, 2) UNSIGNED NOT NULL,
  CHANGE COLUMN is_active activo BOOLEAN NOT NULL DEFAULT TRUE,
  CHANGE COLUMN created_at creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHANGE COLUMN updated_at actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE citas
  CHANGE COLUMN appointment_id id_cita BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN client_id id_clienta BIGINT UNSIGNED NOT NULL,
  CHANGE COLUMN service_code codigo_servicio VARCHAR(40) NOT NULL,
  CHANGE COLUMN appointment_date fecha_cita DATE NOT NULL,
  CHANGE COLUMN start_time hora_inicio TIME NOT NULL,
  CHANGE COLUMN duration_minutes duracion_minutos SMALLINT UNSIGNED NOT NULL,
  CHANGE COLUMN price_at_booking precio_reservado DECIMAL(10, 2) UNSIGNED NOT NULL,
  CHANGE COLUMN status estado ENUM('pending', 'confirmed', 'completed', 'cancelled')
    NOT NULL DEFAULT 'pending',
  CHANGE COLUMN notes notas VARCHAR(1000) NULL,
  CHANGE COLUMN created_at creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHANGE COLUMN updated_at actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE migraciones_esquema
  CHANGE COLUMN version version_esquema VARCHAR(20) NOT NULL,
  CHANGE COLUMN description descripcion VARCHAR(255) NOT NULL,
  CHANGE COLUMN applied_at aplicado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE perfiles_clientas
  CHANGE COLUMN client_id id_clienta BIGINT UNSIGNED NOT NULL,
  CHANGE COLUMN nail_type tipo_unas VARCHAR(80) NULL,
  CHANGE COLUMN preferred_shape forma_preferida VARCHAR(80) NULL,
  CHANGE COLUMN preferred_length largo_preferido VARCHAR(80) NULL,
  CHANGE COLUMN general_notes notas_generales TEXT NULL,
  CHANGE COLUMN created_at creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHANGE COLUMN updated_at actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE catalogo_alergias
  CHANGE COLUMN allergy_id id_alergia SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN name nombre VARCHAR(120) NOT NULL,
  CHANGE COLUMN description descripcion VARCHAR(500) NULL,
  CHANGE COLUMN is_active activo BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE alergias_clientas
  CHANGE COLUMN client_id id_clienta BIGINT UNSIGNED NOT NULL,
  CHANGE COLUMN allergy_id id_alergia SMALLINT UNSIGNED NOT NULL,
  CHANGE COLUMN severity gravedad ENUM('mild', 'moderate', 'severe', 'unknown')
    NOT NULL DEFAULT 'unknown',
  CHANGE COLUMN reaction_notes notas_reaccion VARCHAR(1000) NULL,
  CHANGE COLUMN recorded_by registrado_por BIGINT UNSIGNED NULL,
  CHANGE COLUMN recorded_at registrado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE catalogo_tonos
  CHANGE COLUMN color_id id_tono INT UNSIGNED NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN name nombre VARCHAR(100) NOT NULL,
  CHANGE COLUMN hex_code codigo_hex CHAR(7) NULL,
  CHANGE COLUMN color_family familia_color VARCHAR(60) NULL,
  CHANGE COLUMN is_active activo BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE catalogo_decoraciones
  CHANGE COLUMN decoration_id id_decoracion INT UNSIGNED NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN name nombre VARCHAR(120) NOT NULL,
  CHANGE COLUMN description descripcion VARCHAR(500) NULL,
  CHANGE COLUMN is_active activo BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE tonos_cita
  CHANGE COLUMN appointment_id id_cita BIGINT UNSIGNED NOT NULL,
  CHANGE COLUMN position posicion SMALLINT UNSIGNED NOT NULL,
  CHANGE COLUMN color_id id_tono INT UNSIGNED NOT NULL,
  CHANGE COLUMN placement_notes notas_aplicacion VARCHAR(500) NULL;

ALTER TABLE decoraciones_cita
  CHANGE COLUMN appointment_id id_cita BIGINT UNSIGNED NOT NULL,
  CHANGE COLUMN position posicion SMALLINT UNSIGNED NOT NULL,
  CHANGE COLUMN decoration_id id_decoracion INT UNSIGNED NOT NULL,
  CHANGE COLUMN placement_notes notas_aplicacion VARCHAR(500) NULL;

ALTER TABLE metodos_pago
  CHANGE COLUMN payment_method_id id_metodo_pago SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN name nombre VARCHAR(60) NOT NULL,
  CHANGE COLUMN is_active activo BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE categorias_financieras
  CHANGE COLUMN category_id id_categoria SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN transaction_type tipo_movimiento ENUM('income', 'expense') NOT NULL,
  CHANGE COLUMN name nombre VARCHAR(100) NOT NULL,
  CHANGE COLUMN is_active activo BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE proveedores
  CHANGE COLUMN supplier_id id_proveedor BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN business_name razon_social VARCHAR(160) NOT NULL,
  CHANGE COLUMN contact_name nombre_contacto VARCHAR(120) NULL,
  CHANGE COLUMN email correo VARCHAR(254) NULL,
  CHANGE COLUMN phone telefono VARCHAR(30) NULL,
  CHANGE COLUMN tax_identifier identificador_fiscal VARCHAR(40) NULL,
  CHANGE COLUMN address direccion VARCHAR(500) NULL,
  CHANGE COLUMN is_active activo BOOLEAN NOT NULL DEFAULT TRUE,
  CHANGE COLUMN created_at creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHANGE COLUMN updated_at actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE unidades_inventario
  CHANGE COLUMN unit_code codigo_unidad VARCHAR(20) NOT NULL,
  CHANGE COLUMN name nombre VARCHAR(60) NOT NULL;

ALTER TABLE insumos
  CHANGE COLUMN item_id id_insumo BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN sku codigo_producto VARCHAR(60) NULL,
  CHANGE COLUMN name nombre VARCHAR(160) NOT NULL,
  CHANGE COLUMN description descripcion VARCHAR(500) NULL,
  CHANGE COLUMN unit_code codigo_unidad VARCHAR(20) NOT NULL,
  CHANGE COLUMN reorder_level nivel_reorden DECIMAL(12, 3) UNSIGNED NOT NULL DEFAULT 0,
  CHANGE COLUMN is_active activo BOOLEAN NOT NULL DEFAULT TRUE,
  CHANGE COLUMN created_at creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHANGE COLUMN updated_at actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE compras
  CHANGE COLUMN purchase_id id_compra BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN supplier_id id_proveedor BIGINT UNSIGNED NOT NULL,
  CHANGE COLUMN invoice_number numero_factura VARCHAR(100) NULL,
  CHANGE COLUMN purchased_at comprado_en DATETIME NOT NULL,
  CHANGE COLUMN status estado ENUM('draft', 'received', 'cancelled')
    NOT NULL DEFAULT 'draft',
  CHANGE COLUMN notes notas VARCHAR(1000) NULL,
  CHANGE COLUMN created_by creado_por BIGINT UNSIGNED NOT NULL,
  CHANGE COLUMN created_at creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHANGE COLUMN updated_at actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE detalles_compra
  CHANGE COLUMN purchase_id id_compra BIGINT UNSIGNED NOT NULL,
  CHANGE COLUMN item_id id_insumo BIGINT UNSIGNED NOT NULL,
  CHANGE COLUMN quantity cantidad DECIMAL(12, 3) UNSIGNED NOT NULL,
  CHANGE COLUMN unit_cost costo_unitario DECIMAL(12, 2) UNSIGNED NOT NULL;

ALTER TABLE movimientos_inventario
  CHANGE COLUMN movement_id id_movimiento BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN item_id id_insumo BIGINT UNSIGNED NOT NULL,
  CHANGE COLUMN movement_type tipo_movimiento ENUM('consumption', 'adjustment') NOT NULL,
  CHANGE COLUMN direction direccion ENUM('in', 'out') NOT NULL,
  CHANGE COLUMN quantity cantidad DECIMAL(12, 3) UNSIGNED NOT NULL,
  CHANGE COLUMN appointment_id id_cita BIGINT UNSIGNED NULL,
  CHANGE COLUMN note nota VARCHAR(500) NULL,
  CHANGE COLUMN recorded_by registrado_por BIGINT UNSIGNED NOT NULL,
  CHANGE COLUMN occurred_at ocurrido_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE movimientos_financieros
  CHANGE COLUMN transaction_id id_movimiento BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN transaction_type tipo_movimiento ENUM('income', 'expense') NOT NULL,
  CHANGE COLUMN category_id id_categoria SMALLINT UNSIGNED NOT NULL,
  CHANGE COLUMN payment_method_id id_metodo_pago SMALLINT UNSIGNED NOT NULL,
  CHANGE COLUMN appointment_id id_cita BIGINT UNSIGNED NULL,
  CHANGE COLUMN purchase_id id_compra BIGINT UNSIGNED NULL,
  CHANGE COLUMN amount monto DECIMAL(12, 2) UNSIGNED NOT NULL,
  CHANGE COLUMN reference referencia VARCHAR(120) NULL,
  CHANGE COLUMN notes notas VARCHAR(1000) NULL,
  CHANGE COLUMN recorded_by registrado_por BIGINT UNSIGNED NOT NULL,
  CHANGE COLUMN occurred_at ocurrido_en DATETIME NOT NULL,
  CHANGE COLUMN created_at creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE OR REPLACE VIEW existencias_inventario AS
SELECT insumo.id_insumo, insumo.codigo_producto, insumo.nombre,
       insumo.codigo_unidad,
       CAST(
         COALESCE(compras_recibidas.cantidad, 0) +
         COALESCE(ajustes_inventario.cambio, 0)
         AS DECIMAL(14, 3)
       ) AS existencia_actual,
       insumo.nivel_reorden
FROM insumos insumo
LEFT JOIN (
  SELECT insumo.id_insumo, SUM(detalle.cantidad) AS cantidad
  FROM insumos insumo
  JOIN detalles_compra detalle ON detalle.id_insumo = insumo.id_insumo
  JOIN compras compra
    ON compra.id_compra = detalle.id_compra
   AND compra.estado = 'received'
  GROUP BY insumo.id_insumo
) compras_recibidas ON compras_recibidas.id_insumo = insumo.id_insumo
LEFT JOIN (
  SELECT id_insumo,
         SUM(CASE direccion WHEN 'in' THEN cantidad ELSE -cantidad END) AS cambio
  FROM movimientos_inventario
  GROUP BY id_insumo
) ajustes_inventario ON ajustes_inventario.id_insumo = insumo.id_insumo;

CREATE OR REPLACE VIEW libro_financiero AS
SELECT movimiento.id_movimiento, movimiento.tipo_movimiento,
       categoria.nombre AS categoria, metodo.nombre AS metodo_pago,
       movimiento.id_cita, movimiento.id_compra, movimiento.monto,
       movimiento.referencia, movimiento.notas, movimiento.ocurrido_en,
       movimiento.registrado_por
FROM movimientos_financieros movimiento
JOIN categorias_financieras categoria
  ON categoria.id_categoria = movimiento.id_categoria
 AND categoria.tipo_movimiento = movimiento.tipo_movimiento
JOIN metodos_pago metodo
  ON metodo.id_metodo_pago = movimiento.id_metodo_pago;

INSERT INTO migraciones_esquema (version_esquema, descripcion)
VALUES ('003', 'Nombres de tablas y atributos en espanol')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

UPDATE migraciones_esquema
SET descripcion = CASE version_esquema
  WHEN '001' THEN 'Usuarios, servicios y citas principales'
  WHEN '002' THEN 'Expedientes tecnicos, finanzas e inventario'
  ELSE descripcion
END
WHERE version_esquema IN ('001', '002');
