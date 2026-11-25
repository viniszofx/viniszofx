import { getImageProps, type ImageProps } from "next/image";

/**
 * Mesma otimização do <Image> do Next (srcset, tamanhos, qualidade, lazy), mas renderizada no servidor como <img>
 * comum: não manda o componente de imagem para o navegador. Para páginas de servidor que só exibem imagens.
 * "priority" vira carregamento imediato com prioridade alta.
 */
export function ServerImage(props: ImageProps) {
  const { props: imgProps } = getImageProps(props);
  // eslint-disable-next-line @next/next/no-img-element -- é o <img> que o próprio getImageProps prepara.
  return <img {...imgProps} alt={props.alt} />;
}
