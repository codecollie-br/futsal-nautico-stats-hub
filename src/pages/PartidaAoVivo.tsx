
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePartidaAtual, useCreateDomingo, useCreatePartida, useIniciarPartida, useFinalizarPartida } from "@/hooks/useNautico";
import { useToast } from "@/hooks/use-toast";
import Cronometro from "@/components/partida/Cronometro";
import PlacarPartida from "@/components/partida/PlacarPartida";
import { Plus, Play } from "lucide-react";

const PartidaAoVivo = () => {
  const { data: partidaAtual, refetch } = usePartidaAtual();
  const createDomingo = useCreateDomingo();
  const createPartida = useCreatePartida();
  const iniciarPartida = useIniciarPartida();
  const finalizarPartida = useFinalizarPartida();
  const { toast } = useToast();

  const [tempoAtual, setTempoAtual] = useState(0);
  const [cronometroRodando, setCronometroRodando] = useState(false);

  const handleTempoChange = useCallback((segundos: number) => {
    setTempoAtual(segundos);
  }, []);

  const handleStatusChange = useCallback((rodando: boolean) => {
    setCronometroRodando(rodando);
  }, []);

  const criarNovaPartida = async () => {
    try {
      // Primeiro criar o domingo de hoje se não existir
      const hoje = new Date().toISOString().split('T')[0];
      const domingo = await createDomingo.mutateAsync(hoje);
      
      // Depois criar a partida
      await createPartida.mutateAsync(domingo.id);
      
      toast({
        title: "Partida criada!",
        description: "Nova partida criada com sucesso",
      });
      
      refetch();
    } catch (error) {
      console.error('Erro ao criar partida:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar partida. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleIniciarPartida = async () => {
    if (!partidaAtual) return;
    
    try {
      await iniciarPartida.mutateAsync(partidaAtual.id);
      toast({
        title: "Partida iniciada!",
        description: "A partida foi iniciada com sucesso",
      });
      refetch();
    } catch (error) {
      console.error('Erro ao iniciar partida:', error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar partida. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleFinalizarPartida = async () => {
    if (!partidaAtual) return;
    
    try {
      const duracaoMinutos = Math.floor(tempoAtual / 60);
      let vencedor = 'EMPATE';
      
      if (partidaAtual.time_laranja_gols > partidaAtual.time_preto_gols) {
        vencedor = 'LARANJA';
      } else if (partidaAtual.time_preto_gols > partidaAtual.time_laranja_gols) {
        vencedor = 'PRETO';
      }
      
      await finalizarPartida.mutateAsync({
        partida_id: partidaAtual.id,
        duracao_minutos: duracaoMinutos,
        vencedor
      });
      
      toast({
        title: "Partida finalizada!",
        description: "A partida foi finalizada com sucesso",
      });
      
      refetch();
    } catch (error) {
      console.error('Erro ao finalizar partida:', error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar partida. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Partida Ao Vivo</h1>
        <p className="text-gray-600">Acompanhe e gerencie a partida em tempo real</p>
      </div>

      {!partidaAtual ? (
        /* Criar Nova Partida */
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Nenhuma partida ativa</h3>
            <p className="text-gray-600 mb-6">Crie uma nova partida para começar</p>
            <Button 
              onClick={criarNovaPartida}
              disabled={createDomingo.isPending || createPartida.isPending}
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Nova Partida
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Placar */}
          <PlacarPartida 
            golsLaranja={partidaAtual.time_laranja_gols}
            golsPreto={partidaAtual.time_preto_gols}
            status={partidaAtual.status}
          />

          {/* Cronômetro */}
          <Cronometro 
            onTempoChange={handleTempoChange}
            onStatusChange={handleStatusChange}
            isPartidaAtiva={partidaAtual.status !== 'FINALIZADA'}
          />

          {/* Controles da Partida */}
          <Card>
            <CardHeader>
              <CardTitle>Controles da Partida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center space-x-4">
                {partidaAtual.status === 'AGENDADA' && (
                  <Button 
                    onClick={handleIniciarPartida}
                    disabled={iniciarPartida.isPending}
                    size="lg"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Partida
                  </Button>
                )}
                
                {partidaAtual.status === 'EM_ANDAMENTO' && (
                  <Button 
                    onClick={handleFinalizarPartida}
                    disabled={finalizarPartida.isPending}
                    variant="destructive"
                    size="lg"
                  >
                    Finalizar Partida
                  </Button>
                )}
                
                {partidaAtual.status === 'FINALIZADA' && (
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">Partida Finalizada</p>
                    <p className="text-gray-600">Duração: {partidaAtual.duracao_minutos} minutos</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações da Partida */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Partida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Data:</p>
                  <p>{partidaAtual.domingo?.data_domingo && 
                    new Date(partidaAtual.domingo.data_domingo).toLocaleDateString('pt-BR')
                  }</p>
                </div>
                <div>
                  <p className="font-semibold">Status:</p>
                  <p>{partidaAtual.status}</p>
                </div>
                {partidaAtual.hora_inicio && (
                  <div>
                    <p className="font-semibold">Início:</p>
                    <p>{new Date(partidaAtual.hora_inicio).toLocaleTimeString('pt-BR')}</p>
                  </div>
                )}
                {partidaAtual.hora_fim && (
                  <div>
                    <p className="font-semibold">Fim:</p>
                    <p>{new Date(partidaAtual.hora_fim).toLocaleTimeString('pt-BR')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PartidaAoVivo;
