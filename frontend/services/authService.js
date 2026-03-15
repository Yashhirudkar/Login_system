import api, { setAccessToken, clearAccessToken } from './api';

export const register = async ({ name, email, password }) => {
  const { data } = await api.post('/api/auth/register', { name, email, password });
  return data;
};

export const login = async ({ email, password }) => {
  const { data } = await api.post('/api/auth/login', { email, password });
  if (data.data?.accessToken) {
    setAccessToken(data.data.accessToken);
  }
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/api/auth/me');
  return data;
};

export const logout = async () => {
  try {
    await api.post('/api/auth/logout');
  } finally {
    clearAccessToken();
  }
};

export const refreshToken = async () => {
  const { data } = await api.post('/api/auth/refresh');
  if (data.data?.accessToken) {
    setAccessToken(data.data.accessToken);
  }
  return data;
};
