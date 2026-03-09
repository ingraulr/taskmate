import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput,
         TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { tasksAPI } from '../services/api';
import Toast from '../components/Toast';

interface Task { id: number; titulo: string; completada: boolean; }

export default function TasksScreen() {
  const navigation = useNavigation<any>();
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [titulo, setTitulo]         = useState('');
  const [errorTarea, setErrorTarea] = useState('');
  const [toast, setToast]           = useState({ message: '', visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2300);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.replace('Login', { loggedOut: true });
  };

  const cargar = useCallback(async () => {
    const { data } = await tasksAPI.getAll();
    setTasks(data);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const agregar = async () => {
    if (!titulo.trim()) {
      setErrorTarea('Escribe el nombre de la tarea');
      return;
    }
    if (titulo.trim().length < 3) {
      setErrorTarea('Mínimo 3 caracteres');
      return;
    }
    setErrorTarea('');
    await tasksAPI.create(titulo.trim());
    setTitulo(''); cargar();
    showToast('Tarea creada');
  };

  const toggle = async (t: Task) => {
    await tasksAPI.toggle(t.id, !t.completada); cargar();
  };

  const eliminar = (id: number) =>
    Alert.alert('¿Eliminar?', '', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive',
        onPress: async () => { await tasksAPI.remove(id); cargar(); showToast('Tarea eliminada'); } }
    ]);

  const editar = (t: Task) =>
    Alert.prompt('Editar tarea', undefined, async (nuevoTitulo) => {
      if (nuevoTitulo && nuevoTitulo.trim() && nuevoTitulo.trim() !== t.titulo) {
        await tasksAPI.edit(t.id, nuevoTitulo.trim());
        cargar();
        showToast('Tarea actualizada');
      }
    }, 'plain-text', t.titulo);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Task>) => (
    <ScaleDecorator>
      <View style={[s.card, isActive && s.cardActive]}>
        <TouchableOpacity onPress={() => toggle(item)} style={s.statusIcon}>
          <Ionicons
            name={item.completada ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={item.completada ? '#22c55e' : '#f59e0b'}
          />
        </TouchableOpacity>
        <TouchableOpacity style={s.cardMain} onPress={() => toggle(item)}>
          <Text style={[s.taskT, item.completada && s.done]}>{item.titulo}</Text>
        </TouchableOpacity>
        <View style={s.cardActions}>
          <TouchableOpacity style={s.editBtn} onPress={() => editar(item)}>
            <Ionicons name="pencil-outline" size={18} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteBtn} onPress={() => eliminar(item.id)}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
          <TouchableOpacity onLongPress={drag} delayLongPress={150} style={s.dragHandle}>
            <Ionicons name="reorder-three-outline" size={22} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>
    </ScaleDecorator>
  );

  return (
    <View style={[s.container, { position: 'relative' }]}>
      <View style={s.topRow}>
        <Text style={s.header}>Mis Tareas 📋</Text>
        <TouchableOpacity style={s.logoutBtn} onPress={logout}>
          <Text style={s.logoutT}>Salir</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.counter}>{tasks.filter(t => !t.completada).length} pendientes</Text>
      <View style={s.row}>
        <TextInput style={[s.input, errorTarea ? s.inputError : null]}
          placeholder="Nueva tarea..." placeholderTextColor="#475569"
          value={titulo}
          onChangeText={t => { setTitulo(t); setErrorTarea(''); }}
          onSubmitEditing={agregar} />
        <TouchableOpacity style={s.addBtn} onPress={agregar}>
          <Text style={s.addT}>+</Text>
        </TouchableOpacity>
      </View>
      {errorTarea ? <Text style={s.errorT}>{errorTarea}</Text> : null}
      <DraggableFlatList
        data={tasks}
        keyExtractor={t => String(t.id)}
        renderItem={renderItem}
        onDragEnd={({ data }) => setTasks(data)}
      />
      <Toast message={toast.message} visible={toast.visible} />
    </View>
  );
}
const s = StyleSheet.create({
  container:  { flex:1, backgroundColor:'#080c14', padding:20, paddingTop:56 },
  topRow:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:2 },
  header:     { fontSize:24, color:'#fff', fontWeight:'bold' },
  logoutBtn:  { backgroundColor:'#ef4444', borderRadius:8, paddingHorizontal:14, paddingVertical:7 },
  logoutT:    { color:'#fff', fontSize:13, fontWeight:'bold' },
  counter:   { fontSize:12, color:'#64748b', marginBottom:14, marginTop:2 },
  row:       { flexDirection:'row', gap:10, marginBottom:14 },
  input:     { flex:1, backgroundColor:'#111827', borderWidth:1, borderColor:'#1e2d45',
               color:'#e2e8f0', borderRadius:10, padding:12, fontSize:14 },
  addBtn:    { backgroundColor:'#00d4ff', borderRadius:10, width:48,
               justifyContent:'center', alignItems:'center' },
  addT:      { color:'#000', fontSize:24, fontWeight:'bold' },
  card:        { backgroundColor:'#111827', borderWidth:1, borderColor:'#1e2d45',
                 borderRadius:10, padding:13, marginBottom:8,
                 flexDirection:'row', alignItems:'center' },
  cardActive:  { backgroundColor:'#1e293b', borderColor:'#00d4ff', opacity: 0.95 },
  cardMain:    { flex:1 },
  cardActions: { flexDirection:'row', gap:6, alignItems:'center' },
  editBtn:     { padding:6 },
  deleteBtn:   { padding:6 },
  dragHandle:  { padding:6 },
  inputError:   { borderColor:'#ef4444' },
  errorT:       { color:'#ef4444', fontSize:12, marginBottom:8, marginLeft:2 },
  taskT:        { color:'#e2e8f0', fontSize:14 },
  done:         { color:'#475569', textDecorationLine:'line-through' },
  statusIcon:   { marginRight:10 },
});
