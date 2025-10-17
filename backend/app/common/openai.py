from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception_type
from typing import List, Dict, Optional, AsyncGenerator
import asyncio
import re

from app.config import config
from app.common.prompts import SYSTEM_PROMPT
from app.common.docx_processor import DocxProcessor


class OpenAIHandler:
    def __init__(self) -> None:
        self._openai_client = OpenAI(api_key=config["OPENAI_API_KEY"], organization=config["OPENAI_API_ORG"])
        self.docx_processor = DocxProcessor()
        self.docx_processor.load_all_documents()

    def _prepare_data_context(self, user_message: str) -> str:
        """
        Prepare relevant data context based on user message from DOCX documents
        """
        try:
            # Get available options for suggestions
            regions = self.docx_processor.get_available_regions()
            categories = self.docx_processor.get_available_categories()

            # Search for relevant data based on user message
            search_results = self.docx_processor.search_documents(user_message, limit=3)

            context = f"""
            ## Available Data Options:
            **Regions**: {', '.join(regions[:10])}{'...' if len(regions) > 10 else ''}
            **Product Categories**: {', '.join(categories[:10])}{'...' if len(categories) > 10 else ''}

            ## Relevant Document Content Found:
            """

            for doc_path, content in search_results.items():
                if content:
                    context += f"\n**{doc_path}**:\n"
                    # Show first 200 characters of relevant content
                    context += content[:200] + "...\n"

            return context

        except Exception as e:
            return f"Document context preparation error: {str(e)}"

    @retry(wait=wait_random_exponential(min=1, max=5), stop=stop_after_attempt(5), retry=retry_if_exception_type(Exception))
    def chat_completion(self, messages: List[Dict[str, str]], model: str = "gpt-5-chat-latest") -> str:
        """
        Generate a chat completion using OpenAI API with data context

        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model: Model to use for completion (default: gpt-5-chat-latest)

        Returns:
            Generated response content
        """
        try:
            # Prepare system message with data context
            system_message = SYSTEM_PROMPT

            # Add data context if this is a user message
            if messages and messages[-1].get("role") == "user":
                data_context = self._prepare_data_context(messages[-1]["content"])
                system_message += f"\n\n## Current Data Context:\n{data_context}"

            # Prepare messages with system prompt
            full_messages = [{"role": "system", "content": system_message}]
            full_messages.extend(messages)

            response = self._openai_client.chat.completions.create(
                model=model, messages=full_messages, max_tokens=8000, temperature=0.3, stream=False
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}") from e

    async def chat_completion_stream(self, messages: List[Dict[str, str]], model: str = "gpt-5-chat-latest") -> AsyncGenerator[Dict, None]:
        """
        Generate a streaming chat completion using OpenAI API with data context

        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model: Model to use for completion (default: gpt-5-chat-latest)

        Yields:
            Dictionary with 'type' and 'data' keys for different content types
        """
        try:
            # Prepare system message with data context
            system_message = SYSTEM_PROMPT

            # Add data context if this is a user message
            if messages and messages[-1].get("role") == "user":
                data_context = self._prepare_data_context(messages[-1]["content"])
                system_message += f"\n\n## Current Data Context:\n{data_context}"

            # Prepare messages with system prompt
            full_messages = [{"role": "system", "content": system_message}]
            full_messages.extend(messages)

            # Send initial status
            yield {"type": "status", "data": "Connecting to AI..."}
            await asyncio.sleep(0.1)

            # Create streaming response with increased token limit
            stream = self._openai_client.chat.completions.create(model=model, messages=full_messages, max_tokens=12000, temperature=0.3, stream=True)

            accumulated_content = ""
            chart_config_buffer = ""
            in_chart_config = False

            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    accumulated_content += content

                    # Check for chart configuration start
                    if "```json" in content and "chartConfig" in content:
                        in_chart_config = True
                        chart_config_buffer = content
                        continue
                    elif in_chart_config:
                        chart_config_buffer += content

                        # Check for chart configuration end
                        if "```" in content and chart_config_buffer.count("```") >= 2:
                            in_chart_config = False
                            # Try to extract chart config with improved regex
                            try:
                                # More flexible regex to handle incomplete JSON
                                chart_match = re.search(r'```json\s*(\{[\s\S]*?"chartConfig"[\s\S]*?)\s*```', chart_config_buffer)
                                if chart_match:
                                    chart_config = chart_match.group(1)
                                    # Validate JSON structure
                                    if chart_config.count('{') >= chart_config.count('}') and '"chartConfig"' in chart_config:
                                        yield {"type": "chart", "data": chart_config}
                                    chart_config_buffer = ""
                                    continue
                            except Exception as e:
                                pass
                            chart_config_buffer = ""
                        continue

                    # Send content chunk
                    yield {"type": "content", "data": content}
                    await asyncio.sleep(0.01)  # Small delay for smooth streaming

            # Send completion status
            yield {"type": "status", "data": "Analysis completed"}

        except Exception as e:
            yield {"type": "error", "data": f"OpenAI API error: {str(e)}"}

    def get_data_summary(self) -> Dict:
        """
        Get a summary of available documents for the AI to reference
        """
        try:
            return self.docx_processor.get_document_summary()
        except Exception as e:
            return {"error": f"Failed to get document summary: {str(e)}"}

    def analyze_market_trend(self, region: Optional[str] = None, product_category: Optional[str] = None) -> Dict:
        """
        Analyze market trends for specific region and product category from DOCX documents
        """
        try:
            # Get relevant document analysis
            analysis = self.docx_processor.analyze_market_data(region, product_category)

            return {
                "analysis": analysis,
                "summary": {
                    "region": region or "All regions",
                    "category": product_category or "All categories",
                    "analysis_keys": list(analysis.keys()),
                },
            }
        except Exception as e:
            return {"error": f"Failed to analyze market trend: {str(e)}"}

    def get_echarts_config(
        self, product_category: Optional[str] = None, title: str = "Home Appliances Market Size by Region", chart_type: str = "stacked_bar"
    ) -> Dict:
        """
        Generate ECharts configuration with enhanced styling and multiple chart types based on DOCX document analysis
        """
        try:
            # Get chart data from document analysis
            chart_data = self.docx_processor.generate_chart_data(None, product_category)

            if "error" in chart_data:
                return chart_data

            # Enhanced color palette
            color_palette = [
                "#3B82F6",  # Blue
                "#10B981",  # Emerald
                "#F59E0B",  # Amber
                "#EF4444",  # Red
                "#8B5CF6",  # Violet
            ]

            # Base series configuration
            base_series = [
                {
                    "name": "North America",
                    "type": "bar",
                    "stack": "total",
                    "data": chart_data["chart_data"]["North America"],
                    "itemStyle": {"color": color_palette[0]},
                },
                {
                    "name": "Europe",
                    "type": "bar",
                    "stack": "total",
                    "data": chart_data["chart_data"]["Europe"],
                    "itemStyle": {"color": color_palette[1]},
                },
                {
                    "name": "Asia Pacific",
                    "type": "bar",
                    "stack": "total",
                    "data": chart_data["chart_data"]["Asia Pacific"],
                    "itemStyle": {"color": color_palette[2]},
                },
                {
                    "name": "Latin America",
                    "type": "bar",
                    "stack": "total",
                    "data": chart_data["chart_data"]["Latin America"],
                    "itemStyle": {"color": color_palette[3]},
                },
                {
                    "name": "MEA",
                    "type": "bar",
                    "stack": "total",
                    "data": chart_data["chart_data"]["MEA"],
                    "itemStyle": {"color": color_palette[4]},
                },
            ]

            # Apply chart type specific configurations
            if chart_type == "line":
                for series in base_series:
                    series["type"] = "line"
                    series["smooth"] = True
                    series["symbol"] = "circle"
                    series["symbolSize"] = 6
                    series["lineStyle"] = {"width": 3}
                    series["areaStyle"] = {"opacity": 0.1}
                    # Remove stacking for line charts
                    if "stack" in series:
                        del series["stack"]
            elif chart_type == "grouped_bar":
                for series in base_series:
                    series["type"] = "bar"
                    # Remove stacking for grouped bars
                    if "stack" in series:
                        del series["stack"]
            elif chart_type == "percentage_stacked":
                for series in base_series:
                    series["type"] = "bar"
                    series["stack"] = "total"

            # Optimized configuration to prevent truncation
            config = {
                "color": color_palette,
                "title": {"text": title, "subtext": "Market Size by Region, 2018-2030", "left": "center"},
                "tooltip": {
                    "trigger": "axis",
                    "backgroundColor": "rgba(255, 255, 255, 0.98)",
                    "borderColor": "#D1D5DB",
                    "borderWidth": 1,
                    "borderRadius": 8,
                    "textStyle": {
                        "color": "#374151",
                        "fontSize": 12,
                        "fontWeight": "500",
                    },
                    "axisPointer": {
                        "type": "shadow",
                        "shadowStyle": {
                            "color": "rgba(0, 0, 0, 0.1)",
                            "opacity": 0.3,
                        },
                    },
                },
                "legend": {
                    "data": [series["name"] for series in base_series if series.get("name")],
                    "bottom": "10px",
                    "left": "center",
                    "itemGap": 25,
                    "show": True,
                    "orient": "horizontal",
                    "textStyle": {
                        "fontSize": 12,
                        "color": "#374151",
                        "fontWeight": "500",
                    },
                    "itemWidth": 14,
                    "itemHeight": 14,
                    "selectedMode": True,
                    "backgroundColor": "rgba(255, 255, 255, 0.8)",
                    "borderColor": "#E5E7EB",
                    "borderWidth": 1,
                    "borderRadius": 8,
                    "padding": [8, 12],
                    "shadowBlur": 4,
                    "shadowColor": "rgba(0, 0, 0, 0.1)",
                },
                "grid": {
                    "left": "4%",
                    "right": "4%",
                    "bottom": "15%",  # Reduced to accommodate enhanced legend
                    "top": "100px",
                    "containLabel": True,
                    "backgroundColor": "transparent",
                    "borderColor": "#E5E7EB",
                    "borderWidth": 1,
                },
                "xAxis": {"type": "category", "data": chart_data["years"]},
                "yAxis": {"type": "value", "name": "Market Size (US$B)", "axisLabel": {"formatter": "${value}B"}},
                "series": base_series,
            }

            return {"chartConfig": config, "analysis": chart_data["analysis"]}
        except Exception as e:
            return {"error": f"Failed to generate ECharts config: {str(e)}"}

    def get_product_categories(self) -> List[str]:
        """
        Get all available product categories from documents
        """
        try:
            return self.docx_processor.get_available_categories()
        except Exception:
            return []

    def get_subcategories(self, category: Optional[str] = None) -> List[str]:
        """
        Get subcategories for a specific product category from documents
        """
        try:
            if category:
                # Get subcategories for specific category
                category_mapping = self.docx_processor.get_category_subcategory_mapping()
                return category_mapping.get(category, [])
            else:
                # Get all subcategories
                return self.docx_processor.get_available_subcategories()
        except Exception:
            return []

    def get_regions(self) -> List[str]:
        """
        Get all available regions from documents
        """
        try:
            return self.docx_processor.get_available_regions()
        except Exception:
            return []

    def get_competitive_analysis(self, region: Optional[str] = None) -> Dict:
        """
        Get competitive product portfolio and price architecture analysis
        """
        try:
            return self.docx_processor.extract_competitive_analysis(region)
        except Exception as e:
            return {"error": f"Failed to get competitive analysis: {str(e)}"}

    def get_category_subcategory_mapping(self) -> Dict[str, List[str]]:
        """
        Get mapping of categories to their subcategories
        """
        try:
            return self.docx_processor.get_category_subcategory_mapping()
        except Exception as e:
            return {"error": f"Failed to get category mapping: {str(e)}"}

    def perform_web_search(self, input_text: str) -> Dict:
        """
        Perform web search using OpenAI's web search tool
        """
        try:
            response = self._openai_client.responses.create(
                model="gpt-5-chat-latest",
                tools=[
                    {"type": "web_search"},
                ],
                input=input_text,
            )

            return {"output_text": response.output_text, "status": "success"}
        except Exception as e:
            return {"error": f"Failed to perform web search: {str(e)}", "status": "error"}
