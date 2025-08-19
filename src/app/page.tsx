import Layout from '@/components/Layout';
import HomeClient from './HomeClient';
import { headers } from 'next/headers';


export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function Home() {
  headers(); // Force dynamic rendering
  await Promise.resolve(); // Minimal server-side async to ensure dynamic handling
  return <HomeClient />;
}