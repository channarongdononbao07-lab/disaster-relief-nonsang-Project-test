'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getDemoRequests, subscribeDemoRequests, INITIAL_DEMO_REQUESTS } from '../../lib/demoStore';
import { useToast } from '../../components/Toast';

// ===== ประเภทภัย =====
export const DISASTER_TYPES = [
  { key: 'อุทกภัย', icon: '🌊' },
  { key: 'วาตภัย', icon: '🌪️' },
  { key: 'อัคคีภัย', icon: '🔥' },
  { key: 'ภัยแล้ง', icon: '☀️' },
  { key: 'ดินโคลนถล่ม', icon: '🪨' },
  { key: 'แผ่นดินไหว', icon: '🏚️' },
  { key: 'ภัยจากพายุ', icon: '⛈️' },
  { key: 'ภัยหนาว', icon: '❄️' },
  { key: 'อื่นๆ', icon: '⚠️' },
];

const TYPE_ICON = DISASTER_TYPES.reduce((acc, t) => ({ ...acc, [t.key]: t.icon }), {});

const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

// ===== ระดับความถี่ (ต่อคน / ต่อประเภทภัย / ในรอบปี) =====
// เหลือง = 1 ครั้งขึ้นไป, ส้ม = 3 ครั้งขึ้นไป, แดง = 5 ครั้งขึ้นไป
export const FREQ_LEVELS = {
  red: { key: 'red', label: 'แดง', min: 5, desc: '5 ครั้งขึ้นไป' },
  orange: { key: 'orange', label: 'ส้ม', min: 3, desc: '3–4 ครั้ง' },
  yellow: { key: 'yellow', label: 'เหลือง', min: 1, desc: '1–2 ครั้ง' },
};

export function getFrequencyLevel(count) {
  if (count >= FREQ_LEVELS.red.min) return 'red';
  if (count >= FREQ_LEVELS.orange.min) return 'orange';
  if (count >= FREQ_LEVELS.yellow.min) return 'yellow';
  return null;
}

const LEVEL_RANK = { red: 3, orange: 2, yellow: 1 };

// ตัดอีโมจิด้านหน้าออก เช่น "🌊 อุทกภัย" -> "อุทกภัย"
export function normalizeDisasterType(type) {
  if (!type) return 'อื่นๆ';
  const clean = String(type).replace(/^[^\u0E00-\u0E7Fa-zA-Z]+/, '').trim();
  return TYPE_ICON[clean] ? clean : clean || 'อื่นๆ';
}

// ใช้เลขบัตรประชาชน (เฉพาะตัวเลข) เป็นตัวระบุบุคคล ถ้าไม่มีใช้ชื่อแทน
function getPersonKey(r) {
  const idDigits = String(r.id_card_number || '').replace(/\D/g, '');
  if (idDigits.length >= 6) return `id:${idDigits}`;
  return `name:${String(r.full_name || '').replace(/\s+/g, ' ').trim()}`;
}

function getRequestDate(r) {
  const d = new Date(r.incident_date || r.created_at);
  return isNaN(d.getTime()) ? new Date(r.created_at) : d;
}

function maskIdCard(id) {
  const digits = String(id || '').replace(/\D/g, '');
  if (digits.length < 4) return '-';
  return `x-xxxx-xxxxx-${digits.slice(-3, -1)}-${digits.slice(-1)}`;
}

export default function StatisticsPage({ onNavigate, officerUser }) {
  const { showToast } = useToast();
  const [requests, setRequests] = useState(() => INITIAL_DEMO_REQUESTS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [typeFilter, setTypeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPerson, setExpandedPerson] = useState(null);
  const toastRef = useRef(showToast);
  toastRef.current = showToast;

  const loadRequests = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setRequests(getDemoRequests());
      return;
    }
    setIsRefreshing(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      // ดึงเฉพาะปีที่เลือก (ใช้ index idx_requests_incident_date)
      // แบ่งหน้าละ 1,000 แถว เพราะ Supabase จำกัดสูงสุด 1,000 แถวต่อ request
      const PAGE = 1000;
      const MAX_ROWS = 50000;
      const y = Number(selectedYear);
      let all = [];
      for (let from = 0; from < MAX_ROWS; from += PAGE) {
        const { data, error } = await supabase
          .from('requests')
          .select('id, request_number, full_name, id_card_number, phone, disaster_type, incident_date, village, subdistrict, district, province, status, created_at')
          .gte('incident_date', `${y}-01-01`)
          .lte('incident_date', `${y}-12-31`)
          .order('incident_date', { ascending: true })
          .order('id', { ascending: true })
          .range(from, from + PAGE - 1)
          .abortSignal(controller.signal);
        if (error) throw error;
        all = all.concat(data || []);
        if (!data || data.length < PAGE) break;
      }
      setRequests(all);
    } catch (e) {
      setRequests(getDemoRequests());
      toastRef.current('โหลดข้อมูลไม่สำเร็จ', 'แสดงข้อมูลจากแคชในเครื่องแทน', 'error');
    } finally {
      clearTimeout(timeoutId);
      setIsRefreshing(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    // Demo mode: อัปเดตทันทีเมื่อมีคำร้องใหม่ในเครื่อง
    if (isSupabaseConfigured) return;
    const unsubscribe = subscribeDemoRequests((updated) => setRequests(updated));
    return () => unsubscribe();
  }, []);

  // ปีให้เลือก: ย้อนหลัง 5 ปี + ปีที่พบในข้อมูล
  const availableYears = useMemo(() => {
    const now = new Date().getFullYear();
    const years = new Set(Array.from({ length: 6 }, (_, i) => now - i));
    years.add(Number(selectedYear));
    requests.forEach((r) => years.add(getRequestDate(r).getFullYear()));
    return [...years].filter((y) => !isNaN(y)).sort((a, b) => b - a);
  }, [requests, selectedYear]);

  // คำร้องในปีที่เลือก
  const yearRequests = useMemo(
    () => requests.filter((r) => getRequestDate(r).getFullYear() === Number(selectedYear)),
    [requests, selectedYear]
  );

  // ===== สรุปรายบุคคล แยกตามประเภทภัย =====
  const personStats = useMemo(() => {
    const map = new Map();
    yearRequests.forEach((r) => {
      const key = getPersonKey(r);
      const type = normalizeDisasterType(r.disaster_type);
      if (!map.has(key)) {
        map.set(key, {
          key,
          full_name: r.full_name,
          id_card_number: r.id_card_number,
          phone: r.phone,
          location: [r.village, r.subdistrict, r.district].filter(Boolean).join(', '),
          total: 0,
          byType: {},
        });
      }
      const p = map.get(key);
      p.total += 1;
      if (!p.byType[type]) p.byType[type] = { count: 0, requests: [] };
      p.byType[type].count += 1;
      p.byType[type].requests.push(r);
    });

    return [...map.values()]
      .map((p) => {
        let maxLevel = null;
        Object.entries(p.byType).forEach(([, v]) => {
          v.level = getFrequencyLevel(v.count);
          v.requests.sort((a, b) => getRequestDate(a) - getRequestDate(b));
          if (!maxLevel || LEVEL_RANK[v.level] > LEVEL_RANK[maxLevel]) maxLevel = v.level;
        });
        return { ...p, maxLevel };
      })
      .sort((a, b) => (LEVEL_RANK[b.maxLevel] || 0) - (LEVEL_RANK[a.maxLevel] || 0) || b.total - a.total);
  }, [yearRequests]);

  // ===== สรุปรายประเภทภัย =====
  const typeSummary = useMemo(() => {
    const summary = {};
    DISASTER_TYPES.forEach((t) => {
      summary[t.key] = { key: t.key, icon: t.icon, total: 0, persons: 0, red: 0, orange: 0, yellow: 0 };
    });
    personStats.forEach((p) => {
      Object.entries(p.byType).forEach(([type, v]) => {
        if (!summary[type]) summary[type] = { key: type, icon: '⚠️', total: 0, persons: 0, red: 0, orange: 0, yellow: 0 };
        summary[type].total += v.count;
        summary[type].persons += 1;
        summary[type][v.level] += 1;
      });
    });
    return Object.values(summary).sort((a, b) => b.total - a.total);
  }, [personStats]);

  const levelTotals = useMemo(() => {
    const t = { red: 0, orange: 0, yellow: 0 };
    personStats.forEach((p) => {
      Object.values(p.byType).forEach((v) => { t[v.level] += 1; });
    });
    return t;
  }, [personStats]);

  // ===== รายเดือน =====
  const monthly = useMemo(() => {
    const months = Array.from({ length: 12 }, () => ({ total: 0, byType: {} }));
    yearRequests.forEach((r) => {
      const m = getRequestDate(r).getMonth();
      const type = normalizeDisasterType(r.disaster_type);
      months[m].total += 1;
      months[m].byType[type] = (months[m].byType[type] || 0) + 1;
    });
    return months;
  }, [yearRequests]);
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.total));

  // ===== กรองรายชื่อ =====
  const filteredPersons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return personStats.filter((p) => {
      if (q && !(p.full_name || '').toLowerCase().includes(q) && !String(p.id_card_number || '').includes(q)) return false;
      const entries = Object.entries(p.byType).filter(([type]) => typeFilter === 'all' || type === typeFilter);
      if (entries.length === 0) return false;
      if (levelFilter !== 'all' && !entries.some(([, v]) => v.level === levelFilter)) return false;
      return true;
    });
  }, [personStats, searchQuery, typeFilter, levelFilter]);

  const exportCSV = () => {
    if (filteredPersons.length === 0) {
      showToast('ไม่สามารถส่งออกข้อมูล', 'ไม่มีข้อมูลสำหรับ Export', 'error');
      return;
    }
    const headers = ['ชื่อผู้ยื่น', 'เลขบัตรประชาชน', 'โทรศัพท์', 'พื้นที่', 'ประเภทภัย', 'จำนวนครั้ง', 'ระดับ', 'วันที่เกิดเหตุ'];
    const rows = [];
    filteredPersons.forEach((p) => {
      Object.entries(p.byType)
        .filter(([type]) => typeFilter === 'all' || type === typeFilter)
        .forEach(([type, v]) => {
          rows.push([
            p.full_name || '',
            p.id_card_number || '',
            p.phone || '',
            p.location || '',
            type,
            v.count,
            FREQ_LEVELS[v.level].label,
            v.requests.map((r) => getRequestDate(r).toLocaleDateString('th-TH')).join(' / '),
          ]);
        });
    });
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frequency_report_${Number(selectedYear) + 543}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ดาวน์โหลด CSV', 'ส่งออกรายงานความถี่เรียบร้อยแล้ว', 'success');
  };

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-badge">
          <span className="badge-dot" style={{ background: '#FBBF24' }}></span>
          รายงานสถิติ
        </div>
        <h1>สถิติการเกิดเหตุ</h1>
        <p>ความถี่การยื่นคำร้องรายบุคคล แยกตามประเภทภัย ในรอบปี พ.ศ. {Number(selectedYear) + 543}</p>
      </div>

      {/* Year + Legend */}
      <div className="card" style={{ marginTop: -16, position: 'relative', zIndex: 10 }}>
        <div className="stat-toolbar">
          <label htmlFor="stat-year" className="stat-toolbar-label">ปีงบ / รอบปี</label>
          <select
            id="stat-year"
            className="form-select"
            value={selectedYear}
            onChange={(e) => { setSelectedYear(Number(e.target.value)); setExpandedPerson(null); }}
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>พ.ศ. {y + 543}</option>
            ))}
          </select>
          <button className="export-btn" onClick={loadRequests} id="stat-refresh-btn" title="รีเฟรชข้อมูล">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
            {isRefreshing ? 'ซิงค์...' : 'รีเฟรช'}
          </button>
        </div>

        <div className="freq-legend">
          {['yellow', 'orange', 'red'].map((lv) => (
            <button
              key={lv}
              type="button"
              className={`freq-legend-item freq-${lv} ${levelFilter === lv ? 'active' : ''}`}
              onClick={() => setLevelFilter(levelFilter === lv ? 'all' : lv)}
              id={`legend-${lv}`}
              title="กดเพื่อกรองตามระดับ"
            >
              <span className="freq-dot"></span>
              <span className="freq-legend-text">
                <strong>{FREQ_LEVELS[lv].label}</strong>
                <small>{FREQ_LEVELS[lv].desc}/ปี</small>
              </span>
              <span className="freq-legend-count">{levelTotals[lv]}</span>
            </button>
          ))}
        </div>
        <p className="freq-note">
          * นับจำนวนครั้งที่บุคคลเดียวกันยื่นคำร้อง <strong>ในประเภทภัยเดียวกัน</strong> ภายในปีที่เลือก (ตัวเลขด้านขวา = จำนวนรายการบุคคล×ประเภทภัย)
        </p>
      </div>

      {/* Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon teal">📄</div>
          <div className="stat-value">{yearRequests.length}</div>
          <div className="stat-label">คำร้องในปีนี้</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div className="stat-value">{personStats.length}</div>
          <div className="stat-label">ผู้ยื่นคำร้อง (คน)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">🔁</div>
          <div className="stat-value">{personStats.filter((p) => p.total > 1).length}</div>
          <div className="stat-label">ยื่นซ้ำมากกว่า 1 ครั้ง</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-50)', color: 'var(--danger-600)' }}>🚨</div>
          <div className="stat-value" style={{ color: 'var(--danger-600)' }}>{levelTotals.red}</div>
          <div className="stat-label">ระดับแดง (5+ ครั้ง)</div>
        </div>
      </div>

      {/* By Disaster Type */}
      <div className="card">
        <div className="card-title">📊 สรุปแยกตามประเภทภัย</div>
        <div className="type-stat-grid">
          {typeSummary.map((t) => (
            <button
              type="button"
              key={t.key}
              className={`type-stat-card ${typeFilter === t.key ? 'active' : ''} ${t.total === 0 ? 'empty' : ''}`}
              onClick={() => setTypeFilter(typeFilter === t.key ? 'all' : t.key)}
              id={`type-stat-${t.key}`}
            >
              <div className="type-stat-head">
                <span className="type-stat-icon">{t.icon}</span>
                <span className="type-stat-name">{t.key}</span>
              </div>
              <div className="type-stat-total">
                {t.total} <small>ครั้ง</small>
              </div>
              <div className="type-stat-sub">{t.persons} คน</div>
              <div className="type-stat-levels">
                <span className="lv-chip freq-yellow" title="เหลือง">{t.yellow}</span>
                <span className="lv-chip freq-orange" title="ส้ม">{t.orange}</span>
                <span className="lv-chip freq-red" title="แดง">{t.red}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Monthly chart */}
      <div className="card">
        <div className="card-title">📅 จำนวนคำร้องรายเดือน (พ.ศ. {Number(selectedYear) + 543})</div>
        <div className="month-chart">
          {monthly.map((m, i) => {
            const val = typeFilter === 'all' ? m.total : (m.byType[typeFilter] || 0);
            return (
              <div className="month-col" key={i} title={`${MONTHS_TH[i]}: ${val} คำร้อง`}>
                <span className="month-val">{val || ''}</span>
                <div className="month-bar-wrap">
                  <div
                    className={`month-bar freq-bg-${getFrequencyLevel(val) || 'none'}`}
                    style={{ height: `${(val / maxMonthly) * 100}%` }}
                  ></div>
                </div>
                <span className="month-label">{MONTHS_TH[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Person frequency list */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gray-900)' }}>👤 ความถี่การยื่นคำร้องรายบุคคล</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--gray-500)' }}>พบ {filteredPersons.length} คน</p>
          </div>
          {officerUser && (
            <button className="export-btn" onClick={exportCSV} id="stat-export-csv-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
              CSV
            </button>
          )}
        </div>

        <div className="search-container">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <input
            type="search"
            className="search-input"
            placeholder="ค้นหาชื่อ หรือเลขบัตรประชาชน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="stat-search-input"
          />
        </div>
        <div className="filter-row">
          <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} id="stat-filter-type">
            <option value="all">ทุกประเภทภัย</option>
            {DISASTER_TYPES.map((t) => <option key={t.key} value={t.key}>{t.icon} {t.key}</option>)}
          </select>
          <select className="form-select" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} id="stat-filter-level">
            <option value="all">ทุกระดับ</option>
            <option value="yellow">🟡 เหลือง (1–2 ครั้ง)</option>
            <option value="orange">🟠 ส้ม (3–4 ครั้ง)</option>
            <option value="red">🔴 แดง (5+ ครั้ง)</option>
          </select>
        </div>

        <div style={{ marginTop: 16 }}>
          {filteredPersons.length === 0 ? (
            <div className="empty-state">
              <h3>ไม่พบข้อมูล</h3>
              <p>ไม่มีการยื่นคำร้องตามเงื่อนไขในปีที่เลือก</p>
            </div>
          ) : (
            filteredPersons.map((p) => {
              const entries = Object.entries(p.byType)
                .filter(([type]) => typeFilter === 'all' || type === typeFilter)
                .sort((a, b) => b[1].count - a[1].count);
              const isOpen = expandedPerson === p.key;
              return (
                <div key={p.key} className={`person-freq-card border-${p.maxLevel}`}>
                  <button
                    type="button"
                    className="person-freq-head"
                    onClick={() => setExpandedPerson(isOpen ? null : p.key)}
                    id={`person-${p.key}`}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div className="person-freq-name">{p.full_name}</div>
                      <div className="person-freq-meta">
                        🪪 {officerUser ? (p.id_card_number || '-') : maskIdCard(p.id_card_number)}
                        {p.location && <> · 📍 {p.location}</>}
                      </div>
                    </div>
                    <div className="person-freq-total">
                      <strong>{p.total}</strong>
                      <small>ครั้ง</small>
                    </div>
                  </button>

                  <div className="person-freq-chips">
                    {entries.map(([type, v]) => (
                      <span key={type} className={`freq-chip freq-${v.level}`}>
                        {TYPE_ICON[type] || '⚠️'} {type}
                        <b>{v.count}</b>
                      </span>
                    ))}
                  </div>

                  {isOpen && (
                    <div className="person-freq-detail">
                      {entries.map(([type, v]) => (
                        <div key={type} className="person-freq-type">
                          <div className="person-freq-type-title">
                            <span className={`freq-dot-sm freq-bg-${v.level}`}></span>
                            {TYPE_ICON[type] || '⚠️'} {type} — {v.count} ครั้ง (ระดับ{FREQ_LEVELS[v.level].label})
                          </div>
                          <ul>
                            {v.requests.map((r, idx) => (
                              <li key={r.id}>
                                <span className="timeline-no">ครั้งที่ {idx + 1}</span>
                                <span>{getRequestDate(r).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                <a onClick={() => onNavigate('request-detail', r.id)} className="timeline-link">
                                  {r.request_number} →
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={{ height: 40 }}></div>
    </>
  );
}
