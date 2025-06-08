import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Users, Database, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCreateDomingo, useDomingos } from "@/hooks/useNautico";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

const Admin = () => {
  const { data: domingos } = useDomingos();
  const createDomingo = useCreateDomingo();
  const [dataDomingo, setDataDomingo] = useState("");
  const [tokenCriado, setTokenCriado] = useState<string | null>(null);

  const handleCriarDomingo = async () => {
    if (!dataDomingo) return;
    try {
      const domingo = await createDomingo.mutateAsync(dataDomingo);
      setTokenCriado(domingo.token_moderacao);
      toast({ title: "Domingo criado!", description: "Token de moderação gerado." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro ao criar domingo", variant: "destructive" });
    }
  };

  const handleCopyToken = () => {
    if (tokenCriado) {
      navigator.clipboard.writeText(tokenCriado);
      toast({ title: "Token copiado!", description: tokenCriado });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
        <p className="text-gray-600">Gerencie a aplicação e seus dados</p>
        <div className="flex flex-col items-center gap-2 mt-4">
          <Input type="date" value={dataDomingo} onChange={e => setDataDomingo(e.target.value)} />
          <Button onClick={handleCriarDomingo} disabled={createDomingo.isPending || !dataDomingo}>
            {createDomingo.isPending ? 'Criando...' : 'Criar Domingo'}
          </Button>
          {tokenCriado && (
            <div className="mt-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">{tokenCriado}</span>
              <Button size="sm" className="ml-2" onClick={handleCopyToken}>Copiar Token</Button>
            </div>
          )}
        </div>
      </div>

      {/* Cards de Funcionalidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gerenciar Jogadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Gerenciar Jogadores</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Adicionar, editar e remover jogadores do sistema
            </p>
            <Button asChild className="w-full">
              <Link to="/admin/jogadores">Gerenciar Jogadores</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Dados da Aplicação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-green-600" />
              <span>Dados da Aplicação</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Backup, restore e configurações do banco de dados
            </p>
            <Button variant="outline" className="w-full" disabled>
              Em Desenvolvimento
            </Button>
          </CardContent>
        </Card>

        {/* Relatórios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span>Relatórios</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Estatísticas detalhadas e relatórios de desempenho
            </p>
            <Button variant="outline" className="w-full" disabled>
              Em Desenvolvimento
            </Button>
          </CardContent>
        </Card>

        {/* Configurações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-orange-600" />
              <span>Configurações</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Configurações gerais da aplicação
            </p>
            <Button variant="outline" className="w-full" disabled>
              Em Desenvolvimento
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Informações de Desenvolvimento */}
      <Card>
        <CardHeader>
          <CardTitle>Estado do Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>✅ Database Schema</span>
              <span className="text-green-600">Completo</span>
            </div>
            <div className="flex items-center justify-between">
              <span>✅ Interface Principal</span>
              <span className="text-green-600">Completo</span>
            </div>
            <div className="flex items-center justify-between">
              <span>✅ Sistema de Partidas</span>
              <span className="text-green-600">Básico</span>
            </div>
            <div className="flex items-center justify-between">
              <span>🔄 Gestão de Jogadores</span>
              <span className="text-yellow-600">Em Desenvolvimento</span>
            </div>
            <div className="flex items-center justify-between">
              <span>⏳ Sistema de Eventos</span>
              <span className="text-gray-600">Pendente</span>
            </div>
            <div className="flex items-center justify-between">
              <span>⏳ Votação Craque</span>
              <span className="text-gray-600">Pendente</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
