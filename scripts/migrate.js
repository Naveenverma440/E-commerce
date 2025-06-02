require('dotenv').config();
const { initializeDatabase } = require('../config/database');
const { seedDatabase } = require('./seed');

const runMigrations = async () => {
  try {
    console.log('🚀 Starting database migration...\n');

    console.log('📋 Initializing database schema...');
    await initializeDatabase();
    console.log('✅ Database schema initialized successfully\n');

    const shouldSeed = process.argv.includes('--seed') || process.argv.includes('-s');
    
    if (shouldSeed) {
      console.log('🌱 Seeding database with sample data...');
      await seedDatabase();
      console.log('✅ Database seeded successfully\n');
    } else {
      console.log('ℹ️  Skipping database seeding. Use --seed flag to include sample data\n');
    }

    console.log('🎉 Migration completed successfully!');
    
    if (shouldSeed) {
      console.log('\n📝 Next steps:');
      console.log('1. Copy .env.example to .env and configure your environment variables');
      console.log('2. Update database connection settings in .env');
      console.log('3. Configure email settings for order notifications');
      console.log('4. Optionally configure Redis for caching');
      console.log('5. Run "npm run dev" to start the development server');
      console.log('\n🔐 Sample login credentials have been created (check console output above)');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('1. Ensure PostgreSQL is running and accessible');
    console.error('2. Check database connection settings in .env file');
    console.error('3. Verify database user has necessary permissions');
    console.error('4. Make sure the database exists or create it manually');
    
    process.exit(1);
  }
};

const showHelp = () => {
  console.log('📖 Database Migration Script\n');
  console.log('Usage: node scripts/migrate.js [options]\n');
  console.log('Options:');
  console.log('  --seed, -s    Include sample data seeding');
  console.log('  --help, -h    Show this help message\n');
  console.log('Examples:');
  console.log('  node scripts/migrate.js           # Run migrations only');
  console.log('  node scripts/migrate.js --seed    # Run migrations and seed data');
  console.log('  npm run migrate                   # Using npm script');
};

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };