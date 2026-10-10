import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { ConvexClientProvider } from "./convex-client-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boardlane",
  description: "A focused kanban board for software development work.",
};

// Clerk's sign-in form and account menu use the board's own colours, so they
// follow the light and dark themes.
const clerkAppearance = {
  variables: {
    colorPrimary: "var(--btn-primary-bg)",
    colorPrimaryForeground: "var(--btn-primary-text)",
    colorBackground: "var(--bg-surface)",
    colorForeground: "var(--text-primary)",
    colorMutedForeground: "var(--text-secondary)",
    colorInput: "var(--bg-surface)",
    colorInputForeground: "var(--text-primary)",
    colorBorder: "var(--border-strong)",
    colorNeutral: "var(--text-primary)",
    colorDanger: "var(--danger)",
    borderRadius: "var(--radius-md)",
    fontFamily: "var(--font-sans)",
  },
};

const themeScript = `
  try {
    const saved = localStorage.getItem("boardlane-theme");
    const theme = saved === "light" || saved === "dark"
      ? saved
      : matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = "light";
  }
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ClerkProvider appearance={clerkAppearance}>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}