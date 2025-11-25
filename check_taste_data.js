const { pool } = require('./server/db');

async function checkTasteProfiles() {
  try {
    console.log('=== CHECKING TASTE PROFILE DATA ===\n');
    
    const [rows] = await pool.query(`
      SELECT user_id, estilo, intensidade, docura, momentos, personalidade 
      FROM user_taste_profile
    `);
    
    console.log(`Found ${rows.length} taste profiles:\n`);
    
    rows.forEach(row => {
      console.log(`User ${row.user_id}:`);
      console.log(`  intensidade: ${row.intensidade}`);
      console.log(`  docura: ${row.docura}`);
      console.log(`  personalidade: ${row.personalidade}`);
      
      // Parse estilo
      try {
        const estilo = JSON.parse(row.estilo);
        console.log(`  estilo: ${JSON.stringify(estilo)} (${estilo.length} items)`);
      } catch (e) {
        console.log(`  estilo: ${row.estilo} (parse error)`);
      }
      
      // Parse momentos
      try {
        const momentos = JSON.parse(row.momentos);
        console.log(`  momentos: ${JSON.stringify(momentos)} (${momentos.length} items)`);
      } catch (e) {
        console.log(`  momentos: ${row.momentos} (parse error)`);
      }
      
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

checkTasteProfiles();