import QRCode from "qrcode";

export type UpiPaymentSettings = {
  upi_vpa: string | null;
  upi_payee_name: string | null;
  upi_qr_image_url: string | null;
};

export function isUpiConfigured(settings: UpiPaymentSettings | undefined): boolean {
  if (!settings) return false;
  return Boolean(settings.upi_vpa?.trim() || settings.upi_qr_image_url);
}

export function buildUpiPaymentLink(params: {
  vpa: string;
  amount: string | number;
  payeeName?: string | null;
  orderId: string;
}): string {
  const amount =
    typeof params.amount === "number"
      ? params.amount.toFixed(2)
      : params.amount;
  const search = new URLSearchParams({
    pa: params.vpa.trim(),
    am: amount,
    tn: `Order-${params.orderId}`,
  });
  const payee = params.payeeName?.trim();
  if (payee) search.set("pn", payee);
  return `upi://pay?${search.toString()}`;
}

export async function buildUpiQrDataUrl(upiLink: string): Promise<string> {
  return QRCode.toDataURL(upiLink, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 480,
  });
}

export type UpiQrDisplay =
  | { kind: "dynamic"; qrSrc: string; vpa: string; payeeName: string | null }
  | { kind: "static"; qrSrc: string; vpa: string | null; payeeName: string | null };

export async function resolveUpiQrDisplay(params: {
  settings: UpiPaymentSettings;
  orderId: string;
  totalAmount: string | number;
}): Promise<UpiQrDisplay | null> {
  const vpa = params.settings.upi_vpa?.trim() ?? "";
  const payeeName = params.settings.upi_payee_name?.trim() || null;

  if (vpa) {
    const link = buildUpiPaymentLink({
      vpa,
      amount: params.totalAmount,
      payeeName,
      orderId: params.orderId,
    });
    const qrSrc = await buildUpiQrDataUrl(link);
    return { kind: "dynamic", qrSrc, vpa, payeeName };
  }

  if (params.settings.upi_qr_image_url) {
    return {
      kind: "static",
      qrSrc: params.settings.upi_qr_image_url,
      vpa: null,
      payeeName,
    };
  }

  return null;
}
