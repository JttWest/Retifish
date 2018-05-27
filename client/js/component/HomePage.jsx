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
        fontSize: mobile ? '2em' : '4em',
        fontWeight: 'bold',
        fontFamily: 'arial',
        marginBottom: 0,
        marginTop: mobile ? '1.5em' : '3em',
      }}
    />
    <Header
      as="h2"
      content="Share any file up to 5GB for free in your browser."
      style={{
        fontSize: mobile ? '1.5em' : '1.7em',
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
      <Container text>
        <Button.Group fluid color="purple" attached="top" widths={info.length}>
          {info.map(i => (
            <Button key={i.index} onClick={this.handleClick(i.index)} active={this.state.selectedTab === i.index}>{i.labelName}</Button>
          ))}
        </Button.Group>
        <Segment attached padded inverted color="purple">
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
      { index: 1, labelName: 'Secure', text: 'All file transfer is protected with TLS protocol. Moreover, only a small chunk of your file is stored on the server at any given time, which will be cleared once the transfer is over.' },
      { index: 2, labelName: 'Simple', text: 'No account required. No additional dependencies to download.' },
      { index: 3, labelName: 'Fast', text: 'Unlike traditional file sharing where the whole file must be uploaded before the receiver can begin downloading, this app allows file upload and download to happen simultaneously.' },
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
  <ResponsiveContainer>
    {/* <Segment style={{ padding: '8em 0em' }} vertical>
      <Grid container stackable verticalAlign="middle">
        <Grid.Row>
          <Grid.Column width={8}>
            <Header as="h3" style={{ fontSize: '2em' }}>We Help Companies and Companions</Header>
            <p style={{ fontSize: '1.33em' }}>
              We can give your company superpowers to do things that they never thought possible. Let us delight
              your customers and empower your needs... through pure data analytics.
            </p>
            <Header as="h3" style={{ fontSize: '2em' }}>We Make Bananas That Can Dance</Header>
            <p style={{ fontSize: '1.33em' }}>
              Yes that's right, you thought it was the stuff of dreams, but even bananas can be bioengineered.
            </p>
          </Grid.Column>
          <Grid.Column floated="right" width={6}>
            <Image
              bordered
              rounded
              size="large"
              src="/assets/images/wireframe/white-image.png"
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column textAlign="center">
            <Button size="huge">Check Them Out</Button>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Segment>

    <Segment style={{ padding: '0em' }} vertical>
      <Grid celled="internally" columns="equal" stackable>
        <Grid.Row textAlign="center">
          <Grid.Column style={{ paddingBottom: '5em', paddingTop: '5em' }}>
            <Header as="h3" style={{ fontSize: '2em' }}>"What a Company"</Header>
            <p style={{ fontSize: '1.33em' }}>That is what they all say about us</p>
          </Grid.Column>
          <Grid.Column style={{ paddingBottom: '5em', paddingTop: '5em' }}>
            <Header as="h3" style={{ fontSize: '2em' }}>"I shouldn't have gone with their competitor."</Header>
            <p style={{ fontSize: '1.33em' }}>
              <Image avatar src="/assets/images/avatar/large/nan.jpg" />
              <b>Nan</b> Chief Fun Officer Acme Toys
            </p>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Segment>

    <Segment style={{ padding: '8em 0em' }} vertical>
      <Container text>
        <Header as="h3" style={{ fontSize: '2em' }}>Breaking The Grid, Grabs Your Attention</Header>
        <p style={{ fontSize: '1.33em' }}>
          Instead of focusing on content creation and hard work, we have learned how to master the art of doing
          nothing by providing massive amounts of whitespace and generic content that can seem massive, monolithic
          and worth your attention.
        </p>
        <Button as="a" size="large">Read More</Button>

        <Divider
          as="h4"
          className="header"
          horizontal
          style={{ margin: '3em 0em', textTransform: 'uppercase' }}
        >
          <a href="#">Case Studies</a>
        </Divider>

        <Header as="h3" style={{ fontSize: '2em' }}>Did We Tell You About Our Bananas?</Header>
        <p style={{ fontSize: '1.33em' }}>
          Yes I know you probably disregarded the earlier boasts as non-sequitur filler content, but it's really
          true.
          It took years of gene splicing and combinatory DNA research, but our bananas can really dance.
        </p>
        <Button as="a" size="large">I'm Still Quite Interested</Button>
      </Container>
    </Segment> */}
  </ResponsiveContainer>
)

export default HomePage
