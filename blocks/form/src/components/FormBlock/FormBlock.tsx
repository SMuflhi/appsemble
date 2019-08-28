import { BlockProps } from '@appsemble/react';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Actions, FakeEvent, Field, Parameters } from '../../../block';
import BooleanInput from '../BooleanInput';
import EnumInput from '../EnumInput';
import FileInput from '../FileInput';
import GeoCoordinatesInput from '../GeoCoordinatesInput';
import NumberInput from '../NumberInput';
import StringInput from '../StringInput';
import styles from './FormBlock.css';
import messages from './messages';

type FormBlockProps = BlockProps<Parameters, Actions>;

type Values = Record<string, any>;

type Validator = (field: Field, event: FakeEvent, value: any) => boolean;

interface FormBlockState {
  errors: {
    [name: string]: string;
  };
  validity: {
    [name: string]: boolean;
  };
  submitting: boolean;
  values: Values;
}

const inputs = {
  file: FileInput,
  geocoordinates: GeoCoordinatesInput,
  hidden: (): null => null,
  string: StringInput,
  number: NumberInput,
  integer: NumberInput,
  boolean: BooleanInput,
  bool: BooleanInput,
};

const validateInput: Validator = (_field, event) => {
  return (event.target as HTMLInputElement).validity.valid;
};

const validators: { [name: string]: Validator } = {
  file: validateInput,
  geocoordinates: (_, _event, value: { longitude: number; latitude: number }) => {
    return !!(value.latitude && value.longitude);
  },
  hidden: (): boolean => true,
  string: validateInput,
  number: validateInput,
  integer: validateInput,
  boolean: () => true,
  bool: () => true,
};

/**
 * Render Material UI based a form based on a JSON schema
 */
export default class FormBlock extends React.Component<FormBlockProps, FormBlockState> {
  state: FormBlockState = {
    errors: {},
    validity: {
      ...this.props.block.parameters.fields.reduce<{ [name: string]: boolean }>(
        (acc, { name, defaultValue, required, type }) => {
          acc[name] =
            (!required && !defaultValue) ||
            ((type as any) === 'boolean' || (type as any) === 'bool');
          return acc;
        },
        {},
      ),
    },
    submitting: false,
    values: {
      ...this.props.block.parameters.fields.reduce<Values>(
        (acc, { name, defaultValue, repeated }) => {
          acc[name] = defaultValue || (repeated && []);
          return acc;
        },
        {},
      ),
      ...this.props.data,
    },
  };

  validateField = (event: FakeEvent, value: any): boolean => {
    const {
      block: {
        parameters: { fields },
      },
    } = this.props;

    const { name } = event.target as HTMLInputElement;
    const field = fields.find(f => f.name === name);

    if (!field.required) {
      // Non-required fields are always considered valid.
      return true;
    }

    return validators[field.type](field, event, value);
  };

  onChange = (event: FakeEvent, value: any) => {
    const { name } = event.target as HTMLInputElement;
    const valid = this.validateField(event, value);

    this.setState(({ values, errors, validity }) => ({
      values: {
        ...values,
        [name]: value,
      },
      errors: { ...errors, [name]: (!valid).toString() },
      validity: { ...validity, [name]: valid },
    }));
  };

  onSubmit = (event: React.FormEvent) => {
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

  render(): JSX.Element {
    const { block } = this.props;
    const { errors, validity, submitting, values } = this.state;

    return (
      <form className={styles.root} noValidate onSubmit={this.onSubmit}>
        {block.parameters.fields.map(field => {
          if (field.enum) {
            return (
              <EnumInput
                key={field.name}
                error={errors[field.name]}
                field={field}
                onChange={this.onChange}
                value={values[field.name]}
              />
            );
          }
          if (!Object.prototype.hasOwnProperty.call(inputs, field.type)) {
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
          const Component = inputs[field.type];
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
            disabled={
              !Object.values(validity).every(v => v) ||
              submitting ||
              Object.keys(errors).length !== 0
            }
            type="submit"
          >
            <FormattedMessage {...messages.submit} />
          </button>
        </div>
      </form>
    );
  }
}
