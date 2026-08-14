const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const buddhistEra = require('dayjs/plugin/buddhistEra');

dayjs.extend(customParseFormat);
dayjs.extend(buddhistEra);

const parsed = dayjs('12/08/2569', 'DD/MM/BBBB');
console.log('IsValid:', parsed.isValid());
console.log('Parsed:', parsed.format('YYYY-MM-DD'));
