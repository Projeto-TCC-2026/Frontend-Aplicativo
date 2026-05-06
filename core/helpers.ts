import { Platform } from 'react-native';

export const normalizeUri = (uri: string) => {
  if (Platform.OS === 'android' && !uri.startsWith('file://')) {
    return 'file://' + uri;
  }
  return uri;
};

export const timestamp = () => {
  const data = new Date();

  const dia = data.getDate();
  const mes = data.getMonth();
  const ano = data.getFullYear();

  const hora = data.getHours();
  const minutos = data.getMinutes();
  const segundos = data.getSeconds();

  const dataFormatada = `${ano}-${mes}-${dia} ${hora}:${minutos}:${segundos}`;

  return dataFormatada;
};

export function formatCNPJ(cnpj: string): string {
  if (!cnpj) return '';

  return cnpj
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}