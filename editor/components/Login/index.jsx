import { connect } from 'react-redux';
import '../../index.css';

import { oauthLogin } from '../../../app/actions/user';
import Login from './Login';

export default connect(
  null,
  {
    oauthLogin,
  },
)(Login);
