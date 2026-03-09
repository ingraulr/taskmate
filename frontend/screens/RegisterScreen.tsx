import React, { useState } from 'react';
import { View as RNView, Image as RNImage, StyleSheet } from 'react-native';
import { Text, TextInput as PaperInput, Button, Snackbar, Portal } from 'react-native-paper';
import { authAPI } from '../services/api';

// ── TypeScript 5.9 / RN compat casts ────────────────────────────────────────
const View      = RNView  as unknown as React.FC<{ style?: any; children?: React.ReactNode }>;
const Image     = RNImage as unknown as React.FC<{ source: any; style?: any }>;
const TextInput = PaperInput as any;
// ────────────────────────────────────────────────────────────────────────────

const GREEN      = '#00723F';
const DARK_GREEN = '#024731';
const GOLD       = '#DD971A';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<{ email?: string; password?: string; confirm?: string }>({});
  const [snack, setSnack]       = useState({ message: '', visible: false });

  const validate = () => {
    const e: { email?: string; password?: string; confirm?: string } = {};
    if (!email.trim())
      e.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = 'Ingresa un email válido';
    if (!password)
      e.password = 'La contraseña es obligatoria';
    else if (password.length < 6)
      e.password = 'Mínimo 6 caracteres';
    if (!confirm)
      e.confirm = 'Repite la contraseña';
    else if (confirm !== password)
      e.confirm = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await authAPI.register(email.trim(), password);
      navigation.replace('Login', { registered: true });
    } catch (e: any) {
      setSnack({ message: e.response?.data?.error ?? 'Error de conexión', visible: true });
    } finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
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

        <TextInput
          label="Repetir contraseña"
          mode="outlined"
          value={confirm}
          onChangeText={(t: string) => { setConfirm(t); setErrors(p => ({ ...p, confirm: undefined })); }}
          secureTextEntry
          error={!!errors.confirm}
          style={s.input}
          outlineColor={GREEN}
          activeOutlineColor={DARK_GREEN}
          left={<PaperInput.Icon icon="lock-check-outline" color={GREEN} />}
        />
        {errors.confirm && <Text style={s.errorT}>{errors.confirm}</Text>}

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          style={s.btn}
          contentStyle={s.btnContent}
          labelStyle={s.btnLabel}
          buttonColor={GREEN}
        >
          Crear cuenta
        </Button>
      </View>

      <Button
        mode="text"
        onPress={() => navigation.goBack()}
        textColor={DARK_GREEN}
        style={s.linkBtn}
        labelStyle={s.linkLabel}
      >
        ¿Ya tienes cuenta? Inicia sesión
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
  container:   { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', padding: 28 },
  logoBox:     { alignItems: 'center', marginBottom: 28 },
  logo:        { color: DARK_GREEN, fontWeight: 'bold', textAlign: 'center' },
  sub:         { color: '#666', textAlign: 'center', marginTop: 4, fontSize: 11 },
  card:        { backgroundColor: '#F9FFF9', borderRadius: 16, padding: 20,
                 borderWidth: 1, borderColor: '#D0E8D8' },
  input:       { marginBottom: 4, backgroundColor: '#FFFFFF' },
  errorT:      { color: '#ef4444', fontSize: 12, marginBottom: 10, marginLeft: 4 },
  btn:         { marginTop: 16, borderRadius: 10 },
  btnContent:  { paddingVertical: 6 },
  btnLabel:    { fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  linkBtn:     { marginTop: 12 },
  linkLabel:   { fontSize: 13 },
  logoUabcRow: { alignItems: 'center', marginTop: 0 },
  logoUabc:    { width: 80, height: 80, resizeMode: 'contain' },
  goldBarTop:  { width: 60, height: 3, backgroundColor: GOLD, borderRadius: 2, marginTop: 10, marginBottom: 10 },
  goldBar:     { height: 3, backgroundColor: GOLD, borderRadius: 2, marginTop: 16, marginHorizontal: 40 },
  snack:       { backgroundColor: DARK_GREEN },
});
