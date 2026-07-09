export type ResourceType =
  | "article"
  | "meditation"
  | "audio"
  | "exercise"
  | "pdf";

export type EmotionalResource = {
  id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  content: string | null;
  mediaUrl: string | null;
  durationMinutes: number | null;
  isPublished?: boolean;
  sortOrder?: number;
};
