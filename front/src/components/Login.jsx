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
    const credentials = {
      username: form.elements.name.value,
      password: form.elements.password.value,
    };
    form.elements.password.value = '';
    this.setState({ busy: true, token: null, message: '' });
    try {
      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        this.setState({
          message:
            response.status === 429
              ? 'Trop de tentatives. Réessaie plus tard.'
              : 'Connexion refusée.',
        });
        return;
      }
      const token = response.headers.get('x-access-token');
      this.setState({
        token,
        message: token ? 'Connecté pour 15 minutes.' : 'Token manquant.',
      });
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
        method: 'POST',
        headers: { Authorization: `Bearer ${this.state.token}` },
      });
      if (response.status === 401) {
        this.setState({
          token: null,
          message: 'Session expirée. Reconnecte-toi.',
        });
      } else {
        this.setState({
          message: response.ok ? 'Accès autorisé.' : 'Accès refusé.',
        });
      }
    } catch {
      this.setState({ message: 'Serveur inaccessible.' });
    } finally {
      this.setState({ busy: false });
    }
  };

  render() {
    const { token, message, busy } = this.state;
    return (
      <section className="login-card" aria-labelledby="login-title">
        <div className="card-topline">
          <span className="lock-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="5" y="10" width="14" height="11" rx="3" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <path d="M12 14v3" />
            </svg>
          </span>
          <span className={token ? 'session-badge active' : 'session-badge'}>
            {token ? '● Session active' : 'Session inactive'}
          </span>
        </div>
        <h2 id="login-title">Bienvenue chez vous.</h2>
        <p className="card-description">Vos identifiants, et c’est parti.</p>
        <form className="login-form" onSubmit={this.onSubmit}>
          <label className="field-label">
            Identifiant
            <input
              type="text"
              name="name"
              placeholder="Votre identifiant"
              autoComplete="username"
              required
              maxLength={128}
            />
          </label>
          <label className="field-label">
            Mot de passe
            <input
              type="password"
              name="password"
              placeholder="Votre mot de passe"
              autoComplete="current-password"
              required
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? 'Un instant…' : 'Se connecter'}
            <span aria-hidden="true">→</span>
          </Button>
        </form>
        <div className="access-panel">
          <div className="access-heading">
            <strong>Vérifier mon accès</strong>
            <span>Après la connexion</span>
          </div>
          <div className="access-actions">
            <Button
              className="Button secondary"
              onClick={this.protectedRoute}
              disabled={!token || busy}
            >
              Tester l’accès <span aria-hidden="true">↗</span>
            </Button>
            <Button
              className="Button quiet"
              onClick={() =>
                this.setState({ token: null, message: 'Déconnecté.' })
              }
              disabled={!token || busy}
            >
              Se déconnecter
            </Button>
          </div>
          <p className={token ? 'feedback active' : 'feedback'} role="status">
            {message || 'Connectez-vous pour tester votre accès.'}
          </p>
        </div>
        <p className="card-footnote">
          Une session dure 15 minutes.
          <br />
          Un rechargement de page vous déconnecte.
        </p>
      </section>
    );
  }
}

export default Login;
