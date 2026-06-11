export type Member = {
  id: string;
  name: string;
  login_name: string | null;
  phone: string | null;
  note: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Session = {
  id: string;
  date: string;
  court_fee: number;
  shuttlecock_unit_price: number;
  shuttlecock_quantity: number;
  shuttlecock_fee: number;
  drink_fee: number;
  other_fee: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionPlayer = {
  id: string;
  session_id: string;
  member_id: string | null;
  member_name_snapshot: string;
  share_count: number;
  drink_shared: boolean;
  adjustment: number;
  amount: number;
  paid: boolean;
  paid_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionWithPlayers = Session & {
  session_players: SessionPlayer[];
};

export type SessionSummary = Session & {
  players: SessionPlayer[];
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  playerCount: number;
  status: "paid" | "unpaid" | "partial";
};

export type MemberFormState = {
  ok: boolean;
  message: string;
};

export type SessionFormState = {
  ok: boolean;
  message: string;
};
