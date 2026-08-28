import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Booster Club Hub | Membership & Athlete Recruiting Profiles',
    template: '%s | Booster Club Hub',
  },
  description:
    'Booster Club Hub gives high school booster clubs dues management, a member roster, local perks, and SEO-optimized athlete recruiting profiles college recruiters can find.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
