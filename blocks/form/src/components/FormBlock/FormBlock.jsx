import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import BooleanInput from '../BooleanInput';
import EnumInput from '../EnumInput';
import FileInput from '../FileInput';
import GeoCoordinatesInput from '../GeoCoordinatesInput';
import NumberInput from '../NumberInput';
import StringInput from '../StringInput';
import styles from './FormBlock.css';
import messages from './messages';

const inputs = {
  file: FileInput,
  enum: EnumInput,
  geocoordinates: GeoCoordinatesInput,
  hidden: () => null,
  string: StringInput,
  number: NumberInput,
  integer: NumberInput,
  boolean: BooleanInput,
  bool: BooleanInput,
};

/**
 * Render Material UI based a form based on a JSON schema
 */
export default class FormBlock extends React.Component {
  static propTypes = {
    /**
     * The actions as passed by the Appsemble interface.
     */
    actions: PropTypes.shape().isRequired,
    /**
     * The block as passed by the Appsemble interface.
     */
    block: PropTypes.shape().isRequired,
    /**
     * The initial data as passed by the Appsemble interface.
     */
    data: PropTypes.shape().isRequired,
  };

  state = {
    errors: {},
    pristine: true,
    submitting: false,
    values: {
      ...this.props.block.parameters.fields.reduce((acc, { name, defaultValue, repeated }) => {
        acc[name] = defaultValue || (repeated && []);
        return acc;
      }, {}),
      ...this.props.data,
    },
  };

  onChange = (event, value = event.target.value) => {
    this.setState(({ values }) => ({
      pristine: false,
      values: {
        ...values,
        [event.target.name]: value,
      },
    }));
  };

  onSubmit = event => {
    event.preventDefault();

    this.setState(({ submitting, values }, { actions }) => {
      if (!submitting) {
        actions.onSubmit
          .dispatch(values)
          .then(() => {
            this.setState({
              submitting: false,
            });
            return actions.onSubmitSuccess.dispatch(values);
          })
          .catch(error => {
            if (error.message !== 'Schema Validation Failed') {
              this.setState({
                submitting: false,
              });
              throw error;
            }
            this.setState({
              errors: error.data,
              submitting: false,
            });
          });
      }
      return {
        submitting: true,
      };
    });
  };

  render() {
    const { block } = this.props;
    const { errors, pristine, submitting, values } = this.state;

    return (
      <form className={styles.root} noValidate onSubmit={this.onSubmit}>
        {block.parameters.fields.map(field => {
          const Component = field.enum ? inputs.enum : inputs[field.type];
          if (!Component) {
            return (
              <FormattedMessage
                key={field.name}
                values={{
                  name: field.name,
                  type: field.type,
                }}
                {...messages.unsupported}
              />
            );
          }
          return (
            <Component
              key={field.name}
              error={errors[field.name]}
              field={field}
              onChange={this.onChange}
              value={values[field.name]}
            />
          );
        })}
        <div className={styles.buttonWrapper}>
          <button
            className={classNames('button', 'is-primary', styles.submit)}
            disabled={pristine || submitting || Object.keys(errors).length !== 0}
            type="submit"
          >
            <FormattedMessage {...messages.submit} />
          </button>
        </div>
      </form>
    );
  }
}
