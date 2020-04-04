const isStringOrNumberOrBoolean = (s: any): boolean => {
  return (
    typeof s === 'string' || typeof s === 'number' || typeof s === 'boolean' || s instanceof String
  );
};

export default isStringOrNumberOrBoolean;
