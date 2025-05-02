const BudgetCard = ({ category, limit }) => {
    return (
        <div className="budget-card">
            <h3>{category}</h3>
            <p>Limit: ${limit}</p>
        </div>
    );
};

export default BudgetCard;
