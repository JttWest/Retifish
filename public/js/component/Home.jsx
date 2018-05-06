import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => (
  <div>
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/send">Send</Link></li>
        <li><Link to="/receive">Receive</Link></li>
      </ul>
    </nav>
  </div>
);

export default Home;
