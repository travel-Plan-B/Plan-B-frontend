import { FinalCTASection } from "./FinalCTASection";
import { HeroSection } from "./HeroSection";
import { ProblemSection } from "./ProblemSection";
import { RecoveryComparisonSection } from "./RecoveryComparisonSection";
import { RecoveryProcessSection } from "./RecoveryProcessSection";
import { RecoveryTypeSection } from "./RecoveryTypeSection";

export function HomePage() {
  return (
    <div className="relative left-1/2 flex w-screen -translate-x-1/2 flex-col bg-white pb-16 sm:pb-20">
      <HeroSection />
      <ProblemSection />
      <RecoveryComparisonSection />
      <RecoveryProcessSection />
      <RecoveryTypeSection />
      <FinalCTASection />
    </div>
  );
}
