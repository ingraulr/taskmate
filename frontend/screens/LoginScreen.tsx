import React, { useState, useEffect } from 'react';
import {
  View as RNView,
  Image as RNImage,
  StyleSheet,
  ActivityIndicator as RNActivityIndicator,
  Modal as RNModal,
} from 'react-native';
import { Text, TextInput as PaperInput, Button, Snackbar, Portal } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

// ── TypeScript 5.9 / RN compat casts ────────────────────────────────────────
const View              = RNView              as unknown as React.FC<{ style?: any; children?: React.ReactNode }>;
const Image             = RNImage             as unknown as React.FC<{ source: any; style?: any }>;
const TextInput         = PaperInput          as any;
const ActivityIndicator = RNActivityIndicator as unknown as React.FC<{ size?: any; color?: string }>;
const Modal             = RNModal             as unknown as React.FC<{ transparent?: boolean; animationType?: string; visible?: boolean; children?: React.ReactNode }>;
// ────────────────────────────────────────────────────────────────────────────

const GREEN      = '#00723F';
const DARK_GREEN = '#024731';
const GOLD       = '#DD971A';

const ls = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  box:     { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', gap: 14,
             shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 8 },
  text:    { color: DARK_GREEN, fontSize: 15, fontWeight: '600' },
});

export default function LoginScreen({ navigation, route }: any) {
  const [email, setEmail]       = useState('test@uabc.mx');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});
  const [snack, setSnack]       = useState({ message: '', visible: false });

  useEffect(() => {
    if (route.params?.loggedOut)
      setSnack({ message: 'Sesión cerrada exitosamente', visible: true });
    if (route.params?.registered)
      setSnack({ message: 'Cuenta creada. Inicia sesión', visible: true });
  }, []);

  const validate = () => {
    const e: { email?: string; password?: string } = {};
    if (!email.trim())
      e.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = 'Ingresa un email válido';
    if (!password)
      e.password = 'La contraseña es obligatoria';
    else if (password.length < 6)
      e.password = 'Mínimo 6 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const { data } = await authAPI.login(email.trim(), password);
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('userEmail', email.trim());
      // restaurar avatar desde la BD para que aparezca de inmediato en Tasks
      try {
        const me = await authAPI.getMe();
        if (me.data.avatar) await AsyncStorage.setItem('userPhoto', me.data.avatar);
        else await AsyncStorage.removeItem('userPhoto');
      } catch { /* no bloquear el login si falla */ }
      navigation.replace('Tasks');
    } catch (e: any) {
      setSnack({ message: e.response?.data?.error ?? 'Error de conexión', visible: true });
    } finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      {/* Full-screen loader al iniciar sesión */}
      <Modal transparent animationType="fade" visible={loading}>
        <View style={ls.overlay}>
          <View style={ls.box}>
            <ActivityIndicator size="large" color={GREEN} />
            <Text style={ls.text}>Iniciando sesión...</Text>
          </View>
        </View>
      </Modal>

      {/* Logo */}
      <View style={s.logoBox}>
        <View style={s.logoUabcRow}>
          <Image source={require('../assets/logo-uabc.png')} style={s.logoUabc} />
        </View>
        <View style={s.goldBarTop} />
        <Text variant="displaySmall" style={s.logo}>Cima Task</Text>
        <Text variant="bodySmall" style={s.sub}>
          FCA | MGTIC | UABC · 2026
        </Text>
      </View>

      {/* Form */}
      <View style={s.card}>
        <TextInput
          label="Correo electrónico"
          mode="outlined"
          value={email}
          onChangeText={(t: string) => { setEmail(t); setErrors(p => ({ ...p, email: undefined })); }}
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!errors.email}
          style={s.input}
          outlineColor={GREEN}
          activeOutlineColor={DARK_GREEN}
          left={<PaperInput.Icon icon="email-outline" color={GREEN} />}
        />
        {errors.email && <Text style={s.errorT}>{errors.email}</Text>}

        <TextInput
          label="Contraseña"
          mode="outlined"
          value={password}
          onChangeText={(t: string) => { setPassword(t); setErrors(p => ({ ...p, password: undefined })); }}
          secureTextEntry
          error={!!errors.password}
          style={s.input}
          outlineColor={GREEN}
          activeOutlineColor={DARK_GREEN}
          left={<PaperInput.Icon icon="lock-outline" color={GREEN} />}
        />
        {errors.password && <Text style={s.errorT}>{errors.password}</Text>}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={s.btn}
          contentStyle={s.btnContent}
          labelStyle={s.btnLabel}
          buttonColor={GREEN}
        >
          Iniciar Sesión
        </Button>
      </View>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Register')}
        textColor={DARK_GREEN}
        style={s.linkBtn}
        labelStyle={s.linkLabel}
      >
        ¿No tienes cuenta? Regístrate
      </Button>

      <View style={s.goldBar} />

      <Portal>
        <Snackbar
          visible={snack.visible}
          onDismiss={() => setSnack(p => ({ ...p, visible: false }))}
          duration={2500}
          style={s.snack}
        >
          {snack.message}
        </Snackbar>
      </Portal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', padding: 28 },
  logoBox:   { alignItems: 'center', marginBottom: 36 },
  logoAccent:{ width: 60, height: 4, backgroundColor: GOLD, borderRadius: 2, marginBottom: 12 },
  logo:      { color: DARK_GREEN, fontWeight: 'bold', textAlign: 'center' },
  sub:       { color: '#666', textAlign: 'center', marginTop: 4, fontSize: 11 },
  card:      { backgroundColor: '#F9FFF9', borderRadius: 16, padding: 20,
               borderWidth: 1, borderColor: '#D0E8D8' },
  input:     { marginBottom: 4, backgroundColor: '#FFFFFF' },
  errorT:    { color: '#ef4444', fontSize: 12, marginBottom: 10, marginLeft: 4 },
  btn:       { marginTop: 16, borderRadius: 10 },
  btnContent:{ paddingVertical: 6 },
  btnLabel:  { fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  logoUabcRow: { alignItems: 'center', marginTop: 28 },
  logoUabc:    { width: 80, height: 80, resizeMode: 'contain' },
  goldBarTop:  { width: 60, height: 3, backgroundColor: GOLD, borderRadius: 2, marginTop: 10, marginBottom: 10 },
  goldBar:     { height: 3, backgroundColor: GOLD, borderRadius: 2, marginTop: 16, marginHorizontal: 40 },
  linkBtn:     { marginTop: 12 },
  linkLabel:   { fontSize: 13 },
  snack:       { backgroundColor: DARK_GREEN },
});
