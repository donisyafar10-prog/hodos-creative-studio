import HelixRibbonHero from '@/components/ui/helix-ribbon-hero'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <Navbar />
      <HelixRibbonHero
        greeting="Selamat Datang"
        name="Hodos Creative Studio"
        brand="Hodos Creative Studio"
        links={[
          { label: "Home", href: "/" },
          { label: "Service", href: "/events" },
          { label: "About", href: "/registrasi" },
          { label: "Contact", href: "/ranking" },
        ]}
        count="(  Event  Renang  &  Selam  )"
        bio="Platform pengelolaan event lomba renang dan selam terintegrasi untuk atlet, wasit, dan penonton."
        scrollHint="Geser ke bawah"
        background="#f2140c"
        foreground="#f7f3ee"
        autoPlay={false}
        portrait=""
      />
      <style>{`
        .hrh-port { display: none !important; }
        .hrh-count { top: calc(50vh + 12px) !important; }
      `}</style>
      <Footer />
    </div>
  )
}
