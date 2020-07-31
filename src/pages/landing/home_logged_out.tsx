import React from 'react';
import { styled } from '@material-ui/core/styles';

const Main = styled('main')({
  height: '100%',
  position: 'relative',
  color: '#000',
  textAlign: 'center',
});

const Auth = styled('button')({
  fontSize: '24px',
  marginTop: '5%',
  marginRight: '5px',
  cursor: 'pointer',
});

const logIn = () => {
  console.log('logging in');
};
const signUp = () => {
  window.location.href = '/signup';
};

export default class Landing extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <Main>
        <Auth onClick={logIn}> Log in </Auth>
        <Auth onClick={signUp}> Sign up </Auth>
      </Main>
    );
  }
}
