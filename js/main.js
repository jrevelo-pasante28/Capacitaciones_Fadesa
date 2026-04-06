import { SUPABASE_URL, SUPABASE_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_USER_ID } from './config.js';

let supabase = null;

function initSupabase() {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  cargarTemas();
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
    const temaSelects = Array.from(document.querySelectorAll('.tema-select'));
    const temaSeleccionados = temaSelects
      .map(select => ({ id: select.value, text: select.options[select.selectedIndex]?.text || '' }))
      .filter(item => item.id);
    const tema = temaSeleccionados.map(item => item.text).join(', ');
    const temaId = temaSeleccionados.map(item => item.id).join(',');
    const fecha = document.getElementById('fecha').value;
    const listaCorreos = 'jrevelo@fadesa.com,jguacho@fadesa.com,eespinoza@fadesa.com,marguello@fadesa.com,wquimi@fadesa.com,fgomez@fadesa.com';
    
    const tema_1 = document.getElementById('tema_1').options[document.getElementById('tema_1').selectedIndex]?.text || '';
    const tema_2 = document.getElementById('tema_2').options[document.getElementById('tema_2').selectedIndex]?.text || '';
    const tema_3 = document.getElementById('tema_3').options[document.getElementById('tema_3').selectedIndex]?.text || '';

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
          to_email: listaCorreos,
          nombre,
          correo,
          referido,
          tema_1,
          tema_2,
          tema_3,
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
  const temaSelects = Array.from(document.querySelectorAll('.tema-select'));
  const { data, error } = await supabase.from('capacitaciones').select('*');
  console.log('Supabase temas:', data, 'Error:', error);
  if (error) {
    temaSelects.forEach(select => {
      select.innerHTML = '<option value="">Error al cargar temas</option>';
    });
    return;
  }
  if (!data || data.length === 0) {
    temaSelects.forEach(select => {
      select.innerHTML = '<option value="">No hay temas disponibles</option>';
    });
    return;
  }
  const optionsHtml = ['<option value="">Seleccione tema</option>'];
  data.forEach(tema => {
    optionsHtml.push(`<option value="${tema.id}">${tema.tema}</option>`);
  });

  temaSelects.forEach(select => {
    select.innerHTML = optionsHtml.join('');
  });
}

function validarFormulario() {
  let valido = true;
  ['nombre', 'correo', 'referido', 'fecha'].forEach(id => {
    const el = document.getElementById(id);
    if (!el.value) {
      el.classList.add('input-error');
      valido = false;
    } else {
      el.classList.remove('input-error');
    }
  });

  const temaSelects = Array.from(document.querySelectorAll('.tema-select'));
  const temasSeleccionados = temaSelects
    .map(select => select.value)
    .filter(value => value);

  const uniqueTemas = new Set(temasSeleccionados);
  if (temasSeleccionados.length === 0) {
    temaSelects[0].classList.add('input-error');
    valido = false;
  } else {
    temaSelects.forEach(select => select.classList.remove('input-error'));
  }

  if (uniqueTemas.size < temasSeleccionados.length) {
    alert('Por favor selecciona temas diferentes en cada campo.');
    valido = false;
  }

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
