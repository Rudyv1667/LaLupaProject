const API_URL = "http://localhost:3000/api"; // 👈 agregar /api

const tableBody = document.querySelector('#news-table tbody');
const formContainer = document.getElementById('form-container');
const form = document.getElementById('news-form');
const btnAdd = document.getElementById('btn-add');
const btnCancel = document.getElementById('btn-cancel');
const formTitle = document.getElementById('form-title');
const imageInput = document.getElementById('image_file');
const imagePreview = document.getElementById('image-preview');
const imageUrlField = document.getElementById('image_url');

// ======================================================
// 🔹 Cargar todas las noticias
// ======================================================
async function loadNews() {
  try {
    const res = await fetch(`${API_URL}/news`);
    if (!res.ok) throw new Error('Error cargando noticias: ' + res.status);
    const data = await res.json();
    renderTable(data);
  } catch (err) {
    console.error(err);
    alert("No se pudieron cargar las noticias. Revisa la consola.");
  }
}

// ======================================================
// 🔹 Renderizar la tabla
// ======================================================
function renderTable(news) {
  tableBody.innerHTML = '';
  news.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(item.created_at).toLocaleString()}</td>
      <td>${item.title || ''}</td>
      <td>${item.encabezado || ''}</td>
      <td>${item.description || ''}</td>
      <td>${item.image_url ? `<img src="${item.image_url}" width="80" style="border-radius:6px;">` : ''}</td>
      <td>${item.is_featured ? '✅' : '❌'}</td>
      <td>${item.is_photo_of_week ? '📷' : '—'}</td>
      <td>
        <button class="edit-btn" onclick="editNews(${item.id})">✏️ Editar</button>
        <button class="delete-btn" onclick="deleteNews(${item.id})">🗑️ Eliminar</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// ======================================================
// 🔹 Vista previa al seleccionar imagen
// ======================================================
imageInput?.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      imagePreview.src = e.target.result;
      imagePreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.src = "";
    imagePreview.style.display = "none";
  }
});

// ======================================================
// 🔹 Subir imagen al backend con manejo robusto de errores
// ======================================================
async function uploadImage(file) {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${API_URL}/news/upload`, { method: "POST", body: formData });

    if (!res.ok) {
      // Intentamos leer texto del error para mostrar detalle
      const text = await res.text();
      throw new Error(`Error subiendo imagen. Código ${res.status}. Respuesta: ${text}`);
    }

    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      throw new Error(`Error parseando respuesta JSON de la subida de imagen. Probablemente la ruta no existe o devolvió HTML.`);
    }

    if (!data.url) throw new Error("No se recibió URL de imagen del backend");

    console.log("✅ Imagen subida:", data.url);
    return data.url;
  } catch (err) {
    console.error("❌ Upload error:", err);
    alert("No se pudo subir la imagen. Revisa la consola.");
    throw err;
  }
}

// ======================================================
// 🔹 Crear o actualizar noticia
// ======================================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('news-id').value;

  let imageUrl = imageUrlField.value;
  const file = imageInput.files[0];

  // Subir imagen si se seleccionó una nueva
  if (file) {
    try {
      imageUrl = await uploadImage(file);
       imageUrlField.value = imageUrl;
    } catch {
      return; // Detener envío si falla la subida
    }
  }

  const payload = {
    title: document.getElementById('title').value,
    encabezado: document.getElementById('encabezado').value,
    description: document.getElementById('description').value,
    image_url: imageUrl,
    is_featured: document.getElementById('is_featured')?.checked || false,
    is_photo_of_week: document.getElementById('is_photo_of_week')?.checked || false
  };

  try {
    const url = id ? `${API_URL}/news/${id}` : `${API_URL}/news`;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Error al ${id ? "actualizar" : "crear"} noticia. Código: ${res.status}`);

    formContainer.style.display = 'none';
    form.reset();
    imagePreview.style.display = 'none';
    loadNews();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

// ======================================================
// 🔹 Editar noticia
// ======================================================
window.editNews = async (id) => {
  try {
    const res = await fetch(`${API_URL}/news/${id}`);
    if (!res.ok) throw new Error('Error al obtener noticia: ' + res.status);
    const item = await res.json();

    document.getElementById('news-id').value = item.id;
    document.getElementById('title').value = item.title || '';
    document.getElementById('encabezado').value = item.encabezado || '';
    document.getElementById('description').value = item.description || '';
    imageUrlField.value = item.image_url || '';
    document.getElementById('is_featured').checked = item.is_featured || false;
    document.getElementById('is_photo_of_week').checked = item.is_photo_of_week || false;
    imageInput.value = '';

    imagePreview.src = item.image_url || '';
    imagePreview.style.display = item.image_url ? "block" : "none";

    formTitle.textContent = 'Editar Noticia';
    formContainer.style.display = 'block';
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

// ======================================================
// 🔹 Eliminar noticia
// ======================================================
window.deleteNews = async (id) => {
  if (!confirm('¿Seguro que deseas eliminar esta noticia?')) return;

  try {
    const res = await fetch(`${API_URL}/news/${id}`, { method: "DELETE" });
    if (!res.ok) {
      let text;
      try {
        text = await res.text();
      } catch { text = ''; }
      throw new Error(`Error al eliminar noticia: ${res.status}. ${text}`);
    }
    loadNews();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

// ======================================================
// 🔹 Botones de control
// ======================================================
btnAdd.addEventListener('click', () => {
  form.reset();
  document.getElementById('news-id').value = '';
  imageInput.value = '';
  imagePreview.style.display = 'none';
  formTitle.textContent = 'Nueva Noticia';
  formContainer.style.display = 'block';
});

btnCancel.addEventListener('click', () => {
  formContainer.style.display = 'none';
  form.reset();
  imageInput.value = '';
  imagePreview.style.display = 'none';
});

// ======================================================
// 🔹 Configurar editores de texto enriquecido (Quill)
// ======================================================
const quillEncabezado = new Quill('#encabezado-editor', {
  theme: 'snow',
  placeholder: 'Escribe el encabezado...',
  modules: {
    toolbar: [['bold', 'italic', 'underline'], [{ 'header': [1, 2, false] }], ['link']]
  }
});

const quillDescription = new Quill('#description-editor', {
  theme: 'snow',
  placeholder: 'Escribe el cuerpo de la noticia...',
  modules: {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'blockquote', 'code-block'],
      ['clean']
    ]
  }
});

// 🔸 Sincronizar contenido antes de enviar el formulario
form.addEventListener('submit', () => {
  document.getElementById('encabezado').value = quillEncabezado.root.innerHTML;
  document.getElementById('description').value = quillDescription.root.innerHTML;
});

// 🔸 Cargar contenido en los editores al editar
window.editNews = async (id) => {
  try {
    const res = await fetch(`${API_URL}/news/${id}`);
    if (!res.ok) throw new Error('Error al obtener noticia: ' + res.status);
    const item = await res.json();

    document.getElementById('news-id').value = item.id;
    document.getElementById('title').value = item.title || '';
    quillEncabezado.root.innerHTML = item.encabezado || '';
    quillDescription.root.innerHTML = item.description || '';
    imageUrlField.value = item.image_url || '';
    document.getElementById('is_featured').checked = item.is_featured || false;
    document.getElementById('is_photo_of_week').checked = item.is_photo_of_week || false;
    imageInput.value = '';

    imagePreview.src = item.image_url || '';
    imagePreview.style.display = item.image_url ? "block" : "none";

    formTitle.textContent = 'Editar Noticia';
    formContainer.style.display = 'block';
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

// ======================================================
// 🔹 Inicializar
// ======================================================
loadNews();
