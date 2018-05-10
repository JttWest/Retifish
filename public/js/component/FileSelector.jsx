import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button } from 'semantic-ui-react'


class FileInput extends Component {
  constructor(props) {
    super(props)

    this.hiddenFileInputRef = React.createRef()

    this.handleSelectClick = this.handleSelectClick.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  handleSelectClick() {
    this.hiddenFileInputRef.current.click()
  }

  handleChange(file) {
    if (file) {
      this.props.handleSelectionChange(file)
    }
  }

  render() {
    return (
      <div>
        <label htmlFor="file">
          <div className="ui fluid file input action">
            <input
              type="file"
              name="file"
              autoComplete="off"
              onChange={evt => this.handleChange(evt.target.files[0])}
              style={{ display: 'none' }}
              ref={this.hiddenFileInputRef}
            />
          </div>
        </label>
        <Button onClick={evt => this.handleSelectClick(evt)}>Select File</Button>
      </div>
    )
  }
}

FileInput.propTypes = {
  handleSelectionChange: PropTypes.func.isRequired
}

const FileSelector = props => (
  <div>
    <FileInput handleSelectionChange={props.handleSelectionChange} />
  </div>
)

FileSelector.propTypes = {
  handleSelectionChange: PropTypes.func.isRequired
}

export default FileSelector
