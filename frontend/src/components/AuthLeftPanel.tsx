import { Check } from 'lucide-react';

interface AuthLeftPanelProps {
  title: string;
  subtitle: string;
  imageUrl?: string;
}

export const AuthLeftPanel = ({ title, subtitle, imageUrl }: AuthLeftPanelProps) => {
  const features = [
    "AI WhatsApp Receptionist",
    "Smart Appointment Reminders",
    "Automatic Rebooking System"
  ];

  return (
    <div className={`hidden lg:flex flex-col relative overflow-hidden text-white min-h-screen sticky top-0 self-start shrink-0 ${imageUrl ? 'w-auto' : 'w-1/2 bg-[#4355FF]'}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Background"
          className="h-screen w-auto object-contain block"
        />
      ) : (
        <>
          <div className="p-16 flex flex-col h-full">
            {/* Decorative chat bubbles at bottom left */}
            <div className="absolute -bottom-8 -left-8 w-[450px] h-[400px] pointer-events-none z-0">
              <svg viewBox="0 0 450 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
                {/* Back Bubble */}
                <path d="M 120 220 A 110 110 0 1 1 340 220 A 110 110 0 0 1 120 220 Z" fill="#2563EB" opacity="0.8" />
                <path d="M 320 300 L 380 340 L 310 320 Z" fill="#2563EB" opacity="0.8" />

                {/* Front Bubble */}
                <circle cx="160" cy="240" r="130" fill="url(#paint_front)" />
                <path d="M 60 330 L 0 390 L 100 350 Z" fill="url(#paint_front)" />

                {/* 3 Rotated Lines */}
                <g transform="rotate(-30 160 240)">
                  <rect x="90" y="200" width="100" height="12" rx="6" fill="white" />
                  <rect x="90" y="230" width="140" height="12" rx="6" fill="white" />
                  <rect x="90" y="260" width="120" height="12" rx="6" fill="white" />
                </g>

                <defs>
                  <linearGradient id="paint_front" x1="30" y1="110" x2="290" y2="370" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#60A5FA" stop-opacity="0.95" />
                    <stop offset="1" stop-color="#3B82F6" stop-opacity="0.85" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Logo */}
            <div className="z-10 mt-20 ml-16 mb-20 flex flex-col text-white">
              <h1 className="text-[4.5rem] font-black tracking-widest leading-none select-none">
                EKKO
              </h1>
              <span className="text-2xl font-black tracking-[0.55em] mt-3 ml-2 select-none">
                LOOP
              </span>
            </div>

            {/* Content */}
            <div className="z-10 max-w-lg mb-20 ml-16">
              <h2 className="text-5xl font-bold mb-6 leading-tight">{title}</h2>
              <p className="text-blue-100/90 text-[20px] mb-12 leading-relaxed">
                {subtitle}
              </p>

              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full border border-blue-100 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-blue-100" strokeWidth={3} />
                    </div>
                    <span className="text-white text-[19px] font-light tracking-wide">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
