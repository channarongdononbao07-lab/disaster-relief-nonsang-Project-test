'use client';
import { useState, useEffect } from 'react';
import WarningTowerLogo from '../../components/WarningTowerLogo';
import { useToast } from '../../components/Toast';
import { getAllUsers, addUser, deleteUser, toggleUserActive } from '../../lib/userStore';

export default function AdminPage({ officerUser, onNavigate }) {
  const { showToast } = useToast();
  const [users, setUsers] = useState(() => getAllUsers());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'officer',
    position: 'เจ้าหน้าที่ปฏิบัติการ ปภ.',
    department: 'ศูนย์ป้องกันและบรรเทาสาธารณภัย',
  });
  const [addError, setAddError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  function loadUsers() {
    setUsers(getAllUsers());
  };

  const handleAddUser = () => {
    setAddError('');
    if (!newUser.username.trim()) { setAddError('กรุณากรอกชื่อผู้ใช้งาน'); return; }
    if (!newUser.password.trim()) { setAddError('กรุณากรอกรหัสผ่าน'); return; }
    if (newUser.password.length < 4) { setAddError('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร'); return; }
    if (!newUser.name.trim()) { setAddError('กรุณากรอกชื่อ-นามสกุล'); return; }

    const result = addUser(newUser);
    if (result.success) {
      showToast('เพิ่มผู้ใช้งานสำเร็จ', `เพิ่มเจ้าหน้าที่ "${newUser.name}" เรียบร้อยแล้ว`, 'success');
      setShowAddModal(false);
      setNewUser({
        username: '', password: '', name: '',
        role: 'officer', position: 'เจ้าหน้าที่ปฏิบัติการ ปภ.',
        department: 'ศูนย์ป้องกันและบรรเทาสาธารณภัย',
      });
      loadUsers();
    } else {
      setAddError(result.error);
    }
  };

  const handleDeleteUser = (userId) => {
    const result = deleteUser(userId);
    if (result.success) {
      showToast('ลบผู้ใช้งานสำเร็จ', 'ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว', 'success');
      loadUsers();
    } else {
      showToast('ไม่สามารถดำเนินการได้', result.error, 'error');
    }
    setShowDeleteModal(null);
  };

  const handleToggleActive = (userId) => {
    const result = toggleUserActive(userId);
    if (result.success) {
      showToast('อัปเดตสถานะบัญชี', result.active ? 'เปิดใช้งานบัญชีแล้ว' : 'ระงับบัญชีชั่วคราวแล้ว', 'success');
      loadUsers();
    } else {
      showToast('เกิดข้อผิดพลาด', result.error, 'error');
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'superadmin') return <span className="badge badge-rejected" style={{ fontSize: '0.9rem', padding: '4px 10px' }}>👑 Superadmin</span>;
    return <span className="badge badge-reviewing" style={{ fontSize: '0.9rem', padding: '4px 10px' }}>🛡️ เจ้าหน้าที่</span>;
  };

  // Guard: only superadmin can access
  if (!officerUser || officerUser.role !== 'superadmin') {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <h3>ไม่มีสิทธิ์เข้าถึง</h3>
        <p>เฉพาะ Superadmin เท่านั้นที่สามารถจัดการบัญชีเจ้าหน้าที่ได้</p>
        <button className="btn btn-primary mt-4" onClick={() => onNavigate('home')}>
          กลับหน้าแรก
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-header" style={{ textAlign: 'center', padding: '24px 20px 32px' }}>
        <div className="page-header-badge" style={{ margin: '0 auto 12px' }}>
          <span className="badge-dot" style={{ background: '#ef4444' }}></span>
          Superadmin Panel
        </div>
        <h1 style={{ fontSize: '1.4rem' }}>👑 จัดการบัญชีเจ้าหน้าที่</h1>
        <p style={{ marginTop: 4, fontSize: '1rem' }}>เพิ่ม / ลบ / เปิด-ปิดบัญชีผู้ใช้งานในระบบ</p>
      </div>

      <button className="back-btn" onClick={() => onNavigate('home')}>
        ← กลับหน้าแรก
      </button>

      {/* Stats */}
      <div className="stats-grid" style={{ marginTop: 16 }}>
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">ผู้ใช้ทั้งหมด</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
          </div>
          <div className="stat-value">{users.filter(u => u.active).length}</div>
          <div className="stat-label">ใช้งานอยู่</div>
        </div>
      </div>

      {/* Add User Button */}
      <div style={{ padding: '0 16px' }}>
        <button
          className="btn btn-primary btn-block btn-lg"
          onClick={() => setShowAddModal(true)}
          id="add-user-btn"
          style={{ marginBottom: 8 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>
          เพิ่มเจ้าหน้าที่ใหม่
        </button>
      </div>

      {/* User List */}
      <div className="card">
        <div className="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          รายชื่อผู้ใช้งานในระบบ
        </div>

        {users.map((user) => (
          <div
            key={user.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 0',
              borderBottom: '1px solid var(--gray-100)',
              opacity: user.active ? 1 : 0.5,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--gray-900)' }}>
                  {user.name}
                </span>
                {getRoleBadge(user.role)}
                {!user.active && (
                  <span className="badge badge-pending" style={{ fontSize: '0.85rem', padding: '4px 8px' }}>ปิดใช้งาน</span>
                )}
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--gray-500)', marginTop: 4 }}>
                @{user.username} · {user.position}
              </div>
            </div>

            {user.role !== 'superadmin' && (
              <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => handleToggleActive(user.id)}
                  title={user.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                  style={{ fontSize: '1rem', padding: '6px 12px' }}
                >
                  {user.active ? '⏸️' : '▶️'}
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setShowDeleteModal(user)}
                  title="ลบผู้ใช้"
                  style={{ fontSize: '1rem', padding: '6px 12px', color: 'var(--danger-500)' }}
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="modal-content">
            <div className="modal-handle"></div>
            <div className="modal-title">➕ เพิ่มเจ้าหน้าที่ใหม่</div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-username">ชื่อผู้ใช้งาน (Username) <span className="required">*</span></label>
              <input
                type="text"
                id="new-username"
                className="form-input"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="เช่น officer02"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-password">รหัสผ่าน <span className="required">*</span></label>
              <input
                type="text"
                id="new-password"
                className="form-input"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="อย่างน้อย 4 ตัวอักษร"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-name">ชื่อ-นามสกุล <span className="required">*</span></label>
              <input
                type="text"
                id="new-name"
                className="form-input"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="ชื่อ-นามสกุล"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-position">ตำแหน่ง</label>
              <input
                type="text"
                id="new-position"
                className="form-input"
                value={newUser.position}
                onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-department">หน่วยงาน</label>
              <input
                type="text"
                id="new-department"
                className="form-input"
                value={newUser.department}
                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
              />
            </div>

            {addError && (
              <div className="form-error-text" style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--danger-50)', borderRadius: 'var(--radius-sm)' }}>
                ⚠️ {addError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setShowAddModal(false); setAddError(''); }}>
                ยกเลิก
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddUser} id="confirm-add-user-btn">
                เพิ่มเจ้าหน้าที่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(null); }}>
          <div className="modal-content">
            <div className="modal-handle"></div>
            <div className="modal-title">🗑️ ยืนยันการลบผู้ใช้</div>
            <p style={{ fontSize: '1.05rem', color: 'var(--gray-600)', marginBottom: 8 }}>
              คุณต้องการลบบัญชี <strong>{showDeleteModal.name}</strong> (@{showDeleteModal.username}) ออกจากระบบหรือไม่?
            </p>
            <p style={{ fontSize: '0.95rem', color: 'var(--danger-600)', marginBottom: 24 }}>
              ⚠️ การลบจะไม่สามารถเรียกคืนได้ หากต้องการปิดชั่วคราว ให้กดปุ่ม &quot;ปิดใช้งาน&quot; แทน
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowDeleteModal(null)}>
                ยกเลิก
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDeleteUser(showDeleteModal.id)} id="confirm-delete-user-btn">
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 40 }}></div>
    </>
  );
}
