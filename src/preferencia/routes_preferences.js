// routes/preferences.js
// Express routes to GET and PUT user preferences
const express = require('express');
const router = express.Router();
const pool = require('../db'); // adjust to your mysql2/pool instance

// helper to parse JSON columns
const parseJson = (v) => {
  try { return JSON.parse(v); } catch (e) { return []; }
};

// GET preferences
router.get('/:id/preferences', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  try {
    const [rows] = await pool.execute('SELECT * FROM user_taste_profile WHERE user_id = ?', [userId]);
    if (!rows.length) return res.status(404).json({ message: 'No preferences' });
    const p = rows[0];
    res.json({
      intensidade: p.intensidade,
      estilo: parseJson(p.estilo),
      docura: p.docura,
      momentos: parseJson(p.momentos),
      personalidade: p.personalidade,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT preferences (upsert)
router.put('/:id/preferences', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { intensidade, estilo = [], docura, momentos = [], personalidade } = req.body;

  try {
    // upsert: try update first; if affectedRows==0 -> insert
    const [update] = await pool.execute(
      `UPDATE user_taste_profile SET intensidade=?, estilo=?, docura=?, momentos=?, personalidade=? WHERE user_id=?`,
      [intensidade, JSON.stringify(estilo), docura, JSON.stringify(momentos), personalidade, userId]
    );

    if (update.affectedRows === 0) {
      await pool.execute(
        `INSERT INTO user_taste_profile (user_id, intensidade, estilo, docura, momentos, personalidade) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, intensidade, JSON.stringify(estilo), docura, JSON.stringify(momentos), personalidade]
      );
    }

    res.json({ message: 'Preferences saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
