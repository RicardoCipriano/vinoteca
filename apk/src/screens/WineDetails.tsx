import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { api } from '@api/http';

export default function WineDetails({ route }: any) {
  const { id } = route.params as { id: number };
  const [wine, setWine] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWine(id).then(setWine).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#6B0F12" /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F7EFE6' }} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.h1}>{wine?.title}</Text>
      <View style={styles.section}>
        <Text style={styles.h2}>Harmonizações</Text>
        {(wine?.pairings || []).map((p: any, idx: number) => (
          <Text key={idx} style={styles.text}>• {p}</Text>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.h2}>Fatos sobre o vinho</Text>
        <Text style={styles.text}>Vinícola: {wine?.wineryName || '-'}</Text>
        <Text style={styles.text}>Região: {[wine?.country, wine?.regionName].filter(Boolean).join(' / ') || '-'}</Text>
        <Text style={styles.text}>Teor alcoólico: {wine?.alcoholAbv != null ? `${wine.alcoholAbv}%` : '-'}</Text>
        <Text style={styles.text}>Descrição do vinho: {wine?.factsDescription || '-'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 24, fontWeight: '700', color: '#fff', textAlign: 'center', backgroundColor: '#6B0F12', padding: 12, borderRadius: 8 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 12 },
  h2: { fontSize: 16, fontWeight: '600', color: '#6B0F12', marginBottom: 8 },
  text: { color: '#6B6B6B', marginBottom: 4 },
});