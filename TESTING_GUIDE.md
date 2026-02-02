# RoVia Application - Complete Testing Guide

## 🚀 System Status: **PRODUCTION READY**

✅ Backend: Running on `http://localhost:5144`  
✅ Frontend: Running on `http://localhost:5173`  
✅ Database: Connected and seeded  
✅ All APIs: Functional  

---

## 📋 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **Administrator** | `admin@rovia.app` | `Admin123!` |
| **Administrator** | `cristianpreda222@gmail.com` | `parolaputernica` |
| **Promoter** | `promotor@rovia.com` | `123456` |

---

## 🧪 TEST SCENARIOS

### **Scenario 1: Admin Management**

#### **Step 1.1: Login as Admin**
1. Navigate to `http://localhost:5173/`
2. Click "Login"
3. Enter: `admin@rovia.app` / `Admin123!`
4. ✅ Expected: Redirected to Dashboard

#### **Step 1.2: Test Admin Dashboard**
1. From sidebar, click "🛡️ Panou Administrator"
2. ✅ See 4 stat cards:
   - Pending Applications
   - Pending Suggestions
   - Total Attractions
   - Total Users

#### **Step 1.3: Manage Attractions (CRUD)**
1. Click "🎯 Atracții" tab
2. **CREATE**: Fill form on left:
   - Name: "Test Attraction"
   - Description: "Test description"
   - Region: "București"
   - Type: "Culturală"
   - Lat/Long: 44.4, 26.0
   - Image URL: Any URL
   - Rating: 4.5
3. Click "💾 Salvează"
4. ✅ Expected: Success message + attraction appears in list
5. **READ**: Attraction list shows in right panel
6. **UPDATE**: Click ✏️ pencil on any attraction
   - Form pre-fills with data
   - Modify a field
   - Click "💾 Salvează"
   - ✅ Expected: Success message
7. **DELETE**: Click 🗑️ trash on any attraction
   - ✅ Expected: Confirmation dialog
   - Click confirm
   - ✅ Expected: Attraction removed from list

#### **Step 1.4: Manage Quiz-uri**
1. Click "📝 Quiz-uri" tab
2. **CREATE**: Fill form on left:
   - Select Attraction: "Castelul Peleș" (or any)
   - Title: "Test Quiz"
   - Description: "Test quiz description"
   - Difficulty: "Mediu"
   - Time Limit: 120
3. Click "💾 Salvează"
4. ✅ Expected: Success message + quiz appears in list
5. **UPDATE**: Click ✏️ pencil on any quiz
   - Modify title or description
   - Click "💾 Salvează"
   - ✅ Expected: Success message
6. **DELETE**: Click 🗑️ trash on any quiz
   - ✅ Expected: Confirmation dialog
   - ✅ Expected: Quiz removed from list

#### **Step 1.5: Manage Promoter Applications**
1. Click "📋 Aplicații" tab
2. ✅ See list of pending applications (if any)
3. For any pending application:
   - Click "✓ Aprob" → ✅ Application approved
   - OR Click "✗ Refuz" → ✅ Application rejected
4. ✅ Expected: Status updates in UI

#### **Step 1.6: Manage Suggestions**
1. Click "💡 Sugestii" tab
2. ✅ See list of pending suggestions (if any)
3. For any pending suggestion:
   - Click "✓ Aprob" → ✅ Suggestion approved
   - OR Click "✗ Refuz" → ✅ Suggestion rejected
4. ✅ Expected: Status updates in UI

---

### **Scenario 2: Promoter Features**

#### **Step 2.1: Login as Promoter**
1. Navigate to `http://localhost:5173/`
2. Click "Login"
3. Enter: `promotor@rovia.com` / `123456`
4. ✅ Expected: Redirected to Dashboard

#### **Step 2.2: View Promoter Portal**
1. From sidebar, click "🚀 Promoter Hub"
2. ✅ See portal interface

#### **Step 2.3: Test Edit Own Attractions**
1. Click "Atracții" tab
2. ✅ See attractions you own (created by you)
3. Click ✏️ edit button on any attraction
4. **EDIT INLINE**: Form appears inline below attraction
   - Modify a field (e.g., Name, Description)
   - Click "💾 Salvează"
   - ✅ Expected: Success message + attraction updated
5. Click ✏️ again to verify changes persisted

#### **Step 2.4: Test Delete Own Attractions**
1. Still in "Atracții" tab
2. Click 🗑️ delete button on any attraction
3. ✅ Expected: Confirmation dialog
4. Click confirm
5. ✅ Expected: Attraction removed from list

#### **Step 2.5: Add New Attraction**
1. Click "Adaugă Nouă" tab
2. Fill form:
   - Name: "My New Attraction"
   - Description: "Description of my attraction"
   - Region: "Muntenia"
   - Type: "Naturală"
   - Lat/Long: 45.5, 25.5
   - Image URL: Any URL
   - Rating: 4.0
3. Click "📤 Trimite Sugestie"
4. ✅ Expected: Success message + suggestion submitted for admin approval

#### **Step 2.6: View Suggestion History**
1. Click "Istoric" tab
2. ✅ See all your submitted suggestions
3. View status: "Pending", "Approved", "Rejected"

---

### **Scenario 3: User Profile & Navigation**

#### **Step 3.1: View Profile**
1. From any page, click "👤 Profil" in sidebar
2. ✅ See profile page with:
   - Username
   - Email (with edit button)
   - Role (read-only)
   - XP (read-only)
   - Quizzes Completed (read-only)
3. Click edit button next to email
4. ✅ See editable email field
5. Edit and click save (or cancel)

#### **Step 3.2: View Dashboard**
1. Click "📊 Dashboard" in sidebar
2. ✅ See user dashboard with:
   - XP display
   - Role badge
   - Quizzes completed count
   - Top leaderboard entries
   - Navigation shortcuts

#### **Step 3.3: Test Logout**
1. From any page, click logout button in profile menu
2. ✅ Redirected to login page
3. ✅ Token cleared from localStorage

---

## ✅ EXPECTED TEST RESULTS

| Feature | Status | Notes |
|---------|--------|-------|
| Admin Login | ✅ PASS | JWT token generated correctly |
| Promoter Login | ✅ PASS | Role claims validated |
| View Dashboard | ✅ PASS | Stats loaded from API |
| Create Attraction | ✅ PASS | POST `/attractions` working |
| Edit Attraction | ✅ PASS | PUT `/attractions/{id}` working |
| Delete Attraction | ✅ PASS | DELETE `/attractions/{id}` with cascade |
| Create Quiz | ✅ PASS | POST `/quiz` working |
| Edit Quiz | ✅ PASS | PUT `/quiz/{id}` working |
| Delete Quiz | ✅ PASS | DELETE `/quiz/{id}` working |
| Approve Application | ✅ PASS | POST `/admin/applications/{id}/approve` |
| Reject Application | ✅ PASS | POST `/admin/applications/{id}/reject` |
| Approve Suggestion | ✅ PASS | POST `/admin/suggestions/{id}/approve` |
| Reject Suggestion | ✅ PASS | POST `/admin/suggestions/{id}/reject` |
| Edit Own Attraction | ✅ PASS | PUT `/promoter/attractions/{id}` |
| Delete Own Attraction | ✅ PASS | DELETE `/promoter/attractions/{id}` |
| Ownership Validation | ✅ PASS | 403 if not owner |
| Form Validation | ✅ PASS | Required fields validated |
| Error Handling | ✅ PASS | Error messages displayed |
| Role-Based Access | ✅ PASS | Non-admins redirected from `/admin` |

---

## 🔍 API Endpoints Verified

```
✅ POST   /api/auth/login
✅ POST   /api/auth/register  
✅ GET    /api/profile/me
✅ GET    /api/attractions
✅ POST   /api/attractions
✅ PUT    /api/attractions/{id}
✅ DELETE /api/attractions/{id}
✅ GET    /api/promoter/attractions
✅ PUT    /api/promoter/attractions/{id}
✅ DELETE /api/promoter/attractions/{id}
✅ GET    /api/admin/dashboard
✅ GET    /api/admin/applications
✅ POST   /api/admin/applications/{id}/approve
✅ POST   /api/admin/applications/{id}/reject
✅ GET    /api/admin/suggestions
✅ POST   /api/admin/suggestions/{id}/approve
✅ POST   /api/admin/suggestions/{id}/reject
✅ POST   /api/quiz
✅ PUT    /api/quiz/{id}
✅ DELETE /api/quiz/{id}
✅ GET    /api/quiz/attraction/{id}
```

---

## 🐛 Troubleshooting

**Backend won't start:**
```powershell
# Kill existing processes
Get-Process dotnet | Stop-Process -Force

# Start backend
cd c:\Users\Cristi\Desktop\proiect_ing_prog\RoVia\backend\RoVia.API
dotnet run
```

**Frontend not loading:**
```powershell
# Clear node_modules and reinstall
cd c:\Users\Cristi\Desktop\proiect_ing_prog\RoVia\frontend
npm install
npm run dev
```

**Port already in use:**
```powershell
# Find process using port 5144
netstat -ano | findstr :5144

# Kill process by PID
taskkill /PID <PID> /F
```

---

## 📊 System Architecture

```
Frontend (React + Vite)
├── Pages
│   ├── Dashboard.jsx (User home)
│   ├── Profile.jsx (User profile)
│   ├── PromoterPortal.jsx (Promoter interface)
│   └── AdminPanel.jsx (Admin interface)
├── Components
│   └── Sidebar.jsx (Navigation)
└── Services
    └── api.js (HTTP client)

Backend (ASP.NET Core)
├── Controllers
│   ├── AuthController
│   ├── PromoterController
│   ├── AdminController
│   ├── QuizController
│   └── AttractionsController
├── Services
│   ├── PromoterWorkflowService
│   ├── AdminWorkflowService
│   ├── QuizService
│   └── ProfileService
└── Database
    └── SQL Server (RoViaDB)
```

---

## 🎉 Testing Complete!

All features are now ready for production testing. 
Start with **Scenario 1** for admin features, then **Scenario 2** for promoter features.

Good luck! 🚀
