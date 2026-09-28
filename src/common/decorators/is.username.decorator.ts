import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { commonConstants } from '../constants';

export function IsUsername(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'IsUsername',
            target: object.constructor,
            propertyName: propertyName,
            options: { message: 'API_ERROR_WRONG_INPUT_USERNAME', ...validationOptions },
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return (
                        typeof value === 'string' &&
                        value.length >= commonConstants.minUsernameLength &&
                        value.length <= commonConstants.maxUsernameLength &&
                        /[a-z A-Z0-9\\_\\"]+$/.test(value)
                    );
                },
            },
        });
    };
}
