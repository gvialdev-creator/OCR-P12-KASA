# Kasa Backend (API Express + SQLite)

Backend minimaliste pour l’application Kasa. Il expose une API REST (Express 5) documentée via OpenAPI, utilise SQLite pour le stockage des données, gère l’authentification par JWT et propose des fonctionnalités autour des biens (propriétés), des utilisateurs, des notes (ratings), des favoris, ainsi que l’upload et la suppression d’images.

## Sommaire
- Présentation
- Prérequis
- Installation & démarrage
- Configuration (variables d’environnement)
- Base de données & données de démo
- Documentation API (OpenAPI)
- Authentification & rôles
- Routes principales
- Upload & suppression d’images
- Exemples rapides (curl)
- Dépannage (FAQ)

---

## Présentation
Ce projet fournit une API HTTP permettant de :
- Lister, créer, modifier, supprimer des propriétés (biens) et consulter leur détail.
- Gérer des utilisateurs et leurs informations publiques.
- Ajouter des notes (ratings) sur les propriétés.
- Gérer des favoris (properties préférées) par utilisateur connecté.
- Envoyer des images et récupérer une URL publique; supprimer une ou plusieurs images et nettoyer leurs références en base.

Le serveur est écrit avec Express 5 et persiste les données dans un fichier SQLite. Les routes sont sécurisées par des middlewares d’authentification/autorisation basés sur JWT.

## Prérequis
- Node.js 18+ (recommandé)
- npm

## Installation & démarrage
1. Installer les dépendances:
   - npm install
2. Lancer le serveur:
   - npm start
3. Le serveur écoute par défaut sur http://localhost:3000 (configurable via PORT).

## Configuration (variables d’environnement)
La messagerie utilise aussi `MESSAGING_SOCKET_SECRET` (secret serveur distinct recommande)
et `MESSAGING_FRONTEND_ORIGINS` (origines exactes separees par des virgules, sans slash final).
Sans origine configuree, les connexions Socket.IO sont refusees.
Le frontend configure `NEXT_PUBLIC_MESSAGING_SOCKET_URL` vers le serveur Express,
pas vers une Server Action ou un rewrite Next. Les exemples `.env.example` ne contiennent aucun secret reel.

- PORT: port d’écoute HTTP (par défaut 3000).
- JWT_SECRET: secret pour signer/vérifier les tokens JWT (par défaut "change-me-in-prod"). En production, définissez une valeur forte et secrète.
- DB_PATH (optionnel): chemin du fichier SQLite. Par défaut, `backend/data/kasa.sqlite3` en local et `/app/data/kasa.sqlite3` en production. Un chemin relatif est résolu depuis le dossier `backend`.

Vous pouvez lancer le serveur avec, par exemple:
- JWT_SECRET="votre-secret" PORT=3000 npm start

## Base de données & données de démo
- SGBD: SQLite. Le fichier local par défaut est `data/kasa.sqlite3`; en production, le chemin par défaut est `/app/data/kasa.sqlite3`. `DB_PATH` permet de choisir un autre chemin.
- Le dossier parent du fichier est créé automatiquement si nécessaire. En production, montez un stockage persistant et inscriptible sur `/app/data` (ou sur le dossier parent indiqué par `DB_PATH`); un dossier du conteneur éphémère ne garantit pas la conservation des données après redéploiement.
- À chaque démarrage, le schéma et ses migrations sont appliqués. En local, si aucune propriété n’existe, un seed est effectué depuis `data/properties.json` (si présent). Ce seed de démonstration est désactivé en production.
- Le schéma inclut: users, properties, property_pictures, property_equipments, property_tags, ratings, favorites.
- Les slugs des propriétés sont générés automatiquement et uniques.

Sauvegarde: sauvegardez le fichier SQLite configuré par `DB_PATH` (ou le chemin par défaut de l’environnement). Le changement de chemin ne copie pas une base existante. En local, pour repartir de zéro, arrêtez le serveur et supprimez `data/kasa.sqlite3`, puis relancez-le pour recréer le schéma et charger le seed.

## Documentation API (OpenAPI)
### Messagerie privee

`POST /api/conversations` reprend une paire canonique via `recipient_id`. Tous les roles
peuvent participer ; aucune liaison avec un logement, aucune piece jointe, aucun acces
admin aux conversations d'autrui. Le bouton de fiche utilise `host.id` et pas l'id du logement.
`GET /api/conversations` retourne les discussions, apercus, non-lus et un curseur d'activite
opaque stable (`before=next_cursor`). `GET /api/conversations/:id` retourne la discussion.
`GET /api/conversations/:id/messages` utilise `before` pour l'historique ou `after`
pour le rattrapage (exclusifs, limite 30 par defaut, 100 maximum, ordre croissant).
`POST /api/conversations/:id/messages` prend `body` (1-4000 caracteres) et
`client_message_id` (UUID stable lors d'un retry). Meme UUID/texte = meme message ;
texte different = 409. `PATCH /api/conversations/:id/read` avance seulement le curseur
valide de l'utilisateur authentifie. Les transactions et operations SQLite partagees
sont serialisees, y compris les decisions owner, sans intercaler des ecritures.
Les messages sont conserves en SQLite ; pas de suppression/cascade dans ce lot.

Le cookie HttpOnly reste sur le serveur Next. Une Server Action obtient
`POST /api/messaging/socket-token` : ticket HS256 de cinq minutes maximum, borne par
l'expiration de session, audience `messaging-socket`, emetteur `kasa-messaging`.
Ce ticket est refuse en REST ; le JWT REST est refuse par la socket. L'origine est
controlee en CORS et au handshake, le compte est relu en base et la socket expire
avec son ticket. Le client renouvelle le ticket, nettoie listeners/timers et rattrape
toutes les pages REST apres reconnexion. Rooms `user:<id>` assignees seulement serveur.
Limites par utilisateur/minute : 60 envois, 30 creations, 120 lectures, 20 tickets ;
limiteur en memoire (pour plusieurs instances, utiliser un stockage partage).
Corps JSON limites a 32 Ko. Ne jamais journaliser les tickets, JWT ou textes prives.

La frontiere `publishMessageCreated` intervient apres commit. Contrat version 1 :
`event_id=message:<id>`, `message_id`, `conversation_id`, `sender_id`, `recipient_id`,
`occurred_at`, `message`. `messaging:read-updated` porte `conversation_id` et `read_state`.
Ces evenements sont prives et non durables. Une prochaine phase pourra ajouter
outbox transactionnelle, worker et preferences ; aucun badge global, email ou web push
n'est implemente ici. REST reste l'autorite apres perte d'evenements/redemarrage.
Le reverse proxy doit supporter upgrade WebSocket et polling Socket.IO.
Utiliser HTTPS et des secrets forts en production. Le fallback historique JWT de
developpement doit etre remplace ; la messagerie refuse un secret absent en production.

Recette sans comptes reels : `PORT=3101 MESSAGING_FRONTEND_ORIGINS=http://localhost:3102 node scripts/messaging-preview.js`.
Le script refuse la production et utilise une base temporaire supprimee a l'arret.
Comptes `marie@messaging.test`, `jean@messaging.test`, `admin@messaging.test`,
mot de passe de demonstration uniquement `PreviewOnly123!`. Ne pas deployer ce script.
Frontend : `API_BASE_URL=http://localhost:3101 NEXT_PUBLIC_MESSAGING_SOCKET_URL=http://localhost:3101 NEXT_DIST_DIR=.next-messaging yarn dev --port 3102`.
`NEXT_DIST_DIR` permet la recette isolee sans perturber le build/dev existant.

- Spécification: public/openapi.json
- UI de test/exploration: http://localhost:3000/docs.html (après démarrage)

Les endpoints sont groupés par tags: Auth, Properties, Users, Ratings, Favorites, Uploads. Les schémas de requête/réponse sont détaillés dans la spec.

## Authentification & rôles
- Authentification: JWT via l’en-tête Authorization: Bearer <token>.
- Secret: JWT_SECRET
- Rôles supportés: client, owner, admin.
  - Certaines routes nécessitent d’être connecté (requireAuth).
  - D’autres nécessitent un rôle spécifique, par ex. owner ou admin pour créer/mettre à jour/supprimer des propriétés, ou pour les uploads.
  - Certaines routes autorisent self-or-admin (ex: consulter/mettre à jour son propre profil ou administrateur).

Endpoints d’auth principaux (voir OpenAPI pour le détail):
- POST /auth/register: inscription email/mot de passe (role facultatif: client/owner; défaut: client)
- POST /auth/login: authentification, retourne un token JWT
- POST /auth/request-reset, POST /auth/reset-password: flux de réinitialisation de mot de passe (pour développement, le token peut être renvoyé dans la réponse lorsque ce n’est pas en production).

## Routes principales (aperçu)
Base: /api
- GET /api/properties: liste des propriétés
- GET /api/properties/:id: détail d’une propriété
- POST /api/properties: création (rôle: owner ou admin)
- PATCH /api/properties/:id: mise à jour (rôle: owner ou admin)
- DELETE /api/properties/:id: suppression (rôle: owner ou admin)

- GET /api/users: liste (admin)
- GET /api/users/:id: détail (self ou admin)
- POST /api/users: création (admin)
- PATCH /api/users/:id: mise à jour du nom, de l’email et de la photo (self ou admin; le rôle ne peut pas être modifié ici)
- PATCH /api/users/:id/password: modification du mot de passe (self ou admin)

- GET /api/properties/:id/ratings: lister les notes d’une propriété
- POST /api/properties/:id/ratings: ajouter une note

- POST /api/properties/:id/favorite: ajouter aux favoris (utilisateur connecté)
- DELETE /api/properties/:id/favorite: retirer des favoris (utilisateur connecté)
- GET /api/users/:id/favorites: lister les favoris d’un utilisateur (self ou admin)

- POST /api/uploads/image: uploader une image (rôle: owner ou admin). Répond avec une URL publique /uploads/... et des instructions pour l’utiliser (cover, gallery, etc.).
- DELETE /api/uploads/images: supprimer une ou plusieurs images (rôle: owner ou admin). Accepte des noms de fichiers ou des URLs; nettoie les références en base.

## Upload & suppression d’images
- Dossier public: public/uploads (servi statiquement par Express)
- Upload (multipart/form-data): champ file obligatoire. Champs optionnels: purpose (property-cover | property-picture | user-picture | other), property_id (validation d’existence).
- Réponse: url, filename, size, mimetype, purpose, instructions pour l’usage suivant.
- Suppression: DELETE /api/uploads/images accepte dans le body JSON filename, filenames[], url, urls[] (ou équivalents en query). Sécurisé contre la traversée de chemins.

## Exemples rapides (curl)
Authentification (login):
- curl -s -X POST http://localhost:3000/auth/login -H 'Content-Type: application/json' -d '{"email":"alice@example.com","password":"secret123"}'

Uploader une image (nécessite un token et un rôle owner/admin):
- curl -s -X POST http://localhost:3000/api/uploads/image \
  -H "Authorization: Bearer $TOKEN" \
  -F file=@/chemin/vers/image.jpg \
  -F purpose=property-cover \
  -F property_id=chez-alice

Supprimer des images (par URL):
- curl -s -X DELETE http://localhost:3000/api/uploads/images \
  -H 'Authorization: Bearer $TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"urls":["/uploads/1692971234-a1b2c3d4.jpg","/uploads/1692971299-ffeedd.png"]}'

Créer une propriété (owner/admin):
- curl -s -X POST http://localhost:3000/api/properties \
  -H 'Authorization: Bearer $TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"title":"Charmant Studio","host_id":1,"price_per_night":95}'

## Dépannage (FAQ)
- 401 authentication required: ajoutez l’en-tête Authorization: Bearer <token> (obtenu via /auth/login).
- 403 insufficient role / forbidden: l’utilisateur connecté n’a pas le rôle requis (owner/admin) ou n’est pas autorisé sur la ressource (self-or-admin requis).
- 409 duplicate/UNIQUE: tentative de création d’un enregistrement avec un id/valeur unique déjà existant.
- Upload non disponible: assurez-vous que la dépendance multer est installée (elle l’est par défaut via package.json) et que vous envoyez bien un champ file.
- Port déjà utilisé: changez PORT ou libérez le port.
- Repartir de zéro: stoppez le serveur, supprimez data/kasa.sqlite3, relancez (recréation du schéma et seed depuis data/properties.json si disponible).
