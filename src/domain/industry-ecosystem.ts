import type { ProvinceCode } from './types';

export type IndustryExperienceStatus = 'draft' | 'submitted' | 'published' | 'suspended';
export type IndustryProfileReviewStatus = 'draft' | 'submitted' | 'published' | 'suspended';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed' | 'declined';

export interface IndustryProfile {
  id: string;
  operatorId: string;
  displayName: string;
  description: string;
  provinceCode: ProvinceCode;
  categories: string[];
  publicContact?: { website?: string; email?: string; phone?: string };
  published: boolean;
  reviewStatus: IndustryProfileReviewStatus;
  updatedAt: string;
  version: number;
}

export interface IndustryExperience {
  id: string;
  operatorId: string;
  title: string;
  summary: string;
  destinationId?: string;
  provinceCode: ProvinceCode;
  status: IndustryExperienceStatus;
  updatedAt: string;
  version: number;
}

export interface VisitorLead {
  id: string;
  operatorId: string;
  experienceId?: string;
  source: 'visitor' | 'qr' | 'referral';
  status: LeadStatus;
  visitorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IndustryRepository {
  getProfile(operatorId: string): Promise<IndustryProfile | null>;
  saveProfile(profile: IndustryProfile, expectedVersion?: number): Promise<IndustryProfile | null>;
  listPublishedProfiles(options?: { provinceCode?: ProvinceCode; limit?: number }): Promise<IndustryProfile[]>;
  getExperience(id: string): Promise<IndustryExperience | null>;
  saveExperience(experience: IndustryExperience, expectedVersion?: number): Promise<IndustryExperience | null>;
  listPublishedExperiences(options?: { provinceCode?: ProvinceCode; destinationId?: string; limit?: number }): Promise<IndustryExperience[]>;
  createLead(lead: VisitorLead): Promise<VisitorLead>;
  listLeads(operatorId: string): Promise<VisitorLead[]>;
}
