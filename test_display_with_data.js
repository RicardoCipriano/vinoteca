// Test login and taste profile display
const { pool } = require('./server/db');
const bcrypt = require('bcryptjs');

async function testLogin() {
  try {
    // Get user with id 1
    const [users] = await pool.query('SELECT id, email, name FROM users WHERE id = 1');
    if (users.length === 0) {
      console.log('No user found with id 1');
      return;
    }
    
    const user = users[0];
    console.log('User found:', { id: user.id, email: user.email, name: user.name });
    
    // Get taste profile
    const [tasteProfiles] = await pool.query('SELECT * FROM user_taste_profile WHERE user_id = 1');
    if (tasteProfiles.length === 0) {
      console.log('No taste profile found for user 1');
      return;
    }
    
    const profile = tasteProfiles[0];
    console.log('Taste profile data:');
    console.log('  intensidade:', profile.intensidade);
    console.log('  docura:', profile.docura);
    console.log('  personalidade:', profile.personalidade);
    console.log('  estilo (raw):', profile.estilo);
    console.log('  momentos (raw):', profile.momentos);
    
    // Parse JSON arrays
    try {
      const estilo = JSON.parse(profile.estilo);
      console.log('  estilo (parsed):', estilo);
      console.log('  estilo length:', estilo.length);
    } catch (e) {
      console.log('  Error parsing estilo:', e.message);
    }
    
    try {
      const momentos = JSON.parse(profile.momentos);
      console.log('  momentos (parsed):', momentos);
      console.log('  momentos length:', momentos.length);
    } catch (e) {
      console.log('  Error parsing momentos:', e.message);
    }
    
    // Test the display logic
    console.log('\n=== TESTING DISPLAY LOGIC ===');
    
    // Simulate the fixed display logic
    const tasteProfile = {
      intensidade: profile.intensidade,
      docura: profile.docura,
      personalidade: profile.personalidade,
      estilo: JSON.parse(profile.estilo),
      momentos: JSON.parse(profile.momentos)
    };
    
    console.log('Testing estilo display:');
    const estiloArray = tasteProfile.estilo;
    console.log('  estiloArray:', estiloArray);
    console.log('  estiloArray type:', typeof estiloArray);
    
    if (!estiloArray) {
      console.log('  Result: — (no estiloArray)');
    } else {
      console.log('  estiloArray length:', estiloArray.length);
      const joined = estiloArray.slice(0,3).join(', ');
      console.log('  joined:', joined);
      console.log('  Result:', joined); // Should show the actual data, not em dash
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

testLogin();