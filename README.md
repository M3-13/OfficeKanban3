# OfficeKanban3

Ein vollwertiges, Jira-ahnliches Kanban-Board mit Multi-User-Authentifizierung, Echtzeit-Zusammenarbeit, WIP-Limits, Swimlanes, Tags, Falligkeitsdaten, Kommentarfunktion und Volltextsuche.

## Tech Stack

- **Backend**: Python 3.12+, FastAPI, SQLAlchemy async, SQLite, python-jose (JWT), bcrypt, uvicorn, slowapi (Rate Limiting)
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, React Router
- **Realtime**: WebSocket via FastAPI (ws://)
- **Testing**: pytest + pytest-asyncio (Backend)

## Installation

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Der Frontend-Dev-Server lauft auf `http://localhost:5173` und proxyt API-Anfragen automatisch an das Backend auf Port 8000.

## Umgebungsvariablen

| Variable | Standard | Beschreibung |
|---|---|---|
| `DB_PATH` | `officekanban.db` | Pfad zur SQLite-Datenbank |
| `DATABASE_URL` | `sqlite+aiosqlite:///officekanban.db` | SQLAlchemy-Datenbank-URL |
| `JWT_SECRET` | `dev-secret-change-me-in-production` | Secret fur JWT-Signierung |
| `JWT_EXPIRY_HOURS` | `24` | Ablaufzeit fur JWT-Token in Stunden |

## API-Dokumentation

Nach dem Start des Backends ist die interaktive API-Dokumentation verfugbar:

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Auth-Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| `POST` | `/auth/register` | Registrierung (E-Mail + Passwort, min. 8 Zeichen) |
| `POST` | `/auth/login` | Login (E-Mail + Passwort) |
| `POST` | `/auth/logout` | Logout |
| `GET` | `/auth/me` | Aktuellen Benutzer abrufen |
| `DELETE` | `/auth/me` | Konto loschen |

Rate Limiting: 5 Anfragen/Sekunde pro IP auf Login- und Registrierungs-Endpunkten.

## Features

- [x] Benutzerregistrierung und Login mit JWT-Authentifizierung
- [x] Rate Limiting auf Auth-Endpunkten
- [ ] Board-Management (CRUD)
- [ ] Kanban-Spalten mit WIP-Limits
- [ ] Tickets mit Prioritat, Tags, Falligkeitsdatum, Zuweisung
- [ ] Drag & Drop fur Tickets
- [ ] Kommentare unter Tickets
- [ ] Aktivitatlog pro Board
- [ ] Volltextsuche uber Tickets
- [ ] Echtzeit-Synchronisation via WebSocket
- [ ] Swimlane-Ansicht
- [ ] Dashboard mit Ubersicht
- [ ] Toast-Benachrichtigungen
