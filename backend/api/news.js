import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ImageKit from 'imagekit';
import multer from 'multer';

dotenv.config();
const router = express.Router();

// ===============================================
// 🔹 Validar variables de entorno
// ===============================================
const requiredEnv = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'IMAGEKIT_PUBLIC_KEY',
  'IMAGEKIT_PRIVATE_KEY',
  'IMAGEKIT_URL_ENDPOINT'
];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ ERROR: La variable ${key} no está definida en .env`);
  }
}

// ===============================================
// 🔹 Inicializar Supabase
// ===============================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===============================================
// 🔹 Inicializar ImageKit
// ===============================================
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT.trim()
});

// ===============================================
// 🔹 Configurar Multer
// ===============================================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ===============================================
// 📸 RUTA: Obtener firma segura para frontend
// ===============================================
router.get('/upload-auth', (req, res) => {
  try {
    const authParams = imagekit.getAuthenticationParameters();
    authParams.publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    res.json(authParams);
  } catch (err) {
    console.error('❌ Error generando firma de ImageKit:', err);
    res.status(500).json({ error: 'Error generando firma de ImageKit', details: err.message });
  }
});

// ===============================================
// 📸 RUTA: Subir imagen al backend
// ===============================================
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    // Validar archivo
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    // Subir a ImageKit
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: req.file.originalname,
      folder: '/news-images'
    });

    // Devolver JSON con URL
    res.status(200).json({
      success: true,
      url: uploadResponse.url,
      thumbnailUrl: uploadResponse.thumbnailUrl,
      fileId: uploadResponse.fileId
    });
  } catch (err) {
    console.error('❌ Error subiendo imagen a ImageKit:', err.response || err);

    // Siempre devolver JSON aunque falle
    res.status(500).json({
      success: false,
      error: 'Error subiendo imagen a ImageKit',
      details: err.message || err.toString()
    });
  }
});

// ===============================================
// 📰 CRUD DE NOTICIAS
// ===============================================
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('❌ Error cargando noticias:', err);
    res.status(500).json({ error: 'Error cargando noticias', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from('news').select('*').eq('id', id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('❌ Error obteniendo noticia:', err);
    res.status(500).json({ error: 'Error obteniendo la noticia', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, encabezado, description, image_url, is_featured, is_photo_of_week } = req.body;
    const { data, error } = await supabase
      .from('news')
      .insert([{ title, encabezado, description, image_url, is_featured, is_photo_of_week }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('❌ Error creando noticia:', err);
    res.status(500).json({ error: 'Error creando noticia', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { title, encabezado, description, image_url, is_featured, is_photo_of_week } = req.body;
    const { data, error } = await supabase
      .from('news')
      .update({ title, encabezado, description, image_url, is_featured, is_photo_of_week })
      .eq('id', id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error('❌ Error actualizando noticia:', err);
    res.status(500).json({ error: 'Error actualizando noticia', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from('news').delete().eq('id', id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error('❌ Error eliminando noticia:', err);
    res.status(500).json({ error: 'Error eliminando noticia', details: err.message });
  }
});

export default router;
