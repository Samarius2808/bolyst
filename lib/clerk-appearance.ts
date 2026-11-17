/**
 * Clerk styling for the whole app. It follows the site theme, except on the
 * sign-in / sign-up pages, which are marked `data-light-only` with
 * `color-scheme: light` (their map background and logo are light-only):
 * there `light-dark()` resolves light and `clerk-dark:` classes don't apply.
 *
 * Variable names are Clerk's current ones; the older colorText /
 * colorInputBackground etc. are silently ignored by this Clerk version.
 * `light-dark()` resolves against `color-scheme`, which next-themes sets on <html>.
 */

const variables = {
  colorPrimary: "#55704a",
  colorPrimaryForeground: "#ffffff",
  colorForeground: "light-dark(#18181b, #f0efe9)",
  colorMutedForeground: "light-dark(#52525b, #a1a1aa)",
  colorInputForeground: "light-dark(#18181b, #f0efe9)",
  colorInput: "light-dark(#ffffff, #27272a)",
  colorBackground: "light-dark(#ffffff, #18181b)",
  colorNeutral: "light-dark(#18181b, #f0efe9)",
  colorDanger: "#dc2626",
  borderRadius: "0.75rem",
  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  fontSize: "0.875rem",
  spacingUnit: "1rem",
};

const elements = {
  // Clerk can't derive its card fill from a light-dark() colorBackground, which
  // left popovers/modals transparent; give the boxes an explicit fill
  popoverBox: "!bg-white clerk-dark:!bg-zinc-900",
  cardBox: "!bg-white clerk-dark:!bg-zinc-900",
  card: "!bg-white/80 clerk-dark:!bg-zinc-900/80 backdrop-blur-md !shadow-xl !shadow-sage-900/5 !ring-1 !ring-sage-200/50",
  footerBranding: "opacity-40 hover:opacity-70 transition-opacity",
  headerTitle: "!text-zinc-900 clerk-dark:!text-zinc-100 font-bold",
  headerSubtitle: "!text-zinc-500 clerk-dark:!text-zinc-400",
  socialButtonsBlockButton:
    "border-sage-200 clerk-dark:border-zinc-700 hover:bg-sage-50 clerk-dark:hover:bg-zinc-800 transition-colors rounded-xl",
  socialButtonsBlockButtonText: "!text-zinc-700 clerk-dark:!text-zinc-200 font-medium",
  formFieldInput:
    "!bg-white clerk-dark:!bg-zinc-800 !text-zinc-900 clerk-dark:!text-zinc-100 placeholder:!text-zinc-400 border-sage-200 clerk-dark:border-zinc-700 focus:border-sage-400 focus:ring-sage-400/20 rounded-xl",
  formFieldLabel: "!text-zinc-700 clerk-dark:!text-zinc-300 font-medium",
  formButtonPrimary:
    "bg-sage-600 hover:bg-sage-700 active:scale-[0.98] transition-all shadow-md shadow-sage-600/20 rounded-xl font-semibold",
  footerActionLink: "text-sage-600 hover:text-sage-700 font-medium",
  dividerLine: "bg-sage-200 clerk-dark:bg-zinc-700",
  dividerText: "text-zinc-400",
  identityPreview: "border-sage-200 clerk-dark:border-zinc-700 rounded-xl",
  identityPreviewEditButton: "text-sage-600 hover:text-sage-700",
  formResendCodeLink: "text-sage-600 hover:text-sage-700",
  otpCodeFieldInput: "border-sage-200 focus:border-sage-400",
  alert: "rounded-xl",
  avatarImageActionsUpload: "text-sage-600",
};

/** Follows the site theme, except inside [data-light-only] (see globals.css). */
export const clerkAppearance = { variables, elements };
