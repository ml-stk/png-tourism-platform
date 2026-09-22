import { readFileSync, writeFileSync } from 'node:fs';

const file = 'dist-server/server/index.js';
const source = readFileSync(file, 'utf8');
const start = source.indexOf('function looksLikeSupabaseToken(token){');
const end = source.indexOf('async function authenticateSupabaseToken', start);

if (start < 0 || end < 0) {
  throw new Error('Could not locate Supabase token detector in bundled API');
}

const replacement = `function looksLikeSupabaseToken(token){try{const parts=token.split('.');if(parts.length!==3)return false;const header=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));const claims=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));const issuer=typeof claims.iss==='string'?claims.iss:'';const supabaseUrl=process.env.SUPABASE_URL||'https://yxhatvvgietyvjhlqoqg.supabase.co';const alg=typeof header.alg==='string'?header.alg:'';return issuer===supabaseUrl||issuer.startsWith(\`${'${'}supabaseUrl}/\` )||alg==='ES256'||alg==='RS256';}catch{return false;}}`;

writeFileSync(file, source.slice(0, start) + replacement + source.slice(end));
console.log('Patched Supabase asymmetric JWT detection in production API bundle');
