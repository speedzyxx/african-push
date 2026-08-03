# African Push — Guild Dashboard

Aplicación full-stack del gremio **African Push** en **Albion Online** (América West).

- **Backend:** Node.js + Express + caché en memoria (5 min)
- **Frontend:** React + Vite + Tailwind CSS v4
- **Guild ID:** `ePXF6hJYSkajVrQofuxNYg`

## Estructura

```
Albion/
├── backend/
│   ├── server.js
│   └── package.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── components/
        │   ├── StatCard.jsx
        │   ├── MembersTable.jsx
        │   ├── Killboard.jsx
        │   ├── Equipment.jsx
        │   └── Battles.jsx
        └── utils/
            └── api.js
```

## Arranque (dos terminales)

### 1) Backend (puerto 3001)

```bash
cd backend
npm run dev
```

### 2) Frontend (puerto 5173)

```bash
cd frontend
npm run dev
```

Abre: http://localhost:5173

Vite hace proxy de `/api/*` hacia `http://localhost:3001`.

## Endpoints del proxy

| Ruta | Orígen Albion |
|------|----------------|
| `GET /api/guild-stats` | `/guilds/{id}` |
| `GET /api/guild-members` | `/guilds/{id}/members` |
| `GET /api/guild-kills` | `/events?guildId={id}&limit=25` |
| `GET /api/guild-battles` | `/battles?guildId={id}&limit=10` (incluye top guilds/players y roster del gremio) |

API base: `https://gameinfo.albiononline.com/api/gameinfo`  
Región: todas las peticiones llevan `?server=live_us` (América West).

## Comandos usados para crear el proyecto

```bash
mkdir backend frontend
cd backend
npm init -y
npm install express cors node-cache
npm install -D nodemon

cd ../frontend
npm create vite@latest . -- --template react
npm install
npm install -D tailwindcss @tailwindcss/vite
npm install lucide-react
```
