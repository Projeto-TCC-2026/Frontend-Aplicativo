import { Text } from 'react-native';
import { Screen } from '@/components/ui';

export default function Smartwatch() {
  return <Screen className="items-center justify-center bg-neutral-100 p-6 dark:bg-theme-dark-background"><Text className="font-display text-2xl font-bold text-neutral-900 dark:text-theme-dark-text-primary">Meu smartwatch</Text><Text className="mt-2 text-center font-body text-neutral-700 dark:text-theme-dark-text-secondary">Esta área será configurada em uma próxima etapa.</Text></Screen>;
}
