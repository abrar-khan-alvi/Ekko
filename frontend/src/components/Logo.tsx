import { LucideProps } from 'lucide-react';

export const Logo = (props: LucideProps) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-5xl font-black text-[#4355FF] tracking-tighter" style={{ fontFamily: 'Inter, sans-serif' }}>EKKO</h1>
      <span className="text-[#2D3680] font-bold tracking-[0.3em] text-sm mt-1">LOOP</span>
    </div>
  );
};
