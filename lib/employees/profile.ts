import { localDate } from "@/lib/format/date";
// Campos trabalhistas do colaborador, portados do cadastro do Nodus.
// Tudo é opcional para manter os registros antigos válidos.

export type EmployeeDependent = { id: string; name: string; relationship: string; birthDate: string; cpf: string; incomeTax: boolean; familyAllowance: boolean };
export type EmploymentEventType = "vacation" | "leave" | "accident" | "contract_change";
export type EmploymentEvent = {
  id: string; type: EmploymentEventType; startDate: string; endDate: string; description: string;
  accrualStartDate: string; accrualEndDate: string; reason: string; catNumber: string; location: string;
  newRole: string; newDepartment: string; newSalary: string; newWeeklyHours: string; newWorkLocation: string; newContractType: string;
};
export type EmergencyContact = { name: string; relationship: string; phone: string };
export type EmployeeProfile = {
  cpf?: string; birthDate?: string; sex?: string; nationality?: string; maritalStatus?: string; education?: string;
  registrationNumber?: string; admissionDate?: string; terminationDate?: string; categoryCode?: string; cboCode?: string;
  contractType?: string; contractEndDate?: string; workNature?: string; salary?: string; weeklyHours?: string;
  workSchedule?: string; workLocation?: string; emergencyContact?: EmergencyContact;
  dependents?: EmployeeDependent[]; employmentEvents?: EmploymentEvent[];
};

export const sexOptions = ["Feminino", "Masculino", "Não informado"];
export const maritalOptions = ["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)"];
export const educationOptions = [
  "Sem escolaridade", "Ensino fundamental incompleto", "Ensino fundamental completo", "Ensino médio incompleto", "Ensino médio completo",
  "Ensino técnico", "Ensino superior incompleto", "Ensino superior completo", "Pós-graduação", "Mestrado", "Doutorado",
];
export const workNatureOptions = ["Urbana", "Rural"];
export const contractTypeOptions = ["Indeterminado", "Determinado", "Intermitente"];
export const relationshipOptions = ["Filho(a)", "Cônjuge", "Companheiro(a)", "Pai", "Mãe", "Outro"];
export const employmentEventLabels: Record<EmploymentEventType, string> = {
  vacation: "Férias", leave: "Afastamento", accident: "Acidente de trabalho", contract_change: "Alteração contratual",
};

/** Catálogo inicial de cargos (departamento e nível), o mesmo do Nodus. */
export const jobTitles = [
  ...["Auxiliar de Instalador (Integrador) Junior", "Auxiliar de Instalador (Integrador) Pleno", "Auxiliar de Instalador (Integrador) Sênior",
    "Instalador (Integrador) Junior", "Instalador (Integrador) Pleno", "Instalador (Integrador) Sênior",
    "Técnico de Rede Junior", "Técnico de Rede Pleno", "Técnico de Rede Sênior",
    "Programador Junior", "Programador Pleno", "Programador Sênior",
    "Controle Operacional", "Supervisor de Campo", "Supervisor Técnico"].map((name, index) => ({ name, department: "Técnico", level: index + 1 })),
  { name: "Auxiliar de Escritório", department: "Administrativo", level: 1 },
  { name: "Auxiliar de Help Desk", department: "Administrativo", level: 1 },
  { name: "Auxiliar Administrativo", department: "Administrativo", level: 2 },
  { name: "Assistente Administrativo", department: "Administrativo", level: 3 },
  { name: "Analista Administrativo", department: "Administrativo", level: 4 },
  { name: "Analista Administrativo / RH", department: "Administrativo", level: 5 },
  { name: "Auxiliar de projetos", department: "Projetos", level: 1 },
  { name: "Desenhista Projetos Técnicos", department: "Projetos", level: 2 },
  { name: "Auxiliar de Estoque", department: "Estoque", level: 1 },
  { name: "Estoquista", department: "Estoque", level: 2 },
];

export function validCpf(value = "") {
  const digits = value.replace(/\D/g, "");
  if (!digits) return true;
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  for (let size = 9; size < 11; size++) {
    const total = [...digits.slice(0, size)].reduce((sum, digit, index) => sum + Number(digit) * (size + 1 - index), 0);
    if ((total * 10) % 11 % 10 !== Number(digits[size])) return false;
  }
  return true;
}

export function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

/** Máscara brasileira para fixo (10 dígitos) e celular (11 dígitos). */
export function formatPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  const local = digits.slice(2);
  if (local.length <= 4) return `(${digits.slice(0, 2)}) ${local}`;
  const prefix = digits.length === 11 ? 5 : 4;
  return `(${digits.slice(0, 2)}) ${local.slice(0, prefix)}-${local.slice(prefix)}`;
}

export function blankDependent(id: string): EmployeeDependent {
  return { id, name: "", relationship: "", birthDate: "", cpf: "", incomeTax: false, familyAllowance: false };
}

export function blankEvent(id: string, type: EmploymentEventType = "vacation", startDate = ""): EmploymentEvent {
  return { id, type, startDate, endDate: "", description: "", accrualStartDate: "", accrualEndDate: "", reason: "", catNumber: "", location: "", newRole: "", newDepartment: "", newSalary: "", newWeeklyHours: "", newWorkLocation: "", newContractType: "" };
}

/** As mesmas regras do esquema do Nodus; devolve a primeira mensagem de erro. */
export function validateProfile(value: EmployeeProfile) {
  const today = localDate();
  if (!validCpf(value.cpf)) return "CPF inválido.";
  if (value.birthDate && value.birthDate > today) return "A data de nascimento não pode ser futura.";
  if (value.contractEndDate && !value.admissionDate) return "Informe a data de admissão antes do fim do contrato.";
  if (value.contractEndDate && value.admissionDate && value.contractEndDate < value.admissionDate) return "O fim do contrato não pode anteceder a admissão.";
  if (value.terminationDate && !value.admissionDate) return "Informe a data de admissão antes do desligamento.";
  if (value.terminationDate && value.admissionDate && value.terminationDate < value.admissionDate) return "O desligamento não pode anteceder a admissão.";
  if (value.weeklyHours && (Number(value.weeklyHours) < 0 || Number(value.weeklyHours) > 168)) return "As horas semanais devem ficar entre 0 e 168.";
  for (const [index, dependent] of (value.dependents ?? []).entries()) {
    const label = `Dependente ${index + 1}`;
    if (!dependent.name.trim()) return `${label}: informe o nome.`;
    if (!dependent.relationship) return `${label}: informe o vínculo.`;
    if (!dependent.birthDate) return `${label}: informe a data de nascimento.`;
    if (dependent.birthDate > today) return `${label}: a data de nascimento não pode ser futura.`;
    if (!validCpf(dependent.cpf)) return `${label}: CPF inválido.`;
    if (dependent.incomeTax && !dependent.cpf) return `${label}: informe o CPF para a dedução do IRRF.`;
  }
  const cpfs = (value.dependents ?? []).map(dependent => dependent.cpf.replace(/\D/g, "")).filter(Boolean);
  if (new Set(cpfs).size !== cpfs.length) return "Há dependentes com o mesmo CPF.";
  for (const event of value.employmentEvents ?? []) {
    const label = employmentEventLabels[event.type];
    if (!event.startDate) return `${label}: informe a data inicial.`;
    if (event.endDate && event.endDate < event.startDate) return `${label}: a data final não pode anteceder a inicial.`;
    if (event.accrualStartDate && event.accrualEndDate && event.accrualEndDate < event.accrualStartDate) return `${label}: o fim do período aquisitivo não pode anteceder o início.`;
  }
  return "";
}
