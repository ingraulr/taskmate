import React, { useEffect, useState, useCallback } from 'react';
import { View as RNView, TouchableOpacity as RNTouchable, StyleSheet } from 'react-native';
import { Text, TextInput as PaperInput, Button, Dialog, Portal, Snackbar } from 'react-native-paper';

// TypeScript 5.9 / RN compat casts
const View          = RNView    as unknown as React.FC<{ style?: any; children?: React.ReactNode }>;
const TouchableOpacity = RNTouchable as any;
const TextInput     = PaperInput as any;
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { tasksAPI } from '../services/api';

interface Task { id: number; titulo: string; completada: boolean; }

export default function TasksScreen() {
  const navigation = useNavigation<any>();
  const [tasks, setTasks]   = useState<Task[]>([]);
  const [titulo, setTitulo] = useState('');
  const [errorTarea, setErrorTarea] = useState('');
  const [snack, setSnack]   = useState({ message: '', visible: false });

  const [deleteDialog, setDeleteDialog] = useState<{ visible: boolean; id: number | null }>({ visible: false, id: null });
  const [editDialog, setEditDialog]     = useState<{ visible: boolean; task: Task | null; titulo: string }>({ visible: false, task: null, titulo: '' });

  const showSnack = (message: string) => setSnack({ message, visible: true });

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
    if (!titulo.trim()) { setErrorTarea('Escribe el nombre de la tarea'); return; }
    if (titulo.trim().length < 3) { setErrorTarea('Mínimo 3 caracteres'); return; }
    setErrorTarea('');
    await tasksAPI.create(titulo.trim());
    setTitulo(''); cargar();
    showSnack('Tarea creada');
  };

  const toggle = async (t: Task) => {
    await tasksAPI.toggle(t.id, !t.completada); cargar();
  };

  const confirmarEliminar = async () => {
    if (deleteDialog.id) {
      await tasksAPI.remove(deleteDialog.id);
      cargar();
      showSnack('Tarea eliminada');
    }
    setDeleteDialog({ visible: false, id: null });
  };

  const confirmarEditar = async () => {
    const { task, titulo: nuevoTitulo } = editDialog;
    if (task && nuevoTitulo.trim() && nuevoTitulo.trim() !== task.titulo) {
      await tasksAPI.edit(task.id, nuevoTitulo.trim());
      cargar();
      showSnack('Tarea actualizada');
    }
    setEditDialog({ visible: false, task: null, titulo: '' });
  };

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
          <TouchableOpacity style={s.iconBtn} onPress={() => setEditDialog({ visible: true, task: item, titulo: item.titulo })}>
            <Ionicons name="pencil-outline" size={18} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => setDeleteDialog({ visible: true, id: item.id })}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
          <TouchableOpacity onLongPress={drag} delayLongPress={150} style={s.iconBtn}>
            <Ionicons name="reorder-three-outline" size={22} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>
    </ScaleDecorator>
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.topRow}>
        <Text variant="headlineMedium" style={s.header}>Mis Tareas </Text>
        <Button
          mode="contained"
          onPress={logout}
          buttonColor="#ef4444"
          textColor="#fff"
          compact
          style={s.logoutBtn}
          labelStyle={s.logoutLabel}
        >
          Logout
        </Button>
      </View>

      <Text style={s.counter}>{tasks.filter(t => !t.completada).length} pendientes</Text>

      {/* Input nueva tarea */}
      <View style={s.row}>
        <TextInput
          mode="outlined"
          placeholder="Nueva tarea..."
          value={titulo}
          onChangeText={t => { setTitulo(t); setErrorTarea(''); }}
          onSubmitEditing={agregar}
          style={s.input}
          error={!!errorTarea}
        />
        <TouchableOpacity style={s.addBtn} onPress={agregar}>
          <Text style={s.addT}>+</Text>
        </TouchableOpacity>
      </View>
      {errorTarea ? <Text style={s.errorT}>{errorTarea}</Text> : null}

      {/* Lista de tareas */}
      <DraggableFlatList
        data={tasks}
        keyExtractor={t => String(t.id)}
        renderItem={renderItem}
        onDragEnd={({ data }) => setTasks(data)}
      />

      {/* Dialog eliminar */}
      <Portal>
        <Dialog visible={deleteDialog.visible} onDismiss={() => setDeleteDialog({ visible: false, id: null })}>
          <Dialog.Title>¿Eliminar tarea?</Dialog.Title>
          <Dialog.Content>
            <Text>Esta acción no se puede deshacer.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialog({ visible: false, id: null })}>Cancelar</Button>
            <Button onPress={confirmarEliminar} textColor="#ef4444">Eliminar</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Dialog editar */}
        <Dialog visible={editDialog.visible} onDismiss={() => setEditDialog({ visible: false, task: null, titulo: '' })}>
          <Dialog.Title>Editar tarea</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              value={editDialog.titulo}
              onChangeText={t => setEditDialog(p => ({ ...p, titulo: t }))}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialog({ visible: false, task: null, titulo: '' })}>Cancelar</Button>
            <Button onPress={confirmarEditar}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>

        <Snackbar
          visible={snack.visible}
          onDismiss={() => setSnack(p => ({ ...p, visible: false }))}
          duration={2000}
          style={s.snack}
        >
          {snack.message}
        </Snackbar>
      </Portal>
    </View>
  );
}

const GREEN      = '#00723F';
const DARK_GREEN = '#024731';
const GOLD       = '#DD971A';

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#FFFFFF', padding: 20, paddingTop: 56 },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                backgroundColor: GREEN, marginHorizontal: -20, marginTop: -56,
                paddingLeft: 20, paddingRight: 0, paddingTop: 56, paddingBottom: 14 },
  logoutBtn:  { borderTopLeftRadius: 20, borderBottomLeftRadius: 20, borderTopRightRadius: 0, borderBottomRightRadius: 0, margin: 0 },
  logoutLabel:{ fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5, paddingHorizontal: 16 },
  header:     { color: '#FFFFFF', fontWeight: 'bold' },
  counter:    { fontSize: 18, fontWeight: '600', color: '#444', marginBottom: 14, marginTop: 14 },
  row:        { flexDirection: 'row', gap: 10, marginBottom: 4 },
  input:      { flex: 1, backgroundColor: '#FFFFFF' },
  addBtn:     { backgroundColor: GREEN, borderRadius: 10, width: 48, justifyContent: 'center', alignItems: 'center' },
  addT:       { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  errorT:     { color: '#ef4444', fontSize: 12, marginBottom: 8, marginLeft: 2 },
  card:       { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0E8D8',
                borderRadius: 10, padding: 13, marginBottom: 8, flexDirection: 'row', alignItems: 'center',
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  cardActive: { backgroundColor: '#F0FAF4', borderColor: GOLD },
  cardMain:   { flex: 1 },
  cardActions:{ flexDirection: 'row', gap: 6, alignItems: 'center' },
  iconBtn:    { padding: 6 },
  taskT:      { color: DARK_GREEN, fontSize: 14 },
  done:       { color: '#aaa', textDecorationLine: 'line-through' },
  statusIcon: { marginRight: 10 },
  snack:      { backgroundColor: DARK_GREEN },
});
