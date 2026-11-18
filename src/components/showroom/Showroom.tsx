import type { Slots } from "@/types/slots";
import { ShowroomProviders } from "./Providers";

/**
 * Renders the Showroom from a map of slots. Main and every variant use this same
 * component, so any slot can be swapped without touching the page structure.
 */
export function Showroom({ slots }: { slots: Slots }) {
  const { Nav, Stage, Hero, About, Services, Schools, Work, Referral, Partners, Join, Footer, WhatsAppFab, RegistrationPanel } = slots;
  return (
    <ShowroomProviders>
      <Nav />
      <Stage />
      <main id="top" data-inert-on-modal className="relative z-[1]">
        <Hero />
        <About />
        <Services />
        <Schools />
        <Work />
        <Referral />
        <Partners />
        <Join />
      </main>
      <Footer />
      <WhatsAppFab />
      <RegistrationPanel />
    </ShowroomProviders>
  );
}
