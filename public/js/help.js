/** Controla el contacto desde el centro de ayuda sin depender del catálogo. */
const modalContactoAyuda = document.getElementById('modalContactoAyuda');
const formularioContactoAyuda = document.getElementById('formContactoAyuda');

function cerrarContactoAyuda() {
    modalContactoAyuda.classList.add('d-none');
}

document.getElementById('btnContactoAyuda').addEventListener('click', () => {
    modalContactoAyuda.classList.remove('d-none');
});

document.getElementById('cerrarContactoAyuda').addEventListener('click', cerrarContactoAyuda);

modalContactoAyuda.addEventListener('click', (event) => {
    if (event.target === modalContactoAyuda) cerrarContactoAyuda();
});

formularioContactoAyuda.addEventListener('submit', (event) => {
    event.preventDefault();
    formularioContactoAyuda.classList.add('d-none');
    document.getElementById('respuestaContactoAyuda').classList.remove('d-none');
});