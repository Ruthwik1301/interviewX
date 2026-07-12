import Hero from "./sections/Hero";
import Features from "./sections/Features";
import HowItWorks from "./sections/HowItWorks";
import CybersecurityTracks from "./sections/CybersecurityTracks";
import ProductPreview from "./sections/ProductPreview";
import AIFeedback from "./sections/AIFeedback";
import TrustedBy from "./sections/TrustedBy";
import Pricing from "./sections/Pricing";
import Footer from "./sections/Footer";

export default function LandingPage() {
  return (
    <>
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CybersecurityTracks />
        <ProductPreview />
        <AIFeedback />
        <TrustedBy />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
