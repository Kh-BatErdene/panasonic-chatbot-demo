import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
import time
from app.config import logger


class WebSearchHandler:
    """
    Web search handler for gathering additional market intelligence data
    """

    def __init__(self):
        self.search_engines = {"google": "https://www.google.com/search?q=", "bing": "https://www.bing.com/search?q="}
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

    def search_market_data(
        self, query: str, region: Optional[str] = None, product_category: Optional[str] = None, max_results: int = 5
    ) -> Dict[str, List[Dict]]:
        """
        Search for market data related to the query, region, and product category
        """
        try:
            # Construct search query
            search_query = self._construct_search_query(query, region, product_category)

            # Perform web search
            search_results = self._perform_search(search_query, max_results)

            # Extract and process content
            processed_results = self._process_search_results(search_results)

            return {
                "query": search_query,
                "region": region,
                "product_category": product_category,
                "results": processed_results,
                "total_results": len(processed_results),
            }

        except Exception as e:
            logger.write_error(f"Error in web search: {str(e)}")
            return {"error": f"Web search failed: {str(e)}"}

    def _construct_search_query(self, query: str, region: Optional[str] = None, product_category: Optional[str] = None) -> str:
        """
        Construct a comprehensive search query
        """
        search_terms = [query]

        if region:
            search_terms.append(f"market {region}")

        if product_category:
            search_terms.append(f"{product_category} appliances")

        # Add market intelligence specific terms
        search_terms.extend(["market analysis", "market report", "market trends", "market size", "market forecast"])

        return " ".join(search_terms)

    def _perform_search(self, query: str, max_results: int) -> List[Dict]:
        """
        Perform web search and return results
        """
        results = []

        try:
            # Use Google search (simplified implementation)
            search_url = f"{self.search_engines['google']}{query.replace(' ', '+')}"

            response = requests.get(search_url, headers=self.headers, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, "html.parser")

            # Extract search results (simplified parsing)
            search_results = soup.find_all("div", class_="g")[:max_results]

            for result in search_results:
                try:
                    title_elem = result.find("h3")
                    link_elem = result.find("a")
                    snippet_elem = result.find("span", class_="aCOpRe")

                    if title_elem and link_elem:
                        results.append(
                            {
                                "title": title_elem.get_text().strip(),
                                "url": link_elem.get("href", ""),
                                "snippet": snippet_elem.get_text().strip() if snippet_elem else "",
                                "source": "Google Search",
                            }
                        )
                except Exception as e:
                    logger.write_error(f"Error parsing search result: {str(e)}")
                    continue

            # Add delay to be respectful to search engines
            time.sleep(1)

        except Exception as e:
            logger.write_error(f"Error performing web search: {str(e)}")

        return results

    def _process_search_results(self, results: List[Dict]) -> List[Dict]:
        """
        Process and enhance search results
        """
        processed_results = []

        for result in results:
            try:
                # Extract additional information from the snippet
                enhanced_result = {
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "snippet": result.get("snippet", ""),
                    "source": result.get("source", ""),
                    "relevance_score": self._calculate_relevance_score(result),
                    "extracted_keywords": self._extract_keywords(result.get("snippet", "")),
                    "category_classification": self._classify_content(result),
                }

                processed_results.append(enhanced_result)

            except Exception as e:
                logger.write_error(f"Error processing search result: {str(e)}")
                continue

        # Sort by relevance score
        processed_results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)

        return processed_results

    def _calculate_relevance_score(self, result: Dict) -> float:
        """
        Calculate relevance score based on content analysis
        """
        score = 0.0
        content = f"{result.get('title', '')} {result.get('snippet', '')}".lower()

        # Market intelligence keywords
        market_keywords = [
            "market",
            "analysis",
            "report",
            "trend",
            "forecast",
            "growth",
            "size",
            "value",
            "demand",
            "supply",
            "competition",
            "industry",
        ]

        # Panasonic specific keywords
        panasonic_keywords = [
            "panasonic",
            "home appliances",
            "consumer electronics",
            "smart home",
            "iot",
            "innovation",
            "technology",
            "sustainability",
        ]

        # Score based on keyword presence
        for keyword in market_keywords:
            if keyword in content:
                score += 0.1

        for keyword in panasonic_keywords:
            if keyword in content:
                score += 0.2

        return min(score, 1.0)  # Cap at 1.0

    def _extract_keywords(self, text: str) -> List[str]:
        """
        Extract relevant keywords from text
        """
        keywords = []
        text_lower = text.lower()

        # Define keyword categories
        keyword_categories = {
            "market_terms": ["market", "analysis", "report", "trend", "forecast"],
            "product_terms": ["appliance", "electronics", "home", "consumer", "smart"],
            "geographic_terms": ["asia", "europe", "america", "global", "regional"],
            "economic_terms": ["growth", "revenue", "profit", "investment", "economy"],
        }

        for category, terms in keyword_categories.items():
            for term in terms:
                if term in text_lower:
                    keywords.append(term)

        return list(set(keywords))  # Remove duplicates

    def _classify_content(self, result: Dict) -> str:
        """
        Classify content into one of the four required categories
        """
        content = f"{result.get('title', '')} {result.get('snippet', '')}".lower()

        # Classification keywords for each category
        category_keywords = {
            "Population & Households": ["population", "household", "demographic", "family", "urban", "rural"],
            "Society & Economy": ["economy", "society", "social", "economic", "gdp", "income", "employment"],
            "Science & Technology": ["technology", "innovation", "digital", "smart", "iot", "ai", "research"],
            "City & Nature": ["city", "urban", "nature", "environment", "sustainability", "green", "climate"],
        }

        scores = {}
        for category, keywords in category_keywords.items():
            score = sum(1 for keyword in keywords if keyword in content)
            scores[category] = score

        # Return category with highest score, or default
        if scores:
            return max(scores, key=scores.get)
        else:
            return "Society & Economy"  # Default category

    def generate_docx_content(self, search_results: Dict) -> str:
        """
        Generate DOCX-style content from web search results
        """
        try:
            content = "# Market Intelligence Report\n\n"
            content += f"**Search Query**: {search_results.get('query', '')}\n"
            content += f"**Region**: {search_results.get('region', 'Global')}\n"
            content += f"**Product Category**: {search_results.get('product_category', 'All Categories')}\n\n"

            content += "## Executive Summary\n\n"
            content += f"Based on web search analysis, {len(search_results.get('results', []))} relevant sources were identified "
            content += f"for {search_results.get('region', 'global')} market analysis.\n\n"

            # Organize results by category
            categories = {"Population & Households": [], "Society & Economy": [], "Science & Technology": [], "City & Nature": []}

            for result in search_results.get("results", []):
                category = result.get("category_classification", "Society & Economy")
                if category in categories:
                    categories[category].append(result)

            # Generate content for each category
            for category, results in categories.items():
                if results:
                    content += f"## {category}\n\n"
                    for i, result in enumerate(results[:3], 1):  # Top 3 results per category
                        content += f"### {i}. {result.get('title', '')}\n"
                        content += f"**Source**: {result.get('source', '')}\n"
                        content += f"**URL**: {result.get('url', '')}\n"
                        content += f"**Summary**: {result.get('snippet', '')}\n"
                        content += f"**Relevance Score**: {result.get('relevance_score', 0):.2f}\n"
                        content += f"**Keywords**: {', '.join(result.get('extracted_keywords', []))}\n\n"

            content += "## Key Insights\n\n"
            content += "- Market intelligence gathered from multiple web sources\n"
            content += "- Analysis organized by key market categories\n"
            content += "- Relevance scoring applied to prioritize information\n"
            content += "- Ready for integration with existing DOCX analysis\n\n"

            return content

        except Exception as e:
            logger.write_error(f"Error generating DOCX content: {str(e)}")
            return f"Error generating content: {str(e)}"
