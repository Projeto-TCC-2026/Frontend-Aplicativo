import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Screen, TextField } from '@/components/ui';
import { ApiClientError } from '@/src/infrastructure/api/api-client';
import { createApiClient } from '@/src/infrastructure/api/api-config';

export default function Login() {
  const [email, setEmail] = useState('patient1@tcc.com'); const [password, setPassword] = useState('123456'); const [loading, setLoading] = useState(false); const [errorMessage, setErrorMessage] = useState<string | null>(null);
  async function submit() { if (!email.trim() || !password) { setErrorMessage('Informe seu e-mail e sua senha.'); return; } setLoading(true); setErrorMessage(null); try { await createApiClient().loginPatient(email.trim(), password); router.replace('/' as never); } catch (error) { setErrorMessage(error instanceof ApiClientError && error.status === 401 ? 'E-mail ou senha inválidos.' : error instanceof Error ? error.message : 'Não foi possível fazer login.'); } finally { setLoading(false); } }
  return <Screen className="items-center justify-center bg-neutral-100 p-5"><View className="w-full max-w-[480px] gap-4 rounded-[14px] bg-white p-6"><Text className="font-display text-[28px] font-extrabold text-neutral-900">Recupera Saúde</Text><Text className="font-body text-[15px] leading-[22px] text-neutral-700">Entre para acessar seu check-in diário.</Text><TextField autoCapitalize="none" disabled={loading} label="E-mail" onChangeText={setEmail} placeholder="seu@email.com" type="email" value={email} /><TextField disabled={loading} label="Senha" onChangeText={setPassword} placeholder="Sua senha" type="password" value={password} />{errorMessage ? <Text accessibilityRole="alert" className="font-body text-[13px] text-semantic-critical">{errorMessage}</Text> : null}<Button fullWidth loading={loading} loadingText="Entrando..." onPress={() => void submit()}>Entrar</Button></View></Screen>;
}
