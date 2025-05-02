const API_URL = "http://localhost:5000/api/transactions";

export const getTransactions = async () => {
    const res = await fetch(API_URL);
    if (!res.ok) {
        throw new Error('Failed to fetch transactions');
    }
    return res.json();
};

export const addTransaction = async (transaction) => {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
    });

    if (!res.ok) {
        throw new Error('Failed to add transaction');
    }

    return res.json();
};
