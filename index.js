require('dotenv').config();

/**
 * API principal de ShomiStore.
 *
 * Responsabilidades:
 * - Servir la aplicación web.
 * - Persistir productos y pedidos en data/store.json.
 * - Proteger el CRUD con una sesión administrativa.
 * - Enviar una copia del pedido al cliente y a ORDER_NOTIFICATION_EMAIL.
 */
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');

// Express sirve la tienda, la API de productos y el panel administrativo.
const app = express();
const PORT = process.env.PORT || 3000;
const dataDirectory = path.join(__dirname, 'data');
const dataFile = path.join(dataDirectory, 'store.json');
const sessions = new Map();
const orderNotificationEmail = process.env.ORDER_NOTIFICATION_EMAIL || 'freleida@gmail.com';
const mailConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
const mailer = mailConfigured ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
}) : null;

app.use(express.json({ limit: '8mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/salud', (req, res) => res.json({ ok: true, emailConfigured: mailConfigured }));

function readStore() {
  if (!fs.existsSync(dataFile)) return { products: [], orders: [] };
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

/** Persiste el estado completo de la tienda en almacenamiento local. */
function writeStore(store) {
  fs.mkdirSync(dataDirectory, { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

/** Rechaza las operaciones CRUD que no tengan una sesión válida. */
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) return res.status(401).json({ mensaje: 'Sesión de administrador inválida.' });
  next();
}

/** Importa el catálogo inicial una sola vez; después se usa el catálogo local. */
async function ensureProducts() {
  const store = readStore();
  if (store.products.length) return store;
  try {
    const response = await axios.get('https://dummyjson.com/products', { timeout: 10000 });
    store.products = response.data.products.map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      stock: product.stock ?? 10,
      category: product.category,
      thumbnail: product.thumbnail,
      images: product.images || [product.thumbnail]
    }));
    writeStore(store);
  } catch (error) {
    console.error('No se pudo importar el catálogo inicial:', error.message);
  }
  return store;
}

/** Sincroniza novedades externas sin borrar productos creados desde el CRUD local. */
async function syncExternalProducts(store) {
  const response = await axios.get('https://dummyjson.com/products?limit=100', { timeout: 10000 });
  const localById = new Map(store.products.map((product) => [product.id, product]));
  response.data.products.forEach((product) => {
    if (!localById.has(product.id)) store.products.push({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      stock: product.stock ?? 10,
      category: product.category,
      thumbnail: product.thumbnail,
      images: product.images || [product.thumbnail]
    });
  });
  writeStore(store);
  return store;
}

app.get('/api/productos', async (req, res) => {
  let store = await ensureProducts();
  if (req.query.actualizar === 'true') {
    try { store = await syncExternalProducts(store); } catch (error) { console.error('No se pudieron sincronizar novedades:', error.message); }
  }
  res.json(store.products);
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@novastore.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (email !== adminEmail || password !== adminPassword) return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { email });
  res.json({ token, email });
});

app.get('/api/admin/resumen', requireAdmin, async (req, res) => {
  const store = await ensureProducts();
  const lowStock = store.products.filter((product) => product.stock < 5).length;
  res.json({ products: store.products, orders: store.orders, lowStock });
});

/** Calcula indicadores de negocio para el apartado independiente de estadísticas. */
app.get('/api/admin/estadisticas', requireAdmin, async (req, res) => {
  const store = await ensureProducts();
  const categoryTotals = store.products.reduce((totals, product) => {
    totals[product.category] = (totals[product.category] || 0) + 1;
    return totals;
  }, {});
  const productSales = store.orders.flatMap((order) => order.items || []).reduce((sales, item) => {
    sales[item.title] = (sales[item.title] || 0) + Number(item.quantity || 0);
    return sales;
  }, {});
  const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([title, units]) => ({ title, units }));
  res.json({
    products: store.products.length,
    totalStock: store.products.reduce((total, product) => total + Number(product.stock || 0), 0),
    lowStock: store.products.filter((product) => product.stock < 5).length,
    orders: store.orders.length,
    revenue: store.orders.reduce((total, order) => total + Number(order.total || 0), 0),
    categories: categoryTotals,
    topProducts
  });
});

app.post('/api/admin/productos', requireAdmin, (req, res) => {
  const store = readStore();
  const product = { id: Date.now(), ...req.body, price: Number(req.body.price), stock: Number(req.body.stock), discount: Number(req.body.discount || 0) };
  if (!product.title || !product.category || Number.isNaN(product.price) || Number.isNaN(product.stock) || product.discount < 0 || product.discount > 90) return res.status(400).json({ mensaje: 'Completa nombre, categoría, precio, stock y un descuento entre 0 y 90.' });
  product.thumbnail = product.thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
  product.images = [product.thumbnail];
  store.products.unshift(product);
  writeStore(store);
  res.status(201).json(product);
});

app.put('/api/admin/productos/:id', requireAdmin, (req, res) => {
  const store = readStore();
  const index = store.products.findIndex((product) => String(product.id) === req.params.id);
  if (index < 0) return res.status(404).json({ mensaje: 'Producto no encontrado.' });
  store.products[index] = { ...store.products[index], ...req.body, price: Number(req.body.price), stock: Number(req.body.stock), discount: Number(req.body.discount || 0) };
  if (store.products[index].discount < 0 || store.products[index].discount > 90) return res.status(400).json({ mensaje: 'El descuento debe estar entre 0 y 90.' });
  writeStore(store);
  res.json(store.products[index]);
});

app.delete('/api/admin/productos/:id', requireAdmin, (req, res) => {
  const store = readStore();
  store.products = store.products.filter((product) => String(product.id) !== req.params.id);
  writeStore(store);
  res.status(204).end();
});

app.post('/api/pedidos', async (req, res) => {
  const store = await ensureProducts();
  const { items, customer } = req.body;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!Array.isArray(items) || !items.length || !customer?.name || !customer?.address || !emailPattern.test(customer.email)) {
    return res.status(400).json({ mensaje: 'Completa nombre, correo válido, dirección y productos.' });
  }
  for (const item of items) {
    const product = store.products.find((candidate) => candidate.id === item.id);
    if (!product || product.stock < item.quantity) return res.status(400).json({ mensaje: `Stock insuficiente para ${product?.title || 'un producto'}.` });
  }
  const order = { id: `NS-${Date.now()}`, createdAt: new Date().toISOString(), customer, items, total: items.reduce((sum, item) => sum + item.price * item.quantity, 0), status: 'recibido' };
  items.forEach((item) => { const product = store.products.find((candidate) => candidate.id === item.id); product.stock -= item.quantity; });
  store.orders.unshift(order);
  writeStore(store);
  // El pedido se guarda antes del envío para no perderlo si el proveedor SMTP falla.
  let emailSent = false;
  if (mailer) {
    try {
      await mailer.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: [orderNotificationEmail, customer.email].filter((email, index, emails) => emails.indexOf(email) === index),
        subject: `ShomiStore | Pedido ${order.id}`,
        text: `Nuevo pedido recibido en ShomiStore.\n\nPedido: ${order.id}\nCliente: ${customer.name || ''}\nCorreo del cliente: ${customer.email}\nTotal: ${order.total.toFixed(2)} USD\nDirección: ${customer.address}\n\nEl pedido fue registrado correctamente.`
      });
      emailSent = true;
    } catch (error) {
      console.error('Pedido guardado, pero no se pudo enviar el correo:', error.message);
    }
  }
  res.status(201).json({ ...order, emailSent });
});

// El mensaje de arranque facilita encontrar la URL local durante el desarrollo.
app.listen(PORT, () => console.log(`ShomiStore disponible en http://localhost:${PORT}`));
