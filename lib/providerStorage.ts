import AsyncStorage from '@react-native-async-storage/async-storage';

const PROVIDERS_KEY = 'healthee:providers';

export interface ProviderEntry {
  id: string;
  name?: string;
  clinic?: string;
  createdAt: string;
}

export async function loadProviders(): Promise<ProviderEntry[]> {
  try {
    const data = await AsyncStorage.getItem(PROVIDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load providers', err);
    return [];
  }
}

export async function saveProvider(provider: ProviderEntry): Promise<void> {
  try {
    const providers = await loadProviders();
    // Avoid duplicates
    const exists = providers.some(p => 
      (p.name && p.name === provider.name) && 
      (p.clinic && p.clinic === provider.clinic)
    );
    
    if (!exists) {
      providers.push(provider);
      await AsyncStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
    }
  } catch (err) {
    console.error('Failed to save provider', err);
  }
}

export async function saveProviders(providers: ProviderEntry[]): Promise<void> {
  await AsyncStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
}

export async function deleteProvider(id: string): Promise<void> {
  try {
    const providers = await loadProviders();
    const updated = providers.filter(p => p.id !== id);
    await AsyncStorage.setItem(PROVIDERS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete provider', err);
  }
}

export async function clearProviders(): Promise<void> {
  await AsyncStorage.removeItem(PROVIDERS_KEY);
}
