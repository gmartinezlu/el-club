export type JournalEntry = {
  id: string;
  patientId: string;
  title: string | null;
  body: string;
  mood: number | null;
  createdAt: string;
};
