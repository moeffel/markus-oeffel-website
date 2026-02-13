# Private corpus (RAG only)

Place private documents here for ingestion **only**. Do not put anything in `public/` and do not add routes for it.

Default file (optional):
- `private_corpus/high_profile_cv.md` (ignored by git)
- `private_corpus/about_me_rag.md` (ignored by git)

Examples:
- `private_corpus/high_profile_cv.example.md`
- `private_corpus/about_me_rag.example.md`

The ingestion pipeline will merge these files when Sanity `privateProfile` is not configured.
