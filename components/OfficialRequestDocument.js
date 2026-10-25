'use client';
import React from 'react';

// Format date into full formal Thai: "วันที่ 24 กันยายน 2569" or "วันที่ ๒๔ เดือน กันยายน พ.ศ. ๒๕๖๙"
export function formatFullThaiDate(dateStr) {
  if (!dateStr) {
    const now = new Date();
    const thaiYear = now.getFullYear() + (now.getFullYear() < 2400 ? 543 : 0);
    return `วันที่ ${now.getDate()} เดือน ${getThaiMonthName(now.getMonth())} พ.ศ. ${thaiYear}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const month = thaiMonths[d.getMonth()];
  const thaiYear = d.getFullYear() + (d.getFullYear() < 2400 ? 543 : 0);
  return `วันที่ ${day} เดือน ${month} พ.ศ. ${thaiYear}`;
}

function getThaiMonthName(monthIndex) {
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  return thaiMonths[monthIndex] || '';
}

// Render 13 ID boxes matching official government form: X-XXXX-XXXXX-XX-X
function renderIdBoxes(idNumber) {
  const digits = String(idNumber || '').replace(/[\s-]/g, '').padEnd(13, ' ').split('').slice(0, 13);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 6, verticalAlign: 'middle' }}>
      {digits.map((digit, index) => (
        <span
          key={index}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 17,
            height: 19,
            border: '1px solid #334155',
            borderRadius: 2,
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '10.5pt',
            background: '#ffffff',
            marginRight: index === 0 || index === 4 || index === 9 || index === 11 ? 5 : 0,
          }}
        >
          {digit !== ' ' ? digit : ''}
        </span>
      ))}
    </span>
  );
}

export default function OfficialRequestDocument({ request, id = 'official-paper-document' }) {
  if (!request) return null;

  const isRepresentative = request.request_type === 'representative';
  const attachmentsCount = Array.isArray(request.attachments)
    ? request.attachments.length
    : (request.attachments_count || 1);

  // Format village/moo nicely
  let villageText = '';
  if (request.village) {
    const raw = String(request.village).trim();
    if (raw.startsWith('หมู่') || raw.startsWith('ม.')) {
      villageText = raw.replace(/^หมู่\s*/, '').replace(/^ม\.\s*/, '');
    } else {
      villageText = raw;
    }
  }

  const categoryName = request.assistance_category || 'ด้านสาธารณภัย';

  return (
    <div
      id={id}
      className="official-doc-page"
      style={{
        width: '100%',
        maxWidth: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        padding: '16mm 20mm 16mm 20mm',
        background: '#ffffff',
        color: '#0f172a',
        fontFamily: 'var(--font-sarabun), "TH Sarabun New", "Sarabun", "Prompt", sans-serif',
        fontSize: '11.5pt',
        lineHeight: 1.7,
        boxSizing: 'border-box',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        borderRadius: 4,
      }}
    >
      {/* 1. Header Emblem Logo */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <img
          src="/logo.png"
          alt="ตราสัญลักษณ์เทศบาลตำบลโนนสัง"
          style={{
            width: 64,
            height: 64,
            objectFit: 'contain',
            display: 'inline-block',
          }}
        />
      </div>

      {/* 2. Document Title */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: '15pt', fontWeight: 700, letterSpacing: '0.2px' }}>
          แบบลงทะเบียนขอรับความช่วยเหลือของประชาชน
        </div>
        <div style={{ fontSize: '12pt', fontWeight: 600, marginTop: 1 }}>
          {isRepresentative ? '(กรณีร้องขอโดยผู้แทน)' : '(กรณีร้องขอด้วยตนเอง)'}
        </div>
      </div>

      {/* 3. Organization & Request Number Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginTop: 6,
          marginBottom: 4,
          fontSize: '11pt',
          flexWrap: 'nowrap',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <span>ชื่อ อปท. </span>
          <span style={{ fontWeight: 600 }}>เทศบาลตำบลโนนสัง</span>
          <span style={{ marginLeft: 12 }}>อำเภอ </span>
          <span style={{ fontWeight: 600 }}>โนนสัง</span>
          <span style={{ marginLeft: 12 }}>จังหวัด </span>
          <span style={{ fontWeight: 600 }}>หนองบัวลำภู</span>
        </div>
        <div style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          <span>เลขที่คำร้อง </span>
          <span style={{ fontWeight: 700, color: 'var(--primary-800, #9a3412)' }}>
            {request.request_number || '-'}
          </span>
        </div>
      </div>

      {/* 4. Date Row */}
      <div style={{ textAlign: 'right', fontSize: '11pt', marginBottom: 10 }}>
        {formatFullThaiDate(request.created_at || request.incident_date)}
      </div>

      {/* 5. Citizen & Representative Personal Info */}
      <div style={{ fontSize: '11pt', lineHeight: 1.9, marginBottom: 10 }}>
        <div>
          ข้าพเจ้า (นาย/นาง/นางสาว){' '}
          <span style={{ fontWeight: 600 }}>
            {request.full_name || '....................................................................'}
          </span>{' '}
          อายุ <span style={{ fontWeight: 600 }}>{request.age || '-'}</span> ปี
        </div>

        {isRepresentative && (
          <div style={{ background: '#fefce8', padding: '2px 8px', borderRadius: 4, margin: '2px 0' }}>
            <span>ผู้แทนผู้ยื่นคำร้อง: </span>
            <span style={{ fontWeight: 600 }}>
              {request.representative_name || '....................................................................'}
            </span>
            {request.representative_relation && (
              <span style={{ marginLeft: 10, color: '#475569' }}>
                (ความสัมพันธ์: <strong style={{ color: '#0f172a' }}>{request.representative_relation}</strong>)
              </span>
            )}
            {request.representative_phone && (
              <span style={{ marginLeft: 10, color: '#475569' }}>
                เบอร์โทร: <strong style={{ color: '#0f172a' }}>{request.representative_phone}</strong>
              </span>
            )}
          </div>
        )}

        <div>
          อยู่บ้านเลขที่ <span style={{ fontWeight: 600 }}>{request.address || '-'}</span>{' '}
          หมู่ที่ <span style={{ fontWeight: 600 }}>{villageText || '-'}</span>{' '}
          ตำบล <span style={{ fontWeight: 600 }}>{request.subdistrict || 'โนนสัง'}</span>{' '}
          อำเภอ <span style={{ fontWeight: 600 }}>{request.district || 'โนนสัง'}</span>{' '}
          จังหวัด <span style={{ fontWeight: 600 }}>{request.province || 'หนองบัวลำภู'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <span>โทรศัพท์ <span style={{ fontWeight: 600 }}>{request.phone || '-'}</span></span>
          <span style={{ marginLeft: 8 }}>หมายเลขประจำตัวประชาชน</span>
          {renderIdBoxes(request.id_card_number)}
        </div>

        <div>
          มีความประสงค์ขอให้ (หน่วยงาน){' '}
          <span style={{ fontWeight: 600 }}>เทศบาลตำบลโนนสัง</span> ดำเนินการช่วยเหลือ ดังนี้
        </div>

        {/* 1. ประเภทการช่วยเหลือ (ตามแบบฟอร์ม ๑.๑ - ๑.๔) */}
        <div style={{ margin: '6px 0 6px 10px', lineHeight: 1.8 }}>
          <div style={{ fontWeight: 600 }}>๑. ประเภทการช่วยเหลือ</div>

          {/* 1.1 ด้านสาธารณภัย */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginLeft: 16 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 14,
                height: 14,
                border: '1.2px solid #0f172a',
                borderRadius: 2,
                fontSize: '9pt',
                fontWeight: 800,
                flexShrink: 0,
                marginTop: 4,
                background: '#ffffff',
              }}
            >
              {categoryName === 'ด้านสาธารณภัย' || !request.assistance_category ? '✓' : ''}
            </span>
            <span>
              ๑.๑ ด้านสาธารณภัย (ระบุปัญหา/ความเดือดร้อนที่เกิดขึ้น){' '}
              {categoryName === 'ด้านสาธารณภัย' || !request.assistance_category ? (
                <span style={{ fontWeight: 600, borderBottom: '1px dotted #64748b', paddingBottom: 1 }}>
                  {request.disaster_type ? `${request.disaster_type.replace(/^[^\wก-๙\s]+/u, '').trim()}` : ''}
                  {request.officer_notes ? ` - ${request.officer_notes}` : ''}
                </span>
              ) : (
                '......................................................................'
              )}
            </span>
          </div>

          {/* 1.2 ด้านการส่งเสริมและพัฒนาคุณภาพชีวิต */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginLeft: 16 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 14,
                height: 14,
                border: '1.2px solid #0f172a',
                borderRadius: 2,
                fontSize: '9pt',
                fontWeight: 800,
                flexShrink: 0,
                marginTop: 4,
                background: '#ffffff',
              }}
            >
              {categoryName === 'ด้านการส่งเสริมและพัฒนาคุณภาพชีวิต' ? '✓' : ''}
            </span>
            <span>
              ๑.๒ ด้านการส่งเสริมและพัฒนาคุณภาพชีวิต (ระบุปัญหา/ความเดือดร้อนที่เกิดขึ้น){' '}
              {categoryName === 'ด้านการส่งเสริมและพัฒนาคุณภาพชีวิต' ? (
                <span style={{ fontWeight: 600, borderBottom: '1px dotted #64748b' }}>
                  {request.assistance_requested}
                </span>
              ) : (
                '...................................'
              )}
            </span>
          </div>

          {/* 1.3 ด้านการป้องกันและควบคุมโรคติดต่อ */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginLeft: 16 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 14,
                height: 14,
                border: '1.2px solid #0f172a',
                borderRadius: 2,
                fontSize: '9pt',
                fontWeight: 800,
                flexShrink: 0,
                marginTop: 4,
                background: '#ffffff',
              }}
            >
              {categoryName === 'ด้านการป้องกันและควบคุมโรคติดต่อ' ? '✓' : ''}
            </span>
            <span>
              ๑.๓ ด้านการป้องกันและควบคุมโรคติดต่อ (ระบุปัญหา/ความเดือดร้อนที่เกิดขึ้น){' '}
              {categoryName === 'ด้านการป้องกันและควบคุมโรคติดต่อ' ? (
                <span style={{ fontWeight: 600, borderBottom: '1px dotted #64748b' }}>
                  {request.assistance_requested}
                </span>
              ) : (
                '....................................'
              )}
            </span>
          </div>

          {/* 1.4 ด้านอื่น ๆ */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginLeft: 16 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 14,
                height: 14,
                border: '1.2px solid #0f172a',
                borderRadius: 2,
                fontSize: '9pt',
                fontWeight: 800,
                flexShrink: 0,
                marginTop: 4,
                background: '#ffffff',
              }}
            >
              {categoryName === 'ด้านอื่น ๆ' ? '✓' : ''}
            </span>
            <span>
              ๑.๔ ด้านอื่น ๆ (ระบุปัญหา/ความเดือดร้อนที่เกิดขึ้น){' '}
              {categoryName === 'ด้านอื่น ๆ' ? (
                <span style={{ fontWeight: 600, borderBottom: '1px dotted #64748b' }}>
                  {request.assistance_requested}
                </span>
              ) : (
                '.......................................................................'
              )}
            </span>
          </div>
        </div>

        {/* 2. ความช่วยเหลือที่ต้องการ (สิ่งที่ขอความช่วยเหลือ) */}
        <div style={{ margin: '6px 0 6px 10px', lineHeight: 1.8 }}>
          <div>
            <span style={{ fontWeight: 600 }}>
              ๒. ข้าพเจ้าจึงขอความช่วยเหลือ (ระบุความต้องการ/สิ่งที่ขอความช่วยเหลือ)
            </span>
          </div>
          <div
            style={{
              marginLeft: 16,
              fontWeight: 600,
              borderBottom: '1px dotted #64748b',
              minHeight: 22,
              paddingBottom: 2,
            }}
          >
            {request.assistance_requested ||
              '....................................................................................................................................................'}
          </div>
        </div>

        {/* 3. เอกสารแนบหลักฐาน */}
        <div style={{ margin: '6px 0 4px 10px' }}>
          <span>๓. ข้าพเจ้าได้แนบเอกสารหลักฐานที่เกี่ยวข้องมาด้วยแล้ว จำนวน </span>
          <span style={{ fontWeight: 600 }}>{attachmentsCount}</span>
          <span> ฉบับ</span>
        </div>

        <div style={{ margin: '4px 0 16px 10px', fontWeight: 500 }}>
          ข้าพเจ้าขอรับรองว่าข้อความดังกล่าวข้างต้นเป็นจริงทุกประการ
        </div>
      </div>

      {/* 4. Signatures Block (Side-by-side, no overlap) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginTop: 22,
          paddingTop: 6,
          fontSize: '11pt',
        }}
      >
        {/* Left: Citizen Signature */}
        <div
          style={{
            width: '46%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 36,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              width: '100%',
              whiteSpace: 'nowrap',
              gap: 4,
              marginBottom: 4,
            }}
          >
            <span>(ลงชื่อ)</span>
            <span
              style={{
                position: 'relative',
                display: 'inline-block',
                width: 125,
                borderBottom: '1.5px dotted #1e293b',
                margin: '0 4px',
                height: 0,
                transform: 'translateY(3px)',
              }}
            >
              {request.signature_url && (
                <img
                  src={request.signature_url}
                  alt="ลายมือชื่อผู้ยื่นคำขอ"
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    maxHeight: 44,
                    maxWidth: 115,
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />
              )}
            </span>
            <span>ผู้ยื่นคำขอ</span>
          </div>
          <div style={{ fontWeight: 500, marginTop: 6 }}>
            (
            {isRepresentative && request.representative_name
              ? request.representative_name
              : request.full_name || '..................................'}
            )
          </div>
        </div>

        {/* Right: Officer Signature */}
        <div
          style={{
            width: '48%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 36,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              width: '100%',
              whiteSpace: 'nowrap',
              gap: 4,
              marginBottom: 4,
            }}
          >
            <span>(ลงชื่อ)</span>
            <span
              style={{
                position: 'relative',
                display: 'inline-block',
                width: 120,
                borderBottom: '1.5px dotted #1e293b',
                margin: '0 4px',
                height: 0,
                transform: 'translateY(3px)',
              }}
            >
              {request.officer_signature_url && (
                <img
                  src={request.officer_signature_url}
                  alt="ลายมือชื่อเจ้าหน้าที่ผู้รับคำขอ"
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    maxHeight: 44,
                    maxWidth: 110,
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />
              )}
            </span>
            <span>เจ้าหน้าที่ผู้รับคำขอ</span>
          </div>
          <div style={{ fontWeight: 500, marginTop: 6 }}>
            (
            {request.reviewed_by ||
              (request.officer_name ? request.officer_name : '..................................')}
            )
          </div>
          {request.officer_position && (
            <div style={{ fontSize: '10pt', color: '#475569', marginTop: 1 }}>
              ({request.officer_position})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
