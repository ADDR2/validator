const validTypes = [
    'Boolean',
    'Integer',
    'Float',
    'String',
    'Object',
    'Array',
    'Function'
];

class Validator {
    constructor() {
        this.type = this.evalType;
        this.min = this.validateMin;
        this.max = this.validateMax;
        this.from = this.validateFrom;
        this.minSize = this.validateMinSize;
        this.template = this.validateTemplate;
        this.required = () => true;
    }

    evalType(value, type) {
        return validTypes.indexOf(type) >= 0 &&
            `validate${type}` in this &&
            this[`validate${type}`](value)
        ;
    }

    validateTemplate(subject, schema) {
        if(Array.isArray(subject)) {
            for(const item of subject) {
                if(!this.validateAnySchema(item, schema))
                    return false;
            }

            return true;
        } else
            return this.validateAnySchema(subject, schema);
    }

    validateInteger(value) {
        const integerRegex = /^[0-9]+$/;
        return typeof value === 'number' && integerRegex.test(`${value}`);
    }

    validateFloat(value) {
        const floatRegex = /^[0-9]*(\.[0-9]+)?$/;
        return typeof value === 'number' && floatRegex.test(`${value}`);
    }

    validateArray(value) {
        return Array.isArray(value);
    }

    validateObject(value) {
        return typeof value === 'object';
    }

    validateFunction(value) {
        return typeof value === 'function';
    }

    validateString(value) {
        return typeof value === 'string'
    }

    validateBoolean(value) {
        return typeof value === 'boolean'
    }

    validateMin(value, min) {
        return (this.validateInteger(value) || this.validateFloat(value)) && value >= min;
    }

    validateMax(value, max) {
        return (this.validateInteger(value) || this.validateFloat(value)) && value <= max;
    }

    validateMinSize(array, min) {
        return this.validateArray(array) && array.length >= min;
    }

    validateFrom(value, from) {
        return from.indexOf(value) !== -1;
    }

    validateRequires(object = {}, schema) {
        for(const [ key, value ] of Object.entries(schema))
            if(!(key in object) && value.required)
                return false;

        return true;
    }

    validateAnySchema(subject, schema) {
        if(this.validateRequires(subject, schema)) {

            const keys = Object.keys(subject);

            for( const key of keys ) {
                if(key in schema) {
                    const keyRules = schema[key]
                    
                    for(const [ rule, value ] of Object.entries(keyRules))
                        if(
                            rule in this &&
                            !this[rule].call(this, subject[key], value)
                        )
                            return false;

                }
            }

            return true;
        }

        return false;
    }
}

module.exports = Validator;

/* Example
const defaultStageSchema = {
    name: {
        type: 'String',
        required: true
    },
    airflow_percent: {
        type: 'Integer',
        min: 0,
        max: 100,
        from: [0, 50, 60, 70, 80, 90, 100],
        required: true
    },
    dutycycle_percent: {
        type: 'Integer',
        min: 0,
        max: 100,
        from: [0, 50, 60, 70, 80, 90, 100],
        required: true
    },
    time_sec: {
        type: 'Integer',
        min: 0,
        max: 1000,
        required: true
    }
};

const defaultCookProfile = {
    temperature_setpoint_c: {
        type: 'Integer',
        min: 0,
        max: 400,
        required: true
    },
    stages: {
        type: 'Array',
        minSize: 1,
        template: defaultStageSchema,
        required: true
    }
};

console.log( (new Validator()).validateAnySchema({
    temperature_setpoint_c: 400,
    stages: [
        {
            name: 'hey',
            airflow_percent: 60,
            dutycycle_percent: 50,
            time_sec: 1000
        },
        {
            name: 'hey',
            airflow_percent: 60,
            dutycycle_percent: 50,
            time_sec: 1000
        }
    ]
}, defaultCookProfile));
*/