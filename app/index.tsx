import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SectionCard } from '@/components/SectionCard';
import { emergencyContacts, quickGuides } from '@/lib/constants';

type PickedMedia = {
  uri: string;
  type: 'photo' | 'video';
};

type FlagsState = {
  bleeding: boolean;
  baby: boolean;
  catDog: boolean;
  canNotMove: boolean;
  roadRisk: boolean;
};

const FLAG_LABELS: Array<{ key: keyof FlagsState; label: string }> = [
  { key: 'bleeding', label: 'Sangra' },
  { key: 'baby', label: 'Es cría' },
  { key: 'catDog', label: 'Ataque de gato/perro' },
  { key: 'canNotMove', label: 'No se mueve bien' },
  { key: 'roadRisk', label: 'Peligro en carretera' },
];

export default function HomeScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [locationText, setLocationText] = useState('Ubicación no capturada todavía.');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [flags, setFlags] = useState<FlagsState>({
    bleeding: false,
    baby: false,
    catDog: false,
    canNotMove: false,
    roadRisk: false,
  });

  const summary = useMemo(() => {
    const selectedFlags =
      FLAG_LABELS.filter(({ key }) => flags[key])
        .map(({ label }) => label)
        .join(', ') || 'Sin marcas';

    const mapsUrl = coords
      ? `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`
      : 'Sin ubicación';

    return [
      'AVISO DE RESCATE DE FAUNA',
      `Nombre: ${fullName || 'No indicado'}`,
      `Teléfono: ${phone || 'No indicado'}`,
      `Ubicación: ${locationText}`,
      `Mapa: ${mapsUrl}`,
      `Indicadores: ${selectedFlags}`,
      `Observaciones: ${notes || 'Sin observaciones'}`,
      media ? `Adjunto preparado: ${media.type}` : 'Adjunto preparado: no',
      '',
      'Nota MVP: esta primera fase prepara el aviso para enviarlo por WhatsApp, manteniendo el flujo actual.',
    ].join('\n');
  }, [coords, flags, fullName, locationText, media, notes, phone]);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permiso necesario',
        'Necesitamos acceso a la cámara para capturar la foto.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!result.canceled) {
      setMedia({
        uri: result.assets[0].uri,
        type: 'photo',
      });
    }
  };

  const captureLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permiso necesario',
        'Necesitamos tu ubicación para enviar el aviso.'
      );
      return;
    }

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    setCoords({
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    });

    setLocationText(
      `${current.coords.latitude.toFixed(5)}, ${current.coords.longitude.toFixed(5)}`
    );
  };

  const toggleFlag = (key: keyof FlagsState) => {
    setFlags((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const openWhatsApp = async () => {
    const text = encodeURIComponent(summary);
    const url = `https://wa.me/?text=${text}`;
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert(
        'WhatsApp no disponible',
        'No se pudo abrir WhatsApp en este dispositivo.'
      );
      return;
    }

    await Linking.openURL(url);
  };

  const callNumber = async (phoneNumber: string) => {
    const url = `tel:${phoneNumber}`;
    await Linking.openURL(url);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.badge}>SOS Fauna · MVP</Text>
        <Text style={styles.heroTitle}>Rescate y ayuda a fauna silvestre</Text>
        <Text style={styles.heroText}>
          Esta primera versión no sustituye WhatsApp: ordena el aviso, captura
          datos clave y prepara el envío al canal habitual.
        </Text>
      </View>

      <SectionCard title="1. Datos del aviso">
        <View style={styles.sectionContent}>
          <TextInput
            placeholder="Nombre y apellidos"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
          />

          <TextInput
            placeholder="Teléfono de contacto"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />

          <TextInput
            placeholder="Observaciones breves"
            value={notes}
            onChangeText={setNotes}
            multiline
            style={[styles.input, styles.textArea]}
          />

          <Pressable style={styles.primaryButton} onPress={pickPhoto}>
            <Text style={styles.primaryButtonText}>
              {media ? 'Cambiar foto' : 'Hacer foto'}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={captureLocation}>
            <Text style={styles.secondaryButtonText}>Capturar ubicación</Text>
          </Pressable>

          <Text style={styles.helperText}>
            {media ? `Adjunto preparado: ${media.uri}` : 'Sin foto todavía.'}
          </Text>

          <Text style={styles.helperText}>{locationText}</Text>
        </View>
      </SectionCard>

      <SectionCard title="2. Situación del animal">
        <View style={styles.sectionContent}>
          <Text style={styles.sectionDescription}>
            Marca solo lo que observes con claridad.
          </Text>

          <View style={styles.flagGrid}>
            {FLAG_LABELS.map(({ key, label }) => {
              const active = flags[key];

              return (
                <Pressable
                  key={key}
                  style={[styles.flag, active && styles.flagActive]}
                  onPress={() => toggleFlag(key)}
                >
                  <Text style={[styles.flagText, active && styles.flagTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SectionCard>

      <SectionCard title="3. Resumen preparado">
        <View style={styles.sectionContent}>
          <Text style={styles.summaryBox}>{summary}</Text>

          <Pressable style={styles.primaryButton} onPress={openWhatsApp}>
            <Text style={styles.primaryButtonText}>Preparar envío por WhatsApp</Text>
          </Pressable>

          <Text style={styles.helperText}>
            En esta fase se abre WhatsApp con el texto preparado. El envío de
            foto, vídeo y destino exacto del grupo se pulirá más adelante.
          </Text>
        </View>
      </SectionCard>

      <SectionCard title="4. Guía rápida">
        <View style={styles.sectionContent}>
          {quickGuides.map((guide) => (
            <View key={guide.title} style={styles.guideItem}>
              <Text style={styles.guideTitle}>{guide.title}</Text>
              <Text style={styles.guideBody}>{guide.body}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="5. Contactos útiles">
        <View style={styles.sectionContent}>
          {emergencyContacts.map((contact) => (
            <Pressable
              key={contact.name}
              style={styles.contactRow}
              onPress={() => callNumber(contact.phone)}
            >
              <View style={styles.contactTextBlock}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactNote}>{contact.note}</Text>
              </View>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 16,
    backgroundColor: '#f3f7f4',
  },
  hero: {
    backgroundColor: '#e7f5ea',
    borderRadius: 18,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#cfe8d4',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#14532d',
    color: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  heroText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#374151',
  },
  sectionContent: {
    gap: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#14532d',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 16,
  },
  helperText: {
    color: '#4b5563',
    fontSize: 13,
    lineHeight: 18,
  },
  flagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flag: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  flagActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  flagText: {
    color: '#111827',
    fontWeight: '600',
  },
  flagTextActive: {
    color: '#166534',
  },
  summaryBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    lineHeight: 20,
    color: '#111827',
  },
  guideItem: {
    gap: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  guideBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  contactTextBlock: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  contactNote: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 2,
  },
  contactPhone: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14532d',
  },
});
