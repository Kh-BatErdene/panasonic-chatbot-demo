import pandas as pd
import os
from typing import Dict, List, Optional, Any
from app.config import logger


class DataLoader:
    """
    Data loader service for handling CSV files containing market intelligence data
    """

    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
        self.market_intelligence_data = None
        self.market_trend_data = None
        self.timeseries_data = None

    def load_all_data(self) -> Dict[str, pd.DataFrame]:
        """
        Load all CSV files into memory
        """
        try:
            # Load market intelligence data
            intelligence_path = os.path.join(self.data_dir, "market_intelligence_2015_2028.csv")
            self.market_intelligence_data = pd.read_csv(intelligence_path)

            # Load market trend data
            trend_path = os.path.join(self.data_dir, "market_trend_product_country_2015_2028.csv")
            self.market_trend_data = pd.read_csv(trend_path)

            # Load timeseries data
            timeseries_path = os.path.join(self.data_dir, "timeseries_subcategory_region_2015_2035.csv")
            self.timeseries_data = pd.read_csv(timeseries_path)

            logger.write_msg("All data files loaded successfully")

            return {"market_intelligence": self.market_intelligence_data, "market_trend": self.market_trend_data, "timeseries": self.timeseries_data}

        except Exception as e:
            logger.write_error(f"Error loading data files: {str(e)}")
            raise Exception(f"Failed to load data: {str(e)}") from e

    def get_available_regions(self) -> List[str]:
        """
        Get list of available regions from all datasets
        """
        regions = set()

        if self.market_intelligence_data is not None:
            regions.update(self.market_intelligence_data["region"].unique())

        if self.market_trend_data is not None:
            regions.update(self.market_trend_data["region"].unique())

        if self.timeseries_data is not None:
            regions.update(self.timeseries_data["region"].unique())

        # Remove 'region' header if it exists
        regions.discard("region")
        return sorted(list(regions))

    def get_available_product_categories(self) -> List[str]:
        """
        Get list of available product categories
        """
        categories = set()

        if self.market_trend_data is not None:
            categories.update(self.market_trend_data["category"].unique())

        if self.timeseries_data is not None:
            categories.update(self.timeseries_data["category"].unique())

        # Remove 'category' header if it exists
        categories.discard("category")
        return sorted(list(categories))

    def get_available_subcategories(self) -> List[str]:
        """
        Get list of available product subcategories
        """
        subcategories = set()

        if self.market_trend_data is not None:
            subcategories.update(self.market_trend_data["sub_category"].unique())

        if self.timeseries_data is not None:
            subcategories.update(self.timeseries_data["sub_category"].unique())

        # Remove 'sub_category' header if it exists and empty values
        subcategories.discard("sub_category")
        subcategories.discard("")
        return sorted(list(subcategories))

    def get_market_intelligence_data(self, region: Optional[str] = None, year: Optional[int] = None) -> pd.DataFrame:
        """
        Get market intelligence data filtered by region and/or year
        """
        if self.market_intelligence_data is None:
            self.load_all_data()

        data = self.market_intelligence_data.copy()

        if region:
            data = data[data["region"] == region]

        if year:
            data = data[data["year"] == year]

        return data

    def get_market_trend_data(
        self, region: Optional[str] = None, product_category: Optional[str] = None, year: Optional[int] = None, sub_category: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Get market trend data filtered by region, product category, subcategory, and/or year
        """
        if self.market_trend_data is None:
            self.load_all_data()

        data = self.market_trend_data.copy()

        if region:
            data = data[data["region"] == region]

        if product_category:
            data = data[data["category"] == product_category]

        if sub_category:
            data = data[data["sub_category"] == sub_category]

        if year:
            data = data[data["year"] == year]

        return data

    def get_timeseries_data(
        self, region: Optional[str] = None, product_category: Optional[str] = None, year: Optional[int] = None, sub_category: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Get timeseries data filtered by region, product category, subcategory, and/or year
        """
        if self.timeseries_data is None:
            self.load_all_data()

        data = self.timeseries_data.copy()

        if region:
            data = data[data["region"] == region]

        if product_category:
            data = data[data["category"] == product_category]

        if sub_category:
            data = data[data["sub_category"] == sub_category]

        if year:
            data = data[data["year"] == year]

        return data

    def get_data_summary(self) -> Dict[str, Any]:
        """
        Get a summary of all available data
        """
        if self.market_intelligence_data is None:
            self.load_all_data()

        return {
            "market_intelligence": {
                "total_records": len(self.market_intelligence_data),
                "years": sorted(self.market_intelligence_data["year"].unique().tolist()),
                "regions": sorted(self.market_intelligence_data["region"].unique().tolist()),
                "columns": list(self.market_intelligence_data.columns),
            },
            "market_trend": {
                "total_records": len(self.market_trend_data),
                "years": sorted(self.market_trend_data["year"].unique().tolist()),
                "regions": sorted(self.market_trend_data["region"].unique().tolist()),
                "product_categories": sorted(self.market_trend_data["category"].unique().tolist()),
                "subcategories": sorted(self.market_trend_data["sub_category"].unique().tolist()),
                "columns": list(self.market_trend_data.columns),
            },
            "timeseries": {
                "total_records": len(self.timeseries_data),
                "years": sorted(self.timeseries_data["year"].unique().tolist()),
                "regions": sorted(self.timeseries_data["region"].unique().tolist()),
                "product_categories": sorted(self.timeseries_data["category"].unique().tolist()),
                "subcategories": sorted(self.timeseries_data["sub_category"].unique().tolist()),
                "columns": list(self.timeseries_data.columns),
            },
        }

    def search_data(self, query: str, limit: int = 10) -> Dict[str, pd.DataFrame]:
        """
        Search across all datasets for records matching the query
        """
        if self.market_intelligence_data is None:
            self.load_all_data()

        results = {}
        query_lower = query.lower()

        # Search in market intelligence data
        intelligence_mask = self.market_intelligence_data["region"].str.lower().str.contains(query_lower, na=False)
        if intelligence_mask.any():
            results["market_intelligence"] = self.market_intelligence_data[intelligence_mask].head(limit)

        # Search in market trend data
        trend_mask = (
            self.market_trend_data["region"].str.lower().str.contains(query_lower, na=False)
            | self.market_trend_data["category"].str.lower().str.contains(query_lower, na=False)
            | self.market_trend_data["sub_category"].str.lower().str.contains(query_lower, na=False)
        )
        if trend_mask.any():
            results["market_trend"] = self.market_trend_data[trend_mask].head(limit)

        # Search in timeseries data
        timeseries_mask = (
            self.timeseries_data["region"].str.lower().str.contains(query_lower, na=False)
            | self.timeseries_data["category"].str.lower().str.contains(query_lower, na=False)
            | self.timeseries_data["sub_category"].str.lower().str.contains(query_lower, na=False)
        )
        if timeseries_mask.any():
            results["timeseries"] = self.timeseries_data[timeseries_mask].head(limit)

        return results

    def prepare_stacked_bar_chart_data(self, product_category: Optional[str] = None, years: Optional[List[int]] = None) -> Dict[str, Any]:
        """
        Prepare data for ECharts stacked bar chart showing market size by region over time
        """
        try:
            if self.market_trend_data is None:
                self.load_all_data()

            # Filter data by product category if specified
            data = self.market_trend_data.copy()
            if product_category:
                data = data[data["category"] == product_category]

            # Filter by years if specified
            if years:
                data = data[data["year"].isin(years)]
            else:
                # Default to 2018-2030 range
                data = data[data["year"].between(2018, 2030)]

            # Group by year and region, sum market values
            chart_data = data.groupby(["year", "region"])["market_value_usd_billions"].sum().reset_index()

            # Define region mapping to standard regions
            region_mapping = {
                "USA": "North America",
                "Canada": "North America",
                "Germany": "Europe",
                "France": "Europe",
                "United Kingdom": "Europe",
                "Italy": "Europe",
                "Spain": "Europe",
                "Netherlands": "Europe",
                "Sweden": "Europe",
                "Norway": "Europe",
                "Denmark": "Europe",
                "Finland": "Europe",
                "Austria": "Europe",
                "Belgium": "Europe",
                "Switzerland": "Europe",
                "Poland": "Europe",
                "Czech Republic": "Europe",
                "Hungary": "Europe",
                "Greece": "Europe",
                "Portugal": "Europe",
                "Ireland": "Europe",
                "Luxembourg": "Europe",
                "China": "Asia Pacific",
                "Japan": "Asia Pacific",
                "South Korea": "Asia Pacific",
                "India": "Asia Pacific",
                "Australia": "Asia Pacific",
                "Singapore": "Asia Pacific",
                "Thailand": "Asia Pacific",
                "Malaysia": "Asia Pacific",
                "Indonesia": "Asia Pacific",
                "Philippines": "Asia Pacific",
                "Vietnam": "Asia Pacific",
                "Taiwan": "Asia Pacific",
                "Brazil": "Latin America",
                "Mexico": "Latin America",
                "Argentina": "Latin America",
                "Chile": "Latin America",
                "Colombia": "Latin America",
                "Peru": "Latin America",
                "UAE": "MEA",
                "Saudi Arabia": "MEA",
                "South Africa": "MEA",
                "Egypt": "MEA",
                "Turkey": "MEA",
                "Israel": "MEA",
            }

            # Map regions to standard regions
            chart_data["Standard_Region"] = chart_data["region"].map(region_mapping).fillna("Other")

            # Group by year and standard region
            chart_data = chart_data.groupby(["year", "Standard_Region"])["market_value_usd_billions"].sum().reset_index()

            # Pivot to get regions as columns
            pivot_data = chart_data.pivot(index="year", columns="Standard_Region", values="market_value_usd_billions").fillna(0)

            # Ensure we have all standard regions
            standard_regions = ["North America", "Europe", "Asia Pacific", "Latin America", "MEA"]
            for region in standard_regions:
                if region not in pivot_data.columns:
                    pivot_data[region] = 0

            # Reorder columns
            pivot_data = pivot_data[standard_regions]

            # Prepare years list
            years_list = sorted(pivot_data.index.tolist())
            years_str = [str(year) for year in years_list]

            # Prepare series data
            series_data = []
            colors = {"North America": "#4A90E2", "Europe": "#7ED321", "Asia Pacific": "#F5A623", "Latin America": "#D0021B", "MEA": "#9013FE"}

            for region in standard_regions:
                series_data.append(
                    {"name": region, "type": "bar", "stack": "total", "data": pivot_data[region].tolist(), "itemStyle": {"color": colors[region]}}
                )

            return {"years": years_str, "series": series_data, "regions": standard_regions, "total_market_values": pivot_data.sum(axis=1).tolist()}

        except Exception as e:
            logger.write_error(f"Error preparing stacked bar chart data: {str(e)}")
            return {"error": f"Failed to prepare chart data: {str(e)}"}

    def get_echarts_config(self, product_category: Optional[str] = None, title: str = "Home Appliances Market Analysis") -> Dict[str, Any]:
        """
        Generate complete ECharts configuration for stacked bar chart
        """
        try:
            chart_data = self.prepare_stacked_bar_chart_data(product_category)

            if "error" in chart_data:
                return chart_data

            config = {
                "title": {"text": title, "subtext": f"Market Size by Region, {chart_data['years'][0]}-{chart_data['years'][-1]}", "left": "center"},
                "tooltip": {"trigger": "axis", "axisPointer": {"type": "shadow"}},
                "legend": {"data": chart_data["regions"], "bottom": "0%"},
                "grid": {"left": "3%", "right": "4%", "bottom": "15%", "top": "15%", "containLabel": True},
                "xAxis": {"type": "category", "data": chart_data["years"]},
                "yAxis": {"type": "value", "name": "Market Size (US$B)", "axisLabel": {"formatter": "${value}B"}},
                "series": chart_data["series"],
            }

            return {"chartConfig": config}

        except Exception as e:
            logger.write_error(f"Error generating ECharts config: {str(e)}")
            return {"error": f"Failed to generate chart config: {str(e)}"}
