import { env } from "../lib/env";
import type { MembershipOrder } from "./service";

export type WompiCheckoutData = {
  ready: boolean;
  actionUrl: string;
  fields: Record<string, string>;
  missing: string[];
};

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function buildWompiCheckoutData({
  order,
  customerEmail,
  redirectUrl,
}: {
  order: MembershipOrder;
  customerEmail?: string | null;
  redirectUrl: string;
}): Promise<WompiCheckoutData> {
  const missing = [
    !env.wompiPublicKey ? "VITE_WOMPI_PUBLIC_KEY" : null,
    !env.wompiIntegrityKey ? "VITE_WOMPI_INTEGRITY_KEY" : null,
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return {
      ready: false,
      actionUrl: env.wompiCheckoutUrl,
      fields: {},
      missing,
    };
  }

  const signature = await sha256(
    `${order.providerReference}${order.amountCents}${order.currency}${env.wompiIntegrityKey}`,
  );

  return {
    ready: true,
    actionUrl: env.wompiCheckoutUrl,
    fields: {
      "public-key": env.wompiPublicKey ?? "",
      currency: order.currency,
      "amount-in-cents": String(order.amountCents),
      reference: order.providerReference,
      "redirect-url": redirectUrl,
      "signature:integrity": signature,
      ...(customerEmail ? { "customer-data:email": customerEmail } : {}),
    },
    missing,
  };
}
