
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrbitingParticles from "@/components/OrbitingParticles";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <OrbitingParticles />
      <Navbar />
      <main className="min-h-screen overflow-hidden bg-[#080b16] bg-gradient-to-b from-[#0a0e1c] to-[#070a14]">
        {children}
      </main>
      <Footer />
    </>
  );
};

export default Layout;
