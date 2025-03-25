
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

export async function getFeatureFlag(featureName: string): Promise<FeatureFlag | null> {
  try {
    const { data, error } = await supabase
      .from('app_features')
      .select('*')
      .eq('feature_name', featureName)
      .eq('is_active', true)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching feature flag:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Check if the feature is still valid based on date range
    const now = new Date();
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    
    if (now < startDate || now > endDate) return null;
    
    return {
      ...data,
      config: data.config as Record<string, any>
    };
  } catch (error) {
    console.error('Unexpected error in getFeatureFlag:', error);
    return null;
  }
}

export async function getAllActiveFeatures(): Promise<FeatureFlag[]> {
  try {
    const { data, error } = await supabase
      .from('app_features')
      .select('*')
      .eq('is_active', true);
      
    if (error) {
      console.error('Error fetching feature flags:', error);
      return [];
    }
    
    const now = new Date();
    
    // Filter features based on date ranges and convert config to the correct type
    return (data || [])
      .filter(feature => {
        const startDate = new Date(feature.start_date);
        const endDate = new Date(feature.end_date);
        return now >= startDate && now <= endDate;
      })
      .map(feature => ({
        ...feature,
        config: feature.config as Record<string, any>
      }));
  } catch (error) {
    console.error('Unexpected error in getAllActiveFeatures:', error);
    return [];
  }
}
