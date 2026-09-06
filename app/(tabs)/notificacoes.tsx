import { Text } from 'react-native';
import { Screen } from '@/components/ui';

export default function Notifications() {
  return <Screen className="items-center justify-center bg-neutral-100 p-6"><Text className="font-display text-2xl font-bold text-neutral-900">Notificações</Text><Text className="mt-2 text-center font-body text-neutral-700">Suas notificações aparecerão aqui.</Text></Screen>;
}
