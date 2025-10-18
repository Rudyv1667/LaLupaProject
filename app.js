// app.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// 🔑 Configuración Supabase
const supabaseUrl = 'https://mjcmbyarnybfqveztupm.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qY21ieWFybnliZnF2ZXp0dXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNjkyNTAsImV4cCI6MjA1NTY0NTI1MH0.xpC9mbG0vDf7SPkrbhx7bYZQ3M87agkkZSixAMrrqaA';
const supabase = createClient(supabaseUrl, supabaseKey);

// estado
let news = [];
let newsOffset = 0;
const newsPerLoad = 3;
let swiperInstance = null;

// ---------- Helpers / Fetchers ----------
async function fetchNews() {
  try {
    // 👇 excluimos las que son photo_of_week
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .or('is_photo_of_week.is.null,is_photo_of_week.eq.false')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching news:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('fetchNews unexpected error', err);
    return [];
  }
}

// 🔎 Búsqueda de noticias
async function searchNews(query) {
  try {
    if (!query.trim()) {
      news = await fetchNews();
      newsOffset = 0;
      const featuredContainer = document.getElementById('featured-container');
      if (featuredContainer) featuredContainer.innerHTML = '';
      renderNewsBlock(featuredContainer);
      return [];
    }

    const { data, error } = await supabase
      .from('news')
      .select('*')
      .or(`title.ilike.%${query}%,encabezado.ilike.%${query}%`)
      .or('is_photo_of_week.is.null,is_photo_of_week.eq.false')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error en búsqueda:', error);
      return [];
    }

    news = data || [];
    newsOffset = 0;

    const featuredContainer = document.getElementById('featured-container');
    if (featuredContainer) {
      featuredContainer.innerHTML = '';
      renderNewsBlock(featuredContainer);
    }
    return news;
  } catch (err) {
    console.error('searchNews unexpected error:', err);
    return [];
  }
}

// ---------- Funciones auxiliares ----------
function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ✅ Nueva función: permite etiquetas básicas seguras
function sanitizeHtml(str = '') {
  return String(str)
    // elimina cualquier <script> o evento sospechoso
    .replace(/<script.*?>.*?<\/script>/gi, '')
    // elimina etiquetas no permitidas
    .replace(/<(?!\/?(b|strong|em|i|p|br|ul|li)\b)[^>]*>/gi, '');
}

async function fetchPhotoOfWeek(photoWeekContainer) {
    // Crear modal si no existe
  if (!document.getElementById('photo-week-modal')) {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'photo-week-modal';
    modalDiv.className = 'modal';
    modalDiv.innerHTML = `
      <span class="modal-close">&times;</span>
      <img class="modal-content" id="modal-img">
      <div id="modal-caption"></div>
    `;
    document.body.appendChild(modalDiv);
  }

  if (!photoWeekContainer) return;

  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('is_photo_of_week', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error al obtener foto de la semana:', error.message || error);
      return;
    }

    if (!data || !data.length) return;

    const photo = data[0];
    photoWeekContainer.innerHTML = `
      <h3>Foto de la Semana</h3>
      <img id="photo-week-img" src="${photo.image_url}" alt="${escapeHtml(photo.title || '')}" style="cursor:pointer;">
      <p class="caption">${photo.caption ? photo.caption : escapeHtml(photo.title || '')}</p>
    `;

    // Modal logic
    const modal = document.getElementById('photo-week-modal');
    const modalImg = document.getElementById('modal-img');
    const modalCaption = document.getElementById('modal-caption');
    const img = document.getElementById('photo-week-img');
    const closeBtn = modal.querySelector('.modal-close');

    img.onclick = function() {
      modal.style.display = "block";
      modalImg.src = this.src;
      modalCaption.textContent = photo.caption || photo.title;
    }

    closeBtn.onclick = function() {
      modal.style.display = "none";
    }

    // Cerrar si clickeas fuera de la imagen
    modal.onclick = function(e) {
      if (e.target === modal) modal.style.display = "none";
    }

  } catch (err) {
    console.error('fetchPhotoOfWeek unexpected error:', err);
  }
}

// ---------- Renderers ----------
function renderNewsBlock(featuredContainer, customNews = null) {
  if (!featuredContainer) return;

  const source = customNews || news;
  const slice = source.slice(newsOffset, newsOffset + newsPerLoad);

  if (!slice.length) {
    const btn = document.getElementById('load-more-btn');
    if (btn) btn.style.display = 'none';
    return;
  }

  const html = slice
    .map(
      (item) => `
    <article class="main-news-item fade-in">
      <a href="article.html?id=${item.id}">
        <img src="${item.image_url}" alt="${escapeHtml(item.title || '')}">
        <div class="text">
          <h3>${sanitizeHtml(item.title || item.encabezado || '')}</h3>
          <p>${sanitizeHtml(item.encabezado || '')}</p>
        </div>
      </a>
    </article>
  `
    )
    .join('');

  let containerList = featuredContainer.querySelector('.main-news-list');
  if (customNews) {
    featuredContainer.innerHTML = `<div class="main-news-list">${html}</div>`;
    newsOffset = slice.length;
  } else {
    if (containerList) {
      containerList.insertAdjacentHTML('beforeend', html);
    } else {
      featuredContainer.innerHTML = `<div class="main-news-list">${html}</div>`;
    }
    newsOffset += newsPerLoad;
  }

  setTimeout(() => {
    document.querySelectorAll('.fade-in').forEach((el) => el.classList.add('visible'));
  }, 50);
}

function renderSidebar(sidebarContainer, source = news) {
  if (!sidebarContainer) return;
  sidebarContainer.innerHTML = source
    .slice(0, 3)
    .map(
      (item) => `
      <article class="card recent-item">
        <a class="recent-link" href="article.html?id=${item.id}">
          <img src="${item.image_url}" alt="${escapeHtml(item.title || '')}" class="recent-thumb">
          <h3>${sanitizeHtml(item.title || '')}</h3>
          <p>${sanitizeHtml(item.encabezado || '')}</p>
        </a>
      </article>
    `
    )
    .join('');
}

function renderCarousel(carouselContainer, source = news) {
  if (!carouselContainer) return;

  const featuredNews = source.filter((item) => item.is_featured);

  if (!featuredNews.length) {
    carouselContainer.innerHTML = '<p>No hay noticias destacadas para mostrar.</p>';
    return;
  }

  carouselContainer.innerHTML = `
    <div class="swiper">
      <div class="swiper-wrapper">
        ${featuredNews
          .slice(0, 3)
          .map(
            (item) => `
          <div class="swiper-slide">
            <a href="article.html?id=${item.id}">
              <img src="${item.image_url}" alt="${escapeHtml(item.title || '')}">
              <h3>${sanitizeHtml(item.title || '')}</h3>
            </a>
          </div>
        `
          )
          .join('')}
      </div>
      <div class="swiper-pagination"></div>
      <div class="swiper-button-prev"></div>
      <div class="swiper-button-next"></div>
    </div>
  `;

  try {
    if (swiperInstance && typeof swiperInstance.destroy === 'function') {
      swiperInstance.destroy(true, true);
      swiperInstance = null;
    }
  } catch (e) {
    console.warn('Error destroying previous swiper', e);
  }

  swiperInstance = new Swiper('.swiper', {
    loop: false,
    watchOverflow: true,
    pagination: { el: '.swiper-pagination', clickable: true },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
  });
}

// ---------- Inicialización ----------
document.addEventListener('DOMContentLoaded', async () => {
  const featuredContainer = document.getElementById('featured-container');
  const sidebarContainer = document.getElementById('news-cards');
  const carouselContainer = document.getElementById('news-carousel');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const photoWeekContainer = document.querySelector('.photo-week');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

  news = await fetchNews();

  if (news && news.length) {
    renderNewsBlock(featuredContainer);
    renderSidebar(sidebarContainer);
    renderCarousel(carouselContainer);
  } else {
    console.log('No hay noticias para mostrar.');
  }

  await fetchPhotoOfWeek(photoWeekContainer);

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => renderNewsBlock(featuredContainer));
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', async () => {
      const query = searchInput.value.trim();
      if (!query) {
        renderNewsBlock(featuredContainer);
        renderSidebar(sidebarContainer);
        renderCarousel(carouselContainer);
        return;
      }

      const results = await searchNews(query);
      if (results.length) {
        renderNewsBlock(featuredContainer, results);
        renderSidebar(sidebarContainer, results);
        renderCarousel(carouselContainer, results);
      } else {
        featuredContainer.innerHTML = `<p>No se encontraron resultados para "${escapeHtml(query)}"</p>`;
        sidebarContainer.innerHTML = '';
        carouselContainer.innerHTML = '';
      }
    });
  }
});
