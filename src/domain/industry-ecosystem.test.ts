import { describe, expect, it } from 'vitest';
import type { IndustryExperience, VisitorLead } from './industry-ecosystem';

describe('industry ecosystem contracts', () => {
  it('represents a non-published experience without regulatory fields', () => {
    const experience: IndustryExperience = { id: 'e1', operatorId: 'o1', title: 'Reef trip', summary: 'A visitor experience', provinceCode: 'NCD', status: 'draft', updatedAt: '2026-01-01T00:00:00.000Z', version: 1 };
    expect(experience.status).toBe('draft');
  });
  it('supports visitor lead provenance without private regulatory data', () => {
    const lead: VisitorLead = { id: 'l1', operatorId: 'o1', source: 'qr', status: 'new', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
    expect(lead.source).toBe('qr');
  });
});
