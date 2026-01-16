export function getConstant(name: string, idl: any): Uint8Array {
  const constant = idl.constants?.find((c: any) => c.name === name);
  if (!constant) {
    throw new Error(`Constant "${name}" not found in IDL`);
  }
  const value = typeof constant.value === 'string' ? JSON.parse(constant.value) : constant.value;
  return new Uint8Array(value);
}

export function getConstantRaw(name: string, idl: any): any {
  const constant = idl.constants?.find((c: any) => c.name === name);
  if (!constant) {
    throw new Error(`Constant "${name}" not found in IDL`);
  }
  return constant.value;
}
