import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const C = {
  t900: '#0f172a',
  t500: '#64748b',
  bSoft: 'rgba(0,0,0,0.07)',
  bgMuted: '#f1f5f9',
};

const Pagination = ({ 
  page, 
  totalPages, 
  onPageChange, 
  limit, 
  onLimitChange, 
  limitOptions = [10, 20, 50, 100] 
}) => {
  if (totalPages <= 1 && !onLimitChange) return null;

  const handlePageClick = (p) => {
    if (p === '...' || p === page) return;
    onPageChange(p);
  };

  const getPages = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '0.4rem',
      marginTop: '2.5rem',
      userSelect: 'none',
      flexWrap: 'wrap',
    }}>
      {totalPages > 1 && (
        <>
          {/* Prev Button */}
          <button
            onClick={() => page > 1 && onPageChange(page - 1)}
            disabled={page === 1}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: `1px solid ${C.bSoft}`,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.3 : 1,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              if (page !== 1) {
                e.currentTarget.style.background = C.bgMuted;
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={e => {
              if (page !== 1) {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.transform = 'none';
              }
            }}
          >
            <ChevronLeft style={{ width: 16, height: 16, color: C.t900 }} />
          </button>

          {/* Page Numbers */}
          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
            {getPages().map((p, idx) => {
              const isActive = page === p;
              const isEllipsis = p === '...';
              return (
                <button
                  key={idx}
                  onClick={() => handlePageClick(p)}
                  disabled={isEllipsis}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    border: 'none',
                    background: isActive ? C.t900 : 'transparent',
                    color: isActive ? '#fff' : isEllipsis ? C.t500 : C.t900,
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 800 : 600,
                    cursor: isEllipsis ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={e => {
                    if (!isActive && !isEllipsis) {
                      e.currentTarget.style.background = C.bgMuted;
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive && !isEllipsis) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => page < totalPages && onPageChange(page + 1)}
            disabled={page === totalPages}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: `1px solid ${C.bSoft}`,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.3 : 1,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              if (page !== totalPages) {
                e.currentTarget.style.background = C.bgMuted;
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={e => {
              if (page !== totalPages) {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.transform = 'none';
              }
            }}
          >
            <ChevronRight style={{ width: 16, height: 16, color: C.t900 }} />
          </button>
        </>
      )}

      {onLimitChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: totalPages > 1 ? '1.5rem' : '0' }}>
          <span style={{ fontSize: '0.82rem', color: C.t500, fontWeight: 500 }}>Items per page:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            style={{
              padding: '0.35rem 0.6rem',
              borderRadius: '6px',
              border: `1px solid ${C.bSoft}`,
              background: '#fff',
              color: C.t900,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          >
            {limitOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default Pagination;
