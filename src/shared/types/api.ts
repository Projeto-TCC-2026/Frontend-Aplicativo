export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  message?: string | null;
};

export type ApiError = {
  status: number;
  message: string;
  fieldErrors?: Record<string, string>;
};
