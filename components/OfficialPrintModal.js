'use client';
import React from 'react';
import OfficialRequestDocument from './OfficialRequestDocument';

export default function OfficialPrintModal({ request, onClose }) {
  if (!request) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal-overlay official-print-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        padding: '20px 16px 80px 16px',
        overflowY: 'auto',
        display: 'block',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{ maxWidth: '210mm', margin: '0 auto' }}>
      {/* Control Toolbar - Hidden during print */}
      <div
        className="no-print"
        style={{
          width: '100%',
          maxWidth: '210mm',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          borderRadius: '12px 12px 0 0',
          padding: '14px 20px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.4rem' }}>📄</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f8fafc' }}>
              พิมพ์แบบคำร้องขอรับความช่วยเหลือ
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              เลขที่ {request.request_number} • มาตรฐานกระดาษ A4 ทางราชการ
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handlePrint}
            className="btn btn-primary"
            id="print-document-action-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              fontWeight: 700,
              fontSize: '0.98rem',
              boxShadow: '0 4px 14px rgba(234,88,12,0.4)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            สั่งพิมพ์ / ดาวน์โหลด PDF
          </button>

          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{
              color: '#e2e8f0',
              borderColor: '#475569',
              background: 'rgba(255,255,255,0.1)',
              padding: '10px 16px',
            }}
          >
            ✕ ปิด
          </button>
        </div>
      </div>

      {/* Tip Banner - Hidden during print */}
      <div
        className="no-print"
        style={{
          width: '100%',
          maxWidth: '210mm',
          background: '#fef3c7',
          color: '#92400e',
          padding: '8px 20px',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid #fde68a',
        }}
      >
        <span>💡</span>
        <span>
          <strong>คำแนะนำ:</strong> ในหน้าต่างพิมพ์ของเบราว์เซอร์ สามารถเลือกเครื่องพิมพ์กระดาษ (Paper) หรือเลือกปลายทางเป็น <strong>"Save as PDF / บันทึกเป็น PDF"</strong> เพื่อดาวน์โหลดไฟล์ได้
        </span>
      </div>

      {/* Printable Document Container */}
      <div
        className="official-print-container"
        style={{
          width: '100%',
          maxWidth: '210mm',
          background: '#ffffff',
          borderRadius: '0 0 12px 12px',
          overflow: 'hidden',
          marginBottom: '40px',
        }}
      >
        <OfficialRequestDocument request={request} id="printable-request-doc" />
      </div>
      </div>
    </div>
  );
}
