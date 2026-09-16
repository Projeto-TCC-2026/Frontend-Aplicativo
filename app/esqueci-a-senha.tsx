import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View, useColorScheme } from 'react-native';
import { Button, Screen, TextField } from '@/components/ui';
import { createApiClient } from '@/src/infrastructure/api/api-config';
import { ApiClientError } from '@/src/infrastructure/api/api-client';
import { colors } from '@/constants/design-tokens';

type Step = 'request' | 'reset' | 'completed';
const CODE_LENGTH = 6;
const RESEND_DELAY_SECONDS = 120;

export default function EsqueciASenha() {
  const colorScheme = useColorScheme();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [codeDigits, setCodeDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(''));
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendRemaining, setResendRemaining] = useState(0);
  const codeInputRefs = useRef<(TextInput | null)[]>([]);
  const code = codeDigits.join('');

  useEffect(() => {
    if (resendRemaining <= 0) return;

    const timer = setInterval(() => {
      setResendRemaining(current => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendRemaining]);

  async function handleRequestCode() {
    if (!email.trim()) {
      setErrorMessage('Informe seu e-mail para continuar.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setCodeDigits(Array(CODE_LENGTH).fill(''));

    try {
      await createApiClient().requestPasswordReset(email.trim());
      startResendCooldown();
      setStep('reset');
    } catch {
      startResendCooldown();
      setStep('reset');
    } finally {
      setLoading(false);
    }
  }

  function startResendCooldown() {
    setResendRemaining(RESEND_DELAY_SECONDS);
  }

  function updateCodeDigit(index: number, value: string) {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      setCodeDigits(current => current.map((digit, currentIndex) => currentIndex === index ? '' : digit));
      return;
    }

    const nextDigits = [...codeDigits];
    digits.slice(0, CODE_LENGTH - index).split('').forEach((digit, offset) => {
      nextDigits[index + offset] = digit;
    });
    setCodeDigits(nextDigits);

    const nextIndex = Math.min(index + digits.length, CODE_LENGTH - 1);
    codeInputRefs.current[nextIndex]?.focus();
  }

  function handleCodeKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !codeDigits[index] && index > 0) {
      const previousIndex = index - 1;
      setCodeDigits(current => current.map((digit, currentIndex) => currentIndex === previousIndex ? '' : digit));
      codeInputRefs.current[previousIndex]?.focus();
    }
  }

  function formatRemainingTime(seconds: number) {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  async function handleResetPassword() {
    if (!code.trim()) {
      setErrorMessage('Informe o código de verificação recebido.');
      return;
    }
    if (!password || !passwordConfirmation) {
      setErrorMessage('Informe a nova senha e a confirmação.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== passwordConfirmation) {
      setErrorMessage('As senhas não conferem.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await createApiClient().resetPassword(code.trim(), password, passwordConfirmation);
      setStep('completed');
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : 'Não foi possível redefinir a senha.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen className="items-center justify-center bg-neutral-100 p-5 dark:bg-theme-dark-background">
      <View className="w-full max-w-[480px] gap-6 rounded-[20px] border border-neutral-150 bg-white pt-12 pb-10 px-6 shadow-lg dark:border-theme-dark-border dark:bg-theme-dark-surface">
        {step !== 'completed' && (
          <View className="py-2 absolute z-10 top-0 left-2">
            <Pressable
              accessibilityLabel="Voltar"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full active:bg-neutral-150 dark:active:bg-theme-dark-border"
              hitSlop={8}
              onPress={() => router.back()}
            >
              <Ionicons
                color={colorScheme === 'dark' ? colors.darkTextPrimary : colors.neutral700}
                name="arrow-back"
                size={24}
              />
            </Pressable>
          </View>
        )}

        {step === 'request' ? (
          <>
            <View className="items-center gap-2">
              <Text className="text-center font-display text-[28px] font-extrabold text-neutral-900 dark:text-theme-dark-text-primary">Recuperar senha</Text>
              <Text className="text-center font-body text-[14px] leading-[20px] text-neutral-700 dark:text-theme-dark-text-secondary">
                Informe seu e-mail para receber o código de recuperação.
              </Text>
            </View>

            <TextField autoCapitalize="none" disabled={loading} label="E-mail" onChangeText={setEmail} placeholder="seu@email.com" type="email" value={email} />

            {errorMessage ? <Text accessibilityRole="alert" className="font-body text-[13px] text-semantic-critical">{errorMessage}</Text> : null}

            <Button fullWidth loading={loading} loadingText="Enviando código..." onPress={() => void handleRequestCode()}>Enviar código</Button>
          </>
        ) : null}

        {step === 'reset' ? (
          <>
            <View className="items-center gap-2">
              <Text className="text-center font-display text-[28px] font-extrabold text-neutral-900 dark:text-theme-dark-text-primary">Digite o código</Text>
              <Text className="text-center font-body text-[14px] leading-[20px] text-neutral-700 dark:text-theme-dark-text-secondary">
                Se o email <Text className="font-semibold text-neutral-900 dark:text-theme-dark-text-primary">{email}</Text> estiver correto, enviamos o código de 6 dígitos para ele. Informe-o junto com sua nova senha.
              </Text>
            </View>

            <View className="gap-2">
              <Text className="font-body text-sm font-semibold text-neutral-900 dark:text-theme-dark-text-primary">Código de 6 dígitos</Text>
              <View className="flex-row justify-between gap-2">
                {codeDigits.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={input => { codeInputRefs.current[index] = input; }}
                    accessibilityLabel={`Dígito ${index + 1} do código`}
                    autoComplete="one-time-code"
                    editable={!loading}
                    keyboardType="number-pad"
                    maxLength={CODE_LENGTH}
                    onChangeText={value => updateCodeDigit(index, value)}
                    onKeyPress={({ nativeEvent }) => handleCodeKeyPress(index, nativeEvent.key)}
                    selectTextOnFocus
                    textContentType="oneTimeCode"
                    value={digit}
                    className="h-14 flex-1 rounded-xl border-[1.5px] border-neutral-300 bg-white text-center font-data text-xl font-semibold text-neutral-900 dark:border-theme-dark-input-border dark:bg-theme-dark-surface dark:text-theme-dark-text-primary"
                  />
                ))}
              </View>
            </View>

            <TextField disabled={loading} label="Nova senha" onChangeText={setPassword} placeholder="Sua nova senha" type="password" value={password} />
            <TextField disabled={loading} label="Confirmar nova senha" onChangeText={setPasswordConfirmation} placeholder="Repita a nova senha" type="password" value={passwordConfirmation} />

            {errorMessage ? <Text accessibilityRole="alert" className="font-body text-[13px] text-semantic-critical">{errorMessage}</Text> : null}

            <Button fullWidth loading={loading} loadingText="Redefinindo..." onPress={() => void handleResetPassword()}>Redefinir senha</Button>

            <View className="items-center gap-3">
              <Pressable className="flex-row items-center gap-2" accessibilityRole="button" disabled={resendRemaining > 0 || loading} onPress={() => void handleRequestCode()}>
                {resendRemaining > 0 ?
                  (<Text className="text-neutral-500 dark:text-theme-dark-text-tertiary">Reenviar código em {formatRemainingTime(resendRemaining)}</Text>) :
                  <Text className={`font-body text-[13px] underline ${resendRemaining > 0 || loading ? 'text-neutral-500 dark:text-theme-dark-text-tertiary' : 'text-brand-dark dark:text-theme-dark-action'}`}>Reenviar código</Text>}
              </Pressable>
            </View>
          </>
        ) : null}

        {step === 'completed' ? (
          <>
            <View className="items-center gap-2">
              <Text className="font-display text-[26px] font-extrabold text-neutral-900 dark:text-theme-dark-text-primary">Senha redefinida!</Text>
              <Text className="font-body text-[14px] leading-[20px] text-neutral-700 dark:text-theme-dark-text-secondary">
                Sua senha foi alterada com sucesso. Você já pode fazer login na sua conta.
              </Text>
            </View>

            <Button fullWidth onPress={() => router.replace('/login')}>Ir para o login</Button>
          </>
        ) : null}
      </View>
    </Screen>
  );
}
