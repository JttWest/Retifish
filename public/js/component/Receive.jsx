import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Input, Button, Grid } from 'semantic-ui-react'
import axios from 'axios'

import TransferPage from './TransferPage'
import FileInfo from './FileInfo'


const downloadEndpoint = window.location.hostname === 'localhost' ?
  'http://localhost:9090/api/download' :
  `https://${window.location.host}/api/download`

const receiveEndpoint = window.location.hostname === 'localhost' ?
  'http://localhost:9090/api/receive' :
  `https://${window.location.host}/api/receive`

class ReceiveStep1 extends Component {
  constructor(props) {
    super(props)

    let sessionID = window.location.pathname.split('/').pop()
    if (!sessionID || !sessionID.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/))
      sessionID = ''

    this.state = {
      sessionID: sessionID,
      loading: false
    }

    this.handleInput = this.handleInput.bind(this)
    this.handleClick = this.handleClick.bind(this)

    this.cancelSource = axios.CancelToken.source()
  }

  componentWillUnmount() {
    this.cancelSource.cancel()
  }

  handleInput(newSessionID) {
    this.setState({ sessionID: newSessionID })
  }

  handleClick() {
    this.setState({ loading: true })

    axios.get(
      `${receiveEndpoint}/${this.state.sessionID}`,
      { cancelToken: this.cancelSource.token }
    )
      .then((resp) => {
        // TODO: push url to history
        this.setState({ loading: false })
        this.props.onSuccess(resp.data)
      })
      .catch((err) => {
        if (!axios.isCancel(err)) {
          this.setState({ loading: false })
          this.props.onFail(err.response)
        }
      })
  }

  render() {
    return (
      <Grid centered>
        <Grid.Row>
          <Input
            icon="hashtag"
            iconPosition="left"
            placeholder="Enter Sesssion ID"
            onChange={evt => this.handleInput(evt.target.value)}
            size="large"
            value={this.state.sessionID}
            disabled={this.state.loading}
          />
        </Grid.Row>
        <Grid.Row>
          <Button
            color="blue"
            content="Next"
            icon="right arrow"
            labelPosition="right"
            loading={this.state.loading}
            onClick={this.handleClick}
          />
        </Grid.Row>
      </Grid>
    )
  }
}

const ReceiveStep2 = props => (
  <Grid centered>
    <Grid.Row>
      <FileInfo file={props.file} />
    </Grid.Row>
    <Grid.Row>
      <a href={`${downloadEndpoint}/${props.sessionID}`} download={props.file.name}>
        <Button
          color="blue"
          content="Download"
          icon="download"
          labelPosition="right"
        // loading={this.state.loading}
        />
      </a>
    </Grid.Row>
  </Grid>
)

ReceiveStep1.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onFail: PropTypes.func.isRequired
}

class Receive extends Component {
  constructor(props) {
    super(props)

    this.state = {
      step: 1,
      sessionID: '',
      file: null
    }

    this.ableToUpdateState = false
    this.handleStep1Success = this.handleStep1Success.bind(this)
    this.handleStep1Fail = this.handleStep1Fail.bind(this)
  }

  componentDidMount() {
    this.ableToUpdateState = true
  }

  componentWillUnmount() {
    this.ableToUpdateState = false
  }

  handleStep1Success(sessionInfo) {
    if (this.ableToUpdateState) {
      this.setState({
        step: 2,
        sessionID: sessionInfo.sessionID,
        file: {
          name: sessionInfo.fileName,
          size: sessionInfo.fileSize,
          type: sessionInfo.fileType
        }
      })
    }
  }

  handleStep1Fail(resp) {
    if (this.ableToUpdateState) {
      this.setState({
        step: 1,
        sessionID: '',
        file: null
      })
    }

    if (resp)
      console.log(resp)
  }

  render() {
    const content = this.state.step === 1 ?
      (<ReceiveStep1 onSuccess={this.handleStep1Success} onFail={this.handleStep1Fail} />) :
      (<ReceiveStep2 file={this.state.file} sessionID={this.state.sessionID} />)

    return (
      <TransferPage pageTitle="Receive" color="orange">
        {content}
      </TransferPage >
    )
  }
}

export default Receive
