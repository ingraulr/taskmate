import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity,
         StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password)
      return Alert.alert('Error', 'Completa todos los campos');
    try {
      setLoading(true);
      const { data } = await authAPI.login(email, password);
      await AsyncStorage.setItem('token', data.token);
      navigation.replace('Tasks');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error ?? 'Error de conexión');
    } finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <Text style={s.logo}>TaskMate</Text>
      <Text style={s.sub}>MGTIC · UABC · 2026</Text>
      <TextInput style={s.input} placeholder="Email"
        placeholderTextColor="#475569" value={email}
        onChangeText={setEmail} keyboardType="email-address"
        autoCapitalize="none" />
      <TextInput style={s.input} placeholder="Contraseña"
        placeholderTextColor="#475569" value={password}
        onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={[s.btn, loading && s.disabled]}
        onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#000"/>
          : <Text style={s.btnT}>Iniciar Sesión</Text>}
      </TouchableOpacity>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080c14', justifyContent:'center', padding:28 },
  logo:      { fontSize:32, color:'#00d4ff', fontWeight:'bold', textAlign:'center', marginBottom:4 },
  sub:       { fontSize:12, color:'#64748b', textAlign:'center', marginBottom:40 },
  input:     { backgroundColor:'#111827', borderWidth:1, borderColor:'#1e2d45',
               color:'#e2e8f0', borderRadius:10, padding:14, fontSize:15, marginBottom:12 },
  btn:       { backgroundColor:'#00d4ff', borderRadius:10, padding:16, alignItems:'center' },
  disabled:  { opacity: 0.6 },
  btnT:      { color:'#000', fontWeight:'bold', fontSize:16 },
});