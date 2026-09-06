import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Screen } from '@/components/ui';
import { createApiClient } from '@/src/infrastructure/api/api-config';

export default function Settings() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await createApiClient().logout();
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }

  return <Screen className="gap-5 bg-neutral-100 p-5"><Text className="font-display text-[30px] font-extrabold text-neutral-900">Configurações</Text><Text className="font-body text-[15px] text-neutral-700">Preferências e acesso à sua conta.</Text><Button fullWidth loading={loading} loadingText="Saindo..." variant="destructive" onPress={() => void logout()}>Sair</Button></Screen>;
}
