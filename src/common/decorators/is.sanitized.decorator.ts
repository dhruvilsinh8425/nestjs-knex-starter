import validator from 'validator';
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsSanitized(validationOptions?: ValidationOptions) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsSanitized',
            target: object.constructor,
            propertyName: propertyName,
            options: { message: 'API_ERROR_WRONG_INPUT_TEXT', ...validationOptions },
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return typeof value === 'string' && value === validator.escape(value);
                },
            },
        });
    };
}
