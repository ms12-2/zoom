export type RelayJobStatus =
  | "pending"
  | "claimed"
  | "running_local"
  | "completed"
  | "failed";

export type RelayJob = {
  id: string;
  zoom_url: string;
  meeting_id: string;
  title: string;
  source: string;
  message: string;
  chat_type: string;
  chat_id: string;
  sender_id: string;
  status: RelayJobStatus;
  created_at: number;
  updated_at: number;
  claimed_at?: number;
  local_job_id?: string;
  summary?: string;
  /** True when the local runner also wrote a summary PDF (fetch from runner, not from relay). */
  summary_pdf_available?: boolean;
  error?: string;
};
