import { Link } from 'react-router-dom';
import { Package, Globe, Share2, Link2 } from 'lucide-react';
import useSettingsStore from '../store/useSettingsStore';
import { getImageUrl } from '../api/axios';

export default function Footer() {
  const { settings } = useSettingsStore();
  return (
    <footer style={{ background: '#fff', borderTop: '1px solid #eaeef2', marginTop: '3rem' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: '3rem' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
              {settings?.logo_url ? (
                <img src={getImageUrl(settings.logo_url)} alt="Logo" style={{ width: 36, height: 36, borderRadius: '0.75rem', objectFit: 'contain' }} />
              ) : (
                <div style={{ width: 36, height: 36, background: '#0d1117', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package style={{ width: 16, height: 16, color: '#fff' }} />
                </div>
              )}
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.04em', color: '#0d1117' }}>eraya.</span>
            </Link>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.75, maxWidth: 280, margin: 0 }}>
              Curated excellence for the modern minimalist. Redefining the digital shopping experience through aesthetics and precision.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[Globe, Share2, Link2].map((Icon, i) => (
                <a key={i} href="#" style={{ width: 36, height: 36, background: '#f8fafc', border: '1px solid #eaeef2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all .2s', textDecoration: 'none' }}
                   onMouseEnter={e => { e.currentTarget.style.background = '#0d1117'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#0d1117'; }}
                   onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#eaeef2'; }}>
                  <Icon style={{ width: 14, height: 14 }} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.28em', color: '#94a3b8', marginBottom: '1.25rem' }}>Collections</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {['New Arrivals','Best Sellers','Deals'].map(t => (
                <Link key={t} to="/products" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
                  onMouseLeave={e => e.currentTarget.style.color = '#374151'}>{t}</Link>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.28em', color: '#94a3b8', marginBottom: '1.25rem' }}>Company</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[['About','/about'],['Support','/faq'],['Contact','/contact']].map(([t,href]) => (
                <Link key={t} to={href} style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
                  onMouseLeave={e => e.currentTarget.style.color = '#374151'}>{t}</Link>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.28em', color: '#94a3b8', marginBottom: '1.25rem' }}>Stay Updated</p>
            <div style={{ position: 'relative' }}>
              <input type="email" placeholder="your@email.com" className="search-pill" style={{ paddingRight: '7rem' }} />
              <button style={{ position: 'absolute', right: '0.35rem', top: '50%', transform: 'translateY(-50%)', background: '#0d1117', color: '#fff', border: 'none', borderRadius: 999, padding: '0.55rem 1.1rem', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Join
              </button>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '2.5rem', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.2em', margin: 0 }}>© 2026 Eraya. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {['Privacy','Terms','Cookies'].map(t => (
              <Link key={t} to="#" style={{ fontSize: '0.62rem', fontWeight: 700, color: '#cbd5e1', textDecoration: 'none', letterSpacing: '0.1em', transition: 'color .2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#0d1117'}
                onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}>{t}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
