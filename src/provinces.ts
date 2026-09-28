export type ProvinceOption = { code: string; name: string };

// Stable UI fallback used when the public province endpoint is unavailable.
// Codes mirror the platform's authoritative ProvinceCode union.
export const PNG_PROVINCES: ProvinceOption[] = [
  { code: 'NCD', name: 'National Capital District' },
  { code: 'CENTRAL', name: 'Central Province' },
  { code: 'GULF', name: 'Gulf Province' },
  { code: 'MILNE_BAY', name: 'Milne Bay Province' },
  { code: 'ORO', name: 'Oro Province' },
  { code: 'MOROBE', name: 'Morobe Province' },
  { code: 'MADANG', name: 'Madang Province' },
  { code: 'EAST_SEPIK', name: 'East Sepik Province' },
  { code: 'WEST_SEPIK', name: 'West Sepik Province' },
  { code: 'MANUS', name: 'Manus Province' },
  { code: 'NEW_IRELAND', name: 'New Ireland Province' },
  { code: 'EAST_NEW_BRITAIN', name: 'East New Britain Province' },
  { code: 'WEST_NEW_BRITAIN', name: 'West New Britain Province' },
  { code: 'BOUGAINVILLE', name: 'Autonomous Region of Bougainville' },
  { code: 'ENGA', name: 'Enga Province' },
  { code: 'EASTERN_HIGHLANDS', name: 'Eastern Highlands Province' },
  { code: 'SIMBU', name: 'Simbu Province' },
  { code: 'WESTERN_HIGHLANDS', name: 'Western Highlands Province' },
  { code: 'SOUTHERN_HIGHLANDS', name: 'Southern Highlands Province' },
  { code: 'JIWAKA', name: 'Jiwaka Province' },
  { code: 'HELA', name: 'Hela Province' },
  { code: 'WESTERN', name: 'Western Province' },
];
