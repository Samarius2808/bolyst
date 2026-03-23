import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Bolyst",
  description: "Collaborative apartment search",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#55704a",
          colorTextOnPrimaryBackground: "#ffffff",
          colorText: "#18181b",
          colorTextSecondary: "#52525b",
          colorInputText: "#18181b",
          colorInputBackground: "#ffffff",
          colorBackground: "#ffffff",
          colorDanger: "#dc2626",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          fontSize: "0.875rem",
          spacingUnit: "1rem",
        },
        elements: {
          card: "!bg-white/80 backdrop-blur-md !shadow-xl !shadow-sage-900/5 !ring-1 !ring-sage-200/50",
          footerBranding: "opacity-40 hover:opacity-70 transition-opacity",
          headerTitle: "text-zinc-900 font-bold",
          headerSubtitle: "text-zinc-500",
          socialButtonsBlockButton: "border-sage-200 hover:bg-sage-50 transition-colors rounded-xl",
          socialButtonsBlockButtonText: "text-zinc-700 font-medium",
          formFieldInput: "border-sage-200 focus:border-sage-400 focus:ring-sage-400/20 rounded-xl",
          formFieldLabel: "text-zinc-700 font-medium",
          formButtonPrimary:
            "bg-sage-600 hover:bg-sage-700 active:scale-[0.98] transition-all shadow-md shadow-sage-600/20 rounded-xl font-semibold",
          footerActionLink: "text-sage-600 hover:text-sage-700 font-medium",
          dividerLine: "bg-sage-200",
          dividerText: "text-zinc-400",
          identityPreview: "border-sage-200 rounded-xl",
          identityPreviewEditButton: "text-sage-600 hover:text-sage-700",
          formResendCodeLink: "text-sage-600 hover:text-sage-700",
          otpCodeFieldInput: "border-sage-200 focus:border-sage-400",
          alert: "rounded-xl",
          avatarImageActionsUpload: "text-sage-600",
        },
      }}
    >
      <html lang={locale} suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
          <ThemeProvider>
            <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
          </ThemeProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
