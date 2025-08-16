'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Hotspot {
  left: string;
  top: string;
  width: string;
  height: string;
}

interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
}

const hotspots: {
  mobile: Hotspot;
  tablet: Hotspot;
  desktop: Hotspot;
} = {
  mobile:  { left: '42.35%', top: '76.85%', width: '125px', height: '125px' },
  tablet:  { left: '45%',    top: '68.85%', width: '125px', height: '125px' },
  desktop: { left: '46.48%', top: '79.75%', width: '125px', height: '125px' },
};

export default function Hero({
  title = 'DROP\nTHE BOMBER\nON YOUR BOARD',
  subtitle = 'ARE YOU READY?',
  ctaText = 'PRE-ORDER',
  ctaLink = '/shop',
  backgroundImage = '/images/TBO-Pedal-HERO.webp',
}: HeroProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const toggleOverlay = () => setShowOverlay(on => !on);

  const floatAnim = {
    y: [0, -10, 0],
    boxShadow: [
      '0 0 0px rgba(255,165,0,0.3)',
      '0 0 0px rgba(255,165,0,0.7)',
      '0 0 0px rgba(255,165,0,0.3)',
    ],
  };
  const floatTrans = { duration: 4, repeat: Infinity, ease: 'easeInOut' as const };

  const staticSrc  = '/images/Hero1.webp';
  const heroSrc    = backgroundImage;
  const overlaySrc = '/images/TBO-hero-redlight-overlay6.webp';
  const textShadow = `2px 2px 0 #000, 4px 4px 0 rgba(0,0,0,0.3), 6px 6px 0 rgba(0,0,0,0.2)`;

  return (
    <section className="relative w-full h-screen overflow-hidden bg-[#36454F]">
      {/* static background layer */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${staticSrc})` }}
      />

      {/* animated pedal + optional red overlay */}
      <motion.div
        className="absolute inset-0 z-10"
        animate={floatAnim}
        transition={floatTrans}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroSrc})` }}
        />
        {showOverlay && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-80"
            style={{ backgroundImage: `url(${overlaySrc})` }}
          />
        )}
      </motion.div>

      {/* --- HERO CONTENT WITH FROSTED BACKGROUND --- */}

      {/* Mobile */}
      <div className="md:hidden absolute inset-0 flex items-start justify-center z-20 pt-20">
        <div className="relative w-1/2 max-w-md px-4">
          {/* Frosted glass background */}
          <div className="absolute inset-0 rounded-xl bg-black/45 backdrop-blur-none z-[-1] pointer-events-none"></div>
          {/* Text and CTA */}
          <div className="pointer-events-auto font-bold text-center text-[#F9F3EF] py-3 relative">
            <h1 className="text-3xl font-bold mb-4 leading-tight" style={{ textShadow }}>
              {title.split('\n').map((line, i, arr) => (
                <span key={i}>
                  {line}{i < arr.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p className="text-lg mb-6" style={{ textShadow }}>
              {subtitle}
            </p>
            {ctaText && (
              <Link
                href={ctaLink}
                className="relative z-60 inline-block bg-[#FF8A3D] text-black px-6 py-3 rounded-lg font-bold hover:bg-[#F5F5F5] transition-colors"
              >
                {ctaText}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tablet & Desktop */}
      <div className="hidden md:block absolute top-75 right-8 lg:right-16 -translate-y-1/2 w-3/5 max-w-sm z-20">
        {/* Frosted glass background */}
        <div className="absolute inset-0 rounded-xl bg-black/45 backdrop-blur-none z-[-1] pointer-events-none"></div>
        {/* Text and CTA */}
        <div className="pointer-events-auto text-[#F9F3EF] text-center relative px-6 py-7">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ textShadow }}>
            {title.split('\n').map((line, i, arr) => (
              <span key={i}>
                {line}{i < arr.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="text-xl lg:text-2xl mb-8" style={{ textShadow }}>
            {subtitle}
          </p>
          {ctaText && (
            <Link
              href={ctaLink}
              className="relative z-60 inline-block bg-[#FF8A3D] text-black px-8 py-3 rounded-lg font-bold hover:bg-[#F5F5F5] transition-colors text-lg"
            >
              {ctaText}
            </Link>
          )}
        </div>
      </div>

      {/* hotspot layer */}
      <div className="absolute inset-0 pointer-events-none z-50">
        {/* mobile */}
        <button
          type="button"
          onClick={toggleOverlay}
          onTouchEnd={e => { e.preventDefault(); toggleOverlay(); }}
          aria-label="Toggle overlay"
          className="absolute md:hidden pointer-events-auto cursor-pointer"
          style={{
            left:        hotspots.mobile.left,
            top:         hotspots.mobile.top,
            width:       hotspots.mobile.width,
            height:      hotspots.mobile.height,
            transform:   'translate(-50%, -50%)',
            touchAction: 'manipulation',
          }}
        />

        {/* tablet */}
        <button
          type="button"
          onClick={toggleOverlay}
          onTouchEnd={e => { e.preventDefault(); toggleOverlay(); }}
          aria-label="Toggle overlay"
          className="absolute hidden md:block lg:hidden pointer-events-auto cursor-pointer"
          style={{
            left:      hotspots.tablet.left,
            top:       hotspots.tablet.top,
            width:     hotspots.tablet.width,
            height:    hotspots.tablet.height,
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* desktop */}
        <button
          type="button"
          onClick={toggleOverlay}
          onTouchEnd={e => { e.preventDefault(); toggleOverlay(); }}
          aria-label="Toggle overlay"
          className="absolute hidden lg:block pointer-events-auto cursor-pointer"
          style={{
            left:      hotspots.desktop.left,
            top:       hotspots.desktop.top,
            width:     hotspots.desktop.width,
            height:    hotspots.desktop.height,
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    </section>
  );
}
