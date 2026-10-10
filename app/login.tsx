import { Button, TextField } from '@/components/ui';
import { ApiClientError } from '@/src/infrastructure/api/api-client';
import { createApiClient } from '@/src/infrastructure/api/api-config';
import { syncPushRegistration } from '@/src/infrastructure/api/push-service';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
  const [email, setEmail] = useState('patient1@tcc.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit() {
    if (!email.trim() || !password) {
      setErrorMessage('Informe seu e-mail e sua senha.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await createApiClient().loginPatient(email.trim(), password);
      void syncPushRegistration();
      router.replace('/' as never);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError && error.status === 401
          ? 'E-mail ou senha inválidos.'
          : error instanceof Error
            ? error.message
            : 'Não foi possível fazer login.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark dark:bg-theme-dark-background">
      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Topo com imagem de fundo e logo */}
          <View className="flex-1 items-center justify-center py-16">
            <Image
              contentFit="cover"
              source={require('../assets/images/bg-pattern.png')}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <Image
              contentFit="contain"
              source={require('../assets/images/icon_rounded.png')}
              style={{ width: 150, height: 150 }}
            />
            <Text className="mt-5 font-display text-[26px] font-extrabold text-white">
              Recupera Saúde
            </Text>
          </View>

          {/* Card branco com bordas arredondadas no topo */}
          <View className="rounded-t-[32px] bg-white px-6 pb-10 pt-8 dark:bg-theme-dark-surface">
            <Text className="mb-1 font-display text-[24px] font-extrabold text-neutral-900 dark:text-theme-dark-text-primary">
              Login
            </Text>
            <Text className="mb-6 font-body text-[14px] text-neutral-500 dark:text-theme-dark-text-secondary">
              Entre com sua conta para continuar.
            </Text>

            <View className="gap-5">
              <TextField
                autoCapitalize="none"
                disabled={loading}
                label="E-mail"
                placeholder="seu@email.com"
                type="email"
                value={email}
                onChangeText={setEmail}
              />
              <TextField
                disabled={loading}
                label="Senha"
                placeholder="Sua senha"
                type="password"
                value={password}
                onChangeText={setPassword}
              />

              {errorMessage ? (
                <Text
                  accessibilityRole="alert"
                  className="font-body text-[13px] text-semantic-critical"
                >
                  {errorMessage}
                </Text>
              ) : null}

              <Button
                fullWidth
                loading={loading}
                loadingText="Entrando..."
                size="lg"
                onPress={() => void submit()}
              >
                Entrar
              </Button>

              <Text
                className="text-center font-body text-[13px] text-brand-dark underline dark:text-theme-dark-action"
                onPress={() => router.push('/esqueci-a-senha')}
              >
                Esqueci a senha
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
