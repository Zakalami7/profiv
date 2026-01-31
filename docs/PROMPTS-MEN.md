
# Guide des Prompts MEN - ProfiV

Ce guide explique comment utiliser et personnaliser les prompts conformes au programme du Ministère de l'Éducation Nationale (MEN) du Maroc.

## Structure des Prompts

Chaque prompt est structuré selon les standards officiels du MEN et comprend :

1. **Rôle** : Définit le rôle de l'IA (Inspecteur Pédagogique)
2. **Tâche** : Décrit clairement l'objectif de la génération
3. **Instructions de Forme** : Spécifications strictes sur la structure et le format
4. **Contenu** : Directives sur le contenu pédagogique
5. **Format de Sortie** : Structure JSON attendue

## Prompts par Matière

### Mathématiques

#### Primaire

**Niveaux :** 1ère à 6ème Année

**Thèmes principaux :**
- Nombres et opérations
- Géométrie (formes, angles, mesures)
- Proportionnalité et pourcentages
- Statistiques élémentaires

**Exemple de prompt :**
```
Rôle : Inspecteur Pédagogique (MEN - Maroc)
Tâche : Rédiger un exercice de mathématiques
Niveau : Primaire (3ème Année)
Chapitre : Addition avec retenue
Difficulté : Débutant

Instructions :
- Utiliser des situations concrètes du quotidien marocain
- Inclure des illustrations si nécessaire
- Format réponse : étape par étape
```

#### Collège

**Niveaux :** 1ère à 3ème Année

**Thèmes principaux :**
- Nombres rationnels et réels
- Calcul littéral et équations
- Géométrie plane et dans l'espace
- Fonctions et statistiques

**Exemple de prompt :**
```
Rôle : Inspecteur Pédagogique (MEN - Maroc)
Tâche : Rédiger un exercice type examen national
Niveau : Collège (3ème Année)
Chapitre : Théorème de Thalès
Difficulté : Intermédiaire

Instructions :
- Structure officielle examen national
- Données clairement listées
- LaTeX pour toutes les formules
- Barème indicatif
```

#### Lycée

**Niveaux :** Tronc Commun, 1ère et 2ème Bac

**Thèmes principaux :**
- Arithmétique et nombres complexes
- Analyse et fonctions
- Géométrie analytique
- Probabilités et statistiques

### Physique-Chimie

#### Collège

**Thèmes principaux :**
- L'eau et ses propriétés
- Électricité (circuits, courant)
- Lumière et optique
- Chimie (réactions, solutions)

**Structure obligatoire :**
1. Section "Données" avec toutes les constantes
2. Numérotation hiérarchique (1., 1.1., 1.2.)
3. Style impersonnel ("On considère...")
4. LaTeX pour toutes les formules

#### Lycée

**Thèmes principaux :**
- Mécanique (forces, mouvement)
- Électricité (circuits, puissance)
- Chimie organique et minérale
- Ondes et optique

### SVT (Sciences de la Vie et de la Terre)

#### Collège

**Thèmes principaux :**
- Fonctionnement du corps humain
- Reproduction et développement
- Environnement et écologie
- Géologie externe

#### Lycée

**Thèmes principaux :**
- Immunologie
- Génétique
- Physiologie animale et végétale
- Géologie

### Langues

#### Arabe

**Composantes obligatoires :**
1. Texte de départ
2. Questions de compréhension
3. Leçon linguistique
4. Expression écrite

**Styles :**
- Langue arabe classique (Fusha)
- Terminologie pédagogique officielle
- Structure conforme aux examens nationaux

#### Français

**Composantes obligatoires :**
1. Texte support
2. Questions d'analyse
3. Grammaire/Conjugaison
4. Production écrite

**Styles :**
- Langue française standard
- Terminologie littéraire appropriée
- Structure conforme aux examens nationaux

## Personnalisation des Prompts

### Variables Dynamiques

Les prompts supportent les variables suivantes :

- `{{LEVEL}}` : Niveau scolaire
- `{{SUBJECT}}` : Matière
- `{{CHAPTER}}` : Chapitre ou thème
- `{{DIFFICULTY}}` : Niveau de difficulté
- `{{EXERCISE_COUNT}}` : Nombre d'exercices à générer

### Exemple d'utilisation

```javascript
const prompt = `
  Rôle : Inspecteur Pédagogique (MEN - Maroc)
  Tâche : Rédiger des exercices
  Niveau : {{LEVEL}}
  Matière : {{SUBJECT}}
  Chapitre : {{CHAPTER}}
  Difficulté : {{DIFFICULTY}}
  Nombre d'exercices : {{EXERCISE_COUNT}}

  Instructions :
  - Structure officielle examen national
  - Contenu conforme au programme en vigueur
  - Format JSON avec énoncé et correction
`;

const personalizedPrompt = prompt
  .replace('{{LEVEL}}', 'Collège (3ème Année)')
  .replace('{{SUBJECT}}', 'Mathématiques')
  .replace('{{CHAPTER}}', 'Théorème de Thalès')
  .replace('{{DIFFICULTY}}', 'Intermédiaire')
  .replace('{{EXERCISE_COUNT}}', '5');
```

## Bonnes Pratiques

### 1. Précision du Chapitre

✅ **Bon :** "Théorème de Thalès et applications"
❌ **Mauvais :** "Géométrie"

### 2. Niveau de Difficulté

✅ **Bon :** "Intermédiaire (Examen National)"
❌ **Mauvais :** "Moyen"

### 3. Contextualisation

✅ **Bon :** "Une école à Casablanca organise une sortie pédagogique..."
❌ **Mauvais :** "Un bâtiment..."

### 4. Conformité Programme

Toujours vérifier que le chapitre existe dans le programme officiel du MEN pour l'année en cours.

## Validation des Prompts

Avant d'utiliser un prompt en production, vérifiez :

1. ✅ Le rôle est clairement défini
2. ✅ Les instructions sont spécifiques
3. ✅ Le format de sortie est précisé
4. ✅ Le niveau de difficulté est adapté
5. ✅ Le contenu est conforme au programme MEN

## Ressources

- [Programmes Officiels MEN](https://www.men.gov.ma)
- [Cadres de Référence](https://www.men.gov.ma/Ar/Espace-Enseignant/Cadres-de-reference)
- [Sujets d'Examens Nationaux](https://www.men.gov.ma/Ar/Espace-Eleve/Examens-nationaux)

## Support

Pour toute question sur les prompts ou leur personnalisation, consultez :

1. La FAQ du projet
2. Les issues GitHub
3. L'équipe de support
