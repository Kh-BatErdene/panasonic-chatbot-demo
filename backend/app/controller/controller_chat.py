import uuid
from typing import Dict, Optional
from datetime import datetime
from app.common.openai import OpenAIHandler
from app.schemas.schema_chat import ChatQuestionRequest, ChatQuestionResponse, ChatAnswerRequest, ChatAnswerResponse
from app.config import logger


class ChatController:
    def __init__(self):
        self.openai_handler = OpenAIHandler()
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

    def get_echarts_config(self, product_category: Optional[str] = None, title: str = "Home Appliances Market Analysis") -> Dict:
        """
        Generate ECharts configuration for stacked bar chart
        """
        try:
            return self.openai_handler.get_echarts_config(product_category, title)
        except Exception as e:
            logger.write_error(f"Error generating ECharts config: {str(e)}")
            raise Exception(f"Failed to generate ECharts config: {str(e)}") from e
