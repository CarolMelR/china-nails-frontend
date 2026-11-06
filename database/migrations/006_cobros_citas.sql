-- Ejecutar despues de las migraciones 001 a 005.
-- La tabla conserva un unico ingreso asociado a cada cita sin agregar tablas.
-- Seleccionar antes la base de datos que usa la API PHP.

ALTER TABLE movimientos_financieros
  ADD UNIQUE KEY uq_movimientos_financieros_cita (id_cita);

INSERT INTO migraciones_esquema (version_esquema, descripcion)
VALUES ('006', 'Registro unico de cobros asociados a citas')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);
