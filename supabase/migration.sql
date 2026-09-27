-- =====================================================
-- 🚨 Disaster Relief Request System
-- Supabase Database Migration
-- =====================================================

-- Create the requests table
CREATE TABLE IF NOT EXISTS requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT UNIQUE NOT NULL,
  
  -- Section 1: Incident Info
  disaster_type TEXT NOT NULL DEFAULT 'อุทกภัย',
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  urgency_level TEXT NOT NULL DEFAULT 'normal',
  estimated_damage NUMERIC DEFAULT 0,
  
  -- Section 2: Personal Info
  full_name TEXT NOT NULL,
  id_card_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  household_members INTEGER DEFAULT 1,
  
  -- Section 2: Address
  address TEXT NOT NULL,
  village TEXT,
  subdistrict TEXT,
  district TEXT NOT NULL,
  province TEXT NOT NULL,
  
  -- GPS Coordinates (optional - for rescue navigation)
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  
  -- Section 3: Assistance
  assistance_requested TEXT NOT NULL,
  officer_notes TEXT,
  
  -- Section 4: Signature & Attachments
  signature_url TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Status & Workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  reviewed_by TEXT,
  approved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_disaster_type ON requests(disaster_type);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_request_number ON requests(request_number);
CREATE INDEX IF NOT EXISTS idx_requests_province ON requests(province);

-- Enable Row Level Security (RLS)
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous read access (for public form checking)
CREATE POLICY "Allow public read" ON requests
  FOR SELECT USING (true);

-- Policy: Allow anonymous insert (for public form submission)
CREATE POLICY "Allow public insert" ON requests
  FOR INSERT WITH CHECK (true);

-- Policy: Allow anonymous update (for officer actions - in production, restrict this to authenticated officers)
CREATE POLICY "Allow public update" ON requests
  FOR UPDATE USING (true);

-- Policy: Allow anonymous delete (for superadmin delete - in production, restrict this to authenticated officers)
CREATE POLICY "Allow public delete" ON requests
  FOR DELETE USING (true);

-- Create a storage bucket for file attachments
-- *** รัน SQL นี้ใน Supabase SQL Editor ***
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request-files',
  'request-files',
  true,
  15728640,  -- 15MB limit
  ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf',
        'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
) ON CONFLICT (id) DO NOTHING;

-- Storage policy: ทุกคนอ่านได้ (public bucket)
CREATE POLICY "Public read storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'request-files');

-- Storage policy: อนุญาต upload
CREATE POLICY "Public upload storage" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'request-files');

-- Storage policy: อนุญาต delete (สำหรับ admin)
CREATE POLICY "Public delete storage" ON storage.objects
  FOR DELETE USING (bucket_id = 'request-files');

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_requests_updated_at ON requests;
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 🗺️ GPS Migration: เพิ่มคอลัมน์พิกัด GPS (รันเฉพาะถ้า Table มีอยู่แล้ว)
-- =====================================================
ALTER TABLE requests ADD COLUMN IF NOT EXISTS gps_lat DOUBLE PRECISION;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS gps_lng DOUBLE PRECISION;

COMMENT ON COLUMN requests.gps_lat IS 'Latitude พิกัด GPS ของบ้านผู้ประสบภัย (ไม่บังคับ)';
COMMENT ON COLUMN requests.gps_lng IS 'Longitude พิกัด GPS ของบ้านผู้ประสบภัย (ไม่บังคับ)';

-- Index สำหรับ query ตามพิกัด GPS (ถ้าต้องการค้นหาในรัศมี)
CREATE INDEX IF NOT EXISTS idx_requests_gps ON requests(gps_lat, gps_lng) WHERE gps_lat IS NOT NULL;

-- =====================================================
-- Sample data for testing (optional - remove in production)
-- =====================================================
INSERT INTO requests (request_number, disaster_type, incident_date, urgency_level, estimated_damage, full_name, id_card_number, phone, household_members, address, village, subdistrict, district, province, gps_lat, gps_lng, assistance_requested, officer_notes, status, created_at) VALUES
('REQ-20260927-0001', 'อุทกภัย', '2026-09-25', 'urgent', 150000, 'สมชาย ใจดี', '1234567890123', '081-234-5678', 4, '123/45 ม.6', 'บ้านสวน', 'ท่าศาลา', 'เมืองนครศรีธรรมราช', 'นครศรีธรรมราช', 8.4304, 99.9634, 'ถุงยังชีพ น้ำดื่ม วัสดุซ่อมแซมบ้าน', 'บ้านได้รับความเสียหายจากน้ำท่วมสูง 1.5 เมตร', 'pending', NOW() - INTERVAL '2 days'),
('REQ-20260927-0002', 'วาตภัย', '2026-09-24', 'high', 80000, 'สมหญิง รักไทย', '9876543210987', '089-876-5432', 3, '78/9 ม.2', 'บ้านทุ่ง', 'ปากพูน', 'เมืองนครศรีธรรมราช', 'นครศรีธรรมราช', 8.4250, 99.9580, 'วัสดุมุงหลังคา แผ่นสังกะสี', NULL, 'reviewing', NOW() - INTERVAL '1 day'),
('REQ-20260927-0003', 'อัคคีภัย', '2026-09-23', 'urgent', 500000, 'ประยุทธ์ มั่นคง', '1122334455667', '062-345-6789', 5, '456 ซ.3', NULL, 'คลัง', 'เมืองนครศรีธรรมราช', 'นครศรีธรรมราช', NULL, NULL, 'เงินช่วยเหลือ ที่พักชั่วคราว เครื่องนุ่งห่ม', 'ไฟไหม้บ้านทั้งหลัง ต้องการความช่วยเหลือเร่งด่วน', 'approved', NOW() - INTERVAL '5 days');
