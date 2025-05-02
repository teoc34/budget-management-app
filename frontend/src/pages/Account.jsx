const Account = ({ user }) => {
    return (
        <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-2xl font-bold mb-4">Personal Information</h2>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
        </div>
    );
};

export default Account;