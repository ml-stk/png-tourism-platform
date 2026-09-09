import { describe, expect, it } from 'vitest';

describe('public offline and QR delivery contract', () => {
  it('defines provincial and kiosk manifest contracts', () => {
    expect('/api/v1/public/offline/manifest?channel=provincial&province=ORO').toContain('channel=provincial');
    expect('/api/v1/public/offline/manifest?channel=kiosk').toContain('channel=kiosk');
  });

  it('defines QR resolution for published public targets only', () => {
    expect('/api/v1/public/qr/resolve?type=destination&id=dest-1').toContain('type=destination');
    expect('/api/v1/public/qr/resolve?type=content&id=content-1').toContain('type=content');
  });
});
