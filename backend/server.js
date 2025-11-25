app.get('/ping', (req, res) => {
  res.send('pong');
});
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import newsRoutes from './api/news.js';

// ==================== CONFIGURACIÓN BASE ====================
dotenv.config();
const app = express();

// Obtener rutas absolutas para evitar errores en Electron
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== MIDDLEWARES ====================
app.use(cors({ origin: '*' }));
app.use(express.json());

// Servir archivos estáticos (frontend)
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// ==================== SUPABASE CLIENT ====================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ==================== RUTAS API ====================

// CRUD de noticias
app.use('/api/news', newsRoutes);

// Comentarios
app.get('/api/comments/:newsId', async (req, res) => {
  try {
    const newsId = Number(req.params.newsId);
    if (!newsId) return res.status(400).json({ error: 'ID inválido' });

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('news_id', newsId)
      .eq('is_approved', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('❌ Error al obtener comentarios:', err.message);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const { news_id, author_name, author_email, content } = req.body;
    if (!news_id || !author_name || !content)
      return res.status(400).json({ error: 'Faltan datos obligatorios' });

    const { data, error } = await supabase
      .from('comments')
      .insert([{ news_id, author_name, author_email, content }])
      .select();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('❌ Error al insertar comentario:', err.message);
    res.status(500).json({ error: 'Error al insertar comentario' });
  }
});

// ==================== RUTA PRINCIPAL ====================
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ==================== 404 MANEJO ====================
app.use((req, res) => {
  console.warn('⚠️ Ruta no encontrada:', req.originalUrl);
  res.status(404).send('404 - Recurso no encontrado');
});

// ==================== INICIALIZAR SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📂 Archivos servidos desde: ${publicPath}`);
});
