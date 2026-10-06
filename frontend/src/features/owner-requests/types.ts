export type OwnerRequestStatus = "pending" | "approved" | "rejected";

export interface OwnerRequestSelf {
  id: number;
  status: OwnerRequestStatus;
  submitted_at: string;
  decided_at: string | null;
}

export interface OwnerRequestAdmin extends OwnerRequestSelf {
  user_id: number;
  name: string;
  email: string | null;
}