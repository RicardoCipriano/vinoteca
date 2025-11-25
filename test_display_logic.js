// Test script to verify the display logic issue

// Simulate the current display logic from ProfileScreen.tsx line 259-270
function testDisplayLogic(estiloData) {
  console.log('\n=== Testing display logic with:', JSON.stringify(estiloData));
  
  const estiloArray = estiloData?.estilo || [];
  console.log('estiloArray:', estiloArray);
  console.log('estiloArray type:', typeof estiloArray);
  console.log('estiloArray length:', estiloArray.length);
  
  const joined = estiloArray.slice(0,3).join(', ');
  console.log('joined:', joined);
  console.log('joined || "—":', joined || '—');
  
  return joined || '—';
}

// Test different scenarios
console.log('=== TESTING DISPLAY LOGIC ISSUE ===\n');

// Test 1: Empty array (this is the issue)
const result1 = testDisplayLogic({ estilo: [] });
console.log('Result 1 (empty array):', result1);

// Test 2: Null data
const result2 = testDisplayLogic(null);
console.log('Result 2 (null):', result2);

// Test 3: Undefined estilo
const result3 = testDisplayLogic({ estilo: undefined });
console.log('Result 3 (undefined estilo):', result3);

// Test 4: Valid data
const result4 = testDisplayLogic({ estilo: ['Tinto', 'Branco', 'Rosé'] });
console.log('Result 4 (valid data):', result4);

// Test 5: Single item
const result5 = testDisplayLogic({ estilo: ['Tinto'] });
console.log('Result 5 (single item):', result5);

console.log('\n=== CONCLUSION ===');
console.log('The issue: When estilo is an empty array [], .join(", ") returns empty string "", which becomes "—" via || fallback');
console.log('The fix: We need to distinguish between empty arrays (show as empty) vs null/undefined (show as "—")');