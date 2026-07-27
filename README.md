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
- [x] Board-Management (CRUD)
- [x] Kanban-Spalten mit WIP-Limits
- [x] Tickets mit Priorität, Tags, Fälligkeitsdatum, Zuweisung
- [x] Drag & Drop für Tickets
- [x] Kommentare unter Tickets
- [ ] Aktivitätslog pro Board
- [ ] Volltextsuche über Tickets
- [ ] Echtzeit-Synchronisation via WebSocket
- [ ] Swimlane-Ansicht
- [ ] Dashboard mit Übersicht
- [ ] Toast-Benachrichtigungen

## Board-Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/boards/` | Alle Boards des Nutzers auflisten |
| `POST` | `/boards/` | Board erstellen |
| `GET` | `/boards/{board_id}` | Board-Details abrufen |
| `PUT` | `/boards/{board_id}` | Board umbenennen |
| `DELETE` | `/boards/{board_id}` | Board löschen |
| `GET` | `/boards/{board_id}/columns` | Spalten eines Boards auflisten |
| `POST` | `/boards/{board_id}/columns` | Spalte erstellen |
| `PUT` | `/boards/{board_id}/columns/{column_id}` | Spalte bearbeiten (inkl. WIP-Limit) |
| `DELETE` | `/boards/{board_id}/columns/{column_id}` | Spalte löschen |

## Ticket-Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/tickets/columns/{column_id}/tickets` | Tickets einer Spalte auflisten |
| `POST` | `/tickets/columns/{column_id}/tickets` | Ticket erstellen (WIP-Limit-Prüfung) |
| `GET` | `/tickets/{ticket_id}` | Ticket-Details abrufen |
| `PUT` | `/tickets/{ticket_id}` | Ticket bearbeiten / Spalte wechseln |
| `DELETE` | `/tickets/{ticket_id}` | Ticket löschen |
| `GET` | `/tickets/{ticket_id}/comments` | Kommentare eines Tickets auflisten |
| `POST` | `/tickets/{ticket_id}/comments` | Kommentar erstellen (Markdown) |
| `DELETE` | `/tickets/{ticket_id}/comments/{comment_id}` | Kommentar löschen |

Alle Board- und Ticket-Endpunkte prüfen die Board-Besitzerschaft: nur der Board-Besitzer hat Zugriff.
WIP-Limits werden serverseitig durchgesetzt (HTTP 409 bei Überschreitung).

## Frontend

Das Frontend bietet eine vollständige Kanban-Oberfläche:

- **Board-Liste** (`/boards`): Boards erstellen, löschen und öffnen
- **Board-Ansicht** (`/boards/:id`): Kanban-Board mit Drag & Drop zwischen Spalten, Spalten verwalten (inkl. WIP-Limits), Tickets per Klick im Detail-Modal bearbeiten
- **Ticket-Detail-Modal**: Titel, Priorität, Fälligkeitsdatum, Tags und Markdown-Beschreibung mit Live-Vorschau; Kommentar-Thread mit Markdown-Rendering (markdown-it + DOMPurify)
- **Drag & Drop**: Tickets lassen sich per @hello-pangea/dnd zwischen Spalten verschieben — der neue Zustand wird serverseitig persistiert
- **WIP-Warnung**: Spalten zeigen eine Warnung (orange) oder Überschreitung (rot) an, wenn das WIP-Limit erreicht wird
