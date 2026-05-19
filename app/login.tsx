import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Path, Stop, LinearGradient as SvgGradient } from 'react-native-svg';

const USUARIO_SIMULADO = { email: 'usuario@email.com', senha: '123456' };

// ─── Paleta Fall Blues ─────────────────────────────────────────────────────
const C = {
  lightBlue: '#99D5E0', // azul claro principal
  royalBlue: '#0C4C8A', // azul destaque
  navyMid:   '#1F375D', // azul escuro secundário
  mintBlue:  '#AEDEDE', // azul claro suave
  navyDark:  '#142D54', // azul navy escuro
  bg:        '#0D1928', // fundo (mais escuro que navyDark)
};

// ─── Ondas decorativas ─────────────────────────────────────────────────────


function WaveBottom() {
  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} pointerEvents="none">
      <Svg height={150} viewBox="0 0 390 150" preserveAspectRatio="none">
        <Defs>
          <SvgGradient id="wb" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor={C.royalBlue} stopOpacity="0.9" />
            <Stop offset="60%"  stopColor={C.navyMid}   stopOpacity="0.7" />
            <Stop offset="100%" stopColor={C.navyDark}  stopOpacity="0.4" />
          </SvgGradient>
        </Defs>
        <Path
          d="M0,150 L390,150 L390,65 Q275,0 195,42 Q105,85 0,28 Z"
          fill="url(#wb)"
        />
      </Svg>
    </View>
  );
}

// ─── Input com animação de foco ────────────────────────────────────────────

function FocusInput({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  rightElement,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  rightElement?: React.ReactNode;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(153,213,224,0.18)', C.lightBlue],
  });
  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(20,45,84,0.55)', 'rgba(12,76,138,0.28)'],
  });

  const onFocus = () =>
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  const onBlur = () =>
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }).start();

  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 54,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor,
        backgroundColor: bgColor as any,
        paddingHorizontal: 16,
      }}
    >
      <Ionicons name={icon} size={17} color={C.lightBlue} style={{ marginRight: 12, opacity: 0.65 }} />
      <TextInput
        style={{
          flex: 1,
          color: '#E8F4F8',
          fontSize: 15,
          letterSpacing: 0.2,
          borderWidth: 0,
          outline: 'none',
        } as any}
        placeholder={placeholder}
        placeholderTextColor={`rgba(174,222,222,0.3)`}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {rightElement}
    </Animated.View>
  );
}

// ─── Tela ──────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail]               = useState('');
  const [senha, setSenha]               = useState('');
  const [lembrar, setLembrar]           = useState(false);
  const [erro, setErro]                 = useState('');
  const [carregando, setCarregando]     = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Fade-in geral da tela
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Escala do botão
  const btnScale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true }).start();

  async function handleEntrar() {
    setErro('');
    if (!email.trim()) { setErro('Informe o e-mail.'); return; }
    if (!senha.trim()) { setErro('Informe a senha.');  return; }

    setCarregando(true);
    await new Promise((r) => setTimeout(r, 1200));

    if (email.trim().toLowerCase() === USUARIO_SIMULADO.email && senha === USUARIO_SIMULADO.senha) {
      router.replace('/(tabs)');
    } else {
      setErro('E-mail ou senha incorretos.');
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Onda de fundo */}
      <WaveBottom />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 28,
            gap: 20,
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }}
        >
          {/* Título */}
          <View style={{ alignItems: 'center', marginBottom: 6 }}>
            <Text
              style={{
                fontSize: 36,
                fontWeight: '800',
                color: '#FFFFFF',
                letterSpacing: 10,
              }}
            >
              LOGIN
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: C.mintBlue,
                marginTop: 8,
                letterSpacing: 0.5,
                opacity: 0.75,
              }}
            >
              Entre para continuar
            </Text>
          </View>

          {/* Campos */}
          <View style={{ width: '100%', gap: 14 }}>
            <FocusInput
              icon="mail-outline"
              placeholder="Email"
              value={email}
              onChangeText={(v) => { setEmail(v); setErro(''); }}
              keyboardType="email-address"
            />
            <FocusInput
              icon="lock-closed-outline"
              placeholder="Senha"
              value={senha}
              onChangeText={(v) => { setSenha(v); setErro(''); }}
              secureTextEntry={!mostrarSenha}
              rightElement={
                <Pressable onPress={() => setMostrarSenha(!mostrarSenha)} hitSlop={10}>
                  <Ionicons
                    name={mostrarSenha ? 'eye-outline' : 'eye-off-outline'}
                    size={17}
                    color={C.lightBlue}
                    style={{ opacity: 0.65 }}
                  />
                </Pressable>
              }
            />
          </View>

          {/* Erro */}
          {erro ? (
            <Text style={{ fontSize: 13, color: '#ff6b6b', textAlign: 'center', marginTop: -6 }}>
              {erro}
            </Text>
          ) : null}

          {/* Checkbox */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start' }}>
            <Checkbox
              value={lembrar}
              onValueChange={setLembrar}
              color={lembrar ? C.lightBlue : 'rgba(153,213,224,0.2)'}
              style={{ borderRadius: 4 }}
            />
            <Text style={{ fontSize: 13, color: C.mintBlue, opacity: 0.7 }}>
              Lembrar senha
            </Text>
          </View>

          {/* Botão ENTRAR */}
          <Animated.View style={{ width: '100%', transform: [{ scale: btnScale }] }}>
            <Pressable
              onPress={handleEntrar}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={carregando}
              style={{
                height: 54,
                borderRadius: 14,
                backgroundColor: C.royalBlue,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: carregando ? 0.65 : 1,
                shadowColor: C.lightBlue,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              {carregando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 3 }}>
                  ENTRAR
                </Text>
              )}
            </Pressable>
          </Animated.View>

          {/* Esqueci minha senha */}
          <Pressable>
            <Text style={{ fontSize: 13, color: C.mintBlue, letterSpacing: 0.3, opacity: 0.75 }}>
              Esqueci minha senha
            </Text>
          </Pressable>

        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
