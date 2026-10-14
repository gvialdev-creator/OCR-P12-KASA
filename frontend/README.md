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
