import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import './globals.css';
import './platform.css';

export const metadata: Metadata = {
  title: 'Ceyteq Digital Platform',
  description: 'Ceyteq 3D Neumorphic System',
  icons: { icon: '/ceyteq-mark.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
