const TransactionList = ({ transactions }) => {
    return (
        <div>
            <h2>Recent Transactions</h2>
            <ul>
                {transactions.map((tx) => (
                    <li key={tx.transaction_id}>
                        {tx.category} - ${tx.amount} ({tx.transaction_type})
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TransactionList;
