/**
 * The Arena's mark, driven entirely by the --logo-icon/--logo-wordmark CSS
 * variables (see globals.css) — the same light/dark/override cascade used
 * for every color token, so the correct variant (matted for a light vs.
 * dark surface) shows automatically with no JS and no hydration risk.
 */
export function BrandLogo({
  variant = "icon",
  className,
}: {
  variant?: "icon" | "wordmark";
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label="The Arena"
      className={className}
      style={{
        backgroundImage: variant === "icon" ? "var(--logo-icon)" : "var(--logo-wordmark)",
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "inline-block",
      }}
    />
  );
}
