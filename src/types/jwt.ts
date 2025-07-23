import { JwtPayload } from "jwt-decode";

export interface CustomJwtPayload extends JwtPayload {
  id: string;
  email: string;
  logged_in_as:
    | "SUPER_ADMIN"
    | "COMPANION_ADMIN"
    | "FINANCE_ADMIN"
    | "CUSTOMER_CARE_REPRESENTATIVE";
}
