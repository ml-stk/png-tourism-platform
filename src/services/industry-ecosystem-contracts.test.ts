import { describe, expect, it } from 'vitest';
import { isLeadSource, isPublicIndustryExperience, isPublicIndustryProfile } from './industry-ecosystem-contracts';

describe('industry public boundary helpers', () => {
  it('requires explicit publication', () => {
    expect(isPublicIndustryProfile({ published: true } as any)).toBe(true);
    expect(isPublicIndustryExperience({ status: 'draft' } as any)).toBe(false);
  });
  it('accepts only governed lead sources', () => {
    expect(isLeadSource('visitor')).toBe(true);
    expect(isLeadSource('private')).toBe(false);
  });
});
