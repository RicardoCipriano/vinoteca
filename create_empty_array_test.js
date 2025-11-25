const { pool } = require('./server/db');

async function testEmptyArrayScenario() {
  try {
    console.log('=== TESTING EMPTY ARRAY SCENARIO ===\n');
    
    // Create a test user with empty arrays
    const [result] = await pool.query(`
      INSERT INTO user_taste_profile (user_id, intensidade, docura, personalidade, estilo, momentos) 
      VALUES (2, 'Leve', 'Doce', 'Reflexivo', '[]', '[]')
      ON DUPLICATE KEY UPDATE 
        intensidade = 'Leve',
        docura = 'Doce', 
        personalidade = 'Reflexivo',
        estilo = '[]',
        momentos = '[]'
    `);
    
    console.log('Created/updated test user 2 with empty arrays');
    
    // Get the updated data
    const [rows] = await pool.query(`
      SELECT user_id, estilo, intensidade, docura, momentos, personalidade 
      FROM user_taste_profile 
      WHERE user_id = 2
    `);
    
    if (rows.length > 0) {
      const profile = rows[0];
      console.log('\nTest user 2 data:');
      console.log('  intensidade:', profile.intensidade);
      console.log('  docura:', profile.docura);
      console.log('  personalidade:', profile.personalidade);
      
      // Parse and test the display logic
      const estiloArray = JSON.parse(profile.estilo);
      const momentosArray = JSON.parse(profile.momentos);
      
      console.log('\nTesting display logic with empty arrays:');
      console.log('  estiloArray:', estiloArray);
      console.log('  estiloArray.length:', estiloArray.length);
      
      // Test the fixed logic
      if (!estiloArray) {
        console.log('  Result: — (null/undefined)');
      } else if (estiloArray.length === 0) {
        console.log('  Result: "" (empty array - should show empty string)');
      } else {
        const joined = estiloArray.slice(0,3).join(', ');
        console.log('  Result:', joined);
      }
      
      console.log('\n✅ Empty array test scenario created successfully!');
      console.log('✅ This will help verify the display fix works correctly');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

testEmptyArrayScenario();