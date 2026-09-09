import { DomainError } from '../domain/errors';
import type { IndustryExperience, IndustryProfile, IndustryRepository, VisitorLead } from '../domain/industry-ecosystem';
import type { ProvinceCode } from '../domain/types';

export interface IndustryServiceDeps extends IndustryRepository {
  isOperatorActive(operatorId: string): Promise<boolean>;
}

export class IndustryEcosystemService {
  constructor(private readonly deps: IndustryServiceDeps) {}

  async publicProfiles(provinceCode?: ProvinceCode) {
    return this.deps.listPublishedProfiles({ provinceCode, limit: 100 });
  }

  async publicExperiences(options?: { provinceCode?: ProvinceCode; destinationId?: string }) {
    return this.deps.listPublishedExperiences({ ...options, limit: 100 });
  }

  async saveProfile(profile: IndustryProfile, expectedVersion?: number) {
    if (!(await this.deps.isOperatorActive(profile.operatorId))) {
      throw new DomainError('FORBIDDEN', 'Only active operators may manage an industry profile');
    }
    const saved = await this.deps.saveProfile(profile, expectedVersion);
    if (!saved) throw new DomainError('CONFLICT', 'Industry profile changed; refresh and retry');
    return saved;
  }

  async saveExperience(experience: IndustryExperience, expectedVersion?: number) {
    if (!(await this.deps.isOperatorActive(experience.operatorId))) {
      throw new DomainError('FORBIDDEN', 'Only active operators may manage experiences');
    }
    if (experience.status === 'published') {
      throw new DomainError('FORBIDDEN', 'Experience publication requires the governed content publication path');
    }
    const saved = await this.deps.saveExperience(experience, expectedVersion);
    if (!saved) throw new DomainError('CONFLICT', 'Experience changed; refresh and retry');
    return saved;
  }

  async createLead(lead: VisitorLead) {
    if (!(await this.deps.isOperatorActive(lead.operatorId))) {
      throw new DomainError('FORBIDDEN', 'Lead target must be an active operator');
    }
    return this.deps.createLead(lead);
  }

  async operatorLeads(operatorId: string) {
    if (!(await this.deps.isOperatorActive(operatorId))) throw new DomainError('FORBIDDEN', 'Operator is not active');
    return this.deps.listLeads(operatorId);
  }
}
