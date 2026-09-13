import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { colors } from '@/constants/design-tokens';

export function AppTabs() {
  return (
    <NativeTabs tintColor={colors.primary} iconColor={{ default: colors.neutral500, selected: colors.primary }} indicatorColor={colors.aquaSoft} rippleColor={colors.aquaSoft} labelVisibilityMode="unlabeled">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label hidden />
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md={{ default: 'home', selected: 'home' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="smartwatch">
        <NativeTabs.Trigger.Label hidden />
        <NativeTabs.Trigger.Icon sf={{ default: 'applewatch', selected: 'applewatch' }} md={{ default: 'watch', selected: 'watch' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notificacoes">
        <NativeTabs.Trigger.Label hidden />
        <NativeTabs.Trigger.Icon sf={{ default: 'bell', selected: 'bell.fill' }} md={{ default: 'notifications', selected: 'notifications' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="configuracoes">
        <NativeTabs.Trigger.Label hidden />
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md={{ default: 'settings', selected: 'settings' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
