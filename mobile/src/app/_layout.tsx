import { Slot, useRouter, useSegments } from 'expo-router';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { store } from '../store/store';
import { loadStoredAuth } from '../store/authSlice';
import '../../global.css';

function AuthGuard() {
  const { isAuthenticated, isLoading } = useSelector((state: any) => state.auth);
  const segments = useSegments();
  const router = useRouter();
  const dispatch = useDispatch<any>();

  useEffect(() => {
    dispatch(loadStoredAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && (inAuthGroup || segments.length === 0)) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return null;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthGuard />
    </Provider>
  );
}
