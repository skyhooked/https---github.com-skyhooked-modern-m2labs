import Link from 'next/link';
import Layout from '@/components/Layout';

export default function NotFound() {
  return (
    <Layout>
      <section className="py-16 text-center bg-[#36454F] min-h-screen flex items-center">
        <div className="max-w-4xl mx-auto px-5">
          <h1 className="text-4xl font-bold mb-4 text-[#F5F5F5]">404 - Page Not Found</h1>
          <p className="text-[#F5F5F5] mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#FF8A3D] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#FF8A3D]/80 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </section>
    </Layout>
  );
}
