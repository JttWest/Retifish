import React, { Component } from 'react';

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
      sessionID: '',
      selectedFile: null
    };

    this.updateSelectedFile = this.updateSelectedFile.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  updateSelectedFile(file) {
    this.setState({
      selectedFile: file
    });
  }

  handleClick() {
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
              sessionID: data.sessionID
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
    return (
      <div style={{ border: '2px solid black', padding: '1em' }}>
        <div>Send File</div>
        <input
          id="fileSelector"
          type="file"
          name="sendFile"
          onChange={evt => this.updateSelectedFile(evt.target.files[0])}
        />
        <button type="button" id="sendFileBtn" onClick={this.handleClick}>Send</button>
        <div>{this.state.sessionID ? `Current Session ID: ${this.state.sessionID}` : ''}</div>
      </div>
    );
  }
}

export default Send;
