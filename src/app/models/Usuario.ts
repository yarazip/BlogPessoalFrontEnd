export interface Usuario {
  id: number;
  nome?: string;
  email?: string;
  foto?: string;
  /** Só indica se a interface mostra ações de administrador; a permissão real é checada na API. */
  admin?: boolean;
}
