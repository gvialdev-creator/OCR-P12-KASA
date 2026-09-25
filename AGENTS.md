# AGENTS.md

## Projet

Kasa est une application web développée dans le cadre d'une formation OpenClassrooms de développeur d'applications React.

Le projet est composé d'un frontend et d'un backend.

## Objectif

Le code doit rester :

* simple ;
* lisible ;
* maintenable ;
* cohérent avec l'architecture existante ;
* adapté au niveau et aux objectifs du projet.

Ne pas introduire de complexité inutile.

## Principes généraux

* Respecter l'architecture existante avant de proposer une nouvelle architecture.
* Réutiliser le code existant lorsqu'il est adapté.
* Éviter les duplications de code.
* Ne pas ajouter de dépendance sans justification.
* Ne pas modifier plusieurs fichiers lorsque quelques modifications ciblées suffisent.
* Ne pas réécrire entièrement un fichier pour une modification mineure.
* Ne pas supprimer de code existant sans vérifier son utilisation.
* Ne pas modifier le comportement existant sans raison clairement identifiée.
* Signaler les conséquences potentielles d'une modification importante.


## Stack technique

### Frontend

- Next.js 16.3.6
- React 19.2.8
- TypeScript 5.9.3
- Tailwind CSS
- App Router avec le dossier `src/app/`

### Backend

Le backend Express.js est fourni par OpenClassrooms.

Le frontend doit consommer l'API existante sans modifier le backend, sauf demande explicite.

### Design

Les maquettes de référence sont réalisées avec Figma.

L'implémentation frontend doit respecter les maquettes Figma en termes de :

- structure ;
- hiérarchie visuelle ;
- espacement ;
- typographie ;
- couleurs ;
- composants ;
- responsive design.

Ne pas inventer de nouveaux éléments d'interface lorsque l'information nécessaire est disponible dans les maquettes.

## Next.js et React

- Utiliser les fonctionnalités natives de Next.js lorsqu'elles répondent au besoin.
- Utiliser les Server Components par défaut.
- Ajouter `"use client"` uniquement lorsqu'un composant utilise une fonctionnalité nécessitant un Client Component.
- Ne pas ajouter `"use client"` par défaut aux composants.
- Utiliser les composants React fonctionnels.
- Privilégier des composants simples avec une responsabilité clairement définie.
- Réutiliser les composants existants avant d'en créer de nouveaux.

## TypeScript

* Utiliser TypeScript plutôt que JavaScript pour le nouveau code.
* Éviter `any`.
* Préférer les types et interfaces déjà présents dans le projet.
* Ne pas créer de types redondants.
* Respecter les types existants.
* Corriger les erreurs TypeScript plutôt que les contourner.
* Ne pas utiliser `@ts-ignore` sans justification.

## Structure et arborescence du projet

### Objectif architectural

L'application doit maintenir une séparation claire entre :

- l'interface utilisateur (UI) ;
- la logique de présentation ;
- les hooks React ;
- la logique métier ;
- les services applicatifs ;
- les communications avec l'API ;
- les types et modèles ;
- les fonctions utilitaires ;
- l'infrastructure et la configuration.

L'objectif principal est d'éviter que les composants React deviennent responsables simultanément de l'affichage, de la logique métier, des appels API et de la gestion des données.

L'architecture doit privilégier :

- la séparation des responsabilités ;
- la réutilisabilité ;
- la testabilité ;
- la lisibilité ;
- la maintenabilité ;
- des dépendances clairement orientées ;
- des composants UI simples et prévisibles.

---

### Arborescence générale

L'organisation principale du dossier `src/` doit suivre cette structure :

```text
src/
├── app/
│   ├── layout/
│   ├── routes/
│   ├── providers/
│   └── config/
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── feedback/
│
├── features/
│   ├── auth/
│   ├── projects/
│   ├── tasks/
│   └── ...
│
├── domain/
│   ├── entities/
│   ├── rules/
│   └── types/
│
├── services/
│   ├── auth/
│   ├── storage/
│   └── ...
│
├── api/
│   ├── client.ts
│   ├── errors.ts
│   └── interceptors.ts
│
├── hooks/
│   ├── useDebounce.ts
│   ├── useMediaQuery.ts
│   └── ...
│
├── lib/
│   ├── date.ts
│   ├── logger.ts
│   ├── validation.ts
│   └── ...
│
├── types/
│   └── ...
│
└── styles/
    ├── globals.css
    └── ...
```

## Qualité du code

Privilégier :

* des fonctions courtes ;
* des composants simples ;
* des noms explicites ;
* une responsabilité claire par module ;
* des imports propres ;
* une gestion explicite des erreurs.

Éviter :

* les abstractions prématurées ;
* les fonctions excessivement longues ;
* les fichiers monolithiques ;
* les duplications ;
* les solutions inutilement complexes.

## Sécurité

* Ne jamais exposer de secrets ou de clés API dans le code.
* Ne jamais placer de mot de passe ou token directement dans le dépôt.
* Utiliser les variables d'environnement lorsqu'elles sont nécessaires.
* Ne pas désactiver une sécurité uniquement pour faire disparaître une erreur.
* Ne pas contourner les validations ou contrôles d'accès existants.

## Tailwind CSS

Le projet utilise Tailwind CSS 4.

- Utiliser les classes utilitaires Tailwind pour le styling.
- Respecter la configuration Tailwind existante dans `src/app/globals.css`.
- Utiliser les variables et tokens définis dans `@theme` lorsqu'ils existent.
- Ne pas créer de fichier `tailwind.config.js` ou `tailwind.config.ts` sans nécessité.
- Éviter les styles inline lorsque les classes Tailwind permettent de répondre au besoin.
- Éviter de dupliquer les mêmes valeurs de couleurs, espacements, tailles ou autres propriétés lorsqu'un token ou une classe Tailwind existante peut être réutilisé.
- Ne pas ajouter de valeurs arbitraires (`[...]`) lorsqu'une valeur Tailwind existante ou un token du projet convient.
- Regrouper dans `globals.css` uniquement les styles globaux réellement nécessaires.
- Ne pas utiliser Tailwind pour remplacer inutilement des composants ou abstractions React.

## Design et intégration Figma

Les maquettes Figma constituent la référence visuelle du frontend.

Lors de l'implémentation d'une interface :

- respecter la structure définie dans les maquettes ;
- respecter les dimensions et proportions importantes ;
- respecter les espacements ;
- respecter les couleurs ;
- respecter la typographie ;
- respecter les états et variantes des composants ;
- respecter le comportement responsive défini par les maquettes.

Ne pas modifier volontairement un choix de design présent dans les maquettes sans raison fonctionnelle ou technique.

Lorsque la maquette ne précise pas un comportement, choisir la solution la plus simple et cohérente avec le reste de l'application.

Ne pas inventer de composants ou de comportements qui ne sont pas nécessaires au fonctionnement de l'application.

## Git

L'agent ne doit pas :

* créer automatiquement un commit ;
* effectuer automatiquement un push ;
* supprimer ou réécrire l'historique Git ;
* supprimer une branche ;
* effectuer une opération Git destructive sans validation explicite.

## Modification du projet

Avant une modification importante :

1. Identifier les fichiers concernés.
2. Comprendre le fonctionnement existant.
3. Expliquer brièvement la solution proposée.
4. Modifier uniquement ce qui est nécessaire.
5. Vérifier les erreurs TypeScript et les tests disponibles.

## Dépendances

Avant d'ajouter une dépendance :

1. Vérifier si une dépendance existante permet déjà de résoudre le problème.
2. Vérifier si une fonctionnalité native ou déjà présente suffit.
3. Expliquer pourquoi la nouvelle dépendance est nécessaire.
4. Ne pas ajouter automatiquement la dépendance sans validation.

## Communication

Répondre en français.

Les explications doivent être pédagogiques et adaptées à un développeur en formation.

Lorsqu'une modification est proposée :

* expliquer ce qui change ;
* expliquer pourquoi ;
* indiquer les fichiers concernés ;
* signaler les éventuels effets secondaires.

Privilégier une solution simple avant une solution sophistiquée.
