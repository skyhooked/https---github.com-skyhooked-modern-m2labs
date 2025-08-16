import Layout from '@/components/Layout';
import Hero from '@/components/Hero';

export default function Warranty() {
  return (
    <Layout>      
      <section className="py-16 bg-[#36454F]">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-3xl font-bold mb-6 text-[#F5F5F5]">Lifetime Warranty</h2>
          <div className="bg-white rounded-lg shadow-lg p-8">
            
            <p className="text-secondary leading-relaxed mb-8">
              We stand behind the quality and craftsmanship of our products with a lifetime warranty on all electronics and hardware. Below is a summary of what our warranty covers and excludes.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary">Coverage</h3>
                <p className="text-secondary leading-relaxed">
                  Manufacturing defects in electronic components and hardware under normal use conditions.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary">Exclusions</h3>
                <p className="text-secondary leading-relaxed">
                  Damage from misuse, accidents, unauthorised modifications, normal wear and tear or environmental conditions outside recommended use.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary">Registration</h3>
                <p className="text-secondary leading-relaxed">
                  You must create an account and register your product, providing the serial number and purchase details, to activate your warranty.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary">Transfers</h3>
                <p className="text-secondary leading-relaxed">
                  The warranty may be transferred once; the new owner must register the product and provide proof of original purchase.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary">Claims</h3>
                <p className="text-secondary leading-relaxed">
                  Submit a warranty claim through your account, describe the issue and ship the product to us. Customers cover shipping costs to us; we cover return shipping after repair or replacement.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary">Limitations</h3>
                <p className="text-secondary leading-relaxed">
                  This warranty is valid only for authorised purchases and within the country of purchase. We are not liable for incidental or consequential damages.
                </p>
              </div>
            </div>

            <div className="border-t border-secondary/20 pt-8 mt-8">
              <p className="text-secondary leading-relaxed">
                See your product documentation for specific terms. If you need assistance with a warranty claim, please{' '}
                <a href="/contact" className="text-[#FF8A3D] hover:underline">contact us</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
