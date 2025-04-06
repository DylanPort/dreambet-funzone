
import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import OrbitingParticles from '@/components/OrbitingParticles';
import VolumeFilteredTokens from '@/components/VolumeFilteredTokens';
import PumpFunTokens from '@/components/PumpFunTokens';
import { supabase } from '@/integrations/supabase/client';

const TokenBetting = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        setIsLoading(true);
        // Fetch top tokens by volume
        const { data, error } = await supabase
          .from('tokens')
          .select('*')
          .order('volume_24h', { ascending: false })
          .limit(20);
          
        if (error) {
          console.error('Error fetching token data:', error);
        }
      } catch (error) {
        console.error('Error fetching token data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTokenData();
  }, []);

  return (
    <>
      <OrbitingParticles />
      <Navbar />
      
      <main className="pt-24 min-h-screen overflow-hidden px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center text-dream-foreground/70 hover:text-dream-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-display font-bold mb-6">Trending Tokens</h1>
          
          <div className="space-y-12">
            <VolumeFilteredTokens />
            <PumpFunTokens />
          </div>
        </div>
      </main>
    </>
  );
};

export default TokenBetting;
