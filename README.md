# China Nails

Sistema local de reservas y administracion para un estudio de belleza. Usa
React, TypeScript, Vite, Tailwind CSS, una API Node/Express y MariaDB de XAMPP.

## Esquema reducido

La API PHP usa la base indicada por `CN_DB_NAME` (actualmente `defaultdb` en
Aiven). Despues de ejecutar las migraciones hasta `004`, contiene exactamente
estas 10 tablas fisicas, con identificadores en espanol ASCII:

| Nombre actual | Equivalente solicitado | Uso |
| --- | --- | --- |
| `usuarios` | `users` | Cuentas, hash de contrasena y rol. |
| `servicios` | `services` | Catalogo, precio y duracion. |
| `citas` | `appointments` | Agenda, clienta, servicio, horario, precio historico y estado. |
| `migraciones_esquema` | `schema_migrations` | Versiones de estructura aplicadas. |
| `perfiles_clientas` | `client_profiles` | Perfil tecnico 1:1 de las clientas. |
| `catalogo_decoraciones` | `decoration_catalog` | Tipos de decoracion disponibles. |
| `decoraciones_cita` | `appointment_decorations` | Decoraciones elegidas en cada cita, relacionadas con el catalogo. |
| `insumos` | `inventory_items` | Materiales, unidad y nivel de reorden. |
| `movimientos_inventario` | `inventory_movements` | Entradas, salidas, consumo y ajustes ligados a insumos/citas. |
| `movimientos_financieros` | `financial_transactions` | Ingresos por cita y egresos operativos. |

Ya no hay vistas ni tablas adicionales. Se eliminaron las tablas de alergias y
tonos, proveedores, compras y sus partidas, categorias y metodos de pago,
unidades separadas y vistas de reporte. La migracion conserva datos de las
10 tablas seleccionadas y remueve las demas.

### Normalizacion y alcance resultante

`usuarios`, `servicios`, `citas`, `perfiles_clientas`, `catalogo_decoraciones`
y `decoraciones_cita` conservan sus relaciones con claves foraneas y catalogos.
El historial de decoracion queda asociado a una cita y al catalogo tecnico.
`citas.precio_reservado` y `citas.duracion_minutos` son snapshots intencionales
de los valores al reservar.

Para respetar estrictamente el limite de 10 tablas, la categoria y el metodo de
pago se guardan como texto en `movimientos_financieros.categoria` y
`movimientos_financieros.metodo_pago`; la unidad se guarda en
`insumos.unidad`. Esta simplificacion puede repetir etiquetas en varios
registros: si luego se requieren reportes con categorias/metodos estandarizados,
convendra reincorporar catalogos separados. Los egresos conservan monto,
categoria, metodo, fecha, referencia y notas, pero ya no se vinculan a
proveedores o compras porque esas entidades se quitaron del alcance. El
inventario conserva entradas/salidas manuales; ya no calcula existencia desde
compras.

El expediente tecnico se limita a los campos de `perfiles_clientas` y al
historial de decoraciones por cita. Alergias, tonos y sus historiales dedicados
no forman parte de esta version reducida.

## Migraciones

El archivo inicial es `database/china_nails.sql`. Para una instalacion nueva,
ejecuta en Workbench, en este orden:

1. `database/china_nails.sql`
2. `database/migrations/002_client_records_finance_inventory.sql`
3. `database/migrations/003_nombres_espanol.sql`
4. `database/migrations/004_esquema_reducido_10_tablas.sql`
5. `database/migrations/005_corregir_textos_servicios.sql`
6. `database/migrations/006_cobros_citas.sql`

La migracion `004` esta pensada para ejecutarse **una sola vez** sobre una base
que ya aplico `001` a `003`. Respaldala antes de ejecutarla en otra instancia.
La migracion `006` agrega una restriccion unica al identificador de cita en
`movimientos_financieros`; se mantiene el limite de diez tablas y cada cita
puede generar como maximo un ingreso registrado. Selecciona primero la base
que usa la API PHP antes de ejecutar esta migracion.

En esta computadora, `china_nails` esta aplicado en MariaDB 10.4.32 de XAMPP,
host `127.0.0.1`, puerto `3306`.

### Verificar en MySQL Workbench

Con XAMPP **MySQL** iniciado, conecta a `127.0.0.1:3306` y actualiza **Schemas**.
Abre `china_nails` > **Tables**. Para consultar el conjunto exacto:

```sql
USE china_nails;
SHOW FULL TABLES;
SELECT version_esquema, descripcion, aplicado_en
FROM migraciones_esquema
ORDER BY version_esquema;
```

La primera consulta debe listar solo las 10 tablas anteriores. Consultas de
ejemplo:

```sql
SELECT * FROM citas ORDER BY fecha_cita, hora_inicio;
SELECT * FROM perfiles_clientas;
SELECT * FROM decoraciones_cita;
SELECT * FROM movimientos_financieros ORDER BY ocurrido_en;
SELECT * FROM insumos;
SELECT * FROM movimientos_inventario ORDER BY ocurrido_en;
```

## Ejecutar la aplicacion

La pantalla inicial permite crear cuentas de clienta y reservar citas. La
autenticacion usa contrasenas bcrypt; el formulario publico solo crea cuentas
de clienta. Las cuentas admin deben crearse directamente en la base de datos.

Inicia Apache en XAMPP y la aplicacion Vite desde la raiz del proyecto:

```powershell
npm run dev
```

El frontend usa el API PHP de `http://localhost/china-nails-api/api.php` y la
base MySQL de Aiven mediante Apache. El backend Node heredado puede iniciarse
por separado con `npm run dev:api`, pero ya no es necesario para la aplicacion.
No se requiere iniciar MySQL local de XAMPP.

### Comprobar la conexión PHP con Aiven

El API PHP está en `C:\xampp\htdocs\china-nails-api\api.php`; el endpoint
`conexion.php` comprueba la conectividad. La configuración local de Apache se
encuentra en
`C:\xampp\apache\conf\extra\china-nails-aiven.conf`, incluido desde
`httpd.conf`. Configura ahí `CN_DB_HOST`, `CN_DB_PORT`, `CN_DB_USER`,
`CN_DB_PASSWORD`, `CN_DB_NAME`, `CN_DB_SSL_CA` y un `CN_JWT_SECRET` aleatorio
de al menos 32 caracteres. La ruta CA apunta al certificado descargado desde
Aiven:

```apache
SetEnv CN_DB_HOST "HOST_DE_AIVEN"
SetEnv CN_DB_PORT "PUERTO_DE_AIVEN"
SetEnv CN_DB_USER "USUARIO_DE_AIVEN"
SetEnv CN_DB_PASSWORD "CLAVE_DE_AIVEN"
SetEnv CN_DB_NAME "NOMBRE_DE_LA_BASE"
SetEnv CN_DB_SSL_CA "C:/xampp/htdocs/china-nails-api/ca.pem"
SetEnv CN_JWT_SECRET "SECRETO_ALEATORIO_DE_AL_MENOS_32_CARACTERES"
```

Mantén credenciales y secretos fuera del repositorio y reinicia Apache después
de cambiarlos. No necesitas iniciar MySQL local de XAMPP.

Con Apache iniciado, el frontend en Vite consume
`http://localhost/china-nails-api/api.php`; la página principal consulta
`conexion.php` y muestra el estado de la conexión. Ambos endpoints requieren
TLS con verificación del certificado CA.

### Finanzas e inventario

La navegación administrativa incluye **Historial** y **Finanzas**. Desde
Finanzas, la administradora puede registrar egresos generales y compras de
insumos. Una compra registra en una sola operación el egreso financiero y la
entrada (`direccion = 'in'`) en `movimientos_inventario`; el stock se calcula
sumando entradas y restando salidas, sin agregar tablas. El balance mensual
resta los egresos de los ingresos de citas completadas.

## Validaciones

```powershell
npm run build
npm run lint
npm audit
```
