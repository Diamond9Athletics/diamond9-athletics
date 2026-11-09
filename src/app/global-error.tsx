"use client";

import { useEffect } from "react";

/**
 * Last resort, when even the site's frame (layout, menu) breaks. It replaces
 * the whole page, so it brings its own <html> and plain inline styles.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    if (error.digest) return;
    fetch("/api/report-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack?.split("\n").slice(0, 8).join("\n"),
        path: window.location.pathname,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#040200",
          color: "#e4e4e7",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Arial, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <p style={{ color: "#b07adf", fontSize: 11, letterSpacing: "0.25em", fontWeight: 700, margin: "0 0 12px" }}>
            DIAMOND NINE ATHLETICS
          </p>
          <h1 style={{ color: "#fff", fontSize: 28, margin: "0 0 12px" }}>Something went wrong</h1>
          <p style={{ color: "#a1a1aa", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
            We&rsquo;ve been told about it. Reload the page, and if it keeps happening, email
            support@diamond9athletics.com.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#9954d2",
              color: "#fff",
              border: 0,
              borderRadius: 999,
              padding: "12px 28px",
              fontSize: 12,
              letterSpacing: "0.15em",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            RELOAD
          </button>
        </div>
      </body>
    </html>
  );
}
