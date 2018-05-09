import React from 'react';
import { Switch, Route } from 'react-router-dom';

import Home from './Home';
import Send from './Send';
import Receive from './Receive';
import NotFound from './NotFound';

const App = () => (
  <Switch>
    <Route exact path="/" component={Home} />
    <Route path="/send" component={Send} />
    <Route path="/receive" component={Receive} />
    <Route path="/receive" component={Receive} />
    <Route path="*" component={NotFound} />
  </Switch >
);

export default App;
