import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from '@api/http';

export default function WineLibrary({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.getWines().then(data => { if (mounted) setItems(data); }).finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#6B0F12" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#F7EFE6' }}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('WineDetails', { id: item.id })}>
            <View style={styles.imageWrap}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
              ) : (
                <View style={styles.placeholder} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.vintage}>{item.vintage || ''}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.meta}>{item.country}{item.grape ? ` · ${item.grape}` : ''}</Text>
              </View>
              <View style={styles.badgeRow}>
                <Text style={styles.badge}>{item.wineType}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateWine')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  imageWrap: { width: 120, height: 90, backgroundColor: '#4A0D12', borderRadius: 8, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, backgroundColor: '#6B0F12' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600', color: '#4C1C1C' },
  vintage: { color: '#CDA15D' },
  meta: { color: '#6B6B6B', marginTop: 4 },
  badgeRow: { marginTop: 6 },
  badge: { backgroundColor: '#6B0F12', color: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 48, height: 48, borderRadius: 24, backgroundColor: '#6B0F12', alignItems: 'center', justifyContent: 'center' },
  fabText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
});