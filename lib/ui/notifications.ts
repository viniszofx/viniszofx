"use client";
import { Toast } from "@base-ui/react/toast";
export const toastManager = Toast.createToastManager();
export function notifySuccess(title: string, description?: string) {
  toastManager.add({ title, description, type: "success", timeout: 4500 });
}
export function notifyError(title: string, description?: string) {
  toastManager.add({ id: `error:${title}`, title, description, type: "error", priority: "high", timeout: 8000 });
}
