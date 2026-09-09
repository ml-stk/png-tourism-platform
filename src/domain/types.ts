export type ID = string;

export type ProvinceCode =
  | 'NCD' | 'CENTRAL' | 'GULF' | 'MILNE_BAY' | 'ORO'
  | 'MOROBE' | 'MADANG' | 'EAST_SEPIK' | 'WEST_SEPIK'
  | 'MANUS' | 'NEW_IRELAND' | 'EAST_NEW_BRITAIN' | 'WEST_NEW_BRITAIN'
  | 'BOUGAINVILLE' | 'ENGA' | 'EASTERN_HIGHLANDS' | 'SIMBU'
  | 'WESTERN_HIGHLANDS' | 'SOUTHERN_HIGHLANDS' | 'JIWAKA' | 'HELA'
  | 'WESTERN';

export type OperatorStatus = 'draft' | 'pending_review' | 'active' | 'suspended' | 'closed';
export type PublicationStatus = 'draft' | 'review' | 'published' | 'archived';
export type ComplianceStatus = 'unknown' | 'compliant' | 'conditional' | 'non_compliant';

export interface Province { id: ID; code: ProvinceCode; name: string; slug: string; }

export interface Operator {
  id: ID;
  legalName: string;
  tradingName?: string;
  provinceCode: ProvinceCode;
  status: OperatorStatus;
  complianceStatus: ComplianceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Destination {
  id: ID;
  name: string;
  slug: string;
  provinceCode: ProvinceCode;
  publicationStatus: PublicationStatus;
  description?: string;
  latitude?: number;
  longitude?: number;
  contentVersion: number;
  updatedAt: string;
}

export interface ContentItem {
  id: ID;
  type: 'destination' | 'attraction' | 'experience' | 'event' | 'operator' | 'campaign';
  title: string;
  slug: string;
  publicationStatus: PublicationStatus;
  version: number;
  updatedAt: string;
  provinceCode?: ProvinceCode;
  summary?: string;
  body?: string;
  publishedAt?: string;
  publishedBy?: ID;
}

export interface AuditEvent {
  id: ID;
  actorId?: ID;
  action: string;
  targetType: string;
  targetId: ID;
  outcome: 'success' | 'failure';
  occurredAt: string;
  requestId?: string;
}
