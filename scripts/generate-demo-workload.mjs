import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';

const seed = Number(process.env.DEMO_SEED ?? 20260916);
const scale = Number(process.env.DEMO_SCALE ?? 1);
const operatorsCount = 500 * scale;

// Province names and destination themes are grounded in the PNG Tourism Promotion Authority's
// official travel site. Demo operators/events are synthetic and explicitly marked as such.
const provinces = [
  ['NCD', 'National Capital District'], ['CENTRAL', 'Central Province'], ['ORO', 'Oro Province'],
  ['GULF', 'Gulf Province'], ['MILNE_BAY', 'Milne Bay Province'], ['WESTERN', 'Western Province'],
  ['MOROBE', 'Morobe Province'], ['MADANG', 'Madang Province'], ['EAST_SEPIK', 'East Sepik Province'],
  ['WEST_SEPIK', 'West Sepik Province'], ['EASTERN_HIGHLANDS', 'Eastern Highlands Province'],
  ['WESTERN_HIGHLANDS', 'Western Highlands Province'], ['JIWAKA', 'Jiwaka Province'], ['SIMBU', 'Simbu Province'],
  ['ENGA', 'Enga Province'], ['HELA', 'Hela Province'], ['SOUTHERN_HIGHLANDS', 'Southern Highlands Province'],
  ['EAST_NEW_BRITAIN', 'East New Britain Province'], ['WEST_NEW_BRITAIN', 'West New Britain Province'],
  ['MANUS', 'Manus Province'], ['NEW_IRELAND', 'New Ireland Province'], ['BOUGAINVILLE', 'Autonomous Region of Bougainville']
];

const destinations = [
  ['Port Moresby Nature Park', 'NCD'], ['Bomana War Cemetery', 'NCD'], ['National Museum and Art Gallery', 'NCD'],
  ['Ela Beach', 'NCD'], ['Loloata Island', 'CENTRAL'], ['Mount Hagen', 'WESTERN_HIGHLANDS'],
  ['Mount Hagen Cultural Show', 'WESTERN_HIGHLANDS'], ['Tufi Fjords', 'ORO'], ['Kokoda Track', 'ORO'],
  ['Owers Corner', 'CENTRAL'], ['Isurava Memorial', 'ORO'], ['Rabaul', 'EAST_NEW_BRITAIN'],
  ['Tavurvur Volcano', 'EAST_NEW_BRITAIN'], ['Sepik River', 'EAST_SEPIK'], ['Wewak', 'EAST_SEPIK'],
  ['Milne Bay', 'MILNE_BAY'], ['Alotau', 'MILNE_BAY'], ['Kiriwina', 'MILNE_BAY'], ['Misima Island', 'MILNE_BAY'],
  ['Tawali', 'MILNE_BAY'], ['Kavieng', 'NEW_IRELAND'], ['Kimbe Bay', 'WEST_NEW_BRITAIN'], ['Goroka', 'EASTERN_HIGHLANDS'],
  ['Mount Wilhelm', 'SIMBU'], ['Tari', 'HELA'], ['Vanimo', 'WEST_SEPIK'], ['Madang', 'MADANG'],
  ['Fly River', 'WESTERN'], ['Bougainville Island', 'BOUGAINVILLE']
].map(([name, province_code], i) => ({ demo_id: `DEST-${String(i + 1).padStart(3, '0')}`, name, province_code, source: 'PNGTPA official travel site' }));

const experienceThemes = ['Trekking', 'Diving', 'Fishing', 'Surfing', 'Snorkelling', 'Cruising', 'History', 'Bird watching', 'Culture', 'Kayaking'];
const statuses = ['draft', 'pending_review', 'active', 'suspended', 'closed'];
const compliance = ['unknown', 'compliant', 'conditional', 'non_compliant'];
const sources = ['web', 'mobile', 'kiosk', 'qr'];

let state = seed >>> 0;
function rand() { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; }
function pick(a) { return a[Math.floor(rand() * a.length)]; }
function id(prefix, n) { return `${prefix}-${String(n).padStart(6, '0')}`; }

const operators = Array.from({ length: operatorsCount }, (_, i) => {
  const p = pick(provinces); const st = pick(statuses); const c = st === 'active' ? pick(['compliant', 'compliant', 'conditional']) : pick(compliance);
  return {
    demo_id: id('OP', i + 1),
    legal_name: `NTDP DEMO OPERATOR ${String(i + 1).padStart(4, '0')}`,
    trading_name: `${pick(['Highlands','Island','Sepik','Kokoda','Coral','Rainforest','Heritage','Adventure'])} ${pick(['Adventures','Tours','Travel','Lodges','Experiences'])} ${i + 1}`,
    province_code: p[0], status: st, compliance_status: c, synthetic: true
  };
});

const workload = {
  seed, scale, source_basis: 'PNG Tourism Promotion Authority official travel site',
  provinces, destinations, operators,
  planned_counts: {
    industry_profiles: 500, experiences: 750, content_items: 300, sme_profiles: 500,
    sme_assessments: 500, sme_programs: 15, sme_enrolments: 1200,
    tia_memberships: 500, regulatory_licenses: 500, inspections: 1000,
    compliance_actions: 700, visitor_engagement_events: 15000, visitor_leads: 2500,
    gateway_clients: 25, gateway_keys: 25, gateway_request_log: 50000
  },
  experience_themes: experienceThemes, event_sources: sources,
  note: 'All operators, lifecycle records, events and gateway traffic are synthetic. Destination and tourism-theme references use real PNG places and official PNGTPA source material.'
};

mkdirSync('tmp/demo-workload', { recursive: true });
const serialised = JSON.stringify(workload, null, 2);
writeFileSync('tmp/demo-workload/manifest.json', serialised);
writeFileSync('tmp/demo-workload/checksum.txt', createHash('sha256').update(serialised).digest('hex') + '\n');
console.log(JSON.stringify({ seed, scale, operators: operators.length, destinations: destinations.length, output: 'tmp/demo-workload/manifest.json' }, null, 2));
