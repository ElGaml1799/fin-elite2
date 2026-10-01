export type Bank = "EIB" | "DIB";
export type Risk = "clear" | "hold" | "restricted";

export type Company = {
  id: string;
  name: string;
  banks: Bank[];
  risk: Risk;
  eibCat?: string;
  dibCat?: string;
  group?: string;
  emirate?: string;
  industry?: string;
  po?: string;
  employerId?: string;
  remark?: string;
  added?: boolean;
};

export type Submission = {
  id: string;
  name_en: string;
  name_ar: string;
  banks: string;
  notes: string;
  status: "pending" | "active" | "rejected";
  decision_note: string;
  created_at: string;
};
