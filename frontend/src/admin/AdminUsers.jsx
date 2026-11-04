import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const AdminUsers = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/auth/users', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [user]);

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <span style={{ color: '#f97316', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Account Management
          </span>
          <h2 style={{ color: '#fff', fontSize: '2rem', margin: '4px 0 0', fontWeight: 800 }}>
            Registered Users Directory
          </h2>
        </div>
        <span style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>
          Total Accounts: <strong style={{ color: '#fff' }}>{users.length}</strong>
        </span>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by user name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 240px',
            background: '#09090b',
            border: '1px solid #27272a',
            padding: '10px 14px',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            background: '#09090b',
            border: '1px solid #27272a',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        >
          <option value="All">All Roles</option>
          <option value="admin">Administrators</option>
          <option value="user">Standard Customers</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr style={rowStyle}>
              <th style={thStyle}>USER ID</th>
              <th style={thStyle}>NAME</th>
              <th style={thStyle}>EMAIL</th>
              <th style={thStyle}>ACCESS ROLE</th>
              <th style={thStyle}>REGISTRATION DATE</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={tdStyle}>Loading user accounts…</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="5" style={tdStyle}>No accounts match your query.</td></tr>
            ) : filteredUsers.map(u => (
              <tr key={u._id} style={rowStyle}>
                <td style={tdStyle}>#{u._id.substring(0, 8)}...</td>
                <td style={tdStyle}><strong style={{ color: '#fff' }}>{u.name}</strong></td>
                <td style={tdStyle}>{u.email}</td>
                <td style={tdStyle}>
                  <span style={{
                    background: u.role === 'admin' ? 'rgba(249,115,22,0.15)' : 'rgba(16,185,129,0.15)',
                    color: u.role === 'admin' ? '#f97316' : '#10b981',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={tdStyle}>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const containerStyle = { maxWidth: '1200px', margin: '40px auto', padding: '30px', background: '#18181b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', color: '#fafafa' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const rowStyle = { borderBottom: '1px solid rgba(255,255,255,0.08)' };
const thStyle = { padding: '14px 12px', textAlign: 'left', color: '#a1a1aa', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' };
const tdStyle = { padding: '14px 12px', textAlign: 'left', fontSize: '0.9rem' };

export default AdminUsers;
