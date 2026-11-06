-- Ejecutar una sola vez despues de las migraciones 001, 002 y 003.
-- Reduce el esquema a las 10 tablas de operacion acordadas y conserva
-- los valores descriptivos antes de eliminar catalogos auxiliares.
USE china_nails;

DROP VIEW IF EXISTS libro_financiero;
DROP VIEW IF EXISTS existencias_inventario;

ALTER TABLE insumos
  ADD COLUMN unidad VARCHAR(60) NULL AFTER descripcion;

UPDATE insumos insumo
LEFT JOIN unidades_inventario unidad_catalogo
  ON unidad_catalogo.codigo_unidad = insumo.codigo_unidad
SET insumo.unidad =
  COALESCE(unidad_catalogo.nombre, insumo.codigo_unidad);

ALTER TABLE insumos
  MODIFY COLUMN unidad VARCHAR(60) NOT NULL,
  DROP FOREIGN KEY fk_inventory_items_unit,
  DROP COLUMN codigo_unidad;

ALTER TABLE movimientos_financieros
  ADD COLUMN categoria VARCHAR(100) NULL AFTER tipo_movimiento,
  ADD COLUMN metodo_pago VARCHAR(60) NULL AFTER categoria;

UPDATE movimientos_financieros movimiento
LEFT JOIN categorias_financieras categoria_catalogo
  ON categoria_catalogo.id_categoria = movimiento.id_categoria
 AND categoria_catalogo.tipo_movimiento = movimiento.tipo_movimiento
LEFT JOIN metodos_pago metodo_catalogo
  ON metodo_catalogo.id_metodo_pago = movimiento.id_metodo_pago
SET movimiento.categoria =
      COALESCE(categoria_catalogo.nombre,
               CONCAT('Categoria ', movimiento.id_categoria)),
    movimiento.metodo_pago =
      COALESCE(metodo_catalogo.nombre,
               CONCAT('Metodo ', movimiento.id_metodo_pago));

ALTER TABLE movimientos_financieros
  DROP CONSTRAINT chk_financial_transaction_source,
  DROP FOREIGN KEY fk_financial_transactions_category_type,
  DROP FOREIGN KEY fk_financial_transactions_method,
  DROP FOREIGN KEY fk_financial_transactions_purchase,
  DROP INDEX fk_financial_transactions_category_type,
  DROP INDEX fk_financial_transactions_method,
  DROP INDEX idx_financial_transactions_purchase,
  DROP INDEX idx_financial_transactions_category,
  DROP COLUMN id_categoria,
  DROP COLUMN id_metodo_pago,
  DROP COLUMN id_compra,
  MODIFY COLUMN categoria VARCHAR(100) NOT NULL,
  MODIFY COLUMN metodo_pago VARCHAR(60) NOT NULL,
  ADD CONSTRAINT chk_movimientos_financieros_origen CHECK (
    (tipo_movimiento = 'income' AND id_cita IS NOT NULL)
    OR
    (tipo_movimiento = 'expense' AND id_cita IS NULL)
  );

DROP TABLE IF EXISTS alergias_clientas;
DROP TABLE IF EXISTS catalogo_alergias;
DROP TABLE IF EXISTS tonos_cita;
DROP TABLE IF EXISTS catalogo_tonos;
DROP TABLE IF EXISTS categorias_financieras;
DROP TABLE IF EXISTS metodos_pago;
DROP TABLE IF EXISTS detalles_compra;
DROP TABLE IF EXISTS compras;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS unidades_inventario;

INSERT INTO migraciones_esquema (version_esquema, descripcion)
VALUES ('004', 'Esquema reducido a diez tablas y conservacion del catalogo tecnico')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);
