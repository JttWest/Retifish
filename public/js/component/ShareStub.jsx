import React from 'react'
import PropTypes from 'prop-types'
import { Button, Select, Segment, Header } from 'semantic-ui-react'

const options = [
  { key: 'link', text: 'Link', value: 'link' },
  { key: 'id', text: 'ID', value: 'id' },
]

const copyToClipboard = (inputElement) => {
  inputElement.select()
  document.execCommand('Copy')
}

const ShareStub = (props) => {
  let inputRef = React.createRef()

  return (
    <Segment basic>
      <Header size="medium">Share with your Receiver</Header>
      <div className="ui action input">
        <input type="text" defaultValue={props.sessionID} readOnly ref={inputRef} />
        <Select
          compact
          options={options}
          defaultValue="id"
          readOnly
        />
        <Button
          color="teal"
          labelPosition="right"
          content="Copy"
          icon="copy"
          onClick={() => copyToClipboard(inputRef.current)}
        />
      </div>
    </Segment>
  )
}

ShareStub.propTypes = {
  sessionID: PropTypes.string.isRequired
}

export default ShareStub
