import { Constants, type Database } from "../database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];
export type UserStatus = Database["public"]["Enums"]["user_status"];
export type JobStatus = Database["public"]["Enums"]["job_status"];
export type ApplicationStatus =
  Database["public"]["Enums"]["application_status"];

export const USER_ROLES = Constants.public.Enums.user_role;
export const USER_STATUSES = Constants.public.Enums.user_status;
export const JOB_STATUSES = Constants.public.Enums.job_status;
export const APPLICATION_STATUSES = Constants.public.Enums.application_status;
