const API_BASE = '/api';

export async function login({ userName, password }) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userName, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.message || data?.errors?.[0]?.message || response.statusText;
    throw new Error(message);
  }

  if (!data?.data?.Token) {
    throw new Error('Không nhận được token từ backend');
  }

  return { token: data.data.Token };
}
