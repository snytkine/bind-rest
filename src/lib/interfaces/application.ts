export interface ApplicationOptions {
  componentDirs: string[];
  envOverrideVar?: string;
  timeout?: number;
  baseUrl?: string;
  validation?: {
    jsonSchema?: boolean;
  };
  extraComponents?: Array<any>;
}
