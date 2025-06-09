
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useJogadores } from "@/hooks/useNautico";
import { Search, Filter } from "lucide-react";
import JogadorCard from "@/components/jogadores/JogadorCard";
import JogadorForm from "@/components/jogadores/JogadorForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const Jogadores = () => {
  const { data: jogadores, isLoading, error } = useJogadores();
  const [filtro, setFiltro] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'goleiros' | 'jogadores'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editJogador, setEditJogador] = useState<any>(null);
  const queryClient = useQueryClient();

  console.log("Estado da página Jogadores:", { jogadores, isLoading, error });

  const jogadoresFiltrados = jogadores?.filter(jogador => {
    const nomeMatch = jogador.nome.toLowerCase().includes(filtro.toLowerCase()) ||
                      jogador.apelido?.toLowerCase().includes(filtro.toLowerCase());
    
    const tipoMatch = filtroTipo === 'todos' || 
                      (filtroTipo === 'goleiros' && jogador.is_goleiro) ||
                      (filtroTipo === 'jogadores' && !jogador.is_goleiro);
    
    return nomeMatch && tipoMatch;
  });

  const estatisticas = {
    total: jogadores?.length || 0,
    goleiros: jogadores?.filter(j => j.is_goleiro).length || 0,
    jogadores: jogadores?.filter(j => !j.is_goleiro).length || 0,
  };

  // Mutation para criar/editar jogador
  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      console.log("Salvando jogador:", payload);
      if (payload.id) {
        // Editar
        const { error } = await supabase.from('jogadores').update(payload).eq('id', payload.id);
        if (error) throw error;
      } else {
        // Criar
        const { error } = await supabase.from('jogadores').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Jogador salvo com sucesso!' });
      setModalOpen(false);
      setEditJogador(null);
      queryClient.invalidateQueries({ queryKey: ['jogadores'] });
    },
    onError: (err: any) => {
      console.error("Erro ao salvar jogador:", err);
      toast({ title: 'Erro', description: err.message || 'Erro ao salvar jogador', variant: 'destructive' });
    }
  });

  const handleNovoJogador = () => {
    setEditJogador(null);
    setModalOpen(true);
  };

  const handleEditJogador = (jogador: any) => {
    console.log("Editando jogador:", jogador);
    setEditJogador(jogador);
    setModalOpen(true);
  };

  const handleSaveJogador = (dados: any) => {
    console.log("Salvando jogador com dados:", dados);
    mutation.mutate(dados);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div>Carregando jogadores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500">Erro ao carregar jogadores: {error.message}</div>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Jogadores</h1>
        <p className="text-gray-600">Conheça todos os craques do Náutico</p>
        <Button className="mt-4" onClick={handleNovoJogador}>Novo Jogador</Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{estatisticas.total}</div>
            <div className="text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{estatisticas.goleiros}</div>
            <div className="text-gray-600">Goleiros</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{estatisticas.jogadores}</div>
            <div className="text-gray-600">Jogadores</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            {/* Busca por nome */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou apelido..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por tipo */}
            <div className="flex space-x-2">
              <Button
                variant={filtroTipo === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroTipo('todos')}
              >
                Todos
              </Button>
              <Button
                variant={filtroTipo === 'jogadores' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroTipo('jogadores')}
              >
                Jogadores
              </Button>
              <Button
                variant={filtroTipo === 'goleiros' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroTipo('goleiros')}
              >
                Goleiros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Jogadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jogadoresFiltrados?.map((jogador) => (
          <div key={jogador.id} className="relative group">
            <JogadorCard jogador={jogador} />
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
              onClick={() => handleEditJogador(jogador)}
            >
              Editar
            </Button>
          </div>
        ))}
      </div>

      {jogadoresFiltrados?.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Nenhum jogador encontrado com os filtros aplicados</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Cadastro/Edição */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editJogador ? 'Editar Jogador' : 'Novo Jogador'}</DialogTitle>
          </DialogHeader>
          <JogadorForm
            jogador={editJogador} 
            onSave={(dados) => {
              handleSaveJogador(dados);
              setModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Jogadores;
