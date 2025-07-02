const mongoose = require('mongoose');
const { Company } = require('./models/user');
const MarkupService = require('./services/markupService');

async function testMarkup() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/b2b');
    console.log('Connected to MongoDB');

    // Create a test company
    const testCompany = new Company({
      phone: '9999999999',
      name: 'Test Company',
      agencyName: 'Test Agency',
      password: 'testpassword',
      companyNumber: 9999,
      isActive: true
    });

    await testCompany.save();
    console.log('Test company created:', testCompany._id);

    // Test 1: Set percentage markup
    console.log('\n=== Test 1: Set Percentage Markup ===');
    const percentageResult = await MarkupService.setMarkup(testCompany._id, {
      type: 'percentage',
      value: 15.5,
      isActive: true
    });
    console.log('Percentage markup result:', JSON.stringify(percentageResult, null, 2));

    // Test 2: Get markup
    console.log('\n=== Test 2: Get Markup ===');
    const getResult = await MarkupService.getMarkup(testCompany._id);
    console.log('Get markup result:', JSON.stringify(getResult, null, 2));

    // Test 3: Calculate markup with percentage
    console.log('\n=== Test 3: Calculate Percentage Markup ===');
    const calcResult1 = await MarkupService.calculateMarkup(testCompany._id, 1000);
    console.log('Calculation result (₹1000 with 15.5%):', JSON.stringify(calcResult1, null, 2));

    // Test 4: Set fixed markup
    console.log('\n=== Test 4: Set Fixed Markup ===');
    const fixedResult = await MarkupService.setMarkup(testCompany._id, {
      type: 'fixed',
      value: 200,
      isActive: true
    });
    console.log('Fixed markup result:', JSON.stringify(fixedResult, null, 2));

    // Test 5: Calculate markup with fixed amount
    console.log('\n=== Test 5: Calculate Fixed Markup ===');
    const calcResult2 = await MarkupService.calculateMarkup(testCompany._id, 1000);
    console.log('Calculation result (₹1000 with ₹200 fixed):', JSON.stringify(calcResult2, null, 2));

    // Test 6: Toggle markup
    console.log('\n=== Test 6: Toggle Markup ===');
    const toggleResult = await MarkupService.toggleMarkup(testCompany._id, false);
    console.log('Toggle result:', JSON.stringify(toggleResult, null, 2));

    // Test 7: Calculate with inactive markup
    console.log('\n=== Test 7: Calculate with Inactive Markup ===');
    const calcResult3 = await MarkupService.calculateMarkup(testCompany._id, 1000);
    console.log('Calculation result (inactive markup):', JSON.stringify(calcResult3, null, 2));

    // Test 8: Reactivate markup
    console.log('\n=== Test 8: Reactivate Markup ===');
    const reactivateResult = await MarkupService.toggleMarkup(testCompany._id, true);
    console.log('Reactivate result:', JSON.stringify(reactivateResult, null, 2));

    // Test 9: Error handling - invalid markup type
    console.log('\n=== Test 9: Error Handling - Invalid Type ===');
    try {
      await MarkupService.setMarkup(testCompany._id, {
        type: 'invalid',
        value: 10,
        isActive: true
      });
    } catch (error) {
      console.log('Expected error:', error.message);
    }

    // Test 10: Error handling - invalid percentage
    console.log('\n=== Test 10: Error Handling - Invalid Percentage ===');
    try {
      await MarkupService.setMarkup(testCompany._id, {
        type: 'percentage',
        value: 150, // More than 100%
        isActive: true
      });
    } catch (error) {
      console.log('Expected error:', error.message);
    }

    // Clean up
    await Company.findByIdAndDelete(testCompany._id);
    console.log('\nTest company deleted');

    console.log('\n=== All Tests Completed Successfully ===');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the test
testMarkup(); 