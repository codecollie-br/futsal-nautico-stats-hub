import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Jogador, Partida, Domingo, EventoPartida, JogadorPorPartida, TimeEnum, TipoEvento } from "@/types/nautico";
import { nanoid } from 'nanoid';

// Hook para buscar jogadores
export const useJogadores = () => {
  return useQuery({
    queryKey: ['jogadores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jogadores')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Jogador[];
    }
  });
};

// Hook para buscar partidas com informações relacionadas
export const usePartidas = () => {
  return useQuery({
    queryKey: ['partidas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partidas')
        .select(`
          *,
          domingo:domingos(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Partida[];
    }
  });
};

// Hook para buscar a partida atual (em andamento)
export const usePartidaAtual = () => {
  return useQuery({
    queryKey: ['partida-atual'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partidas')
        .select(`
          *,
          domingo:domingos(*),
          jogadores_por_partida(
            *,
            jogador:jogadores(*)
          ),
          eventos_partida(*)
        `)
        .eq('status', 'EM_ANDAMENTO')
        .maybeSingle();
      
      if (error) throw error;
      return data as Partida | null;
    }
  });
};

// Hook para buscar domingos
export const useDomingos = () => {
  return useQuery({
    queryKey: ['domingos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('domingos')
        .select('*')
        .order('data_domingo', { ascending: false });
      
      if (error) throw error;
      return data as Domingo[];
    }
  });
};

// Hook para criar um novo domingo
export const useCreateDomingo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data_domingo: string) => {
      const token_moderacao = nanoid(16);
      const { data, error } = await supabase
        .from('domingos')
        .insert({ data_domingo, token_moderacao })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domingos'] });
    }
  });
};

// Hook para criar uma nova partida
export const useCreatePartida = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (domingo_id: number) => {
      const { data, error } = await supabase
        .from('partidas')
        .insert({ domingo_id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partidas'] });
      queryClient.invalidateQueries({ queryKey: ['partida-atual'] });
    }
  });
};

// Hook para iniciar uma partida
export const useIniciarPartida = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (partida_id: number) => {
      const { data, error } = await supabase
        .from('partidas')
        .update({ 
          status: 'EM_ANDAMENTO',
          hora_inicio: new Date().toISOString()
        })
        .eq('id', partida_id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partidas'] });
      queryClient.invalidateQueries({ queryKey: ['partida-atual'] });
    }
  });
};

// Hook para finalizar uma partida
export const useFinalizarPartida = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ partida_id, duracao_minutos, vencedor }: { 
      partida_id: number; 
      duracao_minutos: number; 
      vencedor: string;
    }) => {
      const { data, error } = await supabase
        .from('partidas')
        .update({ 
          status: 'FINALIZADA',
          hora_fim: new Date().toISOString(),
          duracao_minutos,
          vencedor
        })
        .eq('id', partida_id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partidas'] });
      queryClient.invalidateQueries({ queryKey: ['partida-atual'] });
    }
  });
};

// Hook para adicionar jogador a uma partida
export const useAdicionarJogadorPartida = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ partida_id, jogador_id, time }: { 
      partida_id: number; 
      jogador_id: number; 
      time: TimeEnum;
    }) => {
      const { data, error } = await supabase
        .from('jogadores_por_partida')
        .insert({ partida_id, jogador_id, time })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partida-atual'] });
    }
  });
};

// Hook para registrar evento na partida
export const useRegistrarEvento = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (evento: Partial<EventoPartida>) => {
      const { data, error } = await supabase
        .from('eventos_partida')
        .insert(evento)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partida-atual'] });
      queryClient.invalidateQueries({ queryKey: ['partidas'] });
    }
  });
};

// Hook para buscar fila de espera do domingo atual
export const useFilaEspera = (domingo_id?: number) => {
  return useQuery({
    queryKey: ['fila-espera', domingo_id],
    queryFn: async () => {
      if (!domingo_id) return [];
      const { data, error } = await supabase
        .from('fila_espera')
        .select('*, jogador:jogadores(*)')
        .eq('domingo_id', domingo_id)
        .order('ordem');
      if (error) throw error;
      return data || [];
    }
  });
};

// Hook para adicionar jogador à fila de espera
export const useAdicionarFilaEspera = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ domingo_id, jogador_id, ordem }: { domingo_id: number, jogador_id: number, ordem: number }) => {
      const { error } = await supabase
        .from('fila_espera')
        .insert({ domingo_id, jogador_id, ordem });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fila-espera', variables.domingo_id] });
    }
  });
};

// Hook para atualizar vitórias consecutivas por cor
export const useAtualizarVitoriasConsecutivas = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ domingo_id, cor, valor }: { domingo_id: number, cor: 'LARANJA' | 'PRETO', valor: number }) => {
      const field = cor === 'LARANJA' ? 'vitorias_laranja_consecutivas' : 'vitorias_preto_consecutivas';
      const { error } = await supabase
        .from('domingos')
        .update({ [field]: valor })
        .eq('id', domingo_id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['domingos'] });
    }
  });
};
