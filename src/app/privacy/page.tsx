import Layout from '@/components/Layout';

export default function Privacy() {
  return (
    <Layout>
      <section className="py-16 bg-[#36454F]">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-3xl font-bold mb-6 text-[#F5F5F5]">Privacy Policy</h2>
          <div className="bg-white rounded-lg shadow-lg p-8">
            
            <p className="text-secondary leading-relaxed mb-8">
              We respect your privacy and are committed to protecting the personal information you share with us. This policy outlines how we collect, use and safeguard your data when you visit our site.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary">Personal Data</h3>
                <p className="text-secondary leading-relaxed">
                  Information you provide voluntarily such as your name, address and payment details.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary">Derivative Data</h3>
                <p className="text-secondary leading-relaxed">
                  Information automatically collected by our servers, including your IP address, browser type and pages visited.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary">Use of Information</h3>
                <p className="text-secondary leading-relaxed">
                  We use your data to create and manage your account, process orders, communicate with you and improve our services.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary">Disclosure</h3>
                <p className="text-secondary leading-relaxed">
                  We may share your information to comply with legal obligations, protect rights, or as part of a business transfer, and only with your consent for other purposes.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary">Security</h3>
                <p className="text-secondary leading-relaxed">
                  We employ administrative, technical and physical safeguards to protect your data, but no system is completely secure.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary">Children</h3>
                <p className="text-secondary leading-relaxed">
                  Our services are not directed to children under 13 and we do not knowingly collect their data.
                </p>
              </div>
            </div>

            <div className="border-t border-secondary/20 pt-8 mt-8">
              <p className="text-secondary leading-relaxed">
                For more details about how we handle your information, please reach out via our{' '}
                <a href="/contact" className="text-[#FF8A3D] hover:underline">contact page</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
