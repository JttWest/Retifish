import React, { Component } from 'react';

const downloadEndpoint = window.location.hostname === 'localhost' ?
  'http://localhost:9090/receive' :
  `${window.location.hostname}/receive`;

const downloadFile = (sessionID) => {
  const downloadUrl = `${downloadEndpoint}/${sessionID}`;

  const downloadLink = document.createElement('a');
  downloadLink.setAttribute('href', encodeURI(downloadUrl));
  downloadLink.setAttribute('download', '');

  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);

  downloadLink.click();

  document.body.removeChild(downloadLink);
};

class Receive extends Component {
  constructor(props) {
    super(props);

    this.state = {
      sessionID: ''
    };

    this.updateSessionID = this.updateSessionID.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  updateSessionID(newSessionID) {
    this.setState({
      sessionID: newSessionID
    });
  }

  handleClick() {
    downloadFile(this.state.sessionID);
  }

  render() {
    return (
      <div style={{ border: '2px solid black', padding: '1em' }}>
        <div>Receive File</div>

        <label htmlFor="sessionID">
          Session ID
          <input
            type="text"
            id="sessionID"
            value={this.state.sessionID}
            onChange={evt => this.updateSessionID(evt.target.value)}
          />
        </label>

        <button type="button" id="receiveBtn" onClick={this.handleClick}>Receive</button>
      </div>
    );
  }
}

export default Receive;
