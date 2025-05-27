import sys
import json
import pandas as pd
from sklearn.cluster import KMeans

def main():
    data = json.load(sys.stdin)
    df = pd.DataFrame(data)
    if 'amount' not in df or 'category' not in df:
        print(json.dumps({"error": "Invalid data format"}))
        return

    df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
    df = df.dropna(subset=['amount'])

    category_totals = df.groupby('category')['amount'].sum().reset_index()
    category_totals['amount'] = category_totals['amount'].astype(float)

    model = KMeans(n_clusters=2, random_state=0).fit(category_totals[['amount']])
    category_totals['cluster'] = model.labels_

    high_cluster = category_totals.groupby('cluster')['amount'].sum().idxmax()
    flagged = category_totals[category_totals['cluster'] == high_cluster]

    print(json.dumps(flagged[['category', 'amount']].to_dict(orient='records')))

if __name__ == '__main__':
    main()
