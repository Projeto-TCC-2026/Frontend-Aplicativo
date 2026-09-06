import Toast from 'react-native-toast-message';

export const notify = {
  error(message: string, title = 'Não foi possível concluir') {
    Toast.show({ type: 'error', text1: title, text2: message });
  },
  success(message: string, title = 'Feito') {
    Toast.show({ type: 'success', text1: title, text2: message });
  },
  info(message: string, title?: string) {
    Toast.show({ type: 'info', text1: title, text2: message });
  },
};
