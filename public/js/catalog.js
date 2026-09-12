/** Controlador ligero del catálogo completo, separado del estado editorial del home. */
const productosCatalogo = [];
let carritoCatalogo = JSON.parse(localStorage.getItem('shomistore-carrito') || '[]');
const descuentosCatalogo = [10, 15, 20, 0, 12, 0, 18];

const nombresCategoriaCatalogo = {
    beauty: 'Belleza', fragrances: 'Fragancias', furniture: 'Hogar y muebles', groceries: 'Alimentación',
    'home-decoration': 'Decoración', 'kitchen-accessories': 'Cocina', laptops: 'Portátiles',
    'mens-shirts': 'Camisas de hombre', 'mens-shoes': 'Calzado de hombre', 'mobile-accessories': 'Accesorios móviles',
    smartphones: 'Smartphones', 'sports-accessories': 'Accesorios deportivos', sunglasses: 'Gafas de sol',
    tablets: 'Tabletas', tops: 'Prendas superiores', 'womens-bags': 'Bolsos de mujer', 'womens-dresses': 'Vestidos de mujer'
};

const $ = (selector) => document.querySelector(selector);
const precio = (value) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'USD' }).format(value);
const categoria = (value) => nombresCategoriaCatalogo[value] || value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const esElectronico = (product) => ['laptops', 'mobile-accessories', 'smartphones', 'tablets'].includes(product.category);
const descuento = (product) => Number(product.price) > 100 ? 30 : (Number.isFinite(Number(product.discount)) ? Number(product.discount) : descuentosCatalogo[Math.abs(Number(product.id)) % descuentosCatalogo.length]);

function crearTarjetaCatalogo(product) {
    const amount = descuento(product);
    const finalPrice = product.price * (1 - amount / 100);
    const column = document.createElement('div');
    column.className = 'col-12 col-sm-6 col-lg-4 col-xl-3';
    column.innerHTML = `<article class="product-card"><div class="image-wrap"><img class="product-image" src="${product.thumbnail}" alt="${product.title}" loading="lazy">${amount ? `<span class="discount-badge">-${amount}%</span>` : ''}</div><div class="product-body"><span class="category-label">${categoria(product.category)}</span><h3 class="product-name">${product.title}</h3>${esElectronico(product) ? '<p class="member-offer">Oferta exclusiva para socios</p>' : ''}<div class="price-row"><span class="price-label">${product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}</span><span class="prices"><strong class="product-price">${precio(finalPrice)}</strong>${amount ? `<del>${precio(product.price)}</del>` : ''}</span></div><button class="quick-add" type="button" data-agregar-catalogo="${product.id}" ${product.stock < 1 ? 'disabled' : ''}>+ Agregar al carrito</button></div></article>`;
    return column;
}

function renderCatalogo() {
    const query = $('#buscadorCatalogo').value.toLowerCase().trim();
    const category = $('#filtroCatalogo').value;
    const order = $('#ordenCatalogo').value;
    let visible = productosCatalogo.filter((product) => product.title.toLowerCase().includes(query) && (!category || product.category === category));
    if (order === 'price-asc') visible.sort((a, b) => a.price - b.price);
    if (order === 'price-desc') visible.sort((a, b) => b.price - a.price);
    if (order === 'name-asc') visible.sort((a, b) => a.title.localeCompare(b.title));
    $('#listaCatalogo').replaceChildren(...visible.map(crearTarjetaCatalogo));
    $('#contadorCatalogoProductos').textContent = `${visible.length} productos encontrados`;
}

function actualizarCarrito(id) {
    const product = productosCatalogo.find((item) => item.id === id);
    if (!product) return;
    const existing = carritoCatalogo.find((item) => item.id === id);
    const finalPrice = product.price * (1 - descuento(product) / 100);
    if (existing) existing.quantity += 1;
    else carritoCatalogo.push({ id, title: product.title, price: finalPrice, thumbnail: product.thumbnail, quantity: 1 });
    localStorage.setItem('shomistore-carrito', JSON.stringify(carritoCatalogo));
    $('#contadorCatalogo').textContent = carritoCatalogo.reduce((total, item) => total + item.quantity, 0);
}

async function cargarCatalogo() {
    const response = await fetch('/api/productos');
    productosCatalogo.splice(0, productosCatalogo.length, ...(await response.json()));
    const categories = [...new Set(productosCatalogo.map((product) => product.category))].sort();
    $('#filtroCatalogo').append(...categories.map((value) => new Option(categoria(value), value)));
    $('#estadoCatalogo').classList.add('d-none');
    renderCatalogo();
}

document.querySelectorAll('#buscadorCatalogo, #filtroCatalogo, #ordenCatalogo').forEach((control) => control.addEventListener('input', renderCatalogo));
document.addEventListener('click', (event) => {
    const add = event.target.closest('[data-agregar-catalogo]');
    if (add) actualizarCarrito(Number(add.dataset.agregarCatalogo));
});
$('#contadorCatalogo').textContent = carritoCatalogo.reduce((total, item) => total + item.quantity, 0);
cargarCatalogo();
