import Layout from '@/components/Layout';
import HomeClient from './HomeClient';
import { headers } from 'next/headers';


export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function Home() {
  headers(); // Force dynamic rendering
  return <HomeClient />;
}