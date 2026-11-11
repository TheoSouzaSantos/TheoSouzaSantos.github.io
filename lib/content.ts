export const profile = {
  name: "Théo Souza Santos",
  role: "Técnico em Desenvolvimento de Sistemas",
  location: "Brasil",
  bio: [
    "Técnico em Desenvolvimento de Sistemas, apaixonado por aprender e transformar problemas em soluções otimizadas.",
    "Busco me manter sempre atualizado com novas tecnologias, aplicando organização, responsabilidade e proatividade em cada projeto.",
    "Atualmente estou explorando o universo de IA na nuvem, enquanto continuo construindo minha trajetória como desenvolvedor.",
  ],
  avatarUrl: "https://avatars.githubusercontent.com/u/135135018?v=4&s=640",
  email: "ssztheo@gmail.com",
} as const;

export const socials = {
  github: "https://github.com/TheoSouzaSantos",
  linkedin: "https://www.linkedin.com/in/th%C3%A9o-souza-10ba93363",
  email: `mailto:${profile.email}`,
} as const;

export const skills = [
  "JavaScript",
  "TypeScript",
  "React Native",
  "Node.js e Express",
  "PHP",
  "MySQL",
  "C# e ASP.NET Core",
  "Kotlin",
  "Firebase",
  "Arduino e ESP32",
  "HTML e CSS",
  "Git e GitHub",
] as const;

export type TimelineItem = {
  period: string;
  title: string;
  description: string;
};

export const timeline: TimelineItem[] = [
  {
    period: "1º ano — Técnico",
    title: "Início da formação em Desenvolvimento de Sistemas",
    description:
      "Primeiros contatos com lógica de programação, HTML e Portugol, construindo a base para os anos seguintes do curso técnico.",
  },
  {
    period: "2º ano — Técnico",
    title: "Aprofundamento em programação e banco de dados",
    description:
      "Evolução para projetos com PHP e banco de dados, além de palestras sobre criatividade, inovação e o papel da IA no mercado de trabalho.",
  },
  {
    period: "3º ano — Técnico",
    title: "Projetos aplicados e atualização constante",
    description:
      "Desenvolvimento do Dynamic Flame Sensor e participação em formações sobre cibersegurança, trabalho remoto e soft skills.",
  },
  {
    period: "Agora",
    title: "Explorando IA na nuvem",
    description:
      "Primeiro projeto publicado: o Gerador de Cortes Virais, que usa o Gemini e o Cloudinary para transformar um vídeo longo em um corte curto.",
  },
];
