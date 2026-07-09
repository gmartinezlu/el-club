export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  wompiPublicKey: import.meta.env.VITE_WOMPI_PUBLIC_KEY as string | undefined,
  wompiIntegrityKey: import.meta.env.VITE_WOMPI_INTEGRITY_KEY as
    | string
    | undefined,
  wompiCheckoutUrl:
    (import.meta.env.VITE_WOMPI_CHECKOUT_URL as string | undefined) ??
    "https://checkout.wompi.co/p/",
};

