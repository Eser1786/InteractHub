import { useState } from 'react';
import { login } from './api';

function App() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('Frontend đã kết nối backend qua proxy.');
  const [token, setToken] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('Đang đăng nhập...');

    try {
      const result = await login({ userName, password });
      setToken(result.token);
      setStatus('Đăng nhập thành công!');
    } catch (error) {
      setStatus(`Lỗi kết nối backend: ${error.message}`);
    }
  };

  return (
    <div className="app-container">
      <h1>InteractHub Frontend</h1>
      <p>{status}</p>

      <form onSubmit={handleSubmit} className="login-form">
        <label>
          Username
          <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Tên đăng nhập" />
        </label>

        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" />
        </label>

        <button type="submit">Đăng nhập</button>
      </form>

      {token && (
        <div className="token-box">
          <h2>Token nhận được</h2>
          <textarea readOnly value={token} rows={5} />
        </div>
      )}

      <div className="info">
        <p>Frontend đang chạy trên <strong>{window.location.origin}</strong></p>
        <p>Proxy API: <code>/api</code> → <code>http://localhost:5142</code></p>
      </div>
    </div>
  );
}

export default App;
