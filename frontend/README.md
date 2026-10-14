# Kasa Frontend

Frontend Next.js 16 avec React 19, TypeScript, App Router et Tailwind CSS 4. Le frontend consomme l’API Express du dépôt ; il ne contient pas sa propre base de données.

## Prérequis et installation

- Node.js 20.9 ou plus récent (version minimale requise par Next.js 16).
- Yarn Classic 1.22 (`packageManager` du projet).

Depuis la racine :

```sh
yarn --cwd frontend install
```

## Configuration

Copiez `.env.example` vers `.env.local` et configurez :

- `API_BASE_URL` : URL de base du backend Express. Nécessaire aux appels serveur vers REST.
- `NEXT_PUBLIC_MESSAGING_SOCKET_URL` : URL publique du serveur Express utilisé par Socket.IO. Le navigateur se connecte directement au backend pour la messagerie temps réel.
- `SITE_URL` : URL du site, utilisée pour les URL canoniques et métadonnées absolues.

Les fichiers d’exemple ne contiennent pas de secrets. Le cookie de session `kasa_session` est HttpOnly ; les services serveur le transmettent à l’API sous forme de bearer token. Ne rendez jamais ce token accessible au code navigateur.

## Commandes

À lancer depuis la racine avec `yarn --cwd frontend` ou depuis `frontend/` avec `yarn` :

| Commande | Usage |
| --- | --- |
| `yarn dev` | Serveur de développement sur le port 3000 par défaut |
| `yarn build` | Build optimisé de production |
| `yarn start` | Sert le build de production (après `yarn build`) |
| `yarn test` | Lance les tests Vitest une fois |
| `yarn test:watch` | Lance Vitest en mode watch |
| `yarn lint` | Lance ESLint |

## Organisation du code

- `src/app/` : routes App Router, layouts, métadonnées et états de route.
- `src/features/` : composants, actions, services et tests regroupés par fonctionnalité.
- `src/components/` : composants partagés d’interface et de layout.
- `src/api/` : client REST partagé et erreurs API.
- `src/domain/` : types métier partagés.

Les composants de route et composants serveur restent des Server Components sauf si une interaction navigateur, un hook React ou un événement utilisateur impose la directive `"use client"`. Garder la logique d’API dans les services et les mutations/formulaires serveur dans les Server Actions ; éviter de déplacer des secrets ou des appels authentifiés vers le navigateur.

## Données et cache

`apiFetch` utilise `cache: "no-store"` par défaut. C’est le comportement attendu pour les données personnalisées ou susceptibles d’être sensibles (session, favoris, compte, messagerie). Pour une lecture publique dont la fraîcheur le permet, un service peut fournir explicitement `revalidate` ; le TTL doit respecter les règles produit et rester cohérent avec les mécanismes d’invalidation.

Les erreurs HTTP sont représentées par `ApiError`, qui conserve le statut lorsque l’API en fournit un. Les Server Components peuvent convertir les erreurs en état de page, tandis que les actions renvoient des erreurs contrôlées à l’interface.

## Tests

Les tests Vitest sont généralement placés à côté du module testé avec le suffixe `.test.ts` ou `.test.tsx`. Privilégier les tests des contrats observables : appels API et options de cache, validations d’action, permissions/rendu, états d’erreur et interactions accessibles.

Pour lancer l’ensemble des vérifications depuis la racine :

```sh
yarn --cwd frontend test
yarn --cwd frontend lint
yarn --cwd frontend build
```

Le backend doit être démarré séparément pour exécuter l’application ; la plupart des tests frontend mockent les frontières réseau et restent isolés.

## Parcours de l’application

### Accueil et logements

La page d’accueil charge les annonces depuis l’API, les présente par ordre alphabétique et isole la grille derrière un état de chargement (`Suspense`). Une erreur de chargement affiche un état dédié. Les favoris du compte sont chargés séparément : une erreur sur ceux-ci ne doit pas empêcher l’affichage des annonces.

Les cartes ouvrent `/properties/[slug]`. La fiche affiche la galerie, le titre, la description, la localisation, les équipements, les catégories et la carte hôte. Une réponse 404 mène à la page introuvable ; une panne API affiche un état d’erreur. Les données publiques du détail sont revalidées après une heure.

Il n’y a actuellement ni recherche textuelle, ni filtres, ni tri utilisateur, ni pagination de la liste des annonces.

### Inscription, connexion et session

`/sign-in` permet de créer un compte client ; nom, prénom, adresse email, mot de passe fort et acceptation des conditions provisoires sont requis. `/login` ouvre une session. Le cookie `kasa_session` est HttpOnly et les profils/rôles sont revalidés auprès du backend avant d’être utilisés côté serveur. Après connexion, une destination interne sûre peut être restaurée ; les URL externes ne sont pas acceptées. La déconnexion supprime le cookie.

La réinitialisation existe dans l’API backend mais n’a pas de formulaire ou d’action frontend. Le texte de `/conditions-utilisation` est encore un placeholder et ne constitue pas un document juridique finalisé.

### Compte et favoris

`/account` est réservé aux utilisateurs dont la session a été validée. Le profil et le mot de passe sont modifiables via des actions serveur ; le changement de photo est limité aux rôles `owner` et `admin`.

Les favoris sont réservés aux comptes connectés. Un visiteur qui clique sur le cœur est envoyé à la connexion, puis revient à sa destination interne. `/favorites` présente la liste, un état vide ou une erreur. Ajouter et retirer un favori sont des opérations idempotentes ; les données de compte et de favoris ne sont pas partagées dans le cache.

### Demande owner et administration

Un compte `client` peut demander le rôle owner depuis le menu « Ajouter un logement ». Une seule demande peut être en attente ; aucune motivation n’est demandée. Après refus, une nouvelle demande est possible et l’historique reste conservé. Un administrateur peut accepter ou refuser la demande ; l’approbation et le passage au rôle `owner` sont réalisés dans une même transaction backend.

Les pages `/admin` et `/admin/owner-requests` sont réservées au rôle `admin`. Ces protections frontend améliorent le parcours, mais l’API reste l’autorité d’accès.

### Création d’un logement

`/properties/new` est présenté aux rôles `owner` et `admin`. Le serveur revalide la session et utilise le compte connecté comme hôte. Le formulaire demande notamment un titre, une localisation, un code postal français à cinq chiffres, un prix entier positif et une image de couverture ; jusqu’à huit photos de galerie peuvent être ajoutées. Chaque fichier est limité à 10 Mo.

Les images sont envoyées au moment de la soumission, pas lors de leur sélection. En cas d’échec connu après upload, l’action tente de supprimer les fichiers ajoutés par cette soumission. Après création, l’utilisateur est redirigé vers la fiche par slug.

Limite à connaître : le backend protège la modification et la suppression par rôle, mais ne vérifie pas actuellement que l’owner est l’hôte du logement ciblé. Ne pas interpréter le rôle `owner` comme une garantie d’isolation par propriété.

### Messagerie

Depuis une fiche logement, le visiteur peut démarrer une conversation avec l’hôte après connexion. Une seule conversation privée existe par paire d’utilisateurs, indépendamment du logement ; il n’y a ni annuaire de comptes ni auto-conversation. Les conversations sont accessibles uniquement à leurs participants, y compris face à un administrateur.

Les messages sont du texte brut (1 à 4 000 caractères). Un UUID client stable rend les retries idempotents. L’historique REST est la source persistée ; Socket.IO diffuse les nouveaux messages et états de lecture après commit. Après reconnexion, le frontend rattrape les événements manqués par REST. La messagerie propose des états de chargement, d’erreur et de connexion.

### À propos, conditions et routes techniques

`/about` est la page d’information publique. `/conditions-utilisation` est accessible depuis le footer et depuis le formulaire d’inscription, mais son contenu est provisoire. `/properties-data` affiche les données brutes reçues de l’API pour le diagnostic ; cette route n’est pas un parcours normal destiné aux visiteurs.

### SEO et indexation

`SITE_URL` sert à construire les URL canoniques et le sitemap. Le sitemap inclut l’accueil, `/about` et les logements obtenus par l’API. Sans `SITE_URL`, le sitemap ne fournit pas d’URL et `robots.txt` interdit l’exploration du site. Les pages privées déclarent `noindex`. Les fiches logement produisent des métadonnées et un JSON-LD Schema.org de type `Accommodation`, limité aux informations disponibles et présentées.

Le sitemap est une liste d’URL à explorer, pas une garantie d’indexation. `/properties-data` est une route de diagnostic publique et n’est actuellement pas explicitement marquée `noindex`.

## Documentation associée

Les contrats HTTP (paramètres, schémas et réponses) sont décrits dans [l’OpenAPI du backend](../backend/public/openapi.json) et consultables via `/docs.html` lorsque l’API tourne. Les commentaires TSDoc proches des services précisent seulement les règles locales qui ne ressortent pas déjà des types ou de cette vue d’ensemble.

Le site TypeDoc généré pour le frontend est disponible dans [`docs/generated/frontend/index.html`](../docs/generated/frontend/index.html). Modifiez les commentaires TSDoc dans les fichiers `.ts`/`.tsx`, puis lancez `yarn docs:generate` depuis `frontend/` (ou `yarn --cwd frontend docs:generate` depuis la racine). Versionnez avec les sources les fichiers HTML régénérés.
