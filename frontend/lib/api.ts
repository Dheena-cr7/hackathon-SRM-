// CampusOps Zero-Cost Intelligent Operations API Client

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export interface UserPreset {
  id: string;
  name: string;
  email: string;
  role: string;
  password: string;
}

export const PRESET_USERS: UserPreset[] = [
  {
    id: 'user-admin-fac',
    name: 'Karthik R.',
    email: 'admin.facilities@campus.edu',
    role: 'facilities_admin',
    password: 'admin123',
  },
  {
    id: 'user-tech-rajesh',
    name: 'Rajesh Kumar',
    email: 'tech.rajesh@campus.edu',
    role: 'technician',
    password: 'tech123',
  },
  {
    id: 'user-tech-ananya',
    name: 'Ananya Verma',
    email: 'tech.ananya@campus.edu',
    role: 'technician',
    password: 'tech123',
  },
  {
    id: 'user-mgr-raman',
    name: 'Dr. Raman',
    email: 'manager@campus.edu',
    role: 'dept_manager',
    password: 'manager123',
  },
  {
    id: 'user-appr-sunita',
    name: 'Sunita Mehra',
    email: 'approver.finance@campus.edu',
    role: 'procurement_approver',
    password: 'approver123',
  },
  {
    id: 'user-student-aarav',
    name: 'Aarav Patel',
    email: 'student@campus.edu',
    role: 'student',
    password: 'student123',
  },
  {
    id: 'user-sysadmin',
    name: 'DevOps Admin',
    email: 'sysadmin@campus.edu',
    role: 'system_admin',
    password: 'sysadmin123',
  },
];

let currentToken: string | null = null;
let currentUser: UserPreset = PRESET_USERS[0];

export function getActiveUser(): UserPreset {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('campusops_user');
    if (saved) {
      try {
        currentUser = JSON.parse(saved);
      } catch {
        // default
      }
    }
  }
  return currentUser;
}

export function setActiveUser(user: UserPreset, token?: string) {
  currentUser = user;
  if (typeof window !== 'undefined') {
    localStorage.setItem('campusops_user', JSON.stringify(user));
    if (token) {
      currentToken = token;
      localStorage.setItem('campusops_token', token);
    }
  }
}

export async function loginAs(user: UserPreset): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password }),
    });
    if (!res.ok) {
      throw new Error(`Login failed: ${res.statusText}`);
    }
    const data = await res.json();
    setActiveUser(user, data.access_token);
    return data.access_token;
  } catch (err) {
    console.error('Login error:', err);
    throw err;
  }
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
  let token = currentToken;
  if (typeof window !== 'undefined' && !token) {
    token = localStorage.getItem('campusops_token');
  }

  // If no token exists, auto-login as current active user
  if (!token) {
    const active = getActiveUser();
    token = await loginAs(active);
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has('Authorization') && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Retry login once
    const active = getActiveUser();
    const freshToken = await loginAs(active);
    headers.set('Authorization', `Bearer ${freshToken}`);
    const retryRes = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    if (!retryRes.ok) {
      const errData = await retryRes.json().catch(() => ({}));
      throw new Error(errData.detail || `Request failed with status ${retryRes.status}`);
    }
    return retryRes.json();
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

