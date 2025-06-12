import sys
import json
import pandas as pd
from sklearn.cluster import KMeans

def main():
    data = json.load(sys.stdin)
    df = pd.DataFrame(data)

    required_cols = ['amount', 'category', 'type', 'transaction_date']
    missing_cols = [col for col in required_cols if col not in df.columns]

    if missing_cols:
        print(json.dumps({
            "behavior": "Unknown",
            "description": f"Missing required fields: {', '.join(missing_cols)}"
        }))
        return

    df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
    df = df.dropna(subset=['amount'])

    essential = ['Rent', 'Utilities', 'Food', 'Transport']
    non_essential = ['Shopping', 'Entertainment', 'Subscriptions', 'Other']

    total_income = df[df['type'] == 'income']['amount'].sum()
    total_expense = df[df['type'] == 'expense']['amount'].sum()

    essential_spend = df[df['category'].isin(essential)]['amount'].sum()
    non_essential_spend = df[df['category'].isin(non_essential)]['amount'].sum()

    df['transaction_date'] = pd.to_datetime(df['transaction_date']).dt.tz_localize(None)
    df['month'] = df['transaction_date'].dt.to_period('M').dt.to_timestamp()

    avg_tx_per_month = df.groupby('month').size().mean()

    features = pd.DataFrame([{
        'ess_ratio': essential_spend / total_expense if total_expense > 0 else 0,
        'noness_ratio': non_essential_spend / total_expense if total_expense > 0 else 0,
        'spend_income_ratio': total_expense / total_income if total_income > 0 else 0,
        'tx_freq': avg_tx_per_month
    }])

    # Check if we have enough rows to cluster
    if len(features) < 3:
        print(json.dumps({
            "behavior": "Unknown",
            "description": "Not enough transaction categories to determine behavior."
        }))
        return

    model = KMeans(n_clusters=3, random_state=42)
    model.fit(features)
    label = model.labels_[0]

    behavior_map = {
        0: ('Saver', 'Low expenses, high income ratio.'),
        1: ('Balanced', 'Balanced spending and saving behavior.'),
        2: ('Spender', 'High non-essential spending and frequent transactions.')
    }

    behavior, description = behavior_map.get(label, ("Unknown", "Pattern not recognized."))

    print(json.dumps({
        "behavior": behavior,
        "description": description
    }))

if __name__ == '__main__':
    main()
