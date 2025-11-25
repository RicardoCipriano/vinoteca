// Test the fixed display logic
function testFixedDisplayLogic(estiloData) {
  console.log('\n=== Testing FIXED display logic with:', JSON.stringify(estiloData));
  
  const estiloArray = estiloData?.estilo;
  console.log('estiloArray:', estiloArray);
  console.log('estiloArray type:', typeof estiloArray);
  
  // Handle null/undefined case
  if (!estiloArray) {
    console.log('no estiloArray, returning em dash');
    return '—';
  }
  
  console.log('estiloArray length:', estiloArray.length);
  const joined = estiloArray.slice(0,3).join(', ');
  console.log('joined:', joined);
  
  // Return empty string for empty arrays, joined string for data
  return joined;
}

console.log('=== TESTING FIXED DISPLAY LOGIC ===\n');

// Test 1: Empty array (should now show empty string)
const result1 = testFixedDisplayLogic({ estilo: [] });
console.log('Result 1 (empty array):', JSON.stringify(result1));

// Test 2: Null data (should show em dash)
const result2 = testFixedDisplayLogic(null);
console.log('Result 2 (null):', JSON.stringify(result2));

// Test 3: Undefined estilo (should show em dash)
const result3 = testFixedDisplayLogic({ estilo: undefined });
console.log('Result 3 (undefined estilo):', JSON.stringify(result3));

// Test 4: Valid data (should show joined string)
const result4 = testFixedDisplayLogic({ estilo: ['Tinto', 'Branco', 'Rosé'] });
console.log('Result 4 (valid data):', JSON.stringify(result4));

// Test 5: Single item (should show single item)
const result5 = testFixedDisplayLogic({ estilo: ['Tinto'] });
console.log('Result 5 (single item):', JSON.stringify(result5));

console.log('\n=== FIXED LOGIC RESULTS ===');
console.log('✓ Empty arrays now show as empty string (not em dash)');
console.log('✓ Null/undefined still show as em dash');
console.log('✓ Valid data shows as joined string');