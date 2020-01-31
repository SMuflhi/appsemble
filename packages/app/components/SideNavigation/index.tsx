import { ComponentProps } from 'react';
import { connect } from 'react-redux';

import { State } from '../../actions';
import { logout } from '../../actions/user';
import SideNavigation from './SideNavigation';

function mapStateToProps(state: State): Partial<ComponentProps<typeof SideNavigation>> {
  return {
    definition: state.app.definition,
    user: state.user.user,
    role: state.user.role,
  };
}

export default connect(mapStateToProps, {
  logout,
})(SideNavigation);
