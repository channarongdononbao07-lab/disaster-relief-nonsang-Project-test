'use client';
import { useState } from 'react';
import WarningTowerLogo from '../../components/WarningTowerLogo';
import { useToast } from '../../components/Toast';
import { authenticateUser } from '../../lib/userStore';

export default function LoginPage({ onLoginSuccess, onNavigate }) {
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');

    const user = authenticateUser(username.trim(), password.trim());
    if (user) {
      showToast('เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ ${user.name}`, 'success');
      if (onLoginSuccess) onLoginSuccess(user);
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      showToast('เข้าสู่ระบบไม่สำเร็จ', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
    }
    setLoading(false);
  };



  return (
    <>
      <div className="page-header" style={{ textAlign: 'center', padding: '36px 20px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <WarningTowerLogo size={64} />
        </div>
        <div className="page-header-badge" style={{ margin: '0 auto 12px' }}>
          <span className="badge-dot" style={{ background: '#FBBF24' }}></span>
          ระบบสำหรับเจ้าหน้าที่
        </div>
        <h1 style={{ fontSize: '1.4rem' }}>เข้าสู่ระบบเจ้าหน้าที่รับเรื่อง</h1>
        <p style={{ marginTop: 4 }}>สำหรับเจ้าหน้าที่ ปภ. ตรวจสอบเอกสารและอนุมัติคำร้อง</p>
      </div>

      <div className="card" style={{ maxWidth: 440, margin: '-24px auto 24px', position: 'relative', zIndex: 10 }}>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">
              ชื่อผู้ใช้งาน (Username)
            </label>
            <input
              type="text"
              id="login-username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="กรอกชื่อผู้ใช้งาน"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              รหัสผ่าน (Password)
            </label>
            <input
              type="password"
              id="login-password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่าน"
              required
            />
          </div>

          {error && (
            <div className="form-error-text" style={{ marginBottom: 16, padding: '8px 12px', background: 'var(--danger-50)', borderRadius: 'var(--radius-sm)' }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
            id="login-submit-btn"
          >
            {loading ? (
              <>
                <span className="spinner" style={{ borderTopColor: 'white' }}></span>
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
                เข้าสู่ระบบเจ้าหน้าที่
              </>
            )}
          </button>
        </form>


      </div>

      <div style={{ textAlign: 'center', padding: '0 20px 40px' }}>
        <button
          className="btn btn-ghost"
          onClick={() => onNavigate('home')}
          id="back-home-from-login-btn"
        >
          ← กลับหน้าแรก (โหมดประชาชนทั่วไป)
        </button>
      </div>
    </>
  );
}
