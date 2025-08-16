import Image from 'next/image';

interface SectionDividerProps {
  variant?: 'line' | 'gradient' | 'decorative' | 'wave' | 'logo' | 'seamless';
  color?: string;
  height?: string;
  className?: string;
}

export default function SectionDivider({
  variant = 'decorative',
  color = '#FF7F3F', // waveform orange
  height = '4px',
  className = '',
}: SectionDividerProps) {
  const baseClasses = 'w-full flex justify-center items-center py-8';

  switch (variant) {
    case 'line':
      return (
        <div className={`${baseClasses} ${className}`}>
          <div
            className="w-full max-w-content mx-auto"
            style={{ height, backgroundColor: color }}
          />
        </div>
      );

    case 'gradient':
      return (
        <div className={`${baseClasses} ${className}`}>
          <div
            className="w-full max-w-content mx-auto"
            style={{
              height,
              background: `linear-gradient(to right, transparent, ${color}, transparent)`,
            }}
          />
        </div>
      );

    case 'wave':
      return (
        <div className={`${baseClasses} ${className}`}>
          <svg
            viewBox="0 0 1200 20"
            className="w-full max-w-content h-5"
            fill={color}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0,10 Q300,0 600,10 T1200,10 L1200,20 L0,20 Z" />
          </svg>
        </div>
      );

    case 'logo':
      return (
        <div className={`${baseClasses} ${className}`}>
          <div className="flex items-center w-full max-w-content mx-auto px-5">
            <div
              className="flex-1"
              style={{
                height,
                background: `linear-gradient(to right, transparent, ${color})`,
              }}
            />
            <div className="px-8">
              <Image
                src="/logos/audiowave-orange-div.svg"
                alt="M2 Labs"
                width={60}
                height={20}
                // removed opacity and filter so the SVG shows its original color
              />
            </div>
            <div
              className="flex-1"
              style={{
                height,
                background: `linear-gradient(to left, transparent, ${color})`,
              }}
            />
          </div>
        </div>
      );

    case 'seamless':
      return (
        <div className={`w-full py-8 ${className}`}>
          <div className="flex items-center w-full max-w-content mx-auto px-5">
            <div
              className="flex-1 h-px"
              style={{
                background: `linear-gradient(to right, transparent, ${color}, transparent)`,
              }}
            />
          </div>
        </div>
      );

    case 'decorative':
    default:
      return (
        <div className={`${baseClasses} ${className}`}>
          <div className="flex items-center w-full max-w-content mx-auto px-5">
            <div className="flex-1" style={{ height, backgroundColor: color }} />
            <div className="px-6">
              <div
                className="w-3 h-3 rotate-45 border-2"
                style={{ borderColor: color }}
              />
            </div>
            <div className="flex-1" style={{ height, backgroundColor: color }} />
          </div>
        </div>
      );
  }
}
