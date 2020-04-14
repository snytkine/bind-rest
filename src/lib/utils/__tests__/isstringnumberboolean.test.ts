import isStringOrNumberOrBoolean from '../isstringnumberboolean';

describe('Test of isStringOrNumberOrBoolean', () => {
  test('should return true in param is string', () => {

    const res = isStringOrNumberOrBoolean('test');
    expect(res).toEqual(true);
  });

  test('should return true in param is number', () => {

    const res = isStringOrNumberOrBoolean(3);
    expect(res).toEqual(true);
  });

  test('should return true in param is boolean', () => {

    const res = isStringOrNumberOrBoolean(false);
    expect(res).toEqual(true);
  });

  test('should return true in param is String object', () => {

    const res = isStringOrNumberOrBoolean(String('test'));
    expect(res).toEqual(true);
  });

  test('should return false in param is array', () => {

    const res = isStringOrNumberOrBoolean(['test']);
    expect(res).toEqual(false);
  });

  test('should return true in param is object', () => {

    const res = isStringOrNumberOrBoolean({ test: 1 });
    expect(res).toEqual(false);
  });

  test('should return true in param is Promise', () => {

    const res = isStringOrNumberOrBoolean(Promise.resolve(true));
    expect(res).toEqual(false);
  });
});
