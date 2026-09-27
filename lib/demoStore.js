// In-memory + LocalStorage store for Demo mode before Supabase credentials are configured

export const INITIAL_DEMO_REQUESTS = [
  {
    id: 'demo-1',
    request_number: 'REQ-20260927-1001',
    disaster_type: 'อุทกภัย',
    incident_date: '2026-09-25',
    urgency_level: 'urgent',
    estimated_damage: 55000,
    full_name: 'นายสมศักดิ์ รักชาติ',
    id_card_number: '1-1002-00304-05-1',
    phone: '081-234-5678',
    household_members: 4,
    address: '45/12 หมู่ 3',
    village: 'บ้านบางพลีใหญ่',
    subdistrict: 'บางพลีใหญ่',
    district: 'บางพลี',
    province: 'สมุทรปราการ',
    assistance_requested: 'ขอรับถุงยังชีพ 2 ชุด, น้ำดื่ม 5 แพ็ค, เรือพลาสติกสำหรับเคลื่อนย้ายผู้สูงอายุ',
    officer_notes: 'น้ำท่วมสูงระดับเอว ผู้ยื่นคำร้องมีผู้ป่วยติดเตียงในบ้าน',
    status: 'pending',
    signature_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    attachments: [
      { name: 'รูปน้ำท่วมหน้าบ้าน.jpg', url: '#', size: 2450000 },
      { name: 'สำเนาทะเบียนบ้าน.pdf', url: '#', size: 1200000 }
    ],
    reviewed_at: null,
    reviewed_by: null,
    review_notes: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'demo-2',
    request_number: 'REQ-20260927-1002',
    disaster_type: 'วาตภัย',
    incident_date: '2026-09-24',
    urgency_level: 'high',
    estimated_damage: 120000,
    full_name: 'นางสาววิภาดา ดีเยี่ยม',
    id_card_number: '3-5001-00234-88-9',
    phone: '089-876-5432',
    household_members: 3,
    address: '88/4 ถนนสุเทพ',
    village: 'บ้านชลประทาน',
    subdistrict: 'สุเทพ',
    district: 'เมืองเชียงใหม่',
    province: 'เชียงใหม่',
    assistance_requested: 'สังกะสีมุงหลังคา 30 แผ่น, ไม้อัดซ่อมแซมผนังบ้าน, ถุงยังชีพ 1 ชุด',
    officer_notes: 'พายุลมกระโชกแรงพัดหลังคาบ้านเปิงทั้งหลัง',
    status: 'reviewing',
    signature_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    attachments: [
      { name: 'หลังคาพังเสียหาย.jpg', url: '#', size: 3100000 }
    ],
    reviewed_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    reviewed_by: 'เจ้าหน้าที่ นพดล',
    review_notes: 'ลงพื้นที่ถ่ายรูปเรียบร้อย อยู่ระหว่างประเมินงบซ่อมแซม',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'demo-3',
    request_number: 'REQ-20260927-1003',
    disaster_type: 'อัคคีภัย',
    incident_date: '2026-09-20',
    urgency_level: 'urgent',
    estimated_damage: 350000,
    full_name: 'นายประสิทธิ์ สุขใจ',
    id_card_number: '1-1299-00123-45-6',
    phone: '086-111-2233',
    household_members: 5,
    address: '12/9 ซอยวัดโบสถ์',
    village: 'ชุมชนตลาดขวัญ',
    subdistrict: 'บางกระสอ',
    district: 'เมืองนนทบุรี',
    province: 'นนทบุรี',
    assistance_requested: 'งบประมาณช่วยเหลือผู้ประสบอัคคีภัย, เครื่องอุปโภคบริโภค, ที่พักอาศัยชั่วคราว',
    officer_notes: 'ไฟลุกไหม้เสียหายทั้งหลัง ได้รับการช่วยเหลือเบื้องต้นจากมูลนิธิแล้ว',
    status: 'approved',
    signature_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    attachments: [
      { name: 'รายงานเหตุเพลิงไหม้.pdf', url: '#', size: 1800000 }
    ],
    reviewed_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    reviewed_by: 'หัวหน้าศูนย์ ปภ.',
    review_notes: 'อนุมัติการช่วยเหลือเยียวยากรณีบ้านเรือนเสียหายทั้งหลังตามระเบียบกระทรวงการคลัง',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
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

export function updateDemoRequestStatus(id, newStatus, officerName, notes) {
  const current = getDemoRequests();
  let updatedItem = null;
  const updated = current.map(req => {
    if (req.id === id || req.request_number === id) {
      updatedItem = {
        ...req,
        status: newStatus,
        reviewed_by: officerName || 'เจ้าหน้าที่ผู้รับเรื่อง',
        review_notes: notes || req.review_notes,
        reviewed_at: new Date().toISOString(),
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


