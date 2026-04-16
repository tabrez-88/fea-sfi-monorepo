import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator for cross-field date comparison.
 *
 * Ensures the decorated date string is strictly AFTER the date in another property.
 * Both fields must be valid ISO date strings. If the decorated value is undefined,
 * validation passes (use @IsOptional separately for optionality).
 *
 * @example
 *   class CreateDealDto {
 *     @IsDateString()
 *     effectiveDate!: string;
 *
 *     @IsOptional()
 *     @IsDateString()
 *     @IsAfterDate('effectiveDate', { message: 'Termination must be after effective date' })
 *     terminationDate?: string;
 *   }
 */
@ValidatorConstraint({ name: 'isAfterDate', async: false })
export class IsAfterDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (value === undefined || value === null) {
      return true; // Optional fields pass through; combine with @IsOptional()
    }
    if (typeof value !== 'string') {
      return false;
    }

    const [relatedPropertyName] = args.constraints as [string];
    const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];

    if (relatedValue === undefined || relatedValue === null) {
      return true; // Cannot compare if the other field is missing
    }
    if (typeof relatedValue !== 'string') {
      return false;
    }

    const thisDate = new Date(value).getTime();
    const otherDate = new Date(relatedValue).getTime();

    if (Number.isNaN(thisDate) || Number.isNaN(otherDate)) {
      return false;
    }

    return thisDate > otherDate;
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as [string];
    return `${args.property} must be after ${relatedPropertyName}`;
  }
}

export function IsAfterDate(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsAfterDateConstraint,
    });
  };
}
