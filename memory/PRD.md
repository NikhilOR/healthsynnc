# HealthSync - Health & Wellness Tracking Mobile App

## Project Overview
HealthSync is a comprehensive mobile application built with Expo (React Native) and FastAPI that helps users track their complete wellness journey including nutrition, hydration, body weight, expenses, and smoking habits with AI-powered insights.

## Tech Stack
- **Frontend**: Expo (React Native) with TypeScript
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT with bcrypt
- **AI Integration**: Google Gemini 3 Flash (via Emergent LLM Key)

## Implemented Features

### 1. Authentication System ✅
- User registration with email/password
- JWT-based login
- Profile management
- Secure password hashing (bcrypt)

### 2. Dashboard ✅
- Comprehensive health overview with:
  - Calories consumed/remaining
  - Water intake progress
  - Current weight & goal
  - Daily expenses
  - Cigarettes smoked today
  - Health Score (calculated)
  - Quick action buttons

### 3. Food & Calorie Tracking ✅
- Search food database (20 pre-seeded items)
- Add custom food items
- Log meals by category (Breakfast/Lunch/Dinner/Snack)
- Track macronutrients (protein, carbs, fat, fiber, sugar, sodium)
- AI-powered food image analysis (Gemini Vision)

### 4. Water Tracking ✅
- Quick add buttons (250/500/750/1000ml)
- Daily progress with percentage
- Customizable daily goal
- Progress visualization

### 5. Weight Tracking ✅
- Log daily weight
- Automatic BMI calculation
- Body fat % tracking
- Weight trend analysis
- Goal progress percentage

### 6. Expense Tracking ✅
- Categorized expenses (food, groceries, fruits, vegetables, supplements, restaurant, drinks, other)
- Daily/Weekly/Monthly summaries
- Category breakdown

### 7. Smoking Tracking ✅
- Log every cigarette
- Brand tracking
- Cost tracking per cigarette
- Statistics (today/week/month)
- Quit progress (smoke-free hours, cigarettes avoided, money saved)

### 8. AI Health Coach ✅
- Personalized health chat (Google Gemini)
- Weekly health report generation
- Context-aware recommendations
- Habit analysis

### 9. Gamification ✅
- Achievement system
- Streak tracking
- Multiple badge types

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Dashboard
- `GET /api/dashboard/summary` - Daily summary

### Food
- `GET /api/food/items` - Search food items
- `POST /api/food/items` - Create custom food
- `POST /api/food/logs` - Log meal
- `GET /api/food/logs` - Get food logs
- `DELETE /api/food/logs/{id}` - Delete log
- `POST /api/food/analyze-image` - AI image analysis

### Water
- `POST /api/water/logs` - Log water
- `GET /api/water/logs` - Get water logs
- `GET /api/water/daily-progress` - Get progress

### Weight
- `POST /api/weight/logs` - Log weight
- `GET /api/weight/logs` - Get weight logs
- `GET /api/weight/progress` - Get progress

### Expenses
- `POST /api/expenses/logs` - Log expense
- `GET /api/expenses/logs` - Get expense logs
- `GET /api/expenses/summary` - Get summary

### Smoking
- `POST /api/smoking/logs` - Log cigarette
- `GET /api/smoking/logs` - Get logs
- `GET /api/smoking/statistics` - Get statistics
- `GET /api/smoking/quit-progress` - Get quit progress

### AI
- `POST /api/ai/chat` - Chat with AI coach
- `GET /api/ai/weekly-report` - Get weekly report

### Gamification
- `GET /api/gamification/achievements` - Get achievements
- `GET /api/gamification/streaks` - Get streaks

## Testing Results
- ✅ Backend: 26/26 tests passed (100% success rate)
- ✅ All authentication flows working
- ✅ All CRUD operations verified
- ✅ AI integrations functional (Gemini)
- ✅ Frontend loading successfully

## Project Structure
```
/app/
├── backend/
│   ├── server.py        # Main FastAPI server with all routes
│   ├── models.py        # Pydantic models
│   ├── requirements.txt
│   └── .env            # Environment variables
└── frontend/
    ├── app/
    │   ├── index.tsx           # Entry point
    │   ├── login.tsx           # Login screen
    │   ├── register.tsx        # Register screen
    │   ├── dashboard.tsx       # Dashboard
    │   ├── water.tsx          # Water tracking
    │   ├── food/add.tsx       # Add food
    │   └── weight/add.tsx     # Add weight
    └── src/
        ├── api/             # API clients
        └── store/           # Zustand store
```

## Future Enhancements (Pending)
- Expense and Smoking screens
- AI Coach chat screen
- Analytics with charts
- Profile management screen
- Reports & exports (PDF/Excel/CSV)
- Achievements display
- Theme switching (dark/light)
- Push notifications for reminders
- Barcode scanning UI
- Tab-based navigation
