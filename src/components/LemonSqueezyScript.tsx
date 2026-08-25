"use client";

import Script from "next/script";

export function LemonSqueezyScript() {
  return (
    <Script
      src="https://assets.lemonsqueezy.com/lemon.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.createLemonSqueezy?.();
      }}
    />
  );
}
