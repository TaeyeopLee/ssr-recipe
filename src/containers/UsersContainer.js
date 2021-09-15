import React, { useEffect } from 'react';
import Users from '../components/Users';
import { connect } from 'react-redux';
import { getUsers } from '../modules/users';

const UsersContainer = ({ users, getUsers }) => {
  // call after component has mounted.
  useEffect(() => {
    if (users) return; // did not call when users is already valid
    getUsers();
  }, [getUsers, users]);
  return <Users users={users} />;
}

export default connect(
  state => ({
    users: state.users.users
  }),
  {
    getUsers
  }
)(UsersContainer);
