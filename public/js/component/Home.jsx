import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'semantic-ui-react';

const Home = () => (
  <div>
    <nav>
      <ul>
        <li>
          <Link to="/">
            <Button color="blue">Home</Button>
          </Link>
        </li>
        <li>
          <Link to="/send">
            <Button color="blue">Send</Button>
          </Link>
        </li>
        <li>
          <Link to="/receive">
            <Button color="blue">Receive</Button>
          </Link>
        </li>
      </ul>
    </nav>
  </div>
);

export default Home;
