
# Guide d\'Installation - ProfiV

Ce guide vous accompagne pas à pas dans l\'installation et la configuration de ProfiV sur votre environnement de développement.

## Prérequis

Avant de commencer, assurez-vous d\'avoir installé les outils suivants :

- **Node.js** (version 18 ou supérieure) : [Télécharger ici](https://nodejs.org/)
- **npm** (généralement installé avec Node.js)
- **Git** (optionnel, pour cloner le repository) : [Télécharger ici](https://git-scm.com/)
- **Docker** et **Docker Compose** (optionnel, pour le déploiement) : [Télécharger ici](https://www.docker.com/products/docker-desktop)

## Étape 1 : Cloner le Repository

Si vous utilisez Git :

```bash
git clone https://github.com/votre-username/profiV.git
cd profiV
```

Sinon, téléchargez le ZIP depuis GitHub et extrayez-le dans votre dossier de travail.

## Étape 2 : Installer les Dépendances

Dans le répertoire racine du projet, exécutez :

```bash
npm install
```

Cela va installer toutes les dépendances nécessaires pour le frontend.

Pour le backend, allez dans le dossier backend :

```bash
cd backend
npm install
cd ..
```

## Étape 3 : Configuration de l\'Environnement

### 3.1 Copier le fichier d\'exemple

```bash
cp .env.example .env
```

### 3.2 Configurer les Variables d\'Environnement

Ouvrez le fichier `.env` et configurez les variables suivantes :

#### Configuration Gemini API

```env
GEMINI_API_KEY=votre_clé_api_gemini_ici
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=4096
```

**Pour obtenir votre clé API Gemini :**
1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Create API Key"
4. Copiez la clé et collez-la dans votre fichier `.env`

#### Configuration Supabase (Auth & Database)

```env
SUPABASE_URL=votre_url_supabase_ici
SUPABASE_ANON_KEY=votre_clé_anon_supabase_ici
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role_supabase_ici
```

**Pour configurer Supabase :**
1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Allez dans Settings > API
4. Copiez l\'URL et les clés API dans votre fichier `.env`

#### Configuration Stripe (Paiements - Optionnel)

```env
STRIPE_PUBLIC_KEY=votre_clé_publique_stripe_ici
STRIPE_SECRET_KEY=votre_clé_secrète_stripe_ici
STRIPE_WEBHOOK_SECRET=votre_secret_webhook_stripe_ici
```

**Pour configurer Stripe :**
1. Créez un compte sur [stripe.com](https://stripe.com)
2. Allez dans Developers > API keys
3. Copiez les clés dans votre fichier `.env`

#### Configuration Redis (Cache - Optionnel)

```env
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true
```

Si vous n\'avez pas Redis installé localement, vous pouvez utiliser Docker :

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

#### Configuration MongoDB (Base de données - Optionnel)

```env
MONGODB_URI=mongodb://localhost:27017/profiV
MONGODB_ENABLED=true
```

Si vous n\'avez pas MongoDB installé localement, vous pouvez utiliser Docker :

```bash
docker run -d -p 27017:27017 mongo:7
```

## Étape 4 : Lancer l\'Application

### Option A : Développement Local

#### Lancer le Frontend

```bash
npm run dev
```

Le frontend sera accessible sur [http://localhost:5173](http://localhost:5173)

#### Lancer le Backend

Dans un nouveau terminal :

```bash
cd backend
npm run dev
```

Le backend sera accessible sur [http://localhost:3000](http://localhost:3000)

### Option B : Docker

Si vous préférez utiliser Docker, utilisez Docker Compose :

```bash
docker-compose up -d
```

Cela démarrera tous les services :
- Frontend : http://localhost
- Backend : http://localhost:3000
- Redis : localhost:6379
- MongoDB : localhost:27017

## Étape 5 : Vérifier l\'Installation

1. Ouvrez votre navigateur et allez sur [http://localhost:5173](http://localhost:5173)
2. Vous devriez voir l\'interface de ProfiV
3. Essayez de générer un exercice pour vérifier que l\'API Gemini fonctionne

## Étape 6 : Configuration Supplémentaire (Optionnel)

### Activer le Mode PWA

Pour activer le mode Progressive Web App, modifiez le fichier `vite.config.ts` :

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // ... configuration PWA
    })
  ]
});
```

### Configurer le CI/CD

Pour configurer GitHub Actions, allez dans Settings > Secrets and variables > Actions de votre repository GitHub et ajoutez les secrets suivants :

- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_PUBLIC_KEY`
- `STRIPE_SECRET_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Dépannage

### Erreur : "Module not found"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreur : "EADDRINUSE: address already in use"

Le port est déjà utilisé. Changez le port dans le fichier `.env` ou arrêtez le processus qui utilise ce port.

### Erreur : "Connection refused" pour Redis/Mongo

Vérifiez que Redis/Mongo sont bien démarrés :

```bash
# Pour Redis
redis-cli ping

# Pour Mongo
mongosh --eval "db.adminCommand('ping')"
```

## Prochaines Étapes

Une fois l\'installation terminée, vous pouvez :

- Consulter le [Guide des Prompts MEN](PROMPTS.md)
- Lire la [Documentation API](API.md)
- Suivre le [Guide de Déploiement](DEPLOYMENT.md)

## Support

Si vous rencontrez des problèmes :

1. Consultez la [FAQ](FAQ.md)
2. Ouvrez une issue sur GitHub
3. Contactez l\'équipe de support

## Mise à jour

Pour mettre à jour ProfiV vers la dernière version :

```bash
git pull origin main
npm install
npm run build
```
