export type PsychologistProfile = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  specialties: string[];
  languages: string[];
  documentUrl?: string | null;
  applicationStatus?: string | null;
  professionalWhatsapp?: string | null;
  paymentMethods?: string[];
  paymentInstructions?: string | null;
  cancellationPolicy?: string | null;
  paymentConfirmationHours?: number | null;
  allowWhatsappAfterRequest?: boolean;
};
