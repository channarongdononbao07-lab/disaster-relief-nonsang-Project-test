// User management store using localStorage
// Supports: superadmin, officer roles

const DEFAULT_USERS = [
  {
    id: 'superadmin-01',
    username: 'superadmin',
    password: 'super1234',
    name: 'ผู้ดูแลระบบ',
    role: 'superadmin',
    position: 'ผู้ดูแลระบบสูงสุด',
    department: 'ศูนย์เทคโนโลยีสารสนเทศ',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'officer-01',
    username: 'officer',
    password: '1234',
    name: 'นายสมชาย ปภ.',
    role: 'officer',
    position: 'เจ้าหน้าที่ปฏิบัติการ ปภ.',
    department: 'ศูนย์ป้องกันและบรรเทาสาธารณภัย',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'officer-02',
    username: 'admin',
    password: '1234',
    name: 'หัวหน้าศูนย์ ปภ. สมศักดิ์',
    role: 'officer',
    position: 'หัวหน้าฝ่ายป้องกันและบรรเทาสาธารณภัย',
    department: 'ศูนย์ป้องกันและบรรเทาสาธารณภัย',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const STORAGE_KEY = 'disaster_user_accounts';
let userMemoryCache = null;

function getUsers() {
  if (userMemoryCache) return userMemoryCache;
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      userMemoryCache = [...DEFAULT_USERS];
      return userMemoryCache;
    }
    userMemoryCache = JSON.parse(stored);
    return userMemoryCache;
  } catch {
    userMemoryCache = [...DEFAULT_USERS];
    return userMemoryCache;
  }
}

function saveUsers(users) {
  userMemoryCache = users;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }
}


export function authenticateUser(username, password) {
  const users = getUsers();
  const user = users.find(
    (u) => u.username === username && u.password === password && u.active
  );
  if (!user) return null;
  // Return user data without password
  const { password: _, ...safeUser } = user;
  return safeUser;
}

export function getAllUsers() {
  const users = getUsers();
  // Return without passwords
  return users.map(({ password, ...rest }) => rest);
}

export function getOfficerUsers() {
  return getAllUsers().filter((u) => u.role === 'officer' && u.active);
}

export function addUser({ username, password, name, role, position, department }) {
  const users = getUsers();
  // Check duplicate username
  if (users.find((u) => u.username === username)) {
    return { success: false, error: 'ชื่อผู้ใช้งานนี้มีอยู่แล้ว' };
  }
  const newUser = {
    id: `user-${Date.now()}`,
    username,
    password,
    name,
    role: role || 'officer',
    position: position || 'เจ้าหน้าที่',
    department: department || 'ศูนย์ป้องกันและบรรเทาสาธารณภัย',
    active: true,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  const { password: _, ...safeUser } = newUser;
  return { success: true, user: safeUser };
}

export function updateUser(userId, updates) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return { success: false, error: 'ไม่พบผู้ใช้งาน' };
  // Prevent editing superadmin role
  if (users[idx].role === 'superadmin' && updates.role && updates.role !== 'superadmin') {
    return { success: false, error: 'ไม่สามารถเปลี่ยน role ของ superadmin ได้' };
  }
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  return { success: true };
}

export function deleteUser(userId) {
  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return { success: false, error: 'ไม่พบผู้ใช้งาน' };
  if (user.role === 'superadmin') {
    return { success: false, error: 'ไม่สามารถลบบัญชี superadmin ได้' };
  }
  const filtered = users.filter((u) => u.id !== userId);
  saveUsers(filtered);
  return { success: true };
}

export function toggleUserActive(userId) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return { success: false, error: 'ไม่พบผู้ใช้งาน' };
  if (users[idx].role === 'superadmin') {
    return { success: false, error: 'ไม่สามารถปิดการใช้งาน superadmin ได้' };
  }
  users[idx].active = !users[idx].active;
  saveUsers(users);
  return { success: true, active: users[idx].active };
}
