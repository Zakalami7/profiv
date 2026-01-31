
# Étape 1: Build de l\'application
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Étape 2: Image de production
FROM node:20-alpine

WORKDIR /app

# Copier les dépendances depuis le builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.js ./

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["node", "server.js"]
