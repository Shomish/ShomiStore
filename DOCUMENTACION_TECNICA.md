# NovaStore
## Documento informativo y documentación técnica

**Curso:** Desarrollo de Aplicaciones Web  
**Proyecto:** NovaStore / ShomiStore  
**Versión documentada:** 1.0.0  
**Fecha:** ____________________  
**Estudiante:** ____________________  

> **Nota de identidad:** el nombre técnico del proyecto es `NovaStore`, pero la interfaz web utiliza actualmente la marca comercial `ShomiStore`. En este documento se usa “NovaStore” para referirse al proyecto completo y “ShomiStore” para la experiencia visible en pantalla.

---

## 1. Introducción

NovaStore es una aplicación web de comercio electrónico desarrollada con Node.js y Express. Permite consultar un catálogo de productos, filtrar artículos, agregarlos a un carrito y registrar pedidos. El sistema también incluye un panel de administración protegido por sesión, desde el cual se pueden gestionar productos, stock y pedidos.

El catálogo inicial se obtiene desde la API externa [DummyJSON Products](https://dummyjson.com/products). Después de la importación, los productos y los pedidos se conservan en el archivo local `data/store.json`, por lo que la aplicación puede trabajar con un catálogo persistente sin utilizar una base de datos externa.

La aplicación busca resolver la necesidad de contar con una tienda web funcional y sencilla de administrar, con separación entre la interfaz del cliente y los servicios del servidor.

**[INSERTAR CAPTURA 1: página principal de NovaStore]**

---

## 2. Objetivos

### 2.1 Objetivo general

Desarrollar una tienda web que consulte, muestre y administre productos mediante una arquitectura cliente-servidor implementada con Node.js, Express y JavaScript.

### 2.2 Objetivos específicos

1. Implementar una API propia que importe productos desde DummyJSON y los entregue al frontend.
2. Crear una experiencia de compra con catálogo, búsqueda, filtros, carrito, checkout y registro de pedidos.
3. Incorporar un panel administrativo para gestionar productos, stock, pedidos y estadísticas.
4. Aplicar Bootstrap, HTML, CSS y JavaScript para construir una interfaz responsive y usable.

---

## 3. Descripción general del sistema

### 3.1 Funcionalidades principales

- Página de inicio con novedades, ofertas y categorías.
- Catálogo completo de productos.
- Búsqueda por nombre.
- Filtro por categoría.
- Ordenamiento por precio y nombre.
- Visualización de descuentos, precio final y stock disponible.
- Detalle de producto.
- Favoritos guardados en el navegador.
- Carrito de compras guardado en `localStorage`.
- Registro de pedidos mediante formulario de checkout.
- Validación de correo, datos del cliente y stock.
- Persistencia local de productos y pedidos.
- Inicio de sesión administrativo.
- Creación, edición y eliminación de productos.
- Carga de imágenes mediante URL o archivo convertido a Data URL.
- Panel de estadísticas de inventario, pedidos, ventas y productos más vendidos.
- Sincronización de novedades desde la API externa.
- Envío opcional de confirmaciones mediante SMTP.
- Centro de ayuda y página de beneficios Platinum.

### 3.2 Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| Node.js | Entorno de ejecución del servidor. |
| Express 5 | Servidor HTTP, rutas API y archivos estáticos. |
| Axios | Consulta de la API externa DummyJSON. |
| Nodemailer | Envío opcional de correos de pedidos. |
| dotenv | Carga de variables de entorno desde `.env`. |
| Bootstrap 5 | Clases de diseño y estructura responsive. |
| HTML5 | Estructura de las páginas. |
| CSS3 | Identidad visual, diseño y responsive. |
| JavaScript | Interacciones, renderizado y consumo de la API. |
| JSON | Persistencia local de productos y pedidos. |
| localStorage | Persistencia del carrito, favoritos, ubicación y sesión del administrador. |

---

## 4. Arquitectura de la aplicación

NovaStore utiliza una arquitectura cliente-servidor sencilla:

1. El navegador carga los archivos HTML, CSS y JavaScript desde Express.
2. El frontend solicita información a las rutas `/api/...`.
3. Express procesa la solicitud y, cuando corresponde, consulta DummyJSON o `data/store.json`.
4. El servidor devuelve respuestas JSON.
5. JavaScript actualiza la interfaz de manera dinámica.

### 4.1 Diagrama lógico

```text
Usuario
   |
   v
Frontend HTML/CSS/JavaScript
   |
   | fetch('/api/...')
   v
Servidor Node.js + Express
   |----------------------|
   v                      v
DummyJSON            data/store.json
API externa          productos y pedidos
   |
   v
Respuesta JSON al frontend
```

**[INSERTAR CAPTURA 2: diagrama o estructura general del proyecto]**

### 4.2 Estructura del proyecto

```text
NovaStore/
├── index.js
├── package.json
├── package-lock.json
├── .env.example
├── README.md
├── data/
│   └── store.json
└── public/
    ├── index.html
    ├── catalogo.html
    ├── estadisticas.html
    ├── socios.html
    ├── ayuda.html
    ├── css/
    │   ├── bootstrap.css
    │   └── styles.css
    └── js/
        ├── app.js
        ├── catalog.js
        ├── help.js
        ├── nav.js
        ├── stats.js
        └── axios.min.js
```

---

## 5. Instalación y ejecución

### 5.1 Requisitos

- Node.js 18 o superior.
- npm.
- Visual Studio Code u otro editor.
- Conexión a internet para la primera importación desde DummyJSON.

### 5.2 Instalación de dependencias

Abrir una terminal en la carpeta raíz del proyecto y ejecutar:

```powershell
npm install
```

### 5.3 Inicio del servidor

```powershell
npm start
```

También existe un modo de desarrollo con reinicio automático:

```powershell
npm run dev
```

Luego se debe abrir:

```text
http://localhost:3000
```

No se debe abrir el archivo HTML directamente con doble clic, porque el frontend necesita comunicarse con el servidor Express.

**[INSERTAR CAPTURA 3: terminal mostrando `npm start`]**  
**[INSERTAR CAPTURA 4: aplicación abierta en `http://localhost:3000`]**

### 5.4 Configuración opcional del correo

Copiar el archivo `.env.example` como `.env` y completar los datos SMTP:

```powershell
Copy-Item .env.example .env
```

Variables principales:

```text
ADMIN_EMAIL=admin@novastore.com
ADMIN_PASSWORD=admin123
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-correo@gmail.com
SMTP_PASSWORD=tu-contrasena-de-aplicacion
SMTP_FROM=NovaStore <tu-correo@gmail.com>
ORDER_NOTIFICATION_EMAIL=freleida@gmail.com
```

La configuración SMTP es opcional. Si no existe, el pedido se registra de todas formas, pero no se envía el correo.

---

## 6. Descripción técnica de los archivos

### 6.1 `index.js`

Es el punto de entrada del backend. Sus responsabilidades son:

- Cargar las variables de entorno.
- Crear la aplicación Express.
- Configurar el puerto, por defecto `3000`.
- Servir la carpeta `public` como contenido estático.
- Habilitar recepción de datos JSON.
- Leer y escribir `data/store.json`.
- Importar el catálogo inicial desde DummyJSON usando Axios.
- Sincronizar nuevos productos externos.
- Exponer las rutas de productos, autenticación, administración y pedidos.
- Validar el token de administrador.
- Actualizar el stock al registrar un pedido.
- Enviar correos por SMTP cuando la configuración está disponible.

**[INSERTAR CAPTURA 5: fragmento de `index.js` donde se crea Express]**

### 6.2 `public/index.html`

Es la página principal de la tienda. Contiene:

- Cabecera y navegación.
- Acceso al panel administrativo.
- Acceso al carrito.
- Sección principal de presentación.
- Categorías rápidas.
- Ofertas y novedades.
- Controles de búsqueda, categoría y ordenamiento.
- Modal de detalle de producto.
- Panel lateral del carrito.
- Formulario de checkout.
- Formulario de administración.
- Modal de contacto y ubicación.

También carga Bootstrap, `axios.min.js`, `app.js` y `nav.js`.

**[INSERTAR CAPTURA 6: fragmento de `index.html` con los scripts y botón de catálogo]**

### 6.3 `public/js/app.js`

Es el controlador principal del frontend. Mantiene el catálogo en memoria y coordina las acciones de la página de inicio.

Funciones destacadas:

- Solicita productos mediante `GET /api/productos`.
- Renderiza tarjetas de productos.
- Aplica búsqueda, filtros y ordenamiento.
- Calcula descuentos y precios finales.
- Administra favoritos en `localStorage`.
- Administra el carrito en `localStorage`.
- Abre el detalle de cada producto.
- Envía los datos del checkout mediante `POST /api/pedidos`.
- Inicia sesión mediante `POST /api/auth/login`.
- Carga el resumen administrativo.
- Crea, edita y elimina productos.
- Solicita estadísticas administrativas.

**[INSERTAR CAPTURA 7: fragmento de `app.js` donde se carga el catálogo]**  
**[INSERTAR CAPTURA 8: fragmento de `app.js` donde se envía un pedido]**

### 6.4 `public/js/catalog.js`

Controla la página `catalogo.html`. Es una versión enfocada en el catálogo completo y permite:

- Cargar los productos desde `/api/productos`.
- Buscar por nombre.
- Filtrar por categoría.
- Ordenar por precio o nombre.
- Agregar productos al carrito compartido.

### 6.5 `public/js/stats.js`

Controla la página de estadísticas. Verifica la sesión almacenada, solicita `/api/admin/estadisticas` y muestra:

- Productos activos.
- Unidades en stock.
- Pedidos recibidos.
- Ventas registradas.
- Distribución por categorías.
- Productos más vendidos.

### 6.6 `public/js/help.js`

Gestiona el modal de contacto de la página de ayuda. Actualmente la consulta se muestra como preparada en la interfaz; no se envía a un endpoint del backend.

### 6.7 `public/js/nav.js`

Contiene la lógica compartida del menú responsive para dispositivos móviles.

### 6.8 Archivos HTML adicionales

- `catalogo.html`: catálogo completo con búsqueda, filtros y ordenamiento.
- `estadisticas.html`: panel independiente de indicadores administrativos.
- `socios.html`: información del programa de beneficios Platinum.
- `ayuda.html`: preguntas frecuentes y formulario de contacto.

### 6.9 `public/css/styles.css` y `public/css/bootstrap.css`

`bootstrap.css` proporciona la base de estilos y utilidades responsive. `styles.css` define la identidad visual de la tienda, tarjetas, botones, modales, paneles, formularios, estados de carga y adaptaciones para pantallas pequeñas.

### 6.10 `data/store.json`

Es el almacenamiento local de la aplicación. Contiene dos colecciones principales:

```json
{
  "products": [],
  "orders": []
}
```

El archivo se actualiza cuando se importa el catálogo, se sincronizan productos, se modifica el CRUD o se registra un pedido.

---

## 7. API del backend

### 7.1 Rutas públicas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/salud` | Comprueba que el servidor funciona e informa si SMTP está configurado. |
| `GET` | `/api/productos` | Devuelve el catálogo local; lo importa desde DummyJSON si está vacío. |
| `GET` | `/api/productos?actualizar=true` | Sincroniza productos nuevos desde DummyJSON sin borrar los productos locales. |
| `POST` | `/api/auth/login` | Valida las credenciales administrativas y entrega un token temporal. |
| `POST` | `/api/pedidos` | Valida y registra un pedido, descuenta stock y envía correo si SMTP está disponible. |

### 7.2 Rutas protegidas

Estas rutas requieren el encabezado:

```text
Authorization: Bearer TOKEN
```

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/admin/resumen` | Devuelve productos, pedidos y cantidad de productos con stock bajo. |
| `GET` | `/api/admin/estadisticas` | Devuelve indicadores de inventario, ventas, categorías y productos más vendidos. |
| `POST` | `/api/admin/productos` | Crea un producto nuevo. |
| `PUT` | `/api/admin/productos/:id` | Actualiza un producto existente. |
| `DELETE` | `/api/admin/productos/:id` | Elimina un producto. |

### 7.3 Ejemplo de respuesta de productos

```json
[
  {
    "id": 3,
    "title": "Powder Canister",
    "description": "Descripción del producto",
    "price": 14.99,
    "stock": 85,
    "category": "beauty",
    "thumbnail": "https://...",
    "images": ["https://..."]
  }
]
```

---

## 8. Flujo funcional de la aplicación

### 8.1 Consulta del catálogo

1. El usuario abre la página principal o el catálogo.
2. JavaScript solicita `GET /api/productos`.
3. El servidor revisa `data/store.json`.
4. Si no hay productos, consulta `https://dummyjson.com/products`.
5. El servidor normaliza los datos y los guarda localmente.
6. El frontend recibe el JSON.
7. Se crean las tarjetas de productos en pantalla.

**[INSERTAR CAPTURA 9: catálogo cargado con productos]**

### 8.2 Compra y registro del pedido

1. El usuario selecciona un producto.
2. El producto se agrega al carrito.
3. El carrito se conserva en `localStorage`.
4. El usuario completa nombre, correo y dirección.
5. El frontend envía los productos y los datos del cliente a `POST /api/pedidos`.
6. El backend valida los datos y el stock.
7. El pedido se guarda en `data/store.json`.
8. El stock se descuenta.
9. Si SMTP está configurado, se envía la confirmación al cliente y al correo administrativo.
10. El frontend limpia el carrito y muestra el resultado.

**[INSERTAR CAPTURA 10: carrito de compras]**  
**[INSERTAR CAPTURA 11: formulario de checkout]**  
**[INSERTAR CAPTURA 12: confirmación del pedido]**

### 8.3 Administración de productos

1. El administrador abre “Administrar”.
2. Inicia sesión con sus credenciales.
3. El backend crea un token y el navegador lo guarda en `localStorage`.
4. El frontend solicita el resumen administrativo con Bearer Token.
5. El administrador puede crear, editar o eliminar productos.
6. El backend valida la sesión y persiste los cambios en `store.json`.

**Credenciales demostrativas por defecto:**

```text
Correo: admin@novastore.com
Contraseña: admin123
```

En un entorno real se deben reemplazar mediante las variables `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

**[INSERTAR CAPTURA 13: formulario de inicio de sesión administrativo]**  
**[INSERTAR CAPTURA 14: panel administrativo]**

### 8.4 Estadísticas

El administrador puede abrir la página de estadísticas después de autenticarse. El backend calcula la información directamente desde los productos y pedidos almacenados, sin requerir una herramienta externa de análisis.

**[INSERTAR CAPTURA 15: panel de estadísticas]**

---

## 9. Modelo de datos

### 9.1 Producto

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Number | Identificador del producto. |
| `title` | String | Nombre visible. |
| `description` | String | Descripción del producto. |
| `price` | Number | Precio base. |
| `stock` | Number | Unidades disponibles. |
| `category` | String | Categoría del producto. |
| `thumbnail` | String | URL o Data URL de la imagen principal. |
| `images` | Array | Imágenes asociadas. |
| `discount` | Number opcional | Descuento porcentual, entre 0 y 90. |

### 9.2 Pedido

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | String | Identificador con formato `NS-timestamp`. |
| `createdAt` | String | Fecha y hora en formato ISO. |
| `customer` | Object | Nombre, correo y dirección del comprador. |
| `items` | Array | Productos y cantidades compradas. |
| `total` | Number | Total calculado del pedido. |
| `status` | String | Estado inicial: `recibido`. |
| `emailSent` | Boolean | Indica si se pudo enviar el correo. |

---

## 10. Validaciones y consideraciones de seguridad

- El servidor valida que el pedido incluya productos y datos del cliente.
- El correo del cliente se valida con una expresión regular básica.
- Se verifica que exista stock suficiente antes de guardar el pedido.
- Las operaciones administrativas requieren un token de sesión.
- El precio, stock y descuento se convierten a valores numéricos en el backend.
- El descuento administrativo está limitado entre 0 y 90 por ciento.
- El pedido se guarda antes del envío del correo para evitar perder la compra si SMTP falla.
- Las credenciales de producción deben mantenerse en `.env` y no publicarse.
- El sistema utiliza un archivo JSON local; para producción se recomienda migrar a una base de datos.
- Los tokens administrativos se mantienen en memoria del proceso y se pierden al reiniciar el servidor.

---

## 11. Pruebas funcionales sugeridas

| Prueba | Resultado esperado | Evidencia |
|---|---|---|
| Abrir `http://localhost:3000` | Se muestra la página principal. | [INSERTAR CAPTURA] |
| Abrir el catálogo | Se cargan los productos. | [INSERTAR CAPTURA] |
| Buscar por nombre | Se filtran los productos coincidentes. | [INSERTAR CAPTURA] |
| Filtrar por categoría | Se muestran solo los productos de la categoría. | [INSERTAR CAPTURA] |
| Agregar al carrito | Aumenta el contador y aparece el producto. | [INSERTAR CAPTURA] |
| Enviar checkout válido | Se registra el pedido y se descuenta stock. | [INSERTAR CAPTURA] |
| Enviar checkout inválido | Se muestra un mensaje de validación. | [INSERTAR CAPTURA] |
| Iniciar sesión administrativa | Se abre el panel de gestión. | [INSERTAR CAPTURA] |
| Crear o editar producto | El catálogo se actualiza. | [INSERTAR CAPTURA] |
| Eliminar producto | Se solicita confirmación y se elimina. | [INSERTAR CAPTURA] |
| Abrir estadísticas | Se muestran indicadores administrativos. | [INSERTAR CAPTURA] |
| Sin SMTP | El pedido se guarda y se indica que el correo está pendiente. | [INSERTAR CAPTURA] |

---

## 12. Limitaciones y mejoras futuras

1. Migrar `data/store.json` a una base de datos como PostgreSQL o MongoDB.
2. Almacenar contraseñas con hash y utilizar un mecanismo de autenticación más robusto.
3. Expirar y persistir sesiones administrativas de forma segura.
4. Añadir roles diferenciados para administradores y operadores.
5. Implementar un endpoint real para las consultas del formulario de ayuda.
6. Incorporar estados de pedido como recibido, preparado, enviado y entregado.
7. Añadir pruebas automatizadas para las rutas y los flujos principales.
8. Validar y limitar el tamaño de las imágenes cargadas.
9. Añadir paginación para catálogos grandes.
10. Usar variables de entorno obligatorias para credenciales en producción.

---

## 13. Conclusiones

El desarrollo de NovaStore permitió aplicar conceptos de desarrollo web frontend y backend en un proyecto integrado. Se implementó un servidor Express capaz de entregar páginas estáticas y exponer una API propia, además de una integración con una API externa mediante Axios.

También se practicó el manejo de datos JSON, la persistencia local, el consumo de servicios desde JavaScript, el uso de `localStorage`, la creación de formularios, la validación de pedidos y la construcción de interfaces responsive con Bootstrap y CSS.

La aplicación cumple un flujo completo de tienda: consulta de productos, navegación, carrito, registro de pedido y administración del catálogo. Como siguiente etapa, la solución puede evolucionar hacia una arquitectura con base de datos, autenticación robusta, pruebas automatizadas y despliegue en un servidor de producción.

---

## 14. Anexo: guía para insertar imágenes

Para completar este documento, se recomienda incluir capturas en los siguientes puntos:

1. Página principal.
2. Catálogo cargado.
3. Búsqueda o filtro aplicado.
4. Carrito.
5. Formulario de checkout.
6. Confirmación de pedido.
7. Terminal con el servidor iniciado.
8. Inicio de sesión administrativo.
9. Panel CRUD.
10. Panel de estadísticas.
11. Código de `index.js`.
12. Código de `index.html`.
13. Código de `app.js`.

Cada imagen debe acompañarse de una breve explicación: qué se observa, qué acción se ejecutó y cuál fue el resultado.
