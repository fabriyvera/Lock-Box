import type { Metadata } from 'next';
import SellerDashboard from '@/components/seller/SellerDashboard';

export const metadata: Metadata = {
  title: 'Panel del vendedor · LockBox',
  description: 'Gestiona tu catálogo, lives y pedidos en LockBox.',
};

export default function SellerPage() {
  return <SellerDashboard />;
}
