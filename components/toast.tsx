import { Ionicons } from '@expo/vector-icons';
import { BaseToast, ErrorToast } from 'react-native-toast-message';

// Função que retorna a config do toast baseado no tema
const getToastConfig = (isDark: boolean) => {
  const bgColor = isDark ? '#1e1e1e' : '#fff';
  const textColor = isDark ? '#fff' : '#111';
  const secondaryTextColor = isDark ? '#ccc' : '#333';
  const borderColor = isDark ? '#333' : '#f0f0f0';

  return {
    success: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: 'transparent',
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderWidth: 1,
          borderRadius: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.5 : 0.2,
          shadowRadius: 4,
          elevation: 3,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        contentContainerStyle={{
          paddingHorizontal: 10,
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: '600',
          color: textColor,
        }}
        text2Style={{
          fontSize: 14,
          color: secondaryTextColor,
        }}
        renderLeadingIcon={() => (
          <Ionicons name="checkmark-circle" size={24} color={secondaryTextColor} style={{ marginRight: 10 }} />
        )}
      />
    ),

    error: (props: any) => (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: 'transparent',
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderWidth: 3,
          borderRadius: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.5 : 0.2,
          shadowRadius: 4,
          elevation: 3,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        contentContainerStyle={{
          paddingHorizontal: 10,
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: '600',
          color: textColor,
        }}
        text2Style={{
          fontSize: 14,
          color: secondaryTextColor,
        }}
        renderLeadingIcon={() => (
          <Ionicons name="close-circle" size={24} color="#FF3B30" style={{ marginRight: 10 }} />
        )}
      />
    ),

    warning: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: 'transparent',
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderWidth: 3,
          borderRadius: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.5 : 0.2,
          shadowRadius: 4,
          elevation: 3,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        contentContainerStyle={{
          paddingHorizontal: 10,
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: '600',
          color: textColor,
        }}
        text2Style={{
          fontSize: 14,
          color: secondaryTextColor,
        }}
        renderLeadingIcon={() => (
          <Ionicons name="alert-circle" size={24} color="#FFA500" style={{ marginRight: 10 }} />
        )}
      />
    ),

    info: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: 'transparent',
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderWidth: 3,
          borderRadius: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.5 : 0.2,
          shadowRadius: 4,
          elevation: 3,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        contentContainerStyle={{
          paddingHorizontal: 10,
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: '600',
          color: textColor,
        }}
        text2Style={{
          fontSize: 14,
          color: secondaryTextColor,
        }}
        renderLeadingIcon={() => (
          <Ionicons
            name="information-circle"
            size={24}
            color={isDark ? '#4DA3FF' : '#0288D1'}
            style={{ marginRight: 10 }}
          />
        )}
      />
    ),
  };
};

export default getToastConfig;
