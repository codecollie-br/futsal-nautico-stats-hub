import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePartidas, useJogadores, usePartidaAtual } from "@/hooks/useNautico";
import { Trophy, Users, Calendar, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import PlacarPartida from "@/components/partida/PlacarPartida";
import JogadorCard from "@/components/jogadores/JogadorCard";
const Home = () => {
  const {
    data: partidas,
    isLoading: loadingPartidas
  } = usePartidas();
  const {
    data: jogadores,
    isLoading: loadingJogadores
  } = useJogadores();
  const {
    data: partidaAtual
  } = usePartidaAtual();
  const ultimasPartidas = partidas?.slice(0, 3) || [];
  const topJogadores = jogadores?.slice(0, 4) || [];
  const estatisticasGerais = {
    totalJogadores: jogadores?.length || 0,
    partidasJogadas: partidas?.filter(p => p.status === 'FINALIZADA').length || 0,
    partidasEsteAno: partidas?.filter(p => p.status === 'FINALIZADA' && new Date(p.created_at).getFullYear() === new Date().getFullYear()).length || 0
  };
  return <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center py-8 bg-gradient-to-r from-orange-600 to-orange-800 text-white rounded-lg">
        <h1 className="text-4xl font-bold mb-2">Futsal do Náutico</h1>
        <p className="text-xl opacity-90">Acompanhe todas as partidas dos domingos</p>
      </div>

      {/* Partida Ao Vivo */}
      {partidaAtual && <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-red-600" />
              <span>Partida Ao Vivo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlacarPartida golsLaranja={partidaAtual.time_laranja_gols} golsPreto={partidaAtual.time_preto_gols} status={partidaAtual.status} />
            <div className="text-center">
              <Button asChild>
                <Link to="/partida">Acompanhar Partida</Link>
              </Button>
            </div>
          </CardContent>
        </Card>}

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{estatisticasGerais.totalJogadores}</div>
            <div className="text-gray-600">Jogadores</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{estatisticasGerais.partidasEsteAno}</div>
            <div className="text-gray-600">Partidas em {new Date().getFullYear()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{estatisticasGerais.partidasJogadas}</div>
            <div className="text-gray-600">Total de Partidas</div>
          </CardContent>
        </Card>
      </div>

      {/* Últimas Partidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Últimas Partidas</span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/historico">Ver Todas</Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPartidas ? <div>Carregando...</div> : ultimasPartidas.length > 0 ? <div className="space-y-4">
              {ultimasPartidas.map(partida => <div key={partida.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-semibold">
                      {partida.domingo?.data_domingo && new Date(partida.domingo.data_domingo).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-sm text-gray-600">{partida.status}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {partida.time_laranja_gols} x {partida.time_preto_gols}
                    </div>
                    <div className="text-xs text-gray-500">LARANJA x PRETO</div>
                  </div>
                </div>)}
            </div> : <p className="text-gray-500 text-center">Nenhuma partida encontrada</p>}
        </CardContent>
      </Card>

      {/* Top Jogadores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Destaques</span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/jogadores">Ver Todos</Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingJogadores ? <div>Carregando...</div> : topJogadores.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topJogadores.map(jogador => <JogadorCard key={jogador.id} jogador={jogador} />)}
            </div> : <p className="text-gray-500 text-center">Nenhum jogador encontrado</p>}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Nova Partida</h3>
            <p className="text-gray-600 mb-4">Criar uma nova partida para hoje</p>
            <Button asChild className="w-full">
              <Link to="/partida">Iniciar Partida</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Gerenciar Jogadores</h3>
            <p className="text-gray-600 mb-4">Adicionar ou editar informações dos jogadores</p>
            <Button variant="outline" asChild className="w-full">
              <Link to="/admin">Painel Admin</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Home;