import { extractLastWordFromCityName, testExtractLastWordFromCityName } from './hotelUtils';

// Run the test function
testExtractLastWordFromCityName();

// Additional manual tests
console.log('\nManual tests:');
console.log('extractLastWordFromCityName("New Delhi") ->', extractLastWordFromCityName("New Delhi"));
console.log('extractLastWordFromCityName("Mumbai") ->', extractLastWordFromCityName("Mumbai"));
console.log('extractLastWordFromCityName("Bangalore") ->', extractLastWordFromCityName("Bangalore"));
console.log('extractLastWordFromCityName("New York") ->', extractLastWordFromCityName("New York"));
console.log('extractLastWordFromCityName("Los Angeles") ->', extractLastWordFromCityName("Los Angeles"));
console.log('extractLastWordFromCityName("San Francisco") ->', extractLastWordFromCityName("San Francisco"));
console.log('extractLastWordFromCityName("  New Delhi  ") ->', extractLastWordFromCityName("  New Delhi  "));
console.log('extractLastWordFromCityName("") ->', extractLastWordFromCityName(""));
console.log('extractLastWordFromCityName("   ") ->', extractLastWordFromCityName("   "));
console.log('extractLastWordFromCityName("Delhi") ->', extractLastWordFromCityName("Delhi")); 