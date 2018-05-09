import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'semantic-ui-react';

const Home = () => (
  <Menu fluid widths={3}>
    <Menu.Item as={Link} to="/">Home</Menu.Item>
    <Menu.Item as={Link} to="/send">Send</Menu.Item>
    <Menu.Item as={Link} to="/receive">Receive</Menu.Item>
  </Menu>
);

export default Home;
