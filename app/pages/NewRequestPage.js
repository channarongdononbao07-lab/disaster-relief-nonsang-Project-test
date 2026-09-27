'use client';
import { useState, useRef, useMemo } from 'react';
import SignaturePad from '../../components/SignaturePad';
import { useToast } from '../../components/Toast';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { saveDemoRequest } from '../../lib/demoStore';
import thaiAddressData from '../data/thai_address_tree.json';

// Pre-sort provinces once at module level so form typing never re-sorts 77 strings
const ALL_PROVINCES = Object.keys(thaiAddressData).sort((a, b) => a.localeCompare(b, 'th'));

const DISASTER_TYPES = [
  '🌊 อุทกภัย',
  '🌪️ วาตภัย',
  '🔥 อัคคีภัย',
  '☀️ ภัยแล้ง',
  '🪨 ดินโคลนถล่ม',
  '🏚️ แผ่นดินไหว',
  '⛈️ ภัยจากพายุ',
  '❄️ ภัยหนาว',
  '⚠️ อื่นๆ',
];

const URGENCY_LEVELS = [
  { value: 'urgent', label: 'เร่งด่วน', color: 'var(--danger-500)' },
  { value: 'high', label: 'สูง', color: 'var(--warning-500)' },
  { value: 'normal', label: 'ปกติ', color: 'var(--primary-500)' },
  { value: 'low', label: 'ต่ำ', color: 'var(--gray-400)' },
];

const INITIAL_FORM = {
  disaster_type: '🌊 อุทกภัย',
  incident_date: new Date().toISOString().split('T')[0],
  urgency_level: 'urgent',
  estimated_damage: 0,
  full_name: '',
  id_card_number: '',
  phone: '',
  household_members: 1,
  address: '',
  village: '',
  subdistrict: '',
  district: '',
  province: '',
  assistance_requested: '',
  officer_notes: '',
};

export default function NewRequestPage({ onNavigate }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [signature, setSignature] = useState(null);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedNumber, setSubmittedNumber] = useState('');
  const fileInputRef = useRef(null);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const PROVINCES = ALL_PROVINCES;

  const DISTRICTS = useMemo(() => {
    if (!form.province || !thaiAddressData[form.province]) return [];
    return Object.keys(thaiAddressData[form.province]).sort((a, b) => a.localeCompare(b, 'th'));
  }, [form.province]);

  const SUBDISTRICTS = useMemo(() => {
    if (!form.province || !form.district || !thaiAddressData[form.province]?.[form.district]) return [];
    return [...thaiAddressData[form.province][form.district]].sort((a, b) => a.localeCompare(b, 'th'));
  }, [form.province, form.district]);

  const handleProvinceChange = (val) => {
    setForm((prev) => ({ ...prev, province: val, district: '', subdistrict: '' }));
    if (errors.province) setErrors((prev) => ({ ...prev, province: null }));
  };

  const handleDistrictChange = (val) => {
    setForm((prev) => ({ ...prev, district: val, subdistrict: '' }));
    if (errors.district) setErrors((prev) => ({ ...prev, district: null }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const validFiles = newFiles.filter((f) => f.size <= 15 * 1024 * 1024);
    if (validFiles.length < newFiles.length) {
      showToast('ไฟล์ขนาดเกินกำหนด', 'บางไฟล์มีขนาดเกิน 15 MB กรุณาเลือกไฟล์ใหม่', 'error');
    }
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.disaster_type) newErrors.disaster_type = 'กรุณาเลือกประเภทสาธารณภัย';
    if (!form.incident_date) newErrors.incident_date = 'กรุณาเลือกวันที่เกิดเหตุ';
    if (!form.urgency_level) newErrors.urgency_level = 'กรุณาเลือกระดับความเร่งด่วน';
    if (!form.full_name.trim()) newErrors.full_name = 'กรุณากรอกชื่อ-นามสกุล';
    if (!form.id_card_number.trim()) newErrors.id_card_number = 'กรุณากรอกเลขบัตรประชาชน';
    if (form.id_card_number.trim() && !/^\d{13}$/.test(form.id_card_number.replace(/[\s-]/g, ''))) {
      newErrors.id_card_number = 'เลขบัตรประชาชนต้องมี 13 หลัก';
    }
    if (!form.phone.trim()) newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    if (!form.address.trim()) newErrors.address = 'กรุณากรอกที่อยู่';
    if (!form.district.trim()) newErrors.district = 'กรุณากรอกอำเภอ/เขต';
    if (!form.province.trim()) newErrors.province = 'กรุณากรอกจังหวัด';
    if (!form.assistance_requested.trim()) newErrors.assistance_requested = 'กรุณาระบุสิ่งของ/การช่วยเหลือที่ร้องขอ';
    if (!signature) newErrors.signature = 'กรุณาลงลายมือชื่อ';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateRequestNumber = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `REQ-${dateStr}-${random}`;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showToast('กรุณากรอกข้อมูล', 'โปรดกรอกข้อมูลที่จำเป็นให้ครบถ้วนก่อนส่ง', 'error');
      // Scroll to first error
      const firstErrorField = document.querySelector('.form-input-error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    const requestNumber = generateRequestNumber();

    const requestData = {
      request_number: requestNumber,
      ...form,
      estimated_damage: Number(form.estimated_damage) || 0,
      household_members: Number(form.household_members) || 1,
      signature_url: signature,
      attachments: files.map(f => ({ name: f.name, url: '#', size: f.size })),
      status: 'pending',
    };

    try {
      if (isSupabaseConfigured) {
        // Upload files concurrently in parallel instead of one by one
        let attachmentUrls = [];
        if (files.length > 0) {
          const uploadPromises = files.map(async (file) => {
            const filePath = `attachments/${requestNumber}/${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('request-files')
              .upload(filePath, file);

            if (!uploadError && uploadData) {
              const { data: urlData } = supabase.storage.from('request-files').getPublicUrl(filePath);
              return { name: file.name, url: urlData.publicUrl, size: file.size };
            }
            return { name: file.name, url: '#', size: file.size };
          });

          const results = await Promise.allSettled(uploadPromises);
          attachmentUrls = results
            .filter((r) => r.status === 'fulfilled' && r.value)
            .map((r) => r.value);
        }

        const { error } = await supabase.from('requests').insert({
          ...requestData,
          attachments: attachmentUrls.length > 0 ? attachmentUrls : requestData.attachments,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
      } else {
        saveDemoRequest(requestData);
      }

      setSubmittedNumber(requestNumber);
      setSubmitted(true);
      showToast('บันทึกคำร้อง', 'เรียบร้อยแล้ว', 'success');
    } catch (e) {
      console.error('Submit error:', e);
      // Fallback save to demo store
      saveDemoRequest(requestData);
      setSubmittedNumber(requestNumber);
      setSubmitted(true);
      showToast('บันทึกคำร้อง', 'เรียบร้อยแล้ว (Demo Mode)', 'success');
    }

    setSubmitting(false);
  };

  // Success screen
  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--success-500), #16a34a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          animation: 'slideUp 0.5s ease',
          boxShadow: '0 8px 30px rgba(34, 197, 94, 0.4)',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: 8 }}>
          บันทึกคำร้องเรียบร้อย!
        </h2>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.88rem', marginBottom: 24 }}>
          คำร้องของคุณถูกบันทึกและส่งเข้าสู่กระบวนการตรวจสอบแล้ว
        </p>
        <div style={{
          background: 'var(--primary-50)', borderRadius: 'var(--radius-md)',
          padding: '16px 24px', marginBottom: 32, border: '2px solid var(--primary-200)',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: 4 }}>เลขที่คำร้อง</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-700)', letterSpacing: '1px' }}>
            {submittedNumber}
          </div>
        </div>
        <button className="btn btn-primary btn-block" onClick={() => onNavigate('registry')} id="go-to-registry-btn">
          ดูรายการคำร้อง
        </button>
        <button className="btn btn-outline btn-block mt-4" onClick={() => onNavigate('home')} id="go-home-btn">
          กลับหน้าแรก
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <h1>กรอกแบบฟอร์มช่วยเหลือ</h1>
        <p>กรอกข้อมูลให้ครบถ้วนเพื่อสร้างเลขที่คำร้องและส่งเข้าสู่กระบวนการตรวจสอบ</p>
      </div>

      <button className="back-btn" onClick={() => onNavigate('registry')} id="back-to-registry-btn">
        ← กลับทะเบียน
      </button>

      {/* Section 1: Incident Info */}
      <div className="card" style={{ animationDelay: '0.1s' }}>
        <div className="card-title">
          <span className="section-number">1</span>
          ข้อมูลเหตุการณ์
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="disaster_type">
            ประเภทสาธารณภัย <span className="required">*</span>
          </label>
          <select
            className={`form-select ${errors.disaster_type ? 'form-input-error' : ''}`}
            id="disaster_type"
            value={form.disaster_type}
            onChange={(e) => updateField('disaster_type', e.target.value)}
          >
            {DISASTER_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.disaster_type && <div className="form-error-text">{errors.disaster_type}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="incident_date">
            วันที่เกิดเหตุ <span className="required">*</span>
          </label>
          <input
            type="date"
            className={`form-input ${errors.incident_date ? 'form-input-error' : ''}`}
            id="incident_date"
            value={form.incident_date}
            onChange={(e) => updateField('incident_date', e.target.value)}
          />
          {errors.incident_date && <div className="form-error-text">{errors.incident_date}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="urgency_level">
            ระดับความเร่งด่วน <span className="required">*</span>
          </label>
          <select
            className={`form-select ${errors.urgency_level ? 'form-input-error' : ''}`}
            id="urgency_level"
            value={form.urgency_level}
            onChange={(e) => updateField('urgency_level', e.target.value)}
            style={{
              borderColor: URGENCY_LEVELS.find(u => u.value === form.urgency_level)?.color,
              color: URGENCY_LEVELS.find(u => u.value === form.urgency_level)?.color,
            }}
          >
            {URGENCY_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="estimated_damage">
            มูลค่าความเสียหายโดยประมาณ (บาท)
          </label>
          <input
            type="number"
            className="form-input"
            id="estimated_damage"
            value={form.estimated_damage}
            onChange={(e) => updateField('estimated_damage', e.target.value)}
            min="0"
            placeholder="0"
          />
        </div>
      </div>

      {/* Section 2: Personal Info */}
      <div className="card" style={{ animationDelay: '0.2s' }}>
        <div className="card-title">
          <span className="section-number">2</span>
          ข้อมูลผู้ประสบภัยและที่อยู่
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="full_name">
            ชื่อผู้ยื่นคำร้อง <span className="required">*</span>
          </label>
          <input
            type="text"
            className={`form-input ${errors.full_name ? 'form-input-error' : ''}`}
            id="full_name"
            value={form.full_name}
            onChange={(e) => updateField('full_name', e.target.value)}
            placeholder="ชื่อ - นามสกุล"
          />
          {errors.full_name && <div className="form-error-text">{errors.full_name}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="id_card_number">
            เลขบัตรประชาชน / เลขประจำตัว <span className="required">*</span>
          </label>
          <input
            type="text"
            className={`form-input ${errors.id_card_number ? 'form-input-error' : ''}`}
            id="id_card_number"
            value={form.id_card_number}
            onChange={(e) => updateField('id_card_number', e.target.value)}
            placeholder="กรอกเลขประจำตัว"
            maxLength={17}
            inputMode="numeric"
          />
          {errors.id_card_number && <div className="form-error-text">{errors.id_card_number}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="phone">
            เบอร์โทรศัพท์ <span className="required">*</span>
          </label>
          <input
            type="tel"
            className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
            id="phone"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="08x-xxx-xxxx"
            inputMode="tel"
          />
          {errors.phone && <div className="form-error-text">{errors.phone}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="household_members">
            จำนวนสมาชิกในครัวเรือน <span className="required">*</span>
          </label>
          <input
            type="number"
            className="form-input"
            id="household_members"
            value={form.household_members}
            onChange={(e) => updateField('household_members', e.target.value)}
            min="1"
            inputMode="numeric"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="address">
            ที่อยู่บ้านเลขที่ / ถนน <span className="required">*</span>
          </label>
          <input
            type="text"
            className={`form-input ${errors.address ? 'form-input-error' : ''}`}
            id="address"
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="บ้านเลขที่ หมู่ที่ ถนน"
          />
          {errors.address && <div className="form-error-text">{errors.address}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="village">หมู่บ้าน</label>
          <input
            type="text"
            className="form-input"
            id="village"
            value={form.village}
            onChange={(e) => updateField('village', e.target.value)}
            placeholder="ชื่อหมู่บ้าน (ถ้ามี)"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="province">
            จังหวัด <span className="required">*</span>
          </label>
          <select
            className={`form-select ${errors.province ? 'form-input-error' : ''}`}
            id="province"
            value={form.province}
            onChange={(e) => handleProvinceChange(e.target.value)}
          >
            <option value="">-- เลือกจังหวัด --</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {errors.province && <div className="form-error-text">{errors.province}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="district">
            อำเภอ / เขต <span className="required">*</span>
          </label>
          <select
            className={`form-select ${errors.district ? 'form-input-error' : ''}`}
            id="district"
            value={form.district}
            onChange={(e) => handleDistrictChange(e.target.value)}
            disabled={!form.province}
          >
            <option value="">-- เลือกอำเภอ/เขต --</option>
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {errors.district && <div className="form-error-text">{errors.district}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="subdistrict">ตำบล / แขวง</label>
          <select
            className={`form-select ${errors.subdistrict ? 'form-input-error' : ''}`}
            id="subdistrict"
            value={form.subdistrict}
            onChange={(e) => updateField('subdistrict', e.target.value)}
            disabled={!form.district}
          >
            <option value="">-- เลือกตำบล/แขวง --</option>
            {SUBDISTRICTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Section 3: Assistance Needed */}
      <div className="card" style={{ animationDelay: '0.3s' }}>
        <div className="card-title">
          <span className="section-number">3</span>
          รายการความช่วยเหลือที่ต้องการ
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="assistance_requested">
            สิ่งของ / การช่วยเหลือที่ร้องขอ <span className="required">*</span>
          </label>
          <textarea
            className={`form-textarea ${errors.assistance_requested ? 'form-input-error' : ''}`}
            id="assistance_requested"
            value={form.assistance_requested}
            onChange={(e) => updateField('assistance_requested', e.target.value)}
            placeholder="เช่น ถุงยังชีพ น้ำดื่ม วัสดุซ่อมแซมบ้าน เงินช่วยเหลือ"
            rows={4}
          />
          {errors.assistance_requested && <div className="form-error-text">{errors.assistance_requested}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="officer_notes">
            หมายเหตุสำหรับเจ้าหน้าที่
          </label>
          <textarea
            className="form-textarea"
            id="officer_notes"
            value={form.officer_notes}
            onChange={(e) => updateField('officer_notes', e.target.value)}
            placeholder="ข้อมูลเพิ่มเติมหรือข้อสังเกต"
            rows={3}
          />
        </div>

        {/* File Upload */}
        <div className="form-group">
          <label className="form-label">รูปถ่ายและเอกสารประกอบ</label>
          <div
            className="file-upload-zone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('dragover'); }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('dragover');
              const droppedFiles = Array.from(e.dataTransfer.files);
              setFiles((prev) => [...prev, ...droppedFiles.filter(f => f.size <= 15 * 1024 * 1024)]);
            }}
            id="file-upload-zone"
          >
            <div className="file-upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            </div>
            <div className="file-upload-text">เลือกไฟล์แนบ (รูปภาพ, PDF, Word, Excel)</div>
            <div className="file-upload-hint">ไฟล์ละไม่เกิน 15 MB และรวมได้หลายไฟล์</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="file-input"
          />

          {files.length > 0 && (
            <div className="file-list">
              {files.map((file, index) => (
                <div key={index} className="file-item">
                  <span>📎 {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                  <button className="file-item-remove" onClick={() => removeFile(index)} type="button">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Signature */}
      <div className="card" style={{ animationDelay: '0.4s' }}>
        <div className="card-title">
          <span className="section-number">4</span>
          ลงลายมือชื่อ
        </div>

        <SignaturePad onSignatureChange={setSignature} />
        {errors.signature && <div className="form-error-text" style={{ marginTop: -12 }}>{errors.signature}</div>}
      </div>

      {/* Submit Buttons */}
      <div className="action-bar-sticky">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 640, margin: '0 auto' }}>
          <button
            className="btn btn-primary btn-block btn-lg"
            onClick={handleSubmit}
            disabled={submitting}
            id="submit-request-btn"
          >
            {submitting ? (
              <>
                <span className="spinner" style={{ borderTopColor: 'white' }}></span>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <path d="M17 21v-8H7v8M7 3v5h8" />
                </svg>
                บันทึกและส่งคำร้อง
              </>
            )}
          </button>
          <button
            className="btn btn-outline btn-block"
            onClick={() => onNavigate('registry')}
            disabled={submitting}
            id="cancel-request-btn"
          >
            ยกเลิก
          </button>
        </div>
      </div>

      {/* Spacer for sticky bar */}
      <div style={{ height: 100 }}></div>
    </>
  );
}
