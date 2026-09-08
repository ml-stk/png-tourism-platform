export type PlatformModule = 'command' | 'industry' | 'content' | 'visitor' | 'insights';

export interface Destination { id: string; name: string; province: string; description: string; status: 'Published' | 'Draft'; }
export interface Operator { id: string; name: string; category: string; province: string; status: 'Active' | 'Pending' | 'Suspended'; }
export interface PlatformMetric { label: string; value: string; change: string; positive: boolean; }
