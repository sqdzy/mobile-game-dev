import { Link, useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useRootStore } from '@/store/RootStore';

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { authStore } = useRootStore();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (authStore.isReady && authStore.isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [authStore.isReady, authStore.isAuthenticated, router]);

  const handleSubmit = async () => {
    if (!nickname || !password) {
      setStatus('Введите никнейм и пароль (не короче 6 символов).');
      return;
    }
    try {
      if (mode === 'login') {
        await authStore.login(nickname.trim(), password);
      } else {
        await authStore.register(nickname.trim(), password);
      }
      setStatus(null);
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось выполнить запрос.';
      setStatus(message);
    }
  };

  const toggleMode = () => {
    setMode(prev => (prev === 'login' ? 'register' : 'login'));
    setStatus(null);
  };

  const buttonLabel = mode === 'login' ? 'Войти' : 'Зарегистрироваться';
  const heading = mode === 'login' ? 'Вход в цитадель' : 'Регистрация героя';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <View style={styles.card}>
        <View style={styles.heroIconBadge}>
          <AppIcon name="tower" size={48} color="#fbead4" secondaryColor="#b6946c" />
        </View>
        <Text style={styles.title}>{heading}</Text>
        <Text style={styles.subtitle}>Синхронизируйте монеты и прогресс между устройствами</Text>

        <TextInput
          placeholder="Никнейм"
          placeholderTextColor="#b6946c"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          value={nickname}
          onChangeText={setNickname}
        />
        <TextInput
          placeholder="Пароль"
          placeholderTextColor="#b6946c"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {status ? <Text style={styles.status}>{status}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={authStore.status === 'loading'}>
          <Text style={styles.primaryButtonText}>
            {authStore.status === 'loading' ? 'Отправляем…' : buttonLabel}
          </Text>
        </Pressable>

        <Pressable onPress={toggleMode} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>
            {mode === 'login' ? 'Создать новый аккаунт' : 'У меня уже есть герб'}
          </Text>
        </Pressable>

        <Link href="/(tabs)" style={styles.skipLink}>
          Играть офлайн
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
};

export default observer(LoginScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#120b06',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#24140b',
    borderRadius: 20,
    padding: 24,
    gap: 14,
    alignItems: 'center',
  },
  heroIconBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1a0f06',
    borderWidth: 1,
    borderColor: '#3b2717',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fbead4',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#d2b48c',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#1a0f06',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fbead4',
    borderWidth: 1,
    borderColor: '#3b2717',
  },
  status: {
    color: '#f5a199',
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#6b3f1a',
    borderRadius: 12,
    paddingVertical: 12,
  },
  primaryButtonText: {
    textAlign: 'center',
    color: '#fbead4',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#f3d7a3',
  },
  skipLink: {
    marginTop: 8,
    color: '#b6946c',
    textDecorationLine: 'underline',
  },
});
