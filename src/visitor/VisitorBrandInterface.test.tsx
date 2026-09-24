import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('visitor brand interface contract', () => {
  it('uses the supplied TPA logo and approved visitor navigation structure', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/VisitorHome.tsx'), 'utf8');
    const passportSource = fs.readFileSync(path.resolve(process.cwd(), 'src/visitor/DigitalPassport.tsx'), 'utf8');
    expect(source).toContain("import tpaLogo from './assets/png-tpa-logo.png';");
    expect(source).toContain('Discover');
    expect(source).toContain('Papua New Guinea');
    expect(source).toMatch(/Featured\s+Destinations/);
    expect(source).toContain('AI Concierge');
    expect(source).toMatch(/<DigitalPassport\s*\/>/);
    expect(passportSource).toContain('Digital Tourism Passport');
  });
});
