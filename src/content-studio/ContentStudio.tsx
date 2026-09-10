import { useEffect, useMemo, useState } from 'react';
import type { ContentItem, Destination, Province } from '../domain/types';

const api = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message || 'Request failed');
  return body.data as T;
};

export function ContentStudio() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [tab, setTab] = useState<'destinations' | 'content'>('destinations');
  const [status, setStatus] = useState('Loading editorial workspace…');
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState('');

  const refresh = async () => {
    setStatus('Refreshing governed content…');
    try {
      const [d, c, p] = await Promise.all([
        api<{ items: Destination[] }>('/api/v1/destinations?limit=100'),
        api<{ items: ContentItem[] }>('/api/v1/content?limit=100'),
        api<Province[]>('/api/v1/provinces'),
      ]);
      setDestinations(d.items || []); setContent(c.items || []); setProvinces(p || []); setStatus('Editorial data is current');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to load editorial data'); }
  };
  useEffect(() => { void refresh(); }, []);

  const filteredDestinations = useMemo(() => destinations.filter((item) => (!province || item.provinceCode === province) && item.name.toLowerCase().includes(query.toLowerCase())), [destinations, province, query]);
  const filteredContent = useMemo(() => content.filter((item) => (!province || item.provinceCode === province) && item.title.toLowerCase().includes(query.toLowerCase())), [content, province, query]);
  const selectedDestination = destinations.find((item) => item.id === selected);
  const selectedContent = content.find((item) => item.id === selected);

  return <section className="png-studio">
    <div className="png-studio-hero">
      <div><div className="png-kicker">TPA CONTENT STUDIO</div><h1>Shape the stories visitors discover.</h1><p>Governed editorial control for destinations, experiences and published tourism content.</p></div>
      <button className="png-button png-button-primary" onClick={() => void refresh()}>Refresh workspace</button>
    </div>
    <div className="png-studio-toolbar">
      <div className="png-tabs"><button className={tab === 'destinations' ? 'active' : ''} onClick={() => { setTab('destinations'); setSelected(''); }}>Destinations</button><button className={tab === 'content' ? 'active' : ''} onClick={() => { setTab('content'); setSelected(''); }}>Content library</button></div>
      <input aria-label="Search editorial content" placeholder="Search by name or title…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <select aria-label="Filter province" value={province} onChange={(e) => setProvince(e.target.value)}><option value="">All provinces</option>{provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}</select>
    </div>
    <div className="png-studio-status">{status}</div>
    <div className="png-studio-grid">
      <div className="png-studio-list">{tab === 'destinations' ? filteredDestinations.map((item) => <button key={item.id} className={`png-studio-row ${selected === item.id ? 'selected' : ''}`} onClick={() => setSelected(item.id)}><span><strong>{item.name}</strong><small>{item.provinceCode} · v{item.contentVersion}</small></span><span className={`png-status png-status-${item.publicationStatus}`}>{item.publicationStatus}</span></button>) : filteredContent.map((item) => <button key={item.id} className={`png-studio-row ${selected === item.id ? 'selected' : ''}`} onClick={() => setSelected(item.id)}><span><strong>{item.title}</strong><small>{item.type} · {item.provinceCode || 'national'} · v{item.version}</small></span><span className={`png-status png-status-${item.publicationStatus}`}>{item.publicationStatus}</span></button>)}{(tab === 'destinations' ? filteredDestinations : filteredContent).length === 0 && <div className="png-empty">No editorial records match this view.</div>}</div>
      <div className="png-studio-preview">{selectedDestination && <DestinationEditor destination={selectedDestination} onSaved={refresh} />} {selectedContent && <ContentEditor item={selectedContent} onSaved={refresh} />} {!selectedDestination && !selectedContent && <div className="png-preview-empty"><div className="png-kicker">EDITORIAL PREVIEW</div><h2>Select a record</h2><p>Drafts remain inside the TPA workspace. Only explicitly published content can flow to visitor, AI, offline and QR projections.</p></div>}</div>
    </div>
  </section>;
}

function DestinationEditor({ destination, onSaved }: { destination: Destination; onSaved: () => Promise<void> | void }) {
  const [description, setDescription] = useState(destination.description || ''); const [saving, setSaving] = useState(false); const [message, setMessage] = useState('');
  const save = async () => { setSaving(true); setMessage(''); try { await api(`/api/v1/destinations/${destination.id}`, { method: 'PATCH', body: JSON.stringify({ description }) }); setMessage('Saved as a new content version.'); await onSaved(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Save failed'); } finally { setSaving(false); } };
  return <><div className="png-preview-header"><div><div className="png-kicker">DESTINATION PROFILE</div><h2>{destination.name}</h2></div><span className={`png-status png-status-${destination.publicationStatus}`}>{destination.publicationStatus}</span></div><div className="png-editor-meta"><span>{destination.provinceCode}</span><span>Version {destination.contentVersion}</span><span>Updated {new Date(destination.updatedAt).toLocaleString()}</span></div><label>Visitor description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} placeholder="Describe the destination for visitors…" /></label><div className="png-editor-note">Preview mode is governed: edits remain private until the publication workflow promotes them.</div><div className="png-editor-actions"><button className="png-button png-button-primary" disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save version'}</button>{message && <span>{message}</span>}</div></>;
}

function ContentEditor({ item, onSaved }: { item: ContentItem; onSaved: () => Promise<void> | void }) {
  const [summary, setSummary] = useState(item.summary || ''); const [body, setBody] = useState(item.body || ''); const [saving, setSaving] = useState(false); const [message, setMessage] = useState('');
  const save = async () => { setSaving(true); setMessage(''); try { await api(`/api/v1/content/${item.id}`, { method: 'PATCH', body: JSON.stringify({ summary, body }) }); setMessage('Saved as a new content version.'); await onSaved(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Save failed'); } finally { setSaving(false); } };
  const publish = async () => { setSaving(true); setMessage(''); try { await api(`/api/v1/content/${item.id}/publish`, { method: 'POST' }); setMessage('Published with an auditable publication timestamp.'); await onSaved(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Publication failed'); } finally { setSaving(false); } };
  return <><div className="png-preview-header"><div><div className="png-kicker">{item.type.toUpperCase()}</div><h2>{item.title}</h2></div><span className={`png-status png-status-${item.publicationStatus}`}>{item.publicationStatus}</span></div><div className="png-editor-meta"><span>{item.provinceCode || 'National'}</span><span>Version {item.version}</span><span>{item.publishedAt ? `Published ${new Date(item.publishedAt).toLocaleString()}` : 'Not published'}</span></div><label>Visitor summary<textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} /></label><label>Story / body<textarea value={body} onChange={(e) => setBody(e.target.value)} rows={9} /></label><div className="png-editor-note">Public projections, AI retrieval, offline manifests and QR handoffs remain published-only.</div><div className="png-editor-actions"><button className="png-button" disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save version'}</button>{item.publicationStatus === 'review' && <button className="png-button png-button-primary" disabled={saving} onClick={() => void publish()}>Publish</button>}{message && <span>{message}</span>}</div></>;
}
