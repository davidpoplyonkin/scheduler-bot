import { AxiosError } from 'axios';

export class StructuredApiError extends AxiosError {
  public detail: string;
  public nonCritical: boolean;
  public nonSensitive: boolean;

  constructor(
    originalError: AxiosError,
    detail: string,
    nonCritical: boolean,
    nonSensitive: boolean,
  ) {
    super(
      detail,
      originalError.code,
      originalError.config,
      originalError.request,
      originalError.response,
    );
    this.detail = detail;
    this.nonCritical = nonCritical;
    this.nonSensitive = nonSensitive;
  }
}
