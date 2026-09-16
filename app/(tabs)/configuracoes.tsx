import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Card, Screen, TextField } from '@/components/ui';
import { colors } from '@/constants/design-tokens';
import { createApiClient } from '@/src/infrastructure/api/api-config';

type Section = 'main' | 'editAccount' | 'changePassword' | 'privacyPolicy' | 'about';

// Componente do item de menu reutilizável
function MenuItem({
  label,
  description,
  onPress,
  showDivider = true,
}: {
  label: string;
  description: string;
  onPress: () => void;
  showDivider?: boolean;
}) {
  return (
    <>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        className="py-3 active:opacity-60"
        onPress={onPress}
      >
        <Text className="font-body text-[15px] font-semibold text-neutral-900 dark:text-theme-dark-text-primary">
          {label}
        </Text>
        <Text className="mt-0.5 font-body text-[13px] text-brand-dark dark:text-theme-dark-action">
          {description}
        </Text>
      </Pressable>
      {showDivider && <View className="h-px bg-neutral-150 dark:bg-theme-dark-border" />}
    </>
  );
}

// Header interno reutilizável
function SubScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View className="flex-row items-center gap-3 px-5 pb-4 pt-2">
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
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

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
        birthDate: birthDate.trim() || undefined,
        gender: gender.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
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
        <ScrollView className="flex-1 px-5" contentContainerStyle={{ gap: 16, paddingBottom: 32 }}>
          <Card subtitle="Atualize suas informações de contato." title="Dados pessoais">
            <View className="gap-4">
              <TextField
                label="Nome completo"
                placeholder="Seu nome"
                value={name}
                onChangeText={setName}
              />
              <TextField
                label="Data de nascimento"
                placeholder="AAAA-MM-DD"
                value={birthDate}
                onChangeText={setBirthDate}
              />
              <TextField
                label="Gênero"
                placeholder="Ex: Masculino, Feminino"
                value={gender}
                onChangeText={setGender}
              />
              <TextField
                label="Telefone"
                placeholder="(00) 00000-0000"
                type="tel"
                value={phone}
                onChangeText={setPhone}
              />
              <TextField
                label="Endereço"
                placeholder="Rua, número, complemento"
                value={address}
                onChangeText={setAddress}
              />
              <TextField
                label="Cidade"
                placeholder="Sua cidade"
                value={city}
                onChangeText={setCity}
              />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <TextField
                    autoCapitalize="characters"
                    label="Estado (UF)"
                    placeholder="SP"
                    value={state}
                    onChangeText={(v) => setState(v.toUpperCase().slice(0, 2))}
                  />
                </View>
                <View className="flex-1">
                  <TextField
                    label="CEP"
                    placeholder="00000-000"
                    type="tel"
                    value={zipCode}
                    onChangeText={setZipCode}
                  />
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <TextField
                    label="Peso (kg)"
                    placeholder="70.0"
                    type="number"
                    value={weight}
                    onChangeText={setWeight}
                  />
                </View>
                <View className="flex-1">
                  <TextField
                    label="Altura (m)"
                    placeholder="1.70"
                    type="number"
                    value={height}
                    onChangeText={setHeight}
                  />
                </View>
              </View>
              {profileError ? (
                <Text className="font-body text-sm text-semantic-critical">{profileError}</Text>
              ) : null}
            </View>
          </Card>

          <View className="gap-3">
            <Button
              fullWidth
              loading={profileLoading}
              loadingText="Salvando..."
              variant="primary"
              onPress={() => void handleUpdateProfile()}
            >
              Salvar alterações
            </Button>
            <Button fullWidth variant="secondary" onPress={() => setSection('main')}>
              Cancelar
            </Button>
          </View>
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
                <Text className="font-body text-[14px] leading-5 text-neutral-700 dark:text-theme-dark-text-secondary">
                  Somos uma equipe dedicada a transformar o acompanhamento pós-operatório por meio da tecnologia. Nossa missão é conectar pacientes e equipes médicas de forma simples, segura e eficiente, promovendo uma recuperação mais tranquila e bem monitorada.
                </Text>
              </View>

              <View className="h-px bg-neutral-150 dark:bg-theme-dark-border" />

              <View className="gap-2">
                <Text className="font-display text-base font-bold text-neutral-900 dark:text-theme-dark-text-primary">
                  O que fazemos
                </Text>
                <Text className="font-body text-[14px] leading-5 text-neutral-700 dark:text-theme-dark-text-secondary">
                  Desenvolvemos soluções digitais que permitem ao paciente registrar seu progresso diário, receber orientações personalizadas e manter contato com sua equipe de saúde — tudo em um único lugar, direto pelo celular.
                </Text>
              </View>

              <View className="h-px bg-neutral-150 dark:bg-theme-dark-border" />

              <View className="gap-2">
                <Text className="font-display text-base font-bold text-neutral-900 dark:text-theme-dark-text-primary">
                  Nossos valores
                </Text>
                <Text className="font-body text-[14px] leading-5 text-neutral-700 dark:text-theme-dark-text-secondary">
                  Acreditamos na transparência, no respeito à privacidade dos dados e no cuidado com o bem-estar do paciente. Cada funcionalidade é pensada para ser acessível, intuitiva e confiável.
                </Text>
              </View>

              <View className="h-px bg-neutral-150 dark:bg-theme-dark-border" />

              <View className="gap-2">
                <Text className="font-display text-base font-bold text-neutral-900 dark:text-theme-dark-text-primary">
                  Versão do aplicativo
                </Text>
                <Text className="font-body text-[14px] leading-5 text-neutral-700 dark:text-theme-dark-text-secondary">
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
        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
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
        <View className="flex-1 gap-4 px-5 pb-8">
          <Card subtitle="Digite sua senha atual e defina uma nova senha." title="Nova senha">
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
          </Card>

          <View className="gap-3">
            <Button
              fullWidth
              loading={passwordLoading}
              loadingText="Alterando..."
              variant="primary"
              onPress={() => void handleChangePassword()}
            >
              Alterar senha
            </Button>
            <Button fullWidth variant="secondary" onPress={() => setSection('main')}>
              Cancelar
            </Button>
          </View>
        </View>
      </Screen>
    );
  }

  // Tela principal
  return (
    <Screen className="bg-neutral-100 dark:bg-theme-dark-background">
      <View className="flex-1 gap-5 px-5 pb-8 pt-2">
        {/* Título */}
        <View>
          <Text className="font-display text-[30px] font-extrabold text-neutral-900 dark:text-theme-dark-text-primary">
            Configurações
          </Text>
          <Text className="mt-1 font-body text-[15px] text-neutral-700 dark:text-theme-dark-text-secondary">
            Preferências e acesso à sua conta.
          </Text>
        </View>

        {/* Seção de conta */}
        <Card title="Conta">
          <MenuItem
            description="Edite as informações da sua conta."
            label="Editar conta"
            onPress={() => setSection('editAccount')}
          />
          <MenuItem
            description="Altere a senha de acesso à sua conta."
            label="Alterar senha"
            showDivider={false}
            onPress={() => setSection('changePassword')}
          />
        </Card>

        {/* Seção sobre */}
        <Card title="Sobre">
          <MenuItem
            description="Consulte os termos de privacidade e informações importantes sobre o uso da plataforma."
            label="Termos de privacidade"
            onPress={() => setSection('privacyPolicy')}
          />
          <MenuItem
            description="Conheça nossa equipe e saiba mais sobre o projeto."
            label="Sobre nós"
            onPress={() => setSection('about')}
          />
          <MenuItem
            description="Entre em contato conosco por e-mail."
            label="Contate-nos"
            showDivider={false}
            onPress={() => void Linking.openURL('mailto:tcc.cc.aacijl@gmail.com')}
          />
        </Card>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Botão de logout */}
        <Button
          fullWidth
          loading={loading}
          loadingText="Saindo..."
          variant="destructive"
          onPress={() => void logout()}
        >
          Sair da conta
        </Button>
      </View>
    </Screen>
  );
}
