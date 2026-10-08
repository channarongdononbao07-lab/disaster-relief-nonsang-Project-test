-- =====================================================
-- 📊 Statistics Performance Indexes (v1.1)
-- รันใน Supabase SQL Editor ได้ทันที (ปลอดภัย รันซ้ำได้)
-- รองรับหน้า "รายงานสถิติ" เมื่อมีคำร้องหลายพัน-หลายหมื่นรายการ
-- =====================================================

-- กรองคำร้องตามปี (ช่วงวันที่เกิดเหตุ)
CREATE INDEX IF NOT EXISTS idx_requests_incident_date ON requests(incident_date);

-- จัดกลุ่ม/ค้นหาบุคคลตามเลขบัตรประชาชน
CREATE INDEX IF NOT EXISTS idx_requests_id_card ON requests(id_card_number);

-- นับความถี่: บุคคล + ประเภทภัย + วันที่ (ใช้ร่วมกันในรายงานความถี่)
CREATE INDEX IF NOT EXISTS idx_requests_person_type_date
  ON requests(id_card_number, disaster_type, incident_date);

-- อัปเดตสถิติของตารางให้ query planner เลือก index ได้ถูกต้อง
ANALYZE requests;
