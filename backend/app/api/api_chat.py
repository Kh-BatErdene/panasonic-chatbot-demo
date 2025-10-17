from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import Optional, AsyncGenerator
import json
import asyncio
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


@router.post("/answer/stream")
async def get_answer_stream(request: ChatAnswerRequest):
    """
    Get streaming answer for a previously submitted question
    """
    try:
        async def generate_stream() -> AsyncGenerator[str, None]:
            try:
                # Generate streaming response
                async for chunk in chat_controller.generate_answer_stream(request):
                    # Format as Server-Sent Events
                    yield f"data: {json.dumps(chunk)}\n\n"
                    await asyncio.sleep(0.01)  # Small delay to prevent overwhelming
                
                # Send end signal
                yield f"data: {json.dumps({'type': 'end', 'data': ''})}\n\n"
                
            except Exception as e:
                logger.write_error(f"Error in streaming response: {str(e)}")
                yield f"data: {json.dumps({'type': 'error', 'data': str(e)})}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
            }
        )
    except Exception as e:
        logger.write_error(f"Error in get_answer_stream endpoint: {str(e)}")
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
    product_category: Optional[str] = Query(None, description="Product category to analyze"),
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
    title: Optional[str] = Query("Home Appliances Market Analysis", description="Chart title"),
    chart_type: Optional[str] = Query("stacked_bar", description="Chart type: stacked_bar, line, grouped_bar, percentage_stacked"),
):
    """
    Generate ECharts configuration with enhanced styling and multiple chart types
    """
    try:
        config = chat_controller.get_echarts_config(product_category, title, chart_type)
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


@router.get("/data/web-search")
async def search_web_data(
    query: str = Query(..., description="Search query for market data"),
    region: Optional[str] = Query(None, description="Region to search for"),
    product_category: Optional[str] = Query(None, description="Product category to search for"),
):
    """
    Search for additional market data using web search
    """
    try:
        results = chat_controller.search_web_data(query, region, product_category)
        return results
    except Exception as e:
        logger.write_error(f"Error in web search endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/data/enhanced-analysis")
async def get_enhanced_analysis(
    query: str = Query(..., description="Analysis query"),
    region: Optional[str] = Query(None, description="Region to analyze"),
    product_category: Optional[str] = Query(None, description="Product category to analyze"),
):
    """
    Generate enhanced analysis combining DOCX documents and web search data
    """
    try:
        analysis = chat_controller.generate_enhanced_analysis(query, region, product_category)
        return analysis
    except Exception as e:
        logger.write_error(f"Error in enhanced analysis endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/data/competitive-analysis")
async def get_competitive_analysis(region: Optional[str] = Query(None, description="Region to analyze")):
    """
    Get competitive product portfolio and price architecture analysis
    """
    try:
        analysis = chat_controller.get_competitive_analysis(region)
        return analysis
    except Exception as e:
        logger.write_error(f"Error in competitive analysis endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/data/category-mapping")
async def get_category_subcategory_mapping():
    """
    Get mapping of categories to their subcategories
    """
    try:
        mapping = chat_controller.get_category_subcategory_mapping()
        return mapping
    except Exception as e:
        logger.write_error(f"Error in category mapping endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/data/direct-result")
async def get_direct_result(
    category: str = Query(..., description="Product category"),
    subcategory: str = Query(..., description="Product subcategory"),
    country: str = Query(..., description="Country/Region"),
):
    """
    Get direct result without LLM processing - just chart config and data
    """
    try:
        result = chat_controller.get_direct_result(category, subcategory, country)
        return result
    except Exception as e:
        logger.write_error(f"Error in direct result endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/data/countries")
async def get_available_countries():
    """
    Get all available countries/regions for selection
    """
    try:
        countries = chat_controller.get_available_countries()
        return {"countries": countries}
    except Exception as e:
        logger.write_error(f"Error in get_available_countries endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/data/llm-analysis")
async def get_llm_analysis(
    category: str = Query(..., description="Product category"),
    subcategory: str = Query(..., description="Product subcategory"),
    country: str = Query(..., description="Country/Region"),
):
    """
    Get LLM analysis with chart config for selected category, subcategory, and country
    """
    try:
        result = chat_controller.get_llm_analysis(category, subcategory, country)
        return result
    except Exception as e:
        logger.write_error(f"Error in get_llm_analysis endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/web-search")
async def perform_web_search(request: dict):
    """
    Perform web search using OpenAI's web search tool
    """
    try:
        input_text = request.get("input", "")
        if not input_text:
            raise HTTPException(status_code=400, detail="Input text is required")

        # Use OpenAI's web search tool
        response = chat_controller.perform_web_search(input_text)
        return response
    except Exception as e:
        logger.write_error(f"Error in web search endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy", "service": "chat-api"}
