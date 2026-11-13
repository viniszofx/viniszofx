import { type ComponentType, createElement } from "react";
import {
  RiArchiveFill, RiAsterisk, RiBankCardFill, RiBankFill, RiBasketballFill, RiBearSmileFill, RiBookOpenFill, RiBookmarkFill,
  RiBriefcaseFill, RiBuildingFill, RiCake2Fill, RiCalendarFill, RiCapsuleFill, RiCarFill, RiChat1Fill, RiCheckboxBlankCircleFill,
  RiCheckboxBlankFill, RiCodeSSlashFill, RiComputerFill, RiDropFill, RiFileTextFill, RiFireFill, RiFlagFill, RiFootballFill,
  RiFootprintFill, RiGamepadFill, RiGift2Fill, RiGobletFill, RiGraduationCapFill, RiGroupFill, RiHeadphoneFill, RiHeartFill,
  RiHome4Fill, RiLeafFill, RiLightbulbFill, RiListCheck, RiMapPinFill, RiMoneyDollarCircleFill, RiMoonFill, RiMusic2Fill,
  RiPingPongFill, RiPlaneFill, RiPushpinFill, RiRestaurantFill, RiRulerFill, RiRunFill, RiSailboatFill, RiScissorsFill,
  RiShoppingBagFill, RiShoppingBasketFill, RiShoppingCartFill, RiSnowflakeFill, RiStarFill, RiStethoscopeFill, RiSuitcaseFill,
  RiSunFill, RiTentFill, RiToolsFill, RiTrainFill, RiTriangleFill, RiTruckFill, RiUmbrellaFill, RiUserFill, RiWallet3Fill,
} from "@remixicon/react";

export type TodoListFields = { name: string; color: string; icon: string };

// Cores próprias das listas (exceção ao uso de tokens, como as cores de pasta do Drive).
export const todoListColors = [
  ["Vermelho", "#ef4444"], ["Laranja", "#f97316"], ["Amarelo", "#eab308"], ["Verde", "#22c55e"],
  ["Azul-claro", "#38bdf8"], ["Azul", "#2563eb"], ["Anil", "#6366f1"], ["Rosa", "#e11d48"],
  ["Roxo", "#a855f7"], ["Marrom", "#a0785a"], ["Grafite", "#64748b"], ["Areia", "#d4a59a"],
] as const;

// Ícone salvo pela chave; a chave nunca muda, mesmo se o desenho trocar.
export const todoListIcons: Record<string, { label: string; icon: ComponentType<{ className?: string }> }> = {
  list: { label: "Lista", icon: RiListCheck },
  bookmark: { label: "Marcador", icon: RiBookmarkFill },
  pin: { label: "Alfinete", icon: RiPushpinFill },
  gift: { label: "Presente", icon: RiGift2Fill },
  cake: { label: "Aniversário", icon: RiCake2Fill },
  school: { label: "Estudos", icon: RiGraduationCapFill },
  suitcase: { label: "Mala", icon: RiSuitcaseFill },
  ruler: { label: "Régua", icon: RiRulerFill },
  file: { label: "Documento", icon: RiFileTextFill },
  book: { label: "Livro", icon: RiBookOpenFill },
  wallet: { label: "Carteira", icon: RiWallet3Fill },
  card: { label: "Cartão", icon: RiBankCardFill },
  money: { label: "Dinheiro", icon: RiMoneyDollarCircleFill },
  run: { label: "Corrida", icon: RiRunFill },
  food: { label: "Refeição", icon: RiRestaurantFill },
  drink: { label: "Bebida", icon: RiGobletFill },
  health: { label: "Remédio", icon: RiCapsuleFill },
  doctor: { label: "Médico", icon: RiStethoscopeFill },
  home: { label: "Casa", icon: RiHome4Fill },
  building: { label: "Prédio", icon: RiBuildingFill },
  bank: { label: "Banco", icon: RiBankFill },
  tent: { label: "Acampamento", icon: RiTentFill },
  computer: { label: "Computador", icon: RiComputerFill },
  music: { label: "Música", icon: RiMusic2Fill },
  game: { label: "Jogo", icon: RiGamepadFill },
  headphone: { label: "Fone", icon: RiHeadphoneFill },
  leaf: { label: "Folha", icon: RiLeafFill },
  person: { label: "Pessoa", icon: RiUserFill },
  group: { label: "Grupo", icon: RiGroupFill },
  bear: { label: "Criança", icon: RiBearSmileFill },
  basket: { label: "Cesta", icon: RiShoppingBasketFill },
  cart: { label: "Carrinho", icon: RiShoppingCartFill },
  bag: { label: "Sacola", icon: RiShoppingBagFill },
  box: { label: "Caixa", icon: RiArchiveFill },
  football: { label: "Futebol", icon: RiFootballFill },
  basketball: { label: "Basquete", icon: RiBasketballFill },
  pingpong: { label: "Raquete", icon: RiPingPongFill },
  train: { label: "Trem", icon: RiTrainFill },
  plane: { label: "Avião", icon: RiPlaneFill },
  boat: { label: "Barco", icon: RiSailboatFill },
  car: { label: "Carro", icon: RiCarFill },
  truck: { label: "Caminhão", icon: RiTruckFill },
  umbrella: { label: "Guarda-chuva", icon: RiUmbrellaFill },
  sun: { label: "Sol", icon: RiSunFill },
  moon: { label: "Lua", icon: RiMoonFill },
  drop: { label: "Gota", icon: RiDropFill },
  snow: { label: "Neve", icon: RiSnowflakeFill },
  fire: { label: "Fogo", icon: RiFireFill },
  work: { label: "Trabalho", icon: RiBriefcaseFill },
  tools: { label: "Ferramentas", icon: RiToolsFill },
  scissors: { label: "Tesoura", icon: RiScissorsFill },
  code: { label: "Código", icon: RiCodeSSlashFill },
  idea: { label: "Ideia", icon: RiLightbulbFill },
  chat: { label: "Conversa", icon: RiChat1Fill },
  steps: { label: "Passos", icon: RiFootprintFill },
  calendar: { label: "Calendário", icon: RiCalendarFill },
  flag: { label: "Bandeira", icon: RiFlagFill },
  place: { label: "Local", icon: RiMapPinFill },
  asterisk: { label: "Asterisco", icon: RiAsterisk },
  square: { label: "Quadrado", icon: RiCheckboxBlankFill },
  circle: { label: "Círculo", icon: RiCheckboxBlankCircleFill },
  triangle: { label: "Triângulo", icon: RiTriangleFill },
  heart: { label: "Coração", icon: RiHeartFill },
  star: { label: "Estrela", icon: RiStarFill },
};

// Desenha o ícone da lista pela chave (sem criar componente durante a renderização).
export function renderTodoListIcon(key: string, className: string) {
  return createElement((todoListIcons[key] ?? todoListIcons.list).icon, { className });
}
