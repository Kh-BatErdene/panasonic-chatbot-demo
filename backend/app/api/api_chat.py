from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.schemas.schema_chat import ChatQuestionRequest, ChatQuestionResponse, ChatAnswerRequest, ChatAnswerResponse
from app.controller.controller_chat import ChatController
from app.config import logger

router = APIRouter()

chat_controller = ChatController()


@router.post("/question", response_model=ChatQuestionResponse)
async def submit_question(request: ChatQuestionRequest):
    """
    Submit a chat question for processing
    """
    try:
        response = chat_controller.process_question(request)
        return response
    except Exception as e:
        logger.write_error(f"Error in submit_question endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/answer", response_model=ChatAnswerResponse)
async def get_answer(request: ChatAnswerRequest):
    """
    Get the answer for a previously submitted question
    """
    try:
        response = chat_controller.generate_answer(request)
        return response
    except Exception as e:
        logger.write_error(f"Error in get_answer endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/data/summary")
async def get_data_summary():
    """
    Get a summary of available market data
    """
    try:
        summary = chat_controller.get_data_summary()
        return summary
    except Exception as e:
        logger.write_error(f"Error in get_data_summary endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/data/analyze")
async def analyze_market_trend(
    region: Optional[str] = Query(None, description="Region to analyze"),
    product_category: Optional[str] = Query(None, description="Product category to analyze")
):
    """
    Analyze market trends for specific region and product category
    """
    try:
        analysis = chat_controller.analyze_market_trend(region, product_category)
        return analysis
    except Exception as e:
        logger.write_error(f"Error in analyze_market_trend endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/data/chart")
async def get_echarts_config(
    product_category: Optional[str] = Query(None, description="Product category for chart"),
    title: Optional[str] = Query("Home Appliances Market Analysis", description="Chart title")
):
    """
    Generate ECharts configuration for stacked bar chart
    """
    try:
        config = chat_controller.get_echarts_config(product_category, title)
        return config
    except Exception as e:
        logger.write_error(f"Error in get_echarts_config endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/data/categories")
async def get_product_categories():
    """
    Get all available product categories
    """
    try:
        categories = chat_controller.get_product_categories()
        return {"categories": categories}
    except Exception as e:
        logger.write_error(f"Error in get_product_categories endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/data/subcategories")
async def get_subcategories(category: Optional[str] = Query(None, description="Product category to get subcategories for")):
    """
    Get subcategories for a specific product category
    """
    try:
        subcategories = chat_controller.get_subcategories(category)
        return {"subcategories": subcategories}
    except Exception as e:
        logger.write_error(f"Error in get_subcategories endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/data/regions")
async def get_regions():
    """
    Get all available regions
    """
    try:
        regions = chat_controller.get_regions()
        return {"regions": regions}
    except Exception as e:
        logger.write_error(f"Error in get_regions endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy", "service": "chat-api"}
