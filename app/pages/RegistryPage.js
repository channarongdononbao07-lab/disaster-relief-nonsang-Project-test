'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getDemoRequests, subscribeDemoRequests, deleteDemoRequest, INITIAL_DEMO_REQUESTS } from '../../lib/demoStore';
import { useToast } from '../../components/Toast';

const PAGE_SIZE = 20;

export default function RegistryPage({ onNavigate, officerUser }) {
  const { showToast } = useToast();
  // Safe initial state matching SSR perfectly
  const [requests, setRequests] = useState(() => INITIAL_DEMO_REQUESTS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSuperadmin = officerUser?.role === 'superadmin';

  const handleDeleteRequest = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (isSupabaseConfigured) {
        // รอให้ Supabase ลบเสร็จก่อน — ไม่ fallback หากเกิด error
        const { error } = await supabase.from('requests').delete().eq('id', deleteTarget.id);
        if (error) throw error;
      }
      // ลบจาก local cache หลัง Supabase สำเร็จ
      deleteDemoRequest(deleteTarget.id);
      showToast('ลบคำร้องสำเร็จ', `เลขที่ ${deleteTarget.request_number} ถูกลบออกจากระบบแล้ว`, 'success');
      setDeleteTarget(null);
    } catch (e) {
      showToast('ลบไม่สำเร็จ', 'เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่', 'error');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Background fetch to keep data fresh without blocking UI
  const loadRequests = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setRequests(getDemoRequests());
      return;
    }

    setIsRefreshing(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      // Query only required columns - skipping heavy signature_url and attachments blobs
      const { data, error } = await supabase
        .from('requests')
        .select('id, request_number, full_name, disaster_type, incident_date, urgency_level, status, district, province, created_at, estimated_damage')
        .order('created_at', { ascending: false })
        .limit(200)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (!error && data && data.length > 0) {
        setRequests(data);
      } else {
        setRequests(getDemoRequests());
      }
    } catch (e) {
      // Fallback silently to fast local store
      setRequests(getDemoRequests());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    // Live update subscription
    const unsubscribe = subscribeDemoRequests((updatedData) => {
      setRequests(updatedData);
    });
    return () => unsubscribe();
  }, [loadRequests]);

  // Memoized fast filtering
  const filteredRequests = useMemo(() => {
    let result = requests;
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      result = result.filter((r) => r.disaster_type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.request_number?.toLowerCase().includes(q) ||
          r.full_name?.toLowerCase().includes(q) ||
          r.district?.toLowerCase().includes(q) ||
          r.province?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [requests, statusFilter, typeFilter, searchQuery]);

  // Reset display limit when filter or search changes
  useEffect(() => {
    setDisplayLimit(PAGE_SIZE);
  }, [statusFilter, typeFilter, searchQuery]);

  const visibleRequests = useMemo(() => {
    return filteredRequests.slice(0, displayLimit);
  }, [filteredRequests, displayLimit]);

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

  const getUrgencyText = (level) => {
    const map = { urgent: 'เร่งด่วน', high: 'สูง', normal: 'ปกติ', low: 'ต่ำ' };
    return map[level] || level;
  };

  // Fast CSV export with UTF-8 BOM
  const exportCSV = () => {
    if (filteredRequests.length === 0) {
      showToast('ไม่สามารถส่งออกข้อมูล', 'ไม่มีข้อมูลคำร้องสำหรับ Export', 'error');
      return;
    }

    const headers = ['เลขที่คำร้อง', 'ชื่อผู้ยื่น', 'ประเภทภัย', 'วันที่เกิดเหตุ', 'ระดับความเร่งด่วน', 'สถานะ', 'อำเภอ/เขต', 'จังหวัด', 'วันที่สร้าง'];
    const rows = filteredRequests.map((r) => [
      r.request_number || '',
      r.full_name || '',
      r.disaster_type || '',
      r.incident_date || '',
      getUrgencyText(r.urgency_level),
      r.status || '',
      r.district || '',
      r.province || '',
      new Date(r.created_at).toLocaleDateString('th-TH'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(v => `"${v || ''}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ดาวน์โหลด CSV', 'ส่งออกข้อมูลเรียบร้อยแล้ว', 'success');
  };

  // Excel HTML Spreadsheet Export
  const exportExcel = () => {
    if (filteredRequests.length === 0) {
      showToast('ไม่สามารถส่งออกข้อมูล', 'ไม่มีข้อมูลคำร้องสำหรับ Export', 'error');
      return;
    }

    const headers = ['เลขที่คำร้อง', 'ชื่อผู้ยื่น', 'ประเภทภัย', 'วันที่เกิดเหตุ', 'ระดับความเร่งด่วน', 'สถานะ', 'อำเภอ/เขต', 'จังหวัด', 'วันที่สร้าง'];
    const rowsHtml = filteredRequests.map((r) => `
      <tr>
        <td>${r.request_number || ''}</td>
        <td>${r.full_name || ''}</td>
        <td>${r.disaster_type || ''}</td>
        <td>${r.incident_date || ''}</td>
        <td>${getUrgencyText(r.urgency_level)}</td>
        <td>${r.status || ''}</td>
        <td>${r.district || ''}</td>
        <td>${r.province || ''}</td>
        <td>${new Date(r.created_at).toLocaleDateString('th-TH')}</td>
      </tr>
    `).join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
          <style>
            th { background-color: #f97316; color: white; font-weight: bold; border: 1px solid #ddd; padding: 8px; }
            td { border: 1px solid #ddd; padding: 6px; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requests_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ดาวน์โหลด Excel', 'ส่งออกข้อมูลเรียบร้อยแล้ว', 'success');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-badge">
          <span className="badge-dot" style={{ background: '#FBBF24' }}></span>
          ทะเบียนกลาง
        </div>
        <h1>ทะเบียนคำร้อง</h1>
        <p>ค้นหา ตรวจสอบ และติดตามรายการคำร้องช่วยเหลือทั้งหมด</p>
      </div>

      {/* Add New Button */}
      <div style={{ padding: '0 16px', marginTop: -16, position: 'relative', zIndex: 10 }}>
        <button
          className="btn btn-primary btn-block btn-lg"
          onClick={() => onNavigate('new-request')}
          id="add-request-btn"
          style={{ boxShadow: '0 8px 25px rgba(234, 88, 12, 0.35)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6M12 18v-6M9 15h6" />
          </svg>
          เพิ่มคำร้อง
        </button>
      </div>

      {/* Search & Filter Card */}
      <div className="card">
        <div className="search-container">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            className="search-input"
            placeholder="ค้นหาเลขคำร้อง ชื่อผู้ยื่น หรือพื้นที่..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="search-input"
          />
        </div>

        <div className="filter-row">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            id="filter-status"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="reviewing">กำลังตรวจสอบ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ไม่อนุมัติ</option>
          </select>

          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            id="filter-type"
          >
            <option value="all">ทุกประเภทภัย</option>
            <option value="🌊 อุทกภัย">🌊 อุทกภัย</option>
            <option value="🌪️ วาตภัย">🌪️ วาตภัย</option>
            <option value="🔥 อัคคีภัย">🔥 อัคคีภัย</option>
            <option value="☀️ ภัยแล้ง">☀️ ภัยแล้ง</option>
            <option value="🪨 ดินโคลนถล่ม">🪨 ดินโคลนถล่ม</option>
            <option value="🏚️ แผ่นดินไหว">🏚️ แผ่นดินไหว</option>
            <option value="⛈️ ภัยจากพายุ">⛈️ ภัยจากพายุ</option>
            <option value="❄️ ภัยหนาว">❄️ ภัยหนาว</option>
            <option value="⚠️ อื่นๆ">⚠️ อื่นๆ</option>
          </select>
        </div>

        <button
          className="btn btn-ghost btn-block mt-4"
          onClick={clearFilters}
          id="clear-filters-btn"
          style={{ fontSize: '1rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          ล้างตัวกรอง
        </button>
      </div>

      {/* Results */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)' }}>รายการคำร้อง</h3>
            <p style={{ fontSize: '1rem', color: 'var(--gray-500)' }}>
              พบ {filteredRequests.length} รายการ {isRefreshing && <span style={{ fontSize: '0.8rem', color: 'var(--primary-600)' }}>• กำลังซิงค์...</span>}
            </p>
          </div>
          <div className="export-actions">
            {officerUser && (
              <>
                <button className="export-btn" onClick={exportCSV} id="export-csv-btn" title="ส่งออกไฟล์ CSV">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  CSV
                </button>
                <button className="export-btn" onClick={exportExcel} id="export-excel-btn" title="ส่งออกไฟล์ Excel">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 13h2M8 17h2M14 13h2M14 17h2"/></svg>
                  Excel
                </button>
              </>
            )}
            <button className="export-btn" onClick={loadRequests} id="refresh-btn" title="รีเฟรชข้อมูล">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              {isRefreshing ? 'ซิงค์...' : 'รีเฟรช'}
            </button>
          </div>
        </div>

        {visibleRequests.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M12 18v-4M12 10h.01" />
            </svg>
            <h3>ไม่พบคำร้อง</h3>
            <p>ลองเปลี่ยนเงื่อนไขการค้นหา หรือเพิ่มคำร้องใหม่</p>
          </div>
        ) : (
          <>
            {visibleRequests.map((req, i) => (
              <a
                key={req.id}
                className="request-card"
                style={{ animationDelay: `${Math.min(i, 8) * 0.03}s` }}
                onClick={() => onNavigate('request-detail', req.id)}
                id={`request-card-${req.id}`}
              >
                <div className="request-card-header">
                  <span className="request-card-id">{req.request_number}</span>
                  {getStatusBadge(req.status)}
                </div>
                <div className="request-card-body">
                  <h3>{req.full_name}</h3>
                  <div className="request-card-meta">
                    <span>{req.disaster_type}</span>
                    <span>📅 {new Date(req.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="request-card-meta" style={{ marginTop: 4 }}>
                    <span>📍 {req.district}, {req.province}</span>
                    <span className={`urgency-${req.urgency_level}`}>⚡ {getUrgencyText(req.urgency_level)}</span>
                  </div>
                </div>
                <div className="request-card-footer">
                  <span style={{ fontSize: '1rem', color: 'var(--gray-400)' }}>
                    {req.estimated_damage ? `฿${Number(req.estimated_damage).toLocaleString()}` : '-'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isSuperadmin && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(req);
                        }}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.85rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: 'var(--danger-600)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                        }}
                        title="ลบคำร้อง (Superadmin)"
                        id={`delete-req-btn-${req.id}`}
                      >
                        🗑️ ลบคำร้อง
                      </button>
                    )}
                    <span style={{ fontSize: '1rem', color: 'var(--primary-600)', fontWeight: 600 }}>
                      ดูรายละเอียด →
                    </span>
                  </div>
                </div>
              </a>
            ))}

            {filteredRequests.length > displayLimit && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button
                  className="btn btn-outline btn-block"
                  onClick={() => setDisplayLimit((prev) => prev + PAGE_SIZE)}
                  id="load-more-btn"
                  style={{ padding: '12px 20px', fontSize: '1rem' }}
                >
                  📥 โหลดเพิ่มเติม (แสดงอีก {Math.min(PAGE_SIZE, filteredRequests.length - displayLimit)} จาก {filteredRequests.length} รายการ)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Superadmin Delete Request Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) setDeleteTarget(null); }}>
          <div className="modal-content">
            <div className="modal-handle"></div>
            <div className="modal-title" style={{ color: 'var(--danger-600)' }}>
              🗑️ ยืนยันการลบคำร้อง (Superadmin)
            </div>
            <p style={{ fontSize: '1.05rem', color: 'var(--gray-800)', marginBottom: 12 }}>
              คุณต้องการลบคำร้องเลขที่ <strong>{deleteTarget.request_number}</strong> ของ <strong>{deleteTarget.full_name}</strong> ออกจากระบบหรือไม่?
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
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={handleDeleteRequest}
                disabled={isDeleting}
                id="confirm-delete-req-btn"
              >
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบคำร้อง'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 40 }}></div>
    </>
  );
}
