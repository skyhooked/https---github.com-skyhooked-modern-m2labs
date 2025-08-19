import Layout from '@/components/Layout';
import HomeClient from './HomeClient';


export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function Home() {
  return <HomeClient />;
}