import { Tema } from '../models/Tema';
import { Usuario } from '../models/Usuario';

export interface Postagem {
  id?: number;
  titulo: string;
  texto: string;
  data?: Date | string; 
  tema?: Tema;
  usuario?: Usuario;
}
