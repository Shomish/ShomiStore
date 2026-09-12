/**
 * Controlador de ShomiStore.
 * Mantiene el catálogo en memoria, el carrito en localStorage y conecta
 * las acciones de cliente y administración con la API de Express.
 */
const botonCargar = document.getElementById('btnCargar');
const listaProductos = document.getElementById('listaProductos');
const estadoInicial = document.getElementById('estadoInicial');
const estadoCarga = document.getElementById('estadoCarga');
const estadoError = document.getElementById('estadoError');

const $ = (selector) => document.querySelector(selector);
const productos = [];
let carrito = JSON.parse(localStorage.getItem('shomistore-carrito') || '[]');
let favoritos = JSON.parse(localStorage.getItem('shomistore-favoritos') || '[]');
let token = localStorage.getItem('novastore-admin');
let confirmacionPendiente = null;
const nombresCategoria = {
  beauty: 'Belleza',
  fragrances: 'Fragancias',
  furniture: 'Hogar y muebles',
  groceries: 'Alimentación',
  'home-decoration': 'Decoración',
  'kitchen-accessories': 'Cocina',
  laptops: 'Portátiles',
  'mens-shirts': 'Camisas de hombre',
  'mens-shoes': 'Calzado de hombre',
  'mens-watches': 'Relojes de hombre',
  'mobile-accessories': 'Accesorios móviles',
  motorcycle: 'Motocicletas',
  'skin-care': 'Cuidado de la piel',
  smartphones: 'Smartphones',
  'sports-accessories': 'Accesorios deportivos',
  sunglasses: 'Gafas de sol',
  tablets: 'Tabletas',
  tops: 'Prendas superiores',
  vehicle: 'Vehículos',
  'womens-bags': 'Bolsos de mujer',
  'womens-dresses': 'Vestidos de mujer',
  'womens-jewellery': 'Joyería de mujer',
  'womens-shoes': 'Calzado de mujer',
  'womens-watches': 'Relojes de mujer'
};
const descuentos = [10, 15, 20, 0, 12, 0, 18];

// Formatea todos los importes en un solo lugar para mantener consistencia visual.
function precio(value) { return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'USD' }).format(value); }
function abrir(id) { $(`#${id}`).classList.remove('d-none'); }
function cerrar(id) { $(`#${id}`).classList.add('d-none'); }
function guardarCarrito() { localStorage.setItem('shomistore-carrito', JSON.stringify(carrito)); renderCarrito(); }
function guardarFavoritos() { localStorage.setItem('shomistore-favoritos', JSON.stringify(favoritos)); }
function mostrarAviso(titulo, texto) { $('#avisoTitulo').textContent = titulo; $('#avisoTexto').textContent = texto; abrir('modalAviso'); }
function categoriaEnEspanol(categoria) { return nombresCategoria[categoria] || categoria.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function esElectronico(producto) { return ['laptops', 'mobile-accessories', 'smartphones', 'tablets'].includes(producto.category); }
function descuentoProducto(producto) { if (Number(producto.price) > 100) return 30; return Number.isFinite(Number(producto.discount)) ? Number(producto.discount) : descuentos[Math.abs(Number(producto.id)) % descuentos.length]; }
function esFavorito(id) { return favoritos.includes(Number(id)); }

// Abre un diálogo animado y devuelve una promesa para detener el borrado hasta confirmar.
function pedirConfirmacion(titulo, texto) {
  $('#confirmacionTitulo').textContent = titulo;
  $('#confirmacionTexto').textContent = texto;
  abrir('modalConfirmacion');
  return new Promise((resolve) => { confirmacionPendiente = resolve; });
}

function resolverConfirmacion(resultado) {
  cerrar('modalConfirmacion');
  if (confirmacionPendiente) confirmacionPendiente(resultado);
  confirmacionPendiente = null;
}

function crearTarjeta(producto) {
  const columna = document.createElement('div');
  columna.className = 'col-12 col-sm-6 col-lg-4 col-xl-3';
  const descuento = descuentoProducto(producto);
  const precioFinal = producto.price * (1 - descuento / 100);
  columna.innerHTML = `<article class="product-card"><button class="product-open" type="button" data-producto="${producto.id}"><div class="image-wrap"><img class="product-image" src="${producto.thumbnail}" alt="${producto.title}" loading="lazy">${descuento ? `<span class="discount-badge">-${descuento}%</span>` : ''}<span class="favorite-button ${esFavorito(producto.id) ? 'is-favorite' : ''}" role="button" tabindex="0" data-favorito="${producto.id}" aria-label="${esFavorito(producto.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}">♥</span></div><div class="product-body"><span class="category-label">${categoriaEnEspanol(producto.category)}</span><h3 class="product-name">${producto.title}</h3>${esElectronico(producto) ? '<p class="member-offer">Oferta exclusiva para socios</p>' : ''}<div class="price-row"><span class="price-label">${producto.stock > 0 ? `${producto.stock} disponibles` : 'Agotado'}</span><span class="prices"><strong class="product-price">${precio(precioFinal)}</strong>${descuento ? `<del>${precio(producto.price)}</del>` : ''}</span></div></div></button><button class="quick-add" type="button" data-agregar="${producto.id}" ${producto.stock < 1 ? 'disabled' : ''}>+ Agregar al carrito</button></article>`;
  return columna;
}

function renderProductos() {
  const query = $('#buscador').value.toLowerCase().trim();
  const categoria = $('#filtroCategoria').value;
  const orden = $('#ordenar').value;
  let visibles = productos.filter((product) => product.title.toLowerCase().includes(query) && (!categoria || product.category === categoria));
  if (orden === 'price-asc') visibles.sort((a, b) => a.price - b.price);
  if (orden === 'price-desc') visibles.sort((a, b) => b.price - a.price);
  $('#listaProductos').replaceChildren(...visibles.map(crearTarjeta));
  $('#contador').textContent = `${visibles.length} productos`;
}

/** Pinta una muestra de productos rebajados sin duplicar la lógica de las tarjetas. */
function renderOfertas() {
  const ofertas = productos.filter((product) => descuentoProducto(product) > 0).slice(0, 4);
  $('#listaOfertas').replaceChildren(...ofertas.map(crearTarjeta));
  $('#seccionOfertas').classList.toggle('d-none', !ofertas.length);
}

/** Muestra en portada una selección corta; el catálogo completo vive en catalogo.html. */
function renderNovedades() {
  const novedades = productos.slice(-4).reverse();
  $('#listaNovedades').replaceChildren(...novedades.map(crearTarjeta));
}

/** Muestra accesos de un toque a las categorías disponibles. */
function renderCategorias(categorias) {
  const contenedor = $('#categoriasRapidas');
  contenedor.replaceChildren(...['', ...categorias].map((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = category ? categoriaEnEspanol(category) : 'Todas';
    button.dataset.categoria = category;
    button.addEventListener('click', () => {
      $('#filtroCategoria').value = button.dataset.categoria;
      renderProductos();
    });
    return button;
  }));
}

function renderCarrito() {
  const totalItems = carrito.reduce((sum, item) => sum + item.quantity, 0);
  $('#contadorCarrito').textContent = totalItems;
  $('#totalCarrito').textContent = precio(carrito.reduce((sum, item) => sum + item.price * item.quantity, 0));
  $('#carritoVacio').classList.toggle('d-none', carrito.length > 0);
  $('#btnCheckout').disabled = !carrito.length;
  $('#itemsCarrito').replaceChildren(...carrito.map((item) => {
    const element = document.createElement('div');
    element.className = 'cart-item';
    element.innerHTML = `<img src="${item.thumbnail}" alt=""><div><strong>${item.title}</strong><span>${precio(item.price)}</span><div class="quantity"><button data-cambiar="${item.id}" data-delta="-1" type="button">−</button><b>${item.quantity}</b><button data-cambiar="${item.id}" data-delta="1" type="button">+</button></div></div><button class="remove-item" data-quitar="${item.id}" type="button" aria-label="Quitar">×</button>`;
    return element;
  }));
}

function agregar(id) {
  const producto = productos.find((item) => item.id === id);
  const existente = carrito.find((item) => item.id === id);
  const precioFinal = producto ? producto.price * (1 - descuentoProducto(producto) / 100) : 0;
  if (!producto || existente?.quantity >= producto.stock) return;
  if (existente) existente.quantity += 1;
  else carrito.push({ id, title: producto.title, price: precioFinal, thumbnail: producto.thumbnail, quantity: 1 });
  guardarCarrito();
  mostrarAviso('Producto agregado', `${producto.title} está en tu carrito.`);
}

function mostrarDetalle(id) {
  const producto = productos.find((item) => item.id === id);
  if (!producto) return;
  $('#detalleContenido').innerHTML = `<img src="${producto.thumbnail}" alt="${producto.title}"><div><span class="category-label">${categoriaEnEspanol(producto.category)}</span><h2 id="detalleNombre">${producto.title}</h2><p>${producto.description}</p><strong class="detail-price">${precio(producto.price * (1 - descuentoProducto(producto) / 100))}</strong><p class="stock-copy">${producto.stock} unidades disponibles</p><button class="btn btn-primary-custom" data-agregar="${producto.id}" ${producto.stock < 1 ? 'disabled' : ''}>Agregar al carrito</button></div>`;
  abrir('modalProducto');
}

async function cargarProductos(actualizar = false) {
  $('#btnCargar').disabled = true;
  $('#estadoSincronizacion').textContent = actualizar ? 'Sincronizando novedades...' : 'Cargando catálogo local...';
  $('#estadoInicial').classList.add('d-none');
  $('#estadoError').classList.add('d-none');
  $('#estadoCarga').classList.remove('d-none');
  try {
    const respuesta = await fetch(`/api/productos${actualizar ? '?actualizar=true' : ''}`);
    productos.splice(0, productos.length, ...(await respuesta.json()));
    $('#filtroCategoria').replaceChildren(new Option('Todas las categorías', ''));
    const categorias = [...new Set(productos.map((product) => product.category))].sort();
    $('#filtroCategoria').append(...categorias.map((category) => new Option(category, category)));
    renderCategorias(categorias);
    renderOfertas();
    renderNovedades();
    $('#estadoSincronizacion').textContent = actualizar ? `Sincronizado: ${productos.length} productos` : `Local: ${productos.length} productos`;
    $('#controlesCatalogo').classList.remove('d-none');
    $('#resumen').classList.remove('d-none');
    renderProductos();
  } catch (error) { $('#estadoSincronizacion').textContent = 'Sin conexión de catálogo'; $('#estadoError').textContent = 'No se pudo cargar la tienda. Revisa que el servidor esté activo.'; $('#estadoError').classList.remove('d-none'); }
  finally { $('#estadoCarga').classList.add('d-none'); $('#btnCargar').disabled = false; }
}

async function iniciarSesion(event) {
  event.preventDefault();
  const submit = event.target.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
    const data = await response.json();
    if (!response.ok) return mostrarAviso('No se pudo iniciar sesión', data.mensaje || 'Revisa tus credenciales.');
    token = data.token; localStorage.setItem('novastore-admin', token); await cargarAdmin();
  } catch (error) { mostrarAviso('Servidor no disponible', 'Inicia NovaStore con npm start e inténtalo nuevamente.'); }
  finally { submit.disabled = false; }
}

function mostrarLoginAdmin(mensaje = '') {
  $('#adminContenido').innerHTML = `<span class="eyebrow">Zona privada</span><h2>Panel de administración</h2><p class="muted-copy">Gestiona productos, stock y pedidos desde aquí.</p>${mensaje ? `<p class="admin-error">${mensaje}</p>` : ''}<form id="formLogin"><label>Correo<input name="email" type="email" value="admin@novastore.com" required></label><label>Contraseña<input name="password" type="password" value="admin123" required></label><button class="btn btn-primary-custom" type="submit">Iniciar sesión</button><small>Demo: admin@novastore.com / admin123</small></form>`;
  $('#formLogin').addEventListener('submit', iniciarSesion);
}

async function cargarAdmin() {
  const response = await fetch('/api/admin/resumen', { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) { token = null; localStorage.removeItem('novastore-admin'); mostrarLoginAdmin('La sesión expiró. Inicia sesión nuevamente.'); return; }
  const data = await response.json();
  $('#adminContenido').innerHTML = `<div class="admin-title"><div><span class="eyebrow">Control central</span><h2>Productos y pedidos</h2></div><div class="admin-actions"><button id="btnEstadisticas" class="btn btn-soft" type="button">Ver estadísticas</button><button id="btnNuevo" class="btn btn-primary-custom" type="button">+ Nuevo producto</button></div></div><div class="stats-row"><div><strong>${data.products.length}</strong><span>Productos</span></div><div><strong>${data.orders.length}</strong><span>Pedidos</span></div><div><strong>${data.lowStock}</strong><span>Stock bajo</span></div></div><section id="estadisticasAdmin" class="admin-statistics d-none"></section><form id="formProducto" class="product-form d-none"><input name="id" type="hidden"><label>Nombre<input name="title" required></label><label>Categoría<input name="category" required></label><label>Descripción<textarea name="description"></textarea></label><label>Precio<input name="price" type="number" min="0" step="0.01" required></label><label>Descuento (%)<input name="discount" type="number" min="0" max="90" step="1" value="0" required></label><label>Stock<input name="stock" type="number" min="0" required></label><label>URL de imagen<input name="thumbnail" type="url" placeholder="https://..."></label><label>Subir imagen<input name="imageFile" type="file" accept="image/*"></label><button class="btn btn-primary-custom" type="submit">Guardar producto</button></form><div class="admin-list">${data.products.map((product) => `<div class="admin-product"><img src="${product.thumbnail}" alt=""><span><strong>${product.title}</strong><small>${categoriaEnEspanol(product.category)} · ${product.stock} en stock${descuentoProducto(product) ? ` · -${descuentoProducto(product)}%` : ''}</small></span><button data-editar="${product.id}" type="button">Editar</button><button data-eliminar="${product.id}" type="button">Eliminar</button></div>`).join('')}</div>`;
  $('#btnNuevo').addEventListener('click', () => { $('#formProducto').reset(); $('#formProducto').classList.remove('d-none'); });
  $('#btnEstadisticas').addEventListener('click', () => { window.location.href = 'estadisticas.html'; });
  $('#formProducto').addEventListener('submit', guardarProducto);
  $('#adminContenido').querySelectorAll('[data-editar]').forEach((button) => button.addEventListener('click', () => editarProducto(data.products.find((item) => item.id === Number(button.dataset.editar)))));
  $('#adminContenido').querySelectorAll('[data-eliminar]').forEach((button) => button.addEventListener('click', () => eliminarProducto(button.dataset.eliminar)));
}

/** Solicita las métricas solo cuando el administrador abre esta vista. */
async function cargarEstadisticas() {
  const contenedor = $('#estadisticasAdmin');
  if (!contenedor.classList.contains('d-none')) { contenedor.classList.add('d-none'); return; }
  const response = await fetch('/api/admin/estadisticas', { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) return mostrarAviso('No se cargaron las estadísticas', 'La sesión administrativa puede haber expirado.');
  const data = await response.json();
  const categorias = Object.entries(data.categories).sort((a, b) => b[1] - a[1]);
  contenedor.innerHTML = `<div class="statistics-head"><div><span class="eyebrow">Lectura del negocio</span><h3>Estadísticas de ShomiStore</h3></div><span class="statistics-live">Actualizado ahora</span></div><div class="statistics-grid"><div><strong>${data.products}</strong><span>Productos activos</span></div><div><strong>${data.totalStock}</strong><span>Unidades en stock</span></div><div><strong>${data.orders}</strong><span>Pedidos recibidos</span></div><div><strong>${precio(data.revenue)}</strong><span>Ventas registradas</span></div></div><div class="statistics-columns"><div><h4>Productos por categoría</h4>${categorias.map(([category, amount]) => `<div class="bar-line"><span>${categoriaEnEspanol(category)}</span><b style="--bar-size:${Math.max(8, amount / Math.max(1, data.products) * 100)}%">${amount}</b></div>`).join('')}</div><div><h4>Más vendidos</h4>${data.topProducts.length ? data.topProducts.map((product, index) => `<div class="ranking-line"><b>${index + 1}</b><span>${product.title}</span><strong>${product.units} uds.</strong></div>`).join('') : '<p class="muted-copy">Aún no hay pedidos para generar un ranking.</p>'}</div></div>`;
  contenedor.classList.remove('d-none');
}

function editarProducto(producto) { const form = $('#formProducto'); form.classList.remove('d-none'); Object.entries(producto).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value; }); }
async function guardarProducto(event) { event.preventDefault(); const formData = new FormData(event.target); const image = formData.get('imageFile'); const data = Object.fromEntries(formData); const id = data.id; delete data.id; delete data.imageFile; if (image?.size) data.thumbnail = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(image); }); const response = await fetch(id ? `/api/admin/productos/${id}` : '/api/admin/productos', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }); if (!response.ok) return mostrarAviso('No se guardó el producto', (await response.json()).mensaje || 'Revisa los datos.'); cerrar('modalAdmin'); await cargarProductos(); mostrarAviso('Producto guardado', 'El catálogo se actualizó correctamente.'); }
// El CRUD exige una confirmación explícita antes de ejecutar una operación destructiva.
async function eliminarProducto(id) { const producto = productos.find((item) => String(item.id) === String(id)); const acepta = await pedirConfirmacion('¿Eliminar producto?', `Se quitará ${producto?.title || 'este producto'} del catálogo.`); if (!acepta) return; const response = await fetch(`/api/admin/productos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) return mostrarAviso('No se pudo eliminar', 'La sesión administrativa puede haber expirado.'); await cargarAdmin(); await cargarProductos(); mostrarAviso('Producto eliminado', 'El catálogo se actualizó correctamente.'); }

document.addEventListener('click', (event) => {
  const favorite = event.target.closest('[data-favorito]'); if (favorite) { const id = Number(favorite.dataset.favorito); favoritos = favoritos.includes(id) ? favoritos.filter((item) => item !== id) : [...favoritos, id]; guardarFavoritos(); renderProductos(); renderOfertas(); return; }
  const add = event.target.closest('[data-agregar]'); if (add) agregar(Number(add.dataset.agregar));
  const open = event.target.closest('.product-open'); if (open) mostrarDetalle(Number(open.dataset.producto));
  const remove = event.target.closest('[data-quitar]'); if (remove) { carrito = carrito.filter((item) => item.id !== Number(remove.dataset.quitar)); guardarCarrito(); }
  const change = event.target.closest('[data-cambiar]'); if (change) { const item = carrito.find((entry) => entry.id === Number(change.dataset.cambiar)); item.quantity = Math.max(0, item.quantity + Number(change.dataset.delta)); carrito = carrito.filter((entry) => entry.quantity); guardarCarrito(); }
  const close = event.target.closest('[data-close]'); if (close) { if (close.dataset.close === 'modalConfirmacion') resolverConfirmacion(false); else cerrar(close.dataset.close); }
});
$('#btnCancelarConfirmacion').addEventListener('click', () => resolverConfirmacion(false));
$('#btnAceptarConfirmacion').addEventListener('click', () => resolverConfirmacion(true));
$('#btnCargar').addEventListener('click', () => { window.location.href = 'catalogo.html'; });
document.querySelectorAll('.link-ofertas').forEach((link) => link.addEventListener('click', async (event) => {
  event.preventDefault();
  if ($('#seccionOfertas').classList.contains('d-none')) await cargarProductos();
  $('#seccionOfertas').scrollIntoView({ behavior: 'smooth', block: 'start' });
}));
['buscador', 'filtroCategoria', 'ordenar'].forEach((id) => $(`#${id}`).addEventListener('input', renderProductos));
$('#btnCarrito').addEventListener('click', () => { renderCarrito(); $('#panelCarrito').classList.add('is-open'); });
$('#btnCheckout').addEventListener('click', () => { cerrar('panelCarrito'); abrir('modalCheckout'); });
$('#btnAdmin').addEventListener('click', async () => { cerrar('modalProducto'); cerrar('modalCheckout'); cerrar('modalContacto'); cerrar('modalConfirmacion'); abrir('modalAdmin'); if (token) await cargarAdmin(); });
$('#formLogin').addEventListener('submit', iniciarSesion);
$('#btnContacto').addEventListener('click', () => abrir('modalContacto'));
$('#formContacto').addEventListener('submit', (event) => { event.preventDefault(); cerrar('modalContacto'); event.target.reset(); mostrarAviso('Consulta enviada', 'Gracias por escribirnos. Te responderemos muy pronto.'); });
$('#btnUbicacion').addEventListener('click', () => { $('#campoUbicacion').value = localStorage.getItem('shomistore-ubicacion') || ''; abrir('modalUbicacion'); });
$('#formUbicacion').addEventListener('submit', (event) => { event.preventDefault(); const location = new FormData(event.target).get('location').trim(); localStorage.setItem('shomistore-ubicacion', location); $('#ubicacionTexto').textContent = location; cerrar('modalUbicacion'); mostrarAviso('Ubicación guardada', `Prepararemos tu experiencia para ${location}.`); });
$('#formCheckout').addEventListener('submit', async (event) => { event.preventDefault(); const submit = event.target.querySelector('button[type="submit"]'); submit.disabled = true; try { const customer = Object.fromEntries(new FormData(event.target)); const response = await fetch('/api/pedidos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer, items: carrito }) }); const data = await response.json(); if (!response.ok) return mostrarAviso('No se pudo enviar el pedido', data.mensaje || 'Revisa los datos e inténtalo nuevamente.'); carrito = []; guardarCarrito(); cerrar('modalCheckout'); mostrarAviso(data.emailSent ? 'Pedido enviado correctamente' : 'Pedido registrado', data.emailSent ? `El pedido ${data.id} fue enviado a ${customer.email}.` : `El pedido ${data.id} fue guardado, pero todavía no se envió a ${customer.email}. Configura SMTP para activar el correo.`); event.target.reset(); } catch (error) { mostrarAviso('Servidor no disponible', 'Abre la tienda desde http://localhost:3000 y verifica que npm start siga ejecutándose.'); } finally { submit.disabled = false; } });
renderCarrito();
$('#ubicacionTexto').textContent = localStorage.getItem('shomistore-ubicacion') || 'Ingresa tu ubicación';
cargarProductos();
