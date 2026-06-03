export type LoginRole = "admin" | "empresa";

export type LoginLocationState = {
  from?: string;
};

export type LoginResponseData = {
  token: string;
  user: {
    role: LoginRole;
    displayName: string;
  };
};
