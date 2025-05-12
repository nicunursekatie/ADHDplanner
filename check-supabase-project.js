import fs from 'fs/promises';
import path from 'path';

// Check if a .env file exists
console.log('Checking for .env file...');
try {
  const envFileContent = await fs.readFile(path.join(process.cwd(), '.env'), 'utf8');
  console.log('Found .env file:');
  
  // Extract Supabase URL and key securely (only showing parts of the key)
  const supabaseUrl = envFileContent.match(/SUPABASE_URL\s*=\s*([^\n]*)/);
  const supabaseKey = envFileContent.match(/SUPABASE_KEY\s*=\s*([^\n]*)/);
  
  if (supabaseUrl && supabaseUrl[1]) {
    console.log(`SUPABASE_URL = ${supabaseUrl[1]}`);
  } else {
    console.log('SUPABASE_URL not found in .env file');
  }
  
  if (supabaseKey && supabaseKey[1]) {
    const key = supabaseKey[1];
    // Only show the first 10 and last 5 characters
    console.log(`SUPABASE_KEY = ${key.substring(0, 10)}...${key.substring(key.length - 5)}`);
  } else {
    console.log('SUPABASE_KEY not found in .env file');
  }
} catch (error) {
  console.log('No .env file found');
}

// Check hard-coded values in supabase.ts
console.log('\nChecking supabase.ts...');
try {
  const supabaseFile = await fs.readFile(path.join(process.cwd(), 'src', 'utils', 'supabase.ts'), 'utf8');
  
  // Extract Supabase URL and key
  const supabaseUrl = supabaseFile.match(/supabaseUrl\s*=\s*['"]([^'"]*)['"]/);
  const supabaseKey = supabaseFile.match(/supabaseKey\s*=\s*['"]([^'"]*)['"]/);
  
  if (supabaseUrl && supabaseUrl[1]) {
    console.log(`Supabase URL in supabase.ts = ${supabaseUrl[1]}`);
    
    // Extract the project reference from URL
    const projectRef = supabaseUrl[1].match(/https:\/\/([^.]+)\.supabase\.co/);
    if (projectRef && projectRef[1]) {
      console.log(`Project reference = ${projectRef[1]}`);
    }
  } else {
    console.log('Supabase URL not found in supabase.ts');
  }
  
  if (supabaseKey && supabaseKey[1]) {
    const key = supabaseKey[1];
    // Only show the first 10 and last 5 characters for security
    console.log(`Supabase key in supabase.ts = ${key.substring(0, 10)}...${key.substring(key.length - 5)}`);
  } else {
    console.log('Supabase key not found in supabase.ts');
  }
} catch (error) {
  console.error('Error reading supabase.ts:', error.message);
}