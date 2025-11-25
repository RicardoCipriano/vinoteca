// Test script to verify the issue
const tasteProfile = {
  intensidade: 'Encorpado',
  estilo: [],  // Empty array
  docura: 'Seco',
  momentos: ["Comemoração"],
  personalidade: 'Social'
};

console.log('Original data:', tasteProfile);

// Simulate what happens in the ProfileScreen
const displayEstilos = (estiloArray) => {
  console.log('estiloArray:', estiloArray);
  console.log('estiloArray type:', typeof estiloArray);
  console.log('estiloArray length:', estiloArray.length);
  const joined = estiloArray.slice(0,3).join(', ');
  console.log('joined:', joined);
  console.log('joined || em dash:', joined || '—');
  return joined || '—';
};

console.log('\nTesting display logic:');
displayEstilos(tasteProfile.estilo);

// Test with data
const tasteProfileWithData = {
  ...tasteProfile,
  estilo: ['Tinto', 'Branco']
};

console.log('\nTesting with data:');
displayEstilos(tasteProfileWithData.estilo);