import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api';
import Header from '../components/Header';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    userName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const result = await register({
        userName: formData.userName,
        email: formData.email,
        fullName: fullName,
        password: formData.password
      });
      
      if (!result || !result.token) {
        throw new Error('Invalid registration response from server');
      }

      localStorage.setItem('token', result.token);
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      
      // Dispatch event to notify App.jsx about token change (same-tab)
      window.dispatchEvent(new Event('tokenUpdated'));
      
      navigate('/login');
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="auth-container">
      <Header showControls={false} />
      <div className="auth-page">
        <div className="auth-form-wrapper register-form-wrapper">
          <h2 className="auth-title">Tạo Tài Khoản</h2>
          
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form register-form">
            <div className="form-group">
              <label htmlFor="userName" className="form-label">Tên đăng nhập:</label>
              <input
                id="userName"
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleInputChange}
                placeholder="Tên đăng nhập"
                className="form-input"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">Họ:</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Họ và đệm"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName" className="form-label">Tên:</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Tên"
                  className="form-input"
                  required
                />
              </div>
            </div>



            <div className="form-group">
              <label htmlFor="email" className="form-label">Email:</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Nhập email"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Mật Khẩu:</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Nhập mật khẩu"
                  className="form-input"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i class="fa-solid fa-eye"></i>
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-register"
              disabled={loading}
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <div className="form-footer">
            <span>Đã có tài khoản? </span>
            <button 
              type="button"
              className="link-button"
              onClick={handleNavigateToLogin}
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
