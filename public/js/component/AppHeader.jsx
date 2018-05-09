import React from 'react';
import PropTypes from 'prop-types';
import { Header, Icon } from 'semantic-ui-react';

const AppHeader = props => (
  <div>
    <Header as="h2" icon textAlign="center">
      <Icon name="users" circular />
      <Header.Content>
        {props.pageTitle}
      </Header.Content>
    </Header>
  </div>
);

AppHeader.propTypes = {
  pageTitle: PropTypes.string.isRequired
};

export default AppHeader;
