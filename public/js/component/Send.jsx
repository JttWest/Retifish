import React, { Component } from 'react';
import { Segment, Button, Grid, Container } from 'semantic-ui-react';

import AppHeader from './AppHeader';
import FileSelector from './FileSelector';
import SessionInfo from './SessionInfo';
import FileInfo from './FileInfo';

const sendEndpoint = document.location.hostname === 'localhost' ?
  'ws://localhost:9090/send' :
  `ws://${document.location.host}/send`;

const readBlobAsArrayBuffer = (blob, fileReader = undefined) => {
  const reader = fileReader || new FileReader();

  return new Promise((resolve, reject) => {
    reader.onerror = () => {
      reader.abort();
      reject(new Error('Unable to read blob as ArrayBuffer'));
    };

    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsArrayBuffer(blob);
  });
};

const handleSessionInfo = (data) => {
  console.log(JSON.stringify(data, null, 2));
};

const handlePullChunk = (data, file, fileReader, ws) => {
  const { startByte, endByte } = data;

  const blob = file.slice(startByte, endByte);

  readBlobAsArrayBuffer(blob, fileReader)
    .then((arraybuffer) => {
      ws.send(arraybuffer);
    })
    .catch((err) => {
      console.log(err);
    });
};

class Send extends Component {
  constructor(props) {
    super(props);

    this.state = {
      status: 'select', // select | transfer
      sessionInfo: null,
      selectedFile: null
    };

    this.updateSelectedFile = this.updateSelectedFile.bind(this);
    this.createTransferSession = this.createTransferSession.bind(this);
  }

  updateSelectedFile(file) {
    this.setState({
      selectedFile: file
    });
  }

  createTransferSession() {
    const fileReader = new FileReader();
    const file = this.state.selectedFile;

    const ws = new WebSocket(`${sendEndpoint}?fileName=${file.name}&fileSize=${file.size}`);

    ws.onerror = (err) => {
      console.log('cant open ws');
      console.log(err);
    };

    ws.onopen = () => {
      console.log('Opened websocket');

      ws.onmessage = (payload) => {
        const message = JSON.parse(payload.data);

        const { type, data } = message;

        switch (type) {
          case 'sessionInfo':
            handleSessionInfo(data);
            this.setState({
              status: 'transfer',
              sessionInfo: data
            });
            break;
          case 'pullChunk':
            handlePullChunk(data, file, fileReader, ws);
            break;
          default:
            throw new Error(`Unknown message type ${message.type}`);
        }
      };
    };
  }

  render() {
    const content = this.state.status === 'select' ?
      (<FileSelector
        handleSelectionChange={this.updateSelectedFile}
      />) :
      (<SessionInfo {...this.state.sessionInfo} />);

    // const fileInfo = this.state.selectedFile ? <FileInfo file={this.state.selectedFile} /> : null;

    return (
      <div>
        <AppHeader pageTitle="Send" />
        <Container>
          <Segment>
            <Grid centered>

              <Grid.Row>
                {content}
              </Grid.Row>
              <Grid.Row>
                <FileInfo file={this.state.selectedFile} />
              </Grid.Row>
              <Grid.Row>
                <Button onClick={this.createTransferSession}>Open Transfer Session</Button>
              </Grid.Row>
            </Grid>
          </Segment>
        </Container>
      </div >
    );
  }
}

export default Send;
