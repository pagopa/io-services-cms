declare module "adf-to-md" {
  export interface ConvertResult {
    result: string;
    warnings: Set<string>;
  }

  export interface ConverterType {
    convert(adf: unknown): ConvertResult;
  }

  const Converter: ConverterType;
  export default Converter;
}
