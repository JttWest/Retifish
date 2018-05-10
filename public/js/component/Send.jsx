import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Segment, Button, Grid, Container, Label } from 'semantic-ui-react'

import AppHeader from './AppHeader'
import FileSelector from './FileSelector'
import ShareStub from './ShareStub'
import FileInfo from './FileInfo'

const sendEndpoint = document.location.hostname === 'localhost' ?
  'ws://localhost:9090/send' :
  `ws://${document.location.host}/send`

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

const handleSessionInfo = (data) => {
  console.log(JSON.stringify(data, null, 2))
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

const Step2ControlMenu = props => (
  <Button.Group attached="bottom">
    <Button onClick={props.handleNewSession} disabled={props.status === 'transfer'}>New Session</Button>
    <Button onClick={props.handleTerminateSession} disabled={props.status === 'terminated'}>Terminate Session</Button>
  </Button.Group>
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
      sessionInfo: null,
      selectedFile: null,
      senderWS: null
    }

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

  createTransferSession() {
    const fileReader = new FileReader()
    const file = this.state.selectedFile

    const ws = new WebSocket(`${sendEndpoint}?fileName=${file.name}&fileSize=${file.size}`)

    ws.onerror = (err) => {
      alert('Error: unable to create transfer session.')
      console.log(err)
    }

    ws.onopen = () => {
      console.log('Opened websocket')

      ws.onmessage = (payload) => {
        const message = JSON.parse(payload.data)

        const { type, data } = message

        switch (type) {
          case 'sessionInfo':
            handleSessionInfo(data)
            this.setState({
              status: 'transfer',
              sessionInfo: data,
              senderWS: ws
            })
            break
          case 'pullChunk':
            handlePullChunk(data, file, fileReader, ws)
            break
          default:
            throw new Error(`Unknown message type ${message.type}`)
        }
      }
    }
  }

  newSession() {
    this.setState({
      status: 'select',
      sessionInfo: null,
      selectedFile: null,
      senderWS: null
    })
  }

  terminateSession() {
    if (this.state.senderWS)
      this.state.senderWS.close()

    this.setState({
      status: 'terminated',
      senderWS: null
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
        <ShareStub sessionID={this.state.sessionInfo.sessionID} />
      )

    const controlMenu = this.state.status === 'select' ?
      (
        <Button
          onClick={this.createTransferSession}
          disabled={!this.state.selectedFile}
        >
          Open Transfer Session
        </Button>
      ) :
      (<Step2ControlMenu
        handleNewSession={this.newSession}
        handleTerminateSession={this.terminateSession}
        status={this.state.status}
      />)

    return (
      <div>
        <AppHeader pageTitle="Send" />
        <Container>
          <Segment raised color="blue">
            <Label color="green" ribbon>Home</Label>
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
          </Segment>
        </Container>
      </div >
    )
  }
}

export default Send
