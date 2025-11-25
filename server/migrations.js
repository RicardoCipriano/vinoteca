const { pool } = require('./db');

async function ensureMigrations() {
  const conn = await pool.getConnection();
  try {
    // users table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Add avatar column to users (idempotent)
    try {
      await conn.query('ALTER TABLE users ADD COLUMN avatar VARCHAR(1024) NULL');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE users ADD COLUMN terms_accepted_at TIMESTAMP NULL');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE users ADD COLUMN terms_version VARCHAR(50) NULL');
    } catch (_) {}
    try {
      await conn.query("ALTER TABLE users ADD COLUMN level ENUM('Iniciante','Curioso','Sommelier','Expert') NULL");
    } catch (_) {}

    // countries table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS countries (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        image_path VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure legacy countries table has required columns
    try {
      await conn.query('ALTER TABLE countries ADD COLUMN image_path VARCHAR(255) NULL');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE countries ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
    } catch (_) {}

    // wines table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS wines (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        country VARCHAR(255) NOT NULL,
        country_id INT UNSIGNED NULL,
        region_id INT UNSIGNED NULL,
        winery_id INT UNSIGNED NULL,
        wine_type VARCHAR(50) NOT NULL,
        vintage INT,
        alcohol_abv DECIMAL(4,1) NULL,
        image_url TEXT,
        is_favorite TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_wines_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // wine_pairings table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS wine_pairings (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        wine_id INT UNSIGNED NOT NULL,
        pairing VARCHAR(255) NOT NULL,
        INDEX (wine_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // harmonizations table (list of available pairing options)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS harmonizations (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // grapes table (uvas) and link from wines
    await conn.query(`
      CREATE TABLE IF NOT EXISTS grapes (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    // add columns tinto/branco if not exist
    try {
      await conn.query('ALTER TABLE grapes ADD COLUMN tinto TINYINT(1) NOT NULL DEFAULT 0');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE grapes ADD COLUMN branco TINYINT(1) NOT NULL DEFAULT 0');
    } catch (_) {}
    // add intensidade column (leve, medio, encorpado)
    try {
      await conn.query("ALTER TABLE grapes ADD COLUMN intensidade ENUM('leve','medio','encorpado') NULL");
    } catch (_) {}
    // add espumante/rose/champagne flags
    try {
      await conn.query('ALTER TABLE grapes ADD COLUMN espumante TINYINT(1) NOT NULL DEFAULT 0');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE grapes ADD COLUMN rose TINYINT(1) NOT NULL DEFAULT 0');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE grapes ADD COLUMN champagne TINYINT(1) NOT NULL DEFAULT 0');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE wines ADD COLUMN grape_id INT UNSIGNED NULL');
    } catch (_) {}
    // regions table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS regions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        country_id INT UNSIGNED NOT NULL,
        name VARCHAR(255) NOT NULL,
        UNIQUE KEY uniq_region_country (country_id, name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    // wineries table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS wineries (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        country_id INT UNSIGNED NOT NULL,
        region_id INT UNSIGNED NULL,
        name VARCHAR(255) NOT NULL,
        UNIQUE KEY uniq_winery_country_region (country_id, region_id, name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    // Ensure legacy schemas have required columns
    try {
      await conn.query('ALTER TABLE wines ADD COLUMN country VARCHAR(255) NULL');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE wines ADD COLUMN wine_type VARCHAR(50) NULL');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE wines ADD COLUMN vintage INT NULL');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE wines ADD COLUMN region_id INT UNSIGNED NULL');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE wines ADD COLUMN winery_id INT UNSIGNED NULL');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE wines ADD COLUMN alcohol_abv DECIMAL(4,1) NULL');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE wines ADD COLUMN image_url TEXT NULL');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE wines ADD COLUMN is_favorite TINYINT(1) NOT NULL DEFAULT 0');
    } catch (_) {}
    // add facts_description column for Facts section (separate from tasting notes)
    try {
      await conn.query('ALTER TABLE wines ADD COLUMN facts_description TEXT NULL');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE wines ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE wines ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE wines ADD INDEX idx_wines_grape_id (grape_id)');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE wines ADD CONSTRAINT fk_wines_grape FOREIGN KEY (grape_id) REFERENCES grapes(id)');
    } catch (_) {}

    // add index and FK for country_id if not exists
    try {
      await conn.query('ALTER TABLE wines ADD INDEX idx_wines_country_id (country_id)');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE wines ADD CONSTRAINT fk_wines_country FOREIGN KEY (country_id) REFERENCES countries(id)');
    } catch (_) {}
    // add indexes and FKs for region_id and winery_id
    try {
      await conn.query('ALTER TABLE wines ADD INDEX idx_wines_region_id (region_id)');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE wines ADD INDEX idx_wines_winery_id (winery_id)');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE wines ADD CONSTRAINT fk_wines_region FOREIGN KEY (region_id) REFERENCES regions(id)');
    } catch (_) {}
    try {
      await conn.query('ALTER TABLE wines ADD CONSTRAINT fk_wines_winery FOREIGN KEY (winery_id) REFERENCES wineries(id)');
    } catch (_) {}

    try {
      const [[frIdRow]] = await conn.query("SELECT id FROM countries WHERE name = 'França' LIMIT 1");
      const frId = frIdRow?.id || null;
      if (frId) {
        await conn.query('INSERT IGNORE INTO regions (country_id, name) VALUES (?, ?), (?, ?)', [frId, 'Bordeaux', frId, 'Champagne']);
      }
    } catch (_) {}
    try {
      const [[brIdRow]] = await conn.query("SELECT id FROM countries WHERE name = 'Brasil' LIMIT 1");
      const brId = brIdRow?.id || null;
      if (brId) {
        await conn.query('INSERT IGNORE INTO regions (country_id, name) VALUES (?, ?)', [brId, 'Serra Gaúcha']);
      }
    } catch (_) {}
    try {
      const [[arIdRow]] = await conn.query("SELECT id FROM countries WHERE name = 'Argentina' LIMIT 1");
      const arId = arIdRow?.id || null;
      if (arId) {
        await conn.query('INSERT IGNORE INTO regions (country_id, name) VALUES (?, ?)', [arId, 'Mendoza']);
      }
    } catch (_) {}

    try {
      const [[bordeauxRow]] = await conn.query("SELECT id,country_id FROM regions WHERE name = 'Bordeaux' LIMIT 1");
      if (bordeauxRow?.id) {
        await conn.query('INSERT IGNORE INTO wineries (country_id, region_id, name) VALUES (?, ?, ?)', [bordeauxRow.country_id, bordeauxRow.id, 'Château Margaux']);
      }
    } catch (_) {}
    try {
      const [[champRow]] = await conn.query("SELECT id,country_id FROM regions WHERE name = 'Champagne' LIMIT 1");
      if (champRow?.id) {
        await conn.query('INSERT IGNORE INTO wineries (country_id, region_id, name) VALUES (?, ?, ?)', [champRow.country_id, champRow.id, 'Moët & Chandon']);
      }
    } catch (_) {}
    try {
      const [[serraRow]] = await conn.query("SELECT id,country_id FROM regions WHERE name = 'Serra Gaúcha' LIMIT 1");
      if (serraRow?.id) {
        await conn.query('INSERT IGNORE INTO wineries (country_id, region_id, name) VALUES (?, ?, ?)', [serraRow.country_id, serraRow.id, 'Chandon Brasil']);
      }
    } catch (_) {}
    try {
      const [[mendozaRow]] = await conn.query("SELECT id,country_id FROM regions WHERE name = 'Mendoza' LIMIT 1");
      if (mendozaRow?.id) {
        await conn.query('INSERT IGNORE INTO wineries (country_id, region_id, name) VALUES (?, ?, ?)', [mendozaRow.country_id, mendozaRow.id, 'Catena Zapata']);
      }
    } catch (_) {}

    // seed countries list (PT-BR names mapped to files)
    const seedCountries = [
      { name: 'África do Sul', file: 'africa do sul.png' },
      { name: 'Alemanha', file: 'alemanha.png' },
      { name: 'Argentina', file: 'argentina.png' },
      { name: 'Austrália', file: 'australia.png' },
      { name: 'Bélgica', file: 'belgica.png' },
      { name: 'Brasil', file: 'brasil.png' },
      { name: 'Bulgária', file: 'bulgaria.png' },
      { name: 'Cabo Verde', file: 'cabo verde.png' },
      { name: 'Canadá', file: 'canada.png' },
      { name: 'Chile', file: 'chile.png' },
      { name: 'Espanha', file: 'espanha.png' },
      { name: 'Estados Unidos', file: 'estados unidos.png' },
      { name: 'França', file: 'franca.png' },
      { name: 'Itália', file: 'italia.png' },
      { name: 'Portugal', file: 'portugal.png' },
      { name: 'Romênia', file: 'romenia.png' },
      { name: 'Uruguai', file: 'uruguai.png' }
    ];
    for (const c of seedCountries) {
      try {
        await conn.query(
          'INSERT IGNORE INTO countries (name, image_path) VALUES (?, ?)',
          [c.name, `/countries/${c.file}`]
        );
        // also update existing rows lacking image_path
        await conn.query(
          'UPDATE countries SET image_path = ? WHERE name = ? AND (image_path IS NULL OR image_path = "")',
          [`/countries/${c.file}`, c.name]
        );
      } catch (e) {
        // ignore seed errors
      }
    }

    // seed harmonizations options (PT-BR)
    const seedHarmonizations = [
      'Carne vermelha',
      'Carne branca',
      'Peixe',
      'Frutos do mar',
      'Massa',
      'Queijos',
      'Sobremesas',
      'Vegetais',
      'Comida apimentada'
    ];
    for (const h of seedHarmonizations) {
      try {
        await conn.query('INSERT IGNORE INTO harmonizations (name) VALUES (?)', [h]);
      } catch (_) {}
    }

    // seed common grapes (uvas)
    const seedGrapes = [
      'Cabernet Sauvignon','Merlot','Malbec','Pinot Noir','Syrah','Chardonnay',
      'Sauvignon Blanc','Tempranillo','Sangiovese','Riesling','Torrontés',
      'Carmenère','Tannat','Zinfandel','Nebbiolo','Viognier'
    ];
    for (const g of seedGrapes) {
      try {
        await conn.query('INSERT IGNORE INTO grapes (name) VALUES (?)', [g]);
      } catch (_) {}
    }

    // mark red/white flags (best-effort)
    try {
      const reds = ['Cabernet Sauvignon','Merlot','Malbec','Pinot Noir','Syrah','Tempranillo','Sangiovese','Carmenère','Tannat','Zinfandel','Nebbiolo'];
      const whites = ['Chardonnay','Sauvignon Blanc','Riesling','Torrontés','Viognier'];
      for (const r of reds) {
        try { await conn.query('UPDATE grapes SET tinto = 1 WHERE name = ?', [r]); } catch (_) {}
      }
      for (const w of whites) {
        try { await conn.query('UPDATE grapes SET branco = 1 WHERE name = ?', [w]); } catch (_) {}
      }
    } catch (_) {}

    // seed white grapes with intensidade mapping (idempotent)
    try {
      const whiteGrapesByIntensity = {
        leve: ['Pinot Grigio','Sauvignon Blanc','Verdejo','Moscato','Torrontés','Grüner Veltliner'],
        medio: ['Albariño','Fiano','Chenin Blanc','Riesling'],
        encorpado: ['Garganega','Sémillon','Gewürztraminer','Viognier','Roussanne','Chardonnay']
      };
      for (const intensity of Object.keys(whiteGrapesByIntensity)) {
        const names = whiteGrapesByIntensity[intensity];
        for (const name of names) {
          try {
            await conn.query('INSERT IGNORE INTO grapes (name, intensidade, branco) VALUES (?, ?, 1)', [name, intensity]);
          } catch (_) {}
          try {
            await conn.query('UPDATE grapes SET intensidade = ?, branco = 1, tinto = 0 WHERE name = ?', [intensity, name]);
          } catch (_) {}
        }
      }
    } catch (_) {}

    // update intensidades for red wines (provided list)
    try {
      const redIntensityMap = {
        leve: ['Gamay','Pinot Noir'],
        medio: ['Garnacha','Valpolicella','Carménère','Carmenère','Cabernet Franc','Sangiovese','Merlot','Zinfandel'],
        encorpado: ['Tempranillo','Malbec','Cabernet Sauvignon','Syrah','Pinotage','Tannat']
      };
      for (const intensity of Object.keys(redIntensityMap)) {
        const names = redIntensityMap[intensity];
        for (const name of names) {
          try {
            // Atualiza intensidade e marca como tinto
            await conn.query('UPDATE grapes SET intensidade = ?, tinto = 1, branco = 0 WHERE name = ?', [intensity, name]);
          } catch (_) {}
          try {
            // Se não existe, cria com os flags corretos
            await conn.query('INSERT IGNORE INTO grapes (name, intensidade, tinto, branco) VALUES (?, ?, 1, 0)', [name, intensity]);
          } catch (_) {}
        }
      }
    } catch (_) {}

    // mark typical rosé grapes with rose=1 (idempotent)
    try {
      const roseGrapes = ['Pinot Noir','Merlot','Sangiovese','Malbec','Cabernet Sauvignon','Syrah','Garnacha','Tempranillo'];
      for (const name of roseGrapes) {
        try {
          await conn.query('UPDATE grapes SET rose = 1 WHERE name = ?', [name]);
        } catch (_) {}
      }
    } catch (_) {}
    // ensure user_taste_profile table exists
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS user_taste_profile (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id INT UNSIGNED NOT NULL UNIQUE,
          intensidade ENUM('Leve','Médio','Encorpado') DEFAULT 'Médio',
          estilo JSON DEFAULT (JSON_ARRAY()),
          docura ENUM('Seco','Meio-seco','Doce') DEFAULT 'Seco',
          momentos JSON DEFAULT (JSON_ARRAY()),
          personalidade ENUM('Explorador','Tradicionalista','Estudioso','Social') DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch (_) {}

    // ensure user_consents table exists
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS user_consents (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id INT UNSIGNED NOT NULL,
          policy_version VARCHAR(50) NOT NULL,
          accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          ip_address VARCHAR(64) NULL,
          user_agent VARCHAR(255) NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_consents_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (_) {}

  } finally {
    conn.release();
  }
}

module.exports = { ensureMigrations };