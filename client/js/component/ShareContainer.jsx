import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Segment, Container, Header, Icon, Message, Button, Divider, Grid } from 'semantic-ui-react'

const TransferHeader = props => (
  <Segment textAlign="center" basic>
    <Header as="h1" color={props.color}>
      <Header.Content>
        {props.pageTitle}
      </Header.Content>
    </Header>
  </Segment>
)

TransferHeader.propTypes = {
  color: PropTypes.string.isRequired,
  pageTitle: PropTypes.string.isRequired
}
const ShareContainer = (props) => {
  const {
    pageTitle, color, children, message, homeDisabled
  } = props

  const messageDisplay = message ?
    (
      <Message className={message.type}>
        <Message.Header>{message.header}</Message.Header>
        <p>{message.content}</p>
      </Message>
    ) :
    null

  return (
    <div>
      <TransferHeader pageTitle="Retifish" color="black" />
      <Container text>
        <Segment raised color={color}>
          <Grid columns={3} relaxed>
            <Grid.Column>
              <Button as={Link} to="/" icon floated="left" color="yellow" disabled={homeDisabled} >
                <Icon name="home" size="large" />
              </Button>
            </Grid.Column>

            <Grid.Column>
              <TransferHeader pageTitle={pageTitle} color={color} />
            </Grid.Column>

            <Grid.Column />
          </Grid>

          {children}
          {messageDisplay}
        </Segment>
      </Container>
    </div >

  )
}

ShareContainer.propTypes = {
  pageTitle: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  message: PropTypes.object,
  homeDisabled: PropTypes.bool
}

export default ShareContainer
