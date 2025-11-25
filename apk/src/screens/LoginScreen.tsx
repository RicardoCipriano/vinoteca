import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { api } from '@api/http';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await api.login(email, password);
      navigation.replace('Library');
    } catch (e: any) {
      Alert.alert('Falha no login', e.message);
    } finally {
      setLoading(false);
    }
  };

  const openReset = async () => {
    if (!email) return Alert.alert('Informe o email');
    try {
      await api.requestPasswordReset(email);
      Alert.alert('Enviamos um código', 'Verifique seu email');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VINOTECA</Text>
      <Text style={styles.subtitle}>Acesse sua coleção de vinhos</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.label}>Senha</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity onPress={openReset}><Text style={styles.link}>Esqueceu a senha?</Text></TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#800000', justifyContent: 'center', padding: 24 },
  title: { color: '#e4c0a8', fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#fff', textAlign: 'center', marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16 },
  label: { color: '#6B0F12', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#CDA15D', borderRadius: 8, padding: 10, marginBottom: 12 },
  link: { color: '#6B0F12' },
  button: { backgroundColor: '#6B0F12', borderRadius: 8, padding: 12, marginTop: 12 },
  buttonText: { color: '#F7EFE6', textAlign: 'center', fontWeight: '600' },
});