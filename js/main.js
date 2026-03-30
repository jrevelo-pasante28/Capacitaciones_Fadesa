import { SUPABASE_URL, SUPABASE_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_USER_ID } from './config.js';

let supabase = null;

function initSupabase() {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  cargarTemas();
  const temaSelect = document.getElementById('tema');
  const form = document.getElementById('formulario');
  const loading = document.getElementById('loading');
  const success = document.getElementById('success');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    loading.style.display = 'block';
    success.style.display = 'none';
    const nombre = document.getElementById('nombre').value;
    const correo = document.getElementById('correo').value;
    const referido = document.getElementById('referido').value;
    const tema = temaSelect.options[temaSelect.selectedIndex].text;
    const temaId = temaSelect.value;
    const fecha = document.getElementById('fecha').value;
    const correoGeneral = 'jrevelo@fadesa.com';

    try {
      const [supabaseRes, emailRes] = await Promise.all([
        supabase.from('asignaciones').insert({
          nombre,
          correo,
          referido,
          tema_id: temaId,
          tema,
          fecha
        }),
        enviarEmail({
          to_email: correoGeneral,
          nombre,
          correo,
          referido,
          tema,
          fecha
        })
      ]);
      console.log('Supabase insert:', supabaseRes);
      console.log('EmailJS response:', emailRes);
      if (supabaseRes.error) {
        alert('Error al guardar en la base de datos: ' + supabaseRes.error.message);
      } else if (emailRes.status !== 200) {
        alert('Error al enviar el correo.');
      } else {
        success.style.display = 'block';
        form.reset();
      }
    } catch (err) {
      console.error('Error en el envío:', err);
      alert('Ocurrió un error al procesar la solicitud. Revisa la consola para más detalles.');
    } finally {
      loading.style.display = 'none';
    }
  });
});

async function cargarTemas() {
  const temaSelect = document.getElementById('tema');
  const { data, error } = await supabase.from('capacitaciones').select('*');
  console.log('Supabase temas:', data, 'Error:', error);
  if (error) {
    temaSelect.innerHTML = '<option value="">Error al cargar temas</option>';
    return;
  }
  if (!data || data.length === 0) {
    temaSelect.innerHTML = '<option value="">No hay temas disponibles</option>';
    return;
  }
  temaSelect.innerHTML = '<option value="">Seleccione tema</option>';
  data.forEach(tema => {
    temaSelect.innerHTML += `<option value="${tema.id}">${tema.tema}</option>`;
  });
}

function validarFormulario() {
  let valido = true;
  ['nombre', 'correo', 'referido', 'tema', 'fecha'].forEach(id => {
    const el = document.getElementById(id);
    if (!el.value) {
      el.classList.add('input-error');
      valido = false;
    } else {
      el.classList.remove('input-error');
    }
  });
  return valido;
}

function enviarEmail(params) {
  return emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    params,
    EMAILJS_USER_ID
  );
}
