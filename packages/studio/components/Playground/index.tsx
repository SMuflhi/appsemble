import { FileUpload, JSONField, Message, Select, TextArea } from '@appsemble/react-components';
import { examples, remap, type RemapperContext, schemas } from '@appsemble/utils';
import classNames from 'classnames';
import { IntlMessageFormat } from 'intl-messageformat';
import { Validator } from 'jsonschema';
import { type ChangeEvent, type ReactNode, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { parse, stringify } from 'yaml';

import styles from './index.module.css';
import { useUser } from '../UserProvider/index.js';

interface PlaygroundProps {
  readonly defaultOption?: keyof typeof examples;
  readonly customOption?: { input: unknown; remapper: string };
}

export function Playground({ customOption, defaultOption = 'None' }: PlaygroundProps): ReactNode {
  const custom = { ...customOption, remapper: customOption?.remapper.trim() };
  const { lang } = useParams<'lang'>();
  const { userInfo } = useUser();

  const [input, setInput] = useState(custom?.input || examples[defaultOption].input);
  const [remapper, setRemapper] = useState(
    stringify(custom?.remapper || examples[defaultOption].remapper),
  );
  const [output, setOutput] = useState('');
  const [errorMessages, setErrorMessages] = useState([]);

  const onChangeInput = useCallback((event: ChangeEvent, value: string) => {
    setInput(value);
  }, []);

  const onUploadFile = useCallback(async (event: ChangeEvent, file: File) => {
    if (file.type === 'application/json') {
      const text = await file.text();
      try {
        setInput(JSON.parse(text));
      } catch {
        // TODO: handle message for invalid JSON
      }
    }
  }, []);

  const onSelect = useCallback((event: ChangeEvent, value: keyof typeof examples) => {
    const { input: newInput, remapper: newRemapper } = examples?.[value] ?? examples.None;
    setInput(newInput);
    setRemapper(stringify(newRemapper));
  }, []);

  const onChangeRemapper = useCallback((event: ChangeEvent, value: string) => {
    setRemapper(value);
  }, []);

  useEffect(() => {
    try {
      const parsedRemapper = parse(remapper);
      const validator = new Validator();
      Object.entries(schemas).map(([path, schema]) =>
        validator.addSchema(schema, `/#/components/schemas/${path}`),
      );
      // TODO: consider using a service worker to offload the work from the main thread
      const result = validator.validate(parsedRemapper, schemas.RemapperDefinition, {
        nestedErrors: true,
      });
      if (result.errors.length) {
        setErrorMessages(() => {
          const errors = result.errors
            ?.filter((e) => e.path.length)
            .map((e) => `Remapper: ${e.message}`);
          if (!errors.length) {
            return ['Remapper: Invalid'];
          }
          return errors;
        });
        return;
      }

      const url = new URL(window.origin);
      const context: RemapperContext = {
        appId: 0,
        url: String(url),
        appUrl: `${url.protocol}//playground.playground.${url.host}`,
        getMessage(message) {
          return new IntlMessageFormat(message.defaultMessage, lang, undefined);
        },
        locale: lang,
        userInfo: userInfo ?? {
          sub: 'Playground',
          name: 'Playground',
          email: 'playground@example.com',
          email_verified: false,
        },
        context: {},
        appMember: {
          userId: 'Playground',
          memberId: 'Playground',
          name: 'Playground',
          primaryEmail: 'playground@example.com',
          role: 'Playground',
          demo: false,
          properties: {},
        },
      };
      const remappedValue = remap(parsedRemapper, input, context);
      setOutput(JSON.stringify(remappedValue, null, 2));
      setErrorMessages([]);
    } catch (error) {
      setErrorMessages([error]);
    }
  }, [remapper, input, lang, userInfo]);

  return (
    <div className="is-flex is-flex-direction-column">
      <div className="is-flex is-flex-direction-row ">
        <FileUpload
          accept="application/json"
          formComponentClassName={classNames('m-0', styles.dense)}
          onChange={onUploadFile}
        />
        <Select defaultValue={defaultOption} onChange={onSelect}>
          {Object.keys(examples)
            .toSorted()
            .map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
        </Select>
      </div>
      <div className="is-flex is-flex-direction-row mb-1">
        <JSONField
          className={classNames(styles.json, styles.dense, 'm-0')}
          onChange={onChangeInput}
          style={{ fontFamily: 'monospace' }}
          value={input}
        />
        <TextArea
          onChange={onChangeRemapper}
          style={{ minWidth: 'unset', fontFamily: 'monospace' }}
          value={remapper}
        />
        <TextArea disabled style={{ minWidth: 'unset', fontFamily: 'monospace' }} value={output} />
      </div>
      {errorMessages?.length ? (
        <Message className="mb-1" color="danger">
          {errorMessages?.map((msg) => <div key={msg}>{msg}</div>)}
        </Message>
      ) : null}
    </div>
  );
}
