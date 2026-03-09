import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput,
         TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { tasksAPI } from '../services/api';

interface Task { id: number; titulo: string; completada: boolean; }

export default function TasksScreen() {
  const [tasks, setTasks]   = useState<Task[]>([]);
  const [titulo, setTitulo] = useState('');

  const cargar = useCallback(async () => {
    const { data } = await tasksAPI.getAll();
    setTasks(data);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const agregar = async () => {
    if (!titulo.trim()) return;
    await tasksAPI.create(titulo.trim());
    setTitulo(''); cargar();
  };

  const toggle = async (t: Task) => {
    await tasksAPI.toggle(t.id, !t.completada); cargar();
  };

  const eliminar = (id: number) =>
    Alert.alert('¿Eliminar?', '', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive',
        onPress: async () => { await tasksAPI.remove(id); cargar(); } }
    ]);

  return (
    <View style={s.container}>
      <Text style={s.header}>Mis Tareas 📋</Text>
      <Text style={s.counter}>{tasks.filter(t => !t.completada).length} pendientes</Text>
      <View style={s.row}>
        <TextInput style={s.input} placeholder="Nueva tarea..."
          placeholderTextColor="#475569" value={titulo}
          onChangeText={setTitulo} onSubmitEditing={agregar} />
        <TouchableOpacity style={s.addBtn} onPress={agregar}>
          <Text style={s.addT}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={tasks} keyExtractor={t => String(t.id)}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card}
            onPress={() => toggle(item)}
            onLongPress={() => eliminar(item.id)}>
            <Text style={[s.taskT, item.completada && s.done]}>
              {item.completada ? '✅' : '⭕'} {item.titulo}
            </Text>
          </TouchableOpacity>
        )} />
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#080c14', padding:20, paddingTop:56 },
  header:    { fontSize:24, color:'#fff', fontWeight:'bold' },
  counter:   { fontSize:12, color:'#64748b', marginBottom:14, marginTop:2 },
  row:       { flexDirection:'row', gap:10, marginBottom:14 },
  input:     { flex:1, backgroundColor:'#111827', borderWidth:1, borderColor:'#1e2d45',
               color:'#e2e8f0', borderRadius:10, padding:12, fontSize:14 },
  addBtn:    { backgroundColor:'#00d4ff', borderRadius:10, width:48,
               justifyContent:'center', alignItems:'center' },
  addT:      { color:'#000', fontSize:24, fontWeight:'bold' },
  card:      { backgroundColor:'#111827', borderWidth:1, borderColor:'#1e2d45',
               borderRadius:10, padding:13, marginBottom:8 },
  taskT:     { color:'#e2e8f0', fontSize:14 },
  done:      { color:'#475569', textDecorationLine:'line-through' },
});