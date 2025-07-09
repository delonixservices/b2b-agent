const mongoose = require('mongoose');
const { Company } = require('./models/user');
const walletService = require('./services/walletService');

// Test configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/b2b-agent';

async function testWalletFunctionality() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create a test company
    console.log('\n📝 Creating test company...');
    const testCompany = new Company({
      phone: '9999999999',
      name: 'Test Travel Agency',
      agencyName: 'Test Agency',
      numPeople: 5,
      password: 'testpassword123',
      companyNumber: 9999,
      isActive: true,
      status: 'verified'
    });
    await testCompany.save();
    console.log('✅ Test company created:', testCompany._id);

    // Test wallet initialization
    console.log('\n💰 Testing wallet initialization...');
    const walletInfo = await walletService.getWalletBalance(testCompany._id);
    console.log('✅ Wallet balance retrieved:', walletInfo);

    // Test adding funds
    console.log('\n➕ Testing add funds...');
    const addResult = await walletService.addToWallet(testCompany._id, 5000, 'Test credit');
    console.log('✅ Funds added:', addResult);

    // Test checking balance
    console.log('\n🔍 Testing balance check...');
    const hasBalance = await walletService.hasSufficientBalance(testCompany._id, 3000);
    console.log('✅ Has sufficient balance for 3000:', hasBalance);

    // Test deducting funds
    console.log('\n➖ Testing deduct funds...');
    const deductResult = await walletService.deductFromWallet(testCompany._id, 2000, 'Test booking');
    console.log('✅ Funds deducted:', deductResult);

    // Test insufficient balance
    console.log('\n❌ Testing insufficient balance...');
    try {
      await walletService.deductFromWallet(testCompany._id, 10000, 'Large booking');
      console.log('❌ Should have failed');
    } catch (error) {
      console.log('✅ Correctly failed with insufficient balance:', error.message);
    }

    // Test wallet payment processing
    console.log('\n💳 Testing wallet payment processing...');
    const paymentResult = await walletService.processWalletPayment(testCompany._id, 1000, 'TEST_BOOKING_123');
    console.log('✅ Payment processed:', paymentResult);

    // Final balance check
    console.log('\n📊 Final balance check...');
    const finalBalance = await walletService.getWalletBalance(testCompany._id);
    console.log('✅ Final balance:', finalBalance);

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await Company.findByIdAndDelete(testCompany._id);
    console.log('✅ Test company deleted');

    console.log('\n🎉 All wallet tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testWalletFunctionality();
}

module.exports = { testWalletFunctionality }; 