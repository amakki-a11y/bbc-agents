const { execSync } = require('child_process');

process.env.DATABASE_URL = 'postgresql://postgres:UcVmwNYWenKbiSaqbPsSCJRIBYFwNzmJ@maglev.proxy.rlwy.net:14177/railway';

console.log('Pushing schema to Railway database...');
console.log('DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

try {
  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('Done!');
} catch (error) {
  console.error('Error:', error.message);
}
