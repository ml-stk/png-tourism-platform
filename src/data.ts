import type { Destination, Operator, PlatformMetric } from './types';

export const metrics: PlatformMetric[] = [
  { label: 'Registered operators', value: '1,284', change: '+8.4%', positive: true },
  { label: 'Published experiences', value: '642', change: '+12.1%', positive: true },
  { label: 'Monthly visitors', value: '38.6K', change: '+18.7%', positive: true },
  { label: 'Active provinces', value: '22', change: 'All connected', positive: true },
];

export const destinations: Destination[] = [
  { id: 'd1', name: 'Kokoda Track', province: 'Oro / Central', description: 'World-renowned trekking and wartime heritage experience.', status: 'Published' },
  { id: 'd2', name: 'Milne Bay', province: 'Milne Bay', description: 'Marine, island and cultural experiences across the province.', status: 'Published' },
  { id: 'd3', name: 'Sepik River', province: 'East Sepik', description: 'River journeys, villages, carving traditions and cultural tourism.', status: 'Published' },
  { id: 'd4', name: 'Tufi', province: 'Oro', description: 'Fjords, reefs, diving and community-led coastal experiences.', status: 'Draft' },
];

export const operators: Operator[] = [
  { id: 'o1', name: 'PNG Paradise Tours Ltd', category: 'Tour Operator', province: 'NCD', status: 'Active' },
  { id: 'o2', name: 'Kokoda Trail Adventures', category: 'Adventure Tourism', province: 'Oro', status: 'Active' },
  { id: 'o3', name: 'Sepik River Safaris', category: 'Eco Tourism', province: 'East Sepik', status: 'Pending' },
  { id: 'o4', name: 'Coral Sea Diving', category: 'Marine Tourism', province: 'Milne Bay', status: 'Active' },
];
