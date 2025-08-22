'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, type TargetAndTransition } from 'framer-motion';
import logoSrc from '../assets/logos/H-Logo-white.svg';
import SearchModal from './SearchModal';
import CartIcon from './cart/CartIcon';
import { useAuth } from '@/contexts/AuthContext';
import { getAllArtists, Artist } from '@/libs/artists';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  const { user } = useAuth();

  // Load artists data
  useEffect(() => {
    const loadData = async () => {
      try {
        const artistsData = await getAllArtists();
        setArtists(artistsData);
      } catch (error) {
        console.error('Failed to load artists for header:', error);
      }
    };

    loadData();

    // Refresh artists periodically to catch admin changes
    const interval = setInterval(async () => {
      try {
        const freshArtists = await getAllArtists();
        setArtists(freshArtists);
      } catch (error) {
        console.error('Failed to refresh artists:', error);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const wiggleAnimation: TargetAndTransition = {
    rotate: [0, -10, 10, -10, 10, 0],
    transition: {
      repeat: Infinity,
      repeatDelay: 6,
      duration: 0.6,
      // Use cubic-bezier tuple instead of string to satisfy Framer Motion types
      ease: [0.42, 0, 0.58, 1],
    },
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* Full-page blue underlay sits behind ALL content (prevents white showing through).
          It does not move with the header and is not blurred. */}
      <div aria-hidden className="fixed inset-0 -z-10" style={{ backgroundColor: '#36454F' }} />

      <header
        /* Fixed header with 40% transparency and small backdrop blur */
        className="fixed inset-x-0 top-0 w-full h-[3.75rem] z-[9999] backdrop-blur-lg"
        style={{ backgroundColor: 'rgba(54, 69, 79, 0.35)' }}
      >
        <div className="flex items-center h-full px-5 lg:px-16">
          {/* 1) Logo */}
          <Link href="/" onClick={closeMenu} className="flex-shrink-0">
            <Image
              src={logoSrc}
              alt="M2 Labs Logo"
              width={140}
              height={47}
              className="h-auto"
            />
          </Link>

          {/* 2) Mobile hamburger */}
          <div className="flex-1 lg:hidden flex justify-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              className="relative z-30"
            >
              <div
                className="
                  w-6 h-0.5 bg-[#FF8A3D] relative
                  before:absolute before:w-6 before:h-0.5 before:bg-[#FF8A3D] before:-top-2 before:content-['']
                  after:absolute after:w-6 after:h-0.5 after:bg-[#FF8A3D] after:top-2 after:content-['']
                "
              />
            </button>
          </div>

          {/* 3) Desktop nav */}
          <nav className="hidden lg:flex flex-1 justify-center items-center gap-8">
            <motion.span animate={wiggleAnimation}>
              <Link
                href="/shop"
                onClick={closeMenu}
                className="bg-[#FF8A3D] text-black px-5 py-2 rounded-md font-bold hover:bg-[#F5F5F5] transition-colors"
              >
                SHOP
              </Link>
            </motion.span>

            <Link href="/our-story" className="text-[#F5F5F5] hover:text-[#FF8A3D] font-bold transition-colors">
              OUR STORY
            </Link>
            <Link href="/news" className="text-[#F5F5F5] hover:text-[#FF8A3D] font-bold transition-colors">
              NEWS
            </Link>

            <div className="relative group">
              <Link href="/artists" className="text-[#F5F5F5] hover:text-[#FF8A3D] font-bold flex items-center">
                ARTISTS <span aria-hidden="true" className="ml-1">▾</span>
              </Link>
              <div className="absolute top-full left-0 mt-2 min-w-49 bg-[rgba(54,69,79,0.35)] backdrop-blur-lg border border-white/10 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                {artists.length > 0 ? (
                  <>
                    {artists.slice(0, 6).map((artist) => (
                      <Link
                        key={artist.id}
                        href={`/artists/${artist.id}`}
                        className="block px-4 py-2 text-[#F5F5F5] text-sm hover:bg:white/5 hover:text-[#FF8A3D] font-bold transition-colors"
                      >
                        {artist.name.toUpperCase()}
                      </Link>
                    ))}
                    {artists.length > 6 && (
                      <Link
                        href="/artists"
                        className="block px-4 py-2 text-[#FF8A3D] text-sm hover:bg-white/5 font-bold transition-colors border-t border-white/10"
                      >
                        VIEW ALL ARTISTS
                      </Link>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-2 text-[#F5F5F5] text-sm">
                    Loading artists...
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/artist-endorsement"
              className="text-[#F5F5F5] hover:text-[#FF8A3D] font-bold transition-colors"
            >
              ENDORSEMENT PROGRAM
            </Link>

            <div className="relative group">
              <button className="text-[#F5F5F5] hover:text-[#FF8A3D] font-bold flex items-center">
                SUPPORT ▾
              </button>
              <div className="absolute top-full left-0 mt-2 min-w-48 bg-[rgba(54,69,79,0.6)] backdrop-blur-sm border border-white/10 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                <Link
                  href="/warranty"
                  className="block px-4 py-2 text-[#F5F5F5] text-sm hover:bg-white/5 hover:text-[#FF8A3D] font-bold transition-colors"
                >
                  WARRANTY
                </Link>
                <Link
                  href="/privacy"
                  className="block px-4 py-2 text-[#F5F5F5] text-sm hover:bg-white/5 hover:text-[#FF8A3D] font-bold transition-colors"
                >
                  PRIVACY
                </Link>
                <Link
                  href="/contact"
                  className="block px-4 py-2 text-[#F5F5F5] text-sm hover:bg-white/5 hover:text-[#FF8A3D] font-bold transition-colors"
                >
                  CONTACT
                </Link>
              </div>
            </div>
          </nav>

          {/* 4) Desktop utility icons */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
              className="text-[#F5F5F5] hover:text-accent transition-colors"
            >
              <Image
                src="/icons/search.svg"
                alt="Search"
                width={20}
                height={20}
                className="brightness-0 invert"
              />
            </button>
            {user ? (
              <Link href="/account" aria-label="Account" className="text-[#F5F5F5] hover:text-accent transition-colors flex items-center space-x-1">
                <Image
                  src="/icons/user.svg"
                  alt="Account"
                  width={20}
                  height={20}
                  className="brightness-0 invert"
                />
                <span className="text-xs hidden lg:block">{user.firstName}</span>
              </Link>
            ) : (
              <Link href="/login" aria-label="Sign In" className="text-white hover:text-accent transition-colors">
                <Image
                  src="/icons/user.svg"
                  alt="Sign In"
                  width={20}
                  height={20}
                  className="brightness-0 invert"
                />
              </Link>
            )}
            <CartIcon />
          </div>
        </div>

        {/* ----- MOBILE NAVIGATION DROPDOWN ----- */}
        {isMenuOpen && (
          <div
            className="absolute top-full left-0 w-full z-[9999] bg-[rgba(54,69,79,0.6)] backdrop-blur-sm overflow-y-auto rounded-b-md"
            style={{ maxHeight: 'calc(100vh - 3.75rem)' }}
            onClick={closeMenu}
          >
            <button
              aria-label="Close menu"
              onClick={closeMenu}
              className="absolute top-4 left-4 text-white text-3xl font-bold"
              style={{ lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
            <nav
              className="flex flex-col items-center gap-4 px-4 pt-20 pb-6"
              onClick={e => e.stopPropagation()}
            >
              <Link
                href="/shop"
                onClick={closeMenu}
                className="text-sm bg-[#FF8A3D] text-black px-5 py-2 rounded-md font-bold shadow text-center mb-2"
              >
                SHOP
              </Link>
              <Link
                href="/our-story"
                onClick={closeMenu}
                className="w-full text-sm text-white text-center py-2 rounded hover:bg-white/10 font-bold transition-colors"
              >
                OUR STORY
              </Link>
              <Link
                href="/news"
                onClick={closeMenu}
                className="w-full text-sm text-white text-center py-2 rounded hover:bg-white/10 font-bold transition-colors"
              >
                NEWS
              </Link>
              <Link
                href="/artists"
                onClick={closeMenu}
                className="w-full text-sm text-white text-center py-2 rounded hover:bg-white/10 font-bold transition-colors"
              >
                ARTISTS
              </Link>
              <Link
                href="/artist-endorsement"
                onClick={closeMenu}
                className="w-full text-sm text-white text-center py-2 rounded hover:bg-white/10 font-bold transition-colors"
              >
                ENDORSEMENT PROGRAM
              </Link>
              <Link
                href="/warranty"
                onClick={closeMenu}
                className="w-full text-sm text-white text-center py-2 rounded hover:bg-white/10 font-bold transition-colors"
              >
                WARRANTY
              </Link>
              <Link
                href="/privacy"
                onClick={closeMenu}
                className="w-full text-sm text-white text-center py-2 rounded hover:bg-white/10 font-bold transition-colors"
              >
                PRIVACY
              </Link>
              <Link
                href="/contact"
                onClick={closeMenu}
                className="w-full text-sm text-white text-center py-2 rounded hover:bg-white/10 font-bold transition-colors"
              >
                CONTACT
              </Link>

              <div className="border-t border-white/20 my-4"></div>

              {user ? (
                <>
                  <Link
                    href="/account"
                    onClick={closeMenu}
                    className="w-full text-sm text-white text-center py-2 rounded hover:bg-white/10 font-bold transition-colors"
                  >
                    MY ACCOUNT ({user.firstName})
                  </Link>
                  <Link
                    href="/account/orders"
                    onClick={closeMenu}
                    className="w-full text-sm text-white text-center py-2 rounded hover:bg-white/10 font-bold transition-colors"
                  >
                    ORDER HISTORY
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="w-full text-sm text-white text-center py-2 rounded hover:bg-white/10 font-bold transition-colors"
                  >
                    SIGN IN
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMenu}
                    className="w-full text-sm bg-[#FF8A3D] text-black text-center py-2 rounded font-bold hover:bg-[#FF8A3D]/80 transition-colors"
                  >
                    CREATE ACCOUNT
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
        {/* ----- END MOBILE NAVIGATION DROPDOWN ----- */}
      </header>

      {/* ----- SEARCH MODAL ----- */}
      {isSearchOpen && <SearchModal onClose={() => setIsSearchOpen(false)} />}
    </>
  );
}
