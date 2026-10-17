export interface Usuario {
  id: number;
  nome?: string;
  email?: string;
  foto?: string;
  /** Só indica se a interface mostra ações de administrador; a permissão real é checada na API. */
  admin?: boolean;
  /** Conta da administração do site, como as respostas públicas mostram (autor de postagens e comentários): ganha o selo de verificado. */
  verificado?: boolean;
}
