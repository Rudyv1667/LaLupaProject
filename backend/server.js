import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import newsRoutes from './api/news.js';


dotenv.config();
const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static('public')); // Servir archivos estáticos (HTML, CSS, JS)

// Cliente Supabase con Service Role Key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ==================== RUTAS DE NOTICIAS CRUD ====================
app.use('/api/news', newsRoutes); // 👈 Ahora Express reconoce todas las rutas /api/news/*

// ==================== COMENTARIOS ====================

// Obtener comentarios aprobados de una noticia
app.get('/api/comments/:newsId', async (req, res) => {
  const newsId = Number(req.params.newsId);
  if (!newsId) return res.status(400).json({ error: 'ID inválido' });

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('news_id', newsId)
    .eq('is_approved', true)
    .order('created_at', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Crear un comentario (pendiente de aprobación)
app.post('/api/comments', async (req, res) => {
  const { news_id, author_name, author_email, content } = req.body;

  if (!news_id || !author_name || !content) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const { data, error } = await supabase
    .from('comments')
    .insert([{ news_id, author_name, author_email, content }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// ==================== INICIALIZAR SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
