# Desplegar African Push en Render (público)

No puedo crear tu cuenta ni subir el sitio por ti (hace falta tu login), pero el proyecto **ya está preparado** para un solo servicio en Render: API + web juntos.

## 1) Cuentas (gratis)

1. Crea cuenta en [GitHub](https://github.com/signup)
2. Crea cuenta en [Render](https://render.com/register) (puedes entrar con GitHub)

## 2) Instala Git (Windows)

1. Descarga: https://git-scm.com/download/win  
2. Instala con opciones por defecto  
3. **Cierra y abre de nuevo** Cursor / la terminal

Comprueba:

```powershell
git --version
```

## 3) Sube el código a GitHub

En una terminal **dentro de** `C:\Users\Zyx\Desktop\Albion`:

```powershell
git init
git add .
git commit -m "African Push guild dashboard ready for Render"
```

Luego en GitHub: **New repository** → nombre `african-push` → Create (vacío, sin README).

```powershell
git branch -M main
git remote add origin https://github.com/TU_USUARIO/african-push.git
git push -u origin main
```

(Sustituye `TU_USUARIO` por tu usuario de GitHub.)

## 4) Despliega en Render

1. Entra a https://dashboard.render.com  
2. **New +** → **Blueprint**  
   - o **Web Service** si no ves Blueprint  
3. Conecta el repo `african-push`  
4. Si usas Blueprint, Render lee `render.yaml` solo  
5. Si usas Web Service manual:

| Campo | Valor |
|--------|--------|
| Runtime | Node |
| Build Command | `npm run install:all && npm run build` |
| Start Command | `npm start` |
| Instance | Free |

6. **Create Web Service** y espera 3–8 minutos  

La URL será tipo:

`https://african-push-dashboard.onrender.com`

## 5) Nota del plan Free

En el plan gratis de Render el servicio **se duerme** tras ~15 min sin visitas. La primera carga después puede tardar 30–60 s.

## Local (como hasta ahora)

```powershell
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```
