// ==================== CONFIGURACIÓN ====================
const BASE_URL = 'https://la-lupa-portal-de-noticias.onrender.com'; // Aquí va tu servidor Node
const params = new URLSearchParams(window.location.search);
const newsId = Number(params.get('id'));
if (!newsId) console.error('No se pasó un ID válido en la URL');

// ==================== Cargar noticia individual ====================
async function loadArticle() {
  if (!newsId) return;

  try {
    const res = await fetch(`${BASE_URL}/api/news/${newsId}`);
    if (!res.ok) throw new Error('No se pudo cargar la noticia.');
    const newsItem = await res.json();

    document.title = `${newsItem.title} | La Lupa`;

    // Meta descripción
    if (newsItem.encabezado) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = newsItem.encabezado;
    }

    const articleContainer = document.getElementById('article-content');
    if (!articleContainer) return;

    articleContainer.innerHTML = `
      <article class="article-detail">
        <img src="${newsItem.image_url}" alt="${newsItem.title}">
        <h1>${newsItem.title}</h1>
        <h3>${newsItem.encabezado}</h3>
        <p>${newsItem.description}</p>
      </article>

      <section class="comments-section">
        <h3>Comentarios</h3>
        <ul id="comments-list"></ul>

        <form id="comment-form">
          <input type="text" id="comment-author" placeholder="Tu nombre" required>
          <input type="email" id="comment-email" placeholder="Tu correo (opcional)">
          <textarea id="comment-content" placeholder="Escribe tu comentario..." required></textarea>
          <button type="submit">Enviar comentario</button>
        </form>
      </section>
    `;

    loadComments();
  } catch (error) {
    console.error('Error al cargar la noticia:', error);
    const articleContainer = document.getElementById('article-content');
    if (articleContainer) articleContainer.innerHTML = `<p>No se pudo cargar la noticia.</p>`;
  }
}

// ==================== Cargar comentarios ====================
async function loadComments() {
  try {
    const res = await fetch(`${BASE_URL}/api/comments/${newsId}`);
    if (!res.ok) throw new Error('No se pudieron cargar los comentarios.');
    const comments = await res.json();

    const list = document.getElementById('comments-list');
    if (!list) return;

    if (!comments.length) {
      list.innerHTML = `<li>No hay comentarios aún. Sé el primero en opinar 👇</li>`;
      return;
    }

    list.innerHTML = comments.map(c => `
      <li class="comment-item">
        <strong>${c.author_name || 'Anónimo'}</strong>
        <p>${c.content}</p>
        <span class="date">${new Date(c.created_at).toLocaleString()}</span>
      </li>
    `).join('');
  } catch (error) {
    console.error('Error al cargar comentarios:', error);
  }
}

// ==================== Enviar comentario ====================
document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'comment-form') return;
  e.preventDefault();

  const author_name = document.getElementById('comment-author').value.trim();
  const author_email = document.getElementById('comment-email').value.trim() || null;
  const content = document.getElementById('comment-content').value.trim();

  if (!author_name || !content) return;

  try {
    const res = await fetch(`${BASE_URL}/api/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ news_id: newsId, author_name, author_email, content })
    });

    const data = await res.json();
    if (!res.ok) throw data;

    document.getElementById('comment-form').reset();
    alert('Comentario enviado exitosamente.');
    loadComments();
  } catch (error) {
    console.error('Error al enviar comentario:', error);
    alert('No se pudo enviar el comentario. Intenta de nuevo.');
  }
});

// ==================== Noticias recientes ====================
async function loadRecentNews() {
  try {
    const res = await fetch(`${BASE_URL}/api/news?recent=true&limit=3`);
    if (!res.ok) throw new Error('No se pudieron cargar las noticias recientes.');
    const news = await res.json();

    const container = document.getElementById('news-cards');
    if (!container) return;

    container.innerHTML = news.map(item => `
      <li class="recent-item">
        <a href="article.html?id=${item.id}" class="recent-link">
          <img src="${item.image_url}" alt="${item.title}" class="recent-thumb">
          <h3>${item.title}</h3>
          <p>${item.encabezado}</p>
        </a>
      </li>
    `).join('');
  } catch (error) {
    console.error('Error al cargar noticias recientes:', error);
  }
}

// ==================== Foto de la semana ====================
async function loadPhotoOfTheWeek() {
  try {
    const res = await fetch(`${BASE_URL}/api/news?photo_of_week=true&limit=1`);
    if (!res.ok) throw new Error('No se pudo cargar la foto de la semana.');
    const photos = await res.json();

    const container = document.querySelector('.photo-week');
    if (!container) return;

    if (!photos.length) {
      container.innerHTML = `<p>No hay foto de la semana todavía.</p>`;
      return;
    }

    const photo = photos[0];
    container.innerHTML = `
      <h3>Foto de la Semana</h3>
      <img src="${photo.image_url}" alt="${photo.title}">
      <p class="caption">${photo.description || ''}</p>
    `;
  } catch (error) {
    console.error('Error cargando Foto de la Semana:', error);
  }
}

// ==================== Inicializar ====================
loadArticle();
loadRecentNews();
loadPhotoOfTheWeek();
