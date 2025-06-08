import { useCallback, useEffect, useState } from 'react';

type PlayFunction = () => void;

interface UseSoundResult {
  play: PlayFunction;
  isPlaying: boolean;
  stop: () => void;
}

export const useSound = (url: string): UseSoundResult => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const newAudio = new Audio(url);
    newAudio.preload = 'auto'; // Pré-carrega o áudio

    const handleCanPlayThrough = () => {
      // O áudio está pronto para ser reproduzido sem interrupções
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    newAudio.addEventListener('canplaythrough', handleCanPlayThrough);
    newAudio.addEventListener('ended', handleEnded);

    setAudio(newAudio);

    return () => {
      newAudio.removeEventListener('canplaythrough', handleCanPlayThrough);
      newAudio.removeEventListener('ended', handleEnded);
      newAudio.pause();
      newAudio.currentTime = 0;
    };
  }, [url]);

  const play: PlayFunction = useCallback(() => {
    if (audio) {
      audio.currentTime = 0; // Reinicia o áudio se já estiver tocando
      audio.play().then(() => setIsPlaying(true)).catch(error => {
        console.error("Erro ao tentar reproduzir áudio:", error);
        // Pode ocorrer se o navegador bloquear autoplay sem interação do usuário
      });
    }
  }, [audio]);

  const stop = useCallback(() => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    }
  }, [audio]);

  return { play, isPlaying, stop };
}; 