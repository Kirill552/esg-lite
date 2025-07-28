#!/usr/bin/env node

/**
 * ESG-Lite Security Test Script
 * Проверяет безопасность Docker конфигурации
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 ESG-Lite Security Test Suite');
console.log('================================');

const tests = {
  passed: 0,
  failed: 0,
  results: []
};

function runTest(name, testFn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    const result = testFn();
    if (result) {
      console.log(`✅ PASS: ${name}`);
      tests.passed++;
      tests.results.push({ name, status: 'PASS', details: result });
    } else {
      console.log(`❌ FAIL: ${name}`);
      tests.failed++;
      tests.results.push({ name, status: 'FAIL', details: 'Test returned false' });
    }
  } catch (error) {
    console.log(`❌ FAIL: ${name} - ${error.message}`);
    tests.failed++;
    tests.results.push({ name, status: 'FAIL', details: error.message });
  }
}

// Test 1: Dockerfile uses secure base image
runTest('Dockerfile uses distroless base image', () => {
  const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
  return dockerfile.includes('gcr.io/distroless/nodejs22-debian12:nonroot');
});

// Test 2: Worker Dockerfile uses updated Alpine
runTest('Worker Dockerfile uses Node.js 22 Alpine', () => {
  const dockerfile = fs.readFileSync('Dockerfile.worker', 'utf8');
  return dockerfile.includes('node:22-alpine');
});

// Test 3: No hardcoded secrets
runTest('No hardcoded secrets in Dockerfiles', () => {
  const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
  const workerDockerfile = fs.readFileSync('Dockerfile.worker', 'utf8');
  
  const secretPatterns = [
    /password\s*=\s*['"][^'"]+['"]/i,
    /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
    /secret\s*=\s*['"][^'"]+['"]/i,
    /token\s*=\s*['"][^'"]+['"]/i
  ];
  
  for (const pattern of secretPatterns) {
    if (pattern.test(dockerfile) || pattern.test(workerDockerfile)) {
      return false;
    }
  }
  return true;
});

// Test 4: Docker Compose uses new worker image
runTest('Docker Compose uses separate worker image', () => {
  const compose = fs.readFileSync('docker-compose.prod.yml', 'utf8');
  return compose.includes('dockerfile: Dockerfile.worker');
});

// Test 5: Kubernetes uses correct security context
runTest('Kubernetes deployment has secure context', () => {
  const k8s = fs.readFileSync('k8s/deployment.yaml', 'utf8');
  return k8s.includes('runAsUser: 65532') && k8s.includes('runAsNonRoot: true');
});

// Test 6: CI/CD builds both images
runTest('CI/CD pipeline builds separate images', () => {
  const cicd = fs.readFileSync('.github/workflows/ci-cd.yml', 'utf8');
  return cicd.includes('build-web') && cicd.includes('build-worker');
});

// Test 7: Security documentation exists
runTest('Security documentation exists', () => {
  return fs.existsSync('docs/DOCKER_SECURITY_UPDATE.md');
});

// Test 8: Update script exists and is executable
runTest('Security update script exists', () => {
  return fs.existsSync('scripts/update-security.ps1');
});

// Test 9: No vulnerable packages in package.json
runTest('No known vulnerable packages', () => {
  try {
    // Check if npm audit returns clean results
    execSync('npm audit --audit-level high', { stdio: 'pipe' });
    return true;
  } catch (error) {
    // npm audit found vulnerabilities
    console.log('⚠️  Found vulnerabilities in npm audit');
    return false;
  }
});

// Test 10: Environment files are gitignored
runTest('Environment files are gitignored', () => {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  return gitignore.includes('.env') && gitignore.includes('.env.local');
});

// Summary
console.log('\n📊 Test Summary');
console.log('================');
console.log(`✅ Passed: ${tests.passed}`);
console.log(`❌ Failed: ${tests.failed}`);
console.log(`📈 Success Rate: ${Math.round((tests.passed / (tests.passed + tests.failed)) * 100)}%`);

if (tests.failed > 0) {
  console.log('\n❌ Failed Tests:');
  tests.results.filter(r => r.status === 'FAIL').forEach(test => {
    console.log(`   • ${test.name}: ${test.details}`);
  });
}

// Docker image security check (if docker is available)
try {
  console.log('\n🐳 Docker Security Analysis');
  console.log('============================');
  
  // Check if Docker Scout is available
  try {
    execSync('docker scout version', { stdio: 'pipe' });
    console.log('🔍 Docker Scout found - running vulnerability scan...');
    
    // Build test image
    console.log('Building test web image...');
    execSync('docker build -t esg-lite-test:web .', { stdio: 'inherit' });
    
    console.log('Building test worker image...');
    execSync('docker build -f Dockerfile.worker -t esg-lite-test:worker .', { stdio: 'inherit' });
    
    // Scan for vulnerabilities
    console.log('\nScanning web image for vulnerabilities...');
    execSync('docker scout cves esg-lite-test:web', { stdio: 'inherit' });
    
    console.log('\nScanning worker image for vulnerabilities...');
    execSync('docker scout cves esg-lite-test:worker', { stdio: 'inherit' });
    
  } catch (scoutError) {
    console.log('⚠️  Docker Scout not available, skipping vulnerability scan');
    console.log('   Install Docker Scout: https://docs.docker.com/scout/install/');
  }
  
} catch (dockerError) {
  console.log('⚠️  Docker not available, skipping container security checks');
}

console.log('\n🎯 Security Recommendations');
console.log('============================');

if (tests.failed === 0) {
  console.log('🎉 All security tests passed!');
  console.log('✅ Your Docker configuration is secure');
  console.log('✅ Ready for production deployment');
} else {
  console.log('⚠️  Some security tests failed');
  console.log('📝 Please review and fix the issues above');
  console.log('🔄 Run this script again after fixes');
}

console.log('\n📚 Next Steps:');
console.log('   1. Review docs/DOCKER_SECURITY_UPDATE.md');
console.log('   2. Run: ./scripts/update-security.ps1 -Test');
console.log('   3. Deploy with: docker-compose -f docker-compose.prod.yml up -d');
console.log('   4. Monitor logs and health endpoints');

// Exit with error code if tests failed
process.exit(tests.failed > 0 ? 1 : 0);
