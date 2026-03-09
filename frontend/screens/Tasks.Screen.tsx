import React, { useEffect, useState, useCallback } from 'react';
import {
  View as RNView,
  Image as RNImage,
  TouchableOpacity as RNTouchable,
  Text as RNText,
  StyleSheet,
  ActivityIndicator as RNActivityIndicator,
  Modal as RNModal,
} from 'react-native';
import { Text, TextInput as PaperInput, Button, Dialog, Portal, Snackbar } from 'react-native-paper';

// TypeScript 5.9 / RN compat casts
const View             = RNView             as unknown as React.FC<{ style?: any; children?: React.ReactNode }>;
const Image            = RNImage            as unknown as React.FC<{ source: any; style?: any; onError?: () => void }>;
const TouchableOpacity = RNTouchable        as any;
const TextInput        = PaperInput         as any;
const ActivityIndicator= RNActivityIndicator as unknown as React.FC<{ size?: any; color?: string; style?: any }>;
const Modal            = RNModal            as unknown as React.FC<{ transparent?: boolean; animationType?: string; visible?: boolean; onRequestClose?: () => void; children?: React.ReactNode }>;
const NativeText       = RNText             as unknown as React.FC<{ style?: any; numberOfLines?: number; ellipsizeMode?: string; children?: React.ReactNode }>;

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { tasksAPI } from '../services/api';

interface Task {
  id: number;
  titulo: string;
  completada: boolean;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente' | null;
  tiempo_limite: number | null; // total minutes
  created_at: string;
}

const GREEN      = '#00723F';
const DARK_GREEN = '#024731';
const GOLD       = '#DD971A';

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  urgente: { label: 'URGENTE', color: '#dc2626', bg: '#fee2e2' },
  alta:    { label: 'ALTA',    color: '#ea580c', bg: '#ffedd5' },
  media:   { label: 'MEDIA',   color: '#d97706', bg: '#fef3c7' },
  baja:    { label: 'BAJA',    color: '#2563eb', bg: '#dbeafe' },
};

const PRIORITIES = [
  { key: null,      label: 'Ninguna',  color: '#94a3b8', bg: '#f1f5f9' },
  { key: 'baja',   label: 'Baja',     color: '#2563eb', bg: '#dbeafe' },
  { key: 'media',  label: 'Media',    color: '#d97706', bg: '#fef3c7' },
  { key: 'alta',   label: 'Alta',     color: '#ea580c', bg: '#ffedd5' },
  { key: 'urgente',label: 'Urgente',  color: '#dc2626', bg: '#fee2e2' },
];

const getInitials = (mail: string) => {
  if (!mail) return '?';
  const parts = mail.split('@')[0].split(/[._-]/);
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?';
};

const parseMins = (mins: number | null) =>
  mins ? { h: Math.floor(mins / 60), m: mins % 60 } : { h: 0, m: 0 };

const getTimeInfo = (task: Task): { label: string; expired: boolean } | null => {
  if (!task.tiempo_limite || task.completada) return null;
  const deadline = new Date(new Date(task.created_at).getTime() + task.tiempo_limite * 60000);
  const diffMs   = deadline.getTime() - Date.now();
  if (diffMs <= 0) return { label: 'Vencida', expired: true };
  const diffMins = Math.floor(diffMs / 60000);
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  const label = h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`;
  return { label, expired: false };
};

export default function TasksScreen() {
  const navigation = useNavigation<any>();
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [titulo, setTitulo]         = useState('');
  const [errorTarea, setErrorTarea] = useState('');
  const [snack, setSnack]           = useState({ message: '', visible: false });

  const [initialLoading, setInitialLoading] = useState(true);
  const [addingTask, setAddingTask]         = useState(false);
  const [deletingId, setDeletingId]         = useState<number | null>(null);

  const [email, setEmail]           = useState('');
  const [photoUri, setPhotoUri]     = useState<string | null>(null);
  const [photoError, setPhotoError] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<{ visible: boolean; id: number | null }>({ visible: false, id: null });

  const [editModal, setEditModal] = useState<{
    visible: boolean;
    task: Task | null;
    titulo: string;
    prioridad: string | null;
    horasLimite: number;
    minutosLimite: number;
  }>({ visible: false, task: null, titulo: '', prioridad: null, horasLimite: 0, minutosLimite: 0 });

  const showSnack = (message: string) => setSnack({ message, visible: true });

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
    await tasksAPI.toggle(t.id, !t.completada);
    cargar();
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

  const openEdit = (task: Task) => {
    const { h, m } = parseMins(task.tiempo_limite);
    setEditModal({ visible: true, task, titulo: task.titulo, prioridad: task.prioridad ?? null, horasLimite: h, minutosLimite: m });
  };

  const confirmarEditar = async () => {
    const { task, titulo: t, prioridad, horasLimite: h, minutosLimite: m } = editModal;
    if (!task || !t.trim()) return;
    const tiempoLimite = (h > 0 || m > 0) ? h * 60 + m : null;
    await tasksAPI.edit(task.id, t.trim(), prioridad, tiempoLimite);
    setEditModal(p => ({ ...p, visible: false, task: null }));
    cargar();
    showSnack('Tarea actualizada');
  };

  const pendientes = tasks.filter(t => !t.completada).length;
  const showPhoto  = photoUri && !photoError;
  const tieneLimite = editModal.horasLimite > 0 || editModal.minutosLimite > 0;

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Task>) => {
    const pCfg     = item.prioridad ? PRIORITY_CONFIG[item.prioridad] : null;
    const timeInfo = getTimeInfo(item);
    const hasBadges = !item.completada && (pCfg || timeInfo);

    return (
      <ScaleDecorator activeScale={1.02}>
        <View style={[s.card, isActive && s.cardActive]}>

          {/* ── Fila superior: checkbox + título ── */}
          <View style={s.cardTop}>
            <TouchableOpacity
              onPress={() => toggle(item)}
              style={s.statusIcon}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            >
              <Ionicons
                name={item.completada ? 'checkmark-circle' : 'ellipse-outline'}
                size={26}
                color={item.completada ? '#22c55e' : '#cbd5e1'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={s.cardTitleWrap} onPress={() => toggle(item)} activeOpacity={0.7}>
              <NativeText
                style={[s.taskT, item.completada && s.done]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.titulo}
              </NativeText>
            </TouchableOpacity>
          </View>

          {/* ── Fila inferior: badges + acciones ── */}
          <View style={s.cardBottom}>
            <View style={s.badgesRow}>
              {hasBadges && pCfg && (
                <View style={[s.chip, { backgroundColor: pCfg.bg, borderColor: pCfg.color }]}>
                  <View style={[s.chipDot, { backgroundColor: pCfg.color }]} />
                  <Text style={[s.chipText, { color: pCfg.color }]}>{pCfg.label}</Text>
                </View>
              )}
              {hasBadges && timeInfo && (
                <View style={[s.chip, timeInfo.expired ? s.chipExpired : s.chipTime]}>
                  <Ionicons name="time-outline" size={10} color={timeInfo.expired ? '#dc2626' : '#059669'} />
                  <Text style={[s.chipText, timeInfo.expired ? s.chipExpiredText : s.chipTimeText]}>
                    {timeInfo.expired ? 'Vencida' : `Vence en ${timeInfo.label}`}
                  </Text>
                </View>
              )}
            </View>

            <View style={s.cardActions}>
              <TouchableOpacity style={s.iconBtn} onPress={() => openEdit(item)}>
                <Ionicons name="pencil-outline" size={17} color="#94a3b8" />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconBtn} onPress={() => setDeleteDialog({ visible: true, id: item.id })}>
                {deletingId === item.id
                  ? <ActivityIndicator size={17} color="#ef4444" />
                  : <Ionicons name="trash-outline" size={17} color="#ef4444" />}
              </TouchableOpacity>
              <TouchableOpacity onLongPress={drag} delayLongPress={150} style={s.iconBtn}>
                <Ionicons name="reorder-three-outline" size={20} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScaleDecorator>
    );
  };

  return (
    <View style={s.container}>

      {/* ── Header ── */}
      <View style={s.topRow}>
        <View style={s.headerLeft}>
          <Text style={s.appName}>Cima Task</Text>
          {pendientes > 0 ? (
            <View style={s.pendingBadge}>
              <Ionicons name="time-outline" size={14} color={GOLD} />
              <Text style={s.pendingBadgeText}>
                {pendientes} pendiente{pendientes !== 1 ? 's' : ''}
              </Text>
            </View>
          ) : (
            <View style={s.allDoneBadge}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#4ade80" />
              <Text style={s.allDoneText}>Todo al día</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={s.avatarBtn} onPress={() => navigation.navigate('Account')} activeOpacity={0.8}>
          {showPhoto ? (
            <Image source={{ uri: photoUri as string }} style={s.avatarImg} onError={() => setPhotoError(true)} />
          ) : (
            <View style={s.avatarFallback}>
              <Text style={s.avatarInitials}>{getInitials(email)}</Text>
            </View>
          )}
          <View style={s.avatarRing} />
        </TouchableOpacity>
      </View>

      {/* ── Input nueva tarea ── */}
      <View style={s.row}>
        <TextInput
          mode="outlined"
          placeholder="Nueva tarea..."
          value={titulo}
          onChangeText={(t: string) => { setTitulo(t); setErrorTarea(''); }}
          onSubmitEditing={agregar}
          style={s.input}
          error={!!errorTarea}
          outlineColor={GREEN}
          activeOutlineColor={DARK_GREEN}
        />
        <TouchableOpacity style={[s.addBtn, addingTask && s.addBtnDisabled]} onPress={agregar} disabled={addingTask}>
          {addingTask
            ? <ActivityIndicator color="#fff" size={20} />
            : <Text style={s.addT}>+</Text>}
        </TouchableOpacity>
      </View>
      {errorTarea ? <Text style={s.errorT}>{errorTarea}</Text> : null}

      {/* ── Lista ── */}
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

      {/* ── Edit Modal (bottom sheet) ── */}
      <Modal
        transparent
        animationType="slide"
        visible={editModal.visible}
        onRequestClose={() => setEditModal(p => ({ ...p, visible: false }))}
      >
        <TouchableOpacity
          style={em.overlay}
          activeOpacity={1}
          onPress={() => setEditModal(p => ({ ...p, visible: false }))}
        >
          <TouchableOpacity activeOpacity={1} style={em.sheet} onPress={() => {}}>
            {/* Handle bar */}
            <View style={em.handle} />

            <Text style={em.title}>Editar tarea</Text>

            {/* Título */}
            <Text style={em.label}>Título</Text>
            <TextInput
              mode="outlined"
              value={editModal.titulo}
              onChangeText={(t: string) => setEditModal(p => ({ ...p, titulo: t }))}
              style={em.input}
              outlineColor={GREEN}
              activeOutlineColor={DARK_GREEN}
              autoFocus
            />

            {/* Prioridad */}
            <Text style={em.label}>Prioridad</Text>
            <View style={em.prioRow}>
              {PRIORITIES.map(({ key, label, color, bg }) => {
                const selected = editModal.prioridad === key;
                return (
                  <TouchableOpacity
                    key={String(key)}
                    style={[em.prioPill, selected && { backgroundColor: bg, borderColor: color }]}
                    onPress={() => setEditModal(p => ({ ...p, prioridad: key }))}
                  >
                    {selected && <View style={[em.prioDot, { backgroundColor: color }]} />}
                    <Text style={[em.prioPillText, selected && { color }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tiempo límite */}
            <Text style={em.label}>Tiempo límite</Text>
            <View style={em.timePicker}>
              {/* Hours */}
              <View style={em.hourBlock}>
                <Text style={em.pickerSubLabel}>Horas</Text>
                <View style={em.spinRow}>
                  <TouchableOpacity
                    style={em.spinBtn}
                    onPress={() => setEditModal(p => ({ ...p, horasLimite: Math.max(0, p.horasLimite - 1) }))}
                  >
                    <Ionicons name="remove" size={20} color={DARK_GREEN} />
                  </TouchableOpacity>
                  <Text style={em.spinVal}>{editModal.horasLimite}</Text>
                  <TouchableOpacity
                    style={em.spinBtn}
                    onPress={() => setEditModal(p => ({ ...p, horasLimite: Math.min(23, p.horasLimite + 1) }))}
                  >
                    <Ionicons name="add" size={20} color={DARK_GREEN} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Minutes */}
              <View style={em.minBlock}>
                <Text style={em.pickerSubLabel}>Minutos</Text>
                <View style={em.minRow}>
                  {[0, 15, 30, 45].map(m => {
                    const active = editModal.minutosLimite === m && tieneLimite;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[em.minBtn, active && em.minBtnActive]}
                        onPress={() => setEditModal(p => ({ ...p, minutosLimite: m }))}
                      >
                        <Text style={[em.minBtnText, active && em.minBtnTextActive]}>{m}m</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Time preview / clear */}
            {tieneLimite ? (
              <View style={em.timePreview}>
                <Ionicons name="time-outline" size={14} color={GREEN} />
                <Text style={em.timePreviewText}>
                  {editModal.horasLimite > 0 ? `${editModal.horasLimite}h ` : ''}{editModal.minutosLimite}m de límite
                </Text>
                <TouchableOpacity onPress={() => setEditModal(p => ({ ...p, horasLimite: 0, minutosLimite: 0 }))}>
                  <Text style={em.timeClear}>× Quitar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={em.timeHint}>Sin límite de tiempo</Text>
            )}

            {/* Actions */}
            <View style={em.actions}>
              <Button
                mode="outlined"
                onPress={() => setEditModal(p => ({ ...p, visible: false }))}
                style={em.btnCancel}
                textColor={DARK_GREEN}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={confirmarEditar}
                buttonColor={GREEN}
                style={em.btnSave}
              >
                Guardar
              </Button>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Delete Dialog & Snackbar */}
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

// ── Main styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 56 },

  // header
  topRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: GREEN, marginTop: -56,
                    paddingLeft: 20, paddingRight: 16, paddingTop: 56, paddingBottom: 18 },
  headerLeft:     { flex: 1 },
  appName:        { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', letterSpacing: 0.3 },

  pendingBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5,
                      backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 20,
                      paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginTop: 7,
                      borderWidth: 1, borderColor: GOLD },
  pendingBadgeText: { color: GOLD, fontSize: 16, fontWeight: '700' },

  allDoneBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5,
                    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
                    paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginTop: 7 },
  allDoneText:    { color: '#4ade80', fontSize: 14, fontWeight: '600' },

  // avatar
  avatarBtn:      { position: 'relative', marginLeft: 12 },
  avatarImg:      { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: { width: 46, height: 46, borderRadius: 23, backgroundColor: DARK_GREEN,
                    justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  avatarRing:     { position: 'absolute', top: -2, left: -2, width: 50, height: 50,
                    borderRadius: 25, borderWidth: 2, borderColor: GOLD },

  // input
  row:            { flexDirection: 'row', gap: 10, marginBottom: 4, paddingHorizontal: 16, marginTop: 14 },
  input:          { flex: 1, backgroundColor: '#FFFFFF' },
  addBtn:         { backgroundColor: GREEN, borderRadius: 12, width: 50, justifyContent: 'center', alignItems: 'center',
                    shadowColor: GREEN, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 },
  addBtnDisabled: { opacity: 0.7 },
  addT:           { color: '#FFFFFF', fontSize: 26, fontWeight: 'bold', marginTop: -2 },
  errorT:         { color: '#ef4444', fontSize: 12, marginBottom: 8, marginLeft: 18 },

  // list
  listContainer:  { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  listLoader:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  listLoaderText: { color: DARK_GREEN, fontSize: 15, fontWeight: '500' },

  // task card
  card:           { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2EEE8',
                    borderRadius: 14, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 8,
                    marginBottom: 10,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardActive:     { backgroundColor: '#F0FAF4', borderColor: GOLD, elevation: 10, shadowOpacity: 0.20, shadowRadius: 10 },
  cardTop:        { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitleWrap:  { flex: 1 },
  cardBottom:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 36 },
  cardActions:    { flexDirection: 'row', gap: 0, alignItems: 'center' },
  iconBtn:        { padding: 6 },
  taskT:          { color: DARK_GREEN, fontSize: 15, fontWeight: '500', lineHeight: 22 },
  done:           { color: '#aaa', textDecorationLine: 'line-through' },
  statusIcon:     { marginRight: 10 },

  // card badges
  badgesRow:          { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 },
  chip:               { flexDirection: 'row', alignItems: 'center', gap: 4,
                        borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
                        borderWidth: 1 },
  chipDot:            { width: 6, height: 6, borderRadius: 3 },
  chipText:           { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  chipTime:           { backgroundColor: '#ecfdf5', borderColor: '#059669' },
  chipTimeText:       { color: '#059669' },
  chipExpired:        { backgroundColor: '#fee2e2', borderColor: '#dc2626' },
  chipExpiredText:    { color: '#dc2626' },

  snack:          { backgroundColor: DARK_GREEN },
});

// ── Edit modal styles ────────────────────────────────────────────────────────
const em = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
                paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
  handle:     { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2,
                alignSelf: 'center', marginBottom: 20 },
  title:      { fontSize: 20, fontWeight: 'bold', color: DARK_GREEN, marginBottom: 4 },
  label:      { fontSize: 12, fontWeight: '700', color: '#64748b', marginTop: 16, marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: 0.5 },
  input:      { backgroundColor: '#fff' },

  // priority
  prioRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prioPill:       { flexDirection: 'row', alignItems: 'center', gap: 5,
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  prioDot:        { width: 7, height: 7, borderRadius: 3.5 },
  prioPillText:   { fontSize: 13, fontWeight: '600', color: '#94a3b8' },

  // time picker
  timePicker:     { flexDirection: 'row', gap: 16, marginTop: 4, alignItems: 'flex-start' },
  hourBlock:      { alignItems: 'center' },
  pickerSubLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  spinRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  spinBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F0FAF4',
                    justifyContent: 'center', alignItems: 'center',
                    borderWidth: 1, borderColor: '#D0E8D8' },
  spinVal:        { fontSize: 24, fontWeight: 'bold', color: DARK_GREEN, minWidth: 36, textAlign: 'center' },

  minBlock:       { flex: 1 },
  minRow:         { flexDirection: 'row', gap: 6 },
  minBtn:         { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                    borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  minBtnActive:   { backgroundColor: '#F0FAF4', borderColor: GREEN },
  minBtnText:     { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  minBtnTextActive: { color: GREEN },

  // time preview
  timePreview:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  timePreviewText:{ fontSize: 13, color: GREEN, fontWeight: '500' },
  timeClear:      { fontSize: 13, color: '#ef4444', fontWeight: '600', marginLeft: 4 },
  timeHint:       { fontSize: 13, color: '#94a3b8', marginTop: 10, fontStyle: 'italic' },

  // actions
  actions:   { flexDirection: 'row', gap: 12, marginTop: 24 },
  btnCancel: { flex: 1, borderColor: DARK_GREEN },
  btnSave:   { flex: 1 },
});
