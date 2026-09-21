import { View } from 'react-native';

/**
 * Esqueleto no formato dos cards da Home. Blocos cinza arredondados, sem
 * spinner e sem dependência externa.
 */
export function HomeSkeleton() {
  return (
    <View accessibilityLabel="Carregando suas informações" accessible className="gap-6">
      <Block className="h-7 w-[55%]" />

      <View className="gap-3 rounded-[14px] border border-neutral-150 bg-white p-6 dark:border-theme-dark-border dark:bg-theme-dark-surface">
        <Block className="h-5 w-[40%]" />
        <Block className="h-3 w-full" />
        <Block className="h-6 w-[75%]" />
        <Block className="h-4 w-1/2" />
      </View>

      <View className="gap-3 rounded-[14px] border border-neutral-150 bg-white p-6 dark:border-theme-dark-border dark:bg-theme-dark-surface">
        <Block className="h-6 w-[65%]" />
        <Block className="h-[52px] w-full" />
      </View>
    </View>
  );
}

function Block({ className }: { className: string }) {
  return <View className={`rounded-[9px] bg-neutral-150 dark:bg-theme-dark-border ${className}`} />;
}
