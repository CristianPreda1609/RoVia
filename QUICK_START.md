# 🚀 RoVia - Quick Start Guide

## ⚡ Startup Commands

### Terminal 1: Backend
```powershell
cd c:\Users\Cristi\Desktop\proiect_ing_prog\RoVia\backend\RoVia.API
dotnet run
```
✅ Should see: `Now listening on: http://localhost:5144`

### Terminal 2: Frontend
```powershell
cd c:\Users\Cristi\Desktop\proiect_ing_prog\RoVia\frontend
npm run dev
```
✅ Should see: `Local: http://localhost:5173/`

### Access Application
- Open: http://localhost:5173/

---

## 👤 Quick Login

**Admin:**
- Email: `admin@rovia.app`
- Password: `Admin123!`

**Promoter:**
- Email: `promotor@rovia.com`  
- Password: `123456`

---

## 🎯 5-Minute Test

### As Admin:
1. Login → Admin Panel
2. "🎯 Atracții" tab → Add new attraction → Click "💾 Salvează"
3. "📝 Quiz-uri" tab → Add new quiz → Click "💾 Salvează"
4. "📋 Aplicații" tab → See pending apps (if any)

### As Promoter:
1. Login → Promoter Hub
2. "Atracții" tab → Click ✏️ to edit any attraction
3. Modify name/description → "💾 Salvează"
4. Click 🗑️ to delete an attraction

---

## 📊 Key Pages

| URL | Purpose | Role |
|-----|---------|------|
| `/` | Map view | All |
| `/dashboard` | User home | Authenticated |
| `/profile` | User profile | Authenticated |
| `/promoter` | Promoter hub | Promoter+ |
| `/admin` | Admin panel | Admin |
| `/login` | Login page | Guest |
| `/register` | Register | Guest |

---

## 🔧 Troubleshoot

**Port 5144 already in use:**
```powershell
Get-Process dotnet | Stop-Process -Force
```

**Frontend not hot-reloading:**
```powershell
npm install
npm run dev
```

**Database not connecting:**
Check `appsettings.json` connection string points to correct SQL Server

---

## ✅ Verification Checklist

- [ ] Backend running on 5144
- [ ] Frontend running on 5173
- [ ] Admin login works
- [ ] Promoter login works
- [ ] Can create attraction in Admin panel
- [ ] Can edit attraction as Promoter
- [ ] Can delete attraction as Promoter
- [ ] Can create quiz in Admin panel
- [ ] Can manage applications/suggestions

---

## 📞 Need Help?

See: `TESTING_GUIDE.md` for detailed test scenarios
See: `FINAL_REPORT.md` for technical architecture
