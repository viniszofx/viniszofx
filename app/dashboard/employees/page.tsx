import type { Metadata } from "next";
import { EmployeesPage } from "@/components/employees/employees-page";
export const metadata: Metadata = { title: "Employees | Viniccius" };
export default async function EmployeesRoute({ searchParams }: { searchParams: Promise<{ employee?: string | string[] }> }) {
  const { employee } = await searchParams;
  const id = typeof employee === "string" ? employee : "";
  return <EmployeesPage key={id} initialEmployeeId={id} />;
}
