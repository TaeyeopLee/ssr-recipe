import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import User from '../components/User';
import { Preloader, usePreloader } from '../lib/PreloadContext';
import { getUser } from '../modules/users';

const UserContainer = ({ id }) => {
  const user = useSelector(state => state.users.user);
  const dispatch = useDispatch();

  usePreloader(() => dispatch(getUser(id))); // calling an API when server-side rendering.
  useEffect(() => {
    if (user && user.id === parseInt(id, 10)) return; // if user exist and user's id is same with id then do not call.
    dispatch(getUser(id)); 
  }, [dispatch, id, user]) // do call again when id has changed.

  // after container invalid check, case that have to return null
  // return Preloader instead of null
  if (!user) {
    // return <Preloader resolve={() => dispatch(getUser(id))} />;
    return null;
  }
  return <User user={user} />;
};

export default UserContainer;
