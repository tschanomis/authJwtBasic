import React, { Component } from 'react';
import Button from './Button.jsx';
import './Login.css';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3030';

class Login extends Component {
  state = { token: null, message: '', busy: false };

  componentDidMount() {
    // Remove tokens persisted by the previous implementation.
    localStorage.removeItem('token');
  }

  onSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const credentials = { username: form.elements.name.value, password: form.elements.password.value };
    form.elements.password.value = '';
    this.setState({ busy: true, token: null, message: '' });
    try {
      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        this.setState({ message: response.status === 429 ? 'Trop de tentatives. Réessaie plus tard.' : 'Connexion refusée.' });
        return;
      }
      const token = response.headers.get('x-access-token');
      this.setState({ token, message: token ? 'Connecté pour 15 minutes.' : 'Token manquant.' });
    } catch {
      this.setState({ message: 'Serveur inaccessible.' });
    } finally {
      this.setState({ busy: false });
    }
  };

  protectedRoute = async () => {
    this.setState({ busy: true });
    try {
      const response = await fetch(`${apiUrl}/auth/protected`, {
        method: 'POST', headers: { Authorization: `Bearer ${this.state.token}` },
      });
      if (response.status === 401) {
        this.setState({ token: null, message: 'Session expirée. Reconnecte-toi.' });
      } else {
        this.setState({ message: response.ok ? 'Accès autorisé.' : 'Accès refusé.' });
      }
    } catch {
      this.setState({ message: 'Serveur inaccessible.' });
    } finally {
      this.setState({ busy: false });
    }
  };

  render() {
    const { token, message, busy } = this.state;
    return <div className="contentGlob"><div className="login">
      <form onSubmit={this.onSubmit}>
        <label>Identifiant <input type="text" name="name" autoComplete="username" required maxLength={128} /></label>
        <label>Mot de passe <input type="password" name="password" autoComplete="current-password" required /></label>
        <Button type="submit" disabled={busy}>Login</Button>
      </form>
      <Button onClick={this.protectedRoute} disabled={!token || busy}>Test</Button>
      <Button onClick={() => this.setState({ token: null, message: 'Déconnecté.' })} disabled={!token || busy}>Déconnexion</Button>
      <p role="status">{message}</p>
    </div></div>;
  }
}

export default Login;
