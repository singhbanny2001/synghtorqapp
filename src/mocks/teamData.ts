import type { UserRole } from '@/context/AuthContext';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'invited' | 'inactive';
  assignedVehicleIds: string[];
  createdAt: string;
  avatar: string;
}

export const teamMembers: TeamMember[] = [
  {
    id: 'u1',
    name: 'Alex Johnson',
    email: 'alex@synghfleet.com',
    phone: '+1 (555) 123-4567',
    role: 'manager',
    status: 'active',
    assignedVehicleIds: ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'],
    createdAt: '2024-01-15',
    avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20portrait%20of%20a%20confident%20male%20fleet%20manager%20in%20his%20late%2030s%20wearing%20a%20dark%20business%20casual%20shirt%20neutral%20studio%20background%20soft%20lighting%20high%20quality&width=80&height=80&seq=avatar1&orientation=squarish',
  },
  {
    id: 'u2',
    name: 'Maria Santos',
    email: 'maria@synghfleet.com',
    phone: '+1 (555) 987-6543',
    role: 'supervisor',
    status: 'active',
    assignedVehicleIds: ['v1', 'v2', 'v3'],
    createdAt: '2024-03-10',
    avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20portrait%20of%20a%20confident%20female%20operations%20manager%20in%20her%20early%2040s%20wearing%20a%20navy%20blazer%20neutral%20studio%20background%20soft%20lighting%20high%20quality&width=80&height=80&seq=avatar2&orientation=squarish',
  },
  {
    id: 'u3',
    name: 'David Park',
    email: 'david@synghfleet.com',
    phone: '+1 (609) 555-0143',
    role: 'supervisor',
    status: 'active',
    assignedVehicleIds: ['v3', 'v4'],
    createdAt: '2024-06-22',
    avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20portrait%20of%20a%20young%20asian%20male%20logistics%20coordinator%20wearing%20a%20light%20grey%20shirt%20neutral%20studio%20background%20soft%20lighting%20high%20quality&width=80&height=80&seq=avatar4&orientation=squarish',
  },
  {
    id: 'u4',
    name: 'Lisa Wang',
    email: 'lisa@synghfleet.com',
    phone: '+1 (609) 555-0145',
    role: 'viewer',
    status: 'active',
    assignedVehicleIds: ['v5'],
    createdAt: '2024-08-05',
    avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20portrait%20of%20a%20young%20asian%20female%20analyst%20wearing%20a%20white%20blouse%20neutral%20studio%20background%20soft%20lighting%20high%20quality&width=80&height=80&seq=avatar5&orientation=squarish',
  },
  {
    id: 'u5',
    name: 'James Wilson',
    email: 'james@synghfleet.com',
    phone: '+1 (609) 555-0146',
    role: 'viewer',
    status: 'invited',
    assignedVehicleIds: ['v6'],
    createdAt: '2025-05-20',
    avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20portrait%20of%20a%20male%20driver%20in%20his%2040s%20wearing%20a%20dark%20polo%20shirt%20neutral%20studio%20background%20soft%20lighting%20high%20quality&width=80&height=80&seq=avatar6&orientation=squarish',
  },
];

export const currentUserId = 'u1';
