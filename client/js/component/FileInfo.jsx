import React from 'react'
import PropTypes from 'prop-types'
import fileSizeFormat from 'filesize'
import { Card, Input, Grid } from 'semantic-ui-react'

const labelWidth = 4
const valueWidth = 12

const FileInfo = props => (
  <Card>
    <Card.Content>
      <Card.Header>
        File Information
      </Card.Header>
      <Card.Description>
        <Grid>
          <Grid.Row>
            <Grid.Column width={labelWidth}>
              NAME
            </Grid.Column>
            <Grid.Column width={valueWidth}>
              <Input value={props.file ? props.file.name : ''} fluid transparent />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={labelWidth}>
              SIZE
            </Grid.Column>
            <Grid.Column width={valueWidth}>
              <Input value={props.file ? fileSizeFormat(props.file.size) : ''} fluid transparent />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={labelWidth}>
              TYPE
            </Grid.Column>
            <Grid.Column width={valueWidth}>
              <Input value={props.file ? props.file.type : null} fluid transparent />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Card.Description>
    </Card.Content>
  </Card>
)

export default FileInfo
