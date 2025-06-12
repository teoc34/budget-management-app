import sys
import json
import pandas as pd

def main():
    data = json.load(sys.stdin)
    df = pd.DataFrame(data)

    df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
    df = df.dropna(subset=['amount'])

    # Exclude income
    df = df[df['type'] != 'income']

    Q1 = df['amount'].quantile(0.25)
    Q3 = df['amount'].quantile(0.75)
    IQR = Q3 - Q1

    threshold_low = Q1 - 1.5 * IQR
    threshold_high = Q3 + 1.5 * IQR

    anomalies = df[(df['amount'] < threshold_low) | (df['amount'] > threshold_high)]
    suspicious = anomalies[['category', 'amount', 'transaction_date']].to_dict(orient='records')

    print(json.dumps(suspicious))

if __name__ == '__main__':
    main()
