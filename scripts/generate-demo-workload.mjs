import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';

const seed = Number(process.env.DEMO_SEED ?? 20260916);
const scale = Number(process.env.DEMO_SCALE ?? 1);
const operatorsCount = 500 * scale;
const destinationsCount = 100 * scale;

const provinces = [
  ['NCD', 'National Capital District'], ['CEN', 'Central'], ['ORO', 'Northern (Oro)'],
  ['MIL', 'Milne Bay'], ['GUL', 'Gulf'], ['WPD', 'Western'], ['MOR', 'Morobe'],
  ['MAD', 'Madang'], ['ESP', 'East Sepik'], ['WSP', 'West Sepik'], ['EHP', 'Eastern Highlands'],
  ['WHP', 'Western Highlands'], ['JWK', 'Jiwaka'], ['SIM', 'Simbu'], ['ENG', 'Enga'],
  ['HLA', 'Hela'], ['SHP', 'Southern Highlands'], ['ENB', 'East New Britain'],
  ['WNB', 'West New Britain'], ['NIP', 'New Ireland'], ['MAN', 'Manus'], ['BOU', 'Autonomous Region of Bougainville']
];

// Named destinations are grounded in the official PNG Tourism Promotion Authority travel site.
const namedDestinations = [
  ['Port Moresby', 'NCD', 'papua-region', 'City gateway, cultural and nature experiences'],
  ['Kokoda Track', 'ORO', 'papua-region', 'World War II heritage trekking route'],
  ['Rabaul', 'ENB', 'islands-region', 'Volcanic landscapes, WWII history and diving'],
  ['Sepik River', 'ESP', 'momase-region', 'River culture, traditional art and spirit houses'],
  ['Milne Bay', 'MIL', 'papua-region', 'Island, marine, diving and cultural experiences'],
  ['Tufi Fjords', 'ORO', 'papua-region', 'Fjords, snorkelling and village experiences'],
  ['Mount Wilhelm', 'SIM', 'highlands-region', 'Highlands trekking and mountain scenery'],
  ['Goroka', 'EHP', 'highlands-region', 'Highlands culture and festival experiences'],
  ['Kavieng', 'NIP', 'islands-region', 'Diving, reefs and island experiences'],
  ['Kimbe Bay', 'WNB', 'islands-region', 'Marine biodiversity and diving'],
  ['Madang', 'MAD', 'momase-region', 'Coastal, marine and cultural experiences'],
  ['Wewak', 'ESP', 'momase-region', 'Coastal gateway and cultural experiences'],
  ['Vanimo', 'WSP', 'momase-region', 'Surfing, coastal and cultural experiences'],
  ['Loloata Island', 'NCD', 'papua-region', 'Island escape and marine experiences'],
  ['Bomana War Cemetery', 'NCD', 'papua-region', 'World War II heritage site'],
  ['Fly River', 'WPD', 'papua-region', 'River and nature experiences']
];

const experienceThemes = ['Trekking', 'Diving', 'Fishing', 'Surfing', 'Snorkelling', 'Cruising', 'History', 'Bird watching', 'Culture', 'Kayaking'];
const statuses = ['draft', 'pending_review', 'active', 'suspended', 'closed'];
const compliance = ['unknown', 'compliant', 'conditional', 'non_compliant'];
const sources = ['web', 'mobile', 'kiosk', 'qr'];

let state = seed >>> 0;
function rand() { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; }
function pick(a) { return a[Math.floor(rand() * a.length)]; }
function id(prefix, n) { return `${prefix}-${String(n).padStart(6, '0')}`; }
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function province(code) { return provinces.find(p => p[0] === code) ?? provinces[0]; }

const destinations = namedDestinations.map((d, i) => ({
  demo_id: id('DEST', i + 1), name: d[0], province_code: d[1], region: d[2], description: d[3], source: 'PNGTPA official travel site'
}));
for (let i = destinations.length; i < destinationsCount; i++) {
  const p = pick(provinces);
  const theme = pick(experienceThemes);
  destinations.push({ demo_id: id('DEST', i + 1), name: `${province(p[0])[1]} ${theme} Area ${i + 1}`, province_code: p[0], region: 'PNG', description: `Synthetic evaluation destination representing ${theme.toLowerCase()} tourism in ${p[1]}.`, source: 'synthetic evaluation record' });
}

const operators = Array.from({ length: operatorsCount }, (_, i) => {
  const p = pick(provinces); const st = pick(statuses); const c = st === 'active' ? pick(['compliant', 'compliant', 'conditional']) : pick(compliance);
  return { demo_id: id('OP', i + 1), legal_name: `PNG Tourism Demo Operator ${String(i + 1).padStart(4, '0')}`, trading_name: `${pick(['Highlands','Island','Sepik','Kokoda','Coral','Rainforest'])} ${pick(['Adventures','Tours','Travel','Lodges','Experiences'])} ${i + 1}`, province_code: p[0], status: st, compliance_status: c };
});

const records = { seed, scale, provinces, destinations, operators, experience_themes: experienceThemes, event_sources: sources };
mkdirSync('tmp/demo-workload', { recursive: true });
writeFileSync('tmp/demo-workload/manifest.json', JSON.stringify({ generated_at: new Date().toISOString(), ...records }, null, 2));
writeFileSync('tmp/demo-workload/checksum.txt', createHash('sha256').update(JSON.stringify(records)).digest('hex') + '\n');
console.log(JSON.stringify({ seed, scale, operators: operators.length, destinations: destinations.length, named_destinations: namedDestinations.length, output: 'tmp/demo-workload/manifest.json' }, null, 2));
