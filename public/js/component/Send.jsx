import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Grid, Icon, Container } from 'semantic-ui-react'
import axios from 'axios'

import TransferPage from './TransferPage'
import FileSelector from './FileSelector'
import ShareStub from './ShareStub'
import FileInfo from './FileInfo'

const host = window.location.hostname === 'localhost' ? 'localhost:9090' : window.location.host
const initSendEndpoint = `${window.location.protocol}//${host}/send`
const wsSendEndpoint = `ws://${host}/send` // TODO: pick ws/wss dynamically

const readBlobAsArrayBuffer = (blob, fileReader = undefined) => {
  const reader = fileReader || new FileReader()

  return new Promise((resolve, reject) => {
    reader.onerror = () => {
      reader.abort()
      reject(new Error('Unable to read blob as ArrayBuffer'))
    }

    reader.onload = () => {
      resolve(reader.result)
    }
    reader.readAsArrayBuffer(blob)
  })
}

const handlePullChunk = (data, file, fileReader, ws) => {
  const { startByte, endByte } = data

  const blob = file.slice(startByte, endByte)

  readBlobAsArrayBuffer(blob, fileReader)
    .then((arraybuffer) => {
      ws.send(arraybuffer)
    })
    .catch((err) => {
      console.log(err)
    })
}

const establishSenderWS = (sessionID, file) => (
  new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    const ws = new WebSocket(`${wsSendEndpoint}?sessionID=${sessionID}`)

    ws.onerror = (err) => {
      console.log(err)
      reject(err)
    }

    ws.onopen = () => {
      console.log('Opened websocket')

      ws.onmessage = (payload) => {
        const message = JSON.parse(payload.data)

        const { type, data } = message

        switch (type) {
          case 'pullChunk':
            handlePullChunk(data, file, fileReader, ws)
            break
          default:
            throw new Error(`Unknown message type ${message.type}`)
        }
      }

      resolve(ws)
    }
  })
)

const Step2ControlMenu = props => (
  <Container>
    <Button
      icon
      color="blue"
      labelPosition="right"
      onClick={props.handleNewSession}
      disabled={props.status === 'transfer'}
    >
      New Session
      <Icon name="undo" />
    </Button>
    <Button
      icon
      color="red"
      labelPosition="right"
      onClick={props.handleTerminateSession}
      disabled={props.status === 'terminated'}
    >
      Terminate Session
      <Icon name="shutdown" />
    </Button>
    {/* <Button onClick={props.handleNewSession} disabled={props.status === 'transfer'}>New Session</Button> */}
    {/* <Button onClick={props.handleTerminateSession} disabled={props.status === 'terminated'}>Terminate Session</Button> */}
  </Container>
)

Step2ControlMenu.propTypes = {
  handleNewSession: PropTypes.func.isRequired,
  handleTerminateSession: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired
}

class Send extends Component {
  constructor(props) {
    super(props)

    this.state = {
      status: 'select', // select | transfer | terminated
      sessionID: null,
      selectedFile: null
    }

    this.senderWS = null

    this.updateSelectedFile = this.updateSelectedFile.bind(this)
    this.createTransferSession = this.createTransferSession.bind(this)
    this.newSession = this.newSession.bind(this)
    this.terminateSession = this.terminateSession.bind(this)
  }

  updateSelectedFile(file) {
    this.setState({
      selectedFile: file
    })
  }

  async createTransferSession() {
    const file = this.state.selectedFile

    try {
      const resp = await axios.post(`${initSendEndpoint}?fileName=${file.name}&fileSize=${file.size}`)
      const ws = await establishSenderWS(resp.data.sessionID, file)

      this.senderWS = ws
      this.setState({
        status: 'transfer',
        sessionID: resp.data.sessionID
      })
    } catch (e) {
      console.log('Fail to create transfer session')
      console.log(e)
    }
  }

  newSession() {
    this.setState({
      status: 'select',
      selectedFile: null
    })
  }

  terminateSession() {
    if (this.senderWS)
      this.senderWS.close()

    this.setState({
      status: 'terminated'
    })
  }

  render() {
    const topContent = this.state.status === 'select' ?
      (
        <FileSelector
          handleSelectionChange={this.updateSelectedFile}
        />
      ) :
      (
        <ShareStub sessionID={this.state.sessionID} />
      )

    const controlMenu = this.state.status === 'select' ?
      (
        <Button
          icon
          color="blue"
          labelPosition="right"
          onClick={this.createTransferSession}
          disabled={!this.state.selectedFile}
        >
          Open Transfer Session
          <Icon name="upload" />
        </Button>
      ) :
      (<Step2ControlMenu
        handleNewSession={this.newSession}
        handleTerminateSession={this.terminateSession}
        status={this.state.status}
      />)

    return (
      <TransferPage pageTitle="Send" color="blue">
        <Grid centered>
          <Grid.Row>
            {topContent}
          </Grid.Row>
          <Grid.Row>
            <FileInfo file={this.state.selectedFile} />
          </Grid.Row>
          <Grid.Row>
            {controlMenu}
          </Grid.Row>
        </Grid>
      </TransferPage>
    )
  }
}

export default Send
