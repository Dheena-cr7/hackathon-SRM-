/**
 * CampusOps — Hierarchical Role-Based Access Control (RBAC) Architecture
 *
 * Defines logical permissions across the platform:
 * 1. System Administrator (system_admin): Unrestricted access to all features, telemetry, settings & overrides.
 * 2. Facilities Administrator (facilities_admin): Full operations management (incidents, dispatch, bookings, inventory oversight).
 * 3. Department Manager (dept_manager): Room bookings, classroom relocation, incident tracking & purchase requests.
 * 4. Procurement Approver (procurement_approver): Inventory catalog, stock verification & requisition approvals.
 * 5. Field Technician (technician): Work orders dispatch queue, field notes, parts reservation & status updates.
 * 6. Student / Faculty (student / faculty): Make complaints (Intake) and track complaint progress (Incidents). No inventory, no work orders, no room bookings.
 */

export interface RoleHierarchyDef {
  role: string;
  label: string;
  level: number;
  color: string;
  badgeBg: string;
  description: string;
  allowedPaths: string[];
  features: {
    canMakeComplaints: boolean;
    canViewComplaintProgress: boolean;
    canTriageIncidents: boolean;
    canDispatchWorkOrders: boolean;
    canExecuteWorkOrders: boolean;
    canManageBookings: boolean;
    canViewInventory: boolean;
    canApproveProcurement: boolean;
    canViewExecutiveDashboard: boolean;
    canManageSystemSettings: boolean;
  };
}

export const ROLE_HIERARCHY: Record<string, RoleHierarchyDef> = {
  system_admin: {
    role: 'system_admin',
    label: 'System Administrator',
    level: 5,
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'Master system administrator with unrestricted clearance to all settings, analytics, logs and features.',
    allowedPaths: ['/', '/intake', '/command-center', '/incidents', '/work-orders', '/bookings', '/inventory'],
    features: {
      canMakeComplaints: true,
      canViewComplaintProgress: true,
      canTriageIncidents: true,
      canDispatchWorkOrders: true,
      canExecuteWorkOrders: true,
      canManageBookings: true,
      canViewInventory: true,
      canApproveProcurement: true,
      canViewExecutiveDashboard: true,
      canManageSystemSettings: true,
    },
  },
  facilities_admin: {
    role: 'facilities_admin',
    label: 'Facilities Administrator',
    level: 4,
    color: 'text-blue-400',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    description: 'Operations Director: triage, technician dispatch, classroom relocations, and inventory reservation.',
    allowedPaths: ['/', '/intake', '/command-center', '/incidents', '/work-orders', '/bookings', '/inventory'],
    features: {
      canMakeComplaints: true,
      canViewComplaintProgress: true,
      canTriageIncidents: true,
      canDispatchWorkOrders: true,
      canExecuteWorkOrders: true,
      canManageBookings: true,
      canViewInventory: true,
      canApproveProcurement: false, // Separation of duties
      canViewExecutiveDashboard: true,
      canManageSystemSettings: false,
    },
  },
  dept_manager: {
    role: 'dept_manager',
    label: 'Department Manager',
    level: 3,
    color: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    description: 'Department oversight: room bookings, conflict management, incident tracking, and purchase requests.',
    allowedPaths: ['/', '/intake', '/command-center', '/incidents', '/bookings', '/inventory'],
    features: {
      canMakeComplaints: true,
      canViewComplaintProgress: true,
      canTriageIncidents: false,
      canDispatchWorkOrders: false,
      canExecuteWorkOrders: false,
      canManageBookings: true,
      canViewInventory: true,
      canApproveProcurement: false, // Cannot self-approve own requisitions
      canViewExecutiveDashboard: true,
      canManageSystemSettings: false,
    },
  },
  procurement_approver: {
    role: 'procurement_approver',
    label: 'Procurement Approver',
    level: 3,
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Finance authority: spare parts catalog, inventory levels, and requisition sign-offs.',
    allowedPaths: ['/', '/inventory', '/incidents'],
    features: {
      canMakeComplaints: true,
      canViewComplaintProgress: true,
      canTriageIncidents: false,
      canDispatchWorkOrders: false,
      canExecuteWorkOrders: false,
      canManageBookings: false,
      canViewInventory: true,
      canApproveProcurement: true,
      canViewExecutiveDashboard: true,
      canManageSystemSettings: false,
    },
  },
  technician: {
    role: 'technician',
    label: 'Field Technician',
    level: 2,
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Field operations: execute assigned work orders, update repair statuses, record notes & reserve parts.',
    allowedPaths: ['/work-orders', '/incidents', '/command-center', '/intake'],
    features: {
      canMakeComplaints: true,
      canViewComplaintProgress: true,
      canTriageIncidents: false,
      canDispatchWorkOrders: false,
      canExecuteWorkOrders: true,
      canManageBookings: false,
      canViewInventory: false,
      canApproveProcurement: false,
      canViewExecutiveDashboard: false,
      canManageSystemSettings: false,
    },
  },
  student: {
    role: 'student',
    label: 'Student',
    level: 1,
    color: 'text-sky-400',
    badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    description: 'Campus Resident: make complaints (Intake) and view complaint progress & status tracking.',
    allowedPaths: ['/intake', '/incidents', '/command-center'],
    features: {
      canMakeComplaints: true,
      canViewComplaintProgress: true,
      canTriageIncidents: false,
      canDispatchWorkOrders: false,
      canExecuteWorkOrders: false,
      canManageBookings: false,
      canViewInventory: false,
      canApproveProcurement: false,
      canViewExecutiveDashboard: false,
      canManageSystemSettings: false,
    },
  },
  faculty: {
    role: 'faculty',
    label: 'Faculty Member',
    level: 1,
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    description: 'Faculty: report classroom issues, track complaint resolution, and view campus status.',
    allowedPaths: ['/intake', '/incidents', '/command-center'],
    features: {
      canMakeComplaints: true,
      canViewComplaintProgress: true,
      canTriageIncidents: false,
      canDispatchWorkOrders: false,
      canExecuteWorkOrders: false,
      canManageBookings: false,
      canViewInventory: false,
      canApproveProcurement: false,
      canViewExecutiveDashboard: false,
      canManageSystemSettings: false,
    },
  },
};

/**
 * Checks if a specific role is authorized for a given pathname.
 */
export function isRouteAllowed(role: string | undefined | null, pathname: string): boolean {
  if (!role) return false;
  const normPath = pathname.split('?')[0];
  const roleDef = ROLE_HIERARCHY[role] || ROLE_HIERARCHY.student;
  
  // Super admin can access everything
  if (roleDef.level >= 5 || role === 'system_admin') return true;
  
  // Check exact match or prefix
  return roleDef.allowedPaths.some(p => p === normPath || (p !== '/' && normPath.startsWith(p)));
}

/**
 * Returns role definition or student default.
 */
export function getRoleDefinition(role: string | undefined | null): RoleHierarchyDef {
  if (!role) return ROLE_HIERARCHY.student;
  return ROLE_HIERARCHY[role] || ROLE_HIERARCHY.student;
}
