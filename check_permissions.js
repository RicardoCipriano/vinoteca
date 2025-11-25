const { pool } = require('./server/db');

async function checkPermissions() {
  const conn = await pool.getConnection();
  try {
    console.log('Checking user_taste_profile table...');
    
    // Check if table exists and has data
    const [tableRows] = await conn.query(`
      SELECT COUNT(*) as count FROM user_taste_profile
    `);
    console.log('Rows in user_taste_profile:', tableRows[0].count);
    
    // Check table structure
    const [structure] = await conn.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
      AND table_name = 'user_taste_profile'
      ORDER BY ordinal_position
    `);
    console.log('Table structure:', structure);
    
    // Show some sample data
    if (tableRows[0].count > 0) {
      const [sampleData] = await conn.query(`
        SELECT user_id, intensidade, estilo, docura, momentos, personalidade 
        FROM user_taste_profile 
        LIMIT 3
      `);
      console.log('Sample data:', sampleData);
    }
    
  } catch (e) {
    console.error('Error checking table:', e);
  } finally {
    conn.release();
  }
  process.exit(0);
}

checkPermissions();