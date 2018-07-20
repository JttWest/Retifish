import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Container,
  Divider,
  Grid,
  Header,
  Icon,
  Image,
  List,
  Menu,
  Responsive,
  Segment,
  Sidebar,
  Visibility,
  Tab,
  Ref
} from 'semantic-ui-react'

const MainContent = ({ mobile }) => (
  <Container text>
    <Header
      as="h1"
      content="Retifish"
      style={{
        fontSize: mobile ? '2em' : '5em',
        fontWeight: 'bold',
        marginBottom: 0,
        marginTop: '1em',
      }}
    />
    <Header
      as="h2"
      content="Share any file up to 5GB for free in your browser."
      style={{
        fontSize: mobile ? '1.5em' : '2em',
        fontWeight: 'normal',
        marginTop: mobile ? '0.5em' : '1.5em',
      }}
    />

    <Button.Group fluid size="huge" widths={2}>
      <Button as={Link} to="/send" color="blue">Send</Button>
      <Icon /> {/* used to create a dummy divider */}
      <Button as={Link} to="/receive" color="orange">Receive</Button>
    </Button.Group>
  </Container>
)

MainContent.propTypes = {
  mobile: PropTypes.bool
}

class InfoSection extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedTab: 0
    }

    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(index) {
    return () => { this.setState({ selectedTab: index }) }
  }

  render() {
    const { info } = this.props
    return (
      <Container text style={{ minHeight: '180px' }}>
        <Button.Group fluid color="black" attached="top" widths={info.length}>
          {info.map(i => (
            <Button key={i.index} onClick={this.handleClick(i.index)} active={this.state.selectedTab === i.index}>{i.labelName}</Button>
          ))}
        </Button.Group>
        <Segment attached padded inverted>
          {info[this.state.selectedTab].text}
        </Segment>
      </Container>
    )
  }
}

InfoSection.propTypes = {
  info: PropTypes.array.isRequired
}

/* Heads up!
 * Neither Semantic UI nor Semantic UI React offer a responsive navbar, however, it can be implemented easily.
 * It can be more complicated, but you can create really flexible markup.
 */
class DesktopContainer extends Component {
  constructor(props) {
    super(props)

    this.state = {}

    this.hideFixedMenu = this.hideFixedMenu.bind(this)
    this.showFixedMenu = this.showFixedMenu.bind(this)
  }

  hideFixedMenu() {
    this.setState({ fixed: false })
  }
  showFixedMenu() {
    this.setState({ fixed: true })
  }

  render() {
    const { children } = this.props

    const info = [
      { index: 0, labelName: 'Free', text: 'Both sending and receiving files are completely free with no hidden fees.' },
      { index: 1, labelName: 'Secure', text: 'All file transfer is protected with TLS protocol. Moreover, the server only stores a small chunk of your file at any given time, which is cleared once the transfer is over.' },
      { index: 2, labelName: 'Simple', text: 'No account required. No additional dependencies to download. A web browser with internet connection is all you need.' },
      { index: 3, labelName: 'Fast', text: 'Unlike traditional file sharing where the whole file must be uploaded before the receiver can begin downloading, this app allows simultaneous upload and download of the file.' },
    ]
    return (
      <Responsive>
        <Visibility once={false} onBottomPassed={this.showFixedMenu} onBottomPassedReverse={this.hideFixedMenu}>
          <Segment textAlign="center" vertical>
            {/* <Menu
              fixed={fixed ? 'top' : null}
              inverted={!fixed}
              pointing={!fixed}
              secondary={!fixed}
              size="large"
            >
              <Container>
                <Menu.Item as="a" active>Home</Menu.Item>
                <Menu.Item as="a">About</Menu.Item>
                <Menu.Item as="a">Contact</Menu.Item>
              </Container>
            </Menu> */}
            <MainContent />
            <Divider hidden />
            <InfoSection info={info} />
            <Container text>
              Have question/feedback/bug?<br />Please email <strong>contact@retifish.com</strong>
            </Container>
          </Segment>
        </Visibility>

        {children}
      </Responsive>
    )
  }
}

DesktopContainer.propTypes = {
  children: PropTypes.node,
}

const ResponsiveContainer = ({ children }) => (
  <div>
    <DesktopContainer>{children}</DesktopContainer>
  </div>
)

ResponsiveContainer.propTypes = {
  children: PropTypes.node,
}

const HomePage = () => (
  <ResponsiveContainer />
)

export default HomePage
