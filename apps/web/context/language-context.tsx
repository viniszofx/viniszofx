"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Language = "en" | "pt-BR";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const translations = {
  en: {
    // Hero Section
    "hero.getInTouch": "Get in touch",
    "hero.viewProjects": "View projects",
    "hero.subtitle": "Analist and Fullstack Developer",
    "hero.description":
      "A passionate and proactive Software Developer and Systems Analyst from Brazil, with hands-on experience in full-stack JavaScript development.",

    // About Section
    "about.title": "Professional Profile",
    "about.p1":
      "As a final-year Systems Analysis student at the Federal Institute of Mato Grosso do Sul (IFMS), I have developed comprehensive expertise in software development and systems analysis. With a strong academic foundation and practical experience, I consistently deliver high-quality solutions that align with business objectives.",
    "about.p2":
      "At Embrapa Pantanal, I successfully led data flow modernization initiatives and implemented automation solutions that enhanced operational efficiency. My roles at IFMS and Educação Adventista further strengthened my capabilities in technical support, system security, and stakeholder communication.",
    "about.p3":
      "My technical proficiency centers on JavaScript ecosystem development, with specialized expertise in React, Tailwind CSS, and Node.js. I excel in architecting robust solutions for complex technical challenges and developing performance-optimized applications that deliver measurable business value.",
    "about.p4":
      "Currently seeking opportunities to leverage my technical expertise in an environment that values innovation and excellence. I am committed to contributing to significant projects while advancing my knowledge in modern web technologies and best practices.",

    // Experience Section
    "experience.title": "Experience",
    "experience.embrapa.title": "Analyst | Developer",
    "experience.embrapa.company": "Embrapa Pantanal",
    "experience.embrapa.period": "Oct 2023 - Oct 2024 (1 year)",
    "experience.embrapa.description":
      "Modernized the Alelo Platform data flow, automating real-time collection and validation, eliminating offline spreadsheet inconsistencies. Developed JavaScript scripts, streamlining processes and increasing information efficiency.",

    "experience.ifms.title": "IT Intern | Support",
    "experience.ifms.company":
      "IFMS - Federal Institute of Education, Science and Technology",
    "experience.ifms.period": "Jul 2024 - Oct 2024 (3 months)",
    "experience.ifms.description":
      "Provided technical support to teachers and students, including equipment maintenance and network access configuration, focusing on the Mulheres Mil project. Also configured and registered electronic doors, ensuring the functioning and security of the academic environment.",

    "experience.educacao.title": "Administrative Assistant | Customer Service",
    "experience.educacao.company": "Educação Adventista",
    "experience.educacao.period": "Jan 2019 - Dec 2020 (1 year 11 months)",
    "experience.educacao.description":
      "Worked in the Academic Secretary's office with student service, organization of academic records, and document issuance. Developed skills in communication, information management, and problem-solving, ensuring efficiency in administrative routines.",

    // Technologies Section
    "technologies.title": "Technologies",
    "technologies.languages": "Languages & Frameworks",
    "technologies.databases": "Databases",
    "technologies.tools": "Tools",

    // Projects Section
    "projects.title": "Projects",
    "projects.viewGithub": "View GitHub Profile",
    "projects.noRepos": "No repositories found.",

    // GitHub Activity Section
    "github.title": "GitHub Activity",
    "github.contributions": "Contributions in the last year",

    // Education Section
    "education.title": "Education",
    "education.degree.title": "Systems Analysis",
    "education.degree.institution": "Instituto Federal de Mato Grosso do Sul",
    "education.degree.period": "Jul 2022 - Present",

    "education.certificate.title": "FIC - Computer Operator",
    "education.certificate.institution":
      "Instituto Federal de Mato Grosso do Sul",
    "education.certificate.period": "Completed in 2019",

    "education.languages.title": "Languages",
    "education.languages.portuguese": "Portuguese",
    "education.languages.portuguese.level": "Native",
    "education.languages.english": "English",
    "education.languages.english.level": "Basic",

    // Contact Section
    "contact.title": "Contact",
    "contact.getInTouch": "Get in touch",
    "contact.name": "Name",
    "contact.email": "Email",
    "contact.message": "Message",
    "contact.send": "Send Message",
    "contact.namePlaceholder": "Your name",
    "contact.emailPlaceholder": "Your email",
    "contact.messagePlaceholder": "Your message",

    // Footer
    "footer.copyright": "© 2025 Vinicius Souza",
  },
  "pt-BR": {
    // Hero Section
    "hero.getInTouch": "Entre em contato",
    "hero.viewProjects": "Ver projetos",
    "hero.subtitle": "Programador e Analista Fullstack",
    "hero.description":
      "Um Desenvolvedor de Software e Analista de Sistemas apaixonado e proativo do Brasil, com experiência prática em desenvolvimento JavaScript full-stack.",

    // About Section
    "about.title": "Perfil Profissional",
    "about.p1":
      "Como estudante concluinte de Análise de Sistemas no Instituto Federal de Mato Grosso do Sul (IFMS), desenvolvi ampla expertise em desenvolvimento de software e análise de sistemas. Com sólida base acadêmica e experiência prática, entrego consistentemente soluções de alta qualidade alinhadas aos objetivos organizacionais.",
    "about.p2":
      "Na Embrapa Pantanal, liderei com sucesso iniciativas de modernização de fluxos de dados e implementei soluções de automação que aprimoraram a eficiência operacional. Minhas atuações no IFMS e na Educação Adventista fortaleceram ainda mais minhas competências em suporte técnico, segurança de sistemas e comunicação com stakeholders.",
    "about.p3":
      "Minha proficiência técnica concentra-se no desenvolvimento do ecossistema JavaScript, com expertise especializada em React, Tailwind CSS e Node.js. Destaco-me na arquitetura de soluções robustas para desafios técnicos complexos e no desenvolvimento de aplicações otimizadas que entregam valor mensurável.",
    "about.p4":
      "Atualmente busco oportunidades para aplicar minha expertise técnica em um ambiente que valoriza inovação e excelência. Estou comprometido em contribuir com projetos significativos enquanto avanço meu conhecimento em tecnologias web modernas e melhores práticas.",

    // Experience Section
    "experience.title": "Experiência",
    "experience.embrapa.title": "Analista | Desenvolvedor",
    "experience.embrapa.company": "Embrapa Pantanal",
    "experience.embrapa.period": "Out 2023 - Out 2024 (1 ano)",
    "experience.embrapa.description":
      "Modernizei o fluxo de dados da Plataforma Alelo, automatizando a coleta e validação em tempo real e eliminando inconsistências de planilhas off-line. Desenvolvi scripts em JavaScript, agilizando processos e aumentando a eficiência das informações.",

    "experience.ifms.title": "Estagiário de TI | Suporte",
    "experience.ifms.company":
      "IFMS - Instituto Federal de Educação, Ciência e Tecnologia",
    "experience.ifms.period": "Jul 2024 - Out 2024 (3 meses)",
    "experience.ifms.description":
      "Prestei suporte técnico a docentes e discentes, incluindo manutenção de equipamentos e configuração de acesso à rede, com foco no projeto Mulheres Mil. Também configurei e cadastrei portas eletrônicas, assegurando o funcionamento e a segurança do ambiente acadêmico.",

    "experience.educacao.title": "Auxiliar Administrativo | Atendimento",
    "experience.educacao.company": "Educação Adventista",
    "experience.educacao.period": "Jan 2019 - Dez 2020 (1 ano e 11 meses)",
    "experience.educacao.description":
      "Atuei na Secretaria Acadêmica com atendimento a alunos, organização de registros acadêmicos e emissão de documentos. Desenvolvi habilidades em comunicação, gestão de informações e resolução de problemas, garantindo eficiência nas rotinas administrativas.",

    // Technologies Section
    "technologies.title": "Tecnologias",
    "technologies.languages": "Linguagens & Frameworks",
    "technologies.databases": "Bancos de Dados",
    "technologies.tools": "Ferramentas",

    // Projects Section
    "projects.title": "Projetos",
    "projects.viewGithub": "Ver Perfil no GitHub",
    "projects.noRepos": "Nenhum repositório encontrado.",

    // GitHub Activity Section
    "github.title": "Atividade no GitHub",
    "github.contributions": "Contribuições no último ano",

    // Education Section
    "education.title": "Educação",
    "education.degree.title": "Análise de Sistemas",
    "education.degree.institution": "Instituto Federal de Mato Grosso do Sul",
    "education.degree.period": "Jul 2022 - Presente",

    "education.certificate.title": "FIC - Operador de Computadores",
    "education.certificate.institution":
      "Instituto Federal de Mato Grosso do Sul",
    "education.certificate.period": "Concluído em 2019",

    "education.languages.title": "Idiomas",
    "education.languages.portuguese": "Português",
    "education.languages.portuguese.level": "Nativo",
    "education.languages.english": "Inglês",
    "education.languages.english.level": "Básico",

    // Contact Section
    "contact.title": "Contato",
    "contact.getInTouch": "Entre em contato",
    "contact.name": "Nome",
    "contact.email": "Email",
    "contact.message": "Mensagem",
    "contact.send": "Enviar Mensagem",
    "contact.namePlaceholder": "Seu nome",
    "contact.emailPlaceholder": "Seu email",
    "contact.messagePlaceholder": "Sua mensagem",

    // Footer
    "footer.copyright": "© 2025 Vinicius Souza",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
