import { NumberField, NumberRequirement } from '../../../block';

export function validateNumber(field: NumberField, value: number): NumberRequirement {
  return field.requirements?.find((requirement) => {
    if ('required' in requirement && value == null) {
      return true;
    }

    if ('max' in requirement && value > requirement.max) {
      return true;
    }

    if ('min' in requirement && value < requirement.min) {
      return true;
    }

    if ('step' in requirement) {
      return field.type === 'integer'
        ? value % Math.floor(requirement.step)
        : value % requirement.step;
    }

    return false;
  });
}
