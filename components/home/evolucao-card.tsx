import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export function EvolucaoCard() {
  // Dados mockados - últimos 7 dias
  const evolucao = {
    dor: { valor: 3, max: 10, label: 'Dor', cor: '#ef4444', tendencia: 'down' as const },
    bemestar: { valor: 8, max: 10, label: 'Bem-estar', cor: '#10b981', tendencia: 'up' as const },
    mobilidade: { valor: 7, max: 10, label: 'Mobilidade', cor: '#3b82f6', tendencia: 'up' as const },
  };

  const BarraProgresso = ({ 
    label, 
    valor, 
    max, 
    cor, 
    tendencia 
  }: { 
    label: string; 
    valor: number; 
    max: number; 
    cor: string; 
    tendencia: 'up' | 'down' | 'stable';
  }) => {
    const porcentagem = (valor / max) * 100;
    const tendenciaIcon = 
      tendencia === 'up' ? 'trending-up' : 
      tendencia === 'down' ? 'trending-down' : 
      'remove';

    return (
      <View className="mb-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {label}
          </Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {valor}/{max}
            </Text>
            <Ionicons 
              name={tendenciaIcon} 
              size={14} 
              color={tendencia === 'up' ? '#10b981' : tendencia === 'down' ? '#ef4444' : '#9BA1A6'} 
            />
          </View>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <View
            className="h-full rounded-full"
            style={{
              width: `${porcentagem}%`,
              backgroundColor: cor,
            }}
          />
        </View>
      </View>
    );
  };

  return (
    <View
      className="overflow-hidden rounded-3xl bg-white p-5 dark:bg-neutral-900"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          Evolução
        </Text>
        <View className="rounded-full bg-orange-500/10 p-1.5">
          <Ionicons name="bar-chart" size={18} color="#f97316" />
        </View>
      </View>

      <Text className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
        Últimos 7 dias
      </Text>

      <BarraProgresso
        label={evolucao.dor.label}
        valor={evolucao.dor.valor}
        max={evolucao.dor.max}
        cor={evolucao.dor.cor}
        tendencia={evolucao.dor.tendencia}
      />

      <BarraProgresso
        label={evolucao.bemestar.label}
        valor={evolucao.bemestar.valor}
        max={evolucao.bemestar.max}
        cor={evolucao.bemestar.cor}
        tendencia={evolucao.bemestar.tendencia}
      />

      <BarraProgresso
        label={evolucao.mobilidade.label}
        valor={evolucao.mobilidade.valor}
        max={evolucao.mobilidade.max}
        cor={evolucao.mobilidade.cor}
        tendencia={evolucao.mobilidade.tendencia}
      />
    </View>
  );
}
