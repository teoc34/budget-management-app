import sys
import json
import pandas as pd

def main():
    data = json.load(sys.stdin)
    df = pd.DataFrame(data)

    required_cols = ['amount', 'category', 'transaction_type', 'transaction_date']
    missing_cols = [col for col in required_cols if col not in df.columns]

    if missing_cols:
        print(json.dumps({
            "behavior": "Unknown",
            "description": f"Missing required fields: {', '.join(missing_cols)}"
        }))
        return

    df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
    df = df.dropna(subset=['amount'])

    # Normalize categories
    df['category'] = df['category'].str.lower()

    # Define essential and non-essential groups
    essential = ['rent', 'utilities', 'food', 'groceries', 'transport', 'medical']
    non_essential = ['shopping', 'entertainment', 'subscriptions', 'other', 'activities', 'travel', 'beauty', 'gifts']

    total_income = df[df['transaction_type'] == 'income']['amount'].sum()
    total_expense = df[df['transaction_type'] == 'expense']['amount'].sum()

    essential_spend = df[df['category'].isin(essential)]['amount'].sum()
    non_essential_spend = df[df['category'].isin(non_essential)]['amount'].sum()

    if total_expense == 0:
        behavior = "Unknown"
        description = "No expenses recorded."
    elif essential_spend / total_expense > 0.6:
        behavior = "Saver"
        description = "Most of your expenses go to essentials."
    elif non_essential_spend / total_expense > 0.5:
        behavior = "Spender"
        description = "You spend more on non-essential items."
    else:
        behavior = "Balanced"
        description = "You have a balanced spending behavior."

    print(json.dumps({
        "behavior": behavior,
        "description": description
    }))

if __name__ == '__main__':
    main()
