import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer 
      className="text-white py-6"
      style={{ backgroundColor: 'rgba(54, 69, 79, 1)' }}
    >
      <div className="max-w-content mx-auto px-5">
        <div className="flex flex-col items-center gap-3">
          {/* Logo and Tagline */}
          <div className="text-center">
            <Link href="/" className="inline-block mb-2">
              <Image 
                src="/logos/H-Logo-white.svg" 
                alt="M2 Labs Logo" 
                width={120} 
                height={40}
                className="h-auto"
              />
            </Link>
            <p className="text-secondary text-sm">CRAFTING THE FUTURE OF VINTAGE SOUND</p>
          </div>

          {/* Footer Navigation */}
          <nav className="flex gap-6 text-sm" aria-label="Footer Navigation">
            <Link href="/privacy" className="text-white hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <Link href="/warranty" className="text-white hover:text-accent transition-colors">
              Warranty
            </Link>
            <Link href="/contact" className="text-white hover:text-accent transition-colors">
              Contact Us
            </Link>
          </nav>
        </div>

      </div>
    </footer>
  );
}