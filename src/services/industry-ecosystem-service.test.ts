import { describe, expect, it } from 'vitest';
import { IndustryEcosystemService } from './industry-ecosystem-service';
import type { IndustryProfile } from '../domain/industry-ecosystem';

const profile: IndustryProfile = {
  id: 'p1', operatorId: 'o1', displayName: 'PNG Adventures', description: 'Published tourism operator profile',
  provinceCode: 'NCD', categories: ['tour'], publicContact: { website: 'https://example.test' }, published: true,
  reviewStatus: 'published', updatedAt: '2026-01-01T00:00:00.000Z', version: 1,
};

describe('IndustryEcosystemService', () => {
  it('exposes published profiles through the public boundary', async () => {
    const service = new IndustryEcosystemService({
      isOperatorActive: async () => true,
      getProfile: async () => profile,
      saveProfile: async value => value,
      listPublishedProfiles: async () => [profile],
      getExperience: async () => null,
      saveExperience: async value => value,
      listPublishedExperiences: async () => [],
      createLead: async lead => lead,
      listLeads: async () => [],
    });
    expect(await service.publicProfiles('NCD')).toEqual([profile]);
  });

  it('does not let the operator service bypass governed publication', async () => {
    const service = new IndustryEcosystemService({
      isOperatorActive: async () => true,
      getProfile: async () => null,
      saveProfile: async value => value,
      listPublishedProfiles: async () => [],
      getExperience: async () => null,
      saveExperience: async value => value,
      listPublishedExperiences: async () => [],
      createLead: async lead => lead,
      listLeads: async () => [],
    });
    await expect(service.saveExperience({ id: 'e1', operatorId: 'o1', title: 'Dive', summary: 'Dive', provinceCode: 'NCD', status: 'published', updatedAt: '2026-01-01T00:00:00.000Z', version: 1 })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
