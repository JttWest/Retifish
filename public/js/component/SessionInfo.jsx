import React from 'react';
import PropTypes from 'prop-types';

const SessionInfo = props => (
  <div>
    <div>Session ID: {props.sessionID}</div>
    <div>File Name: {props.fileName}</div>
    <div>File Size: {props.fileSize}</div>
    {props.passcode &&
      <div>Passcode : {props.passcode}</div>
    }
  </div>

);

SessionInfo.propTypes = {
  sessionID: PropTypes.string.isRequired,
  fileName: PropTypes.string.isRequired,
  fileSize: PropTypes.number.isRequired,
  passcode: PropTypes.string
};

export default SessionInfo;
