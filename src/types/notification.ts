export type NotificationLevel = "success" | "warning" | "error";

export type AppNotification = {
  id: number;
  level: NotificationLevel;
  message: string;
  persistent?: boolean;
};
