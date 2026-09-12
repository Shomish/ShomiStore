# ShomiStore

Tienda web con catálogo persistente, carrito, pedidos, login de administrador y CRUD de productos.

## Ejecución

Requisitos: Node.js 18 o superior.

```powershell
npm install
npm start
```

Abre únicamente `http://localhost:3000`. Debe existir una sola instancia de `node index.js`; si hay varias, detén las anteriores antes de iniciar de nuevo.

## Administración

Credenciales demo:

- Correo: `admin@novastore.com`
- Contraseña: `admin123`

Desde **Administrar** se pueden crear, editar y eliminar productos, subir imágenes, modificar stock y consultar el número de pedidos.

### Cómo se envía un pedido

El correo escrito por el comprador recibe la confirmación del pedido. Además, `ORDER_NOTIFICATION_EMAIL` recibe una copia administrativa; por defecto es `freleida@gmail.com`. Ambos destinatarios se envían en el mismo mensaje SMTP.

El flujo es:

1. El comprador completa nombre, correo y dirección.
2. NovaStore valida el correo y el stock.
3. Guarda el pedido en `data/store.json`.
4. Envía el resumen al comprador y a la cuenta administrativa.

Si SMTP no está configurado, el pedido se conserva y la interfaz informa que el correo quedó pendiente.

## Envío de pedidos por correo

Copia `.env.example` como `.env` y completa las credenciales SMTP. Con Gmail se debe usar una contraseña de aplicación.

```powershell
Copy-Item .env.example .env
npm start
```

El pedido siempre se guarda en `data/store.json`. Cuando SMTP está configurado, también se envía un resumen al correo que el cliente escribió en checkout.
