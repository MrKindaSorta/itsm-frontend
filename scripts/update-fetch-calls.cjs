#!/usr/bin/env node
/**
 * Automated script to update all fetch() calls to use fetchWithAuth()
 *
 * This script:
 * 1. Finds all TypeScript/JavaScript files in src/
 * 2. Searches for fetch() calls
 * 3. Replaces with fetchWithAuth()
 * 4. Adds import statement if needed
 * 5. Creates backups before modifying
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔐 JWT Frontend Token Injection Script');
console.log('=====================================\n');

const srcDir = path.join(__dirname, '..', 'src');
const filesToUpdate = [];

// Recursively find all .ts and .tsx files
function findFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules
      if (entry.name !== 'node_modules') {
        findFiles(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      filesToUpdate.push(fullPath);
    }
  }
}

console.log('📂 Scanning for TypeScript files...\n');
findFiles(srcDir);

let totalFetches = 0;
let totalFilesModified = 0;
let totalFilesSkipped = 0;

for (const filePath of filesToUpdate) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if file contains fetch() calls
  const fetchMatches = content.match(/\bfetch\(/g);
  if (!fetchMatches || fetchMatches.length === 0) {
    continue; // No fetch calls in this file
  }

  // Check if already uses fetchWithAuth
  if (content.includes('fetchWithAuth')) {
    totalFilesSkipped++;
    continue; // Already updated
  }

  // Create backup
  const backupPath = filePath + '.backup-' + Date.now();
  fs.copyFileSync(filePath, backupPath);

  let modified = false;
  const relativePath = path.relative(process.cwd(), filePath);

  console.log(`📝 Processing: ${relativePath}`);

  // Replace fetch( with fetchWithAuth(
  // Pattern: fetch(url matches both:
  // - await fetch(
  // - const x = fetch(
  // - return fetch(
  const beforeCount = (content.match(/\bfetch\(/g) || []).length;
  content = content.replace(/\b(fetch)\(/g, 'fetchWithAuth(');
  const afterCount = (content.match(/\bfetchWithAuth\(/g) || []).length;

  if (afterCount > 0) {
    // Add import statement if not already present
    if (!content.includes("from '@/lib/fetchWithAuth'")) {
      // Find the last import statement
      const importMatches = content.match(/^import .+ from .+;$/gm);

      if (importMatches && importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        const importStatement = "import { fetchWithAuth } from '@/lib/fetchWithAuth';";

        // Insert after last import
        content = content.replace(lastImport, lastImport + '\n' + importStatement);
        modified = true;
        totalFetches += afterCount;

        console.log(`   ✅ Updated ${afterCount} fetch() calls`);
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    totalFilesModified++;
    console.log(`   💾 Backup: ${path.basename(backupPath)}\n`);
  } else {
    // Remove backup if no changes made
    fs.unlinkSync(backupPath);
  }
}

console.log('\n✅ Script Complete!\n');
console.log('Summary:');
console.log(`   🔒 Files modified: ${totalFilesModified}`);
console.log(`   ✅ Files already updated: ${totalFilesSkipped}`);
console.log(`   📊 Total fetch() calls updated: ${totalFetches}`);
console.log(`   📁 Total files scanned: ${filesToUpdate.length}\n`);

console.log('📝 Next steps:');
console.log('   1. Review changes: git diff src/');
console.log('   2. Build frontend: npm run build');
console.log('   3. Test in browser: npm run dev');
console.log('   4. Deploy: git push origin main\n');
