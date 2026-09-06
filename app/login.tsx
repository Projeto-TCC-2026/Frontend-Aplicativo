import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ApiClientError } from '@/src/infrastructure/api/api-client';
import { createApiClient } from '@/src/infrastructure/api/api-config';
import { colors, fonts, radii } from '@/constants/design-tokens';

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
      router.replace('/');
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        setErrorMessage('E-mail ou senha inválidos.');
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Não foi possível fazer login.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Recupera Saúde</Text>
        <Text style={styles.subtitle}>Entre para acessar seu check-in diário.</Text>

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="seu@email.com"
          style={styles.input}
          value={email}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          editable={!loading}
          onChangeText={setPassword}
          placeholder="Sua senha"
          secureTextEntry
          style={styles.input}
          value={password}
        />

        {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={() => void submit()}
          style={[styles.button, loading && styles.disabled]}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Entrar</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', backgroundColor: colors.neutral100, flex: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: colors.white, borderRadius: radii.lg, maxWidth: 480, padding: 24, width: '100%' },
  title: { color: colors.neutral900, fontFamily: fonts.display, fontSize: 28, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: colors.neutral700, fontFamily: fonts.body, fontSize: 15, lineHeight: 22, marginBottom: 24 },
  label: { color: colors.neutral900, fontFamily: fonts.body, fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderColor: colors.neutral300, borderRadius: radii.sm, borderWidth: 1, color: colors.neutral900, fontFamily: fonts.body, fontSize: 15, minHeight: 48, paddingHorizontal: 14 },
  error: { color: colors.critical, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, marginTop: 14 },
  button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radii.sm, justifyContent: 'center', marginTop: 22, minHeight: 52 },
  buttonText: { color: colors.white, fontFamily: fonts.body, fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.7 },
});
