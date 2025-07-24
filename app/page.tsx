import { HeroSection } from '@/components/sections/hero'
import Features from '@/components/sections/features'
import HowItWorks from '@/components/sections/how-it-works'
import Pricing from '@/components/sections/pricing'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <Features />
      <HowItWorks />
      <Pricing />
    </main>
  );
} 