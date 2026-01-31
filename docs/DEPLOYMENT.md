
# Guide de Déploiement - ProfiV

Ce guide vous accompagne dans le déploiement de ProfiV en production sur différentes plateformes.

## Plateformes Supportées

- **Vercel** (Frontend)
- **Render** (Backend)
- **Docker** (Infrastructure complète)

## Prérequis

Avant de déployer, assurez-vous d\'avoir :

1. Un compte sur les plateformes de déploiement
2. Les clés API et secrets nécessaires
3. Un domaine personnalisé (optionnel)
4. Un compte GitHub avec le code du projet

## Déploiement sur Vercel (Frontend)

### 1. Préparation

Créez un compte sur [Vercel](https://vercel.com) si ce n\'est pas déjà fait.

### 2. Configuration des Secrets

Dans votre projet Vercel, allez dans Settings > Environment Variables et ajoutez :

```
VITE_API_URL=https://api.profiv.ma/api
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_supabase
```

### 3. Déploiement Automatique

1. Connectez votre repository GitHub à Vercel
2. Sélectionnez le projet ProfiV
3. Configurez les paramètres de build :
   - Framework Preset : Vite
   - Build Command : `npm run build`
   - Output Directory : `dist`
4. Cliquez sur "Deploy"

Vercel déploiera automatiquement à chaque push sur la branche `main`.

### 4. Domaine Personnalisé

1. Allez dans Settings > Domains
2. Ajoutez votre domaine
3. Configurez les DNS selon les instructions de Vercel

## Déploiement sur Render (Backend)

### 1. Préparation

Créez un compte sur [Render](https://render.com) si ce n\'est pas déjà fait.

### 2. Configuration des Services

#### Backend (Node.js)

1. Créez un nouveau "Web Service"
2. Configurez les paramètres :
   - Name : `profiV-backend`
   - Environment : `Node`
   - Build Command : `npm install`
   - Start Command : `node server.js`
3. Ajoutez les variables d\'environnement :
   ```
   NODE_ENV=production
   PORT=3000
   GEMINI_API_KEY=@gemini_api_key
   REDIS_URL=@redis_url
   MONGODB_URI=@mongodb_uri
   SUPABASE_URL=@supabase_url
   SUPABASE_ANON_KEY=@supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=@supabase_service_role_key
   STRIPE_PUBLIC_KEY=@stripe_public_key
   STRIPE_SECRET_KEY=@stripe_secret_key
   STRIPE_WEBHOOK_SECRET=@stripe_webhook_secret
   ```
4. Déployez

#### Redis (Cache)

1. Créez un nouveau "Redis" service
2. Configurez :
   - Name : `profiV-redis`
   - Region : Same as backend
3. Notez l\'URL de connexion et ajoutez-la aux variables du backend

#### MongoDB (Base de données)

1. Créez un nouveau "PostgreSQL" service (ou utilisez MongoDB Atlas)
2. Configurez :
   - Name : `profiV-mongodb`
   - Region : Same as backend
3. Notez l\'URI de connexion et ajoutez-la aux variables du backend

### 3. Configuration du Domaine

1. Allez dans Settings > Custom Domains
2. Ajoutez votre domaine
3. Configurez les DNS selon les instructions de Render

## Déploiement avec Docker

### 1. Préparation

Assurez-vous d\'avoir Docker et Docker Compose installés sur votre serveur.

### 2. Configuration

Créez un fichier `.env` sur votre serveur avec toutes les variables d\'environnement nécessaires.

### 3. Lancement

```bash
# Cloner le repository
git clone https://github.com/votre-username/profiV.git
cd profiV

# Lancer les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f
```

### 4. Configuration Nginx (Optionnel)

Si vous utilisez Nginx comme reverse proxy, configurez-le ainsi :

```nginx
server {
    listen 80;
    server_name api.profiv.ma;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## CI/CD avec GitHub Actions

### 1. Configuration des Secrets

Dans votre repository GitHub, allez dans Settings > Secrets and variables > Actions et ajoutez :

```
GEMINI_API_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_PUBLIC_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### 2. Workflow

Le workflow `.github/workflows/ci-cd.yml` s\'exécute automatiquement à chaque push :

1. **Test** : Exécute les tests unitaires
2. **Build** : Build l\'application
3. **Deploy Staging** : Déploie sur Vercel (branche develop)
4. **Deploy Production** : Déploie sur Vercel (branche main)
5. **Docker** : Build et push les images Docker

## Monitoring

### Logs

- **Vercel** : Dashboard > Logs
- **Render** : Dashboard > Logs
- **Docker** : `docker-compose logs -f`

### Métriques

Configurez des outils de monitoring comme :

- **Sentry** : Pour le tracking des erreurs
- **Google Analytics** : Pour l\'analytics
- **Uptime Robot** : Pour le monitoring de disponibilité

## Sécurité

### 1. HTTPS

Assurez-vous que tous les services utilisent HTTPS :
- Vercel : Automatique
- Render : Configurer le certificat SSL
- Docker : Utiliser Let\'s Encrypt avec Certbot

### 2. Variables d\'Environnement

Ne commitez jamais les variables sensibles. Utilisez toujours les secrets des plateformes.

### 3. Rate Limiting

Configurez les limites appropriées dans le backend pour éviter les abus.

## Sauvegarde

### MongoDB

```bash
# Sauvegarde manuelle
mongodump --uri="mongodb://localhost:27017/profiV" --out=/backup

# Restauration
mongorestore --uri="mongodb://localhost:27017/profiV" /backup
```

### Redis

```bash
# Sauvegarde manuelle
redis-cli BGSAVE

# Les fichiers sont dans /var/lib/redis/dump.rdb
```

## Mise à Jour

### Processus

1. Testez les changements en staging
2. Créez une pull request
3. Faites un code review
4. Mergez dans `main`
5. Le déploiement se fait automatiquement

### Rollback

Si un problème survient :

```bash
# Docker
docker-compose down
git checkout <previous_commit>
docker-compose up -d

# Vercel
Allez dans Dashboard > Deploys > Redeploy
```

## Support

Pour toute question sur le déploiement :

1. Consultez cette documentation
2. Vérifiez les logs
3. Contactez l\'équipe de support
