export interface ApplicationOptions {
  componentDirs: string[];
  timeout?: number;
  baseUrl?: string;
  validation?: {
    jsonSchema?: boolean;
  };
  extraComponents?: Array<any>;
}
