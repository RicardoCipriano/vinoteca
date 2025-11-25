// routes/account.js
// Express routes to GET and PUT minimal user account settings
const express = require('express');
const router = express.Router();
const pool = require('../db'); // your mysql2 pool

// GET account
router.get('/:id/account', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  try {
    const [rows] = await pool.execute(
      `SELECT u.name, u.email, a.avatar_url, a.country, a.language, a.theme, a.receive_marketing, a.two_factor_enabled
       FROM users u
       LEFT JOIN user_account_settings a ON a.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    const r = rows[0];
    res.json({
      name: r.name,
      email: r.email,
      avatar_url: r.avatar_url,
      country: r.country,
      language: r.language,
      theme: r.theme,
      receive_marketing: !!r.receive_marketing,
      two_factor_enabled: !!r.two_factor_enabled,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT account (upsert)
router.put('/:id/account', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { name, avatar_url, country, language, theme, receive_marketing = 0, two_factor_enabled = 0 } = req.body;
  try {
    // update core user name if provided
    if (name) {
      await pool.execute(`UPDATE users SET name = ? WHERE id = ?`, [name, userId]);
    }
    // upsert into account settings
    const [update] = await pool.execute(
      `UPDATE user_account_settings SET avatar_url=?, country=?, language=?, theme=?, receive_marketing=?, two_factor_enabled=? WHERE user_id=?`,
      [avatar_url, country, language, theme, receive_marketing ? 1 : 0, two_factor_enabled ? 1 : 0, userId]
    );
    if (update.affectedRows === 0) {
      await pool.execute(
        `INSERT INTO user_account_settings (user_id, avatar_url, country, language, theme, receive_marketing, two_factor_enabled) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, avatar_url, country, language, theme, receive_marketing ? 1 : 0, two_factor_enabled ? 1 : 0]
      );
    }
    res.json({ message: 'Account saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
