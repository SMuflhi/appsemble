import { bootstrap } from '@appsemble/preact';
import { Button, CardFooterButton, Form, ModalCard, useToggle } from '@appsemble/preact-components';
import classNames from 'classnames';
import { Fragment, JSX } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

import { FilterValue, FilterValues } from '../block';
import { FieldComponent } from './components/FieldComponent';
import styles from './index.module.css';
import { toOData } from './utils/toOData';

bootstrap(({ actions, events, parameters: { fields, highlight }, ready, utils }) => {
  const modal = useToggle();
  const [loading, setLoading] = useState(false);
  const defaultValues = useMemo(
    () =>
      fields.reduce((acc, { defaultValue, name, type }) => {
        if (defaultValue != null) {
          acc[name] = defaultValue;
        } else if (type === 'buttons' || type === 'date-range') {
          acc[name] = [];
        } else {
          acc[name] = null;
        }
        return acc;
      }, {} as FilterValues),
    [fields],
  );
  const [values, setValues] = useState(defaultValues);

  const highlightedField = fields.find((field) => field.name === highlight);

  const fetchData = useCallback(
    async (submitValues: FilterValues) => {
      setLoading(true);
      try {
        const data = await actions.onLoad({ $filter: toOData(fields, submitValues) });
        events.emit.filtered(data);
      } catch (error: unknown) {
        events.emit.filtered(null, error as any);
      }
      setLoading(false);
    },
    [actions, events, fields],
  );

  const onChange = useCallback(
    (
      { currentTarget: { name } }: JSX.TargetedEvent<HTMLButtonElement | HTMLInputElement>,
      value: FilterValue,
    ) => {
      const newValues = {
        ...values,
        [name]: value,
      };
      setValues(newValues);
      if (name === highlight) {
        fetchData(newValues);
      }
    },
    [fetchData, highlight, values],
  );

  const onSubmit = useCallback(
    () => fetchData(values).then(modal.disable),
    [fetchData, modal, values],
  );

  const resetFilter = useCallback(() => {
    setValues(defaultValues);
    return fetchData(defaultValues);
  }, [defaultValues, fetchData]);

  useEffect(() => {
    const refresh = async (): Promise<void> => {
      try {
        const data = await actions.onLoad({ $filter: toOData(fields, values) });
        events.emit.refreshed(data);
      } catch (error: unknown) {
        events.emit.refreshed(null, error as any);
      }
    };

    events.on.refresh(refresh);

    return () => events.off.refresh(refresh);
  }, [actions, events, fields, values]);

  useEffect(ready, [ready]);

  useEffect(() => {
    // Load the initial data when the block is rendered.
    onSubmit();
    // This should only be called once, so `onSubmit` should not be in the dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showModal = fields.some((field) => field.name !== highlight);

  return (
    <Form
      className={classNames(`is-flex mb-1 ${styles.root}`, {
        [styles.highlighted]: highlightedField,
      })}
      onSubmit={onSubmit}
    >
      {highlightedField && (
        <FieldComponent
          className="mx-2 my-2"
          field={highlightedField}
          highlight
          loading={loading}
          onChange={onChange}
          value={values[highlightedField.name]}
        />
      )}
      {showModal && (
        <Fragment>
          <Button
            className={classNames('mx-2 my-2', { 'is-primary': true })}
            icon="filter"
            loading={loading}
            onClick={modal.enable}
          />
          <ModalCard
            footer={
              <Fragment>
                <CardFooterButton onClick={resetFilter}>
                  {utils.formatMessage('clearLabel')}
                </CardFooterButton>
                <CardFooterButton color="primary" type="submit">
                  {utils.formatMessage('submitLabel')}
                </CardFooterButton>
              </Fragment>
            }
            isActive={modal.enabled}
            onClose={modal.disable}
            title={<span>{utils.formatMessage('modalTitle')}</span>}
          >
            {fields.map(
              (field) =>
                field === highlightedField || (
                  <div className="field">
                    {field.label && <label className="label">{utils.remap(field.label, {})}</label>}
                    <div className="control">
                      <FieldComponent
                        field={field}
                        loading={loading}
                        onChange={onChange}
                        value={values[field.name]}
                      />
                    </div>
                  </div>
                ),
            )}
          </ModalCard>
        </Fragment>
      )}
    </Form>
  );
});
