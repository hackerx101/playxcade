export interface FeatureFlags {
  minor_maintenance: boolean;
  is_migration: boolean;
  migration_status: 'pending' | 'completed' | 'none';
  restricted_regions: string[];
  region_code: string;
  features_by_region: Record<string, boolean>;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  minor_maintenance: false,
  is_migration: false,
  migration_status: 'none',
  restricted_regions: ['KP', 'RU', 'SV'],
  region_code: 'US',
  features_by_region: {
    cloud_gaming: true,
    social_feed: true,
    direct_messages: true,
    identity_verify: true,
  }
};

export const getFeatureFlags = (): FeatureFlags => {
  try {
    const stored = localStorage.getItem('garexcell_feature_flags');
    if (stored) {
      return { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Could not read feature flags from localStorage', e);
  }
  return DEFAULT_FEATURE_FLAGS;
};

export const saveFeatureFlags = (flags: Partial<FeatureFlags>): FeatureFlags => {
  const current = getFeatureFlags();
  const updated = { ...current, ...flags };
  try {
    localStorage.setItem('garexcell_feature_flags', JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save feature flags to localStorage', e);
  }
  return updated;
};

export const isFeatureEnabledForRegion = (featureName: string, countryCode: string): boolean => {
  const flags = getFeatureFlags();
  if (flags.restricted_regions.includes(countryCode.toUpperCase())) {
    return false;
  }
  return flags.features_by_region[featureName] ?? true;
};
