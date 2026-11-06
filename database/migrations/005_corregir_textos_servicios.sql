-- Corrige caracteres sustituidos al guardar textos de servicios en MariaDB.
SET NAMES utf8mb4;
USE china_nails;

UPDATE servicios
SET nombre = CASE codigo_servicio
      WHEN 'acrilico' THEN 'Aplicación Acrílico (Clásico)'
      WHEN 'gelish' THEN 'Gelish en uña natural'
      WHEN 'retoque' THEN 'Retoque Acrílico'
    END,
    descripcion = CASE codigo_servicio
      WHEN 'acrilico' THEN 'Aplicación clásica de acrílico.'
      WHEN 'gelish' THEN 'Aplicación de gelish en uña natural.'
      WHEN 'retoque' THEN 'Retoque de aplicación acrílica.'
    END
WHERE codigo_servicio IN ('acrilico', 'gelish', 'retoque');

INSERT INTO migraciones_esquema (version_esquema, descripcion)
VALUES ('005', 'Correccion de textos de servicios con caracteres UTF-8')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);
