"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Language = "en" | "pt-BR"

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    // Hero Section
    "hero.getInTouch": "Get in touch",
    "hero.viewProjects": "View projects",
    "hero.subtitle": "Student Analyst of Systems on IFMS 💚",
    "hero.description":
      "A passionate and proactive Software Developer and Systems Analyst from Brazil, with hands-on experience in full-stack JavaScript development.",

    // About Section
    "about.title": "About Me",
    "about.p1":
      "Hello! I'm Vinicius, a 21-year-old Systems Analysis student in my final semesters at the Federal Institute of Mato Grosso do Sul. Throughout my academic and professional journey, I've developed a strong foundation in software development and systems analysis.",
    "about.p2":
      "My professional experience includes working at Embrapa Pantanal, where I modernized data flows and developed automation scripts that significantly improved efficiency. At IFMS, I provided technical support and configured security systems, while at Educação Adventista, I managed academic records and developed strong communication skills through direct customer service.",
    "about.p3":
      "I'm particularly skilled in JavaScript development, with experience in React, Tailwind CSS, and Node.js. I enjoy solving complex problems through innovative solutions and have a passion for creating efficient, user-friendly applications that make a real difference.",
    "about.p4":
      "Currently seeking new opportunities where I can apply my technical skills and continue growing as a developer, I'm eager to join dynamic teams where I can contribute to meaningful projects while expanding my knowledge in modern web technologies.",

    // Experience Section
    "experience.title": "Experience",
    "experience.embrapa.title": "Analyst | Developer",
    "experience.embrapa.company": "Embrapa Pantanal",
    "experience.embrapa.period": "Oct 2023 - Oct 2024 (1 year)",
    "experience.embrapa.description":
      "Modernized the Alelo Platform data flow, automating real-time collection and validation, eliminating offline spreadsheet inconsistencies. Developed JavaScript scripts, streamlining processes and increasing information efficiency.",

    "experience.ifms.title": "IT Intern | Support",
    "experience.ifms.company": "IFMS - Federal Institute of Education, Science and Technology",
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
    "education.certificate.institution": "Instituto Federal de Mato Grosso do Sul",
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
    "hero.subtitle": "Estudante de Análise de Sistemas no IFMS 💚",
    "hero.description":
      "Um Desenvolvedor de Software e Analista de Sistemas apaixonado e proativo do Brasil, com experiência prática em desenvolvimento JavaScript full-stack.",

    // About Section
    "about.title": "Sobre Mim",
    "about.p1":
      "Olá! Sou Vinicius, um estudante de 21 anos de Análise de Sistemas nos últimos semestres do Instituto Federal de Mato Grosso do Sul. Ao longo da minha jornada acadêmica e profissional, desenvolvi uma base sólida em desenvolvimento de software e análise de sistemas.",
    "about.p2":
      "Minha experiência profissional inclui trabalho na Embrapa Pantanal, onde modernizei fluxos de dados e desenvolvi scripts de automação que melhoraram significativamente a eficiência. No IFMS, forneci suporte técnico e configurei sistemas de segurança, enquanto na Educação Adventista, gerenciei registros acadêmicos e desenvolvi fortes habilidades de comunicação através do atendimento direto ao cliente.",
    "about.p3":
      "Sou particularmente habilidoso em desenvolvimento JavaScript, com experiência em React, Tailwind CSS e Node.js. Gosto de resolver problemas complexos através de soluções inovadoras e tenho paixão por criar aplicações eficientes e amigáveis que fazem diferença real.",
    "about.p4":
      "Atualmente buscando novas oportunidades onde posso aplicar minhas habilidades técnicas e continuar crescendo como desenvolvedor, estou ansioso para me juntar a equipes dinâmicas onde posso contribuir para projetos significativos enquanto expando meu conhecimento em tecnologias web modernas.",

    // Experience Section
    "experience.title": "Experiência",
    "experience.embrapa.title": "Analista | Desenvolvedor",
    "experience.embrapa.company": "Embrapa Pantanal",
    "experience.embrapa.period": "Out 2023 - Out 2024 (1 ano)",
    "experience.embrapa.description":
      "Modernizei o fluxo de dados da Plataforma Alelo, automatizando a coleta e validação em tempo real e eliminando inconsistências de planilhas off-line. Desenvolvi scripts em JavaScript, agilizando processos e aumentando a eficiência das informações.",

    "experience.ifms.title": "Estagiário de TI | Suporte",
    "experience.ifms.company": "IFMS - Instituto Federal de Educação, Ciência e Tecnologia",
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
    "education.certificate.institution": "Instituto Federal de Mato Grosso do Sul",
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
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

