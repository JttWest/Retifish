import React, { Component } from 'react'
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

class ShareStub extends Component {
  constructor(props) {
    super(props)

    this.state = {
      type: 'link' // link | id
    }

    this.displayRef = React.createRef()
    this.handleSelect = this.handleSelect.bind(this)
  }

  handleSelect(_, { value }) {
    this.setState({
      type: value
    })
  }

  render() {
    const value = this.state.type === 'link' ?
      `${window.location.protocol}//${window.location.host}/receive/${this.props.sessionID}` :
      this.props.sessionID

    return (
      <Segment basic>
        <Header size="medium">Share with your receiver</Header>
        <div className="ui action input">
          <input type="text" value={value} readOnly ref={this.displayRef} />
          <Select
            compact
            options={options}
            defaultValue={this.state.type}
            onChange={this.handleSelect}
            readOnly
          />
          <Button
            color="teal"
            labelPosition="right"
            content="Copy"
            icon="copy"
            onClick={() => copyToClipboard(this.displayRef.current)}
          />
        </div>
      </Segment>
    )
  }
}

ShareStub.propTypes = {
  sessionID: PropTypes.string.isRequired
}

export default ShareStub
