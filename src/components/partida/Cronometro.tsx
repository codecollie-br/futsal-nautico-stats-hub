
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Square } from "lucide-react";

interface CronometroProps {
  onTempoChange: (segundos: number) => void;
  onStatusChange: (rodando: boolean) => void;
  isPartidaAtiva: boolean;
}

const Cronometro = ({ onTempoChange, onStatusChange, isPartidaAtiva }: CronometroProps) => {
  const [tempo, setTempo] = useState(0);
  const [rodando, setRodando] = useState(false);

  useEffect(() => {
    let intervalo: NodeJS.Timeout;
    
    if (rodando && isPartidaAtiva) {
      intervalo = setInterval(() => {
        setTempo(prev => {
          const novoTempo = prev + 1;
          onTempoChange(novoTempo);
          return novoTempo;
        });
      }, 1000);
    }

    return () => clearInterval(intervalo);
  }, [rodando, isPartidaAtiva, onTempoChange]);

  useEffect(() => {
    onStatusChange(rodando);
  }, [rodando, onStatusChange]);

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const iniciarPausar = () => {
    setRodando(!rodando);
  };

  const parar = () => {
    setRodando(false);
    setTempo(0);
    onTempoChange(0);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="text-center">
          <div className="text-6xl font-mono font-bold text-orange-600 mb-4">
            {formatarTempo(tempo)}
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button
              onClick={iniciarPausar}
              className={`${rodando ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
              disabled={!isPartidaAtiva}
            >
              {rodando ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {rodando ? 'Pausar' : 'Iniciar'}
            </Button>
            
            <Button
              onClick={parar}
              variant="destructive"
              disabled={!isPartidaAtiva}
            >
              <Square className="w-4 h-4 mr-2" />
              Parar
            </Button>
          </div>
          
          {!isPartidaAtiva && (
            <p className="text-sm text-gray-500 mt-2">
              Crie uma partida para usar o cronômetro
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Cronometro;
