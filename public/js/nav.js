/** Navegación compartida: controla el menú hamburguesa en todas las páginas. */
function cerrarMenuMovil() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.getElementById('menuMovil');
    if (!menuToggle || !mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú');
    document.body.classList.remove('menu-open');
}

// La delegación permite que el menú funcione aunque otra página renderice contenido después.
document.addEventListener('click', (event) => {
    const toggle = event.target.closest('.mobile-menu-toggle');
    if (toggle) {
        const menu = document.getElementById(toggle.getAttribute('aria-controls'));
        if (!menu) return;
        const isOpen = menu.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
        document.body.classList.toggle('menu-open', isOpen);
        return;
    }
    if (event.target.closest('#menuMovil a')) cerrarMenuMovil();
});
