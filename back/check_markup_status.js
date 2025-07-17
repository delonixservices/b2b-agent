const mongoose = require('mongoose');
const Markup = require('./models/markup');

async function checkMarkupStatus() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/b2b_agent';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check for active markup
    const activeMarkup = await Markup.findOne({ isActive: true });
    
    console.log('=== MARKUP STATUS CHECK ===');
    if (activeMarkup) {
      console.log('✅ Active markup found:');
      console.log('  ID:', activeMarkup._id);
      console.log('  Name:', activeMarkup.name);
      console.log('  Type:', activeMarkup.type);
      console.log('  Value:', activeMarkup.value);
      console.log('  Is Active:', activeMarkup.isActive);
      console.log('  Created:', activeMarkup.createdAt);
    } else {
      console.log('❌ No active markup found');
      
      // Check for any markups in the database
      const allMarkups = await Markup.find({});
      console.log('Total markups in database:', allMarkups.length);
      
      if (allMarkups.length > 0) {
        console.log('Available markups:');
        allMarkups.forEach((markup, index) => {
          console.log(`  ${index + 1}. ${markup.name} (${markup.type}: ${markup.value}) - Active: ${markup.isActive}`);
        });
      }
    }
    console.log('=== END MARKUP STATUS CHECK ===');

  } catch (error) {
    console.error('Error checking markup status:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkMarkupStatus(); 