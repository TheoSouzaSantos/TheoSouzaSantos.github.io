export type Project = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  href?: string;
  status: "live" | "upcoming";
  featured?: boolean;
};

const gh = (repo: string) => `https://github.com/TheoSouzaSantos/${repo}`;

export const projects: Project[] = [
  {
    slug: "dynamic-flame-sensor",
    title: "Dynamic Flame Sensor",
    description:
      "Meu TCC: placas ESP32 leem sensores de chama e gás e enviam as leituras para uma API. O app Android mostra o estado de cada sensor, guarda o histórico e avisa no celular assim que algo é detectado. O repositório inclui o firmware e o passo a passo para montar a placa.",
    tags: ["React Native", "Node.js", "Firebase", "ESP32"],
    href: gh("Dynamic-Flame-Sensor"),
    status: "live",
    featured: true,
  },
  {
    slug: "gerador-de-cortes-virais",
    title: "Gerador de Cortes Virais",
    description:
      "Site que encontra o trecho mais viral de um vídeo: o upload vai para o Cloudinary, o Gemini lê a transcrição e escolhe o início e o fim do corte, e o Cloudinary entrega o clipe pronto para assistir.",
    tags: ["JavaScript", "Gemini API", "Cloudinary", "Tailwind"],
    href: gh("Gerador-de-Cortes-Virais"),
    status: "live",
  },
  {
    slug: "jogos-navigation",
    title: "JogosNavigation",
    description:
      "App mobile de catálogo de jogos com busca, tela de detalhes e lista de desenvolvedores, navegando entre abas, menu lateral e pilha de telas.",
    tags: ["React Native", "Expo", "React Navigation"],
    href: gh("JogosNavigation"),
    status: "live",
  },
  {
    slug: "sensores-aspnet",
    title: "Cadastro de sensores em ASP.NET",
    description:
      "Aplicação web em ASP.NET Core MVC com cadastro, edição, detalhes e exclusão de sensores, feita nas aulas de Programação Web III.",
    tags: ["C#", "ASP.NET Core", "MVC"],
    href: gh("Fatec-2026-DFS"),
    status: "live",
  },
  {
    slug: "meu-aplicativo",
    title: "Lista de pessoas em Kotlin",
    description:
      "Primeiro app Android nativo: uma lista de pessoas construída com Kotlin e Gradle.",
    tags: ["Kotlin", "Android"],
    href: gh("MeuAplicativo"),
    status: "live",
  },
];
