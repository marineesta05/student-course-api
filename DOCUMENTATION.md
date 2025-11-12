# Documentation Technique - Student-Course API

## Vue d'ensemble

API REST développée en Node.js/Express pour gérer des étudiants et des cours avec un système d'inscription. L'application utilise un stockage en mémoire et suit le pattern MVC.

## Architecture

### Structure du projet

```
student-course-api/
├── src/
│   ├── app.js                     # Configuration Express
│   ├── controllers/               # Logique métier
│   │   ├── coursesController.js
│   │   └── studentsController.js
│   ├── routes/                    # Définition des routes endpoints
│   │   ├── courses.js
│   │   └── students.js
│   └── services/
│       └── storage.js             # Stockage en mémoire
├── tests/
│   ├── integration/
│   │   └── app.test.js           # Tests end-to-end
│   └── unit/                     # Tests unitaires
├── swagger.json                   # Documentation API
└── package.json
```


## Installation

### Prérequis

- Node.js 16+
- npm 7+

### Setup

```bash
npm install
npm run dev
```

L'API sera disponible sur `http://localhost:3000/api-docs` pour la documentation Swagger.

## API Endpoints

### Étudiants

#### GET /students

Récupère tous les étudiants avec pagination optionnelle.

```bash
curl "http://localhost:3000/students?page=1&limit=10"
```

#### POST /students

Crée un nouvel étudiant.

```bash
curl -X POST "http://localhost:3000/students" \
  -H "Content-Type: application/json" \
  -d '{"name": "Marine El Osta", "email": "marie@example.com"}'
```

#### GET /students/:id

Récupère un étudiant avec ses cours inscrits en fonction de son id.

```bash
curl "http://localhost:3000/students/1"
```

#### PUT /students/:id

Met à jour un étudiant.

```bash
curl -X PUT "http://localhost:3000/students/1" \
  -H "Content-Type: application/json" \
  -d '{"name": "Marine El Osta New", "email": "marine.nouveau@example.com"}'
```

#### DELETE /students/:id

Supprime un étudiant (impossible s'il est inscrit à des cours).

```bash
curl -X DELETE "http://localhost:3000/students/1"
```

### Cours

#### GET /courses

Récupère tous les cours.

#### POST /courses

Crée un nouveau cours.

```bash
curl -X POST "http://localhost:3000/courses" \
  -H "Content-Type: application/json" \
  -d '{"title": "Maths", "teacher": "Prof. Alice"}'
```

#### GET /courses/:id

Récupère un cours avec ses étudiants inscrits.

#### PUT /courses/:id

Met à jour un cours.

#### DELETE /courses/:id

Supprime un cours.

### Inscriptions

#### POST /courses/:courseId/students/:studentId

Inscrit un étudiant à un cours.

```bash
curl -X POST "http://localhost:3000/courses/1/students/1"
```

#### DELETE /courses/:courseId/students/:studentId

Désinscrit un étudiant d'un cours.

```bash
curl -X DELETE "http://localhost:3000/courses/1/students/1"
```

## Validation des données

### Étudiants

- `name` : Requis, string non vide
- `email` : Requis, format email valide, unique

### Cours

- `title` : Requis, string non vide
- `teacher` : Requis, string non vide

## Gestion d'erreurs

### Codes de statut

- `200` : Succès
- `201` : Ressource créée
- `204` : Suppression réussie
- `400` : Données invalides
- `404` : Ressource non trouvée
- `500` : Erreur serveur

### Exemples de réponses d'erreur

```json
// Email déjà utilisé
{
  "error": "Email already exists"
}

// Étudiant non trouvé
{
  "error": "Student not found"
}

// Impossible de supprimer
{
  "error": "Cannot delete student: enrolled in a course"
}
```

## Tests

### Structure

- **Tests unitaires** (`tests/unit/`) : Tests des contrôleurs avec mocks
- **Tests d'intégration** (`tests/integration/`) : Tests end-to-end de l'API

### Exécution

```bash
npm test                # Tous les tests
npm run test --coverage   # Tests avec couverture
```

### Métriques de couverture

- **Statements** : 89.35%
- **Branches** : 81%
- **Functions** : 88.63%
- **Lines** : 91.3%

## Qualité du code

### ESLint + Prettier

```bash
npm run lint        # Vérification
npm run lint:fix    # Correction automatique
```


## CI/CD

### GitHub Actions

Pipeline automatisé qui vérifie :

1. Qualité du code (ESLint)
2. Tests (Jest)
3. Couverture de code
4. Audit de sécurité


### Fonctionnalités Swagger

- Test des endpoints en temps réel
- Documentation des modèles de données
- Exemples de requêtes/réponses
- Validation des paramètres

## Variables d'environnement

| Variable   | Description               | Défaut        |
| ---------- | ------------------------- | ------------- |
| `PORT`     | Port d'écoute du serveur  | `3000`        |


## Stockage des données

### En mémoire

Les données sont stockées dans des tableaux JavaScript :

- `storage.students` : Liste des étudiants
- `storage.courses` : Liste des cours
- `storage.enrollments` : Relations étudiant-cours

### Avantages/Inconvénients

**Avantages** : Simple, rapide, pas de setup DB
**Inconvénients** : Données perdues au redémarrage


## Sécurité

### Validations actuelles

- Format email validé
- Unicité des emails


### Checklist pré-déploiement

- [ ] Tests passants (32/32)
- [ ] Couverture >80%
- [ ] Variables d'env configurées
- [ ] Logs configurés


## Support

### Résolution de problèmes

1. **Tests en échec** : Vérifier les mocks et données
2. **Erreurs ESLint** : Exécuter `npm run lint:fix`

### Ressources

- Documentation Swagger : `/api-docs`
- Tests : `npm test -- --coverage`