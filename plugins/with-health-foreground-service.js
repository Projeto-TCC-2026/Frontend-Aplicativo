const { withAndroidManifest } = require('@expo/config-plugins');

const SERVICE_NAME = 'com.asterinet.react.bgactions.RNBackgroundActionsTask';

module.exports = function withHealthForegroundService(config) {
  return withAndroidManifest(config, config => {
    const application = config.modResults.manifest.application?.[0];
    if (!application) {
      throw new Error('AndroidManifest.xml não contém uma tag application.');
    }

    config.modResults.manifest.application[0].$['android:usesCleartextTraffic'] = 'true';
    application.service ??= [];
    const service = application.service.find(
      entry => entry.$?.['android:name'] === SERVICE_NAME,
    );
    const attributes = service?.$ ?? { 'android:name': SERVICE_NAME };

    attributes['android:exported'] = 'false';
    attributes['android:foregroundServiceType'] = 'health';

    if (service) {
      service.$ = attributes;
    } else {
      application.service.push({ $: attributes });
    }

    return config;
  });
};
