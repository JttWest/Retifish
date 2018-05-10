import React from 'react'
import PropTypes from 'prop-types'
import fileSizeFormat from 'filesize'
import { Card, Table } from 'semantic-ui-react'

const FileInfo = props => (
  <Card>
    <Card.Content>
      <Card.Header>
        File Information
      </Card.Header>
      <Card.Description>
        <Table celled>
          <Table.Row>
            <Table.Cell>Name</Table.Cell>
            <Table.Cell>{props.file ? props.file.name : null}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Size</Table.Cell>
            <Table.Cell>{props.file ? fileSizeFormat(props.file.size) : null}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Type</Table.Cell>
            <Table.Cell>{props.file ? props.file.type : null}</Table.Cell>
          </Table.Row>
        </Table>
      </Card.Description>
    </Card.Content>
  </Card>
)

export default FileInfo

