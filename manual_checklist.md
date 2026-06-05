# Manual Setup Checklist

> Complete these steps before deploying to production or enabling real AI matching.

---

## 1. Install and Start Ollama

Ollama serves local embedding generation — no API key, no cloud cost.

**Install:**
```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows: download from https://ollama.com/download
```

**Start Ollama:**
```bash
ollama serve
```

**Pull the embedding model (one-time):**
```bash
ollama pull nomic-embed-text
```

The model is ~274 MB and runs entirely local.

---

## 2. Copy `.env.example` → `.env`

In `backend/`:

```bash
cp .env.example .env
```

Fill in at minimum:
```env
JWT_SECRET=your-long-random-secret
MONGODB_URI=mongodb+srv://<your-atlas-uri>
OLLAMA_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
AI_CONFIDENCE_THRESHOLD=0.75
```

---

## 3. Create MongoDB Indexes

No special indexes needed for the Ollama-based approach — the `faq_embeddings` collection uses a plain unique index.

If you want Atlas full-text search as a supplement (not required):
```js
// In mongo shell
db.faqs.createIndex({ title: "text", body: "text" })
```

---

## 4. Rebuild the FAQ Embedding Index

After deploying, trigger a rebuild so the `faq_embeddings` collection is populated:

```bash
curl -X POST http://localhost:3000/api/admin/rebuild-index \
  -H "Authorization: Bearer <admin-jwt-token>"
```

Or via the Admin UI: **Admin → FAQ Manager → Rebuild AI Index**

---

## 5. (Optional) Seed Test Data

```bash
node seed-document-status.js
```

Set `STUDENT_EMAIL` at the top of the script first.

---

## Summary of Steps

| Step | What | Why |
|---|---|---|
| 1 | Install + run `ollama serve` | Local embedding generation |
| 2 | `cp .env.example .env` | Configure env vars |
| 3 | `ollama pull nomic-embed-text` | Pull the embedding model |
| 4 | `POST /admin/rebuild-index` | Populate `faq_embeddings` |
| 5 | Seed test data (optional) | Test intent detection |

**Dev without these steps:** Set `EMBEDDING_PROVIDER=mock` in `.env` — the app runs with simulated embeddings, no external dependencies needed.