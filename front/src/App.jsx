import Login from './components/Login.jsx';
import './App.css';

export default function App() {
  return (
    <div className="App">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Passage, accueil">
          <span className="brand-mark" aria-hidden="true">
            p.
          </span>
          passage<span className="brand-dot">/</span>
        </a>
        <span className="demo-tag">
          <span /> Espace de démonstration
        </span>
      </header>
      <main className="main-layout">
        <section className="intro" aria-labelledby="intro-title">
          <span className="eyebrow">UN ACCÈS, EN TOUTE SIMPLICITÉ</span>
          <h1 id="intro-title">
            Entrez.
            <br />
            Vous êtes
            <br />
            <span>au bon endroit.</span>
          </h1>
          <p className="intro-copy">
            Un petit espace pour tester une connexion.
            <br />
            Identifiez-vous, puis vérifiez votre accès.
          </p>
          <div className="intro-note">
            <span className="note-symbol" aria-hidden="true">
              ↗
            </span>
            <div>
              <strong>Simple à explorer.</strong>
              <p>Connectez-vous. Testez. Déconnectez-vous.</p>
            </div>
          </div>
        </section>
        <Login />
      </main>
      <footer className="site-footer">
        <span>Passage — Authentification démo</span>
        <span>Un projet pour apprendre, une étape à la fois.</span>
      </footer>
    </div>
  );
}
