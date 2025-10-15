import pandas as pd
import os
import re


def standardize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """
    Convert column names to lowercase and replace spaces with underscores.
    """
    # Create a mapping of old column names to new standardized names
    column_mapping = {}

    for col in df.columns:
        # Convert to lowercase
        new_col = col.lower()
        # Replace spaces with underscores
        new_col = re.sub(r"\s+", "_", new_col)
        # Replace special characters with underscores
        new_col = re.sub(r"[^\w]", "_", new_col)
        # Remove multiple consecutive underscores
        new_col = re.sub(r"_+", "_", new_col)
        # Remove leading/trailing underscores
        new_col = new_col.strip("_")

        column_mapping[col] = new_col

    return df.rename(columns=column_mapping)


def separate_category_subcategory(df: pd.DataFrame, category_col: str) -> pd.DataFrame:
    """
    Separate category and subcategory from a combined column.
    Expected format: "Category – Subcategory" or "Category - Subcategory"
    """
    df = df.copy()

    # Create new columns for category and subcategory
    df["category"] = ""
    df["sub_category"] = ""

    for idx, row in df.iterrows():
        category_value = str(row[category_col])

        # Check for different separator patterns
        if " – " in category_value:  # En dash
            parts = category_value.split(" – ", 1)
        elif " - " in category_value:  # Regular dash
            parts = category_value.split(" - ", 1)
        elif "–" in category_value:  # En dash without spaces
            parts = category_value.split("–", 1)
        elif "-" in category_value:  # Regular dash without spaces
            parts = category_value.split("-", 1)
        else:
            # If no separator found, treat as category only
            parts = [category_value.strip(), ""]

        # Clean up the parts
        df.at[idx, "category"] = parts[0].strip()
        df.at[idx, "sub_category"] = parts[1].strip() if len(parts) > 1 else ""

    # Remove the original combined column
    df = df.drop(columns=[category_col])

    return df


def process_csv_file(file_path: str, output_path: str = None) -> pd.DataFrame:
    """
    Process a single CSV file to separate category/subcategory and standardize column names.
    """
    print(f"Processing file: {file_path}")

    # Read the CSV file
    df = pd.read_csv(file_path)

    print(f"Original columns: {list(df.columns)}")

    # Check if Product_Category column exists and needs to be separated
    if "Product_Category" in df.columns:
        print("Found Product_Category column, separating category and subcategory...")
        df = separate_category_subcategory(df, "Product_Category")

    # Standardize all column names
    df = standardize_column_names(df)

    print(f"New columns: {list(df.columns)}")

    # Save the processed file
    if output_path is None:
        # Create backup of original file
        backup_path = file_path.replace(".csv", "_original.csv")
        if not os.path.exists(backup_path):
            os.rename(file_path, backup_path)
            print(f"Original file backed up as: {backup_path}")

        # Save processed file with original name
        output_path = file_path

    df.to_csv(output_path, index=False)
    print(f"Processed file saved as: {output_path}")

    return df


def main():
    """
    Main function to process all data files.
    """
    data_dir = "/Users/ddam-m0098/Desktop/panasonic-demo/backend/app/data"

    # List of CSV files to process
    csv_files = ["market_intelligence_2015_2028.csv", "market_trend_product_country_2015_2028.csv", "timeseries_subcategory_region_2015_2035.csv"]

    processed_files = []

    for csv_file in csv_files:
        file_path = os.path.join(data_dir, csv_file)

        if os.path.exists(file_path):
            try:
                df = process_csv_file(file_path)
                processed_files.append(csv_file)
                print(f"Successfully processed: {csv_file}")
                print("-" * 50)
            except Exception as e:
                print(f"Error processing {csv_file}: {str(e)}")
                print("-" * 50)
        else:
            print(f"File not found: {file_path}")

    print(f"\nProcessing complete! Processed {len(processed_files)} files:")
    for file in processed_files:
        print(f"  - {file}")


if __name__ == "__main__":
    main()
