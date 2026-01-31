
# Documentation API - ProfiV

Cette documentation décrit tous les endpoints disponibles dans l\'API ProfiV.

## Base URL

```
Développement : http://localhost:3000/api
Production : https://api.profiv.ma/api
```

## Authentification

La plupart des endpoints nécessitent un token JWT dans l\'en-tête Authorization :

```
Authorization: Bearer <votre_token_jwt>
```

## Endpoints

### 1. Génération d\'Exercices

#### POST /generate

Génère des exercices personnalisés selon les paramètres spécifiés.

**Requête :**

```json
{
  "level": "Collège (3ème Année)",
  "subject": "Mathématiques",
  "chapter": "Théorème de Thalès",
  "difficulty": "Intermédiaire",
  "type": "Application",
  "objective": "Maîtriser le théorème de Thalès",
  "exerciseCount": 5,
  "selectedChapters": [
    {
      "chapter": "Théorème de Thalès",
      "count": 3
    }
  ]
}
```

**Réponse :**

```json
{
  "exercises": [
    {
      "id": "gen-1234567890-0",
      "title": "Exercice 1",
      "enonce": "Énoncé de l\'exercice en Markdown...",
      "corrige": "Correction détaillée en Markdown...",
      "illustrationSVG": null
    }
  ],
  "cached": false,
  "duration": 2345
}
```

**Codes de réponse :**
- `200` : Succès
- `400` : Erreur de validation des paramètres
- `500` : Erreur serveur

#### POST /batch-generate

Génère plusieurs exercices en mode batch pour optimiser les coûts API.

**Requête :**

```json
{
  "options": {
    "level": "Collège (3ème Année)",
    "subject": "Mathématiques",
    "chapter": "Théorème de Thalès",
    "difficulty": "Intermédiaire",
    "type": "Application",
    "exerciseCount": 10
  },
  "batchSize": 5
}
```

**Réponse :**

```json
{
  "exercises": [
    // Tableau de 10 exercices
  ],
  "batches": 2,
  "totalCost": 0.0075,
  "costPerExercise": 0.00075,
  "cachedCount": 0,
  "duration": 4567
}
```

**Codes de réponse :**
- `200` : Succès
- `400` : Erreur de validation des paramètres
- `500` : Erreur serveur

### 2. Cache d\'Exercices

#### GET /exercices-cache/:niveau

Récupère les exercices en cache pour un niveau donné.

**Paramètres :**
- `niveau` (string) : Niveau scolaire (ex: "college-3eme")

**Réponse :**

```json
{
  "exercises": [
    {
      "signature": "college-3eme-maths-thales-intermediaire",
      "level": "Collège (3ème Année)",
      "subject": "Mathématiques",
      "chapter": "Théorème de Thalès",
      "exercises": [...],
      "createdAt": "2024-01-15T10:30:00Z",
      "expiresAt": "2024-01-16T10:30:00Z"
    }
  ],
  "total": 15
}
```

**Codes de réponse :**
- `200` : Succès
- `404` : Aucun exercice en cache pour ce niveau

#### DELETE /exercices-cache/:signature

Supprime un exercice spécifique du cache.

**Paramètres :**
- `signature` (string) : Signature unique de l\'exercice

**Réponse :**

```json
{
  "success": true,
  "message": "Exercice supprimé du cache"
}
```

**Codes de réponse :**
- `200` : Succès
- `404` : Exercice non trouvé dans le cache

### 3. Statistiques

#### GET /stats

Récupère les statistiques d\'utilisation de l\'API.

**Réponse :**

```json
{
  "totalRequests": 1234,
  "totalExercisesGenerated": 5678,
  "totalCost": 4.56,
  "averageCostPerExercise": 0.0008,
  "cacheHitRate": 67.5,
  "lastReset": "2024-01-01T00:00:00Z"
}
```

**Codes de réponse :**
- `200` : Succès

### 4. Quiz Diagnostique

#### POST /quiz/diagnostic

Génère un quiz diagnostique personnalisé.

**Requête :**

```json
{
  "level": "Collège (3ème Année)",
  "subject": "Mathématiques",
  "chapter": "Théorème de Thalès",
  "difficulty": "Intermédiaire"
}
```

**Réponse :**

```json
{
  "questions": [
    {
      "id": "q1",
      "question": "Énoncé de la question...",
      "choices": ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
      "correctAnswerIndex": 1,
      "explanation": "Explication détaillée...",
      "topic": "Théorème de Thalès"
    }
  ],
  "totalQuestions": 10
}
```

**Codes de réponse :**
- `200` : Succès
- `400` : Erreur de validation des paramètres
- `500` : Erreur serveur

#### POST /quiz/analyze

Analyse les résultats d\'un quiz diagnostique.

**Requête :**

```json
{
  "questions": [...],
  "answers": [1, 0, 2, 1, ...],
  "level": "Collège (3ème Année)",
  "subject": "Mathématiques"
}
```

**Réponse :**

```json
{
  "score": 7,
  "totalQuestions": 10,
  "diagnosis": "Niveau satisfaisant en Thalès, mais des lacunes en calcul...",
  "strengths": [
    "Compréhension du théorème",
    "Application directe"
  ],
  "weaknesses": [
    "Calculs complexes",
    "Résolution de problèmes"
  ],
  "revisionPlan": [
    {
      "topic": "Calculs proportionnels",
      "action": "Faire 5 exercices de calcul"
    }
  ]
}
```

**Codes de réponse :**
- `200` : Succès
- `400` : Erreur de validation des paramètres
- `500` : Erreur serveur

### 5. Export

#### POST /export/pdf

Exporte des exercices en format PDF.

**Requête :**

```json
{
  "exercises": [...],
  "options": {
    "includeCorrections": true,
    "includeHeader": true,
    "header": {
      "professorName": "Prof. Ahmed",
      "schoolName": "Lycée Mohammed V",
      "date": "15/01/2024",
      "duration": "2h"
    }
  }
}
```

**Réponse :**
- `Content-Type`: application/pdf
- Corps du fichier PDF binaire

**Codes de réponse :**
- `200` : Succès
- `400` : Erreur de validation des paramètres
- `500` : Erreur serveur

#### POST /export/word

Exporte des exercices en format Word (.docx).

**Requête :** Même format que /export/pdf

**Réponse :**
- `Content-Type`: application/vnd.openxmlformats-officedocument.wordprocessingml.document
- Corps du fichier Word binaire

**Codes de réponse :**
- `200` : Succès
- `400` : Erreur de validation des paramètres
- `500` : Erreur serveur

## Erreurs

### Format de réponse d\'erreur

```json
{
  "error": "Message d\'erreur",
  "code": "ERROR_CODE",
  "details": {
    "field": "Nom du champ en erreur",
    "message": "Message détaillé"
  }
}
```

### Codes d\'erreur courants

- `VALIDATION_ERROR` : Erreur de validation des paramètres
- `AUTH_ERROR` : Erreur d\'authentification
- `RATE_LIMIT_EXCEEDED` : Limite de taux dépassée
- `GEMINI_API_ERROR` : Erreur de l\'API Gemini
- `CACHE_ERROR` : Erreur du cache
- `EXPORT_ERROR` : Erreur lors de l\'export

## Rate Limiting

L\'API applique les limites suivantes :

- **100 requêtes** par 15 minutes par IP
- **1000 requêtes** par heure par IP
- **10 000 requêtes** par jour par IP

En cas de dépassement, vous recevrez une réponse avec le code `429` :

```json
{
  "error": "Trop de requêtes",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 300
}
```

## Webhooks

### Stripe Webhook

**Endpoint :** POST /webhooks/stripe

Reçoit les notifications de Stripe pour les paiements.

**Événements gérés :**
- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Support

Pour toute question sur l\'API :

1. Consultez cette documentation
2. Vérifiez les codes d\'erreur
3. Contactez l\'équipe de support
