import React, { useEffect, useState } from "react";
export default function Payments() {
  const [status, setStatus] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/payments/status")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        setStatus(d);
      })
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section className="panel payment-panel">
      <span className="eyebrow">PAYMENTS FOR YOUR BUSINESS</span>
      <h2>Your collection. Your customers. Your payouts.</h2>
      <p>
        Connect your own Stripe account to receive payments for all the stores
        in your merchant workspace. Card information is collected on Stripe’s
        hosted checkout.
      </p>
      {status && (
        <div className="info-note">
          <strong>
            {status.connected
              ? "Your Stripe account is connected"
              : status.configured
                ? "Ready to connect your Stripe account"
                : "Platform payment setup is still required"}
          </strong>
          <p>
            {status.connected
              ? "Paid orders appear after Stripe verifies payment."
              : status.configured
                ? "Stripe will guide you through account authorization and any verification requirements."
                : "The platform owner is setting up live payments. You can manage your collection and try demo checkout in the meantime."}
          </p>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button
        className="button primary"
        disabled={!status?.configured || status?.connected || busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await fetch("/api/payments/connect");
            const data = await r.json();
            if (!r.ok) throw Error(data.error);
            window.location.assign(data.url);
          } catch (e) {
            setError(e.message);
            setBusy(false);
          }
        }}
      >
        {status?.connected
          ? "Stripe connected"
          : busy
            ? "Opening Stripe…"
            : "Connect Stripe account"}
      </button>
      <p className="muted">
        Payout eligibility, processing fees, refunds, and tax settings are
        managed in your Stripe account. Demo orders do not collect money.
      </p>
    </section>
  );
}
