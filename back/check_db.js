const mongoose = require('mongoose');
const { Company, Employee } = require('./models/user');

async function checkDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/b2b');
    console.log('Connected to MongoDB');
    
    // Check companies
    const companies = await Company.find();
    console.log('Total companies:', companies.length);
    
    if (companies.length > 0) {
      console.log('Sample company:');
      console.log(JSON.stringify(companies[0], null, 2));
    }
    
    // Check employees
    const employees = await Employee.find();
    console.log('Total employees:', employees.length);
    
    if (employees.length > 0) {
      console.log('Sample employee:');
      console.log(JSON.stringify(employees[0], null, 2));
    }
    
    // Check for employees without company reference
    const orphanedEmployees = await Employee.find({ company: { $exists: false } });
    console.log('Employees without company reference:', orphanedEmployees.length);
    
    // Check for duplicate employee IDs
    const duplicateEmployeeIds = await Employee.aggregate([
      {
        $group: {
          _id: '$employeeId',
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);
    console.log('Duplicate employee IDs:', duplicateEmployeeIds.length);
    
    // Check for duplicate phone numbers
    const duplicatePhones = await Employee.aggregate([
      {
        $group: {
          _id: '$phone',
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);
    console.log('Duplicate phone numbers in employees:', duplicatePhones.length);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

checkDatabase(); 