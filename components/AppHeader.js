'use client';
import { useState } from 'react';
import WarningTowerLogo from './WarningTowerLogo';

export default function AppHeader({ currentPage = 'home', onNavigate, officerUser, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'หน้าแรก', icon: '🏠' },
    { id: 'new-request', label: 'ยื่นคำร้องใหม่', icon: '📝' },
    { id: 'registry', label: 'ทะเบียนคำร้อง', icon: '📋' },
  ];

  // รายงานสถิติ: เฉพาะเจ้าหน้าที่ที่ login แล้ว
  if (officerUser) {
    navItems.push({ id: 'statistics', label: 'รายงานสถิติ', icon: '📊' });
  }

  if (officerUser?.role === 'superadmin') {
    navItems.push({ id: 'admin', label: 'จัดการเจ้าหน้าที่ (Superadmin)', icon: '👑' });
  }

  const handleNav = (page) => {
    setMenuOpen(false);
    if (onNavigate) onNavigate(page);
  };

  const isSuperadmin = officerUser?.role === 'superadmin';

  return (
    <>
      <header className="app-header">
        <div className="header-top">
          <a href="#" className="header-logo" onClick={(e) => { e.preventDefault(); handleNav('home'); }}>
            <WarningTowerLogo size={36} />
            <div className="header-logo-text">
              <span className="header-system-title">ระบบคำร้องขอรับการช่วยเหลือสาธารณภัย</span>
              <small className="header-sub-text">
                Disaster Relief System <strong className="header-org-highlight">เทศบาลตำบลโนนสัง</strong>
              </small>
            </div>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {officerUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isSuperadmin ? (
                  <button
                    onClick={() => handleNav('admin')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    }}
                    id="header-superadmin-badge"
                  >
                    👑 Superadmin
                  </button>
                ) : (
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    id="header-officer-badge"
                  >
                    🛡️ เจ้าหน้าที่
                  </span>
                )}
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ color: '#ffffff', background: 'rgba(0, 0, 0, 0.15)', padding: '5px 10px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  id="header-logout-btn"
                >
                  ออก
                </button>
              </div>
            ) : (
              <button
                className="btn btn-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.22)',
                  border: '1.5px solid rgba(255, 255, 255, 0.5)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  backdropFilter: 'blur(4px)',
                }}
                onClick={() => handleNav('login')}
                id="header-login-btn"
              >
                🔐 เข้าระบบเจ้าหน้าที่
              </button>
            )}

            <button
              className="menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="เปิดเมนู"
              id="menu-toggle-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {menuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Side Menu */}
      {menuOpen && (
        <div className="side-menu-overlay" onClick={() => setMenuOpen(false)} />
      )}
      <nav className={`side-menu ${menuOpen ? 'open' : ''}`}>
        <div className="side-menu-header">
          <WarningTowerLogo size={48} />
          <h3>ระบบคำร้องสาธารณภัย</h3>
          <p className="side-menu-subtext">
            Disaster Relief System <strong className="side-menu-org-highlight">เทศบาลตำบลโนนสัง</strong>
          </p>
        </div>
        <div className="side-menu-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`side-menu-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => handleNav(item.id)}
              id={`nav-${item.id}`}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div style={{ padding: '16px 20px', marginTop: 16, borderTop: '1px solid var(--gray-100)' }}>
            {officerUser ? (
              <div style={{ background: isSuperadmin ? 'var(--danger-50)' : 'var(--primary-50)', padding: 12, borderRadius: 'var(--radius-md)', border: `1px solid ${isSuperadmin ? 'var(--danger-200)' : 'var(--primary-200)'}` }}>
                <div style={{ fontSize: '0.72rem', color: isSuperadmin ? 'var(--danger-700)' : 'var(--primary-700)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {isSuperadmin ? '👑 Superadmin (ผู้ดูแลระบบ)' : '🛡️ ระบบเจ้าหน้าที่'}
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--gray-900)', marginTop: 2 }}>
                  {officerUser.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
                  {officerUser.position}
                </div>
                {isSuperadmin && (
                  <button
                    className="btn btn-sm btn-primary btn-block mt-4"
                    onClick={() => handleNav('admin')}
                    id="drawer-admin-btn"
                  >
                    👑 จัดการผู้ใช้งาน
                  </button>
                )}
                <button
                  className="btn btn-sm btn-outline btn-block mt-2"
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                  id="drawer-logout-btn"
                  style={{ borderColor: 'var(--danger-500)', color: 'var(--danger-600)' }}
                >
                  🚪 ออกจากระบบ
                </button>
              </div>
            ) : (
              <button
                className="btn btn-warning btn-block"
                onClick={() => handleNav('login')}
                id="drawer-login-btn"
                style={{ fontSize: '0.85rem' }}
              >
                🔐 เข้าสู่ระบบเจ้าหน้าที่
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
