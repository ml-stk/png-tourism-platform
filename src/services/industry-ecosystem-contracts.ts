import type { IndustryExperience, IndustryProfile, VisitorLead } from '../domain/industry-ecosystem';

export function isPublicIndustryProfile(profile: IndustryProfile): boolean {
  return profile.published === true;
}

export function isPublicIndustryExperience(experience: IndustryExperience): boolean {
  return experience.status === 'published';
}

export function isLeadSource(value: unknown): value is VisitorLead['source'] {
  return value === 'visitor' || value === 'qr' || value === 'referral';
}
