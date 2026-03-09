import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity,
         StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import Toast from '../components/Toast';

export default function LoginScreen({ navigation, route }: any) {
  const [email, setEmail]       = useState('test@uabc.mx');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});
  const [toast, setToast]       = useState({ message: '', visible: false });

  useEffect(() => {
    if (route.params?.loggedOut) {
      setToast({ message: 'Sesión cerrada', visible: true });
      const t = setTimeout(() => setToast(p => ({ ...p, visible: false })), 2300);
      return () => clearTimeout(t);
    }
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
      navigation.replace('Tasks');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error ?? 'Error de conexión');
    } finally { setLoading(false); }
  };

  return (
    <View style={[s.container, { position: 'relative' }]}>
      <Toast message={toast.message} visible={toast.visible} />
      <Text style={s.logo}>TaskMate</Text>
      <Text style={s.sub}>MGTIC · UABC · 2026</Text>

      <TextInput style={[s.input, errors.email && s.inputError]}
        placeholder="Email" placeholderTextColor="#475569"
        value={email} onChangeText={t => { setEmail(t); setErrors(p => ({...p, email: undefined})); }}
        keyboardType="email-address" autoCapitalize="none" />
      {errors.email && <Text style={s.errorT}>{errors.email}</Text>}

      <TextInput style={[s.input, errors.password && s.inputError]}
        placeholder="Contraseña" placeholderTextColor="#475569"
        value={password} onChangeText={t => { setPassword(t); setErrors(p => ({...p, password: undefined})); }}
        secureTextEntry />
      {errors.password && <Text style={s.errorT}>{errors.password}</Text>}

      <TouchableOpacity style={[s.btn, loading && s.disabled]}
        onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#000"/>
          : <Text style={s.btnT}>Iniciar Sesión</Text>}
      </TouchableOpacity>
    </View>
  );
}
const s = StyleSheet.create({
  container:  { flex:1, backgroundColor:'#080c14', justifyContent:'center', padding:28 },
  logo:       { fontSize:32, color:'#00d4ff', fontWeight:'bold', textAlign:'center', marginBottom:4 },
  sub:        { fontSize:12, color:'#64748b', textAlign:'center', marginBottom:40 },
  input:      { backgroundColor:'#111827', borderWidth:1, borderColor:'#1e2d45',
                color:'#e2e8f0', borderRadius:10, padding:14, fontSize:15, marginBottom:4 },
  inputError: { borderColor:'#ef4444' },
  errorT:     { color:'#ef4444', fontSize:12, marginBottom:10, marginLeft:4 },
  btn:        { backgroundColor:'#00d4ff', borderRadius:10, padding:16, alignItems:'center', marginTop:8 },
  disabled:   { opacity: 0.6 },
  btnT:       { color:'#000', fontWeight:'bold', fontSize:16 },
});
