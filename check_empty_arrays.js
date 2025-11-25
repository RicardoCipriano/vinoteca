const { pool } = require('./server/db');

async function checkEmptyArrays() {
  const connection = await pool.getConnection();

  try {
    console.log('=== CHECKING FOR EMPTY ARRAYS IN DATABASE ===\n');
    
    // Check for empty arrays in estilo field
    const [rows] = await connection.execute(`
      SELECT user_id, estilo, momentos, personalidade 
      FROM user_taste_profile 
      WHERE estilo IS NOT NULL AND estilo != ''
    `);
    
    console.log('Found', rows.length, 'taste profiles:');
    
    rows.forEach(row => {
      console.log(`\nUser ${row.user_id}:`);
      
      // Parse estilo
      try {
        const estilo = JSON.parse(row.estilo);
        console.log(`  estilo: ${JSON.stringify(estilo)} (length: ${estilo.length})`);
        if (estilo.length === 0) {
          console.log('  ⚠️  EMPTY ARRAY DETECTED in estilo!');
        }
      } catch (e) {
        console.log(`  estilo: ${row.estilo} (parse error)`);
      }
      
      // Parse momentos
      try {
        const momentos = JSON.parse(row.momentos);
        console.log(`  momentos: ${JSON.stringify(momentos)} (length: ${momentos.length})`);
        if (momentos.length === 0) {
          console.log('  ⚠️  EMPTY ARRAY DETECTED in momentos!');
        }
      } catch (e) {
        console.log(`  momentos: ${row.momentos} (parse error)`);
      }
      
      console.log(`  personalidade: ${row.personalidade}`);
    });
    
    // Check for completely null/empty fields
    const [nullRows] = await connection.execute(`
      SELECT user_id, estilo, momentos, personalidade 
      FROM user_taste_profile 
      WHERE estilo IS NULL OR estilo = ''
    `);
    
    console.log(`\n=== USERS WITH NULL/EMPTY ESTILO: ${nullRows.length} ===`);
    nullRows.forEach(row => {
      console.log(`User ${row.user_id}: estilo=${row.estilo}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    connection.release();
  }
}

checkEmptyArrays();