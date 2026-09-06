import { NativeTabs } from 'expo-router/unstable-native-tabs';

export function AppTabs() {
  return (
    <NativeTabs tintColor="#0C4C8A" iconColor={{ default: '#7C8DA1', selected: '#0C4C8A' }} indicatorColor="#AEDEDE" rippleColor="#AEDEDE" labelVisibilityMode="unlabeled">
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
