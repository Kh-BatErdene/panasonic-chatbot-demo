from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception_type
from typing import List, Dict, Optional

from app.config import config
from app.common.prompts import SYSTEM_PROMPT
from app.common.data_loader import DataLoader


class OpenAIHandler:
    def __init__(self) -> None:
        self._openai_client = OpenAI(api_key=config["OPENAI_API_KEY"], organization=config["OPENAI_API_ORG"])
        self.data_loader = DataLoader()
        self.data_loader.load_all_data()

    def _prepare_data_context(self, user_message: str) -> str:
        """
        Prepare relevant data context based on user message
        """
        try:
            # Get available options for suggestions
            regions = self.data_loader.get_available_regions()
            categories = self.data_loader.get_available_product_categories()

            # Search for relevant data based on user message
            search_results = self.data_loader.search_data(user_message, limit=5)

            context = f"""
            ## Available Data Options:
            **Regions**: {', '.join(regions[:10])}{'...' if len(regions) > 10 else ''}
            **Product Categories**: {', '.join(categories[:10])}{'...' if len(categories) > 10 else ''}

            ## Relevant Data Found:
            """

            for dataset_name, data in search_results.items():
                if not data.empty:
                    context += f"\n**{dataset_name.replace('_', ' ').title()}**:\n"
                    # Convert first few rows to string for context
                    context += data.head(3).to_string(index=False) + "\n"

            return context

        except Exception as e:
            return f"Data context preparation error: {str(e)}"

    @retry(wait=wait_random_exponential(min=1, max=5), stop=stop_after_attempt(5), retry=retry_if_exception_type(Exception))
    def chat_completion(self, messages: List[Dict[str, str]], model: str = "gpt-4o-mini") -> str:
        """
        Generate a chat completion using OpenAI API with data context

        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model: Model to use for completion (default: gpt-4o-mini)

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
                model=model, messages=full_messages, max_tokens=2000, temperature=0.3, stream=False
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}") from e

    def get_data_summary(self) -> Dict:
        """
        Get a summary of available data for the AI to reference
        """
        try:
            return self.data_loader.get_data_summary()
        except Exception as e:
            return {"error": f"Failed to get data summary: {str(e)}"}

    def analyze_market_trend(self, region: Optional[str] = None, product_category: Optional[str] = None) -> Dict:
        """
        Analyze market trends for specific region and product category
        """
        try:
            # Get relevant data
            trend_data = self.data_loader.get_market_trend_data(region, product_category)
            timeseries_data = self.data_loader.get_timeseries_data(region, product_category)
            intelligence_data = self.data_loader.get_market_intelligence_data(region)

            return {
                "trend_data": trend_data.to_dict("records") if not trend_data.empty else [],
                "timeseries_data": timeseries_data.to_dict("records") if not timeseries_data.empty else [],
                "intelligence_data": intelligence_data.to_dict("records") if not intelligence_data.empty else [],
                "summary": {
                    "total_trend_records": len(trend_data),
                    "total_timeseries_records": len(timeseries_data),
                    "total_intelligence_records": len(intelligence_data),
                },
            }
        except Exception as e:
            return {"error": f"Failed to analyze market trend: {str(e)}"}

    def get_echarts_config(self, product_category: Optional[str] = None, title: str = "Home Appliances Market Analysis") -> Dict:
        """
        Generate ECharts configuration for stacked bar chart
        """
        try:
            return self.data_loader.get_echarts_config(product_category, title)
        except Exception as e:
            return {"error": f"Failed to generate ECharts config: {str(e)}"}
