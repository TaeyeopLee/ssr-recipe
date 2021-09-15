import React from 'react';
import Users from '../components/Users';
import { connect } from 'react-redux';
import { getUsers } from '../modules/users';
import { Preloader } from '../lib/PreloadContext';

const { useEffect } = React;

const UsersContainer = ({ users, getUsers }) => {
  // call after component has mounted.
  useEffect(() => {
    if (users) return; // did not call when users is already valid
    getUsers();
  }, [getUsers, users]);
  return( 
    <>
      <Users users={users} />
      <Preloader resolve={getUsers} />
    </>)
}

export default connect(
  state => ({
    users: state.users.users
  }),
  {
    getUsers
  }
)(UsersContainer);
