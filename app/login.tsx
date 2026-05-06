import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Credenciais simuladas
const USUARIO_SIMULADO = {
  email: 'usuario@email.com',
  senha: '123456',
};

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleEntrar() {
    setErro('');

    if (!email.trim()) {
      setErro('Informe o e-mail.');
      return;
    }
    if (!senha.trim()) {
      setErro('Informe a senha.');
      return;
    }

    setCarregando(true);

    // Simula delay de requisição
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (
      email.trim().toLowerCase() === USUARIO_SIMULADO.email &&
      senha === USUARIO_SIMULADO.senha
    ) {
      router.replace('/(tabs)');
    } else {
      setErro('E-mail ou senha incorretos.');
      setCarregando(false);
    }
  }

  function handleEsqueciSenha() {
    // TODO: navegar para tela de recuperação de senha
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 items-center justify-center px-8 gap-6">

          {/* Logo / Nome do app */}
          <Text className="text-5xl font-black text-center text-neutral-900 dark:text-neutral-100 leading-tight">
            Nome ou{'\n'}um{'\n'}emblema{'\n'}do app
          </Text>

          {/* Título LOGIN */}
          <Text className="text-base font-bold tracking-widest text-neutral-900 dark:text-neutral-100">
            LOGIN
          </Text>

          {/* Campos */}
          <View className="w-full gap-3">
            <TextInput
              className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900"
              placeholder="EMAIL"
              placeholderTextColor="#9BA1A6"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(v) => { setEmail(v); setErro(''); }}
            />

            <TextInput
              className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900"
              placeholder="SENHA"
              placeholderTextColor="#9BA1A6"
              secureTextEntry
              value={senha}
              onChangeText={(v) => { setSenha(v); setErro(''); }}
            />
          </View>

          {/* Mensagem de erro */}
          {erro ? (
            <Text className="text-sm text-red-500 text-center -mt-2">
              {erro}
            </Text>
          ) : null}

          {/* Checkbox */}
          <View className="flex-row items-center gap-2">
            <Checkbox
              value={lembrar}
              onValueChange={setLembrar}
              color={lembrar ? '#0a7ea4' : undefined}
            />
            <Text className="text-sm text-neutral-700 dark:text-neutral-300">
              Lembrar senha
            </Text>
          </View>

          {/* Botão Entrar */}
          <Pressable
            onPress={handleEntrar}
            disabled={carregando}
            className="bg-[#0a7ea4] active:opacity-80 disabled:opacity-50 rounded-lg px-12 py-3 min-w-[140px] items-center"
          >
            {carregando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold tracking-widest text-base">
                ENTRAR
              </Text>
            )}
          </Pressable>

          {/* Esqueci minha senha */}
          <Pressable onPress={handleEsqueciSenha}>
            <Text className="text-sm text-neutral-500 underline">
              Esqueci minha senha
            </Text>
          </Pressable>



        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
