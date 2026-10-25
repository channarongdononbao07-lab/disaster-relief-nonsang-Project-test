'use client';
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getDemoRequestById, updateDemoRequestData, updateDemoRequestStatus, deleteDemoRequest } from '../../lib/demoStore';
import { useToast } from '../../components/Toast';
import SignaturePad from '../../components/SignaturePad';
import OfficialPrintModal from '../../components/OfficialPrintModal';

export default function RequestDetailPage({ requestId, onNavigate, officerUser }) {
  const { showToast } = useToast();
  // Instant load from memory cache so opening detail has zero delay
  const [request, setRequest] = useState(() => getDemoRequestById(requestId) || null);
  const [loading, setLoading] = useState(() => !getDemoRequestById(requestId));
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showOfficerSignModal, setShowOfficerSignModal] = useState(false);
  const [officerSignMode, setOfficerSignMode] = useState('approve'); // 'review' | 'approve' | 'edit_signature'
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [officerPreviewRequest, setOfficerPreviewRequest] = useState(null);

  // Officer sign form state
  const [officerName, setOfficerName] = useState(officerUser?.name || 'นายสมชาย ปภ.');
  const [officerPosition, setOfficerPosition] = useState(officerUser?.position || 'เจ้าหน้าที่ผู้รับคำขอ');
  const [officerSignature, setOfficerSignature] = useState(null);
  const [officerNotes, setOfficerNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const isSuperadmin = officerUser?.role === 'superadmin';
  const isAdminOrSuperadmin =
    officerUser?.role === 'admin' ||
    officerUser?.role === 'superadmin' ||
    officerUser?.role === 'officer';

  const handleDeleteRequest = async () => {
    setActionLoading(true);
    setShowDeleteModal(false);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('requests').delete().eq('id', requestId);
        if (error) throw error;
      }
      deleteDemoRequest(requestId);
      showToast('ลบคำร้องสำเร็จ', `เลขที่ ${request?.request_number || ''} ถูกลบออกจากระบบแล้ว`, 'success');
    } catch (e) {
      deleteDemoRequest(requestId);
      showToast('เกิดข้อผิดพลาด', 'ลบจากฐานข้อมูลไม่สำเร็จ กรุณาลองใหม่', 'error');
    } finally {
      setActionLoading(false);
      onNavigate('registry');
    }
  };

  const loadRequest = async () => {
    if (!isSupabaseConfigured) {
      const demoItem = getDemoRequestById(requestId);
      if (demoItem) setRequest(demoItem);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single()
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (!error && data) {
        setRequest(data);
        setLoading(false);
        return;
      }
    } catch (e) {
      // Supabase timeout or network error - fallback to local cache
    }

    // Demo store fallback
    const demoItem = getDemoRequestById(requestId);
    if (demoItem) setRequest(demoItem);
    setLoading(false);
  };

  useEffect(() => {
    if (requestId) loadRequest();
  }, [requestId]);

  // Sync officer name & position with user session or request data
  useEffect(() => {
    if (officerUser) {
      setOfficerName(officerUser.name || 'เจ้าหน้าที่ผู้รับเรื่อง');
      setOfficerPosition(officerUser.position || 'เจ้าหน้าที่ผู้รับคำขอ');
    } else if (request?.reviewed_by) {
      setOfficerName(request.reviewed_by);
      if (request.officer_position) setOfficerPosition(request.officer_position);
    }
  }, [officerUser, request]);

  const handleOpenOfficerSign = (mode) => {
    setOfficerSignMode(mode);
    setOfficerNotes(request?.review_notes || '');
    setOfficerSignature(request?.officer_signature_url || null);
    setShowOfficerSignModal(true);
  };

  const handleSaveOfficerReview = async () => {
    setActionLoading(true);
    try {
      const now = new Date().toISOString();
      const updateData = {
        updated_at: now,
        reviewed_by: officerName || officerUser?.name || 'เจ้าหน้าที่ผู้รับเรื่อง',
        officer_position: officerPosition || 'เจ้าหน้าที่ผู้รับคำขอ',
      };

      if (officerSignature) {
        updateData.officer_signature_url = officerSignature;
      }

      if (officerNotes) {
        updateData.review_notes = officerNotes;
      }

      if (officerSignMode === 'review') {
        updateData.status = 'reviewing';
        updateData.reviewed_at = now;
      } else if (officerSignMode === 'approve') {
        updateData.status = 'approved';
        updateData.reviewed_at = now;
        updateData.approved_at = now;
      }

      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase
            .from('requests')
            .update(updateData)
            .eq('id', requestId);
          if (error) console.warn('Supabase update warning:', error);
        } catch (err) {
          console.warn('Supabase update err:', err);
        }
      }

      const updated = updateDemoRequestData(requestId, updateData);
      if (updated) {
        setRequest(updated);
      } else {
        setRequest((prev) => ({ ...prev, ...updateData }));
      }

      const msg =
        officerSignMode === 'approve'
          ? 'อนุมัติคำร้องพร้อมบันทึกลายมือชื่อเรียบร้อยแล้ว'
          : officerSignMode === 'review'
          ? 'เริ่มตรวจสอบเอกสารพร้อมเซ็นรับเรื่องแล้ว'
          : 'บันทึกลายมือชื่อเจ้าหน้าที่เรียบร้อยแล้ว';

      showToast('ดำเนินการสำเร็จ', msg, 'success');
      setShowOfficerSignModal(false);
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast('กรุณาระบุเหตุผล', 'โปรดใส่เหตุผลที่ไม่อนุมัติคำร้อง', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const now = new Date().toISOString();
      const updateData = {
        status: 'rejected',
        reviewed_by: officerName || officerUser?.name || 'เจ้าหน้าที่',
        officer_notes: (request?.officer_notes || '') + '\n[ไม่อนุมัติ] ' + rejectReason,
        updated_at: now,
      };

      if (isSupabaseConfigured) {
        try {
          await supabase.from('requests').update(updateData).eq('id', requestId);
        } catch (err) {
          console.warn('Supabase error:', err);
        }
      }

      const updated = updateDemoRequestData(requestId, updateData);
      if (updated) setRequest(updated);
      else setRequest((prev) => ({ ...prev, ...updateData }));

      showToast('ไม่อนุมัติคำร้อง', 'บันทึกเหตุผลไม่อนุมัติเรียบร้อยแล้ว', 'success');
      setShowRejectModal(false);
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาด', 'บันทึกไม่สำเร็จ', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { class: 'badge-pending', text: 'รอดำเนินการ' },
      reviewing: { class: 'badge-reviewing', text: 'กำลังตรวจสอบ' },
      approved: { class: 'badge-approved', text: 'อนุมัติแล้ว' },
      rejected: { class: 'badge-rejected', text: 'ไม่อนุมัติ' },
    };
    const info = map[status] || map.pending;
    return (
      <span className={`badge ${info.class}`} style={{ fontSize: '1rem', padding: '8px 18px' }}>
        <span className="badge-dot"></span>
        {info.text}
      </span>
    );
  };

  const getUrgencyText = (level) => {
    const map = { urgent: 'เร่งด่วน', high: 'สูง', normal: 'ปกติ', low: 'ต่ำ' };
    return map[level] || level;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }}></div>
        <p style={{ marginTop: 16, color: 'var(--gray-500)' }}>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="empty-state" style={{ marginTop: 60 }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <h3>ไม่พบข้อมูลคำร้อง</h3>
        <p>กรุณาตรวจสอบเลขที่คำร้องอีกครั้ง</p>
        <button className="btn btn-primary mt-4" onClick={() => onNavigate('registry')}>
          กลับทะเบียนคำร้อง
        </button>
      </div>
    );
  }

  const isRepresentative = request.request_type === 'representative';

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="page-header-badge">
              <span className="badge-dot" style={{ background: '#FBBF24' }}></span>
              รายละเอียดคำร้อง
            </div>
            <h1 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span>{request.request_number}</span>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: isRepresentative ? '#fef3c7' : '#e0f2fe',
                  color: isRepresentative ? '#92400e' : '#0369a1',
                  border: isRepresentative ? '1px solid #fde68a' : '1px solid #bae6fd',
                }}
              >
                {isRepresentative ? '👥 ผู้แทนยื่น' : '👤 ยื่นด้วยตนเอง'}
              </span>
            </h1>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </div>

      <button className="back-btn" onClick={() => onNavigate('registry')} id="back-to-registry-btn">
        ← กลับทะเบียน
      </button>

      {/* Official Print Paper / PDF Banner Card */}
      <div
        className="card"
        style={{
          background:
            request.status === 'approved'
              ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
              : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderColor: request.status === 'approved' ? '#86efac' : 'var(--gray-300)',
          boxShadow: request.status === 'approved' ? '0 4px 16px rgba(34, 197, 94, 0.15)' : 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: request.status === 'approved' ? '#22c55e' : 'var(--primary-500)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                flexShrink: 0,
              }}
            >
              {request.status === 'approved' ? '✅' : '📄'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: request.status === 'approved' ? '#166534' : 'var(--gray-900)' }}>
                {request.status === 'approved'
                  ? 'คำร้องได้รับการอนุมัติเรียบร้อยแล้ว'
                  : 'แบบลงทะเบียนขอรับความช่วยเหลือของประชาชน'}
              </div>
              <div style={{ fontSize: '0.86rem', color: request.status === 'approved' ? '#15803d' : 'var(--gray-600)' }}>
                เทศบาลตำบลโนนสัง • สามารถสั่งพิมพ์ออกกระดาษ (Paper A4) หรือดาวน์โหลดเป็น PDF ทางการได้
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setShowPrintModal(true)}
            id="open-print-modal-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 22px',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0 4px 14px rgba(234,88,12,0.3)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            🖨️ พิมพ์แบบคำร้อง / ดาวน์โหลด PDF
          </button>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="card">
        <div className="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          สถานะการดำเนินการ
        </div>
        <div className="timeline">
          <div className="timeline-item">
            <div className={`timeline-dot ${request.status !== 'pending' ? 'completed' : 'active'}`}></div>
            <div className="timeline-text">ยื่นคำร้อง</div>
            <div className="timeline-date">{new Date(request.created_at).toLocaleString('th-TH')}</div>
          </div>
          <div className="timeline-item">
            <div
              className={`timeline-dot ${
                request.status === 'reviewing'
                  ? 'active'
                  : request.status === 'approved' || request.status === 'rejected'
                  ? 'completed'
                  : 'pending'
              }`}
            ></div>
            <div className="timeline-text">ตรวจสอบเอกสาร</div>
            {request.reviewed_by && <div className="timeline-date">โดย: {request.reviewed_by}</div>}
          </div>
          <div className="timeline-item">
            <div
              className={`timeline-dot ${
                request.status === 'approved'
                  ? 'completed'
                  : request.status === 'rejected'
                  ? 'completed'
                  : 'pending'
              }`}
              style={request.status === 'rejected' ? { background: 'var(--danger-500)' } : {}}
            ></div>
            <div className="timeline-text">
              {request.status === 'rejected' ? 'ไม่อนุมัติ' : 'อนุมัติคำร้อง'}
            </div>
            {request.approved_at && (
              <div className="timeline-date">{new Date(request.approved_at).toLocaleString('th-TH')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Sections 1-6: ข้อมูลคำร้อง */}
      {officerUser ? (
        <>
          {/* Section 1: Incident Info */}
          <div className="card">
            <div className="detail-section">
              <div className="detail-section-title">ข้อมูลเหตุการณ์</div>
              <div className="detail-row">
                <span className="detail-label">ประเภทสาธารณภัย</span>
                <span className="detail-value">{request.disaster_type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">หมวดหมู่ตามระเบียบ</span>
                <span className="detail-value" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
                  {request.assistance_category || 'ด้านสาธารณภัย'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">วันที่เกิดเหตุ</span>
                <span className="detail-value">
                  {new Date(request.incident_date).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">ระดับความเร่งด่วน</span>
                <span className={`detail-value urgency-${request.urgency_level}`} style={{ fontWeight: 700 }}>
                  ⚡ {getUrgencyText(request.urgency_level)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">มูลค่าความเสียหาย</span>
                <span className="detail-value">฿{Number(request.estimated_damage || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Personal & Representative Info */}
          <div className="card">
            <div className="detail-section">
              <div className="detail-section-title">ข้อมูลผู้ประสบภัยและผู้ยื่น</div>

              <div className="detail-row">
                <span className="detail-label">ประเภทการยื่น</span>
                <span className="detail-value" style={{ fontWeight: 700 }}>
                  {isRepresentative ? '👥 ผู้แทนยื่น (กรณีร้องขอโดยผู้แทน)' : '👤 ยื่นด้วยตนเอง (กรณีร้องขอด้วยตนเอง)'}
                </span>
              </div>

              {isRepresentative && (
                <>
                  <div className="detail-row" style={{ background: '#fff7ed', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                    <span className="detail-label" style={{ color: '#9a3412', fontWeight: 600 }}>ผู้แทนผู้ยื่นคำร้อง</span>
                    <span className="detail-value" style={{ color: '#9a3412', fontWeight: 700 }}>
                      {request.representative_name || '-'}
                    </span>
                  </div>
                  {request.representative_relation && (
                    <div className="detail-row">
                      <span className="detail-label">ความสัมพันธ์กับผู้ประสบภัย</span>
                      <span className="detail-value">{request.representative_relation}</span>
                    </div>
                  )}
                  {request.representative_phone && (
                    <div className="detail-row">
                      <span className="detail-label">เบอร์โทรผู้แทน</span>
                      <span className="detail-value">
                        <a href={`tel:${request.representative_phone}`} style={{ color: 'var(--primary-600)', textDecoration: 'none' }}>
                          {request.representative_phone}
                        </a>
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="detail-row">
                <span className="detail-label">ชื่อผู้ประสบภัย / ผู้ยื่น</span>
                <span className="detail-value" style={{ fontWeight: 600 }}>{request.full_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">อายุ</span>
                <span className="detail-value">{request.age ? `${request.age} ปี` : '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">เลขบัตรประชาชน</span>
                <span className="detail-value" style={{ fontFamily: 'monospace' }}>{request.id_card_number}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">เบอร์โทรศัพท์</span>
                <span className="detail-value">
                  <a href={`tel:${request.phone}`} style={{ color: 'var(--primary-600)', textDecoration: 'none' }}>
                    {request.phone}
                  </a>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">สมาชิกในครัวเรือน</span>
                <span className="detail-value">{request.household_members} คน</span>
              </div>
            </div>
          </div>

          {/* Section 3: Address */}
          <div className="card">
            <div className="detail-section">
              <div className="detail-section-title">ที่อยู่</div>
              <div className="detail-row">
                <span className="detail-label">ที่อยู่บ้านเลขที่</span>
                <span className="detail-value">{request.address}</span>
              </div>
              {request.village && (
                <div className="detail-row">
                  <span className="detail-label">หมู่ / หมู่บ้าน</span>
                  <span className="detail-value">{request.village}</span>
                </div>
              )}
              {request.subdistrict && (
                <div className="detail-row">
                  <span className="detail-label">ตำบล/แขวง</span>
                  <span className="detail-value">{request.subdistrict}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">อำเภอ/เขต</span>
                <span className="detail-value">{request.district}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">จังหวัด</span>
                <span className="detail-value">{request.province}</span>
              </div>
            </div>
          </div>

          {/* Section 3.5: GPS Map */}
          {request.gps_lat && request.gps_lng ? (
            <div className="card" style={{ borderColor: '#3b82f6', background: 'linear-gradient(135deg, #eff6ff, #ffffff)' }}>
              <div className="detail-section">
                <div className="detail-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1d4ed8' }}>
                  <span>📍</span> พิกัด GPS ตำแหน่งบ้าน
                  <span
                    style={{
                      background: '#22c55e',
                      color: 'white',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      letterSpacing: '0.5px',
                    }}
                  >
                    ✅ ปักหมุดแล้ว
                  </span>
                </div>
                {/* Coordinates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div style={{ background: '#1e3a5f', borderRadius: 'var(--radius-sm)', padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ color: '#93c5fd', fontSize: '0.75rem', marginBottom: 4 }}>🔵 Latitude (ละติจูด)</div>
                    <div style={{ color: 'white', fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}>
                      {Number(request.gps_lat).toFixed(6)}
                    </div>
                  </div>
                  <div style={{ background: '#1e3a5f', borderRadius: 'var(--radius-sm)', padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ color: '#86efac', fontSize: '0.75rem', marginBottom: 4 }}>🟢 Longitude (ลองจิจูด)</div>
                    <div style={{ color: 'white', fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}>
                      {Number(request.gps_lng).toFixed(6)}
                    </div>
                  </div>
                </div>
                {/* Navigation Buttons */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${request.gps_lat},${request.gps_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    id="navigate-google-maps-btn"
                    style={{
                      flex: 1,
                      minWidth: 140,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: 'linear-gradient(135deg, #ea4335, #c0392b)',
                      color: 'white',
                      textDecoration: 'none',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      boxShadow: '0 4px 12px rgba(234,67,53,0.35)',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                    นำทาง Google Maps
                  </a>
                  <a
                    href={`https://maps.apple.com/?daddr=${request.gps_lat},${request.gps_lng}&dirflg=d`}
                    target="_blank"
                    rel="noopener noreferrer"
                    id="navigate-apple-maps-btn"
                    style={{
                      flex: 1,
                      minWidth: 140,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                      color: 'white',
                      textDecoration: 'none',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      boxShadow: '0 4px 12px rgba(29,78,216,0.35)',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
                    </svg>
                    นำทาง Apple Maps
                  </a>
                </div>
                {/* Map iframe */}
                <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid #3b82f6' }}>
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(request.gps_lng) - 0.004},${
                      Number(request.gps_lat) - 0.004
                    },${Number(request.gps_lng) + 0.004},${Number(request.gps_lat) + 0.004}&layer=mapnik&marker=${
                      request.gps_lat
                    },${request.gps_lng}`}
                    width="100%"
                    height="300"
                    style={{ display: 'block', border: 'none' }}
                    title="แผนที่ตำแหน่งบ้านผู้ประสบภัย"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Section 4: Assistance */}
          <div className="card">
            <div className="detail-section">
              <div className="detail-section-title">ความช่วยเหลือที่ร้องขอ</div>
              <div style={{ background: 'var(--gray-50)', padding: 20, borderRadius: 'var(--radius-sm)', fontSize: '1.1rem', lineHeight: 1.8 }}>
                {request.assistance_requested}
              </div>
              {request.officer_notes && (
                <>
                  <div className="detail-section-title" style={{ marginTop: 20 }}>หมายเหตุคำร้อง</div>
                  <div style={{ background: 'var(--warning-50)', padding: 18, borderRadius: 'var(--radius-sm)', fontSize: '1.05rem', lineHeight: 1.8, borderLeft: '3px solid var(--warning-400)' }}>
                    {request.officer_notes}
                  </div>
                </>
              )}
              {request.review_notes && (
                <>
                  <div className="detail-section-title" style={{ marginTop: 20, color: 'var(--primary-700)' }}>
                    📝 บันทึกความเห็นเจ้าหน้าที่ผู้ตรวจสอบ
                  </div>
                  <div style={{ background: '#f0f9ff', padding: 18, borderRadius: 'var(--radius-sm)', fontSize: '1.05rem', lineHeight: 1.8, borderLeft: '3px solid #0284c7' }}>
                    {request.review_notes}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 5: Signatures (Citizen & Officer) */}
          <div className="card">
            <div className="detail-section">
              <div className="detail-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>✍️ ลายมือชื่อในระบบ (Digital Signatures)</span>
                {isAdminOrSuperadmin && (
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleOpenOfficerSign('edit_signature')}
                    id="edit-officer-signature-btn"
                    style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                  >
                    {request.officer_signature_url ? '✏️ ปรับปรุงลายเซ็นเจ้าหน้าที่' : '✍️ เซ็นชื่อเจ้าหน้าที่ในแอป'}
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 12 }}>
                {/* 1. Citizen Signature Card */}
                <div style={{ border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: 16, background: 'var(--gray-50)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span>{isRepresentative ? '👥' : '👤'}</span>
                    <span>ลายมือชื่อผู้ยื่นคำขอ {isRepresentative ? '(ผู้แทน)' : ''}</span>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px dashed var(--gray-300)', borderRadius: 'var(--radius-sm)', padding: 12, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {request.signature_url ? (
                      <img
                        src={request.signature_url}
                        alt="ลายเซ็นผู้ยื่นคำขอ"
                        style={{ maxHeight: 90, maxWidth: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>ไม่มีลายมือชื่อ</span>
                    )}
                  </div>

                  <div style={{ marginTop: 10, fontWeight: 700, color: 'var(--gray-800)', fontSize: '0.98rem' }}>
                    ({isRepresentative && request.representative_name ? request.representative_name : request.full_name})
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: 2 }}>
                    ผู้ยื่นคำขอ
                  </div>
                </div>

                {/* 2. Officer Signature Card */}
                <div
                  style={{
                    border: request.officer_signature_url ? '1.5px solid #86efac' : '1.5px dashed var(--warning-300)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    background: request.officer_signature_url ? '#f0fdf4' : '#fffbeb',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: request.officer_signature_url ? '#166534' : '#92400e', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span>🛡️</span>
                    <span>ลายมือชื่อเจ้าหน้าที่ผู้รับคำขอ</span>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px dashed var(--gray-300)', borderRadius: 'var(--radius-sm)', padding: 12, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {request.officer_signature_url ? (
                      <img
                        src={request.officer_signature_url}
                        alt="ลายเซ็นเจ้าหน้าที่"
                        style={{ maxHeight: 90, maxWidth: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#d97706', fontSize: '0.88rem', fontWeight: 600, marginBottom: 8 }}>
                          ⚠️ ยังไม่ได้ลงลายมือชื่อ
                        </div>
                        {isAdminOrSuperadmin && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleOpenOfficerSign('approve')}
                            id="officer-sign-prompt-btn"
                            style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                          >
                            ✍️ เซ็นชื่อในแอปตอนนี้
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 10, fontWeight: 700, color: 'var(--gray-800)', fontSize: '0.98rem' }}>
                    ({request.reviewed_by || '.....................................................'})
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: 2 }}>
                    {request.officer_position || 'เจ้าหน้าที่ผู้รับคำขอ'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <div className="card">
              <div className="detail-section">
                <div className="detail-section-title">
                  เอกสารแนบหลักฐาน
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--gray-500)', marginLeft: 8 }}>
                    ({request.attachments.length} ไฟล์)
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {request.attachments.map((file, i) => {
                    const hasUrl = file.url && file.url !== '#';
                    const isImage = hasUrl && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.name);
                    const fileSizeMB = file.size ? (file.size / 1024 / 1024).toFixed(1) : null;

                    return (
                      <div
                        key={i}
                        style={{
                          border: '1.5px solid var(--gray-200)',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          background: 'var(--gray-50)',
                        }}
                      >
                        {isImage && (
                          <div style={{ background: '#fff', padding: 8, textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
                            <img
                              src={file.url}
                              alt={file.name}
                              style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 4 }}
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>
                              {isImage ? '🖼️' : file.name?.endsWith('.pdf') ? '📄' : '📎'}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--gray-800)', wordBreak: 'break-word' }}>
                                {file.name}
                              </div>
                              {fileSizeMB && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                                  {fileSizeMB} MB
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            {hasUrl ? (
                              <>
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-ghost"
                                  style={{ padding: '6px 12px', fontSize: '0.9rem', textDecoration: 'none' }}
                                >
                                  ดู
                                </a>
                                <a
                                  href={file.url}
                                  download={file.name}
                                  className="btn btn-sm btn-outline"
                                  style={{ padding: '6px 12px', fontSize: '0.9rem', textDecoration: 'none' }}
                                >
                                  บันทึก
                                </a>
                              </>
                            ) : (
                              <span style={{ fontSize: '0.85rem', color: 'var(--gray-400)', fontStyle: 'italic', padding: '6px 0' }}>
                                ไม่มีลิงก์ไฟล์
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* บุคคลทั่วไปที่ไม่ได้ login */
        <div className="card" style={{ textAlign: 'center', padding: '32px 24px', borderStyle: 'dashed', borderColor: 'var(--gray-300)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--gray-700)', marginBottom: 8 }}>
            ข้อมูลรายละเอียดผู้ประสบภัยเป็นความลับ
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--gray-500)', marginBottom: 20 }}>
            เฉพาะเจ้าหน้าที่ที่ได้รับอนุญาตเท่านั้นที่สามารถดูข้อมูลส่วนตัว เอกสาร และดำเนินการอนุมัติได้
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('login')} id="guest-login-prompt-btn">
              🔐 เข้าสู่ระบบเจ้าหน้าที่
            </button>
            <button className="btn btn-outline" onClick={() => setShowPrintModal(true)} id="guest-view-doc-btn">
              📄 ดูแบบพิมพ์คำร้องทางการ
            </button>
          </div>
        </div>
      )}

      {/* Superadmin Delete Action Card */}
      {isSuperadmin && (
        <div className="card" style={{ borderColor: 'var(--danger-300)', background: 'var(--danger-50)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--danger-700)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>👑 สิทธิ์ Superadmin</span>
                <span className="badge badge-rejected" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>ผู้ดูแลระบบ</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--danger-600)', marginTop: 4 }}>
                คุณสามารถลบคำร้องนี้ออกจากระบบได้ทันที
              </div>
            </div>
            <button
              className="btn btn-danger"
              onClick={() => setShowDeleteModal(true)}
              disabled={actionLoading}
              id="superadmin-delete-detail-btn"
              style={{ fontSize: '0.95rem', padding: '8px 16px' }}
            >
              🗑️ ลบคำร้องนี้
            </button>
          </div>
        </div>
      )}

      {/* Officer Sticky Action Bar */}
      <div className="action-bar-sticky">
        {!officerUser ? (
          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 640, margin: '0 auto' }}>
            <button
              className="btn btn-primary btn-block"
              onClick={() => setShowPrintModal(true)}
              id="guest-bottom-print-btn"
            >
              🖨️ พิมพ์แบบคำร้อง / ดาวน์โหลด PDF
            </button>
          </div>
        ) : isAdminOrSuperadmin ? (
          <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 640, margin: '0 auto', flexWrap: 'wrap' }}>
            {request.status === 'pending' && (
              <button
                className="btn btn-warning btn-block"
                onClick={() => handleOpenOfficerSign('review')}
                disabled={actionLoading}
                id="review-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                🔍 ตรวจสอบเอกสาร & เซ็นรับเรื่อง
              </button>
            )}

            {request.status === 'reviewing' && (
              <>
                <button
                  className="btn btn-success"
                  style={{ flex: 1, minWidth: 160 }}
                  onClick={() => handleOpenOfficerSign('approve')}
                  disabled={actionLoading}
                  id="approve-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <path d="M22 4L12 14.01l-3-3" />
                  </svg>
                  ✅ อนุมัติ & เซ็นชื่อ
                </button>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1, minWidth: 120 }}
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  id="reject-btn"
                >
                  ❌ ไม่อนุมัติ
                </button>
              </>
            )}

            {request.status === 'approved' && (
              <>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, minWidth: 180 }}
                  onClick={() => setShowPrintModal(true)}
                  id="approved-print-btn"
                >
                  🖨️ พิมพ์แบบคำร้อง (Paper / PDF)
                </button>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, minWidth: 140 }}
                  onClick={() => handleOpenOfficerSign('edit_signature')}
                  id="update-sig-btn"
                >
                  ✍️ ปรับปรุงลายเซ็น
                </button>
              </>
            )}

            {request.status === 'rejected' && (
              <button
                className="btn btn-primary btn-block"
                onClick={() => setShowPrintModal(true)}
              >
                🖨️ พิมพ์แบบคำร้อง
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Officer Signature & Review Modal */}
      {showOfficerSignModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !actionLoading) setShowOfficerSignModal(false);
          }}
        >
          <div className="modal-content" style={{ maxWidth: 540 }}>
            <div className="modal-handle"></div>
            <div className="modal-title">
              {officerSignMode === 'approve'
                ? '✅ อนุมัติคำร้อง & ลงลายมือชื่อเจ้าหน้าที่'
                : officerSignMode === 'review'
                ? '🔍 รับเรื่องตรวจสอบ & ลงลายมือชื่อ'
                : '✍️ เซ็นชื่อเจ้าหน้าที่ผู้รับคำขอ'}
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--gray-500)', marginBottom: 16 }}>
              เลขที่คำร้อง <strong>{request.request_number}</strong> • เซ็นออนไลน์ด้วยนิ้วมือ เมาส์ หรือสไตลัส
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="officer_name_input">
                  ชื่อเจ้าหน้าที่ผู้รับคำขอ <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  id="officer_name_input"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="เช่น นายสมชาย ปภ."
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="officer_pos_input">
                  ตำแหน่ง
                </label>
                <input
                  type="text"
                  className="form-input"
                  id="officer_pos_input"
                  value={officerPosition}
                  onChange={(e) => setOfficerPosition(e.target.value)}
                  placeholder="เจ้าหน้าที่ผู้รับคำขอ"
                />
              </div>
            </div>

            {/* Officer Digital Signature Pad */}
            <div style={{ marginBottom: 14 }}>
              <SignaturePad
                onSignatureChange={setOfficerSignature}
                initialSignature={request.officer_signature_url}
                label="✍️ ลายมือชื่อเจ้าหน้าที่ผู้รับคำขอ (เซ็นรับเรื่องในแอป)"
                placeholder="✍️ ใช้นิ้วมือหรือเมาส์ ลากเซ็นชื่อเจ้าหน้าที่ตรงนี้"
                height={170}
                idPrefix="officer-signature"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="officer_notes_input">
                บันทึกความเห็น / หมายเหตุการตรวจสอบ
              </label>
              <textarea
                className="form-textarea"
                id="officer_notes_input"
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                placeholder="เช่น ตรวจสอบเอกสารครบถ้วน อนุมัติจัดสรรความช่วยเหลือตามระเบียบ"
                rows={2}
              />
            </div>

            {/* Officer Live Preview Button before confirm */}
            <button
              type="button"
              className="btn btn-outline"
              style={{
                width: '100%',
                marginTop: 14,
                marginBottom: 6,
                borderColor: 'var(--primary-400)',
                color: 'var(--primary-700)',
                background: '#fff7ed',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 14px',
              }}
              onClick={() => {
                setOfficerPreviewRequest({
                  ...request,
                  officer_signature_url: officerSignature || request.officer_signature_url,
                  officer_name: officerName || request.officer_name || request.reviewed_by,
                  officer_position: officerPosition || request.officer_position,
                  reviewed_by: officerName || request.reviewed_by,
                });
              }}
              id="preview-officer-modal-btn"
            >
              👁️ ดูตัวอย่างแบบฟอร์ม PDF พร้อมลายเซ็น / สั่งพิมพ์
            </button>

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setShowOfficerSignModal(false)}
                disabled={actionLoading}
              >
                ยกเลิก
              </button>
              <button
                className={`btn ${officerSignMode === 'approve' ? 'btn-success' : 'btn-primary'}`}
                style={{ flex: 1.5, fontWeight: 700 }}
                onClick={handleSaveOfficerReview}
                disabled={actionLoading}
                id="confirm-officer-sign-btn"
              >
                {actionLoading ? (
                  <span className="spinner" style={{ borderTopColor: 'white' }}></span>
                ) : officerSignMode === 'approve' ? (
                  '✅ ยืนยันอนุมัติ & บันทึก'
                ) : officerSignMode === 'review' ? (
                  '🔍 รับเรื่อง & บันทึก'
                ) : (
                  '💾 บันทึกลายเซ็น'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !actionLoading) setShowRejectModal(false);
          }}
        >
          <div className="modal-content">
            <div className="modal-handle"></div>
            <div className="modal-title" style={{ color: 'var(--danger-600)' }}>❌ ไม่อนุมัติคำร้อง</div>
            <p style={{ fontSize: '0.95rem', color: 'var(--gray-500)', marginBottom: 20 }}>
              กรุณาระบุเหตุผลที่ไม่อนุมัติคำร้องเลขที่ {request.request_number}
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="reject_reviewer">ชื่อเจ้าหน้าที่</label>
              <input
                type="text"
                className="form-input"
                id="reject_reviewer"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                placeholder="กรอกชื่อเจ้าหน้าที่"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reject_reason">
                เหตุผล <span className="required">*</span>
              </label>
              <textarea
                className="form-textarea"
                id="reject_reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="ระบุเหตุผลที่ไม่อนุมัติ เช่น ข้อมูลไม่ถูกต้อง หรือไม่อยู่ในเกณฑ์ช่วยเหลือ"
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                id="confirm-reject-btn"
              >
                {actionLoading ? <span className="spinner" style={{ borderTopColor: 'white' }}></span> : 'ยืนยันไม่อนุมัติ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Superadmin Delete Modal */}
      {showDeleteModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !actionLoading) setShowDeleteModal(false);
          }}
        >
          <div className="modal-content">
            <div className="modal-handle"></div>
            <div className="modal-title" style={{ color: 'var(--danger-600)' }}>🗑️ ยืนยันการลบคำร้อง (Superadmin)</div>
            <p style={{ fontSize: '1.05rem', color: 'var(--gray-800)', marginBottom: 8 }}>
              คุณต้องการลบคำร้องเลขที่ <strong>{request?.request_number}</strong> ของ{' '}
              <strong>{request?.full_name}</strong> ออกจากระบบหรือไม่?
            </p>
            <div
              style={{
                background: 'var(--danger-50)',
                border: '1px solid var(--danger-200)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                color: 'var(--danger-700)',
                fontSize: '0.95rem',
                marginBottom: 24,
              }}
            >
              ⚠️ การลบข้อมูลนี้จะไม่สามารถกู้คืนได้ และจะถูกลบออกจากฐานข้อมูลถาวร
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={handleDeleteRequest}
                disabled={actionLoading}
                id="confirm-delete-detail-btn"
              >
                {actionLoading ? 'กำลังลบ...' : 'ยืนยันลบคำร้อง'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Print Paper / PDF Modal */}
      {showPrintModal && (
        <OfficialPrintModal request={request} onClose={() => setShowPrintModal(false)} />
      )}

      {/* Officer Live Preview Print Modal */}
      {officerPreviewRequest && (
        <OfficialPrintModal
          request={officerPreviewRequest}
          onClose={() => setOfficerPreviewRequest(null)}
        />
      )}

      {/* Spacer for sticky action bar */}
      <div style={{ height: 110 }}></div>
    </>
  );
}
