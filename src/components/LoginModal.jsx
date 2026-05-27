import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, X, ArrowRight, ShoppingBag, Star } from 'lucide-react';

/**
 * Premium "Login Required" modal
 * Props:
 *   open      — boolean
 *   onClose   — () => void
 *   reason    — 'wishlist' | 'cart' | 'checkout'  (optional, defaults to 'wishlist')
 */
export default function LoginModal({ open, onClose, reason = 'wishlist' }) {
  const copy = {
    wishlist: {
      icon: Heart,
      iconColor: '#f43f5e',
      iconBg: '#fff1f2',
      title: 'Save to Wishlist',
      sub: 'Sign in to save your favourite items and access them anytime.',
    },
    cart: {
      icon: ShoppingBag,
      iconColor: '#3b82f6',
      iconBg: '#eff6ff',
      title: 'Add to Cart',
      sub: 'Sign in to add items to your cart and start shopping.',
    },
    checkout: {
      icon: Star,
      iconColor: '#f59e0b',
      iconBg: '#fffbeb',
      title: 'Almost there!',
      sub: 'Sign in to complete your purchase and track your order.',
    },
  };

  const { icon: Icon, iconColor, iconBg, title, sub } = copy[reason] ?? copy.wishlist;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              background: 'rgba(13,17,23,0.45)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem', pointerEvents: 'none',
            }}
          >
            <div style={{
              background: '#fff',
              borderRadius: '2rem',
              padding: '2.25rem',
              width: '100%', maxWidth: 380,
              boxShadow: '0 40px 100px -20px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04)',
              position: 'relative', pointerEvents: 'auto',
              overflow: 'hidden',
            }}>
              {/* Decorative blur */}
              <div style={{ position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: '50%', background: `${iconColor}18`, filter: 'blur(50px)', pointerEvents: 'none' }} />

              {/* Close */}
              <button
                onClick={onClose}
                style={{
                  position: 'absolute', top: '1.25rem', right: '1.25rem',
                  width: 32, height: 32, borderRadius: '50%',
                  border: '1px solid rgba(0,0,0,0.07)', background: '#f3f5f8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#6b7280', transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.color = '#0d1117'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f3f5f8'; e.currentTarget.style.color = '#6b7280'; }}
              >
                <X style={{ width: 13, height: 13 }} />
              </button>

              {/* Icon */}
              <div style={{
                width: 60, height: 60, borderRadius: '1.25rem',
                background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.25rem', position: 'relative', zIndex: 1,
              }}>
                <Icon style={{ width: 26, height: 26, color: iconColor, fill: reason === 'wishlist' ? iconColor : 'none' }} />
              </div>

              {/* Text */}
              <h2 style={{
                fontSize: '1.35rem', fontWeight: 900, color: '#0d1117',
                margin: '0 0 0.5rem', letterSpacing: '-0.03em', lineHeight: 1.2,
                position: 'relative', zIndex: 1,
              }}>
                {title}
              </h2>
              <p style={{
                fontSize: '0.82rem', color: '#6b7280', margin: '0 0 1.75rem',
                lineHeight: 1.6, fontWeight: 500, position: 'relative', zIndex: 1,
              }}>
                {sub}
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'relative', zIndex: 1 }}>
                <Link
                  to="/login"
                  onClick={onClose}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.9rem 1.5rem', background: '#0d1117',
                    color: '#fff', borderRadius: '1.25rem', textDecoration: 'none',
                    fontSize: '0.88rem', fontWeight: 800, transition: 'all .2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0d1117'; e.currentTarget.style.transform = 'none'; }}
                >
                  Sign in to continue
                  <ArrowRight style={{ width: 15, height: 15 }} />
                </Link>

                <Link
                  to="/signup"
                  onClick={onClose}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0.9rem 1.5rem', background: '#f3f5f8',
                    color: '#0d1117', borderRadius: '1.25rem', textDecoration: 'none',
                    fontSize: '0.85rem', fontWeight: 700, transition: 'all .2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f3f5f8'}
                >
                  Create free account
                </Link>
              </div>

              {/* Footer note */}
              <p style={{ textAlign: 'center', fontSize: '0.68rem', color: '#adb5bd', margin: '1.25rem 0 0', fontWeight: 500, position: 'relative', zIndex: 1 }}>
                Free forever · No credit card required
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
