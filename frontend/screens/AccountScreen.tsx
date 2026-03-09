import React, { useEffect, useState } from 'react';
import {
  View as RNView,
  Image as RNImage,
  TouchableOpacity as RNTouchable,
  StyleSheet,
  ActivityIndicator as RNActivityIndicator,
  ScrollView as RNScrollView,
  Modal as RNModal,
} from 'react-native';
import { Text, TextInput as PaperInput, Button, Dialog, Portal, Snackbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { authAPI } from '../services/api';

// TypeScript 5.9 / RN compat casts
const View             = RNView       as unknown as React.FC<{ style?: any; children?: React.ReactNode }>;
const Image            = RNImage      as unknown as React.FC<{ source: any; style?: any; onError?: () => void }>;
const TouchableOpacity = RNTouchable  as any;
const TextInput        = PaperInput   as any;
const ActivityIndicator= RNActivityIndicator as unknown as React.FC<{ size?: any; color?: string }>;
const ScrollView       = RNScrollView as unknown as React.FC<{ style?: any; contentContainerStyle?: any; children?: React.ReactNode; keyboardShouldPersistTaps?: any }>;
const Modal            = RNModal      as unknown as React.FC<{ transparent?: boolean; animationType?: string; visible?: boolean; children?: React.ReactNode }>;

const GREEN      = '#00723F';
const DARK_GREEN = '#024731';
const GOLD       = '#DD971A';

const ls = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  box:     { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', gap: 14,
             shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 8 },
  lsText:  { color: DARK_GREEN, fontSize: 15, fontWeight: '600' },
});

const getInitials = (mail: string) => {
  if (!mail) return '?';
  const parts = mail.split('@')[0].split(/[._-]/);
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?';
};

const isValidEmail  = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidPass   = (v: string) => v.length >= 6;

// ── Modal: cambiar correo ─────────────────────────────────────────────────────
function EmailModal({
  visible, currentEmail, onClose, onSuccess,
}: {
  visible: boolean; currentEmail: string;
  onClose: () => void; onSuccess: (email: string) => void;
}) {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState('');

  const reset = () => { setNewEmail(''); setPassword(''); setErrors({}); setApiError(''); };

  const validate = () => {
    const e: { email?: string; password?: string } = {};
    if (!newEmail.trim()) e.email = 'Ingresa el nuevo correo';
    else if (!isValidEmail(newEmail)) e.email = 'Formato de correo inválido';
    else if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase())
      e.email = 'El correo es igual al actual';
    if (!password) e.password = 'Ingresa tu contraseña actual';
    else if (!isValidPass(password)) e.password = 'Mínimo 6 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    setApiError('');
    if (!validate()) return;
    try {
      setSaving(true);
      const { data } = await authAPI.changeEmail(newEmail.trim().toLowerCase(), password);
      await AsyncStorage.setItem('userEmail', data.email);
      onSuccess(data.email);
      reset();
    } catch (e: any) {
      setApiError(e.response?.data?.error ?? 'Error al cambiar correo');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog visible={visible} onDismiss={handleClose}>
      <Dialog.Title>Cambiar correo</Dialog.Title>
      <Dialog.Content>
        {/* correo actual */}
        <View style={s.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={GREEN} />
          <Text style={s.infoText} numberOfLines={1}>
            {'  '}Correo actual: <Text style={s.infoBold}>{currentEmail}</Text>
          </Text>
        </View>

        <TextInput
          label="Nuevo correo electrónico"
          mode="outlined"
          value={newEmail}
          onChangeText={(t: string) => { setNewEmail(t); setErrors(p => ({ ...p, email: undefined })); setApiError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!errors.email}
          style={s.input}
          outlineColor={GREEN}
          activeOutlineColor={DARK_GREEN}
          left={<PaperInput.Icon icon="email-outline" color={GREEN} />}
        />
        {errors.email ? <Text style={s.errorT}>{errors.email}</Text> : null}

        <TextInput
          label="Contraseña actual"
          mode="outlined"
          value={password}
          onChangeText={(t: string) => { setPassword(t); setErrors(p => ({ ...p, password: undefined })); setApiError(''); }}
          secureTextEntry
          error={!!errors.password}
          style={s.input}
          outlineColor={GREEN}
          activeOutlineColor={DARK_GREEN}
          left={<PaperInput.Icon icon="lock-outline" color={GREEN} />}
        />
        {errors.password ? <Text style={s.errorT}>{errors.password}</Text> : null}
        {apiError ? <Text style={s.apiError}>{apiError}</Text> : null}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={handleClose} disabled={saving}>Cancelar</Button>
        <Button onPress={handleSave} loading={saving} disabled={saving} textColor={GREEN}>Guardar</Button>
      </Dialog.Actions>
    </Dialog>
  );
}

// ── Modal: cambiar contraseña ─────────────────────────────────────────────────
function PasswordModal({
  visible, onClose, onSuccess,
}: {
  visible: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass]         = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [errors, setErrors]           = useState<{ current?: string; new?: string; confirm?: string }>({});
  const [saving, setSaving]           = useState(false);
  const [apiError, setApiError]       = useState('');

  const reset = () => { setCurrentPass(''); setNewPass(''); setConfirmPass(''); setErrors({}); setApiError(''); };

  const validate = () => {
    const e: { current?: string; new?: string; confirm?: string } = {};
    if (!currentPass) e.current = 'Ingresa tu contraseña actual';
    else if (!isValidPass(currentPass)) e.current = 'Mínimo 6 caracteres';
    if (!newPass) e.new = 'Ingresa la nueva contraseña';
    else if (!isValidPass(newPass)) e.new = 'Mínimo 6 caracteres';
    if (!confirmPass) e.confirm = 'Confirma la nueva contraseña';
    else if (newPass !== confirmPass) e.confirm = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    setApiError('');
    if (!validate()) return;
    try {
      setSaving(true);
      await authAPI.changePassword(currentPass, newPass);
      onSuccess();
      reset();
    } catch (e: any) {
      setApiError(e.response?.data?.error ?? 'Error al cambiar contraseña');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog visible={visible} onDismiss={handleClose}>
      <Dialog.Title>Cambiar contraseña</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Contraseña actual"
          mode="outlined"
          value={currentPass}
          onChangeText={(t: string) => { setCurrentPass(t); setErrors(p => ({ ...p, current: undefined })); setApiError(''); }}
          secureTextEntry
          error={!!errors.current}
          style={s.input}
          outlineColor={GREEN}
          activeOutlineColor={DARK_GREEN}
          left={<PaperInput.Icon icon="lock-outline" color={GREEN} />}
        />
        {errors.current ? <Text style={s.errorT}>{errors.current}</Text> : null}
        <TextInput
          label="Nueva contraseña"
          mode="outlined"
          value={newPass}
          onChangeText={(t: string) => { setNewPass(t); setErrors(p => ({ ...p, new: undefined })); setApiError(''); }}
          secureTextEntry
          error={!!errors.new}
          style={s.input}
          outlineColor={GREEN}
          activeOutlineColor={DARK_GREEN}
          left={<PaperInput.Icon icon="lock-check-outline" color={GREEN} />}
        />
        {errors.new ? <Text style={s.errorT}>{errors.new}</Text> : null}
        <TextInput
          label="Confirmar nueva contraseña"
          mode="outlined"
          value={confirmPass}
          onChangeText={(t: string) => { setConfirmPass(t); setErrors(p => ({ ...p, confirm: undefined })); setApiError(''); }}
          secureTextEntry
          error={!!errors.confirm}
          style={s.input}
          outlineColor={GREEN}
          activeOutlineColor={DARK_GREEN}
          left={<PaperInput.Icon icon="lock-check-outline" color={GOLD} />}
        />
        {errors.confirm ? <Text style={s.errorT}>{errors.confirm}</Text> : null}
        {apiError ? <Text style={s.apiError}>{apiError}</Text> : null}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={handleClose} disabled={saving}>Cancelar</Button>
        <Button onPress={handleSave} loading={saving} disabled={saving} textColor={GREEN}>Guardar</Button>
      </Dialog.Actions>
    </Dialog>
  );
}

// ── Modal: eliminar cuenta (2 pasos) ──────────────────────────────────────────
function DeleteAccountModal({
  visible, onClose, onDeleted,
}: {
  visible: boolean; onClose: () => void; onDeleted: () => void;
}) {
  const [step, setStep]         = useState<'warn' | 'confirm'>('warn');
  const [password, setPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [apiError, setApiError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const reset = () => { setStep('warn'); setPassword(''); setPassError(''); setApiError(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleDelete = async () => {
    setApiError('');
    if (!password) { setPassError('Ingresa tu contraseña'); return; }
    if (!isValidPass(password)) { setPassError('Mínimo 6 caracteres'); return; }
    setPassError('');
    try {
      setDeleting(true);
      await authAPI.deleteAccount(password);
      await AsyncStorage.multiRemove(['token', 'userEmail', 'userPhoto']);
      onDeleted();
      reset();
    } catch (e: any) {
      setApiError(e.response?.data?.error ?? 'Error al eliminar cuenta');
    } finally {
      setDeleting(false);
    }
  };

  if (step === 'warn') {
    return (
      <Dialog visible={visible} onDismiss={handleClose}>
        <Dialog.Title>⚠️ Eliminar cuenta</Dialog.Title>
        <Dialog.Content>
          <Text style={s.warnText}>
            Esta acción es <Text style={s.warnBold}>irreversible</Text>. Se eliminarán permanentemente:
          </Text>
          <Text style={s.warnItem}>• Tu cuenta de usuario</Text>
          <Text style={s.warnItem}>• Todas tus tareas</Text>
          <Text style={s.warnItem}>• Tu foto de perfil</Text>
          <Text style={{ ...s.warnText, marginTop: 12 }}>¿Deseas continuar?</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleClose}>Cancelar</Button>
          <Button onPress={() => setStep('confirm')} textColor="#ef4444">Sí, continuar</Button>
        </Dialog.Actions>
      </Dialog>
    );
  }

  return (
    <Dialog visible={visible} onDismiss={handleClose}>
      <Dialog.Title>Confirmar eliminación</Dialog.Title>
      <Dialog.Content>
        <Text style={s.confirmText}>Ingresa tu contraseña para confirmar que eres tú.</Text>
        <TextInput
          label="Contraseña"
          mode="outlined"
          value={password}
          onChangeText={(t: string) => { setPassword(t); setPassError(''); setApiError(''); }}
          secureTextEntry
          error={!!passError}
          style={s.input}
          outlineColor="#ef4444"
          activeOutlineColor="#dc2626"
          left={<PaperInput.Icon icon="lock-outline" color="#ef4444" />}
          autoFocus
        />
        {passError ? <Text style={s.errorT}>{passError}</Text> : null}
        {apiError  ? <Text style={s.apiError}>{apiError}</Text>  : null}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={() => { setStep('warn'); setPassword(''); setPassError(''); setApiError(''); }}>
          Atrás
        </Button>
        <Button onPress={handleDelete} loading={deleting} disabled={deleting} textColor="#ef4444">
          Eliminar cuenta
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function AccountScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail]             = useState('');
  const [avatarUri, setAvatarUri]     = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [emailModal, setEmailModal]         = useState(false);
  const [passwordModal, setPasswordModal]   = useState(false);
  const [deleteModal, setDeleteModal]       = useState(false);
  const [loggingOut, setLoggingOut]         = useState(false);
  const [snack, setSnack]                   = useState({ message: '', visible: false });

  const showSnack = (message: string) => setSnack({ message, visible: true });

  const logout = async () => {
    setLoggingOut(true);
    await AsyncStorage.multiRemove(['token', 'userEmail', 'userPhoto']);
    setTimeout(() => {
      setLoggingOut(false);
      navigation.replace('Login', { loggedOut: true });
    }, 600);
  };

  useEffect(() => {
    const load = async () => {
      try {
        // mostrar cache mientras carga
        const [cachedEmail, cachedPhoto] = await Promise.all([
          AsyncStorage.getItem('userEmail'),
          AsyncStorage.getItem('userPhoto'),
        ]);
        if (cachedEmail) setEmail(cachedEmail);
        if (cachedPhoto) setAvatarUri(cachedPhoto);

        const { data } = await authAPI.getMe();
        setEmail(data.email);
        await AsyncStorage.setItem('userEmail', data.email);

        // si la BD tiene avatar, úsalo y actualiza cache
        if (data.avatar) {
          setAvatarUri(data.avatar);
          setAvatarError(false);
          await AsyncStorage.setItem('userPhoto', data.avatar);
        }
      } catch {
        // usa cache si falla la red
      } finally {
        setLoadingUser(false);
      }
    };
    load();
  }, []);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showSnack('Se necesita permiso para acceder a la galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,           // obtenemos base64 directamente
    });
    if (!result.canceled && result.assets[0].base64) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setAvatarUri(base64);
      setAvatarError(false);
      setUploadingPhoto(true);
      try {
        await authAPI.updateAvatar(base64);
        await AsyncStorage.setItem('userPhoto', base64);
        showSnack('Foto actualizada');
      } catch {
        showSnack('Error al guardar la foto');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const showAvatar = avatarUri && !avatarError;

  return (
    <View style={s.container}>
      {/* Loader logout */}
      <Modal transparent animationType="fade" visible={loggingOut}>
        <View style={ls.overlay}>
          <View style={ls.box}>
            <ActivityIndicator size="large" color={GREEN} />
            <Text style={ls.lsText}>Cerrando sesión...</Text>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={s.topRow}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text variant="titleLarge" style={s.headerTitle}>Mi Cuenta</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={s.profileSection}>
          <TouchableOpacity onPress={pickPhoto} style={s.avatarWrap} activeOpacity={0.85} disabled={uploadingPhoto}>
            {loadingUser ? (
              <View style={s.avatar}><ActivityIndicator color="#fff" size="large" /></View>
            ) : showAvatar ? (
              <Image source={{ uri: avatarUri as string }} style={s.avatarImg} onError={() => setAvatarError(true)} />
            ) : (
              <View style={s.avatar}><Text style={s.initials}>{getInitials(email)}</Text></View>
            )}
            <View style={s.goldRing} />
            <View style={[s.cameraBadge, uploadingPhoto && s.cameraBadgeLoading]}>
              {uploadingPhoto
                ? <ActivityIndicator size={12} color="#fff" />
                : <Ionicons name="camera" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
          <Text style={s.emailText}>{email || '...'}</Text>
          <Text style={s.tapHint}>{uploadingPhoto ? 'Guardando foto...' : 'Toca la foto para cambiarla'}</Text>
        </View>

        {/* Opciones */}
        <View style={s.optionsCard}>
          <TouchableOpacity style={s.optionRow} onPress={() => setEmailModal(true)} activeOpacity={0.7}>
            <View style={s.optionIcon}><Ionicons name="mail-outline" size={20} color={GREEN} /></View>
            <View style={s.optionText}>
              <Text style={s.optionLabel}>Correo electrónico</Text>
              <Text style={s.optionValue} numberOfLines={1}>{email || '...'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <View style={s.divider} />

          <TouchableOpacity style={s.optionRow} onPress={() => setPasswordModal(true)} activeOpacity={0.7}>
            <View style={s.optionIcon}><Ionicons name="lock-closed-outline" size={20} color={GREEN} /></View>
            <View style={s.optionText}>
              <Text style={s.optionLabel}>Contraseña</Text>
              <Text style={s.optionValue}>••••••••</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={s.logoutRow} onPress={logout} activeOpacity={0.7}>
          <View style={s.logoutIcon}><Ionicons name="log-out-outline" size={20} color="#ef4444" /></View>
          <Text style={s.logoutLabel}>Cerrar sesión</Text>
        </TouchableOpacity>

        {/* Eliminar cuenta */}
        <TouchableOpacity style={s.deleteRow} onPress={() => setDeleteModal(true)} activeOpacity={0.7}>
          <View style={s.deleteIcon}><Ionicons name="trash-outline" size={20} color="#ef4444" /></View>
          <View style={s.optionText}>
            <Text style={s.deleteLabel}>Eliminar cuenta</Text>
            <Text style={s.deleteHint}>Esta acción es permanente e irreversible</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#fca5a5" />
        </TouchableOpacity>
      </ScrollView>

      <Portal>
        <EmailModal
          visible={emailModal}
          currentEmail={email}
          onClose={() => setEmailModal(false)}
          onSuccess={(newEmail) => { setEmail(newEmail); setEmailModal(false); showSnack('Correo actualizado correctamente'); }}
        />
        <PasswordModal
          visible={passwordModal}
          onClose={() => setPasswordModal(false)}
          onSuccess={() => { setPasswordModal(false); showSnack('Contraseña actualizada correctamente'); }}
        />
        <DeleteAccountModal
          visible={deleteModal}
          onClose={() => setDeleteModal(false)}
          onDeleted={() => navigation.replace('Login', { loggedOut: true })}
        />
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
  container:      { flex: 1, backgroundColor: '#F5F7FA', paddingTop: 56 },
  topRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: GREEN, marginTop: -56,
                    paddingHorizontal: 12, paddingTop: 56, paddingBottom: 14 },
  backBtn:        { padding: 8, borderRadius: 20 },
  headerTitle:    { color: '#FFFFFF', fontWeight: 'bold' },
  scroll:         { paddingBottom: 40 },

  profileSection: { alignItems: 'center', paddingVertical: 36, backgroundColor: '#fff',
                    borderBottomWidth: 1, borderBottomColor: '#E8F5EC' },
  avatarWrap:     { position: 'relative', marginBottom: 14 },
  avatar:         { width: 96, height: 96, borderRadius: 48, backgroundColor: GREEN,
                    justifyContent: 'center', alignItems: 'center' },
  avatarImg:      { width: 96, height: 96, borderRadius: 48 },
  goldRing:       { position: 'absolute', top: -4, left: -4, width: 104, height: 104,
                    borderRadius: 52, borderWidth: 3, borderColor: GOLD },
  cameraBadge:    { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28,
                    borderRadius: 14, backgroundColor: GREEN, borderWidth: 2, borderColor: '#fff',
                    justifyContent: 'center', alignItems: 'center' },
  cameraBadgeLoading: { backgroundColor: '#64a889' },
  initials:       { color: '#fff', fontSize: 34, fontWeight: 'bold' },
  emailText:      { fontSize: 16, fontWeight: '600', color: DARK_GREEN },
  tapHint:        { fontSize: 11, color: '#94a3b8', marginTop: 4 },

  optionsCard:    { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 24,
                    borderRadius: 16, borderWidth: 1, borderColor: '#D0E8D8', overflow: 'hidden' },
  optionRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  optionIcon:     { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0FAF4',
                    justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  optionText:     { flex: 1 },
  optionLabel:    { fontSize: 14, fontWeight: '600', color: DARK_GREEN },
  optionValue:    { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  divider:        { height: 1, backgroundColor: '#E8F5EC', marginLeft: 64 },

  logoutRow:      { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 16,
                    paddingVertical: 16, paddingHorizontal: 16, backgroundColor: '#fff',
                    borderRadius: 16, borderWidth: 1, borderColor: '#fecaca' },
  logoutIcon:     { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff1f1',
                    justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logoutLabel:    { fontSize: 14, fontWeight: '600', color: '#ef4444' },

  deleteRow:      { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 10,
                    paddingVertical: 16, paddingHorizontal: 16, backgroundColor: '#fff',
                    borderRadius: 16, borderWidth: 1, borderColor: '#fecaca' },
  deleteIcon:     { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff1f1',
                    justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  deleteLabel:    { fontSize: 14, fontWeight: '600', color: '#ef4444' },
  deleteHint:     { fontSize: 11, color: '#fca5a5', marginTop: 1 },

  // modal internals
  infoBox:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FAF4',
                    borderRadius: 8, padding: 10, marginBottom: 12 },
  infoText:       { flex: 1, fontSize: 12, color: DARK_GREEN },
  infoBold:       { fontWeight: '700' },
  input:          { marginBottom: 4, backgroundColor: '#FFFFFF' },
  errorT:         { color: '#ef4444', fontSize: 12, marginBottom: 6, marginLeft: 4 },
  apiError:       { color: '#ef4444', fontSize: 13, marginTop: 8, textAlign: 'center', fontWeight: '500' },
  warnText:       { fontSize: 14, color: '#374151', lineHeight: 20 },
  warnBold:       { fontWeight: '700', color: '#ef4444' },
  warnItem:       { fontSize: 13, color: '#6b7280', marginTop: 6, marginLeft: 8 },
  confirmText:    { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  snack:          { backgroundColor: DARK_GREEN },
});
