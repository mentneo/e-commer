#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Supermarket eCommerce Vercel Deployment Tool');
console.log('----------------------------------------------');

const deploy = (environment) => {
  try {
    console.log(`\n🔨 Building the application for ${environment}...`);
    execSync('npm run build', { stdio: 'inherit' });
    
    console.log('\n🚀 Deploying to Vercel...');
    
    if (environment === 'production') {
      execSync('vercel --prod', { stdio: 'inherit' });
    } else {
      execSync('vercel', { stdio: 'inherit' });
    }
    
    console.log('\n✅ Deployment complete!');
  } catch (error) {
    console.error('\n❌ Deployment failed with error:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure Vercel CLI is installed (npm install -g vercel)');
    console.log('2. Check if you are logged in to Vercel (vercel login)');
    console.log('3. Verify your project is properly configured');
  }
};

rl.question('Which environment do you want to deploy to? (production/preview) [preview]: ', (environment) => {
  const env = environment.toLowerCase() === 'production' ? 'production' : 'preview';
  deploy(env);
  rl.close();
});
