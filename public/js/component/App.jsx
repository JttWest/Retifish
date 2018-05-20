import React from 'react'
import { Switch, Route } from 'react-router-dom'

import HomePage from './HomePage'
import Send from './Send'
import Receive from './Receive'
import NotFound from './NotFound'

// import bgImg from '../../img/background.jpg'

// const style = {
//   backgroundImage: `url(${bgImg})`,
//   backgroundSsize: 'cover',
//   backgroundRepeat: 'no-repeat',
//   backgroundPosition: 'center center'
// }

const App = () => (
  <Switch>
    <Route exact path="/" component={HomePage} />
    <Route path="/send" component={Send} />
    <Route path="/receive" component={Receive} />
    <Route path="*" component={NotFound} />
  </Switch >

)

export default App
