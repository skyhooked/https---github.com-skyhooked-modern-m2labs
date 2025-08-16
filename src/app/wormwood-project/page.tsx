// Redirect to dynamic artist page for Brandon Gaines (WormWood Project)
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WormwoodProjectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/artists/brandon-gaines');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#36454F]">
      <div className="text-[#F5F5F5] text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FF8A3D] mx-auto mb-4"></div>
        <p>Loading Brandon Gaines' profile...</p>
      </div>
    </div>
  );
}
