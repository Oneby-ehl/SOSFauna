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

export default function HomeScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [locationText, setLocationText] = useState('Ubicación no capturada todavía.');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [flags, setFlags] = useState({
    bleeding: false,
    baby: false,
    catDog: false,
    canNotMove: false,
    roadRisk: false,
  });

  const summary = useMemo(() => {
    const selectedFlags = Object.entries(flags)
      .filter(([, value]) => value)
      .map(([key]) => key)
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
      'Nota MVP: en esta primera fase la app prepara el aviso para enviarlo por WhatsApp, manteniendo el flujo actual de GREFA.',
    ].join('\n');
  }, [coords, flags, fullName, locationText, media, notes, phone]);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a la cámara para capturar la foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!result.canceled) {
      setMedia({ uri: result.assets[0].uri, type: 'photo' });
    }
  };

  const captureLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos tu ubicación para enviar el aviso.');
      return;
    }

    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setCoords({ latitude: current.coords.latitude, longitude: current.coords.longitude });
    setLocationText(`${current.coords.latitude.toFixed(5)}, ${current.coords.longitude.toFixed(5)}`);
  };

  const toggleFlag = (key: keyof typeof flags) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openWhatsApp = async () => {
    const text = encodeURIComponent(summary);
    const url = `https://wa.me/?text=${text}`;
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert('WhatsApp no disponible', 'No se pudo abrir WhatsApp en este dispositivo.');
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
      <Text style={styles.heroTitle}>MVP de rescate de fauna</Text>
      <Text style={styles.heroText}>
        Esta primera versión no sustituye WhatsApp: estructura el aviso, captura datos clave y
        prepara el envío al canal habitual de trabajo.
      </Text>

      <SectionCard title="1. Datos del avisante" subtitle="Lo mínimo para poder contactar y contextualizar el caso.">
        <TextInput
          style={styles.input}
          placeholder="Nombre y apellidos"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={styles.input}
          placeholder="Teléfono"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Observaciones breves"
          multiline
          value={notes}
          onChangeText={setNotes}
        />
      </SectionCard>

      <SectionCard title="2. Captura" subtitle="Foto y ubicación para reducir preguntas posteriores.">
        <Pressable style={styles.primaryButton} onPress={pickPhoto}>
          <Text style={styles.primaryButtonText}>{media ? 'Cambiar foto' : 'Hacer foto'}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={captureLocation}>
          <Text style={styles.secondaryButtonText}>Capturar ubicación</Text>
        </Pressable>
        <Text style={styles.helperText}>{media ? `Adjunto: ${media.uri}` : 'Sin foto todavía.'}</Text>
        <Text style={styles.helperText}>{locationText}</Text>
      </SectionCard>

      <SectionCard title="3. Indicadores rápidos" subtitle="Para ayudar a priorizar el caso sin tomar la decisión final.">
        <View style={styles.flagGrid}>
          {[
            ['bleeding', 'Sangra'],
            ['baby', 'Es cría'],
            ['catDog', 'Ataque de gato/perro'],
            ['canNotMove', 'No se mueve bien'],
            ['roadRisk', 'Peligro en carretera'],
          ].map(([key, label]) => {
            const typedKey = key as keyof typeof flags;
            const active = flags[typedKey];
            return (
              <Pressable
                key={key}
                style={[styles.flag, active && styles.flagActive]}
                onPress={() => toggleFlag(typedKey)}
              >
                <Text style={[styles.flagText, active && styles.flagTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard title="4. Enviar por WhatsApp" subtitle="La app prepara el mensaje y mantiene el flujo actual de GREFA.">
        <Text style={styles.summaryBox}>{summary}</Text>
        <Pressable style={styles.primaryButton} onPress={openWhatsApp}>
          <Text style={styles.primaryButtonText}>Preparar envío por WhatsApp</Text>
        </Pressable>
        <Text style={styles.helperText}>
          Nota técnica: en esta fase se abre WhatsApp con el texto preparado. El envío de foto,
          vídeo y destino exacto del grupo puede requerir integración adicional y pruebas sobre
          Android real.
        </Text>
      </SectionCard>

      <SectionCard title="5. Guía rápida" subtitle="Consejos básicos mientras GREFA revisa el caso.">
        {quickGuides.map((guide) => (
          <View key={guide.title} style={styles.guideItem}>
            <Text style={styles.guideTitle}>{guide.title}</Text>
            <Text style={styles.guideBody}>{guide.body}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="6. Contactos útiles" subtitle="Sirve incluso si más adelante el proyecto se publica para uso más amplio.">
        {emergencyContacts.map((contact) => (
          <Pressable key={contact.phone} style={styles.contactRow} onPress={() => callNumber(contact.phone)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactNote}>{contact.note}</Text>
            </View>
            <Text style={styles.contactPhone}>{contact.phone}</Text>
          </Pressable>
        ))}
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 16,
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
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
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
    color: '#fff',
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
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    lineHeight: 20,
    color: '#111827',
  },
  guideItem: {
    gap: 4,
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
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#fff',
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
