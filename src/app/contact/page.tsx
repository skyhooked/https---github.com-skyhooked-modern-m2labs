import Layout from '@/components/Layout';
import Hero from '@/components/Hero';

export default function Contact() {
  return (
    <Layout>      
      <section className="py-16 bg-[#36454F]">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-3xl font-bold mb-6 text-[#F5F5F5]">Get In Touch</h2>
          <div className="bg-white rounded-lg shadow-lg p-8">
            
            <p className="text-secondary leading-relaxed mb-8">
              If you have questions about your order, need help with a product, or want to learn more about our policies, we're here to help. Reach out using the form below or via email.
            </p>

            <form className="space-y-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-primary mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 border border-secondary/30 rounded-lg focus:outline-none focus:border-accent"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border border-secondary/30 rounded-lg focus:outline-none focus:border-accent"
                    placeholder="Your Email"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-primary mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  className="w-full px-4 py-3 border border-secondary/30 rounded-lg focus:outline-none focus:border-accent"
                  placeholder="How can we help?"
                />
              </div>
              
              <button
                type="submit"
                className="bg-[#FF8A3D] text-black px-8 py-3 rounded-lg font-medium hover:bg-[#F5F5F5] transition-colors"
              >
                Send Message
              </button>
            </form>

            <div className="border-t border-secondary/20 pt-8">
              <h3 className="text-xl font-semibold mb-4 text-primary">Other Ways to Reach Us</h3>
              <div className="space-y-2 text-secondary">
                <p>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:support@m2labs.com" className="text-[#FF8A3D] hover:underline">
                    support@m2labs.com
                  </a>
                </p>
                <p>
                  <strong>Phone:</strong>{' '}
                  <a href="tel:+10000000000" className="text-[#FF8A3D] hover:underline">
                    (000) 000-0000
                  </a>
                </p>
                <p>
                  <strong>Location:</strong> Atlanta, GA
                </p>
                <p>
                  <strong>Hours:</strong> Monday through Friday
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
