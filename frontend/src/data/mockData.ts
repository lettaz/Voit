export interface Agent {
  id: string;
  name: string;
  provider: string;
  status: "active" | "idle" | "completed";
  task?: string;
  phone?: string;
}

export interface CallSession {
  id: string;
  agentId: string;
  status: "ringing" | "connected" | "negotiating" | "completed";
  transcript: string[];
  startedAt: string;
}

export const mockAgents: Agent[] = [
  {
    id: "1",
    name: "Scheduler",
    provider: "Dr. Smile – Dental Practice",
    status: "active",
    task: "Book dental appointment",
    phone: "+49 30 1234567",
  },
  {
    id: "2",
    name: "Insurance Helper",
    provider: "AXA Customer Service",
    status: "idle",
    task: "Clarify contract questions",
    phone: "+49 89 9876543",
  },
  {
    id: "3",
    name: "Travel Assistant",
    provider: "Lufthansa Service",
    status: "completed",
    task: "Rebook flight",
    phone: "+49 69 8765432",
  },
  {
    id: "4",
    name: "Bank Advisor",
    provider: "Deutsche Bank Hotline",
    status: "idle",
    task: "Open account",
    phone: "+49 30 5554433",
  },
];

export interface Appointment {
  id: string;
  title: string;
  provider: string;
  date: string;
  time: string;
  agentName: string;
  status: "confirmed" | "pending";
}

export const mockAppointments: Appointment[] = [
  {
    id: "apt-1",
    title: "Routine Checkup",
    provider: "Dr. Smile – Dental Practice",
    date: "2026-02-12",
    time: "14:00",
    agentName: "Scheduler",
    status: "confirmed",
  },
  {
    id: "apt-2",
    title: "Contract Discussion",
    provider: "AXA Customer Service",
    date: "2026-02-15",
    time: "10:30",
    agentName: "Insurance Helper",
    status: "pending",
  },
  {
    id: "apt-3",
    title: "Account Opening",
    provider: "Deutsche Bank Hotline",
    date: "2026-02-18",
    time: "09:00",
    agentName: "Bank Advisor",
    status: "confirmed",
  },
];

export const mockCallSession: CallSession = {
  id: "call-1",
  agentId: "1",
  status: "negotiating",
  transcript: [
    "Connection established...",
    "Good day, Dr. Smile's practice, how can I help you?",
    "I'd like to schedule an appointment for a routine checkup.",
    "Of course! Does next Wednesday at 2:00 PM work for you?",
    "Negotiating appointment...",
  ],
  startedAt: "2024-01-15T10:30:00Z",
};
