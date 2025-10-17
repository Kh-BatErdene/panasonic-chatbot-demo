import uuid
from typing import Dict, Optional, List, AsyncGenerator
from datetime import datetime
import asyncio
from app.common.openai import OpenAIHandler
from app.common.web_search import WebSearchHandler
from app.schemas.schema_chat import ChatQuestionRequest, ChatQuestionResponse, ChatAnswerRequest, ChatAnswerResponse
from app.config import logger


class ChatController:
    def __init__(self):
        self.openai_handler = OpenAIHandler()
        self.web_search_handler = WebSearchHandler()
        self.message_storage: Dict[str, Dict] = {}

    def process_question(self, request: ChatQuestionRequest) -> ChatQuestionResponse:
        """
        Process a chat question and store it for later answer generation
        """
        try:
            message_id = str(uuid.uuid4())

            self.message_storage[message_id] = {
                "question": request.message,
                "conversation_history": request.conversation_history,
                "timestamp": datetime.now(),
                "status": "pending",
            }
            return ChatQuestionResponse(message_id=message_id, status="received", message="Question received successfully")

        except Exception as e:
            logger.write_error(f"Error processing question: {str(e)}")
            raise Exception(f"Failed to process question: {str(e)}") from e

    def generate_answer(self, request: ChatAnswerRequest) -> ChatAnswerResponse:
        """
        Generate an answer for a previously submitted question with data analysis
        """
        try:
            if request.message_id not in self.message_storage:
                raise ValueError("Message ID not found")

            message_data = self.message_storage[request.message_id]

            messages = []

            for msg in message_data["conversation_history"]:
                messages.append({"role": msg.role, "content": msg.content})

            messages.append({"role": "user", "content": message_data["question"]})

            # Generate answer with data context
            answer = self.openai_handler.chat_completion(messages)

            self.message_storage[request.message_id]["answer"] = answer
            self.message_storage[request.message_id]["status"] = "completed"
            self.message_storage[request.message_id]["answer_timestamp"] = datetime.now()

            return ChatAnswerResponse(message_id=request.message_id, answer=answer, status="completed", timestamp=datetime.now())

        except Exception as e:
            logger.write_error(f"Error generating answer: {str(e)}")
            raise Exception(f"Failed to generate answer: {str(e)}") from e

    async def generate_answer_stream(self, request: ChatAnswerRequest) -> AsyncGenerator[Dict, None]:
        """
        Generate a streaming answer for a previously submitted question
        """
        try:
            if request.message_id not in self.message_storage:
                raise ValueError("Message ID not found")

            message_data = self.message_storage[request.message_id]

            messages = []
            for msg in message_data["conversation_history"]:
                messages.append({"role": msg.role, "content": msg.content})

            messages.append({"role": "user", "content": message_data["question"]})

            # Send initial status
            yield {"type": "status", "data": "Starting analysis..."}
            await asyncio.sleep(0.1)

            # Generate streaming answer
            full_answer = ""
            async for chunk in self.openai_handler.chat_completion_stream(messages):
                if chunk.get("type") == "content":
                    full_answer += chunk.get("data", "")
                    yield {"type": "content", "data": chunk.get("data", "")}
                elif chunk.get("type") == "status":
                    yield {"type": "status", "data": chunk.get("data", "")}
                elif chunk.get("type") == "chart":
                    yield {"type": "chart", "data": chunk.get("data", {})}
                elif chunk.get("type") == "error":
                    yield {"type": "error", "data": chunk.get("data", "")}
                    return

            # Update storage with complete answer
            self.message_storage[request.message_id]["answer"] = full_answer
            self.message_storage[request.message_id]["status"] = "completed"
            self.message_storage[request.message_id]["answer_timestamp"] = datetime.now()

            yield {"type": "complete", "data": "Analysis completed"}

        except Exception as e:
            logger.write_error(f"Error generating streaming answer: {str(e)}")
            yield {"type": "error", "data": str(e)}

    def get_data_summary(self) -> Dict:
        """
        Get a summary of available market data
        """
        try:
            return self.openai_handler.get_data_summary()
        except Exception as e:
            logger.write_error(f"Error getting data summary: {str(e)}")
            raise Exception(f"Failed to get data summary: {str(e)}") from e

    def analyze_market_trend(self, region: Optional[str] = None, product_category: Optional[str] = None) -> Dict:
        """
        Analyze market trends for specific region and product category
        """
        try:
            return self.openai_handler.analyze_market_trend(region, product_category)
        except Exception as e:
            logger.write_error(f"Error analyzing market trend: {str(e)}")
            raise Exception(f"Failed to analyze market trend: {str(e)}") from e

    def get_echarts_config(self, product_category: Optional[str] = None, title: str = "Home Appliances Market Analysis", chart_type: str = "stacked_bar") -> Dict:
        """
        Generate ECharts configuration with enhanced styling and multiple chart types
        """
        try:
            return self.openai_handler.get_echarts_config(product_category, title, chart_type)
        except Exception as e:
            logger.write_error(f"Error generating ECharts config: {str(e)}")
            raise Exception(f"Failed to generate ECharts config: {str(e)}") from e

    def get_product_categories(self) -> list:
        """
        Get all available product categories
        """
        try:
            return self.openai_handler.get_product_categories()
        except Exception as e:
            logger.write_error(f"Error getting product categories: {str(e)}")
            raise Exception(f"Failed to get product categories: {str(e)}") from e

    def get_subcategories(self, category: Optional[str] = None) -> list:
        """
        Get subcategories for a specific product category
        """
        try:
            return self.openai_handler.get_subcategories(category)
        except Exception as e:
            logger.write_error(f"Error getting subcategories: {str(e)}")
            raise Exception(f"Failed to get subcategories: {str(e)}") from e

    def get_regions(self) -> list:
        """
        Get all available regions
        """
        try:
            return self.openai_handler.get_regions()
        except Exception as e:
            logger.write_error(f"Error getting regions: {str(e)}")
            raise Exception(f"Failed to get regions: {str(e)}") from e

    def search_web_data(self, query: str, region: Optional[str] = None, product_category: Optional[str] = None) -> Dict:
        """
        Search for additional market data using web search
        """
        try:
            return self.web_search_handler.search_market_data(query, region, product_category)
        except Exception as e:
            logger.write_error(f"Error in web search: {str(e)}")
            raise Exception(f"Failed to perform web search: {str(e)}") from e

    def generate_enhanced_analysis(self, query: str, region: Optional[str] = None, product_category: Optional[str] = None) -> Dict:
        """
        Generate enhanced analysis combining DOCX documents and web search data
        """
        try:
            # Get DOCX analysis
            docx_analysis = self.openai_handler.analyze_market_trend(region, product_category)

            # Get web search data
            web_search_results = self.web_search_handler.search_market_data(query, region, product_category)

            # Generate enhanced content
            enhanced_content = self.web_search_handler.generate_docx_content(web_search_results)

            return {
                "docx_analysis": docx_analysis,
                "web_search_results": web_search_results,
                "enhanced_content": enhanced_content,
                "combined_analysis": {
                    "Population & Households": self._combine_analysis_sections(
                        docx_analysis.get("analysis", {}).get("Population & Households", ""), web_search_results.get("results", [])
                    ),
                    "Society & Economy": self._combine_analysis_sections(
                        docx_analysis.get("analysis", {}).get("Society & Economy", ""), web_search_results.get("results", [])
                    ),
                    "Science & Technology": self._combine_analysis_sections(
                        docx_analysis.get("analysis", {}).get("Science & Technology", ""), web_search_results.get("results", [])
                    ),
                    "City & Nature": self._combine_analysis_sections(
                        docx_analysis.get("analysis", {}).get("City & Nature", ""), web_search_results.get("results", [])
                    ),
                },
            }
        except Exception as e:
            logger.write_error(f"Error generating enhanced analysis: {str(e)}")
            raise Exception(f"Failed to generate enhanced analysis: {str(e)}") from e

    def _combine_analysis_sections(self, docx_content: str, web_results: list) -> str:
        """
        Combine DOCX content with relevant web search results
        """
        combined = docx_content

        if web_results:
            combined += "\n\n**Additional Web Intelligence:**\n"
            for result in web_results[:2]:  # Top 2 results
                combined += f"- {result.get('title', '')}: {result.get('snippet', '')}\n"

        return combined

    def get_competitive_analysis(self, region: Optional[str] = None) -> Dict:
        """
        Get competitive product portfolio and price architecture analysis
        """
        try:
            return self.openai_handler.get_competitive_analysis(region)
        except Exception as e:
            logger.write_error(f"Error getting competitive analysis: {str(e)}")
            raise Exception(f"Failed to get competitive analysis: {str(e)}") from e

    def get_category_subcategory_mapping(self) -> Dict:
        """
        Get mapping of categories to their subcategories
        """
        try:
            return self.openai_handler.get_category_subcategory_mapping()
        except Exception as e:
            logger.write_error(f"Error getting category mapping: {str(e)}")
            raise Exception(f"Failed to get category mapping: {str(e)}") from e

    def get_direct_result(self, category: str, subcategory: str, country: str) -> Dict:
        """
        Get direct result without LLM processing - just chart config and data
        """
        try:
            # Get chart configuration directly
            chart_config = self.openai_handler.get_echarts_config(category)

            # Handle "全て" (All) selection
            if country == "全て":
                # Get market data analysis for all regions
                market_analysis = self.openai_handler.analyze_market_trend(None, category)
                # Get competitive analysis for all regions
                competitive_analysis = self.openai_handler.get_competitive_analysis(None)
                country_display = "All Regions"
            else:
                # Get market data analysis for specific country
                market_analysis = self.openai_handler.analyze_market_trend(country, category)
                # Get competitive analysis for specific country
                competitive_analysis = self.openai_handler.get_competitive_analysis(country)
                country_display = country

            # Create direct result without LLM processing
            result = {
                "category": category,
                "subcategory": subcategory,
                "country": country,
                "country_display": country_display,
                "chart_config": chart_config,
                "market_analysis": market_analysis,
                "competitive_analysis": competitive_analysis,
                "summary": {
                    "title": f"{category} ({subcategory}) Market Analysis in {country_display}",
                    "description": f"Direct market analysis for {category} - {subcategory} in {country_display}",
                    "data_sources": ["DOCX Documents", "Market Research Reports"],
                    "last_updated": "2025-01-16",
                },
            }

            return result
        except Exception as e:
            logger.write_error(f"Error getting direct result: {str(e)}")
            raise Exception(f"Failed to get direct result: {str(e)}") from e

    def get_available_countries(self) -> List[str]:
        """
        Get all available countries/regions for selection
        """
        try:
            countries = ["全て", "Vietnam", "Singapore", "India"]
            return countries
        except Exception as e:
            logger.write_error(f"Error getting available countries: {str(e)}")
            return []

    def get_llm_analysis(self, category: str, subcategory: str, country: str) -> Dict:
        """
        Get LLM analysis with chart config for selected category, subcategory, and country
        """
        try:
            # Handle "全て" (All) selection
            if country == "全て":
                region = None
                country_display = "All Regions"
            else:
                region = country
                country_display = country

            # Create a chat question request for LLM processing
            question_request = ChatQuestionRequest(
                message=f"Analyze the market for {category} ({subcategory}) in {country_display}. Provide comprehensive market analysis with chart configuration."
            )

            # Process the question through LLM
            response = self.process_question(question_request)

            # Get the answer with LLM analysis
            answer_request = ChatAnswerRequest(message_id=response.message_id)

            llm_response = self.generate_answer(answer_request)

            # Get chart configuration
            chart_config = self.openai_handler.get_echarts_config(category)

            # Combine LLM response with chart config
            result = {
                "category": category,
                "subcategory": subcategory,
                "country": country,
                "country_display": country_display,
                "llm_response": llm_response,
                "chart_config": chart_config,
                "summary": {
                    "title": f"{category} ({subcategory}) Market Analysis in {country_display}",
                    "description": f"LLM-powered market analysis for {category} - {subcategory} in {country_display}",
                    "data_sources": ["DOCX Documents", "Market Research Reports", "LLM Analysis"],
                    "last_updated": "2025-01-16",
                },
            }

            return result
        except Exception as e:
            logger.write_error(f"Error getting LLM analysis: {str(e)}")
            raise Exception(f"Failed to get LLM analysis: {str(e)}") from e

    def perform_web_search(self, input_text: str) -> Dict:
        """
        Perform web search using OpenAI's web search tool
        """
        try:
            return self.openai_handler.perform_web_search(input_text)
        except Exception as e:
            logger.write_error(f"Error performing web search: {str(e)}")
            raise Exception(f"Failed to perform web search: {str(e)}") from e
