from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class MealType(str, Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"

class ExpenseCategory(str, Enum):
    food = "food"
    groceries = "groceries"
    fruits = "fruits"
    vegetables = "vegetables"
    supplements = "supplements"
    restaurant = "restaurant"
    drinks = "drinks"
    smoking = "smoking"
    other = "other"

class BadgeType(str, Enum):
    streak_1_day = "streak_1_day"
    streak_7_days = "streak_7_days"
    streak_30_days = "streak_30_days"
    smoke_free_1_day = "smoke_free_1_day"
    smoke_free_7_days = "smoke_free_7_days"
    smoke_free_30_days = "smoke_free_30_days"
    cigarettes_avoided_100 = "cigarettes_avoided_100"
    money_saved_1000 = "money_saved_1000"
    money_saved_5000 = "money_saved_5000"
    weight_goal_achieved = "weight_goal_achieved"
    calorie_goal_week = "calorie_goal_week"
    water_goal_week = "water_goal_week"

# User Models
class UserGoals(BaseModel):
    daily_calories: int = 2000
    goal_weight: float = 70.0
    daily_water_ml: int = 2000

class UserSettings(BaseModel):
    theme: str = "light"
    notifications: bool = True

class User(BaseModel):
    email: EmailStr
    password: str
    name: str
    profile_pic: Optional[str] = None
    goals: UserGoals = Field(default_factory=UserGoals)
    settings: UserSettings = Field(default_factory=UserSettings)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    profile_pic: Optional[str] = None
    goals: Optional[UserGoals] = None
    settings: Optional[UserSettings] = None

# Food Models
class FoodItem(BaseModel):
    name: str
    brand: Optional[str] = None
    serving_size: str
    calories: float
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    fiber: float = 0
    sugar: float = 0
    sodium: float = 0
    barcode: Optional[str] = None
    category: Optional[str] = None
    is_custom: bool = False
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FoodItemCreate(BaseModel):
    name: str
    brand: Optional[str] = None
    serving_size: str
    calories: float
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    fiber: float = 0
    sugar: float = 0
    sodium: float = 0
    category: Optional[str] = None

class FoodLog(BaseModel):
    user_id: str
    food_item_id: str
    food_name: str
    meal_type: MealType
    quantity: float
    total_calories: float
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    fiber: float = 0
    sugar: float = 0
    sodium: float = 0
    date: str  # YYYY-MM-DD format
    time: str  # HH:MM format
    notes: Optional[str] = None
    image: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FoodLogCreate(BaseModel):
    food_item_id: str
    meal_type: MealType
    quantity: float = 1.0
    notes: Optional[str] = None
    image: Optional[str] = None

# Weight Models
class WeightLog(BaseModel):
    user_id: str
    weight_kg: float
    bmi: Optional[float] = None
    body_fat_percent: Optional[float] = None
    date: str
    time: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WeightLogCreate(BaseModel):
    weight_kg: float
    body_fat_percent: Optional[float] = None
    notes: Optional[str] = None

# Water Models
class WaterLog(BaseModel):
    user_id: str
    amount_ml: int
    date: str
    time: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WaterLogCreate(BaseModel):
    amount_ml: int

# Expense Models
class ExpenseLog(BaseModel):
    user_id: str
    item_name: str
    amount: float
    category: ExpenseCategory
    date: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ExpenseLogCreate(BaseModel):
    item_name: str
    amount: float
    category: ExpenseCategory
    notes: Optional[str] = None

# Cigarette/Smoking Models
class CigaretteLog(BaseModel):
    user_id: str
    brand: Optional[str] = None
    cost_per_cigarette: Optional[float] = None
    date: str
    time: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CigaretteLogCreate(BaseModel):
    brand: Optional[str] = None
    cost_per_cigarette: Optional[float] = None
    notes: Optional[str] = None

# Achievement Models
class Achievement(BaseModel):
    user_id: str
    badge_type: BadgeType
    earned_date: datetime = Field(default_factory=datetime.utcnow)
    description: str

# AI Models
class AIRequest(BaseModel):
    message: str
    context: Optional[dict] = None

class BarcodeScanRequest(BaseModel):
    barcode: str

class ImageAnalysisRequest(BaseModel):
    image: str  # base64
