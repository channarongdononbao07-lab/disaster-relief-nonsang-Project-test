// In-memory + LocalStorage store for Demo mode before Supabase credentials are configured

const SAMPLE_CITIZEN_SIGNATURE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60" viewBox="0 0 160 60"><path d="M10,40 Q40,10 70,35 T130,25 Q150,20 155,45" fill="none" stroke="%230f172a" stroke-width="2.5" stroke-linecap="round"/></svg>';
const SAMPLE_OFFICER_SIGNATURE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60" viewBox="0 0 160 60"><path d="M15,20 L35,50 L55,15 Q90,45 120,20 T150,35" fill="none" stroke="%231e3a8a" stroke-width="2.5" stroke-linecap="round"/></svg>';

export const INITIAL_DEMO_REQUESTS = [
  {
    id: 'demo-1',
    request_number: 'DMS-2569-680214',
    request_type: 'representative',
    representative_name: 'น้อยหน่า ต๊ะติ๊งโหน่ง',
    representative_phone: '089-999-9999',
    representative_relation: 'บุตร',
    age: 48,
    assistance_category: 'ด้านสาธารณภัย',
    disaster_type: '🌪️ วาตภัย',
    incident_date: '2026-09-24',
    urgency_level: 'urgent',
    estimated_damage: 45000,
    full_name: 'นางสาวนิดหน่อย น้องน้อยหน่า',
    id_card_number: '0-0000-00000-00-9',
    phone: '099-999-9999',
    household_members: 3,
    address: '1000',
    village: 'หมู่ที่ 10',
    subdistrict: 'โนนสัง',
    district: 'โนนสัง',
    province: 'หนองบัวลำภู',
    assistance_requested: 'วัสดุซ่อมแซมหลังคา',
    officer_notes: 'วาตภัยพัดหลังคาพังเสียหาย ต้องการกระเบื้องและไม้โครงหลังคาเร่งด่วน',
    status: 'approved',
    signature_url: SAMPLE_CITIZEN_SIGNATURE,
    officer_signature_url: SAMPLE_OFFICER_SIGNATURE,
    attachments: [
      { name: 'รูปความเสียหายหลังคา.jpg', url: '#', size: 2450000 },
      { name: 'สำเนาบัตรประชาชนผู้ยื่น.pdf', url: '#', size: 1200000 },
      { name: 'หนังสือมอบอำนาจผู้แทน.pdf', url: '#', size: 950000 }
    ],
    reviewed_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    approved_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    reviewed_by: 'นางสาวซาร่า พาราเซตามอล',
    officer_position: 'เจ้าหน้าที่ผู้รับคำขอ',
    review_notes: 'ตรวจสอบเอกสารหลักฐานและลงพื้นที่สำรวจแล้ว อนุมัติจัดสรรวัสดุซ่อมแซมหลังคา',
    created_at: '2026-09-24T09:30:00.000Z',
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'demo-2',
    request_number: 'DMS-2569-100201',
    request_type: 'self',
    representative_name: '',
    representative_phone: '',
    representative_relation: '',
    age: 54,
    assistance_category: 'ด้านสาธารณภัย',
    disaster_type: '🌊 อุทกภัย',
    incident_date: '2026-09-25',
    urgency_level: 'urgent',
    estimated_damage: 65000,
    full_name: 'นายสมศักดิ์ รักชาติ',
    id_card_number: '1-1002-00304-05-1',
    phone: '081-234-5678',
    household_members: 4,
    address: '45/12',
    village: 'หมู่ที่ 3',
    subdistrict: 'โนนสัง',
    district: 'โนนสัง',
    province: 'หนองบัวลำภู',
    assistance_requested: 'ขอรับถุงยังชีพ 2 ชุด, น้ำดื่ม 5 แพ็ค, ทรายและกระสอบกั้นน้ำ',
    officer_notes: 'น้ำท่วมขังบริเวณรอบบ้านระดับเอว',
    status: 'reviewing',
    signature_url: SAMPLE_CITIZEN_SIGNATURE,
    officer_signature_url: null,
    attachments: [
      { name: 'รูปน้ำท่วมหน้าบ้าน.jpg', url: '#', size: 2450000 },
      { name: 'สำเนาทะเบียนบ้าน.pdf', url: '#', size: 1200000 }
    ],
    reviewed_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    reviewed_by: 'นายสมชาย ปภ.',
    officer_position: 'เจ้าหน้าที่ปฏิบัติการ ปภ.',
    review_notes: 'อยู่ระหว่างตรวจสอบเอกสารและพิกัดลงพื้นที่จริง',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'demo-3',
    request_number: 'DMS-2569-100302',
    request_type: 'self',
    representative_name: '',
    representative_phone: '',
    representative_relation: '',
    age: 62,
    assistance_category: 'ด้านสาธารณภัย',
    disaster_type: '🔥 อัคคีภัย',
    incident_date: '2026-09-20',
    urgency_level: 'urgent',
    estimated_damage: 350000,
    full_name: 'นายประสิทธิ์ สุขใจ',
    id_card_number: '1-1299-00123-45-6',
    phone: '086-111-2233',
    household_members: 5,
    address: '12/9',
    village: 'หมู่ที่ 2',
    subdistrict: 'โนนสัง',
    district: 'โนนสัง',
    province: 'หนองบัวลำภู',
    assistance_requested: 'งบประมาณช่วยเหลือผู้ประสบอัคคีภัย, เครื่องอุปโภคบริโภค, ที่พักอาศัยชั่วคราว',
    officer_notes: 'ไฟลุกไหม้เสียหายทั้งหลัง ได้รับการช่วยเหลือเบื้องต้นจากมูลนิธิแล้ว',
    status: 'pending',
    signature_url: SAMPLE_CITIZEN_SIGNATURE,
    officer_signature_url: null,
    attachments: [
      { name: 'รายงานเหตุเพลิงไหม้.pdf', url: '#', size: 1800000 }
    ],
    reviewed_at: null,
    reviewed_by: null,
    officer_position: null,
    review_notes: null,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  }
];

let memoryCache = null;
const listeners = new Set();

function notifyListeners() {
  const data = getDemoRequests();
  listeners.forEach(fn => {
    try { fn(data); } catch (e) { console.error('Listener error:', e); }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('disaster_requests_updated', { detail: data }));
  }
}

export function subscribeDemoRequests(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function calculateStats(requests) {
  const list = requests || getDemoRequests();
  let pending = 0;
  let reviewing = 0;
  let approved = 0;
  for (let i = 0; i < list.length; i++) {
    const s = list[i].status;
    if (s === 'pending') pending++;
    else if (s === 'reviewing') reviewing++;
    else if (s === 'approved') approved++;
  }
  return {
    total: list.length,
    pending,
    reviewing,
    approved,
  };
}

export function getDemoRequests() {
  if (memoryCache) return memoryCache;
  if (typeof window === 'undefined') return INITIAL_DEMO_REQUESTS;
  try {
    const stored = localStorage.getItem('disaster_demo_requests');
    if (!stored) {
      localStorage.setItem('disaster_demo_requests', JSON.stringify(INITIAL_DEMO_REQUESTS));
      memoryCache = [...INITIAL_DEMO_REQUESTS];
      return memoryCache;
    }
    memoryCache = JSON.parse(stored);
    return memoryCache;
  } catch (e) {
    memoryCache = [...INITIAL_DEMO_REQUESTS];
    return memoryCache;
  }
}

export function saveDemoRequest(requestData) {
  const current = getDemoRequests();
  const newReq = {
    id: `demo-${Date.now()}`,
    request_type: requestData.request_type || 'self',
    representative_name: requestData.representative_name || '',
    representative_phone: requestData.representative_phone || '',
    representative_relation: requestData.representative_relation || '',
    age: requestData.age || '',
    assistance_category: requestData.assistance_category || 'ด้านสาธารณภัย',
    ...requestData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const updated = [newReq, ...current];
  memoryCache = updated;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('disaster_demo_requests', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }
  notifyListeners();
  return newReq;
}

export function updateDemoRequestStatus(id, newStatus, officerName, notes, officerSignatureUrl, officerPosition) {
  const current = getDemoRequests();
  let updatedItem = null;
  const updated = current.map(req => {
    if (req.id === id || req.request_number === id) {
      updatedItem = {
        ...req,
        status: newStatus,
        reviewed_by: officerName || req.reviewed_by || 'เจ้าหน้าที่ผู้รับเรื่อง',
        officer_position: officerPosition || req.officer_position || 'เจ้าหน้าที่ผู้รับคำขอ',
        review_notes: notes || req.review_notes,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (officerSignatureUrl) {
        updatedItem.officer_signature_url = officerSignatureUrl;
      }
      if (newStatus === 'approved') {
        updatedItem.approved_at = new Date().toISOString();
      }
      return updatedItem;
    }
    return req;
  });

  memoryCache = updated;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('disaster_demo_requests', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }
  notifyListeners();
  return updatedItem || updated.find(r => r.id === id || r.request_number === id);
}

export function updateDemoRequestData(id, patch) {
  const current = getDemoRequests();
  let updatedItem = null;
  const updated = current.map(req => {
    if (req.id === id || req.request_number === id) {
      updatedItem = {
        ...req,
        ...patch,
        updated_at: new Date().toISOString(),
      };
      return updatedItem;
    }
    return req;
  });

  memoryCache = updated;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('disaster_demo_requests', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }
  notifyListeners();
  return updatedItem || updated.find(r => r.id === id || r.request_number === id);
}

export function getDemoRequestById(id) {
  const current = getDemoRequests();
  return current.find(r => r.id === id || r.request_number === id);
}

export function deleteDemoRequest(id) {
  const current = getDemoRequests();
  const updated = current.filter(req => req.id !== id && req.request_number !== id);
  memoryCache = updated;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('disaster_demo_requests', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }
  notifyListeners();
  return { success: true };
}
