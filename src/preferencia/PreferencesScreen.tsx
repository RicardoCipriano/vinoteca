// PreferencesScreen.tsx
// React Native TypeScript screen for user preferences (Vinoteca)
// Paste into your React Native project at src/screens/PreferencesScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // or react-native-vector-icons
import axios from 'axios';

type TasteProfile = {
  intensidade: 'Leve' | 'Médio' | 'Encorpado' | null;
  estilo: string[]; // e.g. ['Frutado','Amadeirado']
  docura: 'Seco' | 'Meio-seco' | 'Doce' | null;
  momentos: string[]; // e.g. ['Churrasco','Jantar']
  personalidade: 'Explorador' | 'Tradicionalista' | 'Estudioso' | 'Social' | null;
};

const STYLE_OPTIONS = ['Frutado','Floral','Herbal','Amadeirado','Especiarias','Cítrico','Chocolate'];
const MOMENT_OPTIONS = ['Churrasco','Jantar','Queijos','Sobremesa','Relaxar','Evento'];
const PERSONALITIES = ['Explorador','Tradicionalista','Estudioso','Social'] as const;

export default function PreferencesScreen({ navigation, route }: any) {
  // if you have user id from route or context
  const userId = route?.params?.userId ?? 1;

  const [profile, setProfile] = useState<TasteProfile>({
    intensidade: 'Médio',
    estilo: [],
    docura: 'Seco',
    momentos: [],
    personalidade: null,
  });

  const [loading, setLoading] = useState(false);
  const saveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(`https://api.seudominio.com/users/${userId}/preferences`);
      if (resp.data) {
        setProfile({
          intensidade: resp.data.intensidade ?? 'Médio',
          estilo: resp.data.estilo ?? [],
          docura: resp.data.docura ?? 'Seco',
          momentos: resp.data.momentos ?? [],
          personalidade: resp.data.personalidade ?? null,
        });
      }
    } catch (err) {
      // silent fail — keep defaults
      console.warn('fetch preferences', err?.message ?? err);
    } finally {
      setLoading(false);
    }
  };

  const toggleArray = (key: keyof TasteProfile, value: string) => {
    setProfile(prev => {
      const arr = (prev[key] as string[]) || [];
      const exists = arr.includes(value);
      const next = exists ? arr.filter(a => a !== value) : [...arr, value];
      return { ...prev, [key]: next } as TasteProfile;
    });
  };

  const toggleEstilo = (value: string) => {
    setProfile(prev => {
      const arr = prev.estilo || [];
      const exists = arr.includes(value);
      // limit selectable to 3
      if (!exists && arr.length >= 3) {
        Alert.alert('Máximo 3 estilos', 'Você pode selecionar até 3 estilos preferidos.');
        return prev;
      }
      const next = exists ? arr.filter(a => a !== value) : [...arr, value];
      return { ...prev, estilo: next };
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      Animated.sequence([
        Animated.timing(saveAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(saveAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      const payload = {
        intensidade: profile.intensidade,
        estilo: profile.estilo,
        docura: profile.docura,
        momentos: profile.momentos,
        personalidade: profile.personalidade,
      };

      await axios.put(`https://api.seudominio.com/users/${userId}/preferences`, payload);
      Alert.alert('Preferências salvas', 'Suas preferências foram atualizadas.');
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const Chip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      accessibilityLabel={`Estilo ${label}${selected ? ' selecionado' : ''}`}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  const ToggleCard = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity style={[styles.momentCard, selected && styles.momentCardSelected]} onPress={onPress}>
      <Text style={[styles.momentText, selected && styles.momentTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Preferências</Text>

        {/* Card: Meu Paladar */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meu Paladar</Text>

          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>Intensidade</Text>
            <View style={styles.intensityRow}>
              {(['Leve','Médio','Encorpado'] as const).map(level => (
                <TouchableOpacity
                  key={level}
                  style={[styles.intensityButton, profile.intensidade === level && styles.intensityButtonActive]}
                  onPress={() => setProfile(prev => ({ ...prev, intensidade: level }))}
                >
                  <Text style={[styles.intensityText, profile.intensidade === level && styles.intensityTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>Estilos (até 3)</Text>
            <View style={styles.chipsRow}>
              {STYLE_OPTIONS.map(s => (
                <Chip key={s} label={s} selected={profile.estilo.includes(s)} onPress={() => toggleEstilo(s)} />
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>Doçura</Text>
            <View style={styles.docuraRow}>
              {(['Seco','Meio-seco','Doce'] as const).map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.sweetButton, profile.docura === d && styles.sweetActive]}
                  onPress={() => setProfile(prev => ({ ...prev, docura: d }))}
                >
                  <Text style={[styles.sweetText, profile.docura === d && styles.sweetTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Card: Meus Momentos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meus Momentos</Text>
          <Text style={styles.small}>Escolha ocasiões que combinam com você</Text>
          <View style={styles.momentsGrid}>
            {MOMENT_OPTIONS.map(m => (
              <ToggleCard
                key={m}
                label={m}
                selected={profile.momentos.includes(m)}
                onPress={() => toggleArray('momentos', m)}
              />
            ))}
          </View>
        </View>

        {/* Card: Meu Estilo */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meu Estilo</Text>
          <Text style={styles.small}>Como você prefere explorar?</Text>
          <View style={{ marginTop: 12 }}>
            {PERSONALITIES.map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setProfile(prev => ({ ...prev, personalidade: p }))}
                style={[styles.personalityRow, profile.personalidade === p && styles.personalityRowActive]}
              >
                <View>
                  <Text style={[styles.personalityTitle, profile.personalidade === p && styles.personalityTitleActive]}>{p}</Text>
                  <Text style={styles.personalityDesc}>
                    {p === 'Explorador' && 'Gosta de novidades e uvas diferentes.'}
                    {p === 'Tradicionalista' && 'Valoriza rótulos clássicos e consagrados.'}
                    {p === 'Estudioso' && 'Gosta de informações, safras e regiões.'}
                    {p === 'Social' && 'Compartilha e segue recomendações de amigos.'}
                  </Text>
                </View>
                {profile.personalidade === p && <Ionicons name="checkmark-circle" size={22} color="#C9A646" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.suggestionsBtn} onPress={() => Alert.alert('Sugestões', 'Gerando recomendações...')}>
              <Text style={styles.suggestionsText}>Ver sugestões com base no seu estilo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            <Animated.View style={{ opacity: saveAnim.interpolate({ inputRange: [0,1], outputRange: [1,0.6] }) }}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Salvar Preferências</Text>}
            </Animated.View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F3EE' },
  container: { padding: 16, paddingBottom: 48 },
  header: { fontSize: 20, fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay' : undefined, textAlign: 'left', color: '#4C1C1C', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#4C1C1C' },
  label: { fontSize: 13, color: '#6B6B6B' },
  intensityRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  intensityButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#F0ECE9' },
  intensityButtonActive: { backgroundColor: '#4C1C1C' },
  intensityText: { color: '#4C1C1C' },
  intensityTextActive: { color: '#fff' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F2F0EE', marginRight: 8, marginBottom: 8 },
  chipSelected: { backgroundColor: '#C9A646' },
  chipText: { color: '#3b3b3b', fontSize: 13 },
  chipTextSelected: { color: '#fff', fontWeight: '600' },

  docuraRow: { flexDirection: 'row', marginTop: 8, justifyContent: 'space-between' },
  sweetButton: { flex: 1, padding: 10, marginHorizontal: 6, borderRadius: 10, backgroundColor: '#F0ECE9', alignItems: 'center' },
  sweetActive: { backgroundColor: '#4C1C1C' },
  sweetText: { color: '#6B6B6B' },
  sweetTextActive: { color: '#fff' },

  small: { fontSize: 12, color: '#6B6B6B', marginTop: 6 },

  momentsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, justifyContent: 'space-between' },
  momentCard: { width: '48%', padding: 12, borderRadius: 12, backgroundColor: '#F2F0EE', marginBottom: 10, alignItems: 'center' },
  momentCardSelected: { backgroundColor: '#C9A646' },
  momentText: { color: '#3b3b3b' },
  momentTextSelected: { color: '#fff' },

  personalityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  personalityRowActive: { backgroundColor: '#F7EFE6', borderRadius: 8 },
  personalityTitle: { color: '#4C1C1C', fontWeight: '600' },
  personalityTitleActive: { color: '#4C1C1C' },
  personalityDesc: { color: '#6B6B6B', fontSize: 12 },

  suggestionsBtn: { marginTop: 12, padding: 12, backgroundColor: '#C9A646', borderRadius: 12, alignItems: 'center' },
  suggestionsText: { color: '#fff', fontWeight: '600' },

  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center' },
  cancelText: { color: '#4C1C1C' },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 20, backgroundColor: '#4C1C1C', borderRadius: 12 },
  saveText: { color: '#fff', fontWeight: '700' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
