'use client';
import { useState, useEffect, useCallback } from 'react';
import WarningTowerLogo from '../../components/WarningTowerLogo';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getDemoRequests, calculateStats, subscribeDemoRequests, INITIAL_DEMO_REQUESTS } from '../../lib/demoStore';

export default function HomePage({ onNavigate }) {
  // Initialize with static default to guarantee zero SSR hydration mismatch
  const [stats, setStats] = useState(() => calculateStats(INITIAL_DEMO_REQUESTS));
  const [recentRequests, setRecentRequests] = useState(() => INITIAL_DEMO_REQUESTS.slice(0, 5));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const applyData = useCallback((requests) => {
    if (!requests) return;
    setRecentRequests(requests.slice(0, 5));
    setStats(calculateStats(requests));
  }, []);

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      applyData(getDemoRequests());
      return;
    }

    setIsRefreshing(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      // Query only required lightweight columns to minimize payload & network time
      const { data: requests, error } = await supabase
        .from('requests')
        .select('id, request_number, disaster_type, full_name, district, province, status, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (!error && requests && requests.length > 0) {
        applyData(requests);
      } else {
        applyData(getDemoRequests());
      }
    } catch (e) {
      // Graceful fallback to instant local cache
      applyData(getDemoRequests());
    } finally {
      setIsRefreshing(false);
    }
  }, [applyData]);

  useEffect(() => {
    loadData();
    // Subscribe to instant updates from form submissions and status changes
    const unsubscribe = subscribeDemoRequests((updatedData) => {
      applyData(updatedData);
    });
    return () => unsubscribe();
  }, [loadData, applyData]);

  const getStatusBadge = (status) => {
    const map = {
      pending: { class: 'badge-pending', text: 'รอดำเนินการ' },
      reviewing: { class: 'badge-reviewing', text: 'กำลังตรวจสอบ' },
      approved: { class: 'badge-approved', text: 'อนุมัติแล้ว' },
      rejected: { class: 'badge-rejected', text: 'ไม่อนุมัติ' },
    };
    const info = map[status] || map.pending;
    return <span className={`badge ${info.class}`}><span className="badge-dot"></span>{info.text}</span>;
  };


  return (
    <>
      {/* Hero Section */}
      <div className="page-header" style={{ textAlign: 'center', padding: '44px 20px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <WarningTowerLogo size={90} />
        </div>
        <div className="page-header-badge" style={{ margin: '0 auto 16px', fontSize: '1rem', padding: '8px 18px' }}>
          <span className="badge-dot" style={{ background: '#ffffff', width: 12, height: 12 }}></span>
          ระบบแจ้งเตือนภัยเพื่อประชาชน
        </div>
        <h1 style={{ fontSize: '2rem', lineHeight: 1.4, fontWeight: 800, color: '#ffffff' }}>
          ระบบคำร้องขอรับการช่วยเหลือ
          <br />
          <span style={{ color: '#fef08a', fontSize: '2.2rem', textShadow: '0 2px 10px rgba(180, 83, 9, 0.35)' }}>สาธารณภัย</span>
        </h1>
        <p style={{ marginTop: 12, maxWidth: 440, margin: '12px auto 0', fontSize: '1.2rem', color: '#ffffff', opacity: 0.95, lineHeight: 1.6 }}>
          ยื่นคำร้องง่ายๆ ด้วยตนเอง ติดตามสถานะได้ตลอด 24 ชั่วโมง
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon teal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
          </div>
          <div className="stat-value" suppressHydrationWarning>{stats.total}</div>
          <div className="stat-label">คำร้องทั้งหมด</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          </div>
          <div className="stat-value" suppressHydrationWarning>{stats.pending}</div>
          <div className="stat-label">รอดำเนินการ</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          </div>
          <div className="stat-value" suppressHydrationWarning>{stats.reviewing}</div>
          <div className="stat-label">กำลังตรวจสอบ</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
          </div>
          <div className="stat-value" suppressHydrationWarning>{stats.approved}</div>
          <div className="stat-label">อนุมัติแล้ว</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '0 16px', marginTop: 12 }}>
        <button
          className="btn btn-primary btn-block btn-lg"
          onClick={() => onNavigate('new-request')}
          id="new-request-btn"
          style={{ marginBottom: 14, fontSize: '1.3rem', padding: '20px 24px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6M12 18v-6M9 15h6" />
          </svg>
          ยื่นคำร้องขอความช่วยเหลือใหม่
        </button>
        <button
          className="btn btn-outline btn-block btn-lg"
          onClick={() => onNavigate('registry')}
          id="view-registry-btn"
          style={{ fontSize: '1.15rem', padding: '16px 24px' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          ตรวจสอบสถานะคำร้อง
        </button>
      </div>

      {/* Recent Requests */}
      <div className="card" style={{ animationDelay: '0.3s', marginTop: 8 }}>
        <div className="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          คำร้องล่าสุด
        </div>

        {recentRequests.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M12 18v-4M12 10h.01" />
            </svg>
            <h3>ยังไม่มีคำร้อง</h3>
            <p>เริ่มต้นด้วยการยื่นคำร้องใหม่</p>
          </div>
        ) : (
          recentRequests.map((req, i) => (
            <a
              key={req.id}
              className="request-card"
              style={{ animationDelay: `${Math.min(i, 4) * 0.04}s` }}
              onClick={() => onNavigate('request-detail', req.id)}
            >
              <div className="request-card-header">
                <span className="request-card-id">{req.request_number}</span>
                {getStatusBadge(req.status)}
              </div>
              <div className="request-card-body">
                <h3>{req.full_name}</h3>
                <div className="request-card-meta">
                  <span>{req.disaster_type}</span>
                  <span>📅 {new Date(req.created_at).toLocaleDateString('th-TH')}</span>
                  <span>📍 {req.district}, {req.province}</span>
                </div>
              </div>
            </a>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div style={{ textAlign: 'center', padding: '24px 16px 40px', color: 'var(--gray-400)', fontSize: '1rem' }}>
        <WarningTowerLogo size={28} />
        <p style={{ marginTop: 8 }}>ระบบคำร้องขอรับการช่วยเหลือสาธารณภัย</p>
        <p>Disaster Relief Request System v1.0</p>
      </div>
    </>
  );
}
