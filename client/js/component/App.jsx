import React from 'react'
import { Switch, Route } from 'react-router-dom'

import HomePage from './HomePage'
import SendPage from './SendPage'
import ReceivePage from './ReceivePage'
import NotFound from './NotFoundPage'

const App = () => (
  <Switch>
    <Route exact path="/" component={HomePage} />
    <Route path="/send" component={SendPage} />
    <Route path="/receive" component={ReceivePage} />
    <Route path="*" component={NotFound} />
  </Switch >

)

export default App
