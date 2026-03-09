import React, { useEffect, useState, useCallback } from 'react';
import {
  View as RNView,
  Image as RNImage,
  TouchableOpacity as RNTouchable,
  StyleSheet,
  ActivityIndicator as RNActivityIndicator,
} from 'react-native';
import { Text, TextInput as PaperInput, Button, Dialog, Portal, Snackbar } from 'react-native-paper';

// TypeScript 5.9 / RN compat casts
const View             = RNView             as unknown as React.FC<{ style?: any; children?: React.ReactNode }>;
const Image            = RNImage            as unknown as React.FC<{ source: any; style?: any; onError?: () => void }>;
const TouchableOpacity = RNTouchable        as any;
const TextInput        = PaperInput         as any;
const ActivityIndicator= RNActivityIndicator as unknown as React.FC<{ size?: any; color?: string; style?: any }>;

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { tasksAPI } from '../services/api';

interface Task { id: number; titulo: string; completada: boolean; }

const GREEN      = '#00723F';
const DARK_GREEN = '#024731';
const GOLD       = '#DD971A';

const getInitials = (mail: string) => {
  if (!mail) return '?';
  const parts = mail.split('@')[0].split(/[._-]/);
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?';
};

export default function TasksScreen() {
  const navigation = useNavigation<any>();
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [titulo, setTitulo]     = useState('');
  const [errorTarea, setErrorTarea] = useState('');
  const [snack, setSnack]       = useState({ message: '', visible: false });

  const [initialLoading, setInitialLoading] = useState(true);
  const [addingTask, setAddingTask]         = useState(false);
  const [deletingId, setDeletingId]         = useState<number | null>(null);

  // avatar en header
  const [email, setEmail]           = useState('');
  const [photoUri, setPhotoUri]     = useState<string | null>(null);
  const [photoError, setPhotoError] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<{ visible: boolean; id: number | null }>({ visible: false, id: null });
  const [editDialog, setEditDialog]     = useState<{ visible: boolean; task: Task | null; titulo: string }>({ visible: false, task: null, titulo: '' });

  const showSnack = (message: string) => setSnack({ message, visible: true });

  // recarga foto/email cada vez que volvemos a esta pantalla
  useFocusEffect(useCallback(() => {
    AsyncStorage.multiGet(['userEmail', 'userPhoto']).then(([[, mail], [, photo]]) => {
      if (mail) setEmail(mail);
      if (photo !== photoUri) { setPhotoUri(photo); setPhotoError(false); }
    });
  }, []));

  const cargar = useCallback(async (showInitial = false) => {
    if (showInitial) setInitialLoading(true);
    try {
      const { data } = await tasksAPI.getAll();
      setTasks(data);
    } finally {
      if (showInitial) setInitialLoading(false);
    }
  }, []);

  useEffect(() => { cargar(true); }, [cargar]);

  const agregar = async () => {
    if (!titulo.trim()) { setErrorTarea('Escribe el nombre de la tarea'); return; }
    if (titulo.trim().length < 3) { setErrorTarea('Mínimo 3 caracteres'); return; }
    setErrorTarea('');
    setAddingTask(true);
    try {
      await tasksAPI.create(titulo.trim());
      setTitulo('');
      await cargar();
      showSnack('Tarea creada');
    } finally {
      setAddingTask(false);
    }
  };

  const toggle = async (t: Task) => {
    await tasksAPI.toggle(t.id, !t.completada); cargar();
  };

  const confirmarEliminar = async () => {
    if (deleteDialog.id) {
      const id = deleteDialog.id;
      setDeleteDialog({ visible: false, id: null });
      setDeletingId(id);
      try {
        await tasksAPI.remove(id);
        await cargar();
        showSnack('Tarea eliminada');
      } finally {
        setDeletingId(null);
      }
    } else {
      setDeleteDialog({ visible: false, id: null });
    }
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

  const pendientes = tasks.filter(t => !t.completada).length;
  const showPhoto  = photoUri && !photoError;

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Task>) => (
    <ScaleDecorator activeScale={1.02}>
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
            {deletingId === item.id
              ? <ActivityIndicator size={18} color="#ef4444" />
              : <Ionicons name="trash-outline" size={18} color="#ef4444" />}
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

      {/* ── Header ── */}
      <View style={s.topRow}>
        {/* Izquierda: nombre de app + contador */}
        <View style={s.headerLeft}>
          <Text style={s.appName}>Cima Task</Text>
          <Text style={s.pendingsBadge}>
            {pendientes > 0 ? `${pendientes} pendiente${pendientes !== 1 ? 's' : ''}` : 'Todo al día ✓'}
          </Text>
        </View>

        {/* Derecha: avatar → navega a cuenta */}
        <TouchableOpacity
          style={s.avatarBtn}
          onPress={() => navigation.navigate('Account')}
          activeOpacity={0.8}
        >
          {showPhoto ? (
            <Image
              source={{ uri: photoUri as string }}
              style={s.avatarImg}
              onError={() => setPhotoError(true)}
            />
          ) : (
            <View style={s.avatarFallback}>
              <Text style={s.avatarInitials}>{getInitials(email)}</Text>
            </View>
          )}
          {/* anillo dorado */}
          <View style={s.avatarRing} />
        </TouchableOpacity>
      </View>

      {/* Input nueva tarea */}
      <View style={s.row}>
        <TextInput
          mode="outlined"
          placeholder="Nueva tarea..."
          value={titulo}
          onChangeText={(t: string) => { setTitulo(t); setErrorTarea(''); }}
          onSubmitEditing={agregar}
          style={s.input}
          error={!!errorTarea}
        />
        <TouchableOpacity style={[s.addBtn, addingTask && s.addBtnDisabled]} onPress={agregar} disabled={addingTask}>
          {addingTask
            ? <ActivityIndicator color="#fff" size={20} />
            : <Text style={s.addT}>+</Text>}
        </TouchableOpacity>
      </View>
      {errorTarea ? <Text style={s.errorT}>{errorTarea}</Text> : null}

      {/* Lista de tareas */}
      {initialLoading ? (
        <View style={s.listLoader}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={s.listLoaderText}>Cargando tareas...</Text>
        </View>
      ) : (
        <DraggableFlatList
          data={tasks}
          keyExtractor={t => String(t.id)}
          renderItem={renderItem}
          onDragEnd={({ data }) => setTasks(data)}
          containerStyle={s.listContainer}
          activationDistance={5}
        />
      )}

      {/* Dialogs */}
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

        <Dialog visible={editDialog.visible} onDismiss={() => setEditDialog({ visible: false, task: null, titulo: '' })}>
          <Dialog.Title>Editar tarea</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              value={editDialog.titulo}
              onChangeText={(t: string) => setEditDialog(p => ({ ...p, titulo: t }))}
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

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 56 },

  // header
  topRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                     backgroundColor: GREEN, marginTop: -56,
                     paddingLeft: 20, paddingRight: 16, paddingTop: 56, paddingBottom: 16 },
  headerLeft:      { flex: 1 },
  appName:         { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', letterSpacing: 0.3 },
  pendingsBadge:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },

  // avatar en header
  avatarBtn:       { position: 'relative', marginLeft: 12 },
  avatarImg:       { width: 44, height: 44, borderRadius: 22 },
  avatarFallback:  { width: 44, height: 44, borderRadius: 22, backgroundColor: DARK_GREEN,
                     justifyContent: 'center', alignItems: 'center' },
  avatarInitials:  { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  avatarRing:      { position: 'absolute', top: -2, left: -2, width: 48, height: 48,
                     borderRadius: 24, borderWidth: 2, borderColor: GOLD },

  // input area
  row:             { flexDirection: 'row', gap: 10, marginBottom: 4, paddingHorizontal: 20, marginTop: 16 },
  input:           { flex: 1, backgroundColor: '#FFFFFF' },
  addBtn:          { backgroundColor: GREEN, borderRadius: 10, width: 48, justifyContent: 'center', alignItems: 'center' },
  addBtnDisabled:  { opacity: 0.7 },
  addT:            { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  errorT:          { color: '#ef4444', fontSize: 12, marginBottom: 8, marginLeft: 22 },

  // list
  listContainer:   { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  listLoader:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  listLoaderText:  { color: DARK_GREEN, fontSize: 15, fontWeight: '500' },

  // task card
  card:            { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0E8D8',
                     borderRadius: 10, padding: 13, marginBottom: 8, flexDirection: 'row', alignItems: 'center',
                     shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  cardActive:      { backgroundColor: '#F0FAF4', borderColor: GOLD, elevation: 8, shadowOpacity: 0.18, shadowRadius: 8 },
  cardMain:        { flex: 1 },
  cardActions:     { flexDirection: 'row', gap: 6, alignItems: 'center' },
  iconBtn:         { padding: 6 },
  taskT:           { color: DARK_GREEN, fontSize: 14 },
  done:            { color: '#aaa', textDecorationLine: 'line-through' },
  statusIcon:      { marginRight: 10 },
  snack:           { backgroundColor: DARK_GREEN },
});
