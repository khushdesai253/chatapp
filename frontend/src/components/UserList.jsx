function UserList({ users, selectedUser, onSelectUser }) {
  if (!users || users.length === 0) {
    return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>No other users found</div>;
  }

  return (
    <div className="user-list">
      {users.map(user => (
        <div 
          key={user._id} 
          className={`user-item ${selectedUser && selectedUser._id === user._id ? 'active' : ''}`}
          onClick={() => onSelectUser(user)}
        >
          <div className="avatar">
            {user.username.charAt(0)}
          </div>
          <div className="user-info">
            <span className="user-name">{user.username}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default UserList;
