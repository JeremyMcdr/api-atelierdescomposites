# API de Manipulation SVG

Cette API permet de manipuler des fichiers SVG, de les convertir en format DXF et de les transformer en séquences d'actions pour contrôler des moteurs produisant des formes 2D.

## Installation

```bash
# Cloner le dépôt
git clone <repository-url>
cd svg_api

# Installer les dépendances
npm install

# Démarrer le serveur
npm start

# Ou en mode développement avec redémarrage automatique
npm run dev
```

## Configuration

Les paramètres de configuration se trouvent dans le fichier `src/config/appConfig.js`. Vous pouvez les modifier directement ou les définir via des variables d'environnement :

- `TARGET_API_URL` : URL de l'API externe qui recevra les séquences d'actions (défaut: http://localhost:3001/api/actions)
- `API_REQUEST_TIMEOUT` : Délai d'attente en millisecondes pour les requêtes vers l'API externe (défaut: 10000)
- `ENABLE_AUTO_API_SEND` : Activer/désactiver l'envoi automatique à l'API externe (défaut: false)

## Structure du projet

```
svg_api/
├── src/
│   ├── controllers/     # Contrôleurs de l'API
│   ├── routes/          # Routes de l'API
│   ├── services/        # Services métier
│   ├── middlewares/     # Middlewares Express
│   ├── uploads/         # Fichiers SVG téléversés
│   ├── generated_dxf/   # Fichiers DXF générés
│   ├── generated_sequences/ # Séquences d'actions générées
│   ├── config/          # Configuration de l'application
│   ├── app.js           # Application Express
│   └── server.js        # Point d'entrée du serveur
├── package.json
└── swagger.yaml         # Documentation Swagger
```

## Fonctionnalités

### 1. Gestion des fichiers SVG

- Téléverser un fichier SVG
- Récupérer un fichier SVG
- Transformer un SVG en séquence d'actions

### 2. Conversion SVG vers DXF

- Convertir un SVG en DXF
- Télécharger un fichier DXF

### 3. Conversion DXF vers séquence d'actions

- Convertir un DXF en séquence d'actions
- Récupérer une séquence d'actions

### 4. Opérations combinées

- Convertir directement un SVG en séquence d'actions
- Téléverser et convertir directement un SVG en séquence d'actions

### 5. Envoi à une API externe

- Envoyer les séquences d'actions à une API externe

## Exemples d'utilisation

### Téléverser un fichier SVG

```bash
curl -X POST \
  http://localhost:30001/api/svg/upload \
  -H 'Content-Type: multipart/form-data' \
  -F 'svgfile=@/chemin/vers/fichier.svg'
```

### Convertir un SVG en DXF

```bash
curl -X GET \
  http://localhost:30001/api/dxf/convert/nom_du_fichier.svg
```

### Convertir un SVG en séquence d'actions et envoyer à l'API externe

```bash
curl -X POST \
  "http://localhost:30001/api/svg/execute/nom_du_fichier.svg?sendToApi=true"
```

### Téléverser et convertir directement un SVG en séquence d'actions

```bash
curl -X POST \
  http://localhost:30001/api/direct/svg-to-sequence \
  -H 'Content-Type: multipart/form-data' \
  -F 'svgfile=@/chemin/vers/fichier.svg' \
  -F 'sendToApi=true' \
  -F 'closePolygons=true'
```

## Format des séquences d'actions

Les séquences d'actions sont générées au format JSON sous la forme suivante :

```json
[
  {
    "action": "AVANCER",
    "valeur": 10.5
  },
  {
    "action": "PLIER",
    "valeur": 90
  },
  {
    "action": "AVANCER",
    "valeur": 5.2
  },
  {
    "action": "COUPER"
  }
]
```

Trois types d'actions sont disponibles :
- `AVANCER` : déplace l'outil en ligne droite de la distance spécifiée (en mm)
- `PLIER` : pivote l'outil de l'angle spécifié (en degrés)
- `COUPER` : termine la séquence et coupe le matériau

## Documentation Swagger

Une documentation complète de l'API est disponible au format Swagger dans le fichier `swagger.yaml`. Vous pouvez la visualiser avec un outil comme Swagger UI. 