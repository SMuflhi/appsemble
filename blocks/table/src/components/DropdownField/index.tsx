import { useBlock } from '@appsemble/preact';
import { Dropdown } from '@appsemble/preact-components';
import { Fragment, VNode } from 'preact';

import { Dropdown as Field } from '../../../block';
import { DropdownOption } from '../DropdownOption';

interface DropdownFieldProps {
  /**
   * The definition used to render out the field.
   */
  field: Field;

  /**
   * The data to display.
   */
  item: unknown;

  /**
   * The index of the row that was clicked.
   */
  index: number;

  /**
   * The index of the subrow that was clicked.
   */
  repeatedIndex: number;

  /**
   * The data of the record that item is a part of.
   */
  record: unknown;
}

export function DropdownField({
  field,
  index,
  item,
  record,
  repeatedIndex,
}: DropdownFieldProps): VNode {
  const {
    utils: { remap },
  } = useBlock();

  return (
    <Dropdown
      className="is-right"
      icon={field.dropdown.icon}
      label={remap(field.dropdown.label, item, { index, repeatedIndex }) as string}
    >
      {field.dropdown.options.map((option, i) => {
        const label = remap(option.label, item, { index, repeatedIndex });

        return (
          <Fragment key={label || i}>
            {i ? <hr className="dropdown-divider" /> : null}
            <DropdownOption
              index={index}
              item={item}
              option={option}
              record={record}
              repeatedIndex={repeatedIndex}
            />
          </Fragment>
        );
      })}
    </Dropdown>
  );
}