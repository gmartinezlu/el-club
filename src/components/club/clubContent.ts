import {
  BookOpen,
  CalendarHeart,
  Coffee,
  HeartHandshake,
  Megaphone,
  MessageCircle,
  Moon,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
} from "lucide-react";

// Reemplazar estas URLs por assets propios en src/assets/images cuando existan
// fotos reales de EL CLUB.
export const clubImages = {
  heroVideo: "",
  hero:
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80",
  community:
    "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=80",
  therapy:
    "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1400&q=80",
  members:
    "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1400&q=80",
};

export const ecosystemItems = [
  {
    title: "Terapia y acompañamiento profesional",
    text: "Psicólogas verificadas cuando necesitas sostén claro y humano.",
    icon: HeartHandshake,
  },
  {
    title: "Talleres y charlas",
    text: "Espacios guiados para aprender herramientas emocionales aplicables.",
    icon: Megaphone,
  },
  {
    title: "Experiencias presenciales",
    text: "Encuentros para moverte, respirar, conversar y salir de la pantalla.",
    icon: Waves,
  },
  {
    title: "Comunidad oficial de WhatsApp",
    text: "Canales moderados con contenido, invitaciones y reglas de cuidado.",
    icon: MessageCircle,
  },
  {
    title: "Retos de bienestar",
    text: "Pequeñas prácticas para construir hábitos sin presión.",
    icon: Sparkles,
  },
  {
    title: "Contenido y recursos",
    text: "Lecturas, journals y meditaciones para acompañarte entre experiencias.",
    icon: BookOpen,
  },
];

export const experiences = [
  {
    title: "Caminata consciente",
    tag: "Presencial",
    date: "Próximamente",
    category: "Movimiento",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Club de lectura emocional",
    tag: "Miembros",
    date: "Online",
    category: "Comunidad",
    image:
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Yoga & journaling",
    tag: "Presencial",
    date: "Sábado AM",
    category: "Movimiento",
    image:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Taller de ansiedad",
    tag: "Online",
    date: "Cupos pronto",
    category: "Taller",
    image:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Running Club",
    tag: "Presencial",
    date: "Domingo",
    category: "Movimiento",
    image:
      "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Café y conversación",
    tag: "Miembros",
    date: "Próximamente",
    category: "Comunidad",
    image:
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Meditación guiada",
    tag: "Online",
    date: "Miércoles",
    category: "Bienestar",
    image:
      "https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Charlas con expertos",
    tag: "Taller",
    date: "Mensual",
    category: "Taller",
    image:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=80",
  },
];

export const contentArticles = [
  {
    title: "Cómo bajar el ritmo sin desconectarte de tu vida",
    category: "Estrés",
    readTime: "5 min",
    image:
      "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Preguntas de journal para días emocionalmente intensos",
    category: "Hábitos",
    readTime: "4 min",
    image:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Relaciones que se sienten seguras: señales suaves",
    category: "Relaciones",
    readTime: "6 min",
    image:
      "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Autoestima cotidiana: menos exigencia, más presencia",
    category: "Autoestima",
    readTime: "5 min",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
  },
];

export const communityPrinciples = [
  { label: "Canal oficial de anuncios", icon: Megaphone },
  { label: "Grupos por ciudad", icon: Users },
  { label: "Retos temporales", icon: CalendarHeart },
  { label: "Actividades para miembros", icon: Coffee },
  { label: "Moderación y reglas claras", icon: ShieldCheck },
  { label: "Cuidado sin foros abiertos", icon: Moon },
];

export const specialists = [
  {
    name: "Dra. Camila R.",
    focus: "Ansiedad y regulación emocional",
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Psic. Valeria S.",
    focus: "Vínculos, duelo y autoestima",
    image:
      "https://images.unsplash.com/photo-1551836022-8b2858c9c69b?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Dra. Paula M.",
    focus: "Estrés, burnout y hábitos",
    image:
      "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=700&q=80",
  },
];

export const blogCategories = [
  "Ansiedad",
  "Relaciones",
  "Hábitos",
  "Estrés",
  "Autoestima",
  "Bienestar laboral",
];

export const therapyNeeds = [
  "Ansiedad",
  "Estrés",
  "Relaciones",
  "Duelo",
  "Autoestima",
  "Crecimiento personal",
];

export const professionalBenefits = [
  "Perfil profesional dentro de una marca premium",
  "Agenda, notas y disponibilidad organizada",
  "Métodos de pago configurados por cada psicóloga",
  "Comunidad de bienestar con límites claros",
  "Aprobación y revisión profesional por admin",
  "Experiencia cálida para personas, no clínica fría",
];
