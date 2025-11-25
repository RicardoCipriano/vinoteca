const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');
const { ensureMigrations } = require('./migrations');

dotenv.config();

const app = express();
const PORT = 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const IS_PROD = String(process.env.NODE_ENV).toLowerCase() === 'production';
if (IS_PROD && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET missing');
}
// In-memory map for password reset codes (dev/test). In production, store in DB and email.
const resetCodes = new Map();
const resetRate = new Map();
function allowReset(email, ip) {
  const key = `${ip}:${String(email).toLowerCase()}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const limit = 5;
  const e = resetRate.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > e.resetAt) {
    e.count = 0;
    e.resetAt = now + windowMs;
  }
  if (e.count >= limit) return false;
  e.count += 1;
  resetRate.set(key, e);
  return true;
}

const corsOptions = IS_PROD
  ? { origin: process.env.CORS_ORIGIN || false, credentials: true }
  : { origin: true, credentials: true };
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
// Increase body size limit to avoid 413 Payload Too Large for base64 images
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static serving for countries flags and uploads
const rootDir = path.join(__dirname, '..');
app.use('/countries', express.static(path.join(rootDir, 'countries')));
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));
// Static serving for background and other images
app.use('/image', express.static(path.join(rootDir, 'image')));

// Persistent OCR worker to avoid reloading languages on every request
let ocrWorker = null;
let ocrReady = false;
async function initOcrWorker() {
  return false;
}


// Normalize incoming wine type to canonical values
function canonicalizeWineType(raw) {
  const s = String(raw || '').toLowerCase().trim();
  if (!s) return 'outro';
  const plain = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const has = (q) => plain.includes(q);
  if (has('champ')) return 'champagne';
  if (has('espum') || has('spark')) return 'espumante';
  if (has('rose') || has('rosad')) return 'rosé';
  if (has('branc') || plain === 'white') return 'branco';
  if (has('tint') || plain === 'red') return 'tinto';
  if (has('fortific')) return 'champagne';
  return 'outro';
}

// Auth middleware
function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Health
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/legal/privacy', async (req, res) => {
  try {
    const candidates = [
      path.join(__dirname, '..', 'politica_privacidade.txt'),
      path.resolve(process.cwd(), 'politica_privacidade.txt'),
    ];
    let content = null;
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          content = fs.readFileSync(p, 'utf8');
          break;
        } catch (_) {}
      }
    }
    if (!content) return res.status(404).json({ error: 'Not found' });
    res.json({ content });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Debug: schema validation summary
app.get('/debug/schema', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const tables = ['users', 'countries', 'regions', 'wineries', 'wines', 'wine_pairings', 'harmonizations', 'grapes'];
        const expected = {
          users: ['id','name','email','password_hash','created_at'],
          countries: ['id','name','image_path','created_at'],
          regions: ['id','country_id','name'],
          wineries: ['id','country_id','region_id','name'],
          wines: ['id','user_id','title','description','facts_description','country','country_id','region_id','winery_id','grape_id','wine_type','vintage','alcohol_abv','image_url','is_favorite','created_at','updated_at'],
          wine_pairings: ['id','wine_id','pairing'],
          harmonizations: ['id','name'],
          grapes: ['id','name','tinto','branco','intensidade','espumante','rose','champagne']
        };
      const result = {};
      for (const t of tables) {
        const [rows] = await conn.query(
          'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
          [t]
        );
        const present = rows.map(r => r.COLUMN_NAME);
        const missing = expected[t].filter(c => !present.includes(c));
        // count rows
        let count = 0;
        try {
          const [cntRows] = await conn.query(`SELECT COUNT(*) as cnt FROM ${t}`);
          count = cntRows[0]?.cnt ?? 0;
        } catch (_) {}
        result[t] = { present, missing, count };
      }
      const [fkRows] = await conn.query(
        `SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('wines','wine_pairings','regions','wineries') AND REFERENCED_TABLE_NAME IS NOT NULL`
      );
      res.json({ tables: result, foreignKeys: fkRows });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error', message: e?.message, code: e?.code, sqlMessage: e?.sqlMessage });
  }
});

// Debug: list ALL tables, columns and counts directly from INFORMATION_SCHEMA
app.get('/debug/tables', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [tRows] = await conn.query(
        'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME'
      );
      const tables = tRows.map(r => r.TABLE_NAME);
      const columns = {};
      const counts = {};
      for (const t of tables) {
        try {
          const [cRows] = await conn.query(
            'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION',
            [t]
          );
          columns[t] = cRows.map(r => r.COLUMN_NAME);
        } catch (_) {
          columns[t] = [];
        }
        try {
          const [[cntRow]] = await conn.query(`SELECT COUNT(*) AS cnt FROM \`${t}\``);
          counts[t] = Number(cntRow?.cnt || 0);
        } catch (_) {
          counts[t] = null;
        }
      }
      res.json({ tables, columns, counts });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Debug: run migrations on demand
app.post('/debug/fix', async (req, res) => {
  try {
    await ensureMigrations();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to run migrations' });
  }
});

// Reference endpoints to list harmonizations and grapes
app.get('/harmonizations', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT id, name FROM harmonizations ORDER BY name ASC');
      res.json(rows);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error', message: e?.message, code: e?.code, sqlMessage: e?.sqlMessage });
  }
});

app.get('/grapes', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT id, name, tinto, branco, intensidade, espumante, rose, champagne FROM grapes ORDER BY name ASC');
      res.json(rows);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/regions', authMiddleware, async (req, res) => {
  const { country, country_id } = req.query || {};
  try {
    const conn = await pool.getConnection();
    try {
      let cid = country_id ? Number(country_id) : null;
      if (!cid && country) {
        const [rows] = await conn.query('SELECT id FROM countries WHERE name = ? LIMIT 1', [String(country)]);
        cid = rows.length ? rows[0].id : null;
      }
      if (!cid) return res.json([]);
      const [rows] = await conn.query('SELECT id, country_id, name FROM regions WHERE country_id = ? ORDER BY name ASC', [cid]);
      res.json(rows);
    } finally {
      conn.release();
    }
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/wineries', authMiddleware, async (req, res) => {
  const { region_id, region, country, country_id } = req.query || {};
  try {
    const conn = await pool.getConnection();
    try {
      let rid = region_id ? Number(region_id) : null;
      let cid = country_id ? Number(country_id) : null;
      if (!cid && country) {
        const [cRows] = await conn.query('SELECT id FROM countries WHERE name = ? LIMIT 1', [String(country)]);
        cid = cRows.length ? cRows[0].id : null;
      }
      if (!rid && region && cid) {
        const [rRows] = await conn.query('SELECT id FROM regions WHERE name = ? AND country_id = ? LIMIT 1', [String(region), cid]);
        rid = rRows.length ? rRows[0].id : null;
      }
      if (!rid && region) {
        const [rRows] = await conn.query('SELECT id FROM regions WHERE name = ? LIMIT 1', [String(region)]);
        rid = rRows.length ? rRows[0].id : null;
      }
      if (!rid && !cid) return res.json([]);
      let rows;
      if (rid) {
        [rows] = await conn.query('SELECT id, country_id, region_id, name FROM wineries WHERE region_id = ? ORDER BY name ASC', [rid]);
      } else {
        [rows] = await conn.query('SELECT id, country_id, region_id, name FROM wineries WHERE country_id = ? ORDER BY name ASC', [cid]);
      }
      res.json(rows);
    } finally {
      conn.release();
    }
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload endpoint: accepts base64 data URL and saves to /uploads
app.post('/upload', authMiddleware, async (req, res) => {
  const { imageData } = req.body || {};
  if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:image')) {
    return res.status(400).json({ error: 'Imagem inválida' });
  }
  try {
    const uploadsDir = path.join(rootDir, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const match = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
    const mime = match?.[1] || 'image/png';
    const base64 = match?.[2] || '';
    if (!base64) return res.status(400).json({ error: 'Dados da imagem ausentes' });
    const ext = mime.split('/')[1].replace('+xml', '').replace('jpeg', 'jpg');
    const filename = `wine_${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
    return res.json({ url: `/uploads/${filename}` });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao salvar imagem' });
  }
});

app.get('/account', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT u.name, u.email, u.avatar AS avatar, u.level AS level, a.avatar_url, a.country, a.language, a.theme, a.receive_marketing, a.two_factor_enabled
         FROM users u
         LEFT JOIN user_account_settings a ON a.user_id = u.id
         WHERE u.id = ?`,
        [req.user.id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      const r = rows[0];
      res.json({
        name: r.name,
        email: r.email,
        avatar: r.avatar,
        level: r.level || null,
        avatar_url: r.avatar_url,
        country: r.country,
        language: r.language,
        theme: r.theme,
        receive_marketing: !!r.receive_marketing,
        two_factor_enabled: !!r.two_factor_enabled,
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/account', authMiddleware, async (req, res) => {
  const { name, email, avatar_url, avatar, country, language, theme, receive_marketing = 0, two_factor_enabled = 0 } = req.body || {};
  try {
    const conn = await pool.getConnection();
    try {
      if (name && typeof name === 'string') {
        await conn.query('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
      }
      if (email && typeof email === 'string') {
        const [existing] = await conn.query('SELECT id FROM users WHERE email = ? AND id <> ?', [email, req.user.id]);
        if (existing.length) {
          return res.status(409).json({ error: 'Email already registered' });
        }
        await conn.query('UPDATE users SET email = ? WHERE id = ?', [email, req.user.id]);
      }
      const newAvatar = avatar ?? avatar_url ?? null;
      if (newAvatar && typeof newAvatar === 'string') {
        try {
          await conn.query('UPDATE users SET avatar = ? WHERE id = ?', [newAvatar, req.user.id]);
        } catch (_) {}
      }
      const [update] = await conn.query(
        'UPDATE user_account_settings SET avatar_url=?, country=?, language=?, theme=?, receive_marketing=?, two_factor_enabled=? WHERE user_id=?',
        [newAvatar || null, country || null, language || null, theme || 'system', receive_marketing ? 1 : 0, two_factor_enabled ? 1 : 0, req.user.id]
      );
      if (update.affectedRows === 0) {
        await conn.query(
          'INSERT INTO user_account_settings (user_id, avatar_url, country, language, theme, receive_marketing, two_factor_enabled) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [req.user.id, newAvatar || null, country || null, language || 'pt-BR', theme || 'system', receive_marketing ? 1 : 0, two_factor_enabled ? 1 : 0]
        );
      }
      res.json({ ok: true });
    } finally {
      conn.release();
    }
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/account', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const conn = await pool.getConnection();
  try {
    console.log('[DEBUG] DELETE /account for user_id:', userId);
    await conn.beginTransaction();
    try { await conn.query('DELETE FROM wine_pairings WHERE wine_id IN (SELECT id FROM wines WHERE user_id = ?)', [userId]); } catch (_) {}
    try { await conn.query('DELETE FROM wines WHERE user_id = ?', [userId]); } catch (_) {}
    try { await conn.query('DELETE FROM user_taste_profile WHERE user_id = ?', [userId]); } catch (_) {}
    try { await conn.query('DELETE FROM user_account_settings WHERE user_id = ?', [userId]); } catch (_) {}
    const [delUser] = await conn.query('DELETE FROM users WHERE id = ?', [userId]);
    await conn.commit();
    console.log('[DEBUG] Account deleted, affected:', delUser?.affectedRows || 0);
    res.json({ ok: true, deleted: true });
  } catch (e) {
    console.error('[ERROR] DELETE /account failed:', e?.message || e);
    try { await conn.rollback(); } catch (_) {}
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

// User taste profile (preferências de gosto)
app.get('/taste-profile', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      console.log('[DEBUG] Getting taste profile for user_id:', req.user.id);
      const [rows] = await conn.query(
        'SELECT intensidade, estilo, docura, momentos, personalidade FROM user_taste_profile WHERE user_id = ? LIMIT 1',
        [req.user.id]
      );
      console.log('[DEBUG] Found rows:', rows.length);
      if (!rows.length) {
        console.log('[DEBUG] No taste profile found, returning empty data');
        return res.json({ intensidade: null, estilo: [], docura: null, momentos: [], personalidade: null });
      }
      const p = rows[0];
      console.log('[DEBUG] Raw data from DB:', p);
      let estilo = [];
      let momentos = [];
      try { estilo = JSON.parse(p.estilo || '[]'); } catch {}
      try { momentos = JSON.parse(p.momentos || '[]'); } catch {}
      const result = {
        intensidade: p.intensidade || null,
        estilo,
        docura: p.docura || null,
        momentos,
        personalidade: p.personalidade || null,
      };
      console.log('[DEBUG] Returning taste profile:', result);
      res.json(result);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('[DEBUG] Error getting taste profile:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/taste-profile', authMiddleware, async (req, res) => {
  const { intensidade, estilo = [], docura, momentos = [], personalidade } = req.body || {};
  console.log('[DEBUG] PUT taste-profile received:', { intensidade, estilo, docura, momentos, personalidade });
  const allowedIntensidade = ['Leve','Médio','Encorpado'];
  const allowedDocura = ['Seco','Meio-seco','Doce'];
  const allowedPersonalidade = ['Explorador','Tradicionalista','Estudioso','Social'];
  const safeIntensidade = intensidade && allowedIntensidade.includes(intensidade) ? intensidade : null;
  const safeDocura = docura && allowedDocura.includes(docura) ? docura : null;
  const safePersonalidade = personalidade && allowedPersonalidade.includes(personalidade) ? personalidade : null;
  const safeEstilo = Array.isArray(estilo) ? estilo : [];
  const safeMomentos = Array.isArray(momentos) ? momentos : [];
  console.log('[DEBUG] Sanitized data:', { safeIntensidade, safeEstilo, safeDocura, safeMomentos, safePersonalidade });
  try {
    const conn = await pool.getConnection();
    try {
      const [update] = await conn.query(
        'UPDATE user_taste_profile SET intensidade=?, estilo=?, docura=?, momentos=?, personalidade=?, updated_at = NOW() WHERE user_id=?',
        [safeIntensidade, JSON.stringify(safeEstilo), safeDocura, JSON.stringify(safeMomentos), safePersonalidade, req.user.id]
      );
      console.log('[DEBUG] Update result:', update.affectedRows);
      if (update.affectedRows === 0) {
        console.log('[DEBUG] No rows updated, inserting new record');
        await conn.query(
          'INSERT INTO user_taste_profile (user_id, intensidade, estilo, docura, momentos, personalidade, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [req.user.id, safeIntensidade, JSON.stringify(safeEstilo), safeDocura, JSON.stringify(safeMomentos), safePersonalidade]
        );
      }
      console.log('[DEBUG] Taste profile saved successfully');
      res.json({ ok: true });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('[DEBUG] Error saving taste profile:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/wines/recommendations', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      console.log('[DEBUG] Getting recommendations for user_id:', req.user.id);
      const [pRows] = await conn.query(
        'SELECT intensidade, estilo, docura, momentos, personalidade FROM user_taste_profile WHERE user_id = ? LIMIT 1',
        [req.user.id]
      );
      console.log('[DEBUG] Found taste profile rows:', pRows.length);
      let intensidade = null;
      let estilos = [];
      if (pRows.length) {
        const p = pRows[0];
        console.log('[DEBUG] Taste profile data:', p);
        intensidade = p.intensidade || null;
        try { estilos = JSON.parse(p.estilo || '[]'); } catch {}
        console.log('[DEBUG] Parsed intensidade:', intensidade);
        console.log('[DEBUG] Parsed estilos:', estilos);
      }
      const mapInt = { 'Leve': 'leve', 'Médio': 'medio', 'Encorpado': 'encorpado' };
      const intKey = intensidade && mapInt[intensidade] ? mapInt[intensidade] : null;
      const wants = {
        tinto: estilos.includes('Tinto'),
        branco: estilos.includes('Branco'),
        rose: estilos.includes('Rosé') || estilos.includes('Rose'),
        espumante: estilos.includes('Espumante') || estilos.includes('Sparkling'),
        champagne: estilos.includes('Champagne')
      };
      let grapes = [];
      {
        const parts = [];
        const params = [];
        if (intKey) { parts.push('intensidade = ?'); params.push(intKey); }
        if (wants.tinto) parts.push('tinto = 1');
        if (wants.branco) parts.push('branco = 1');
        if (wants.rose) parts.push('rose = 1');
        if (wants.espumante) parts.push('espumante = 1');
        if (wants.champagne) parts.push('champagne = 1');
        if (parts.length) {
          const [gRows] = await conn.query(`SELECT name FROM grapes WHERE ${parts.join(' OR ')} ORDER BY name ASC LIMIT 12`, params);
          grapes = gRows.map(r => r.name);
        } else {
          const [gRows] = await conn.query('SELECT name FROM grapes ORDER BY id DESC LIMIT 8');
          grapes = gRows.map(r => r.name);
        }
      }
      const [wRows] = await conn.query(
        `SELECT w.id, w.title, w.country, w.wine_type as wineType, w.vintage, w.image_url as imageUrl, w.is_favorite as isFavorite, w.created_at as createdAt,
                g.name as grape
         FROM wines w
         LEFT JOIN grapes g ON g.id = w.grape_id
         WHERE w.user_id = ? ORDER BY w.id DESC LIMIT 200`,
        [req.user.id]
      );
      const normalizeType = (raw) => {
        const s = String(raw || '').toLowerCase().trim();
        if (!s) return 'outro';
        const plain = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const has = (q) => plain.includes(q);
        if (has('champ')) return 'champagne';
        if (has('espum') || has('spark')) return 'espumante';
        if (has('rose') || has('rosad')) return 'rose';
        if (has('branc') || plain === 'white') return 'branco';
        if (has('tint') || plain === 'red') return 'tinto';
        if (has('fortific')) return 'champagne';
        return 'outro';
      };
      const styleKeys = new Set(
        estilos.map((e) => {
          const m = String(e).toLowerCase();
          if (m.includes('rose')) return 'rose';
          if (m.includes('espum')) return 'espumante';
          return m;
        })
      );
      const recommendedWines = wRows.filter((w) => styleKeys.size ? styleKeys.has(normalizeType(w.wineType)) : true).slice(0, 6);
      console.log('[DEBUG] Final recommendations:', { grapes, recommendedWines: recommendedWines.length });
      res.json({ grapes, recommendedWines });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// OCR endpoint: recebe data URL da imagem e retorna texto, confiança e sugestão
app.post('/ocr', authMiddleware, async (req, res) => {
  const { imageData } = (req.body || {});
  if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:image')) {
    return res.status(400).json({ error: 'Imagem inválida' });
  }
  try {
    const match = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
    const base64 = match?.[2] || '';
    if (!base64) return res.status(400).json({ error: 'Dados da imagem ausentes' });
    const buffer = Buffer.from(base64, 'base64');
    if (!ocrReady || !ocrWorker) {
      return res.status(503).json({ error: 'OCR indisponível' });
    }
    const { data } = await ocrWorker.recognize(buffer);
    const text = (data?.text || '').trim();

    // Confiança média
    let confidence = null;
    try {
      const words = data?.words || [];
      if (!words.length) {
        confidence = data?.confidence ?? null;
      } else {
        const sum = words.reduce((acc, w) => acc + (w?.confidence ?? 0), 0);
        confidence = Math.round((sum / words.length) * 100) / 100;
      }
    } catch {}

    // Sanitização e sugestão
    const allowed = /[^A-Za-zÀ-ÖØ-öø-ÿ0-9'&.,;:%\-\/ \n]/gu;
    const cleaned = text.replace(allowed, ' ').replace(/\s{2,}/g, ' ').trim();
    const extractVintage = (t) => {
      const m = t.match(/\b(19|20)\d{2}\b/);
      return m ? m[0] : undefined;
    };
    const bad = /(ml|%|alcohol|alcool|sulfites|sulfitos|contém|importado|garrafa|lote|volume|teor|bebida|responsável)/i;
    const lines = cleaned.split(/\n+/).map(s => s.trim()).filter(Boolean);
    const filtered = lines.filter(s => s.length >= 3 && !bad.test(s));
    const mostlyLetters = (s) => {
      const letters = (s.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || []).length;
      return letters / Math.max(1, s.length) >= 0.5;
    };
    const content = filtered.filter(mostlyLetters);
    const firstLine = content[0] || '';
    const suggestion = {
      title: firstLine,
      description: cleaned.substring(0, 500),
      vintage: extractVintage(cleaned)
    };

    return res.json({ text, confidence, suggestion });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro no OCR' });
  }
});

// Auth routes
app.post('/auth/register', async (req, res) => {
  const { name, email, password, accept_terms, policy_version } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  if (!accept_terms) {
    return res.status(400).json({ error: 'Você precisa aceitar a Política de Privacidade para criar a conta' });
  }
  try {
    const conn = await pool.getConnection();
    try {
      const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      const hash = await bcrypt.hash(password, 10);
      const [result] = await conn.query(
        'INSERT INTO users (name, email, password_hash, created_at, terms_accepted_at, terms_version) VALUES (?, ?, ?, NOW(), NOW(), ?)',
        [name, email, hash, policy_version || '2025-11-17']
      );
      const userId = result.insertId;
      try {
        await conn.query('INSERT INTO user_consents (user_id, policy_version) VALUES (?, ?)', [userId, policy_version || '2025-11-17']);
      } catch (_) {}
      const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT id, password_hash FROM users WHERE email = ?', [email]);
      if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Request password reset code
app.post('/auth/forgot', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Missing email' });
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '0.0.0.0';
    if (!allowReset(email, ip)) return res.status(429).json({ error: 'Too many requests' });
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
      if (rows.length) {
        const code = Math.random().toString().slice(2, 8);
        const expiresAt = Date.now() + 15 * 60 * 1000;
        resetCodes.set(String(email), { code, expiresAt });
        await sendResetEmail(email, code);
        return res.json(IS_PROD ? { ok: true } : { ok: true, code });
      }
      return res.json({ ok: true });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Reset password using code
app.post('/auth/reset', async (req, res) => {
  const { email, code, new_password } = req.body || {};
  if (!email || !code || !new_password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const entry = resetCodes.get(String(email));
  if (!entry || String(entry.code) !== String(code) || Date.now() > entry.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired code' });
  }
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
      if (!rows.length) return res.status(400).json({ error: 'Invalid email' });
      const userId = rows[0].id;
      const hash = await bcrypt.hash(String(new_password), 10);
      await conn.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
      resetCodes.delete(String(email));
      return res.json({ ok: true });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Current user info
app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT name, email, avatar, level FROM users WHERE id = ?', [req.user.id]);
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      let { name, email, avatar, level } = rows[0];
      const [[winesCountRow]] = await conn.query('SELECT COUNT(*) AS cnt FROM wines WHERE user_id = ?', [req.user.id]);
      const winesCount = Number(winesCountRow?.cnt || 0);
      if (winesCount <= 1) {
        level = null;
        try { await conn.query('UPDATE users SET level = NULL WHERE id = ?', [req.user.id]); } catch (_) {}
      } else {
        const [typesRows] = await conn.query('SELECT DISTINCT wine_type FROM wines WHERE user_id = ?', [req.user.id]);
        const normalizeType = (raw) => {
          const s = String(raw || '').toLowerCase().trim();
          if (!s) return 'outro';
          const plain = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const has = (q) => plain.includes(q);
          if (has('champ')) return 'champagne';
          if (has('espum') || has('spark')) return 'espumante';
          if (has('rose') || has('ros')) return 'rose';
          if (has('branc') || plain === 'white') return 'branco';
          if (has('tint') || plain === 'red') return 'tinto';
          if (has('fortific')) return 'champagne';
          return 'outro';
        };
        const typeSet = new Set(typesRows.map(r => normalizeType(r.wine_type)));
        const uniqueTypes = typeSet.size;
        const [[harmRows]] = await conn.query(
          'SELECT COUNT(DISTINCT wp.pairing) AS cnt FROM wine_pairings wp JOIN wines w ON w.id = wp.wine_id WHERE w.user_id = ?',
          [req.user.id]
        );
        const harmonizationsUsed = Number(harmRows?.cnt || 0);
        const score = winesCount + uniqueTypes * 2 + harmonizationsUsed;
        let computed = 'Iniciante';
        if (score >= 30) computed = 'Expert';
        else if (score >= 15) computed = 'Sommelier';
        else if (score >= 5) computed = 'Curioso';
        level = computed;
        try { await conn.query('UPDATE users SET level = ? WHERE id = ?', [level, req.user.id]); } catch (_) {}
      }
      res.json({ name, email, avatar, level });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/user/level', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [[winesCountRow]] = await conn.query('SELECT COUNT(*) AS cnt FROM wines WHERE user_id = ?', [req.user.id]);
      const winesCount = Number(winesCountRow?.cnt || 0);
      if (winesCount <= 1) {
        try { await conn.query('UPDATE users SET level = NULL WHERE id = ?', [req.user.id]); } catch (_) {}
        return res.json({ level: null, score: 0, winesCount, uniqueTypes: 0, harmonizationsUsed: 0, suggestions: ['Cadastre mais vinhos para receber seu nível'] });
      }
      const [typesRows] = await conn.query('SELECT DISTINCT wine_type FROM wines WHERE user_id = ?', [req.user.id]);
      const normalizeType = (raw) => {
        const s = String(raw || '').toLowerCase().trim();
        if (!s) return 'outro';
        const plain = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const has = (q) => plain.includes(q);
        if (has('champ')) return 'champagne';
        if (has('espum') || has('spark')) return 'espumante';
        if (has('rose') || has('ros')) return 'rose';
        if (has('branc') || plain === 'white') return 'branco';
        if (has('tint') || plain === 'red') return 'tinto';
        if (has('fortific')) return 'champagne';
        return 'outro';
      };
      const typeSet = new Set(typesRows.map(r => normalizeType(r.wine_type)));
      const uniqueTypes = typeSet.size;
      const [[harmRows]] = await conn.query(
        'SELECT COUNT(DISTINCT wp.pairing) AS cnt FROM wine_pairings wp JOIN wines w ON w.id = wp.wine_id WHERE w.user_id = ?',
        [req.user.id]
      );
      const harmonizationsUsed = Number(harmRows?.cnt || 0);
      const score = winesCount + uniqueTypes * 2 + harmonizationsUsed;
      let level = 'Iniciante';
      if (score >= 30) level = 'Expert';
      else if (score >= 15) level = 'Sommelier';
      else if (score >= 5) level = 'Curioso';
      try {
        await conn.query('UPDATE users SET level = ? WHERE id = ?', [level, req.user.id]);
      } catch (_) {}
      const suggestions = [];
      if (!typeSet.has('rose')) suggestions.push('Adicione um vinho Rosé à sua coleção');
      if (!typeSet.has('espumante')) suggestions.push('Experimente um Espumante para diversificar');
      if (harmonizationsUsed < 3) suggestions.push('Inclua novas harmonizações nos seus vinhos');
      if (winesCount < 10) suggestions.push('Cadastre mais vinhos para evoluir seu nível');
      res.json({ level, score, winesCount, uniqueTypes, harmonizationsUsed, suggestions });
    } finally {
      conn.release();
    }
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Wines routes
app.get('/wines', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT w.id, w.title, w.country, w.wine_type as wineType, w.vintage,
                w.region_id as regionId, r.name as regionName,
                w.winery_id as wineryId, wn.name as wineryName,
                g.name as grape,
                w.alcohol_abv as alcoholAbv,
                w.image_url as imageUrl, w.is_favorite as isFavorite,
                w.created_at as createdAt
         FROM wines w
         LEFT JOIN regions r ON r.id = w.region_id
         LEFT JOIN wineries wn ON wn.id = w.winery_id
         LEFT JOIN grapes g ON g.id = w.grape_id
         WHERE w.user_id = ?
         ORDER BY w.id DESC`,
        [req.user.id]
      );
      // compute countryFlag path based on known PT-BR names
      const fileMap = {
        'África do Sul': 'africa do sul.png',
        'Alemanha': 'alemanha.png',
        'Argentina': 'argentina.png',
        'Austrália': 'australia.png',
        'Bélgica': 'belgica.png',
        'Brasil': 'brasil.png',
        'Bulgária': 'bulgaria.png',
        'Cabo Verde': 'cabo verde.png',
        'Canadá': 'canada.png',
        'Chile': 'chile.png',
        'Espanha': 'espanha.png',
        'Estados Unidos': 'estados unidos.png',
        'França': 'franca.png',
        'Itália': 'italia.png',
        'Portugal': 'portugal.png',
        'Romênia': 'romenia.png',
        'Uruguai': 'uruguai.png'
      };
      const out = rows.map(r => ({
        ...r,
        countryFlag: fileMap[r.country] ? `/countries/${fileMap[r.country]}` : undefined,
      }));
      res.json(out);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Wines summary by normalized type for current user
app.get('/wines/summary', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT canonical_type, COUNT(*) as total FROM (
           SELECT CASE
             WHEN LOWER(wine_type) LIKE '%champ%' THEN 'champagne'
             WHEN LOWER(wine_type) LIKE '%espum%' OR LOWER(wine_type) LIKE '%spark%' THEN 'espumante'
             WHEN LOWER(wine_type) LIKE '%rosé%' OR LOWER(wine_type) LIKE '%rose%' OR LOWER(wine_type) LIKE '%rosê%' OR LOWER(wine_type) LIKE '%rosad%' THEN 'rose'
             WHEN LOWER(wine_type) LIKE '%branc%' OR LOWER(wine_type) = 'white' THEN 'branco'
             WHEN LOWER(wine_type) LIKE '%tint%' OR LOWER(wine_type) = 'red' THEN 'tinto'
             WHEN LOWER(wine_type) LIKE '%fortific%' THEN 'champagne'
             ELSE 'outro'
           END AS canonical_type
           FROM wines
           WHERE user_id = ?
         ) mapped
         GROUP BY canonical_type`,
        [req.user.id]
      );
      const counts = { tinto: 0, branco: 0, rose: 0, espumante: 0, champagne: 0, outro: 0 };
      for (const r of rows) {
        const key = r.canonical_type;
        const total = Number(r.total) || 0;
        if (key in counts) counts[key] = total;
      }
      res.json({ counts });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Wine details by id (with description and harmonizations)
app.get('/wines/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT w.id, w.title, w.description, w.facts_description as factsDescription, w.country, w.wine_type as wineType, w.vintage,
                w.region_id as regionId, r.name as regionName,
                w.winery_id as wineryId, wn.name as wineryName,
                g.name as grape,
                w.alcohol_abv as alcoholAbv,
                w.image_url as imageUrl, w.is_favorite as isFavorite,
                w.created_at as createdAt
         FROM wines w
         LEFT JOIN regions r ON r.id = w.region_id
         LEFT JOIN wineries wn ON wn.id = w.winery_id
         LEFT JOIN grapes g ON g.id = w.grape_id
         WHERE w.id = ? AND w.user_id = ?
         LIMIT 1`,
        [id, req.user.id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      const wine = rows[0];
      // pairings
      const [pRows] = await conn.query(
        'SELECT pairing FROM wine_pairings WHERE wine_id = ?',
        [wine.id]
      );
      const pairings = pRows.map((r) => r.pairing);
      // compute countryFlag path based on known PT-BR names
      const fileMap = {
        'África do Sul': 'africa do sul.png',
        'Alemanha': 'alemanha.png',
        'Argentina': 'argentina.png',
        'Austrália': 'australia.png',
        'Bélgica': 'belgica.png',
        'Brasil': 'brasil.png',
        'Bulgária': 'bulgaria.png',
        'Cabo Verde': 'cabo verde.png',
        'Canadá': 'canada.png',
        'Chile': 'chile.png',
        'Espanha': 'espanha.png',
        'Estados Unidos': 'estados unidos.png',
        'França': 'franca.png',
        'Itália': 'italia.png',
        'Portugal': 'portugal.png',
        'Romênia': 'romenia.png',
        'Uruguai': 'uruguai.png'
      };
      const countryFlag = fileMap[wine.country] ? `/countries/${fileMap[wine.country]}` : undefined;
      res.json({ ...wine, pairings, countryFlag });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error', message: e?.message, code: e?.code, sqlMessage: e?.sqlMessage });
  }
});

app.post('/wines', authMiddleware, async (req, res) => {
  const { title, description, country, wineType, vintage, pairings, imageUrl, grape } = req.body || {};
  const regionIdInput = req.body?.region_id ?? req.body?.regionId ?? null;
  const wineryIdInput = req.body?.winery_id ?? req.body?.wineryId ?? null;
  const regionNameInput = req.body?.region_name ?? req.body?.regionName ?? null;
  const wineryNameInput = req.body?.winery_name ?? req.body?.wineryName ?? null;
  const alcoholAbvInput = req.body?.alcohol_abv ?? req.body?.alcoholAbv ?? null;
  const factsDescriptionInput = req.body?.facts_description ?? req.body?.factsDescription ?? null;
  if (!title || !country || !wineType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const conn = await pool.getConnection();
    try {
      // find or create country
      let countryId = null;
      const [cRows] = await conn.query('SELECT id FROM countries WHERE name = ?', [country]);
      if (cRows.length) {
        countryId = cRows[0].id;
      } else {
        // fallback: create without image if not in seed
        const [cres] = await conn.query('INSERT INTO countries (name, image_path) VALUES (?, ?)', [country, '/countries/unknown.png']);
        countryId = cres.insertId;
      }

      // find or create grape (uva)
      let grapeId = null;
      if (grape && typeof grape === 'string' && grape.trim()) {
        const [gRows] = await conn.query('SELECT id FROM grapes WHERE name = ?', [grape.trim()]);
        if (gRows.length) {
          grapeId = gRows[0].id;
        } else {
          const [gres] = await conn.query('INSERT INTO grapes (name) VALUES (?)', [grape.trim()]);
          grapeId = gres.insertId;
        }
      }
  const canonicalType = canonicalizeWineType(wineType);
      // Debug log to trace type normalization during creation
      console.log('[POST /wines] type normalization', {
        raw: wineType,
        canonical: canonicalType,
        userId: req.user.id,
        title
      });
      let regionId = Number(regionIdInput) > 0 ? Number(regionIdInput) : null;
      if (!regionId && regionNameInput && typeof regionNameInput === 'string' && regionNameInput.trim()) {
        const name = regionNameInput.trim();
        const [rRows] = await conn.query('SELECT id FROM regions WHERE name = ? AND country_id = ? LIMIT 1', [name, countryId]);
        if (rRows.length) {
          regionId = rRows[0].id;
        } else {
          const [rInsert] = await conn.query('INSERT INTO regions (country_id, name) VALUES (?, ?)', [countryId, name]);
          regionId = rInsert.insertId;
        }
      }
      let wineryId = Number(wineryIdInput) > 0 ? Number(wineryIdInput) : null;
      if (!wineryId && wineryNameInput && typeof wineryNameInput === 'string' && wineryNameInput.trim()) {
        const name = wineryNameInput.trim();
        if (regionId) {
          const [wRows] = await conn.query('SELECT id FROM wineries WHERE name = ? AND region_id = ? LIMIT 1', [name, regionId]);
          if (wRows.length) {
            wineryId = wRows[0].id;
          } else {
            const [wInsert] = await conn.query('INSERT INTO wineries (country_id, region_id, name) VALUES (?, ?, ?)', [countryId, regionId, name]);
            wineryId = wInsert.insertId;
          }
        } else {
          const [wRows] = await conn.query('SELECT id FROM wineries WHERE name = ? AND country_id = ? AND region_id IS NULL LIMIT 1', [name, countryId]);
          if (wRows.length) {
            wineryId = wRows[0].id;
          } else {
            const [wInsert] = await conn.query('INSERT INTO wineries (country_id, region_id, name) VALUES (?, NULL, ?)', [countryId, name]);
            wineryId = wInsert.insertId;
          }
        }
      }
      const alcoholAbv = alcoholAbvInput != null ? Number(alcoholAbvInput) : null;
      const [result] = await conn.query(
        'INSERT INTO wines (user_id, title, description, facts_description, country, country_id, region_id, winery_id, grape_id, wine_type, vintage, alcohol_abv, image_url, is_favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, false, NOW(), NOW())',
        [req.user.id, title, description || null, factsDescriptionInput || null, country, countryId, regionId, wineryId, grapeId, canonicalType, vintage || null, alcoholAbv, imageUrl || null]
      );
      const wineId = result.insertId;
      if (Array.isArray(pairings) && pairings.length) {
        const values = pairings.map(p => [wineId, p]);
        await conn.query('INSERT INTO wine_pairings (wine_id, pairing) VALUES ?', [values]);
      }
    res.status(201).json({ id: wineId });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update wine by id
app.put('/wines/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, description, country, wineType, vintage, pairings, imageUrl, grape } = req.body || {};
  const regionIdInput = req.body?.region_id ?? req.body?.regionId ?? null;
  const wineryIdInput = req.body?.winery_id ?? req.body?.wineryId ?? null;
  const regionNameInput = req.body?.region_name ?? req.body?.regionName ?? null;
  const wineryNameInput = req.body?.winery_name ?? req.body?.wineryName ?? null;
  const alcoholAbvInput = req.body?.alcohol_abv ?? req.body?.alcoholAbv ?? null;
  const factsDescriptionInput = req.body?.facts_description ?? req.body?.factsDescription ?? null;
  if (!title || !country || !wineType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const conn = await pool.getConnection();
    try {
      // Check ownership
      const [existsRows] = await conn.query('SELECT id FROM wines WHERE id = ? AND user_id = ?', [id, req.user.id]);
      if (!existsRows.length) return res.status(404).json({ error: 'Not found' });

      // find or create country
      let countryId = null;
      const [cRows] = await conn.query('SELECT id FROM countries WHERE name = ?', [country]);
      if (cRows.length) {
        countryId = cRows[0].id;
      } else {
        const [cres] = await conn.query('INSERT INTO countries (name, image_path) VALUES (?, ?)', [country, '/countries/unknown.png']);
        countryId = cres.insertId;
      }

      // find or create grape (uva)
      let grapeId = null;
      if (grape && typeof grape === 'string' && grape.trim()) {
        const [gRows] = await conn.query('SELECT id FROM grapes WHERE name = ?', [grape.trim()]);
        if (gRows.length) {
          grapeId = gRows[0].id;
        } else {
          const [gres] = await conn.query('INSERT INTO grapes (name) VALUES (?)', [grape.trim()]);
          grapeId = gres.insertId;
        }
      }

      const canonicalType = canonicalizeWineType(wineType);
      // Debug log to trace type normalization during update
      console.log('[PUT /wines/:id] type normalization', {
        raw: wineType,
        canonical: canonicalType,
        userId: req.user.id,
        id
      });
      let regionId = Number(regionIdInput) > 0 ? Number(regionIdInput) : null;
      if (!regionId && regionNameInput && typeof regionNameInput === 'string' && regionNameInput.trim()) {
        const name = regionNameInput.trim();
        const [rRows] = await conn.query('SELECT id FROM regions WHERE name = ? AND country_id = ? LIMIT 1', [name, countryId]);
        if (rRows.length) {
          regionId = rRows[0].id;
        } else {
          const [rInsert] = await conn.query('INSERT INTO regions (country_id, name) VALUES (?, ?)', [countryId, name]);
          regionId = rInsert.insertId;
        }
      }
      let wineryId = Number(wineryIdInput) > 0 ? Number(wineryIdInput) : null;
      if (!wineryId && wineryNameInput && typeof wineryNameInput === 'string' && wineryNameInput.trim()) {
        const name = wineryNameInput.trim();
        if (regionId) {
          const [wRows] = await conn.query('SELECT id FROM wineries WHERE name = ? AND region_id = ? LIMIT 1', [name, regionId]);
          if (wRows.length) {
            wineryId = wRows[0].id;
          } else {
            const [wInsert] = await conn.query('INSERT INTO wineries (country_id, region_id, name) VALUES (?, ?, ?)', [countryId, regionId, name]);
            wineryId = wInsert.insertId;
          }
        } else {
          const [wRows] = await conn.query('SELECT id FROM wineries WHERE name = ? AND country_id = ? AND region_id IS NULL LIMIT 1', [name, countryId]);
          if (wRows.length) {
            wineryId = wRows[0].id;
          } else {
            const [wInsert] = await conn.query('INSERT INTO wineries (country_id, region_id, name) VALUES (?, NULL, ?)', [countryId, name]);
            wineryId = wInsert.insertId;
          }
        }
      }
      const alcoholAbv = alcoholAbvInput != null ? Number(alcoholAbvInput) : null;
      await conn.query(
        'UPDATE wines SET title = ?, description = ?, facts_description = ?, country = ?, country_id = ?, region_id = ?, winery_id = ?, grape_id = ?, wine_type = ?, vintage = ?, alcohol_abv = ?, image_url = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
        [title, description || null, factsDescriptionInput || null, country, countryId, regionId, wineryId, grapeId, canonicalType, vintage || null, alcoholAbv, imageUrl || null, id, req.user.id]
      );

      // Replace pairings
      await conn.query('DELETE FROM wine_pairings WHERE wine_id = ?', [id]);
      if (Array.isArray(pairings) && pairings.length) {
        const values = pairings.map(p => [Number(id), p]);
        await conn.query('INSERT INTO wine_pairings (wine_id, pairing) VALUES ?', [values]);
      }

      res.json({ ok: true });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete wine by id
app.delete('/wines/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT id FROM wines WHERE id = ? AND user_id = ?', [id, req.user.id]);
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      await conn.query('DELETE FROM wine_pairings WHERE wine_id = ?', [id]);
      await conn.query('DELETE FROM wines WHERE id = ? AND user_id = ?', [id, req.user.id]);
      res.status(204).end();
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/wines/:id/favorite', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT is_favorite FROM wines WHERE id = ? AND user_id = ?', [id, req.user.id]);
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      const current = rows[0].is_favorite === 1 || rows[0].is_favorite === true;
      await conn.query('UPDATE wines SET is_favorite = ?, updated_at = NOW() WHERE id = ?', [!current, id]);
      res.json({ isFavorite: !current });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

async function start() {
  // Ensure DB schema is up-to-date on startup
  try {
    await ensureMigrations();
  } catch (e) {
    console.error('Failed to run migrations:', e);
  }
  // Initialize OCR worker in background
  initOcrWorker().catch(() => {});
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

start();
// Email transporter
let mailer = null;
function getMailer() {
  if (mailer) return mailer;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  mailer = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return mailer;
}

async function sendResetEmail(to, code) {
  const transporter = getMailer();
  if (!transporter) return false;
  const from = process.env.SMTP_FROM || 'no-reply@vinoteca.local';
  const subject = 'Código de redefinição de senha — VINOTECA';
  const text = `Seu código para redefinir a senha é: ${code}. Ele expira em 15 minutos.`;
  const html = `<p>Seu código para redefinir a senha é: <strong>${code}</strong>.</p><p>Ele expira em 15 minutos.</p>`;
  try {
    await transporter.sendMail({ from, to, subject, text, html });
    return true;
  } catch (e) {
    console.error('Email send failed', e);
    return false;
  }
}
