import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Segment, Label, Header, Icon, Container } from 'semantic-ui-react'

const TransferHeader = props => (
  <div>
    <Header as="h2" icon textAlign="center">
      <Icon name="users" circular />
      <Header.Content>
        {props.pageTitle}
      </Header.Content>
    </Header>
  </div>
)

TransferHeader.propTypes = {
  pageTitle: PropTypes.string.isRequired
}

const TransferPage = props => (
  <div>
    <TransferHeader pageTitle={props.pageTitle} />
    <Container>
      <Segment raised color={props.color}>
        <Label as={Link} to="/" color="green" ribbon size="large">Home</Label>
        {props.children}
      </Segment>
    </Container>
  </div >
)

TransferPage.propTypes = {
  pageTitle: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
}

export default TransferPage
