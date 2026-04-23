import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import { getAllUsers, initializeUserData } from '../utils/userDataManager';
import Header from '../components/Header';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check local users first
      const allUsers = getAllUsers();
      const foundUser = allUsers.find(u => u.userName === username || u.email === username);
      
      if (foundUser) {
        // Verify password (simple comparison for local users)
        if (foundUser.password === password) {
          // Initialize user data if not exists
          const userData = localStorage.getItem(`user_data_${foundUser.id}`);
          if (!userData) {
            initializeUserData(foundUser.id);
          }
          
          localStorage.setItem('token', `mock_token_${foundUser.id}`);
          localStorage.setItem('user', JSON.stringify(foundUser));
          navigate('/home');
          return;
        } else {
          setError('Mật khẩu không chính xác');
          setLoading(false);
          return;
        }
      }
      
      // If not found locally, try backend
      const result = await login({ userName: username, password });
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="auth-container">
      <Header showControls={false} />
      <div className="auth-page">
        <div className="auth-form-wrapper">
          <h2 className="auth-title">Đăng Nhập</h2>
          
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username" className="form-label">Tên đăng nhập:</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Mật khẩu:</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="form-input"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  ●
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-login"
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="divider"></div>

          <button 
            type="button"
            className="btn btn-register"
            onClick={handleNavigateToRegister}
          >
            Tạo tài khoản
          </button>
        </div>
      </div>
    </div>
  );
}
