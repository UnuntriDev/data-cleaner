# Data Cleaner

A professional web app for data cleaning. Upload a file (CSV / Excel / JSON),
get an instant preview with quality stats, review automatically detected
issues (Smart Fix), run a cleaning pipeline as a background job, preview the
cleaned result and download it (CSV / Excel / JSON).

- **Backend:** Python 3.12+, FastAPI, pandas, SQLAlchemy 2.0, Alembic, Pydantic v2
- **Frontend:** React + TypeScript (Vite, Tailwind v4, framer-motion)
- **Database:** SQLite for local dev (default), PostgreSQL via docker compose

## Architecture

A clean, strictly layered backend — each layer only depends on the one below it:

| Layer        | Package                | Responsibility                                  |
|--------------|------------------------|-------------------------------------------------|
| API          | `app/api/routes`       | HTTP only. No business logic.                   |
| Service      | `app/services`         | Orchestration, transactions, wiring layers.     |
| Repository   | `app/repositories`     | Persistence (SQLAlchemy) only.                  |
| Cleaning     | `app/cleaning`         | Pure-pandas operations, pipeline, insights.     |
| IO           | `app/io`               | File readers/writers, upload streaming, caches. |
| Database     | `app/db`               | Models + session.                               |

### Cleaning jobs are asynchronous

`POST /cleaning/jobs` validates the request, stores a **pending** job and
returns **202** immediately; the pipeline runs in a background task. Clients
poll `GET /cleaning/jobs/{id}` until the status is `completed` or `failed`
(the frontend does this with exponential backoff and pauses while the tab is
hidden). Jobs orphaned by a server restart are marked `failed` on startup.

### Smart Fix (automatic issue detection)

On upload the file is parsed **once**; a preview, quality stats and detected
issues (duplicates, messy column names, stray whitespace, numbers stored as
text, high-missing columns, outliers) are cached next to the stored file.
Each issue carries ready-to-run pipeline steps, so fixing is one click.

### Cleaning operations

Every operation is a separate class implementing the same interface
(`app/cleaning/base.py`):

```python
class CleaningOperation(ABC):
    name: str                      # registry key the frontend sends
    ParamsModel: type[BaseModel]   # per-operation pydantic validation
    def execute(self, df, params) -> OperationResult: ...   # (df, metadata)
```

The pipeline runs **only** the operations the user selected, in order, and
collects each operation's metadata into the cleaning report.

Implemented operations: `remove_duplicates`, `handle_missing` (drop rows/cols,
mean/median/mode/custom/ffill/bfill), `convert_types`, `clean_text`
(trim/lower/upper/title/remove empty/remove special chars), `clean_column_names`,
`detect_outliers` (IQR / Z-score), `parse_dates`, `filter_rows`, `rename_columns`,
`remove_columns`.

## Run with Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend docs (Swagger): http://localhost:8000/docs
- Migrations run automatically on backend startup.

## Run locally (without Docker)

### 1. Backend (SQLite — no extra services needed)
```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# Unix:     source .venv/bin/activate
pip install -r requirements.txt
set DATABASE_URL=sqlite:///./app.db   # Unix: export DATABASE_URL=sqlite:///./app.db
alembic upgrade head
uvicorn app.main:app --reload
```

To use PostgreSQL instead, start it (`docker compose up -d db`) and point
`DATABASE_URL` at it before running the migrations.

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Configuration

All backend settings come from the environment / `.env` (see `.env.example`):

| Variable            | Default                        | Purpose                                   |
|---------------------|--------------------------------|-------------------------------------------|
| `DATABASE_URL`      | `sqlite:///./app.db`           | SQLAlchemy database URL                   |
| `STORAGE_DIR`       | `./_storage`                   | Uploads, results and exports on disk      |
| `MAX_UPLOAD_MB`     | `50`                           | Upload size limit (enforced mid-stream)   |
| `CORS_ORIGINS`      | localhost dev origins          | Comma-separated allowlist (never `*`)     |
| `ENABLE_SQL_IMPORT` | `false`                        | Opt-in for `/datasets/import-sql` (SSRF risk on hosted setups) |
| `LOG_LEVEL`         | `INFO`                         | Backend log level                         |

Every response carries an `X-Request-ID` header (incoming value is reused)
and the same id is attached to backend log lines.

## Tests

```bash
# Backend: unit tests (operations, pipeline, insights) + API tests
cd backend
pip install -r requirements.txt
pytest

# Frontend: vitest (job polling, Smart Fix step ordering)
cd frontend
npm test
```

CI (GitHub Actions, `.github/workflows/ci.yml`) runs both suites plus the
frontend type-check/build on every push and pull request.

## Usage

1. **Upload** a CSV / Excel / JSON file (or click *Wczytaj przykład* for the built-in sample).
2. **Review** the file summary and the automatically detected issues.
3. **Pick fixes** (Smart Fix) or open manual mode and select operations yourself.
4. **Run** the cleaning job and watch its progress.
5. **Preview** the cleaned data and read the generated **report**.
6. **Download** the result as CSV / Excel / JSON.

## API

| Method | Path                          | Purpose                                        |
|--------|-------------------------------|------------------------------------------------|
| GET    | `/health`                     | Liveness check                                 |
| POST   | `/datasets/upload`            | Upload a CSV/Excel/JSON file (streamed)        |
| POST   | `/datasets/import-sql`        | Import via SQL query (**403 unless enabled**)  |
| GET    | `/datasets`                   | List datasets                                  |
| GET    | `/datasets/{id}/preview`      | Preview raw rows (cached)                      |
| GET    | `/datasets/{id}/stats`        | Quality stats (cached)                         |
| GET    | `/datasets/{id}/insights`     | Detected issues + recommended fixes (cached)   |
| GET    | `/cleaning/operations`        | List available operations                      |
| POST   | `/cleaning/jobs`              | Create a job — **202**, runs in the background |
| GET    | `/cleaning/jobs/{id}`         | Poll job status (`pending/running/completed/failed`) |
| GET    | `/cleaning/jobs`              | Cleaning history                               |
| GET    | `/cleaning/jobs/{id}/preview` | Preview cleaned rows (completed jobs only)     |
| GET    | `/reports/by-job/{job_id}`    | Get the report for a job                       |
| POST   | `/exports/{job_id}`           | Export a result to file/PostgreSQL (completed jobs only) |
| GET    | `/exports/{job_id}/download`  | Download the cleaned file (`?format=csv|excel|json`) |

Downloaded CSV/Excel files have formula-prefixed cells escaped to prevent
spreadsheet formula injection.
