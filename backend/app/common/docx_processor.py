import os
import re
from typing import Dict, List, Optional, Any
from docx import Document
from app.config import logger


class DocxProcessor:
    """
    DOCX processor service for handling DOCX files containing market intelligence data
    """

    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
        self.processed_documents = {}
        self.available_regions = []
        self.available_categories = []
        self.available_subcategories = []

    def load_all_documents(self) -> Dict[str, Dict]:
        """
        Load all DOCX files from region-specific folders
        """
        try:
            regions = ["india_dataset", "singapore_dataset", "vietnam_dataset"]

            for region in regions:
                region_path = os.path.join(self.data_dir, region)
                if os.path.exists(region_path):
                    self.processed_documents[region] = self._process_region_documents(region_path)
                    self.available_regions.append(region.replace("_dataset", "").title())

            # Extract categories and subcategories from processed documents
            self._extract_categories()

            logger.write_msg("All DOCX documents loaded successfully")
            return self.processed_documents

        except Exception as e:
            logger.write_error(f"Error loading DOCX documents: {str(e)}")
            raise Exception(f"Failed to load DOCX documents: {str(e)}") from e

    def _process_region_documents(self, region_path: str) -> Dict[str, str]:
        """
        Process all DOCX files in a region folder
        """
        documents = {}

        for filename in os.listdir(region_path):
            if filename.endswith(".docx"):
                file_path = os.path.join(region_path, filename)
                try:
                    content = self._extract_docx_content(file_path)
                    documents[filename] = content
                except Exception as e:
                    logger.write_error(f"Error processing {filename}: {str(e)}")
                    continue

        return documents

    def _extract_docx_content(self, file_path: str) -> str:
        """
        Extract text content from DOCX file
        """
        try:
            doc = Document(file_path)
            content = []

            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    content.append(paragraph.text.strip())

            return "\n".join(content)
        except Exception as e:
            logger.write_error(f"Error extracting content from {file_path}: {str(e)}")
            return ""

    def _extract_categories(self):
        """
        Set static Japanese categories and subcategories based on document analysis
        """
        # Static Japanese categories only
        self.available_categories = [
            "冷蔵庫",  # Refrigerator
            "洗濯機",  # Washing Machine
            "ルームエアコン",  # Room Air Conditioner
            "電子レンジ",  # Microwave
            "炊飯器",  # Rice Cooker
            "掃除機",  # Vacuum Cleaner
            "ドライヤー",  # Hair Dryer
            "アイロン",  # Iron
            "扇風機",  # Fan
            "加湿器",  # Humidifier
            "小型キッチン家電"  # Small Kitchen Appliances
        ]
        
        # Static Japanese subcategories only
        self.available_subcategories = [
            "9-10kg",  # for washing machines
            "7-10kg",  # for washing machines
            "300-400L/2ドア",  # for refrigerators
            "1.0-1.5HP インバーター",  # for air conditioners
            "1-1.5HP",  # for air conditioners
            "中型",  # Medium-sized
            "大型",  # Large-sized
            "小型",  # Small-sized
            "フロントローディング",  # Front-loading
            "トップローディング",  # Top-loading
            "インバーター",  # Inverter
            "非インバーター",  # Non-inverter
            "スマート",  # Smart
            "省エネ",  # Energy-saving
            "大容量",  # Large capacity
            "コンパクト",  # Compact
            "プレミアム",  # Premium
            "エコノミー",  # Economy
            "ミッドレンジ"  # Mid-range
        ]

    def get_available_regions(self) -> List[str]:
        """
        Get list of available regions
        """
        if not self.available_regions:
            self.load_all_documents()
        # Add "全て" (All) option at the end
        return self.available_regions + ["全て"]

    def get_available_categories(self) -> List[str]:
        """
        Get list of available product categories
        """
        if not self.available_categories:
            self.load_all_documents()
        return self.available_categories

    def get_available_subcategories(self) -> List[str]:
        """
        Get list of available product subcategories
        """
        if not self.available_subcategories:
            self.load_all_documents()
        return self.available_subcategories

    def search_documents(self, query: str, region: Optional[str] = None, limit: int = 5) -> Dict[str, str]:
        """
        Search across documents for content matching the query
        """
        if not self.processed_documents:
            self.load_all_documents()

        results = {}
        query_lower = query.lower()

        for region_name, docs in self.processed_documents.items():
            if region and region.lower() not in region_name.lower():
                continue

            for doc_name, content in docs.items():
                if query_lower in content.lower():
                    # Extract relevant context around the query
                    context = self._extract_context(content, query_lower)
                    results[f"{region_name}/{doc_name}"] = context

                    if len(results) >= limit:
                        break

            if len(results) >= limit:
                break

        return results

    def _extract_context(self, content: str, query: str, context_length: int = 200) -> str:
        """
        Extract context around the query match
        """
        query_pos = content.lower().find(query)
        if query_pos == -1:
            return content[:context_length] + "..."

        start = max(0, query_pos - context_length // 2)
        end = min(len(content), query_pos + len(query) + context_length // 2)

        return content[start:end] + "..."

    def get_region_documents(self, region: str) -> Dict[str, str]:
        """
        Get all documents for a specific region
        """
        if not self.processed_documents:
            self.load_all_documents()

        region_key = f"{region.lower()}_dataset"
        return self.processed_documents.get(region_key, {})

    def get_document_summary(self) -> Dict[str, Any]:
        """
        Get a summary of all available documents
        """
        if not self.processed_documents:
            self.load_all_documents()

        summary = {}
        for region, docs in self.processed_documents.items():
            summary[region] = {
                "total_documents": len(docs),
                "document_names": list(docs.keys()),
                "total_content_length": sum(len(content) for content in docs.values()),
            }

        return {
            "regions": self.available_regions,
            "categories": self.available_categories,
            "subcategories": self.available_subcategories,
            "document_summary": summary,
        }

    def analyze_market_data(self, region: Optional[str] = None, category: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze market data from documents based on region and category
        """
        if not self.processed_documents:
            self.load_all_documents()

        # Get relevant documents
        if region:
            docs = self.get_region_documents(region)
        else:
            docs = {}
            for region_docs in self.processed_documents.values():
                docs.update(region_docs)

        # Extract structured data based on the required keys
        analysis = {
            "Population & Households": self._extract_key_data(docs, ["population", "household", "demographic", "family"]),
            "Society & Economy": self._extract_key_data(docs, ["economy", "society", "social", "economic", "gdp", "income"]),
            "Science & Technology": self._extract_key_data(docs, ["technology", "innovation", "digital", "smart", "iot", "ai"]),
            "City & Nature": self._extract_key_data(docs, ["city", "urban", "nature", "environment", "sustainability", "green"]),
        }

        return analysis

    def _extract_key_data(self, docs: Dict[str, str], keywords: List[str]) -> str:
        """
        Extract data related to specific keywords from documents
        """
        relevant_content = []

        for doc_name, content in docs.items():
            for keyword in keywords:
                if keyword.lower() in content.lower():
                    # Find sentences containing the keyword
                    sentences = content.split(".")
                    for sentence in sentences:
                        if keyword.lower() in sentence.lower():
                            relevant_content.append(sentence.strip())
                            break

        return ". ".join(relevant_content[:3])  # Return top 3 relevant sentences

    def generate_chart_data(self, region: Optional[str] = None, category: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate chart data based on document analysis organized by regions
        """
        analysis = self.analyze_market_data(region, category)

        # Create mock data for chart visualization organized by regions
        # In a real implementation, this would extract actual numerical data
        chart_data = {
            "North America": [120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180],
            "Europe": [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160],
            "Asia Pacific": [200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440],
            "Latin America": [60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120],
            "MEA": [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
        }

        return {
            "analysis": analysis,
            "chart_data": chart_data,
            "years": ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030"],
            "title": f"Home Appliances Market Size: {category or 'All Categories'} by Region",
            "subtitle": "Market Size by Region, 2018-2030"
        }

    def extract_competitive_analysis(self, region: Optional[str] = None) -> Dict[str, Any]:
        """
        Extract competitive product portfolio and price architecture data from documents
        """
        if not self.processed_documents:
            self.load_all_documents()

        # Get relevant documents
        if region:
            docs = self.get_region_documents(region)
        else:
            docs = {}
            for region_docs in self.processed_documents.values():
                docs.update(region_docs)

        competitive_data = {
            "categories": {},
            "price_ranges": {},
            "brands": set(),
            "regions": set(),
            "market_data": {}
        }

        for doc_name, content in docs.items():
            # Look for competitive analysis tables
            if "競合" in content or "competitive" in content.lower() or "portfolio" in content.lower():
                # Extract category and subcategory information
                category_matches = re.findall(r"([^（]+)（([^）]+)）", content)
                
                for category, subcategory in category_matches:
                    clean_category = category.strip()
                    clean_subcategory = subcategory.strip()
                    
                    if clean_category not in competitive_data["categories"]:
                        competitive_data["categories"][clean_category] = []
                    
                    if clean_subcategory not in competitive_data["categories"][clean_category]:
                        competitive_data["categories"][clean_category].append(clean_subcategory)
                
                # Extract brand information
                brands = ["Samsung", "LG", "Panasonic", "Daikin", "Casper", "Hitachi", "Sharp", "Toshiba"]
                for brand in brands:
                    if brand in content:
                        competitive_data["brands"].add(brand)
                
                # Extract price information
                price_patterns = [
                    r"(\d+[-–]\d+)\s*百万",  # Japanese price format like "10-12 百万"
                    r"(\d+[-–]\d+)\s*million",  # English price format
                    r"(\$\d+[-–]\$\d+)",  # Dollar format
                ]
                
                for pattern in price_patterns:
                    price_matches = re.findall(pattern, content)
                    for price_match in price_matches:
                        if "price_ranges" not in competitive_data:
                            competitive_data["price_ranges"] = set()
                        competitive_data["price_ranges"].add(price_match)

            # Extract market data tables (like the CAGR table you showed)
            if "CAGR" in content or "市場規模" in content or "TAM" in content:
                market_data = self._extract_market_data_table(content)
                if market_data:
                    competitive_data["market_data"][doc_name] = market_data

        # Convert sets to lists for JSON serialization
        competitive_data["brands"] = sorted(list(competitive_data["brands"]))
        competitive_data["price_ranges"] = sorted(list(competitive_data["price_ranges"]))

        return competitive_data

    def _extract_market_data_table(self, content: str) -> Dict[str, Any]:
        """
        Extract market data from tables like the CAGR table
        """
        market_data = {
            "categories": {},
            "total_market": {},
            "sources": set()
        }
        
        # Look for market size patterns
        market_size_patterns = [
            r"(\d+\.?\d*)\s*[Bb]illion",  # Billion format
            r"(\d+\.?\d*)\s*億",  # Japanese billion format
            r"(\d+\.?\d*)\s*百万",  # Japanese million format
        ]
        
        # Look for CAGR patterns
        cagr_patterns = [
            r"(\d+\.?\d*)\s*%",  # Percentage format
            r"CAGR[:\s]*(\d+\.?\d*)",  # CAGR specific
        ]
        
        # Look for category names
        category_patterns = [
            r"冷蔵", r"洗濯", r"RAC", r"ルーム", r"エアコン", r"小型キッチン",
            r"refrigerator", r"washing", r"air conditioner", r"kitchen"
        ]
        
        # Extract data sources
        source_patterns = [
            r"TechSci", r"IMARC", r"Markets&Data", r"GVR", r"Grand View",
            r"6W", r"Credence", r"Euromonitor", r"Statista"
        ]
        
        for source in source_patterns:
            if source in content:
                market_data["sources"].add(source)
        
        # Convert set to list
        market_data["sources"] = list(market_data["sources"])
        
        return market_data if market_data["sources"] else None

    def get_category_subcategory_mapping(self) -> Dict[str, List[str]]:
        """
        Get static Japanese mapping of categories to their subcategories
        """
        return {
            "洗濯機": ["9-10kg", "7-10kg", "フロントローディング", "トップローディング", "大容量", "コンパクト"],
            "冷蔵庫": ["300-400L/2ドア", "中型", "大型", "小型", "省エネ", "スマート"],
            "ルームエアコン": ["1.0-1.5HP インバーター", "1-1.5HP", "インバーター", "非インバーター", "省エネ"],
            "電子レンジ": ["小型", "中型", "大型", "スマート", "省エネ"],
            "炊飯器": ["小型", "中型", "大型", "スマート", "省エネ"],
            "掃除機": ["小型", "中型", "大型", "スマート", "省エネ"],
            "ドライヤー": ["小型", "中型", "大型", "スマート", "省エネ"],
            "アイロン": ["小型", "中型", "大型", "スマート", "省エネ"],
            "扇風機": ["小型", "中型", "大型", "スマート", "省エネ"],
            "加湿器": ["小型", "中型", "大型", "スマート", "省エネ"],
            "小型キッチン家電": ["小型", "中型", "大型", "スマート", "省エネ"]
        }
