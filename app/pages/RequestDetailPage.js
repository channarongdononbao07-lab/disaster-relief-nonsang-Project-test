'use client';
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getDemoRequestById, updateDemoRequestStatus, deleteDemoRequest } from '../../lib/demoStore';
import { useToast } from '../../components/Toast';

export default function RequestDetailPage({ requestId, onNavigate, officerUser }) {
  const { showToast } = useToast();
  // Instant load from memory cache so opening detail has zero delay
  const [request, setRequest] = useState(() => getDemoRequestById(requestId) || null);
  const [loading, setLoading] = useState(() => !getDemoRequestById(requestId));
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const isSuperadmin = officerUser?.role === 'superadmin';

  const handleDeleteRequest = async () => {
    setActionLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.from('requests').delete().eq('id', requestId);
      }
      deleteDemoRequest(requestId);
      showToast('ลบคำร้องสำเร็จ', `เลขที่ ${request?.request_number || ''} เรียบร้อยแล้ว`, 'success');
      onNavigate('registry');
    } catch (e) {
      deleteDemoRequest(requestId);
      showToast('ลบคำร้องสำเร็จ', 'ลบคำร้องเรียบร้อยแล้ว (Local Mode)', 'success');
      onNavigate('registry');
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
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

  const updateStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'reviewing') {
        updateData.reviewed_by = reviewerName || 'เจ้าหน้าที่';
      }

      if (newStatus === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.reviewed_by = reviewerName || 'เจ้าหน้าที่';
      }

      if (newStatus === 'rejected') {
        updateData.officer_notes = (request?.officer_notes || '') + '\n[ไม่อนุมัติ] ' + rejectReason;
        updateData.reviewed_by = reviewerName || 'เจ้าหน้าที่';
      }

      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('requests')
          .update(updateData)
          .eq('id', requestId);

        if (error) throw error;
      } else {
        const updated = updateDemoRequestStatus(requestId, newStatus, reviewerName, rejectReason);
        if (updated) {
          setRequest(updated);
        }
      }

      setRequest((prev) => ({ ...prev, ...updateData }));

      const statusText = {
        reviewing: 'เริ่มตรวจสอบเอกสาร',
        approved: 'อนุมัติคำร้อง',
        rejected: 'ไม่อนุมัติคำร้อง',
      };
      showToast(statusText[newStatus] || 'อัปเดตสถานะคำร้อง', 'เรียบร้อยแล้ว', 'success');
    } catch (e) {
      const updated = updateDemoRequestStatus(requestId, newStatus, reviewerName, rejectReason);
      if (updated) {
        setRequest(updated);
      }
      showToast('อัปเดตสถานะคำร้อง', 'บันทึกเรียบร้อยแล้ว (Demo Mode)', 'success');
    }

    setActionLoading(false);
    setShowApproveModal(false);
    setShowRejectModal(false);
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { class: 'badge-pending', text: 'รอดำเนินการ' },
      reviewing: { class: 'badge-reviewing', text: 'กำลังตรวจสอบ' },
      approved: { class: 'badge-approved', text: 'อนุมัติแล้ว' },
      rejected: { class: 'badge-rejected', text: 'ไม่อนุมัติ' },
    };
    const info = map[status] || map.pending;
    return <span className={`badge ${info.class}`} style={{ fontSize: '1rem', padding: '8px 18px' }}><span className="badge-dot"></span>{info.text}</span>;
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
        <p>กรุณาเชื่อมต่อ Supabase เพื่อดูข้อมูล</p>
        <button className="btn btn-primary mt-4" onClick={() => onNavigate('registry')}>
          กลับทะเบียนคำร้อง
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="page-header-badge">
              <span className="badge-dot" style={{ background: '#FBBF24' }}></span>
              รายละเอียดคำร้อง
            </div>
            <h1 style={{ fontSize: '1.2rem' }}>{request.request_number}</h1>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </div>

      <button className="back-btn" onClick={() => onNavigate('registry')}>
        ← กลับทะเบียน
      </button>

      {/* Status Timeline */}
      <div className="card">
        <div className="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          สถานะการดำเนินการ
        </div>
        <div className="timeline">
          <div className="timeline-item">
            <div className={`timeline-dot ${request.status !== 'pending' ? 'completed' : 'active'}`}></div>
            <div className="timeline-text">ยื่นคำร้อง</div>
            <div className="timeline-date">{new Date(request.created_at).toLocaleString('th-TH')}</div>
          </div>
          <div className="timeline-item">
            <div className={`timeline-dot ${
              request.status === 'reviewing' ? 'active' :
              request.status === 'approved' || request.status === 'rejected' ? 'completed' : 'pending'
            }`}></div>
            <div className="timeline-text">ตรวจสอบเอกสาร</div>
            {request.reviewed_by && <div className="timeline-date">โดย: {request.reviewed_by}</div>}
          </div>
          <div className="timeline-item">
            <div className={`timeline-dot ${
              request.status === 'approved' ? 'completed' :
              request.status === 'rejected' ? 'completed' : 'pending'
            }`} style={request.status === 'rejected' ? { background: 'var(--danger-500)' } : {}}></div>
            <div className="timeline-text">
              {request.status === 'rejected' ? 'ไม่อนุมัติ' : 'อนุมัติคำร้อง'}
            </div>
            {request.approved_at && <div className="timeline-date">{new Date(request.approved_at).toLocaleString('th-TH')}</div>}
          </div>
        </div>
      </div>

      {/* Section 1: Incident Info */}
      <div className="card">
        <div className="detail-section">
          <div className="detail-section-title">ข้อมูลเหตุการณ์</div>
          <div className="detail-row">
            <span className="detail-label">ประเภทสาธารณภัย</span>
            <span className="detail-value">{request.disaster_type}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">วันที่เกิดเหตุ</span>
            <span className="detail-value">{new Date(request.incident_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
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

      {/* Section 2: Personal Info */}
      <div className="card">
        <div className="detail-section">
          <div className="detail-section-title">ข้อมูลผู้ประสบภัย</div>
          <div className="detail-row">
            <span className="detail-label">ชื่อ-นามสกุล</span>
            <span className="detail-value">{request.full_name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">เลขบัตรประชาชน</span>
            <span className="detail-value" style={{ fontFamily: 'monospace' }}>{request.id_card_number}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">เบอร์โทรศัพท์</span>
            <span className="detail-value">
              <a href={`tel:${request.phone}`} style={{ color: 'var(--primary-600)', textDecoration: 'none' }}>{request.phone}</a>
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
            <span className="detail-label">ที่อยู่</span>
            <span className="detail-value">{request.address}</span>
          </div>
          {request.village && (
            <div className="detail-row">
              <span className="detail-label">หมู่บ้าน</span>
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

      {/* Section 4: Assistance */}
      <div className="card">
        <div className="detail-section">
          <div className="detail-section-title">ความช่วยเหลือที่ร้องขอ</div>
          <div style={{ background: 'var(--gray-50)', padding: 20, borderRadius: 'var(--radius-sm)', fontSize: '1.1rem', lineHeight: 1.8 }}>
            {request.assistance_requested}
          </div>
          {request.officer_notes && (
            <>
              <div className="detail-section-title" style={{ marginTop: 20 }}>หมายเหตุ</div>
              <div style={{ background: 'var(--warning-50)', padding: 20, borderRadius: 'var(--radius-sm)', fontSize: '1.05rem', lineHeight: 1.8, borderLeft: '3px solid var(--warning-400)' }}>
                {request.officer_notes}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Signature */}
      {request.signature_url && (
        <div className="card">
          <div className="detail-section">
            <div className="detail-section-title">ลายมือชื่อผู้ยื่นคำร้อง</div>
            <div style={{ background: 'white', border: '2px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: 8, textAlign: 'center' }}>
              <img
                src={request.signature_url}
                alt="ลายเซ็น"
                loading="lazy"
                decoding="async"
                style={{ maxWidth: '100%', height: 'auto', maxHeight: 200 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Attachments */}
      {request.attachments && request.attachments.length > 0 && (
        <div className="card">
          <div className="detail-section">
            <div className="detail-section-title">เอกสารแนบ</div>
            {request.attachments.map((file, i) => (
              <div key={i} className="file-item" style={{ marginBottom: 8 }}>
                <span>📎 {file.name}</span>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost">
                  ดู
                </a>
              </div>
            ))}
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

      {/* Officer Action Buttons */}
      {(request.status === 'pending' || request.status === 'reviewing') && (
        <div className="action-bar-sticky">
          {!officerUser && (
            <div style={{ fontSize: '0.95rem', textAlign: 'center', color: 'var(--gray-500)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span>🔐 ปุ่มสำหรับเจ้าหน้าที่ (กดเข้าสู่ระบบเพื่อใช้งาน)</span>
              <button
                className="btn btn-sm btn-outline"
                style={{ padding: '4px 12px', fontSize: '0.9rem' }}
                onClick={() => onNavigate('login')}
                id="detail-login-callout-btn"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 640, margin: '0 auto' }}>
            {request.status === 'pending' && (
              <button
                className="btn btn-warning btn-block"
                onClick={() => {
                  if (officerUser) setReviewerName(officerUser.name);
                  setShowApproveModal(true);
                }}
                disabled={actionLoading}
                id="review-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                ตรวจสอบเอกสาร
              </button>
            )}
            {request.status === 'reviewing' && (
              <>
                <button
                  className="btn btn-success"
                  style={{ flex: 1 }}
                  onClick={() => {
                    if (officerUser) setReviewerName(officerUser.name);
                    setShowApproveModal(true);
                  }}
                  disabled={actionLoading}
                  id="approve-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
                  อนุมัติคำร้อง
                </button>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  onClick={() => {
                    if (officerUser) setReviewerName(officerUser.name);
                    setShowRejectModal(true);
                  }}
                  disabled={actionLoading}
                  id="reject-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                  ไม่อนุมัติ
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Approve/Review Modal */}
      {showApproveModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowApproveModal(false); }}>
          <div className="modal-content">
            <div className="modal-handle"></div>
            <div className="modal-title">
              {request.status === 'pending' ? '🔍 ตรวจสอบเอกสาร' : '✅ อนุมัติคำร้อง'}
            </div>
            <p style={{ fontSize: '1rem', color: 'var(--gray-500)', marginBottom: 20 }}>
              {request.status === 'pending'
                ? 'ยืนยันเริ่มตรวจสอบเอกสารคำร้องนี้'
                : 'ยืนยันอนุมัติคำร้องเลขที่ ' + request.request_number}
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="reviewer_name">ชื่อเจ้าหน้าที่ผู้ตรวจสอบ</label>
              <input
                type="text"
                className="form-input"
                id="reviewer_name"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="กรอกชื่อเจ้าหน้าที่"
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setShowApproveModal(false)}
              >
                ยกเลิก
              </button>
              <button
                className={`btn ${request.status === 'pending' ? 'btn-warning' : 'btn-success'}`}
                style={{ flex: 1 }}
                onClick={() => updateStatus(request.status === 'pending' ? 'reviewing' : 'approved')}
                disabled={actionLoading}
                id="confirm-action-btn"
              >
                {actionLoading ? <span className="spinner" style={{ borderTopColor: 'white' }}></span> : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowRejectModal(false); }}>
          <div className="modal-content">
            <div className="modal-handle"></div>
            <div className="modal-title">❌ ไม่อนุมัติคำร้อง</div>
            <p style={{ fontSize: '1rem', color: 'var(--gray-500)', marginBottom: 20 }}>
              กรุณาระบุเหตุผลที่ไม่อนุมัติคำร้องเลขที่ {request.request_number}
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="reject_reviewer">ชื่อเจ้าหน้าที่</label>
              <input
                type="text"
                className="form-input"
                id="reject_reviewer"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="กรอกชื่อเจ้าหน้าที่"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reject_reason">เหตุผล <span className="required">*</span></label>
              <textarea
                className="form-textarea"
                id="reject_reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="ระบุเหตุผลที่ไม่อนุมัติ"
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setShowRejectModal(false)}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={() => updateStatus('rejected')}
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
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !actionLoading) setShowDeleteModal(false); }}>
          <div className="modal-content">
            <div className="modal-handle"></div>
            <div className="modal-title" style={{ color: 'var(--danger-600)' }}>🗑️ ยืนยันการลบคำร้อง (Superadmin)</div>
            <p style={{ fontSize: '1.05rem', color: 'var(--gray-800)', marginBottom: 8 }}>
              คุณต้องการลบคำร้องเลขที่ <strong>{request?.request_number}</strong> ของ <strong>{request?.full_name}</strong> ออกจากระบบหรือไม่?
            </p>
            <div style={{
              background: 'var(--danger-50)',
              border: '1px solid var(--danger-200)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              color: 'var(--danger-700)',
              fontSize: '0.95rem',
              marginBottom: 24,
            }}>
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

      {/* Spacer */}
      <div style={{ height: request.status === 'pending' || request.status === 'reviewing' || isSuperadmin ? 110 : 40 }}></div>
    </>
  );
}
