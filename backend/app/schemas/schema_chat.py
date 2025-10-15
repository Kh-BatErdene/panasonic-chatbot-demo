from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[datetime] = None


class ChatQuestionRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []


class ChatQuestionResponse(BaseModel):
    message_id: str
    status: str
    message: str


class ChatAnswerRequest(BaseModel):
    message_id: str


class ChatAnswerResponse(BaseModel):
    message_id: str
    answer: str
    status: str
    timestamp: datetime


class DataSummaryResponse(BaseModel):
    market_intelligence: Dict[str, Any]
    market_trend: Dict[str, Any]
    timeseries: Dict[str, Any]


class MarketAnalysisRequest(BaseModel):
    region: Optional[str] = None
    product_category: Optional[str] = None


class MarketAnalysisResponse(BaseModel):
    trend_data: List[Dict[str, Any]]
    timeseries_data: List[Dict[str, Any]]
    intelligence_data: List[Dict[str, Any]]
    summary: Dict[str, Any]


class DataPoint(BaseModel):
    year: int
    value: float
    region: Optional[str] = None
    product_category: Optional[str] = None


class ChartData(BaseModel):
    title: str
    x_axis: List[str]
    series: List[Dict[str, Any]]


class MarketInsight(BaseModel):
    insight_type: str  # "trend", "forecast", "comparison", "opportunity"
    title: str
    description: str
    data_points: List[DataPoint]
    confidence: float  # 0-1
    source: str  # "market_intelligence", "market_trend", "timeseries"


class EChartsConfig(BaseModel):
    chartConfig: Dict[str, Any]


class EChartsResponse(BaseModel):
    chartConfig: Dict[str, Any]
    status: str = "success"
