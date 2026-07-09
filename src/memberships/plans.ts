export type MembershipPlanCode = "comunidad" | "club" | "acompanamiento";

export type MembershipPlan = {
  code: MembershipPlanCode;
  name: string;
  description: string;
  eyebrow: string;
  amountCop: number;
  features: string[];
  cta: string;
  featured?: boolean;
};

export const membershipPlans: MembershipPlan[] = [
  {
    code: "comunidad",
    name: "Comunidad",
    description: "Para sentirte parte y recibir guia constante.",
    eyebrow: "Mensual",
    amountCop: 49000,
    features: [
      "Acceso a comunidad WhatsApp",
      "Invitaciones a eventos",
      "Contenido exclusivo",
      "Retos mensuales",
    ],
    cta: "Unirme a la comunidad",
  },
  {
    code: "club",
    name: "Club",
    description: "Para vivir experiencias y crear habitos con compania.",
    eyebrow: "Mensual",
    amountCop: 89000,
    featured: true,
    features: [
      "Todo lo anterior",
      "Acceso prioritario a experiencias",
      "Talleres mensuales",
      "Descuentos en terapia",
      "Recursos premium",
    ],
    cta: "Quiero ser miembro",
  },
  {
    code: "acompanamiento",
    name: "Acompanamiento",
    description: "Para combinar comunidad, terapia y seguimiento emocional.",
    eyebrow: "Mensual",
    amountCop: 149000,
    features: [
      "Todo lo anterior",
      "Sesiones con profesionales",
      "Seguimiento emocional",
      "Programas personalizados",
    ],
    cta: "Explorar acompanamiento",
  },
];

export function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function findMembershipPlan(code: string | undefined) {
  return membershipPlans.find((plan) => plan.code === code) ?? null;
}
