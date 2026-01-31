
# ProfiV - Excellence Éducative par IA

Plateforme éducative SaaS pour les professeurs et élèves du Maroc, utilisant Gemini 2.5 Flash pour la génération d\'exercices conformes au programme MEN.

## 🚀 Fonctionnalités Principales

### Pour les Professeurs
- Génération d\'exercices personnalisés (Maths, Physique, SVT, etc.)
- Mode batch pour générer jusqu\'à 10 exercices en 1 appel API
- Export PDF/Word des séries d\'exercices
- Drag & drop pour réorganiser les exercices
- Mode professeur avec génération de 10 exercices + auto-correction
- Historique des exercices générés
- Planification des examens

### Pour les Élèves
- Quiz diagnostiques personnalisés
- Analyse SWOT des points forts/faiblesses
- Plans de révision adaptés
- Mode offline (PWA)
- Accès aux corrections détaillées

### Technique
- **Frontend**: React 18 + TypeScript + Tailwind + Vite
- **Backend**: Express + Node.js + Gemini 2.5 Flash
- **Base de données**: MongoDB + Redis (cache)
- **Auth**: Supabase
- **Paiements**: Stripe
- **Déploiement**: Vercel (frontend) + Render (backend)

## 📋 Prérequis

- Node.js 18+ et npm
- Compte Google Cloud avec clé API Gemini
- Compte Supabase (optionnel pour auth)
- Compte Stripe (optionnel pour paiements)

## 🛠️ Installation

1. Cloner le repository:
```bash
git clone https://github.com/votre-username/profiV.git
cd profiV
```

2. Installer les dépendances:
```bash
npm install
```

3. Configurer les variables d\'environnement:
```bash
cp .env.example .env
```

Éditer `.env` et ajouter vos clés API:
```env
GEMINI_API_KEY=votre_clé_api_gemini
GEMINI_MODEL=gemini-2.5-flash
SUPABASE_URL=votre_url_supabase
SUPABASE_ANON_KEY=votre_clé_supabase
```

4. Lancer l\'application en développement:
```bash
npm run dev
```

L\'application sera accessible sur http://localhost:5173

## 🐳 Docker

Pour lancer l\'application avec Docker:
```bash
docker-compose up -d
```

Cela démarrera:
- Frontend (port 80)
- Backend (port 3000)
- Redis (port 6379)
- MongoDB (port 27017)

## 📦 Structure du Projet

```
profiV/
├── backend/          # API Express + Gemini
├── components/       # Composants React
├── services/         # Services (Gemini, Supabase, etc.)
├── shared/          # Types et prompts partagés
├── utils/           # Utilitaires (cache, etc.)
├── public/          # Assets statiques
└── docs/            # Documentation
```

## 🔧 Scripts Disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Build pour production
- `npm run preview` - Prévisualise le build de production
- `npm run lint` - Vérifie le code avec ESLint
- `npm run type-check` - Vérifie les types TypeScript

## 📚 Documentation

- [Guide d\'Installation](docs/INSTALLATION.md)
- [Guide des Prompts MEN](docs/PROMPTS.md)
- [API Reference](docs/API.md)
- [Guide de Déploiement](docs/DEPLOYMENT.md)

## 🤝 Contribution

Les contributions sont les bienvenues! N\'hésitez pas à:
1. Fork le projet
2. Créer une branche pour votre feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m \'feat: Add some AmazingFeature\'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour les détails.

## 🙏 Remerciements

- Ministère de l\'Éducation Nationale du Maroc pour les programmes officiels
- Google pour l\'API Gemini
- La communauté open source
