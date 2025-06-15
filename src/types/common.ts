export type Avatar = {
  url: string;
  key: string;
};

export interface ApiResponse<T> {
  EC: number;
  EM: string;
  data: T | null;
}
