# scripts/ml-predict-category.py
import sys
import json
import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np

def main():
    data = json.load(sys.stdin)
    df = pd.DataFrame(data)

    if not {'category', 'amount', 'transaction_date'}.issubset(df.columns):
        print(json.dumps([]))
        return

    df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    df['month'] = df['transaction_date'].dt.tz_localize(None).dt.to_period('M').dt.to_timestamp()
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
    df = df.dropna(subset=['amount'])

    results = []
    for category in df['category'].unique():
        df_cat = df[df['category'] == category].groupby('month')['amount'].sum().reset_index()
        if len(df_cat) < 2:
            continue
        df_cat['month_num'] = np.arange(len(df_cat))
        X = df_cat[['month_num']]
        y = df_cat['amount']
        model = LinearRegression().fit(X, y)
        next_month = pd.DataFrame({'month_num': [len(df_cat)]})
        predicted = model.predict(next_month)[0]
        last = df_cat['amount'].iloc[-1]
        change = (predicted - last) / last * 100 if last != 0 else 0
        results.append({
            "category": category,
            "next_month": round(predicted, 2),
            "change": f"{'+' if change >= 0 else ''}{round(change, 1)}%"
        })

    print(json.dumps(results))

if __name__ == '__main__':
    main()
