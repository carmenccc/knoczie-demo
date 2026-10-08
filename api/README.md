# Demo API

Node.js + TypeScript + Express. JSON seed data in `data/`.

```bash
cd api
npm install
npm run seed
npm start
```

Health check: `GET http://localhost:3000/api/health`

Generate candidates (`PEP` is an ASCII alias for `人教版`, useful in Windows terminals):

```bash
curl -X POST http://localhost:3000/api/selections -H "Content-Type: application/json" -d "{\"vocabularyScope\":\"PEP\",\"levelRange\":{\"from\":{\"grade\":3,\"term\":null},\"to\":{\"grade\":3,\"term\":null}},\"activity\":\"dictation\",\"count\":10,\"preferredFeatureIds\":[\"feat-changkao\"],\"difficultyPreference\":\"mixed\",\"frequencyPreference\":\"high\"}"
```
