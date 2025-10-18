import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { title, encabezado, description, image_url, is_featured, is_photo_of_week } = req.body;
    const { data, error } = await supabase
      .from('news')
      .update({ title, encabezado, description, image_url, is_featured, is_photo_of_week })
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
