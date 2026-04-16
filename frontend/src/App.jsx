import { useEffect, useState } from 'react';
import { login, register as registerUser } from './api';

const genderOptions = ['Nữ', 'Nam', 'Khác'];

function App() {
  const [view, setView] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState(genderOptions[0]);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [status, setStatus] = useState('');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('interactHubAuth');
    if (stored) {
      try {
        const auth = JSON.parse(stored);
        setToken(auth.token ?? '');
        setUser(auth.user ?? null);
      } catch {
        localStorage.removeItem('interactHubAuth');
      }
    }
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setStatus('Đang đăng nhập...');

    try {
      const auth = await login({ userName: loginEmail, password: loginPassword });
      setToken(auth.token);
      setUser(auth.user ?? null);
      localStorage.setItem('interactHubAuth', JSON.stringify({ token: auth.token, user: auth.user }));
      setStatus('Đăng nhập thành công!');
    } catch (error) {
      setStatus(`Lỗi: ${error.message}`);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setStatus('Đang tạo tài khoản...');

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      await registerUser({
        userName: registerEmail,
        email: registerEmail,
        password: registerPassword,
        fullName,
      });
      setStatus('Đăng ký thành công. Vui lòng đăng nhập.');
      setView('login');
      setLoginEmail(registerEmail);
      setLoginPassword('');
    } catch (error) {
      setStatus(`Lỗi: ${error.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('interactHubAuth');
    setToken('');
    setUser(null);
    setStatus('Bạn đã đăng xuất.');
    setView('login');
    setLoginEmail('');
    setLoginPassword('');
  };

  return (
    <div className="page-wrap">
      <header className="hero-header">
        <div className="hero-logo" />
        <div className="hero-brand">Logo</div>
      </header>

      <div className="center-panel">
        {!token ? (
          <div className={`auth-card ${view === 'register' ? 'register' : ''}`}>
            <div className="card-title">{view === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}</div>
            {status && <div className="status-message">{status}</div>}

            {view === 'login' ? (
              <form onSubmit={handleLogin} className="form-grid">
                <div className="field-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Nhập email"
                    required
                  />
                </div>
                <div className="field-group">
                  <label>Mật khẩu:</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                  />
                </div>
                <button type="submit" className="primary-button">
                  Đăng nhập
                </button>
                <div className="section-divider" />
                <button type="button" className="secondary-button" onClick={() => { setView('register'); setStatus(''); }}>
                  Tạo tài khoản
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="form-grid">
                <div className="field-row">
                  <div className="field-group">
                    <label>Họ:</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Họ"
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label>Tên:</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Tên"
                      required
                    />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field-group">
                    <label>Sinh Nhật:</label>
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label>Giới Tính:</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)}>
                      {genderOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="field-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="Nhập email"
                    required
                  />
                </div>
                <div className="field-group">
                  <label>Mật Khẩu:</label>
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                  />
                </div>
                <button type="submit" className="primary-button register-btn">
                  Đăng ký
                </button>
                <div className="section-divider" />
                <button type="button" className="secondary-button" onClick={() => { setView('login'); setStatus(''); }}>
                  Đã có tài khoản
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="welcome-card">
            <div className="welcome-title">Xin chào!</div>
            <p className="welcome-text">Bạn đã đăng nhập thành công.</p>
            {user?.userName && <p className="welcome-subtitle">Username: {user.userName}</p>}
            {user?.email && <p className="welcome-subtitle">Email: {user.email}</p>}
            <button type="button" className="primary-button logout-button" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
