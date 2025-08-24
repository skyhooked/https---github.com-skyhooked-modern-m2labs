import Layout from '@/components/Layout';
import Hero from '@/components/Hero';
import Link from 'next/link';

export default function ArtistEndorsement() {
  return (
    <Layout>      
      <section className="py-16 bg-[#36454F]">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-3xl font-bold mb-6 text-[#F5F5F5]">Apply to Join Our Program</h2>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <p className="text-secondary leading-relaxed mb-6">
              Are you a passionate musician looking to elevate your sound with top‑tier gear? Our Artist Endorsement Programme provides emerging bands and artists with free pedals and exposure through our platform.
            </p>
            
            <p className="text-secondary leading-relaxed mb-8">
              By joining, you'll gain access to exclusive benefits designed to help you grow your audience and refine your tone. Here's what's in it for you:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-background rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 text-primary">🎸 Free Pedals</h3>
                <p className="text-secondary">Get your hands on some of our most iconic effects pedals for free.</p>
              </div>

              <div className="bg-background rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 text-primary">📱 Social Media Shoutouts</h3>
                <p className="text-secondary">We'll promote your band or music across our growing social media channels.</p>
              </div>

              <div className="bg-background rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 text-primary">🔥 Exclusive Access</h3>
                <p className="text-secondary">Be the first to test and try out new products before they hit the market.</p>
              </div>

              <div className="bg-background rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3 text-primary">🤝 Collaborative Opportunities</h3>
                <p className="text-secondary">Feature in future projects, including demo videos, blog highlights and exclusive artist profiles.</p>
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-4 text-primary">Who Should Apply?</h3>
            <p className="text-secondary leading-relaxed mb-8">
              We're looking for bands and solo artists who are established, active performers with an engaged audience and a commitment to collaborating on promotional efforts.
            </p>

            <div className="text-center">
              <Link 
                href="/contact" 
                className="inline-block bg-[#FF8A3D] text-black px-8 py-4 rounded-lg font-semibold hover:bg-[#F5F5F5] transition-colors text-lg"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
