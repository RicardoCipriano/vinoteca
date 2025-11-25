const dotenv = require('dotenv');
dotenv.config();

const { pool } = require('./db');

async function normalizeWineTypes() {
  const idsToChampagne = [9, 12, 13, 14];
  const idsToEspumante = [8];
  const idsToRose = [10];
  const result = {
    updatedSpecific: 0,
    updatedFortificado: 0,
    distribution: [],
    columnType: null,
  };

  const conn = await pool.getConnection();
  try {
    // Detect column type and add 'champagne' to ENUM if needed
    const [colRows] = await conn.query(
      `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wines' AND COLUMN_NAME = 'wine_type'`
    );
    const colType = colRows[0]?.COLUMN_TYPE || null;
    result.columnType = colType;
    const isEnum = colType && colType.toLowerCase().startsWith('enum(');
    if (isEnum) {
      // Parse enum values
      const match = colType.match(/^enum\((.*)\)$/i);
      const valuesRaw = match ? match[1] : '';
      const values = valuesRaw
        .split(',')
        .map((v) => v.trim().replace(/^'(.*)'$/, '$1'));

      // Ensure 'champagne' and 'rosé' exist in ENUM
      const toAdd = [];
      if (!values.includes('champagne')) toAdd.push('champagne');
      if (!values.includes('rosé')) toAdd.push('rosé');
      if (toAdd.length > 0) {
        const newValues = [...values, ...toAdd];
        const enumDef = `ENUM(${newValues.map((v) => `'${v}'`).join(',')})`;
        await conn.query(
          `ALTER TABLE wines MODIFY COLUMN wine_type ${enumDef} NOT NULL`
        );
      }
    }

    if (idsToChampagne.length > 0) {
      const inClause = idsToChampagne.join(',');
      const [r1] = await conn.query(
        `UPDATE wines SET wine_type = 'champagne' WHERE id IN (${inClause})`
      );
      result.updatedSpecific = r1.affectedRows || 0;
      const [targetRows] = await conn.query(
        `SELECT id, wine_type FROM wines WHERE id IN (${inClause}) ORDER BY id`
      );
      result.targeted = targetRows;
    }

    const [r2] = await conn.query(
      "UPDATE wines SET wine_type = 'champagne' WHERE LOWER(wine_type) LIKE 'fortific%'"
    );
    result.updatedFortificado = r2.affectedRows || 0;

    // Set targeted IDs to their intended types
    if (idsToEspumante.length > 0) {
      const inClause = idsToEspumante.join(',');
      const [r3] = await conn.query(
        `UPDATE wines SET wine_type = 'espumante' WHERE id IN (${inClause})`
      );
      result.updatedEspumante = r3.affectedRows || 0;
      const [targetRowsE] = await conn.query(
        `SELECT id, wine_type FROM wines WHERE id IN (${inClause}) ORDER BY id`
      );
      result.targetedEspumante = targetRowsE;
    }

    if (idsToRose.length > 0) {
      const inClause = idsToRose.join(',');
      const [r4] = await conn.query(
        `UPDATE wines SET wine_type = 'rose' WHERE id IN (${inClause})`
      );
      result.updatedRose = r4.affectedRows || 0;
      const [targetRowsR] = await conn.query(
        `SELECT id, wine_type FROM wines WHERE id IN (${inClause}) ORDER BY id`
      );
      result.targetedRose = targetRowsR;
    }

    // If ENUM and there are no remaining 'fortificado', drop it from options
    if (isEnum) {
      const [fortLeft] = await conn.query(
        "SELECT COUNT(*) AS cnt FROM wines WHERE LOWER(wine_type) LIKE 'fortific%'"
      );
      const remaining = fortLeft[0]?.cnt || 0;
      if (remaining === 0) {
        // Re-read current enum values and remove 'fortificado'
        const [colRows2] = await conn.query(
          `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wines' AND COLUMN_NAME = 'wine_type'`
        );
        const colType2 = colRows2[0]?.COLUMN_TYPE || null;
        const match2 = colType2?.match(/^enum\((.*)\)$/i);
        const valuesRaw2 = match2 ? match2[1] : '';
        const values2 = valuesRaw2
          .split(',')
          .map((v) => v.trim().replace(/^'(.*)'$/, '$1'))
          .filter((v) => v !== 'fortificado');
        const enumDef2 = `ENUM(${values2.map((v) => `'${v}'`).join(',')})`;
        await conn.query(
          `ALTER TABLE wines MODIFY COLUMN wine_type ${enumDef2} NOT NULL`
        );
      }
    }

    const [rows] = await conn.query(
      "SELECT wine_type, COUNT(*) AS cnt FROM wines GROUP BY wine_type ORDER BY wine_type"
    );
    result.distribution = rows;

    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Normalization error:', e?.message || e);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

normalizeWineTypes();