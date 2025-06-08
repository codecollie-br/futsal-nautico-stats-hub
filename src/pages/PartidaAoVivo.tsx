import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePartidaAtual, useCreateDomingo, useCreatePartida, useIniciarPartida, useFinalizarPartida, useRegistrarEvento, useFilaEspera, useAdicionarFilaEspera, useJogadores } from "@/hooks/useNautico";
import { useToast } from "@/hooks/use-toast";
import Cronometro from "@/components/partida/Cronometro";
import PlacarPartida from "@/components/partida/PlacarPartida";
import { Plus, Play } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const PartidaAoVivo = () => {
  const { data: partidaAtual, refetch } = usePartidaAtual();
  const createDomingo = useCreateDomingo();
  const createPartida = useCreatePartida();
  const iniciarPartida = useIniciarPartida();
  const finalizarPartida = useFinalizarPartida();
  const registrarEvento = useRegistrarEvento();
  const { toast } = useToast();
  const location = useLocation();
  const [isModerador, setIsModerador] = useState(false);

  const [tempoAtual, setTempoAtual] = useState(0);
  const [cronometroRodando, setCronometroRodando] = useState(false);
  const [modalGolOpen, setModalGolOpen] = useState<false | 'LARANJA' | 'PRETO'>(false);
  const [marcadorId, setMarcadorId] = useState<number | null>(null);
  const [assistenteId, setAssistenteId] = useState<number | null>(null);
  const [golContra, setGolContra] = useState(false);
  const [erroGol, setErroGol] = useState<string | null>(null);

  const domingoId = partidaAtual?.domingo?.id;
  const { data: filaEspera = [] } = useFilaEspera(domingoId);
  const { data: jogadores = [] } = useJogadores();
  const adicionarFila = useAdicionarFilaEspera();
  const [modalAddJogador, setModalAddJogador] = useState(false);
  const [jogadorSelecionado, setJogadorSelecionado] = useState<number | null>(null);
  const [erroAdd, setErroAdd] = useState<string | null>(null);

  // Jogadores já em times ou na fila
  const jogadoresEmTimes = new Set((partidaAtual?.jogadores_por_partida || []).map(jp => jp.jogador_id));
  const jogadoresNaFila = new Set(filaEspera.map(f => f.jogador_id));
  const jogadoresDisponiveis = jogadores.filter(j => !jogadoresEmTimes.has(j.id) && !jogadoresNaFila.has(j.id));

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

  const jogadoresLaranja = partidaAtual?.jogadores_por_partida?.filter(jp => jp.time === 'LARANJA').map(jp => jp.jogador).filter(Boolean) || [];
  const jogadoresPreto = partidaAtual?.jogadores_por_partida?.filter(jp => jp.time === 'PRETO').map(jp => jp.jogador).filter(Boolean) || [];

  const abrirModalGol = (time: 'LARANJA' | 'PRETO') => {
    setModalGolOpen(time);
    setMarcadorId(null);
    setAssistenteId(null);
    setGolContra(false);
    setErroGol(null);
  };

  const handleRegistrarGol = async () => {
    if (!partidaAtual || !modalGolOpen) return;
    if (!golContra && !marcadorId) {
      setErroGol('Selecione o marcador ou marque gol contra.');
      return;
    }
    try {
      await registrarEvento.mutateAsync({
        partida_id: partidaAtual.id,
        tipo_evento: 'GOL',
        minuto_partida: Math.floor(tempoAtual / 60),
        jogador_gol_id: golContra ? null : marcadorId,
        jogador_assistencia_id: golContra ? null : assistenteId,
        is_gol_contra: golContra,
        time_marcador: modalGolOpen
      });
      setModalGolOpen(false);
      toast({ title: 'Gol registrado!' });
    } catch (err: any) {
      setErroGol(err.message || 'Erro ao registrar gol');
    }
  };

  const handleAddJogadorFila = async () => {
    if (!domingoId || !jogadorSelecionado) {
      setErroAdd('Selecione um jogador.');
      return;
    }
    try {
      await adicionarFila.mutateAsync({
        domingo_id: domingoId,
        jogador_id: jogadorSelecionado,
        ordem: filaEspera.length + 1
      });
      setModalAddJogador(false);
      setJogadorSelecionado(null);
      setErroAdd(null);
      toast({ title: 'Jogador adicionado à fila!' });
    } catch (err: any) {
      setErroAdd(err.message || 'Erro ao adicionar jogador');
    }
  };

  useEffect(() => {
    if (!partidaAtual?.domingo?.token_moderacao) {
      setIsModerador(false);
      return;
    }
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    setIsModerador(token === partidaAtual.domingo.token_moderacao);
  }, [location.search, partidaAtual?.domingo?.token_moderacao]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Partida Ao Vivo</h1>
        <p className="text-gray-600">Acompanhe e gerencie a partida em tempo real</p>
        {!isModerador && (
          <p className="text-sm text-orange-500 mt-2">Modo somente leitura. Para moderar, acesse com o token de moderação.</p>
        )}
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
                {partidaAtual.status === 'AGENDADA' && isModerador && (
                  <Button 
                    onClick={handleIniciarPartida}
                    disabled={iniciarPartida.isPending}
                    size="lg"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Partida
                  </Button>
                )}
                {partidaAtual.status === 'EM_ANDAMENTO' && isModerador && (
                  <Button 
                    onClick={handleFinalizarPartida}
                    disabled={finalizarPartida.isPending}
                    variant="destructive"
                    size="lg"
                  >
                    Encerrar Partida
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

          {partidaAtual && isModerador && partidaAtual.status === 'EM_ANDAMENTO' && (
            <div className="flex justify-center gap-4 mb-4">
              <Button style={{ background: '#ff9800', color: '#fff' }} onClick={() => abrirModalGol('LARANJA')}>
                Marcar Gol Laranja
              </Button>
              <Button style={{ background: '#222', color: '#fff' }} onClick={() => abrirModalGol('PRETO')}>
                Marcar Gol Preto
              </Button>
            </div>
          )}

          {/* Fila de Espera */}
          {partidaAtual && (
            <Card className="border-2 border-dashed border-blue-400 bg-blue-50">
              <CardHeader>
                <CardTitle>Fila de Espera</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 items-center mb-2">
                  {filaEspera.length === 0 && <span className="text-gray-500">Nenhum jogador na fila de espera</span>}
                  {filaEspera.map((f, idx) => (
                    <span key={f.jogador_id} className="px-3 py-1 rounded-full bg-blue-200 text-blue-900 font-semibold border border-blue-400">
                      {idx + 1}. {f.jogador?.nome || 'Desconhecido'}
                    </span>
                  ))}
                </div>
                <Button variant="outline" onClick={() => setModalAddJogador(true)}>
                  Adicionar Jogador
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={!!modalGolOpen} onOpenChange={setModalGolOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Gol {modalGolOpen === 'LARANJA' ? 'Laranja' : 'Preto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Checkbox checked={golContra} onCheckedChange={setGolContra} id="gol-contra" />
            <label htmlFor="gol-contra" className="ml-2">Gol Contra</label>
            {!golContra && (
              <>
                <div>
                  <label className="block mb-1">Marcador</label>
                  <Select value={marcadorId?.toString() || ''} onValueChange={v => setMarcadorId(Number(v))}>
                    <option value="">Selecione</option>
                    {(modalGolOpen === 'LARANJA' ? jogadoresLaranja : jogadoresPreto).map(j => (
                      <option key={j.id} value={j.id}>{j.nome}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block mb-1">Assistente (opcional)</label>
                  <Select value={assistenteId?.toString() || ''} onValueChange={v => setAssistenteId(Number(v))}>
                    <option value="">Nenhum</option>
                    {(modalGolOpen === 'LARANJA' ? jogadoresLaranja : jogadoresPreto).map(j => (
                      <option key={j.id} value={j.id}>{j.nome}</option>
                    ))}
                  </Select>
                </div>
              </>
            )}
            {erroGol && <div className="text-red-600 text-sm">{erroGol}</div>}
            <Button onClick={handleRegistrarGol} disabled={registrarEvento.isPending}>
              {registrarEvento.isPending ? 'Registrando...' : 'Registrar Gol'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Adicionar Jogador */}
      <Dialog open={modalAddJogador} onOpenChange={setModalAddJogador}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Jogador à Fila</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={jogadorSelecionado?.toString() || ''} onValueChange={v => setJogadorSelecionado(Number(v))}>
              <option value="">Selecione um jogador</option>
              {jogadoresDisponiveis.map(j => (
                <option key={j.id} value={j.id}>{j.nome}</option>
              ))}
            </Select>
            {erroAdd && <div className="text-red-600 text-sm">{erroAdd}</div>}
            <Button onClick={handleAddJogadorFila} disabled={adicionarFila.isPending}>
              {adicionarFila.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartidaAoVivo;
