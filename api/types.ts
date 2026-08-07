export interface ApiResponse<T = any> {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data: T;
  // Some APIs might return things in different structures, but standardizing to this.
}
