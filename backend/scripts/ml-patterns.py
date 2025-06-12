# ml-patterns.py
import sys
import json
import pandas as pd
import numpy as np

user_id = sys.argv[1]

# Exemplu dummy de date
patterns = [
    {"month": "2025-01", "top_category": "Rent", "total": 1200},
    {"month": "2025-02", "top_category": "Groceries", "total": 800},
    {"month": "2025-03", "top_category": "Transport", "total": 300}
]

# Trimitere rezultat înapoi la Node.js
print(json.dumps(patterns))
