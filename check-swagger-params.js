/**
 * Check for routes without Swagger documentation parameters
 */

const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');

// Check if swagger docs have parameters defined
function checkSwaggerDocs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const issues = [];
  let inSwaggerBlock = false;
  let currentEndpoint = '';
  let hasParameters = false;
  let hasRequestBody = false;
  let lineNumber = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    lineNumber = i + 1;
    
    // Start of swagger block
    if (line.includes('@swagger')) {
      inSwaggerBlock = true;
      hasParameters = false;
      hasRequestBody = false;
      currentEndpoint = '';
      continue;
    }
    
    // Extract endpoint path
    if (inSwaggerBlock && line.includes('   /')) {
      const match = line.match(/\/[^\s:]+/);
      if (match) currentEndpoint = match[0];
    }
    
    // Check for parameters
    if (inSwaggerBlock && line.includes('parameters:')) {
      hasParameters = true;
    }
    
    // Check for requestBody
    if (inSwaggerBlock && line.includes('requestBody:')) {
      hasRequestBody = true;
    }
    
    // End of swagger block
    if (inSwaggerBlock && line.trim().startsWith('router.')) {
      const routeLine = line;
      const isGetRequest = routeLine.includes('.get(');
      const hasPathParams = currentEndpoint.includes(':');
      
      // GET requests with path params should have parameters
      if (isGetRequest && hasPathParams && !hasParameters) {
        issues.push({
          file: path.basename(filePath),
          line: lineNumber,
          endpoint: currentEndpoint,
          issue: 'GET request with path parameter missing Swagger parameters'
        });
      }
      
      // POST/PUT/PATCH should have requestBody or parameters
      if ((routeLine.includes('.post(') || routeLine.includes('.put(') || routeLine.includes('.patch(')) 
          && !hasRequestBody && !hasParameters) {
        issues.push({
          file: path.basename(filePath),
          line: lineNumber,
          endpoint: currentEndpoint,
          issue: 'POST/PUT/PATCH request missing Swagger requestBody or parameters'
        });
      }
      
      inSwaggerBlock = false;
    }
  }
  
  return issues;
}

// Read all route files
const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('Routes.js'));

console.log('\n🔍 Checking Swagger Documentation...\n');

let totalIssues = 0;

routeFiles.forEach(file => {
  const filePath = path.join(routesDir, file);
  const issues = checkSwaggerDocs(filePath);
  
  if (issues.length > 0) {
    console.log(`\n📄 ${file}:`);
    issues.forEach(issue => {
      console.log(`   ⚠️  Line ${issue.line}: ${issue.endpoint}`);
      console.log(`      ${issue.issue}`);
      totalIssues++;
    });
  }
});

if (totalIssues === 0) {
  console.log('✅ All endpoints have proper Swagger documentation!\n');
} else {
  console.log(`\n❌ Found ${totalIssues} potential documentation issues.\n`);
  console.log('💡 Tip: Check if these endpoints need:');
  console.log('   - parameters: for query/path params');
  console.log('   - requestBody: for POST/PUT/PATCH data\n');
}
