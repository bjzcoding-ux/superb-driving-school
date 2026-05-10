const SUPABASE_URL      = process.env.SUPABASE_URL      || 'https://optxzghfpxiedogmcfqx.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wdHh6Z2hmcHhpZWRvZ21jZnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NTQzMjMsImV4cCI6MjA5MzMzMDMyM30.QG18avsseBn51A07sd-8T5j1aucIxluPKeIyUjqyc30';

module.exports = async function handler(req, res) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/students?select=id&limit=1`,
      {
        headers: {
          apikey:        SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase responded with ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json({ ok: true, pingedAt: new Date().toISOString(), rows: data.length });
  } catch (err) {
    console.error('keep-alive error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
};
