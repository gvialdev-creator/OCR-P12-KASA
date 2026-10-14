# Documentation générée

Les sites HTML générés à partir des commentaires JSDoc/TSDoc sont conservés et versionnés dans ce dossier. Ouvrez les liens ci-dessous dans un navigateur pour parcourir les API documentées :

- [API Backend (JSDoc)](generated/backend/index.html)
- [API Frontend (TypeDoc)](generated/frontend/index.html)

## Régénérer les sites

Depuis la racine du dépôt :

```sh
npm --prefix backend run docs:generate
yarn --cwd frontend docs:generate
```

Les commentaires dans les fichiers source sont la documentation à modifier. Après une modification JSDoc/TSDoc, régénérez les sites et incluez les fichiers HTML mis à jour dans le même changement. Ne modifiez pas directement les fichiers sous `generated/` : ils seront remplacés à la prochaine génération.

JSDoc couvre l’application serveur JavaScript du backend (`app.js`, `bin/`, `db.js`, routes, controllers, middlewares, services et realtime) ; il exclut `test/`, `public/` et les scripts auxiliaires. TypeDoc couvre les fichiers TypeScript et TSX sous `frontend/src`, en excluant les tests et le setup Vitest. Les commentaires JSDoc/TSDoc apparaissent dans les pages générées lorsqu’ils existent ; les symboles sans commentaire restent consultables avec leur nom et leur signature.