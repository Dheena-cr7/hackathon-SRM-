// CampusOps Zero-Cost Intelligent Operations API Client

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export interface UserPreset {
  id: string;
  name: string;
  email: string;
  role: string;
  password?: string;
  department?: string;
}

// Authorized institutional account directory for verification
export const AUTHORIZED_ACCOUNTS: UserPreset[] = [
  {
    id: 'user-admin-fac',
    name: 'Karthik R.',
    email: 'admin.facilities@campus.edu',
    role: 'facilities_admin',
    department: 'Campus Operations',
  },
  {
    id: 'user-tech-rajesh',
    name: 'Rajesh Kumar',
    email: 'tech.rajesh@campus.edu',
    role: 'technician',
    department: 'Facilities Electrical',
  },
  {
    id: 'user-tech-ananya',
    name: 'Ananya Verma',
    email: 'tech.ananya@campus.edu',
    role: 'technician',
    department: 'Facilities Operations',
  },
  {
    id: 'user-mgr-raman',
    name: 'Dr. Raman',
    email: 'manager@campus.edu',
    role: 'dept_manager',
    department: 'Computer Science & Engineering',
  },
  {
    id: 'user-appr-sunita',
    name: 'Sunita Mehra',
    email: 'approver.finance@campus.edu',
    role: 'procurement_approver',
    department: 'Finance & Procurement',
  },
  {
    id: 'user-student-aarav',
    name: 'Aarav Patel',
    email: 'student@campus.edu',
    role: 'student',
    department: 'Computer Science',
  },
  {
    id: 'user-faculty-sharma',
    name: 'Prof. Sharma',
    email: 'faculty@campus.edu',
    role: 'faculty',
    department: 'Computer Science & Engineering',
  },
  {
    id: 'user-sysadmin',
    name: 'DevOps Admin',
    email: 'sysadmin@campus.edu',
    role: 'system_admin',
    department: 'IT Infrastructure',
  },
];

// Alias for backwards compatibility if referenced
export const PRESET_USERS = AUTHORIZED_ACCOUNTS;

let currentToken: string | null = null;

export function getActiveUser(): UserPreset | null {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('campusops_user');
    const token = localStorage.getItem('campusops_token');
    if (saved && token) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function isAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('campusops_user');
    const token = localStorage.getItem('campusops_token');
    return !!(saved && token);
  }
  return false;
}

export function setActiveUser(user: UserPreset, token?: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('campusops_user', JSON.stringify(user));
    if (token) {
      currentToken = token;
      localStorage.setItem('campusops_token', token);
    }
  }
}

export async function loginAs(user: UserPreset): Promise<string> {
  // Kept for backward compatibility or testing
  const password = user.password || (user.email.includes('admin.fac') ? 'admin123' : user.email.includes('sysadmin') ? 'sysadmin123' : user.email.includes('tech') ? 'tech123' : user.email.includes('manager') ? 'manager123' : user.email.includes('approver') ? 'approver123' : user.email.includes('faculty') ? 'faculty123' : 'student123');
  const logged = await loginWithCredentials(user.email, password);
  return localStorage.getItem('campusops_token') || '';
}

/**
 * Authentic credential authentication against backend database pool.
 * Only if the email and password match in the database, entrance is granted.
 */
export async function loginWithCredentials(email: string, password: string): Promise<UserPreset> {
  const cleanEmail = email.trim().toLowerCase();
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail, password }),
  });

  if (!res.ok) {
    let errDetail = 'Invalid institutional email or password. Access denied.';
    try {
      const errData = await res.json();
      if (errData.detail) errDetail = errData.detail;
    } catch {
      // fallback
    }
    throw new Error(errDetail);
  }

  const data = await res.json();
  const userData = data.user;
  
  const matchedPreset = AUTHORIZED_ACCOUNTS.find(u => u.email.toLowerCase() === cleanEmail);

  const authenticatedUser: UserPreset = {
    id: userData?.id || matchedPreset?.id || 'usr-' + Date.now(),
    name: userData?.full_name || matchedPreset?.name || cleanEmail.split('@')[0],
    email: userData?.email || cleanEmail,
    role: userData?.role || matchedPreset?.role || 'student',
    department: userData?.department || matchedPreset?.department || 'Campus Operations',
  };

  setActiveUser(authenticatedUser, data.access_token);
  return authenticatedUser;
}

export function logoutUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('campusops_token');
    localStorage.removeItem('campusops_user');
  }
  currentToken = null;
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
  let token = currentToken;
  if (typeof window !== 'undefined' && !token) {
    token = localStorage.getItem('campusops_token');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If token expired, clear session
    logoutUser();
  }

  if (!response.ok) {
    let errMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errMessage = errorData.detail || errorData.message || errMessage;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errMessage);
  }

  return response.json();
}
