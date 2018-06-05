import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Grid, Icon } from 'semantic-ui-react'
import axios from 'axios'

import ShareContainer from './ShareContainer'
import FileSelector from './FileSelector'
import ShareStub from './ShareStub'
import FileInfo from './FileInfo'

import error from '../lib/error'


const initSendEndpoint = `${API_SERVER}/api/send`
const wsSendEndpoint = `${WS_SERVER}/websocket/send`

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

const SendStep1 = (props) => {
  const {
    loading, handleSelectFile,
    selectedFile, handleCreateSession
  } = props

  return (
    <Grid centered>
      <Grid.Row>
        <FileSelector
          handleSelectionChange={handleSelectFile}
          disabled={loading}
        />
      </Grid.Row>
      <Grid.Row>
        <FileInfo file={selectedFile} />
      </Grid.Row>
      <Grid.Row>
        <Button
          icon
          color="blue"
          labelPosition="right"
          onClick={handleCreateSession}
          disabled={!selectedFile}
          loading={loading}
        >
          Open Transfer Session
          <Icon name="upload" />
        </Button>
      </Grid.Row>
    </Grid>
  )
}

SendStep1.propTypes = {
  loading: PropTypes.bool.isRequired,
  handleSelectFile: PropTypes.func.isRequired,
  handleCreateSession: PropTypes.func.isRequired,
  selectedFile: PropTypes.object
}

const SendStep2 = (props) => {
  const {
    selectedFile, sessionID, handleNewSession,
    handleTerminateSession, status
  } = props

  return (
    <Grid centered>
      <Grid.Row>
        <ShareStub sessionID={sessionID} />
      </Grid.Row>
      <Grid.Row>
        <FileInfo file={selectedFile} />
      </Grid.Row>
      <Grid.Row>
        <Button
          icon
          color="blue"
          labelPosition="right"
          onClick={handleNewSession}
          disabled={status === 'transfer'}
        >
          New Session
          <Icon name="undo" />
        </Button>
        <Button
          icon
          color="red"
          labelPosition="right"
          onClick={handleTerminateSession}
          disabled={status === 'terminated'}
        >
          Terminate Session
          <Icon name="shutdown" />
        </Button>
      </Grid.Row>
    </Grid>
  )
}

SendStep2.propTypes = {
  handleNewSession: PropTypes.func.isRequired,
  handleTerminateSession: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired,
  sessionID: PropTypes.string.isRequired,
  selectedFile: PropTypes.object.isRequired
}

class Send extends Component {
  constructor(props) {
    super(props)

    this.state = {
      step: 1,
      loading: false,
      status: 'select', // select | transfer | terminated
      sessionID: null,
      selectedFile: null
    }

    this.senderWS = null

    this.updateSelectedFile = this.updateSelectedFile.bind(this)
    this.createTransferSession = this.createTransferSession.bind(this)
    this.newSession = this.newSession.bind(this)
    this.terminateSession = this.terminateSession.bind(this)
    this.establishSenderWS = this.establishSenderWS.bind(this)
  }

  updateSelectedFile(file) {
    this.setState({
      selectedFile: file
    })
  }

  establishSenderWS(sessionID, file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      const ws = new WebSocket(`${wsSendEndpoint}/${sessionID}`)

      ws.onerror = (err) => {
        console.log(err)
        reject(err)
      }

      ws.onclose = () => {
        this.setState({
          status: 'terminated'
        })
      }

      ws.onopen = () => {
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
  }

  async createTransferSession() {
    this.setState({ loading: true })
    const file = this.state.selectedFile

    try {
      const resp = await axios.post(initSendEndpoint, JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }))

      const ws = await this.establishSenderWS(resp.data.sessionID, file)

      this.senderWS = ws
      this.setState({
        step: 2,
        status: 'transfer',
        sessionID: resp.data.sessionID,
        message: null
      })
    } catch (err) {
      const message = error.parseMessage(err.response && err.response.data)
      this.setState({ message })
    }

    this.setState({ loading: false })
  }

  newSession() {
    this.setState({
      step: 1,
      loading: false,
      status: 'select',
      selectedFile: null,
      message: null
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
    const {
      message, status, step, loading,
      selectedFile, sessionID
    } = this.state

    const content = step === 1 ?
      (<SendStep1
        loading={loading}
        handleSelectFile={this.updateSelectedFile}
        handleCreateSession={this.createTransferSession}
        selectedFile={selectedFile}
      />) :
      (<SendStep2
        handleNewSession={this.newSession}
        handleTerminateSession={this.terminateSession}
        status={status}
        sessionID={sessionID}
        selectedFile={selectedFile}
      />)

    return (
      <ShareContainer
        pageTitle="Send"
        color="blue"
        message={message}
        homeDisabled={status === 'transfer' || loading}
      >
        {content}
      </ShareContainer>
    )
  }
}

export default Send
