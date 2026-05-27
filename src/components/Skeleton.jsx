import React from 'react';
import { motion } from 'framer-motion';

const C = {
  t900: '#0d1117',
  bSoft: 'rgba(0,0,0,0.07)',
  bgMuted: '#f3f5f8',
};

// Generic basic Shimmer block
export function Skeleton({ width = '100%', height = '1rem', borderRadius = '0.5rem', style = {} }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

// Shimmering Product Card to match ProductCard.jsx exactly
export function ProductCardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', position: 'relative' }}>
      {/* Image Block */}
      <div style={{
        position: 'relative',
        borderRadius: '1.25rem',
        overflow: 'hidden',
        aspectRatio: '1/1.1',
        background: C.bgMuted,
        border: `1px solid ${C.bSoft}`
      }}>
        {/* Shimmer inside the image area */}
        <div className="skeleton-shimmer" style={{ width: '100%', height: '100%' }} />
        
        {/* Heart button mock */}
        <div style={{
          position: 'absolute',
          top: '0.65rem',
          right: '0.65rem',
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }} />
        
        {/* Cart button mock */}
        <div style={{
          position: 'absolute',
          bottom: '0.65rem',
          right: '0.65rem',
          width: 34,
          height: 34,
          borderRadius: '0.65rem',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(4px)',
        }} />
      </div>

      {/* Info Block */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0 0.25rem' }}>
        {/* Title line */}
        <Skeleton width="80%" height="0.88rem" borderRadius="0.35rem" />
        {/* Price & Tag line */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Skeleton width="35%" height="0.8rem" borderRadius="0.3rem" />
          <Skeleton width="25%" height="0.7rem" borderRadius="0.25rem" />
        </div>
      </div>
    </div>
  );
}

// Shimmering Details Layout to match ProductDetails.jsx
export function ProductDetailsSkeleton() {
  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'center' }}>
        <Skeleton width="40px" height="0.7rem" />
        <span style={{ color: C.bSoft }}>/</span>
        <Skeleton width="60px" height="0.7rem" />
        <span style={{ color: C.bSoft }}>/</span>
        <Skeleton width="100px" height="0.7rem" />
      </div>

      {/* Main card mock */}
      <div style={{
        background: '#fff',
        border: `1px solid ${C.bSoft}`,
        borderRadius: '2rem',
        padding: '2rem',
        boxShadow: '0 2px 24px -6px rgba(0,0,0,0.08)',
        marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
          {/* Gallery mock (left) */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {/* Thumbnails */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: 56 }}>
              {[1, 2, 3].map(i => (
                <Skeleton key={i} width="56px" height="56px" borderRadius="0.75rem" />
              ))}
            </div>
            {/* Large image */}
            <div style={{ flex: 1, aspectRatio: '1/1', borderRadius: '1.5rem', overflow: 'hidden', border: `1px solid ${C.bSoft}` }}>
              <div className="skeleton-shimmer" style={{ width: '100%', height: '100%' }} />
            </div>
          </div>

          {/* Details info mock (right) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              {/* Category */}
              <Skeleton width="80px" height="0.8rem" borderRadius="0.4rem" style={{ marginBottom: '0.5rem' }} />
              {/* Title */}
              <Skeleton width="90%" height="2rem" borderRadius="0.6rem" style={{ marginBottom: '0.75rem' }} />
              {/* Ratings row */}
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} width="12px" height="12px" borderRadius="50%" />
                ))}
                <Skeleton width="60px" height="0.75rem" style={{ marginLeft: '0.5rem' }} />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: `1px solid ${C.bSoft}`, margin: 0 }} />

            {/* Price section */}
            <div>
              <Skeleton width="120px" height="2rem" borderRadius="0.5rem" style={{ marginBottom: '0.25rem' }} />
              <Skeleton width="80px" height="0.8rem" />
            </div>

            {/* Description lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <Skeleton width="100%" height="0.75rem" />
              <Skeleton width="95%" height="0.75rem" />
              <Skeleton width="98%" height="0.75rem" />
              <Skeleton width="60%" height="0.75rem" />
            </div>

            {/* Action buttons mock */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Skeleton width="120px" height="2.5rem" borderRadius="9999px" />
              <Skeleton width="150px" height="2.5rem" borderRadius="9999px" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shimmering Home Layout to match Home.jsx
export function HomeSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Hero section mock */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', minHeight: '360px' }}>
        {/* Left Hero Card */}
        <div style={{
          background: C.bgMuted,
          borderRadius: '2rem',
          border: `1px solid ${C.bSoft}`,
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <Skeleton width="120px" height="0.8rem" style={{ marginBottom: '1rem' }} />
            <Skeleton width="70%" height="2.5rem" borderRadius="0.5rem" style={{ marginBottom: '0.5rem' }} />
            <Skeleton width="40%" height="2rem" borderRadius="0.5rem" />
          </div>
          <Skeleton width="160px" height="2.5rem" borderRadius="9999px" />
        </div>

        {/* Right Sidebar Quick Lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Blue Users card mock */}
          <div style={{
            background: '#3b82f6',
            borderRadius: '1.75rem',
            padding: '1.5rem',
            opacity: 0.85,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}>
            <Skeleton width="60px" height="1.8rem" borderRadius="0.4rem" />
            <Skeleton width="120px" height="0.8rem" />
          </div>

          {/* Top Picks mock */}
          <div style={{
            background: '#fff',
            borderRadius: '1.75rem',
            padding: '1.25rem',
            border: `1px solid ${C.bSoft}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            flex: 1,
          }}>
            <Skeleton width="100px" height="1rem" />
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Skeleton width="56px" height="56px" borderRadius="1rem" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <Skeleton width="80%" height="0.8rem" />
                  <Skeleton width="40%" height="0.75rem" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Perks Strip mock */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            background: '#fff',
            border: `1px solid ${C.bSoft}`,
            borderRadius: '1.5rem',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.9rem',
          }}>
            <Skeleton width="40px" height="40px" borderRadius="0.875rem" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
              <Skeleton width="60%" height="0.8rem" />
              <Skeleton width="90%" height="0.7rem" />
            </div>
          </div>
        ))}
      </div>

      {/* Categories mock */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <Skeleton width="120px" height="1.5rem" />
          <Skeleton width="60px" height="1rem" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.85rem' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} style={{
              background: '#fff',
              border: `1px solid ${C.bSoft}`,
              borderRadius: '1.5rem',
              padding: '1.25rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <Skeleton width="48px" height="48px" borderRadius="50%" />
              <Skeleton width="80%" height="0.7rem" />
            </div>
          ))}
        </div>
      </div>

      {/* Featured mock */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <Skeleton width="140px" height="1.5rem" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: '1rem', minHeight: '280px' }}>
          <div style={{ background: C.bgMuted, borderRadius: '1.75rem', border: `1px solid ${C.bSoft}` }}>
            <div className="skeleton-shimmer" style={{ width: '100%', height: '100%' }} />
          </div>
          <div style={{ background: C.bgMuted, borderRadius: '1.75rem', border: `1px solid ${C.bSoft}` }}>
            <div className="skeleton-shimmer" style={{ width: '100%', height: '100%' }} />
          </div>
          <div style={{
            background: '#fff',
            borderRadius: '1.75rem',
            padding: '1.25rem',
            border: `1px solid ${C.bSoft}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}>
            <Skeleton width="100px" height="1rem" />
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Skeleton width="48px" height="48px" borderRadius="0.875rem" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <Skeleton width="70%" height="0.8rem" />
                  <Skeleton width="40%" height="0.75rem" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Glowing premium spinner component
export function LoadingSpinner({ size = 48, label = 'Loading…' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Pulsing glow background */}
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: -4,
            background: `radial-gradient(circle, ${C.t900} 0%, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(6px)',
            pointerEvents: 'none',
          }}
        />
        {/* Spinner ring */}
        <div style={{
          position: 'absolute',
          inset: 0,
          border: '3px solid #f3f5f8',
          borderTopColor: C.t900,
          borderRadius: '50%',
          animation: 'spin .75s linear infinite'
        }} />
        {/* Core dot */}
        <div style={{
          position: 'absolute',
          inset: '32%',
          background: C.t900,
          borderRadius: '0.25rem',
        }} />
      </div>
      {label && <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#adb5bd', letterSpacing: '0.04em' }}>{label}</p>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
