from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from typing import Optional, List
import uuid
from bson import ObjectId

# Import models
from models import *

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ['JWT_ALGORITHM']
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="HealthSync API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"email": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def calculate_bmi(weight_kg: float, height_cm: float = 170) -> float:
    """Calculate BMI (default height 170cm if not provided)"""
    height_m = height_cm / 100
    return round(weight_kg / (height_m ** 2), 2)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        password=hash_password(user_data.password),
        name=user_data.name
    )
    
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "name": user.name
        }
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user["email"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user["email"],
            "name": user["name"],
            "goals": user.get("goals", {}),
            "settings": user.get("settings", {})
        }
    }

@api_router.get("/auth/profile")
async def get_profile(current_user = Depends(get_current_user)):
    """Get current user profile"""
    return {
        "email": current_user["email"],
        "name": current_user["name"],
        "profile_pic": current_user.get("profile_pic"),
        "goals": current_user.get("goals", {}),
        "settings": current_user.get("settings", {})
    }

@api_router.put("/auth/profile")
async def update_profile(update_data: UserUpdate, current_user = Depends(get_current_user)):
    """Update user profile"""
    update_dict = update_data.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.users.update_one(
        {"email": current_user["email"]},
        {"$set": update_dict}
    )
    
    updated_user = await db.users.find_one({"email": current_user["email"]})
    return {
        "email": updated_user["email"],
        "name": updated_user["name"],
        "profile_pic": updated_user.get("profile_pic"),
        "goals": updated_user.get("goals", {}),
        "settings": updated_user.get("settings", {})
    }

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/summary")
async def get_dashboard_summary(current_user = Depends(get_current_user)):
    """Get dashboard summary for today"""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    user_email = current_user["email"]
    
    # Get today's food logs
    food_logs = await db.food_logs.find({
        "user_id": user_email,
        "date": today
    }).to_list(1000)
    
    total_calories = sum(log["total_calories"] for log in food_logs)
    total_protein = sum(log.get("protein", 0) for log in food_logs)
    total_carbs = sum(log.get("carbs", 0) for log in food_logs)
    total_fat = sum(log.get("fat", 0) for log in food_logs)
    
    # Get today's water logs
    water_logs = await db.water_logs.find({
        "user_id": user_email,
        "date": today
    }).to_list(1000)
    total_water = sum(log["amount_ml"] for log in water_logs)
    
    # Get latest weight
    latest_weight = await db.weight_logs.find_one(
        {"user_id": user_email},
        sort=[("created_at", -1)]
    )
    
    # Get today's expenses
    expenses = await db.expense_logs.find({
        "user_id": user_email,
        "date": today
    }).to_list(1000)
    total_expenses = sum(exp["amount"] for exp in expenses)
    
    # Get today's cigarettes
    cigarettes = await db.cigarette_logs.find({
        "user_id": user_email,
        "date": today
    }).to_list(1000)
    cigarettes_today = len(cigarettes)
    cigarette_cost_today = sum(log.get("cost_per_cigarette", 0) for log in cigarettes)
    
    # Calculate health score (simple algorithm)
    goals = current_user.get("goals", {})
    calorie_goal = goals.get("daily_calories", 2000)
    water_goal = goals.get("daily_water_ml", 2000)
    
    calorie_score = min(100, (calorie_goal - abs(total_calories - calorie_goal)) / calorie_goal * 100)
    water_score = min(100, (total_water / water_goal) * 100)
    smoking_score = max(0, 100 - (cigarettes_today * 10))
    
    health_score = round((calorie_score + water_score + smoking_score) / 3)
    
    return {
        "calories": {
            "consumed": round(total_calories, 1),
            "goal": calorie_goal,
            "remaining": max(0, calorie_goal - total_calories),
            "protein": round(total_protein, 1),
            "carbs": round(total_carbs, 1),
            "fat": round(total_fat, 1)
        },
        "water": {
            "consumed": total_water,
            "goal": water_goal,
            "percentage": round((total_water / water_goal) * 100, 1) if water_goal > 0 else 0
        },
        "weight": {
            "current": round(latest_weight["weight_kg"], 1) if latest_weight else 0,
            "goal": goals.get("goal_weight", 70),
            "bmi": latest_weight.get("bmi", 0) if latest_weight else 0
        },
        "expenses": {
            "today": round(total_expenses, 2)
        },
        "smoking": {
            "cigarettes_today": cigarettes_today,
            "cost_today": round(cigarette_cost_today, 2)
        },
        "health_score": health_score,
        "date": today
    }

# ==================== FOOD ROUTES ====================

@api_router.get("/food/items")
async def search_food_items(q: str = "", current_user = Depends(get_current_user)):
    """Search food items"""
    query = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    
    items = await db.food_items.find(query).to_list(100)
    
    # Convert ObjectId to string
    for item in items:
        item["_id"] = str(item["_id"])
    
    return items

@api_router.post("/food/items")
async def create_food_item(item_data: FoodItemCreate, current_user = Depends(get_current_user)):
    """Create custom food item"""
    food_item = FoodItem(
        **item_data.dict(),
        is_custom=True,
        created_by=current_user["email"]
    )
    
    result = await db.food_items.insert_one(food_item.dict())
    
    return {"id": str(result.inserted_id), **food_item.dict()}

@api_router.post("/food/logs")
async def create_food_log(log_data: FoodLogCreate, current_user = Depends(get_current_user)):
    """Log a meal"""
    # Get food item
    food_item = await db.food_items.find_one({"_id": ObjectId(log_data.food_item_id)})
    if not food_item:
        raise HTTPException(status_code=404, detail="Food item not found")
    
    now = datetime.utcnow()
    food_log = FoodLog(
        user_id=current_user["email"],
        food_item_id=log_data.food_item_id,
        food_name=food_item["name"],
        meal_type=log_data.meal_type,
        quantity=log_data.quantity,
        total_calories=food_item["calories"] * log_data.quantity,
        protein=food_item.get("protein", 0) * log_data.quantity,
        carbs=food_item.get("carbs", 0) * log_data.quantity,
        fat=food_item.get("fat", 0) * log_data.quantity,
        fiber=food_item.get("fiber", 0) * log_data.quantity,
        sugar=food_item.get("sugar", 0) * log_data.quantity,
        sodium=food_item.get("sodium", 0) * log_data.quantity,
        date=now.strftime("%Y-%m-%d"),
        time=now.strftime("%H:%M"),
        notes=log_data.notes,
        image=log_data.image
    )
    
    result = await db.food_logs.insert_one(food_log.dict())
    
    return {"id": str(result.inserted_id), **food_log.dict()}

@api_router.get("/food/logs")
async def get_food_logs(date: Optional[str] = None, current_user = Depends(get_current_user)):
    """Get food logs"""
    query = {"user_id": current_user["email"]}
    if date:
        query["date"] = date
    else:
        query["date"] = datetime.utcnow().strftime("%Y-%m-%d")
    
    logs = await db.food_logs.find(query).sort("created_at", -1).to_list(1000)
    
    for log in logs:
        log["_id"] = str(log["_id"])
    
    return logs

@api_router.delete("/food/logs/{log_id}")
async def delete_food_log(log_id: str, current_user = Depends(get_current_user)):
    """Delete a food log"""
    result = await db.food_logs.delete_one({
        "_id": ObjectId(log_id),
        "user_id": current_user["email"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Log not found")
    
    return {"message": "Log deleted successfully"}

@api_router.post("/food/analyze-image")
async def analyze_food_image(request: ImageAnalysisRequest, current_user = Depends(get_current_user)):
    """Analyze food image using Gemini Vision"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=os.environ["EMERGENT_LLM_KEY"],
            session_id=f"food-analysis-{current_user['email']}",
            system_message="You are a nutrition expert. Analyze food images and provide detailed nutritional information."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        user_message = UserMessage(
            text="Analyze this food image and provide: 1) Food name, 2) Estimated calories, 3) Protein (g), 4) Carbs (g), 5) Fat (g). Format as JSON.",
            image_data=request.image
        )
        
        response = await chat.send_message(user_message)
        
        return {"analysis": response}
    except Exception as e:
        logger.error(f"Image analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")

# ==================== WEIGHT ROUTES ====================

@api_router.post("/weight/logs")
async def create_weight_log(log_data: WeightLogCreate, current_user = Depends(get_current_user)):
    """Log weight"""
    now = datetime.utcnow()
    
    weight_log = WeightLog(
        user_id=current_user["email"],
        weight_kg=log_data.weight_kg,
        bmi=calculate_bmi(log_data.weight_kg),
        body_fat_percent=log_data.body_fat_percent,
        date=now.strftime("%Y-%m-%d"),
        time=now.strftime("%H:%M"),
        notes=log_data.notes
    )
    
    result = await db.weight_logs.insert_one(weight_log.dict())
    
    return {"id": str(result.inserted_id), **weight_log.dict()}

@api_router.get("/weight/logs")
async def get_weight_logs(limit: int = 30, current_user = Depends(get_current_user)):
    """Get weight logs"""
    logs = await db.weight_logs.find({
        "user_id": current_user["email"]
    }).sort("created_at", -1).limit(limit).to_list(limit)
    
    for log in logs:
        log["_id"] = str(log["_id"])
    
    return logs

@api_router.get("/weight/progress")
async def get_weight_progress(current_user = Depends(get_current_user)):
    """Get weight progress"""
    logs = await db.weight_logs.find({
        "user_id": current_user["email"]
    }).sort("created_at", 1).to_list(1000)
    
    if not logs:
        return {"progress": [], "trend": "stable"}
    
    progress = []
    for log in logs:
        progress.append({
            "date": log["date"],
            "weight": log["weight_kg"],
            "bmi": log.get("bmi")
        })
    
    # Calculate trend
    if len(logs) >= 2:
        first_weight = logs[0]["weight_kg"]
        last_weight = logs[-1]["weight_kg"]
        diff = last_weight - first_weight
        
        if diff < -0.5:
            trend = "decreasing"
        elif diff > 0.5:
            trend = "increasing"
        else:
            trend = "stable"
    else:
        trend = "stable"
    
    goal_weight = current_user.get("goals", {}).get("goal_weight", 70)
    current_weight = logs[-1]["weight_kg"] if logs else 0
    progress_percentage = 0
    
    if logs:
        initial_weight = logs[0]["weight_kg"]
        weight_to_lose = initial_weight - goal_weight
        if weight_to_lose != 0:
            weight_lost = initial_weight - current_weight
            progress_percentage = min(100, max(0, (weight_lost / weight_to_lose) * 100))
    
    return {
        "progress": progress,
        "trend": trend,
        "goal_weight": goal_weight,
        "current_weight": current_weight,
        "progress_percentage": round(progress_percentage, 1)
    }

# ==================== WATER ROUTES ====================

@api_router.post("/water/logs")
async def create_water_log(log_data: WaterLogCreate, current_user = Depends(get_current_user)):
    """Log water intake"""
    now = datetime.utcnow()
    
    water_log = WaterLog(
        user_id=current_user["email"],
        amount_ml=log_data.amount_ml,
        date=now.strftime("%Y-%m-%d"),
        time=now.strftime("%H:%M")
    )
    
    result = await db.water_logs.insert_one(water_log.dict())
    
    return {"id": str(result.inserted_id), **water_log.dict()}

@api_router.get("/water/logs")
async def get_water_logs(date: Optional[str] = None, current_user = Depends(get_current_user)):
    """Get water logs"""
    query = {"user_id": current_user["email"]}
    if date:
        query["date"] = date
    else:
        query["date"] = datetime.utcnow().strftime("%Y-%m-%d")
    
    logs = await db.water_logs.find(query).sort("created_at", -1).to_list(1000)
    
    for log in logs:
        log["_id"] = str(log["_id"])
    
    total = sum(log["amount_ml"] for log in logs)
    
    return {"logs": logs, "total": total}

@api_router.get("/water/daily-progress")
async def get_water_daily_progress(current_user = Depends(get_current_user)):
    """Get today's water progress"""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    logs = await db.water_logs.find({
        "user_id": current_user["email"],
        "date": today
    }).to_list(1000)
    
    total = sum(log["amount_ml"] for log in logs)
    goal = current_user.get("goals", {}).get("daily_water_ml", 2000)
    percentage = min(100, (total / goal) * 100) if goal > 0 else 0
    
    return {
        "total": total,
        "goal": goal,
        "percentage": round(percentage, 1),
        "remaining": max(0, goal - total)
    }

# ==================== EXPENSE ROUTES ====================

@api_router.post("/expenses/logs")
async def create_expense_log(log_data: ExpenseLogCreate, current_user = Depends(get_current_user)):
    """Log expense"""
    now = datetime.utcnow()
    
    expense_log = ExpenseLog(
        user_id=current_user["email"],
        item_name=log_data.item_name,
        amount=log_data.amount,
        category=log_data.category,
        date=now.strftime("%Y-%m-%d"),
        notes=log_data.notes
    )
    
    result = await db.expense_logs.insert_one(expense_log.dict())
    
    return {"id": str(result.inserted_id), **expense_log.dict()}

@api_router.get("/expenses/logs")
async def get_expense_logs(
    date: Optional[str] = None,
    period: str = "daily",
    current_user = Depends(get_current_user)
):
    """Get expense logs"""
    query = {"user_id": current_user["email"]}
    
    if date:
        query["date"] = date
    elif period == "daily":
        query["date"] = datetime.utcnow().strftime("%Y-%m-%d")
    
    logs = await db.expense_logs.find(query).sort("created_at", -1).to_list(1000)
    
    for log in logs:
        log["_id"] = str(log["_id"])
    
    return logs

@api_router.get("/expenses/summary")
async def get_expense_summary(period: str = "monthly", current_user = Depends(get_current_user)):
    """Get expense summary"""
    now = datetime.utcnow()
    
    if period == "daily":
        date_filter = now.strftime("%Y-%m-%d")
        query = {"user_id": current_user["email"], "date": date_filter}
    elif period == "weekly":
        week_ago = now - timedelta(days=7)
        date_filter = week_ago.strftime("%Y-%m-%d")
        query = {"user_id": current_user["email"], "date": {"$gte": date_filter}}
    else:  # monthly
        month_ago = now - timedelta(days=30)
        date_filter = month_ago.strftime("%Y-%m-%d")
        query = {"user_id": current_user["email"], "date": {"$gte": date_filter}}
    
    logs = await db.expense_logs.find(query).to_list(1000)
    
    total = sum(log["amount"] for log in logs)
    
    # Category breakdown
    categories = {}
    for log in logs:
        cat = log["category"]
        if cat not in categories:
            categories[cat] = 0
        categories[cat] += log["amount"]
    
    return {
        "period": period,
        "total": round(total, 2),
        "categories": categories,
        "count": len(logs)
    }

# ==================== SMOKING ROUTES ====================

@api_router.post("/smoking/logs")
async def create_cigarette_log(log_data: CigaretteLogCreate, current_user = Depends(get_current_user)):
    """Log cigarette"""
    now = datetime.utcnow()
    
    cigarette_log = CigaretteLog(
        user_id=current_user["email"],
        brand=log_data.brand,
        cost_per_cigarette=log_data.cost_per_cigarette,
        date=now.strftime("%Y-%m-%d"),
        time=now.strftime("%H:%M"),
        notes=log_data.notes
    )
    
    result = await db.cigarette_logs.insert_one(cigarette_log.dict())
    
    return {"id": str(result.inserted_id), **cigarette_log.dict()}

@api_router.get("/smoking/logs")
async def get_cigarette_logs(date: Optional[str] = None, current_user = Depends(get_current_user)):
    """Get cigarette logs"""
    query = {"user_id": current_user["email"]}
    if date:
        query["date"] = date
    
    logs = await db.cigarette_logs.find(query).sort("created_at", -1).to_list(1000)
    
    for log in logs:
        log["_id"] = str(log["_id"])
    
    return logs

@api_router.get("/smoking/statistics")
async def get_smoking_statistics(current_user = Depends(get_current_user)):
    """Get smoking statistics"""
    now = datetime.utcnow()
    today = now.strftime("%Y-%m-%d")
    week_ago = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    month_ago = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    
    # Today
    today_logs = await db.cigarette_logs.find({
        "user_id": current_user["email"],
        "date": today
    }).to_list(1000)
    
    # This week
    week_logs = await db.cigarette_logs.find({
        "user_id": current_user["email"],
        "date": {"$gte": week_ago}
    }).to_list(1000)
    
    # This month
    month_logs = await db.cigarette_logs.find({
        "user_id": current_user["email"],
        "date": {"$gte": month_ago}
    }).to_list(1000)
    
    today_count = len(today_logs)
    week_count = len(week_logs)
    month_count = len(month_logs)
    
    today_cost = sum(log.get("cost_per_cigarette", 0) for log in today_logs)
    week_cost = sum(log.get("cost_per_cigarette", 0) for log in week_logs)
    month_cost = sum(log.get("cost_per_cigarette", 0) for log in month_logs)
    
    # Average per day
    avg_per_day = month_count / 30 if month_count > 0 else 0
    
    return {
        "today": {
            "count": today_count,
            "cost": round(today_cost, 2)
        },
        "week": {
            "count": week_count,
            "cost": round(week_cost, 2)
        },
        "month": {
            "count": month_count,
            "cost": round(month_cost, 2)
        },
        "average_per_day": round(avg_per_day, 1)
    }

@api_router.get("/smoking/quit-progress")
async def get_quit_progress(current_user = Depends(get_current_user)):
    """Get quit smoking progress"""
    # Get all logs sorted by date
    logs = await db.cigarette_logs.find({
        "user_id": current_user["email"]
    }).sort("created_at", -1).to_list(1000)
    
    if not logs:
        return {
            "smoke_free_hours": 0,
            "cigarettes_avoided": 0,
            "money_saved": 0,
            "last_cigarette": None
        }
    
    last_cigarette = logs[0]
    last_time = datetime.fromisoformat(f"{last_cigarette['date']}T{last_cigarette['time']}")
    now = datetime.utcnow()
    
    hours_since = (now - last_time).total_seconds() / 3600
    
    # Assuming average of 10 cigarettes per day and ₹10 per cigarette
    avg_per_hour = 10 / 24
    avoided = hours_since * avg_per_hour
    money_saved = avoided * 10
    
    return {
        "smoke_free_hours": round(hours_since, 1),
        "cigarettes_avoided": round(avoided, 1),
        "money_saved": round(money_saved, 2),
        "last_cigarette": {
            "date": last_cigarette["date"],
            "time": last_cigarette["time"]
        }
    }

# ==================== AI COACH ROUTES ====================

@api_router.post("/ai/chat")
async def ai_chat(request: AIRequest, current_user = Depends(get_current_user)):
    """Chat with AI health coach"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Get user's health data
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        food_logs = await db.food_logs.find({
            "user_id": current_user["email"],
            "date": today
        }).to_list(1000)
        
        water_logs = await db.water_logs.find({
            "user_id": current_user["email"],
            "date": today
        }).to_list(1000)
        
        cigarette_logs = await db.cigarette_logs.find({
            "user_id": current_user["email"],
            "date": today
        }).to_list(1000)
        
        context = f"""
        User: {current_user['name']}
        Today's calories: {sum(log['total_calories'] for log in food_logs)}
        Calorie goal: {current_user.get('goals', {}).get('daily_calories', 2000)}
        Water intake: {sum(log['amount_ml'] for log in water_logs)}ml
        Water goal: {current_user.get('goals', {}).get('daily_water_ml', 2000)}ml
        Cigarettes today: {len(cigarette_logs)}
        """
        
        chat = LlmChat(
            api_key=os.environ["EMERGENT_LLM_KEY"],
            session_id=f"health-coach-{current_user['email']}",
            system_message=f"You are a health and wellness coach. Provide personalized advice. {context}"
        ).with_model("gemini", "gemini-3-flash-preview")
        
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        return {"response": response}
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")

@api_router.get("/ai/weekly-report")
async def get_weekly_report(current_user = Depends(get_current_user)):
    """Generate AI weekly health report"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        week_ago = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
        
        # Get week's data
        food_logs = await db.food_logs.find({
            "user_id": current_user["email"],
            "date": {"$gte": week_ago}
        }).to_list(1000)
        
        water_logs = await db.water_logs.find({
            "user_id": current_user["email"],
            "date": {"$gte": week_ago}
        }).to_list(1000)
        
        weight_logs = await db.weight_logs.find({
            "user_id": current_user["email"],
            "date": {"$gte": week_ago}
        }).to_list(1000)
        
        cigarette_logs = await db.cigarette_logs.find({
            "user_id": current_user["email"],
            "date": {"$gte": week_ago}
        }).to_list(1000)
        
        weekly_calories = sum(log["total_calories"] for log in food_logs)
        weekly_water = sum(log["amount_ml"] for log in water_logs)
        weekly_cigarettes = len(cigarette_logs)
        
        weight_change = 0
        if len(weight_logs) >= 2:
            weight_change = weight_logs[-1]["weight_kg"] - weight_logs[0]["weight_kg"]
        
        prompt = f"""
        Generate a weekly health report for {current_user['name']}:
        
        Week Summary:
        - Total calories: {weekly_calories}
        - Daily average: {weekly_calories / 7:.0f}
        - Total water: {weekly_water}ml
        - Daily average: {weekly_water / 7:.0f}ml
        - Cigarettes smoked: {weekly_cigarettes}
        - Weight change: {weight_change:+.1f}kg
        
        Provide:
        1. Overall assessment
        2. Strengths
        3. Areas for improvement
        4. Specific recommendations
        """
        
        chat = LlmChat(
            api_key=os.environ["EMERGENT_LLM_KEY"],
            session_id=f"weekly-report-{current_user['email']}",
            system_message="You are a health analyst. Provide detailed, actionable weekly health reports."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {
            "report": response,
            "data": {
                "weekly_calories": round(weekly_calories),
                "weekly_water": weekly_water,
                "weekly_cigarettes": weekly_cigarettes,
                "weight_change": round(weight_change, 1)
            }
        }
    except Exception as e:
        logger.error(f"Weekly report error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

# ==================== GAMIFICATION ROUTES ====================

@api_router.get("/gamification/achievements")
async def get_achievements(current_user = Depends(get_current_user)):
    """Get user achievements"""
    achievements = await db.achievements.find({
        "user_id": current_user["email"]
    }).sort("earned_date", -1).to_list(1000)
    
    for achievement in achievements:
        achievement["_id"] = str(achievement["_id"])
    
    return achievements

@api_router.get("/gamification/streaks")
async def get_streaks(current_user = Depends(get_current_user)):
    """Calculate user streaks"""
    # Get all food logs to calculate streak
    all_logs = await db.food_logs.find({
        "user_id": current_user["email"]
    }).sort("date", -1).to_list(1000)
    
    if not all_logs:
        return {"calorie_streak": 0, "water_streak": 0, "smoke_free_streak": 0}
    
    # Simple streak calculation (consecutive days with logs)
    dates = list(set(log["date"] for log in all_logs))
    dates.sort(reverse=True)
    
    streak = 0
    for i, date in enumerate(dates):
        if i == 0:
            streak = 1
        else:
            prev_date = datetime.strptime(dates[i-1], "%Y-%m-%d")
            curr_date = datetime.strptime(date, "%Y-%m-%d")
            if (prev_date - curr_date).days == 1:
                streak += 1
            else:
                break
    
    return {
        "calorie_streak": streak,
        "water_streak": streak,
        "smoke_free_streak": 0  # Would need more complex logic
    }

# ==================== CHART/TREND ROUTES ====================

@api_router.get("/charts/food-weekly")
async def chart_food_weekly(current_user = Depends(get_current_user)):
    """Get last 7 days food calorie totals"""
    user_email = current_user["email"]
    today = datetime.utcnow().date()
    data = []
    labels = []
    for i in range(6, -1, -1):
        date = (today - timedelta(days=i))
        date_str = date.strftime("%Y-%m-%d")
        logs = await db.food_logs.find({"user_id": user_email, "date": date_str}).to_list(500)
        total = sum(l.get("total_calories", 0) for l in logs)
        data.append(round(total, 1))
        labels.append(date.strftime("%a"))
    return {"labels": labels, "data": data}


@api_router.get("/charts/water-weekly")
async def chart_water_weekly(current_user = Depends(get_current_user)):
    """Get last 7 days water totals"""
    user_email = current_user["email"]
    today = datetime.utcnow().date()
    data = []
    labels = []
    for i in range(6, -1, -1):
        date = (today - timedelta(days=i))
        date_str = date.strftime("%Y-%m-%d")
        logs = await db.water_logs.find({"user_id": user_email, "date": date_str}).to_list(500)
        total = sum(l.get("amount_ml", 0) for l in logs)
        data.append(total)
        labels.append(date.strftime("%a"))
    return {"labels": labels, "data": data}


@api_router.get("/charts/weight-history")
async def chart_weight_history(current_user = Depends(get_current_user)):
    """Get last 7 weight entries"""
    user_email = current_user["email"]
    logs = await db.weight_logs.find({"user_id": user_email}).sort("created_at", -1).limit(7).to_list(7)
    logs.reverse()
    if not logs:
        return {"labels": [], "data": []}
    return {
        "labels": [l["date"][5:] for l in logs],
        "data": [round(l["weight_kg"], 1) for l in logs]
    }


@api_router.get("/charts/expenses-weekly")
async def chart_expenses_weekly(current_user = Depends(get_current_user)):
    """Get last 7 days expense totals"""
    user_email = current_user["email"]
    today = datetime.utcnow().date()
    data = []
    labels = []
    for i in range(6, -1, -1):
        date = (today - timedelta(days=i))
        date_str = date.strftime("%Y-%m-%d")
        logs = await db.expense_logs.find({"user_id": user_email, "date": date_str}).to_list(500)
        total = sum(l.get("amount", 0) for l in logs)
        data.append(round(total, 2))
        labels.append(date.strftime("%a"))
    return {"labels": labels, "data": data}


# Include the router in the main app
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Seed initial food database
@app.on_event("startup")
async def seed_food_database():
    """Seed initial food items if database is empty"""
    count = await db.food_items.count_documents({})
    if count == 0:
        logger.info("Seeding initial food database...")
        
        initial_foods = [
            {"name": "Banana", "serving_size": "1 medium (118g)", "calories": 105, "protein": 1.3, "carbs": 27, "fat": 0.4, "fiber": 3.1, "sugar": 14, "sodium": 1, "category": "fruits"},
            {"name": "Apple", "serving_size": "1 medium (182g)", "calories": 95, "protein": 0.5, "carbs": 25, "fat": 0.3, "fiber": 4.4, "sugar": 19, "sodium": 2, "category": "fruits"},
            {"name": "Chicken Breast", "serving_size": "100g", "calories": 165, "protein": 31, "carbs": 0, "fat": 3.6, "fiber": 0, "sugar": 0, "sodium": 74, "category": "protein"},
            {"name": "Brown Rice", "serving_size": "1 cup cooked (195g)", "calories": 216, "protein": 5, "carbs": 45, "fat": 1.8, "fiber": 3.5, "sugar": 0.7, "sodium": 10, "category": "grains"},
            {"name": "Egg", "serving_size": "1 large (50g)", "calories": 78, "protein": 6.3, "carbs": 0.6, "fat": 5.3, "fiber": 0, "sugar": 0.6, "sodium": 62, "category": "protein"},
            {"name": "Milk", "serving_size": "1 cup (244g)", "calories": 149, "protein": 7.7, "carbs": 11.7, "fat": 7.9, "fiber": 0, "sugar": 12.3, "sodium": 105, "category": "dairy"},
            {"name": "Bread (Whole Wheat)", "serving_size": "1 slice (28g)", "calories": 69, "protein": 3.6, "carbs": 11.6, "fat": 0.9, "fiber": 1.9, "sugar": 1.4, "sodium": 147, "category": "grains"},
            {"name": "Yogurt (Plain)", "serving_size": "1 cup (245g)", "calories": 154, "protein": 12.9, "carbs": 17.2, "fat": 3.8, "fiber": 0, "sugar": 17.2, "sodium": 113, "category": "dairy"},
            {"name": "Oatmeal", "serving_size": "1 cup cooked (234g)", "calories": 166, "protein": 5.9, "carbs": 28.1, "fat": 3.6, "fiber": 4, "sugar": 0.6, "sodium": 115, "category": "grains"},
            {"name": "Salmon", "serving_size": "100g", "calories": 208, "protein": 20, "carbs": 0, "fat": 13, "fiber": 0, "sugar": 0, "sodium": 59, "category": "protein"},
            {"name": "Broccoli", "serving_size": "1 cup (91g)", "calories": 31, "protein": 2.5, "carbs": 6, "fat": 0.3, "fiber": 2.4, "sugar": 1.5, "sodium": 30, "category": "vegetables"},
            {"name": "Sweet Potato", "serving_size": "1 medium (114g)", "calories": 103, "protein": 2.3, "carbs": 23.6, "fat": 0.2, "fiber": 3.8, "sugar": 7.4, "sodium": 41, "category": "vegetables"},
            {"name": "Almonds", "serving_size": "1 oz (28g)", "calories": 164, "protein": 6, "carbs": 6, "fat": 14, "fiber": 3.5, "sugar": 1.2, "sodium": 0, "category": "nuts"},
            {"name": "Pasta (Cooked)", "serving_size": "1 cup (140g)", "calories": 220, "protein": 8, "carbs": 43, "fat": 1.3, "fiber": 2.5, "sugar": 1.7, "sodium": 1, "category": "grains"},
            {"name": "Orange", "serving_size": "1 medium (131g)", "calories": 62, "protein": 1.2, "carbs": 15.4, "fat": 0.2, "fiber": 3.1, "sugar": 12.2, "sodium": 0, "category": "fruits"},
            {"name": "Tomato", "serving_size": "1 medium (123g)", "calories": 22, "protein": 1.1, "carbs": 4.8, "fat": 0.2, "fiber": 1.5, "sugar": 3.2, "sodium": 6, "category": "vegetables"},
            {"name": "Spinach", "serving_size": "1 cup (30g)", "calories": 7, "protein": 0.9, "carbs": 1.1, "fat": 0.1, "fiber": 0.7, "sugar": 0.1, "sodium": 24, "category": "vegetables"},
            {"name": "Peanut Butter", "serving_size": "2 tbsp (32g)", "calories": 188, "protein": 7.7, "carbs": 7.7, "fat": 16, "fiber": 1.8, "sugar": 3, "sodium": 152, "category": "spreads"},
            {"name": "Greek Yogurt", "serving_size": "1 cup (200g)", "calories": 100, "protein": 17, "carbs": 6, "fat": 0.7, "fiber": 0, "sugar": 6, "sodium": 65, "category": "dairy"},
            {"name": "Avocado", "serving_size": "1/2 avocado (68g)", "calories": 114, "protein": 1.3, "carbs": 6, "fat": 10.5, "fiber": 4.6, "sugar": 0.2, "sodium": 5, "category": "fruits"}
        ]
        
        for food in initial_foods:
            food["is_custom"] = False
            food["created_at"] = datetime.utcnow()
        
        await db.food_items.insert_many(initial_foods)
        logger.info(f"Seeded {len(initial_foods)} food items")
