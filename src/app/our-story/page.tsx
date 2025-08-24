'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import Hero from '@/components/Hero';

export default function OurStory() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsletterMessage, setNewsletterMessage] = useState('');

  // Newsletter signup handler
  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newsletterEmail.trim()) {
      setNewsletterStatus('error');
      setNewsletterMessage('Please enter a valid email address');
      return;
    }

    setNewsletterStatus('loading');
    setNewsletterMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newsletterEmail.trim(),
          source: 'our-story'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewsletterStatus('success');
        setNewsletterMessage(data.alreadySubscribed 
          ? 'You\'re already subscribed to our newsletter!' 
          : 'Successfully subscribed to our newsletter!');
        setNewsletterEmail('');
      } else {
        setNewsletterStatus('error');
        setNewsletterMessage(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setNewsletterStatus('error');
      setNewsletterMessage('Failed to subscribe. Please try again.');
    }

    // Clear message after 5 seconds
    setTimeout(() => {
      setNewsletterStatus('idle');
      setNewsletterMessage('');
    }, 5000);
  };
  return (
    <Layout>      
            {/* Our Story - Single Section */}
      <section className="py-16 bg-[#36454F] text-[#F5F5F5]" >
        <div className="max-w-4xl mx-auto px-5">
          <div className="bg-[#6C7A83] rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-8 text-primary">The M2 Labs Story</h2>
            
            <p className="text-secondary leading-relaxed mb-8">
              M2 Labs takes its name from two places. M2 refers to Mike Squared, the call sign painted on Avro Lancaster B Mk. III ED888 PM M2 of No. 103 Squadron at RAF Elsham Wolds in Lincoln. Nick Cannon’s grandfather flew that aircraft after the war. Yes, Nick Cannon. Not that Nick Cannon. Labs points to Jonathon Labadie’s name and to a working lab where ideas become practical technology and products.
            </p>
            <br></br>
            <div className="flex justify-center items-center gap-12">
            <a className="block w-[320px] h-[240px]" href="https://www.flying-tigers.co.uk/2016/avro-lancaster-b-iii-ed888pm-m2-mike-squared-sywell-activity-new-arrivals/" target="_blank" rel="noopener">
            <img src="/images/Mdeuce.png" alt="Avro Lancaster B Mk. III ED888 PM M2 aircraft" className="w-full h-full object-cover block rounded-xl" />
            </a>
            <a className="block w-[320px] h-[240px]" href="https://www.flying-tigers.co.uk/2016/avro-lancaster-b-iii-ed888pm-m2-mike-squared-sywell-activity-new-arrivals/" target="_blank" rel="noopener">
            <img src="/images/Mdeuce2.jpg" alt="Avro Lancaster B Mk. III ED888 PM M2 aircraft" className="w-full h-full object-cover block rounded-xl" />
            </a>
            </div>
            <br></br>
            <br></br>

            <p className="text-secondary leading-relaxed mb-6">
             Nick Cannon started his career on Australia’s East Coast in broadcast. He learned RF, electrical engineering, and how to keep a network running under pressure. Music stayed close, whether he was listening or playing with friends. As his career progressed, he streamlined manufacturing and opened factories in Hong Kong for leading brands in RF test and measurement. That experience took him to the United States, where he applied his expertise in a competitive RF industry. He focused on solving problems others overlooked and built equipment that delivered smaller footprints without giving up performance. After several moves he started his own business and developed a way to filter RF frequencies in a form factor about one tenth the size of traditional gear. During this time he met Jonathon through collaborating companies in the RF space.
            </p>
            
            <p className="text-secondary leading-relaxed mb-8">
            Jonathon Labadie grew up in rural Georgia and found music early. He picked up a guitar at thirteen and kept going. In his twenties he worked in graphic design, watchmaking, and the service industry. Those jobs taught precision, patience, and clear process. He played countless shows with several bands and moved into recording and production to understand the full path from rough idea to finished track. In 2014 he crossed paths with Nick while working for a company that distributed Nick’s RF filters to the wireless market. Nick became a mentor and shared guidance that pushed Jonathon forward.
            </p>
            
            <p className="text-secondary leading-relaxed mb-6">
              From their first conversations they knew they wanted to work together. They shared a clear view of the wireless market and respect for each other’s skills. Jonathon brought fresh ideas and energy. Nick brought depth in RF and a focus on precision and perseverance. The mentorship turned into collaboration. They spent hours brainstorming, testing, and challenging each other’s thinking. Nick stayed hands on and showed how to turn theory into working gear. Over time the partnership became a balanced team.
            </p>
            
            <p className="text-secondary leading-relaxed mb-8">
              Ten years later they formed M2 Labs. The goal is simple. Build tools that help musicians and audio pros express ideas without added friction. M2 Labs sits between familiar music workflows and modern technology. The aim is to release products that are innovative and easy to use. The work reflects their path. Each product shows craft and problem solving learned over years and is built to meet the needs of musicians in real studios and on real stages. Their focus on empowering musicians through technology shows up in how they design, test, and support what they ship. M2 Labs stands on that commitment and on the story that brought Nick and Jonathon together.
            </p>         
      
            <div className="border-t border-secondary/20 pt-8">
              <h3 className="text-2xl font-bold mb-6 text-primary text-center">Stay in Touch</h3>
              <p className="text-secondary mb-6 text-center">Join our email list to receive updates, pre‑sale announcements and community news.</p>
              
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row justify-center items-center gap-2 max-w-xl mx-auto">
                <label htmlFor="story-email" className="sr-only">Email address</label>
                <input
                  type="email"
                  id="story-email"
                  name="email"
                  placeholder="Enter your email here"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  disabled={newsletterStatus === 'loading'}
                  className="flex-1 w-full sm:w-auto px-4 py-3 border border-secondary/30 rounded focus:outline-none focus:border-accent disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === 'loading'}
                  className="bg-[#FF8A3D] text-black px-6 py-3 rounded font-medium hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {newsletterStatus === 'loading' ? 'Signing Up...' : 'Sign Up'}
                </button>
              </form>
              
              {newsletterMessage && (
                <div className={`mt-4 text-center p-3 rounded ${
                  newsletterStatus === 'success' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : newsletterStatus === 'error'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : ''
                }`}>
                  {newsletterMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
