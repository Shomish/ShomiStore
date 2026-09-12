/** Controla la vista independiente de métricas y renueva la sesión cuando hace falta. */
const $ = (selector) => document.querySelector(selector);
const tokenKey = 'novastore-admin';

function precio(value) {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'USD' }).format(value);
}

function categoriaEnEspanol(categoria) {
    return categoria.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mostrarLogin() {
    $('#loginEstadisticas').classList.remove('d-none');
    $('#contenidoEstadisticas').classList.add('d-none');
    $('#estadoEstadisticas').textContent = 'Sesión requerida';
}

/** Dibuja las métricas recibidas del servidor sin depender del panel CRUD. */
function renderEstadisticas(data) {
    const categorias = Object.entries(data.categories).sort((a, b) => b[1] - a[1]);
    const maxCategory = Math.max(1, ...categorias.map(([, amount]) => amount));
    $('#contenidoEstadisticas').innerHTML = `<div class="statistics-head"><div><span class="eyebrow">Lectura del negocio</span><h2>Estadísticas de ShomiStore</h2></div><span class="statistics-live">Sincronizado ahora</span></div><div class="statistics-grid"><div><strong>${data.products}</strong><span>Productos activos</span></div><div><strong>${data.totalStock}</strong><span>Unidades en stock</span></div><div><strong>${data.orders}</strong><span>Pedidos recibidos</span></div><div><strong>${precio(data.revenue)}</strong><span>Ventas registradas</span></div></div><div class="statistics-chart"><h3>Distribución del catálogo</h3><div class="chart-bars">${categorias.slice(0, 8).map(([category, amount]) => `<div class="chart-bar-item"><span>${categoriaEnEspanol(category)}</span><div class="chart-bar-track"><b style="height:${Math.max(8, amount / maxCategory * 100)}%"></b></div><strong>${amount}</strong></div>`).join('')}</div></div><div class="statistics-columns"><div><h3>Productos por categoría</h3>${categorias.map(([category, amount]) => `<div class="bar-line"><span>${categoriaEnEspanol(category)}</span><b style="--bar-size:${Math.max(8, amount / Math.max(1, data.products) * 100)}%">${amount}</b></div>`).join('')}</div><div><h3>Más vendidos</h3>${data.topProducts.length ? data.topProducts.map((product, index) => `<div class="ranking-line"><b>${index + 1}</b><span>${product.title}</span><strong>${product.units} uds.</strong></div>`).join('') : '<p class="muted-copy">Aún no hay pedidos para generar un ranking.</p>'}</div></div>`;
    $('#loginEstadisticas').classList.add('d-none');
    $('#contenidoEstadisticas').classList.remove('d-none');
    $('#estadoEstadisticas').textContent = `Última actualización: ${new Date().toLocaleTimeString('es-PE')}`;
}

async function cargarEstadisticas() {
    const token = localStorage.getItem(tokenKey);
    if (!token) return mostrarLogin();
    const headers = { Authorization: `Bearer ${token}` };
    let response = await fetch('/api/admin/estadisticas', { headers });
    if (response.status === 404) response = await fetch('/api/admin/resumen', { headers });
    if (!response.ok) {
        localStorage.removeItem(tokenKey);
        return mostrarLogin();
    }
    const data = await response.json();
    renderEstadisticas(data.categories ? data : convertirResumen(data));
}

/** Permite usar la página incluso si el servidor abierto aún expone la API anterior. */
function convertirResumen(resumen) {
    const categories = resumen.products.reduce((totals, product) => {
        totals[product.category] = (totals[product.category] || 0) + 1;
        return totals;
    }, {});
    return {
        products: resumen.products.length,
        totalStock: resumen.products.reduce((total, product) => total + Number(product.stock || 0), 0),
        orders: resumen.orders.length,
        revenue: resumen.orders.reduce((total, order) => total + Number(order.total || 0), 0),
        categories,
        topProducts: []
    };
}

$('#formLoginEstadisticas').addEventListener('submit', async (event) => {
    event.preventDefault();
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
    if (!response.ok) return $('#estadoEstadisticas').textContent = 'Credenciales incorrectas';
    const data = await response.json();
    localStorage.setItem(tokenKey, data.token);
    cargarEstadisticas();
});

$('#btnSincronizarEstadisticas').addEventListener('click', async () => {
    $('#estadoEstadisticas').textContent = 'Sincronizando novedades...';
    await fetch('/api/productos?actualizar=true');
    await cargarEstadisticas();
});

cargarEstadisticas();
