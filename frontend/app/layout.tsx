import type { Metadata } from 'next';
import { Workspace } from '@/components/workspace';
import '@fontsource-variable/manrope';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ceyteq | Your conversation workspace',
  description: 'A smarter, more connected workspace by Ceyteq (Ceylon Technology).',
  icons: { icon: '/ceyteq-mark.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Workspace />{children}</body></html>;
}
