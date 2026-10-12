# Demo API

Node.js + TypeScript + Express. JSON data in `data/`.

HTTP contract (routes, bodies, errors): [docs/api/http-api.md](../docs/api/http-api.md).

```bash
cd api
npm install
npm start
```

`npm run seed` regenerates the old LLM seed files; the live pool is the LinXueyuanStdio extract. Health: `GET http://localhost:3000/api/health`.
