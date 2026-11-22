import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, useColorScheme, View } from 'react-native';

import { Button, Card, Screen, TextField } from '@/components/ui';
import { colors } from '@/constants/design-tokens';
import { createApiClient } from '@/src/infrastructure/api/api-config';
import { removePushRegistration } from '@/src/infrastructure/api/push-service';

type Section = 'main' | 'editAccount' | 'changePassword' | 'privacyPolicy' | 'about';

// Componente do item de menu reutilizável
function MenuItem({
  label,
  icon,
  description,
  onPress,
  showDivider = true,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description?: string;
  onPress: () => void;
  showDivider?: boolean;
}) {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? colors.darkTextPrimary : colors.neutral900;

  return (
    <>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        className="flex-row items-center gap-3 py-6 active:opacity-60"
        onPress={onPress}
      >
        <Ionicons color={iconColor} name={icon} size={22} />
        <Text className="font-body text-[17px] font-semibold text-neutral-900 dark:text-theme-dark-text-primary">{label}</Text>
      </Pressable>
      {showDivider && <View className="h-px bg-neutral-150 dark:bg-theme-dark-border" />}
    </>
  );
}

// Header interno reutilizável
function SubScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View className="flex-row items-center gap-3 p-6">
      <Pressable
        accessibilityLabel="Voltar"
        accessibilityRole="button"
        className="rounded-full p-1"
        onPress={onBack}
      >
        <Ionicons color={colors.primary} name="arrow-back" size={24} />
      </Pressable>
      <Text className="font-display text-[22px] font-extrabold text-neutral-900 dark:text-theme-dark-text-primary">
        {title}
      </Text>
    </View>
  );
}

export default function Settings() {
  const [section, setSection] = useState<Section>('main');
  const [loading, setLoading] = useState(false);

  // Campos de edição de conta
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFetching, setProfileFetching] = useState(false);

  async function openEditAccount() {
    setProfileFetching(true);
    setProfileError(null);
    try {
      const profile = await createApiClient().getProfile();
      setName(profile.fullName ?? '');
      setEmail(profile.email ?? '');
      setPhone(profile.phone ?? '');
    } catch (err) {
      console.log('[editar conta] erro:', err);
      setName('');
      setEmail('');
      setPhone('');
    } finally {
      setProfileFetching(false);
    }
    setSection('editAccount');
  }

  // Campos de alteração de senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function handleChangePassword() {
    setPasswordError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Preencha todos os campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('A nova senha e a confirmação não coincidem.');
      return;
    }

    setPasswordLoading(true);
    try {
      await createApiClient().changePassword(currentPassword, newPassword, confirmPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSection('main');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível alterar a senha.';
      setPasswordError(message);
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleUpdateProfile() {
    setProfileError(null);

    if (!name.trim()) {
      setProfileError('O nome completo é obrigatório.');
      return;
    }

    setProfileLoading(true);
    try {
      await createApiClient().updateProfile({
        fullName: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setSection('main');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível salvar as alterações.';
      setProfileError(message);
    } finally {
      setProfileLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    try {
      await removePushRegistration();
      await createApiClient().logout();
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }

  // Tela: Editar conta
  if (section === 'editAccount') {
    return (
      <Screen className="bg-neutral-100 dark:bg-theme-dark-background">
        <SubScreenHeader title="Editar conta" onBack={() => setSection('main')} />
        <ScrollView className="flex-1 px-8" contentContainerStyle={{ gap: 16, paddingBottom: 32 }}>
          <Card subtitle="Atualize suas informações de contato." title="Dados pessoais">
            <View className="gap-4 p-2">
              <TextField
                label="Nome completo"
                placeholder="Seu nome"
                value={name}
                onChangeText={setName}
              />
              <TextField
                autoCapitalize="none"
                label="E-mail"
                placeholder="seu@email.com"
                type="email"
                value={email}
                onChangeText={setEmail}
              />
              <TextField
                label="Telefone"
                placeholder="(00) 00000-0000"
                type="tel"
                value={phone}
                onChangeText={setPhone}
              />
              {profileError ? (
                <Text className="font-body text-sm text-semantic-critical">{profileError}</Text>
              ) : null}
            </View>

            <View className="gap-3 mt-5 flex flex-row justify-end">
              <Button fullWidth variant="secondary" onPress={() => setSection('main')}>
                Cancelar
              </Button>

              <Button
                fullWidth
                loading={profileLoading}
                loadingText="Salvando..."
                variant="primary"
                onPress={() => void handleUpdateProfile()}
              >
                Salvar alterações
              </Button>
            </View>
          </Card>

        </ScrollView>
      </Screen>
    );
  }

  // Tela: Quem somos
  if (section === 'about') {
    return (
      <Screen className="bg-neutral-100 dark:bg-theme-dark-background">
        <SubScreenHeader title="Quem somos" onBack={() => setSection('main')} />
        <View className="flex-1 px-5 pb-8">
          <Card padding="lg">
            <View className="gap-5">
              <View className="gap-2">
                <Text className="font-display text-base font-bold text-neutral-900 dark:text-theme-dark-text-primary">
                  Nossa missão
                </Text>
                <Text className="text-justify font-body text-[14px] leading-5 text-neutral-700 dark:text-theme-dark-text-secondary">
                  Somos uma equipe dedicada a transformar o acompanhamento pós-operatório por meio da tecnologia. Nossa missão é conectar pacientes e equipes médicas de forma simples, segura e eficiente, promovendo uma recuperação mais tranquila e bem monitorada.
                </Text>
              </View>

              <View className="h-px bg-neutral-150 dark:bg-theme-dark-border" />

              <View className="gap-2">
                <Text className="font-display text-base font-bold text-neutral-900 dark:text-theme-dark-text-primary">
                  O que fazemos
                </Text>
                <Text className="text-justify font-body text-[14px] leading-5 text-neutral-700 dark:text-theme-dark-text-secondary">
                  Desenvolvemos soluções digitais que permitem ao paciente registrar seu progresso diário, receber orientações personalizadas e manter contato com sua equipe de saúde — tudo em um único lugar, direto pelo celular.
                </Text>
              </View>

              <View className="h-px bg-neutral-150 dark:bg-theme-dark-border" />

              <View className="gap-2">
                <Text className="font-display text-base font-bold text-neutral-900 dark:text-theme-dark-text-primary">
                  Nossos valores
                </Text>
                <Text className="text-justify font-body text-[14px] leading-5 text-neutral-700 dark:text-theme-dark-text-secondary">
                  Acreditamos na transparência, no respeito à privacidade dos dados e no cuidado com o bem-estar do paciente. Cada funcionalidade é pensada para ser acessível, intuitiva e confiável.
                </Text>
              </View>

              <View className="h-px bg-neutral-150 dark:bg-theme-dark-border" />

              <View className="gap-2">
                <Text className="font-display text-base font-bold text-neutral-900 dark:text-theme-dark-text-primary">
                  Versão do aplicativo
                </Text>
                <Text className="text-center font-body text-[14px] leading-5 text-green-400">
                  Versão 1.0.0
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </Screen>
    );
  }

  // Tela: Termo de privacidade
  if (section === 'privacyPolicy') {
    return (
      <Screen className="bg-neutral-100 dark:bg-theme-dark-background">
        <SubScreenHeader title="Termo de privacidade" onBack={() => setSection('main')} />
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
          <Card padding="lg">
            <View className="gap-5">
              <View className="gap-2">
                <Text className="font-display text-base font-bold text-neutral-900 dark:text-theme-dark-text-primary">
                  1. Coleta de dados
                </Text>
                <Text className="font-body text-[14px] leading-5 text-neutral-700 dark:text-theme-dark-text-secondary">
                  Coletamos informações fornecidas diretamente por você, como nome, e-mail, telefone e dados de saúde inseridos durante o uso do aplicativo. Essas informações são necessárias para o funcionamento do serviço de acompanhamento médico.
                </Text>
              </View>

              <View className="h-px bg-neutral-150 dark:bg-theme-dark-border" />

              <View className="gap-2">
                <Text className="font-display text-base font-bold text-neutral-900 dark:text-theme-dark-text-primary">
                  2. Uso das informações
                </Text>
                <Text className="font-body text-[14px] leading-5 text-neutral-700 dark:text-theme-dark-text-secondary">
                  Seus dados são utilizados exclusivamente para fins de acompanhamento de recuperação pós-operatória e comunicação com sua equipe médica. Não compartilhamos suas informações com terceiros sem o seu consentimento expresso.
                </Text>
              </View>

              <View className="h-px bg-neutral-150 dark:bg-theme-dark-border" />

              <View className="gap-2">
                <Text className="font-display text-base font-bold text-neutral-900 dark:text-theme-dark-text-primary">
                  3. Armazenamento e segurança
                </Text>
                <Text className="font-body text-[14px] leading-5 text-neutral-700 dark:text-theme-dark-text-secondary">
                  Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou divulgação indevida. Os dados são armazenados em servidores seguros com criptografia em trânsito e em repouso.
                </Text>
              </View>

              <View className="h-px bg-neutral-150 dark:bg-theme-dark-border" />

              <View className="gap-2">
                <Text className="font-display text-base font-bold text-neutral-900 dark:text-theme-dark-text-primary">
                  4. Seus direitos
                </Text>
                <Text className="font-body text-[14px] leading-5 text-neutral-700 dark:text-theme-dark-text-secondary">
                  Você tem o direito de acessar, corrigir ou solicitar a exclusão dos seus dados pessoais a qualquer momento. Para exercer esses direitos, entre em contato com nossa equipe de suporte pelo aplicativo.
                </Text>
              </View>

              <View className="h-px bg-neutral-150 dark:bg-theme-dark-border" />

              <View className="gap-2">
                <Text className="font-display text-base font-bold text-neutral-900 dark:text-theme-dark-text-primary">
                  5. Alterações nesta política
                </Text>
                <Text className="font-body text-[14px] leading-5 text-neutral-700 dark:text-theme-dark-text-secondary">
                  Podemos atualizar este termo periodicamente. Quando houver mudanças relevantes, você será notificado pelo aplicativo. O uso continuado do serviço após as alterações implica a aceitação da nova versão.
                </Text>
              </View>

              <Text className="font-body text-xs text-neutral-500 dark:text-theme-dark-text-tertiary">
                Última atualização: setembro de 2026
              </Text>
            </View>
          </Card>
        </ScrollView>
      </Screen>
    );
  }

  // Tela: Alterar senha
  if (section === 'changePassword') {
    return (
      <Screen className="bg-neutral-100 dark:bg-theme-dark-background">
        <SubScreenHeader title="Alterar senha" onBack={() => setSection('main')} />
        <View className="flex-1 px-8">
          <Card padding='lg' subtitle="Digite sua senha atual e defina uma nova senha." title="Nova senha">
            <View className="gap-4">
              <TextField
                label="Senha atual"
                placeholder="••••••••"
                type="password"
                value={currentPassword}
                onChangeText={(v) => { setCurrentPassword(v); setPasswordError(null); }}
              />
              <TextField
                label="Nova senha"
                placeholder="••••••••"
                type="password"
                value={newPassword}
                onChangeText={(v) => { setNewPassword(v); setPasswordError(null); }}
              />
              <TextField
                helperText={confirmPassword.length > 0 && newPassword !== confirmPassword ? 'As senhas não coincidem.' : undefined}
                label="Confirmar nova senha"
                placeholder="••••••••"
                state={confirmPassword.length > 0 && newPassword !== confirmPassword ? 'error' : 'default'}
                type="password"
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setPasswordError(null); }}
              />
              {passwordError ? (
                <Text className="font-body text-sm text-semantic-critical">{passwordError}</Text>
              ) : null}
            </View>
            <View className="gap-3 mt-5 flex flex-row justify-end">
              <Button fullWidth variant="secondary" onPress={() => setSection('main')}>
                Cancelar
              </Button>
              <Button
                fullWidth
                loading={passwordLoading}
                loadingText="Alterando..."
                variant="primary"
                onPress={() => void handleChangePassword()}
              >
                Alterar senha
              </Button>
            </View>
          </Card>
        </View>
      </Screen>
    );
  }

  // Tela principal
  return (
    <Screen className="bg-neutral-100 dark:bg-theme-dark-background p-8 gap-3">
      {/* Título */}
      <View className='flex flex-row justify-between'>
        <View className='flex flex-col'>
          <Text className="font-display text-[30px] font-extrabold text-neutral-900 dark:text-theme-dark-text-primary">
            Configurações
          </Text>
          <Text className="mt-1 font-body text-[15px] text-neutral-700 dark:text-theme-dark-text-secondary">
            Preferências e acesso à sua conta.
          </Text>
        </View>

        <View>
          <Pressable
            className='rounded-full p-4 bg-red-400/20 flex items-center justify-center'
            onPress={() => void logout()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Ionicons color='red' name='log-out-outline' size={26} />
            )}
          </Pressable>
        </View>
      </View>

      <View className="mb-2 h-[3px] w-full rounded-full bg-neutral-400/20" />

      {/* Seção de conta */}
      <Card title="Conta" padding='lg'>
        <MenuItem
          icon="person-outline"
          label="Editar conta"
          onPress={() => void openEditAccount()}
        />
        <MenuItem
          description="Altere a senha de acesso à sua conta."
          icon="key-outline"
          label="Alterar senha"
          showDivider={false}
          onPress={() => setSection('changePassword')}
        />
      </Card>

      {/* Seção sobre */}
      <Card title="Sobre" padding='lg'>
        <MenuItem
          description="Consulte os termos de privacidade e informações importantes sobre o uso da plataforma."
          icon="shield-checkmark-outline"
          label="Termos de privacidade"
          onPress={() => setSection('privacyPolicy')}
        />
        <MenuItem
          description="Conheça nossa equipe e saiba mais sobre o projeto."
          icon="information-circle-outline"
          label="Sobre nós"
          onPress={() => setSection('about')}
        />
        <MenuItem
          description="Entre em contato conosco por e-mail."
          icon="mail-outline"
          label="Contate-nos"
          showDivider={false}
          onPress={() => void Linking.openURL('mailto:tcc.cc.aacijl@gmail.com')}
        />
      </Card>
    </Screen>
  );
}
