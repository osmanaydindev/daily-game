import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Aydınlar Oynuyor', template: '%s | Aydınlar Oynuyor' },
  description: 'Günlük Wordle ve Parolla liderlik tabloları',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
