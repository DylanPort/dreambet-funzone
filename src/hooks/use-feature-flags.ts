
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  id: string;
  feature_name: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useFeatureFlags(featureName?: string) {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchFeatures() {
      try {
        setIsLoading(true);
        
        let query = supabase
          .from('app_features')
          .select('*')
          .eq('is_active', true);
          
        if (featureName) {
          query = query.eq('feature_name', featureName);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        setFeatures(data || []);
      } catch (err) {
        console.error('Error fetching feature flags:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch feature flags'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeatures();
  }, [featureName]);

  const isFeatureEnabled = (name: string): boolean => {
    const feature = features.find(f => f.feature_name === name);
    if (!feature) return false;
    
    const now = new Date();
    const startDate = new Date(feature.start_date);
    const endDate = new Date(feature.end_date);
    
    return feature.is_active && now >= startDate && now <= endDate;
  };

  const getFeatureConfig = (name: string): Record<string, any> | null => {
    const feature = features.find(f => f.feature_name === name);
    return feature ? feature.config : null;
  };

  const getTimeRemaining = (name: string): number | null => {
    const feature = features.find(f => f.feature_name === name);
    if (!feature) return null;
    
    const now = new Date();
    const endDate = new Date(feature.end_date);
    
    if (now > endDate) return 0;
    return endDate.getTime() - now.getTime();
  };

  return { 
    features, 
    isLoading, 
    error, 
    isFeatureEnabled, 
    getFeatureConfig,
    getTimeRemaining 
  };
}
