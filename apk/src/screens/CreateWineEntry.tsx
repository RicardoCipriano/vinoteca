import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { api } from '@api/http';

export default function CreateWineEntry({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('');
  const [regionName, setRegionName] = useState('');
  const [wineryName, setWineryName] = useState('');
  const [alcoholAbv, setAlcoholAbv] = useState('');
  const [factsDescription, setFactsDescription] = useState('');

  const save = async () => {
    try {
      const payload = { title, country, region_name: regionName, winery_name: wineryName, alcohol_abv: Number(alcoholAbv) || null, facts_description: factsDescription };
      await api.createWine(payload);
      Alert.alert('Sucesso', 'Vinho cadastrado');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F7EFE6' }} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.h1}>Novo vinho</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Título</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />
        <Text style={styles.label}>País</Text>
        <TextInput style={styles.input} value={country} onChangeText={setCountry} />
        <Text style={styles.label}>Região</Text>
        <TextInput style={styles.input} value={regionName} onChangeText={setRegionName} />
        <Text style={styles.label}>Vinícola</Text>
        <TextInput style={styles.input} value={wineryName} onChangeText={setWineryName} />
        <Text style={styles.label}>Teor alcoólico (%)</Text>
        <TextInput style={styles.input} value={alcoholAbv} onChangeText={setAlcoholAbv} keyboardType="decimal-pad" />
        <Text style={styles.label}>Descrição do vinho</Text>
        <TextInput style={[styles.input, { height: 100 }]} value={factsDescription} onChangeText={setFactsDescription} multiline maxLength={300} />
        <TouchableOpacity style={styles.button} onPress={save}>
          <Text style={styles.buttonText}>Salvar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 20, fontWeight: '700', color: '#6B0F12' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 12 },
  label: { color: '#6B0F12', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#CDA15D', borderRadius: 8, padding: 10, marginBottom: 12 },
  button: { backgroundColor: '#6B0F12', borderRadius: 8, padding: 12 },
  buttonText: { color: '#F7EFE6', textAlign: 'center', fontWeight: '600' },
});