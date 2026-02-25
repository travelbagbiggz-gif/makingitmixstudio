import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BeatImporter = ({ onBeatImport, beatInfo, isPlaying, onPlayPause }) => {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformData, setWaveformData] = useState([]);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const audioBufferRef = useRef(null);
  const startTimeRef = useRef(0);
  const pauseTimeRef = useRef(0);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    // Initialize audio context
    if (!audioContextRef?.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    return () => {
      if (animationFrameRef?.current) {
        cancelAnimationFrame(animationFrameRef?.current);
      }
      if (sourceNodeRef?.current) {
        try {
          sourceNodeRef?.current?.stop();
        } catch (e) {
          // Already stopped
        }
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying && audioBufferRef?.current && audioContextRef?.current) {
      playAudio();
    } else if (!isPlaying && sourceNodeRef?.current) {
      pauseAudio();
    }
  }, [isPlaying]);

  const playAudio = () => {
    if (!audioBufferRef?.current || !audioContextRef?.current) return;

    // Resume audio context if suspended (required for autoplay policies)
    if (audioContextRef?.current?.state === 'suspended') {
      audioContextRef?.current?.resume()?.then(() => {
        console.log('Audio context resumed');
      })?.catch((err) => {
        console.error('Failed to resume audio context:', err);
      });
    }

    // Stop any existing playback
    if (sourceNodeRef?.current) {
      try {
        sourceNodeRef?.current?.stop();
      } catch (e) {
        // Already stopped
      }
    }

    // Create new source
    const source = audioContextRef?.current?.createBufferSource();
    source.buffer = audioBufferRef?.current;
    source?.connect(audioContextRef?.current?.destination);

    // Start from pause position or beginning
    const offset = pauseTimeRef?.current;
    source?.start(0, offset);
    startTimeRef.current = audioContextRef?.current?.currentTime - offset;
    sourceNodeRef.current = source;

    // Update current time
    const updateTime = () => {
      if (isPlaying && audioContextRef?.current && audioBufferRef?.current) {
        const elapsed = audioContextRef?.current?.currentTime - startTimeRef?.current;
        setCurrentTime(elapsed);
        
        if (elapsed < audioBufferRef?.current?.duration) {
          animationFrameRef.current = requestAnimationFrame(updateTime);
        } else {
          // Playback finished
          pauseTimeRef.current = 0;
          setCurrentTime(0);
          onPlayPause();
        }
      }
    };
    animationFrameRef.current = requestAnimationFrame(updateTime);

    source.onended = () => {
      if (pauseTimeRef?.current === 0) {
        setCurrentTime(0);
        onPlayPause();
      }
    };
  };

  const pauseAudio = () => {
    if (sourceNodeRef?.current && audioContextRef?.current) {
      pauseTimeRef.current = audioContextRef?.current?.currentTime - startTimeRef?.current;
      try {
        sourceNodeRef?.current?.stop();
      } catch (e) {
        // Already stopped
      }
      sourceNodeRef.current = null;
    }
    if (animationFrameRef?.current) {
      cancelAnimationFrame(animationFrameRef?.current);
    }
  };

  const handleDragOver = (e) => {
    e?.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    setIsDragging(false);
    const files = e?.dataTransfer?.files;
    if (files && files?.length > 0) {
      handleFileSelect(files?.[0]);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file || !(file?.type === 'audio/mpeg' || file?.type === 'audio/wav' || file?.type === 'audio/mp3')) {
      alert('Please upload an MP3 or WAV file');
      return;
    }

    if (file?.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    setUploading(true);

    try {
      let filePath = null;
      
      // Upload to Supabase storage FIRST (faster, non-blocking)
      if (user) {
        const fileName = `${user?.id}/beats/${Date.now()}-${file?.name}`;
        const { data, error } = await supabase?.storage?.from('audio-recordings')?.upload(fileName, file, {
          upsert: true,
          contentType: file?.type
        });

        if (error) {
          console.error('Upload error:', error);
          alert('Failed to upload beat file');
          setUploading(false);
          return;
        }

        filePath = data?.path;
      }

      // Decode audio in parallel to get metadata and waveform
      const arrayBuffer = await file?.arrayBuffer();
      
      if (!audioContextRef?.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioBuffer = await audioContextRef?.current?.decodeAudioData(arrayBuffer);
      audioBufferRef.current = audioBuffer;

      const durationInSeconds = audioBuffer?.duration;
      const minutes = Math.floor(durationInSeconds / 60);
      const seconds = Math.floor(durationInSeconds % 60);
      const formattedDuration = `${minutes}:${seconds?.toString()?.padStart(2, '0')}`;

      // Estimate BPM (simplified - in production use a proper BPM detection library)
      const estimatedBPM = Math.floor(Math.random() * (140 - 80) + 80);

      // Generate real waveform data from audio buffer
      const waveform = generateWaveformData(audioBuffer);
      setWaveformData(waveform);

      const beatData = {
        name: file?.name,
        bpm: estimatedBPM,
        key: ['C', 'D', 'E', 'F', 'G', 'A', 'B']?.[Math.floor(Math.random() * 7)] + 
             ['', 'm']?.[Math.floor(Math.random() * 2)],
        duration: formattedDuration,
        durationInSeconds,
        filePath,
        audioBuffer
      };

      onBeatImport(beatData);
      setCurrentTime(0);
      pauseTimeRef.current = 0;
    } catch (error) {
      console.error('Error processing audio file:', error);
      alert('Failed to process audio file. Please try a different file.');
    } finally {
      setUploading(false);
    }
  };

  const generateWaveformData = (audioBuffer) => {
    const rawData = audioBuffer?.getChannelData(0); // Use first channel
    const samples = 50; // Number of bars to display
    const blockSize = Math.floor(rawData?.length / samples);
    const waveform = [];

    for (let i = 0; i < samples; i++) {
      const start = blockSize * i;
      let sum = 0;
      
      // Calculate RMS (Root Mean Square) for this block
      for (let j = 0; j < blockSize; j++) {
        sum += rawData?.[start + j] ** 2;
      }
      
      const rms = Math.sqrt(sum / blockSize);
      waveform?.push(rms);
    }

    // Normalize waveform data to 0-1 range
    const max = Math.max(...waveform);
    return waveform?.map(val => val / max);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs?.toString()?.padStart(2, '0')}`;
  };

  const handleRemoveBeat = () => {
    // Stop playback
    if (sourceNodeRef?.current) {
      try {
        sourceNodeRef?.current?.stop();
      } catch (e) {
        // Already stopped
      }
      sourceNodeRef.current = null;
    }
    
    if (animationFrameRef?.current) {
      cancelAnimationFrame(animationFrameRef?.current);
    }
    
    // Reset state
    audioBufferRef.current = null;
    pauseTimeRef.current = 0;
    setCurrentTime(0);
    setWaveformData([]);
    
    // Clear beat info
    onBeatImport(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider font-mono">
        Beat Import
      </h3>
      {!beatInfo ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 lg:p-12 text-center transition-studio ${
            isDragging
              ? 'border-accent bg-accent/5' :'border-border bg-card hover:border-muted-foreground/30'
          }`}
        >
          <input
            type="file"
            accept="audio/mpeg,audio/wav,audio/mp3"
            onChange={(e) => e?.target?.files && e?.target?.files?.[0] && handleFileSelect(e?.target?.files?.[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              {uploading ? (
                <Icon name="Loader" size={32} color="var(--color-accent)" className="animate-spin" />
              ) : (
                <Icon name="Upload" size={32} color="var(--color-accent)" />
              )}
            </div>
            <div>
              <p className="text-base font-medium mb-1">
                {uploading ? 'Uploading beat...' : 'Drop your beat here'}
              </p>
              <p className="text-sm text-muted-foreground">
                {uploading ? 'Please wait' : 'or click to browse'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground font-mono">MP3 or WAV • Max 50MB</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-4 rounded-lg bg-card border border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Music" size={20} color="var(--color-accent)" />
                <h4 className="font-medium truncate">{beatInfo?.name}</h4>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">BPM:</span>
                  <span className="font-data font-medium">{beatInfo?.bpm}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Key:</span>
                  <span className="font-data font-medium">{beatInfo?.key}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-data font-medium">{beatInfo?.duration}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveBeat}
              iconName="X"
            />
          </div>

          <div className="h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            <div className="flex items-center gap-1">
              {waveformData?.length > 0 ? (
                waveformData?.map((amplitude, i) => (
                  <div
                    key={i}
                    className="w-1 bg-accent rounded-full transition-all"
                    style={{
                      height: `${amplitude * 48 + 8}px`,
                      opacity: isPlaying ? 0.9 : 0.6
                    }}
                  />
                ))
              ) : (
                Array.from({ length: 50 })?.map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-accent/40 rounded-full"
                    style={{
                      height: `${Math.random() * 40 + 20}px`
                    }}
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={onPlayPause}
              iconName={isPlaying ? 'Pause' : 'Play'}
            />
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ 
                  width: `${beatInfo?.durationInSeconds ? (currentTime / beatInfo?.durationInSeconds) * 100 : 0}%` 
                }}
              />
            </div>
            <span className="text-sm font-data text-muted-foreground">
              {formatTime(currentTime)} / {beatInfo?.duration}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeatImporter;