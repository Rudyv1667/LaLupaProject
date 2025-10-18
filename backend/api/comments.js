import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// 🔹 Conectar con Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ======================================================
// 🔹 Obtener todos los comentarios
// ======================================================
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ======================================================
// 🔹 Obtener comentarios de una noticia específica
// ======================================================
router.get("/news/:news_id", async (req, res) => {
  const { news_id } = req.params;
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("news_id", news_id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ======================================================
// 🔹 Crear un nuevo comentario
// ======================================================
router.post("/", async (req, res) => {
  const { news_id, author_name, author_email, content } = req.body;

  if (!news_id || !author_name || !content) {
    return res.status(400).json({ error: "Faltan campos obligatorios." });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert([{ news_id, author_name, author_email, content }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ======================================================
// 🔹 Eliminar comentario
// ======================================================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;