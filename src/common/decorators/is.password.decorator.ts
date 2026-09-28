import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { commonConstants } from '../constants';

export function IsPassword(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'IsPassword',
            target: object.constructor,
            propertyName: propertyName,
            options: { message: 'API_ERROR_WRONG_INPUT_PASSWORD', ...validationOptions },
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return (
                        typeof value === 'string' &&
                        value.length >= commonConstants.minPasswordLength &&
                        value.length <= commonConstants.maxPasswordLength &&
                        value.toUpperCase() !== value && // means has lower case
                        value.toLowerCase() !== value && // means has upper case
                        /[0-9]/.test(value)
                    );
                },
            },
        });
    };
}
