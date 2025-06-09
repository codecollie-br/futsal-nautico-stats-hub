
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Jogador, Partida, Domingo, EventoPartida, JogadorPorPartida, TimeEnum, TipoEvento, VotoCraqueDomingo } from "@/types/nautico";
import { nanoid } from 'nanoid';

// Hook para buscar jogadores
export const useJogadores = () => {
  return useQuery({
    queryKey: ['jogadores'],
    queryFn: async () => {
      console.log("Buscando jogadores...");
      const { data, error } = await supabase
        .from('jogadores')
        .select('*')
        .order('nome');
      
      console.log("Resultado da busca:", { data, error });
      
      if (error) {
        console.error("Erro ao buscar jogadores:", error);
        throw error;
      }
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

// Hook para remover jogador de uma partida
export const useRemoverJogadorPartida = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jogador_por_partida_id: number) => {
      const { error } = await supabase
        .from('jogadores_por_partida')
        .delete()
        .eq('id', jogador_por_partida_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partida-atual'] });
    }
  });
};

// Hook para remover jogador da fila de espera
export const useRemoverFilaEspera = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fila_espera_id: number) => {
      const { error } = await supabase
        .from('fila_espera')
        .delete()
        .eq('id', fila_espera_id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fila-espera'] });
      queryClient.invalidateQueries({ queryKey: ['partida-atual'] }); // Para atualizar a lista de aptos
    }
  });
};

// Hook para liberar a votação do Craque do Domingo
export const useLiberarVotacaoCraque = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (domingo_id: number) => {
      const { data, error } = await supabase
        .from('domingos')
        .update({ votacao_liberada: true })
        .eq('id', domingo_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['domingos'] });
      queryClient.invalidateQueries({ queryKey: ['partida-atual'] }); // Se a partida atual for a do domingo em questão
    }
  });
};

// Hook para registrar um voto no Craque do Domingo
export const useRegistrarVotoCraque = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (voto: { domingo_id: number, votante_jogador_id: number, votado_jogador_id: number }) => {
      const { data, error } = await supabase
        .from('votos_craque_domingo')
        .insert(voto)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['votos-craque-domingo', variables.domingo_id] });
      queryClient.invalidateQueries({ queryKey: ['partida-atual'] }); // Para revalidar o estado da votação na partida atual
    }
  });
};

// Hook para buscar os votos de um domingo específico
export const useVotosCraqueDomingo = (domingo_id?: number) => {
  return useQuery({
    queryKey: ['votos-craque-domingo', domingo_id],
    queryFn: async () => {
      if (!domingo_id) return [];
      const { data, error } = await supabase
        .from('votos_craque_domingo')
        .select('*, votante:jogadores!votante_jogador_id(*), votado:jogadores!votado_jogador_id(*)')
        .eq('domingo_id', domingo_id);
      if (error) throw error;
      return data as VotoCraqueDomingo[] || [];
    }
  });
};

// Hook para calcular e definir o Craque do Domingo
export const useCalcularCraqueDomingo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (domingo_id: number) => {
      // 1. Obter todos os votos para o domingo
      const { data: votos, error: votosError } = await supabase
        .from('votos_craque_domingo')
        .select('votado_jogador_id')
        .eq('domingo_id', domingo_id);

      if (votosError) throw votosError;

      if (!votos || votos.length === 0) {
        // Não há votos para calcular o craque do domingo
        // Opcional: Definir craque_domingo_id como NULL ou deixar como está
        const { data, error } = await supabase
          .from('domingos')
          .update({ craque_domingo_id: null })
          .eq('id', domingo_id)
          .select()
          .single();
        if (error) throw error;
        return data; // Retorna o domingo atualizado sem craque
      }

      // 2. Contar os votos para cada jogador
      const contagemVotos: { [jogador_id: number]: number } = {};
      votos.forEach(voto => {
        contagemVotos[voto.votado_jogador_id] = (contagemVotos[voto.votado_jogador_id] || 0) + 1;
      });

      // 3. Encontrar o jogador com mais votos
      let craqueId: number | null = null;
      let maxVotos = 0;

      for (const jogador_id in contagemVotos) {
        if (contagemVotos[jogador_id] > maxVotos) {
          maxVotos = contagemVotos[jogador_id];
          craqueId = Number(jogador_id);
        }
      }
      
      // 4. Atualizar o domingo com o craque eleito
      const { data, error } = await supabase
        .from('domingos')
        .update({ craque_domingo_id: craqueId })
        .eq('id', domingo_id)
        .select()
        .single();
      
      if (error) throw error;
      return data; // Retorna o domingo atualizado com o craque
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['domingos'] });
      queryClient.invalidateQueries({ queryKey: ['votos-craque-domingo', variables.domingo_id] });
    }
  });
};

// Hook para obter detalhes completos de um domingo, incluindo partidas e eventos
export const useDomingoDetalhes = (domingo_id?: number) => {
  return useQuery({
    queryKey: ['domingo-detalhes', domingo_id],
    queryFn: async () => {
      if (!domingo_id) return null;
      const { data, error } = await supabase
        .from('domingos')
        .select(`
          *,
          partidas(
            *,
            jogadores_por_partida(
              *,
              jogador:jogadores(*)
            ),
            eventos_partida(*)
          )
        `)
        .eq('id', domingo_id)
        .single();
      if (error) throw error;
      return data;
    }
  });
};
