import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import PresetSelector from './components/PresetSelector';
import AutotuneControls from './components/AutotuneControls';
import BeatImporter from './components/BeatImporter';
import VocalChannel from './components/VocalChannel';
import RecordingControls from './components/RecordingControls';
import AudioMeter from './components/AudioMeter';
import PunchInTimeline from './components/PunchInTimeline';
import DeviceSelector from './components/DeviceSelector';
import MetronomeControl from './components/MetronomeControl';
import WaveformVisualizer from './components/WaveformVisualizer';
import DemoCounter from './components/DemoCounter';

const RecordingStudio = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedPreset, setSelectedPreset] = useState('hiphop');
  const [autotuneEnabled, setAutotuneEnabled] = useState(true);
  const [retuneSpeed, setRetuneSpeed] = useState(50);
  const [beatInfo, setBeatInfo] = useState(null);
  const [isBeatPlaying, setIsBeatPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('verse1');
  const [isRecording, setIsRecording] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionTitle, setSessionTitle] = useState('Untitled Session');
  const [saving, setSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [micPermissionError, setMicPermissionError] = useState(null);
  const [recordingError, setRecordingError] = useState(null);
  const [autoMixing, setAutoMixing] = useState(false);

  // Audio context and recording state
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [punchInTime, setPunchInTime] = useState(null);
  const [showPunchInSelector, setShowPunchInSelector] = useState(false);
  const [currentRecordingChannel, setCurrentRecordingChannel] = useState(null);
  const audioBuffersRef = useRef({});
  const recordingStartTimeRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const deviceInitializedRef = useRef(false);
  const streamConstraintsRef = useRef(null);

  const [verse1Channels, setVerse1Channels] = useState([
    { id: 'lead', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null },
    { id: 'double', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null },
    { id: 'adlib', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null },
    { id: 'extra', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null },
  ]);

  const [verse2Channels, setVerse2Channels] = useState([
    { id: 'lead', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null },
    { id: 'double', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null },
    { id: 'adlib', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null },
    { id: 'extra', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null },
  ]);

  const [verse3Channels, setVerse3Channels] = useState([
    { id: 'lead', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null },
    { id: 'double', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null },
    { id: 'adlib', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null },
    { id: 'extra', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null },
  ]);

  const [hookChannels, setHookChannels] = useState([
    { id: 'lead', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null },
    { id: 'double', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null },
    { id: 'adlib', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null },
    { id: 'extra', recorded: false, isRecording: false, isPlaying: false, duration: null, filePath: null },
  ]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/sign-in');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    initializeAudioContext();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    // Stop animation frame
    if (animationFrameRef?.current) {
      cancelAnimationFrame(animationFrameRef?.current);
      animationFrameRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef?.current && mediaRecorderRef?.current?.state !== 'inactive') {
      try {
        mediaRecorderRef?.current?.stop();
      } catch (e) {
        console.error('Error stopping media recorder:', e);
      }
    }

    // Stop all media tracks
    if (mediaStreamRef?.current) {
      mediaStreamRef?.current?.getTracks()?.forEach(track => {
        try {
          track?.stop();
        } catch (e) {
          console.error('Error stopping track:', e);
        }
      });
      mediaStreamRef.current = null;
    }

    // Disconnect analyser
    if (analyserRef?.current) {
      try {
        analyserRef?.current?.disconnect();
      } catch (e) {
        console.error('Error disconnecting analyser:', e);
      }
      analyserRef.current = null;
    }

    // Close audio context
    if (audioContextRef?.current && audioContextRef?.current?.state !== 'closed') {
      try {
        audioContextRef?.current?.close();
      } catch (e) {
        console.error('Error closing audio context:', e);
      }
    }
  };

  const initializeAudioContext = async (forceReinit = false) => {
    try {
      // Prevent duplicate initialization
      if (deviceInitializedRef?.current && !forceReinit) {
        console.log('Audio already initialized');
        return;
      }

      setMicPermissionError(null);
      setRecordingError(null);

      // Create audio context
      if (!audioContextRef?.current || audioContextRef?.current?.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          latencyHint: 'interactive',
          sampleRate: 48000
        });
      }

      // Resume audio context if suspended
      if (audioContextRef?.current?.state === 'suspended') {
        await audioContextRef?.current?.resume();
      }

      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          latency: 0,
          sampleRate: 48000,
          channelCount: 1
        }
      };

      // Add device constraint if specific device selected
      if (selectedDevice && selectedDevice !== 'default') {
        constraints.audio.deviceId = { exact: selectedDevice };
      }

      // Store constraints for retry
      streamConstraintsRef.current = constraints;

      // Request microphone access
      const stream = await navigator?.mediaDevices?.getUserMedia(constraints);
      
      if (!stream || !stream?.active) {
        throw new Error('Failed to get active media stream');
      }

      // Verify stream has audio tracks
      const audioTracks = stream?.getAudioTracks();
      if (!audioTracks || audioTracks?.length === 0) {
        throw new Error('No audio tracks found in media stream');
      }

      // Check if track is enabled and ready
      const primaryTrack = audioTracks?.[0];
      if (!primaryTrack?.enabled || primaryTrack?.readyState !== 'live') {
        throw new Error('Audio track is not ready or enabled');
      }

      // Stop old stream if exists
      if (mediaStreamRef?.current) {
        mediaStreamRef?.current?.getTracks()?.forEach(track => track?.stop());
      }

      mediaStreamRef.current = stream;

      // Set up input level monitoring with analyser
      setupInputMonitoring(stream);

      retryCountRef.current = 0;
      deviceInitializedRef.current = true;
      console.log('Audio initialized successfully with device:', primaryTrack?.label);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      deviceInitializedRef.current = false;
      
      let errorMessage = 'Microphone access failed';
      let canRetry = false;
      
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings and click "Retry Microphone Access".';
        canRetry = false;
      } else if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and click "Retry Microphone Access".';
        canRetry = true;
      } else if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') {
        errorMessage = 'Microphone is already in use by another application. Please close other apps using the microphone and try again.';
        canRetry = true;
      } else if (error?.name === 'OverconstrainedError') {
        errorMessage = 'Selected microphone does not support required settings. Try selecting a different device.';
        canRetry = true;
      } else if (error?.name === 'TypeError') {
        errorMessage = 'Browser does not support audio recording. Please use Chrome, Firefox, or Edge.';
        canRetry = false;
      } else if (error?.name === 'AbortError') {
        errorMessage = 'Microphone access was aborted. This may be temporary - retrying automatically...';
        canRetry = true;
      } else {
        errorMessage = `Microphone error: ${error?.message || 'Unknown error'}. Click "Retry Microphone Access" to try again.`;
        canRetry = true;
      }

      setMicPermissionError(errorMessage);
      
      // Automatic retry logic for transient errors
      if (canRetry && retryCountRef?.current < maxRetries && 
          (error?.name === 'NotReadableError' || error?.name === 'AbortError' || error?.name === 'NotFoundError')) {
        retryCountRef.current++;
        const retryDelay = 1000 * retryCountRef?.current; // Exponential backoff
        console.log(`Auto-retrying audio initialization (${retryCountRef?.current}/${maxRetries}) in ${retryDelay}ms...`);
        setTimeout(() => initializeAudioContext(true), retryDelay);
      }
    }
  };

  const setupInputMonitoring = (stream) => {
    try {
      if (!audioContextRef?.current) {
        console.error('Audio context not available for monitoring');
        return;
      }

      // Disconnect existing analyser if present
      if (analyserRef?.current) {
        try {
          analyserRef?.current?.disconnect();
        } catch (e) {
          console.error('Error disconnecting old analyser:', e);
        }
      }

      // Create analyser node for input level monitoring
      const analyser = audioContextRef?.current?.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect stream to analyser
      const source = audioContextRef?.current?.createMediaStreamSource(stream);
      source?.connect(analyser);

      // Start monitoring input levels
      monitorInputLevel();
      console.log('Input monitoring setup complete');
    } catch (error) {
      console.error('Failed to setup input monitoring:', error);
      setRecordingError('Input level monitoring unavailable. Recording will still work.');
    }
  };

  const monitorInputLevel = () => {
    if (!analyserRef?.current) return;

    const bufferLength = analyserRef?.current?.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateLevel = () => {
      if (!analyserRef?.current) return;

      analyserRef?.current?.getByteTimeDomainData(dataArray);

      // Calculate RMS (Root Mean Square) for accurate level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray?.[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);
      
      // Convert to dB scale (-60 to 0 dB)
      const db = 20 * Math.log10(Math.max(rms, 0.00001));
      const normalizedLevel = Math.max(0, Math.min(100, ((db + 60) / 60) * 100));
      
      setInputLevel(normalizedLevel);

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  const handleDeviceChange = async (deviceId) => {
    setSelectedDevice(deviceId);
    deviceInitializedRef.current = false;
    
    // Stop existing stream
    if (mediaStreamRef?.current) {
      mediaStreamRef?.current?.getTracks()?.forEach(track => track?.stop());
      mediaStreamRef.current = null;
    }
    
    // Reinitialize with new device
    await initializeAudioContext(true);
  };

  const handleMetronomeToggle = () => {
    setMetronomeEnabled(prev => !prev);
  };

  const getChannelState = (section) => {
    switch (section) {
      case 'Verse 1':
        return { channels: verse1Channels, setChannels: setVerse1Channels, sectionKey: 'verse1' };
      case 'Verse 2':
        return { channels: verse2Channels, setChannels: setVerse2Channels, sectionKey: 'verse2' };
      case 'Verse 3':
        return { channels: verse3Channels, setChannels: setVerse3Channels, sectionKey: 'verse3' };
      case 'Hook':
        return { channels: hookChannels, setChannels: setHookChannels, sectionKey: 'hook' };
      default:
        return { channels: verse1Channels, setChannels: setVerse1Channels, sectionKey: 'verse1' };
    }
  };

  const handleRecord = async (section, channelId) => {
    // Clear any previous errors
    setRecordingError(null);

    // Check if microphone is available and initialized
    if (!mediaStreamRef?.current || !mediaStreamRef?.current?.active || !deviceInitializedRef?.current) {
      setRecordingError('Microphone not available. Initializing microphone...');
      await initializeAudioContext(true);
      
      // Check again after initialization
      if (!mediaStreamRef?.current || !mediaStreamRef?.current?.active) {
        setRecordingError('Failed to initialize microphone. Please check your microphone connection and permissions.');
        return;
      }
    }

    // Verify audio tracks are live
    const audioTracks = mediaStreamRef?.current?.getAudioTracks();
    if (!audioTracks || audioTracks?.length === 0 || audioTracks?.[0]?.readyState !== 'live') {
      setRecordingError('Microphone track is not active. Please check your device.');
      await initializeAudioContext(true);
      return;
    }

    const { channels, setChannels, sectionKey } = getChannelState(section);
    let channel = channels?.find((c) => c?.id === channelId);

    if (channel?.isRecording) {
      stopRecording(section, channelId);
    } else {
      setCurrentRecordingChannel({ section, channelId, sectionKey });
      setShowPunchInSelector(true);
    }
  };

  const startRecordingWithPunchIn = async (selectedPunchInTime) => {
    if (!currentRecordingChannel || !mediaStreamRef?.current) {
      setRecordingError('Cannot start recording. Microphone not available.');
      return;
    }

    try {
      setRecordingError(null);

      // Final check before recording
      const audioTracks = mediaStreamRef?.current?.getAudioTracks();
      if (!audioTracks || audioTracks?.length === 0 || audioTracks?.[0]?.readyState !== 'live') {
        throw new Error('Microphone track became inactive');
      }

      const { section, channelId, sectionKey } = currentRecordingChannel;
      const { channels, setChannels } = getChannelState(section);
      let channel = channels?.find((c) => c?.id === channelId);

      setPunchInTime(selectedPunchInTime);
      setShowPunchInSelector(false);

      // Handle overlap deletion if punching in over existing recording
      if (channel?.recorded && channel?.filePath && selectedPunchInTime < (channel?.actualDuration || 0)) {
        try {
          // Load existing audio
          const { data: existingBlob } = await supabase?.storage
            ?.from('audio-recordings')
            ?.download(channel?.filePath);

          if (existingBlob && audioContextRef?.current) {
            const arrayBuffer = await existingBlob?.arrayBuffer();
            const audioBuffer = await audioContextRef?.current?.decodeAudioData(arrayBuffer);
            
            // Calculate number of frames for the trimmed portion
            const numFrames = Math.floor(selectedPunchInTime * audioBuffer?.sampleRate);
            
            // Only create buffer if there are frames to store (punch-in time > 0)
            if (numFrames > 0) {
              const trimmedBuffer = audioContextRef?.current?.createBuffer(
                audioBuffer?.numberOfChannels,
                numFrames,
                audioBuffer?.sampleRate
              );

              for (let channel = 0; channel < audioBuffer?.numberOfChannels; channel++) {
                const sourceData = audioBuffer?.getChannelData(channel);
                const targetData = trimmedBuffer?.getChannelData(channel);
                targetData?.set(sourceData?.slice(0, trimmedBuffer?.length));
              }

              // Store for later merging
              audioBuffersRef.current[`${sectionKey}-${channelId}`] = trimmedBuffer;
            }
          }
        } catch (error) {
          console.error('Error processing existing audio:', error);
          setRecordingError('Failed to process existing recording. Starting fresh recording.');
        }
      }

      // Calculate pre-roll time (10 seconds before punch-in, or from start if less than 10s)
      const preRollTime = Math.max(0, selectedPunchInTime - 10);
      const preRollDelay = preRollTime * 1000;

      setTimeout(() => {
        try {
          recordedChunksRef.current = [];
          recordingStartTimeRef.current = selectedPunchInTime;

          // Check MediaRecorder support
          const mimeTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4'
          ];

          let selectedMimeType = null;
          for (const mimeType of mimeTypes) {
            if (MediaRecorder?.isTypeSupported(mimeType)) {
              selectedMimeType = mimeType;
              break;
            }
          }

          if (!selectedMimeType) {
            throw new Error('No supported audio format found for recording');
          }

          mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current, {
            mimeType: selectedMimeType,
            audioBitsPerSecond: 128000
          });

          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event?.data?.size > 0) {
              recordedChunksRef?.current?.push(event?.data);
            }
          };

          mediaRecorderRef.current.onerror = (event) => {
            console.error('MediaRecorder error:', event);
            const errorMsg = event?.error?.message || 'Recording error occurred';
            setRecordingError(`Recording failed: ${errorMsg}. Please try again.`);
            stopRecording(section, channelId);
          };

          mediaRecorderRef?.current?.start(100);

          setChannels(
            channels?.map((c) =>
              c?.id === channelId ? { ...c, isRecording: true } : { ...c, isRecording: false }
            )
          );
          setIsRecording(true);
          console.log('Recording started successfully');
        } catch (error) {
          console.error('Failed to start recording:', error);
          setRecordingError(`Recording failed: ${error?.message || 'Unknown error'}. Please check your microphone and try again.`);
          setIsRecording(false);
        }
      }, preRollDelay);
    } catch (error) {
      console.error('Error in startRecordingWithPunchIn:', error);
      setRecordingError(`Failed to start recording: ${error?.message || 'Unknown error'}. Please try again.`);
    }
  };

  const stopRecording = async (section, channelId) => {
    if (!mediaRecorderRef?.current) return;

    const { channels, setChannels, sectionKey } = getChannelState(section);

    try {
      if (mediaRecorderRef?.current?.state !== 'inactive') {
        mediaRecorderRef?.current?.stop();
      }

      mediaRecorderRef.current.onstop = async () => {
        try {
          if (recordedChunksRef?.current?.length === 0) {
            throw new Error('No audio data recorded');
          }

          const newRecordingBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
          
          if (newRecordingBlob?.size === 0) {
            throw new Error('Recorded audio is empty');
          }

          const punchInStart = recordingStartTimeRef?.current || 0;
          
          let finalBlob = newRecordingBlob;
          let totalDuration = newRecordingBlob?.size / (128000 / 8);

          // Merge with existing audio if we have a trimmed portion
          const existingBuffer = audioBuffersRef?.current?.[`${sectionKey}-${channelId}`];
          if (existingBuffer && audioContextRef?.current) {
            try {
              // Decode new recording
              const newArrayBuffer = await newRecordingBlob?.arrayBuffer();
              const newAudioBuffer = await audioContextRef?.current?.decodeAudioData(newArrayBuffer);

              // Create merged buffer
              const totalLength = existingBuffer?.length + newAudioBuffer?.length;
              const mergedBuffer = audioContextRef?.current?.createBuffer(
                newAudioBuffer?.numberOfChannels,
                totalLength,
                newAudioBuffer?.sampleRate
              );

              // Copy existing audio (before punch-in)
              for (let channel = 0; channel < mergedBuffer?.numberOfChannels; channel++) {
                const mergedData = mergedBuffer?.getChannelData(channel);
                const existingData = existingBuffer?.getChannelData(channel);
                const newData = newAudioBuffer?.getChannelData(channel);

                // Copy existing portion
                mergedData?.set(existingData, 0);
                // Copy new recording starting at punch-in point
                mergedData?.set(newData, existingBuffer?.length);
              }

              // Convert merged buffer back to blob
              const offlineContext = new OfflineAudioContext(
                mergedBuffer.numberOfChannels,
                mergedBuffer.length,
                mergedBuffer.sampleRate
              );
              const source = offlineContext?.createBufferSource();
              source.buffer = mergedBuffer;
              source?.connect(offlineContext?.destination);
              source?.start();

              const renderedBuffer = await offlineContext?.startRendering();
              
              // Convert to WAV blob
              const wavBlob = await audioBufferToWav(renderedBuffer);
              finalBlob = wavBlob;
              totalDuration = mergedBuffer?.duration;

              // Clean up stored buffer
              delete audioBuffersRef?.current?.[`${sectionKey}-${channelId}`];
            } catch (error) {
              console.error('Error merging audio:', error);
              setRecordingError('Failed to merge recordings. Using new recording only.');
              // Fall back to just the new recording
            }
          }

          let filePath = null;
          if (user) {
            const fileName = `${user?.id}/${Date.now()}-${sectionKey}-${channelId}.webm`;
            const { data, error } = await supabase?.storage?.from('audio-recordings')?.upload(fileName, finalBlob, {
              upsert: true
            });

            if (error) {
              console.error('Upload error:', error);
              throw new Error('Failed to upload recording');
            }

            filePath = data?.path;
          }

          setChannels(
            channels?.map((c) =>
              c?.id === channelId
                ? {
                    ...c,
                    isRecording: false,
                    recorded: true,
                    duration: `${Math.floor(totalDuration / 60)}:${Math.floor(totalDuration % 60)?.toString()?.padStart(2, '0')}`,
                    actualDuration: totalDuration,
                    filePath
                  }
                : c
            )
          );
          setIsRecording(false);
          setPunchInTime(null);
          recordingStartTimeRef.current = null;
          recordedChunksRef.current = [];
          setRecordingError(null);

          // Auto-mix after recording completes
          await handleAutoMix();
        } catch (error) {
          console.error('Error saving recording:', error);
          setRecordingError(`Failed to save recording: ${error?.message || 'Unknown error'}`);
          
          // Reset recording state
          setChannels(
            channels?.map((c) =>
              c?.id === channelId ? { ...c, isRecording: false } : c
            )
          );
          setIsRecording(false);
          setPunchInTime(null);
          recordingStartTimeRef.current = null;
          recordedChunksRef.current = [];
        }
      };
    } catch (error) {
      console.error('Error stopping recording:', error);
      setRecordingError('Failed to stop recording properly.');
      setIsRecording(false);
    }
  };

  const handleAutoMix = async () => {
    try {
      setAutoMixing(true);

      // Collect all recorded channels
      const allChannels = [
        ...verse1Channels,
        ...verse2Channels,
        ...verse3Channels,
        ...hookChannels,
      ];
      const recordedChannels = allChannels?.filter((c) => c?.recorded);

      if (recordedChannels?.length === 0) {
        console.log('No recordings to mix');
        setAutoMixing(false);
        return;
      }

      // Simulate auto-mix processing (in production, this would call an AI mixing service)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Save session before navigating
      if (user && beatInfo) {
        const sessionData = {
          verse1: verse1Channels,
          verse2: verse2Channels,
          verse3: verse3Channels,
          hook: hookChannels,
          beatInfo,
          selectedPreset,
          autotuneEnabled,
          retuneSpeed
        };

        if (currentSessionId) {
          await supabase?.from('audio_sessions')?.update({
            title: sessionTitle,
            preset: selectedPreset,
            autotune_enabled: autotuneEnabled,
            retune_speed: retuneSpeed,
            beat_file_path: beatInfo?.filePath,
            beat_duration: beatInfo?.duration,
            beat_bpm: beatInfo?.bpm,
            session_data: sessionData,
            status: 'mixed'
          })?.eq('id', currentSessionId);
        } else {
          const { data } = await supabase?.from('audio_sessions')?.insert([{
            user_id: user?.id,
            title: sessionTitle,
            preset: selectedPreset,
            autotune_enabled: autotuneEnabled,
            retune_speed: retuneSpeed,
            beat_file_path: beatInfo?.filePath,
            beat_duration: beatInfo?.duration,
            beat_bpm: beatInfo?.bpm,
            session_data: sessionData,
            status: 'mixed'
          }])?.select()?.single();

          if (data) {
            setCurrentSessionId(data?.id);
          }
        }
      }

      setAutoMixing(false);
      
      // Navigate to fine-tune page
      navigate('/fine-tune-mix-page', { 
        state: { 
          autoMixed: true,
          sessionId: currentSessionId 
        } 
      });
    } catch (error) {
      console.error('Auto-mix error:', error);
      setAutoMixing(false);
      setRecordingError('Auto-mix failed. You can still proceed to mix manually.');
    }
  };

  // Helper function to convert AudioBuffer to WAV blob
  const audioBufferToWav = async (buffer) => {
    const numberOfChannels = buffer?.numberOfChannels;
    const sampleRate = buffer?.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const data = [];
    for (let i = 0; i < buffer?.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer?.getChannelData(channel)?.[i]));
        data?.push(sample < 0 ? sample * 0x8000 : sample * 0x7fff);
      }
    }

    const dataLength = data?.length * bytesPerSample;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string?.length; i++) {
        view?.setUint8(offset + i, string?.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view?.setUint32(4, bufferLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view?.setUint32(16, 16, true);
    view?.setUint16(20, format, true);
    view?.setUint16(22, numberOfChannels, true);
    view?.setUint32(24, sampleRate, true);
    view?.setUint32(28, sampleRate * blockAlign, true);
    view?.setUint16(32, blockAlign, true);
    view?.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view?.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < data?.length; i++) {
      view?.setInt16(offset, data?.[i], true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const handlePlayback = (section, channelId) => {
    const { channels, setChannels } = getChannelState(section);
    setChannels(
      channels?.map((c) =>
        c?.id === channelId ? { ...c, isPlaying: !c?.isPlaying } : { ...c, isPlaying: false }
      )
    );
  };

  const handleDelete = async (section, channelId) => {
    const { channels, setChannels } = getChannelState(section);
    let channel = channels?.find((c) => c?.id === channelId);

    if (channel?.filePath && user) {
      await supabase?.storage?.from('audio-recordings')?.remove([channel?.filePath]);
    }

    setChannels(
      channels?.map((c) =>
        c?.id === channelId
          ? { ...c, recorded: false, isPlaying: false, duration: null, filePath: null }
          : c
      )
    );
  };

  const handleSaveSession = async () => {
    if (!user) {
      alert('Please sign in to save sessions');
      navigate('/sign-in');
      return;
    }

    setShowSaveDialog(true);
  };

  const confirmSaveSession = async () => {
    setSaving(true);
    try {
      const sessionData = {
        verse1: verse1Channels,
        verse2: verse2Channels,
        verse3: verse3Channels,
        hook: hookChannels,
        beatInfo,
        selectedPreset,
        autotuneEnabled,
        retuneSpeed
      };

      if (currentSessionId) {
        const { error } = await supabase?.from('audio_sessions')?.update({
            title: sessionTitle,
            preset: selectedPreset,
            autotune_enabled: autotuneEnabled,
            retune_speed: retuneSpeed,
            beat_file_path: beatInfo?.filePath,
            beat_duration: beatInfo?.duration,
            beat_bpm: beatInfo?.bpm,
            session_data: sessionData,
            status: 'in_progress'
          })?.eq('id', currentSessionId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase?.from('audio_sessions')?.insert([{
            user_id: user?.id,
            title: sessionTitle,
            preset: selectedPreset,
            autotune_enabled: autotuneEnabled,
            retune_speed: retuneSpeed,
            beat_file_path: beatInfo?.filePath,
            beat_duration: beatInfo?.duration,
            beat_bpm: beatInfo?.bpm,
            session_data: sessionData,
            status: 'in_progress'
          }])?.select()?.single();

        if (error) throw error;
        setCurrentSessionId(data?.id);
      }

      alert('Session saved successfully!');
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  const handleProceedToMix = () => {
    const allChannels = [
      ...verse1Channels,
      ...verse2Channels,
      ...verse3Channels,
      ...hookChannels,
    ];
    const hasRecordings = allChannels?.some((c) => c?.recorded);

    if (!beatInfo) {
      alert('Please import a beat before proceeding to mix.');
      return;
    }

    if (!hasRecordings) {
      alert('Please record at least one vocal channel before proceeding to mix.');
      return;
    }

    navigate('/fine-tune-mix-page');
  };

  const handleBeatPlayPause = () => {
    setIsBeatPlaying(prev => !prev);
  };

  const handleBeatImport = (beatData) => {
    // Stop playback if beat is being removed
    if (!beatData && isBeatPlaying) {
      setIsBeatPlaying(false);
    }
    setBeatInfo(beatData);
  };

  const tabs = [
    { id: 'verse1', label: 'Verse 1', icon: 'Music2' },
    { id: 'verse2', label: 'Verse 2', icon: 'Music3' },
    { id: 'verse3', label: 'Verse 3', icon: 'Music4' },
    { id: 'hook', label: 'Hook', icon: 'Sparkles' },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-foreground">
          <Icon name="Loader" size={24} className="animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Recording Studio - makingitmixstudio</title>
        <meta
          name="description"
          content="Professional audio recording studio with real-time vocal processing and zero-latency monitoring"
        />
      </Helmet>
      <Header />
      <div className="min-h-screen bg-background pt-[60px]">
        <div className="container-studio py-6 lg:py-8">
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-h2 font-heading mb-2">Recording Studio</h1>
                <p className="text-muted-foreground">
                  Professional vocal recording with real-time processing
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSaveSession}
                  iconName="Save"
                  iconPosition="left"
                  disabled={saving}
                  className="hidden lg:flex"
                >
                  {saving ? 'Saving...' : 'Save Session'}
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleProceedToMix}
                  iconName="ArrowRight"
                  iconPosition="right"
                  className="hidden lg:flex"
                >
                  Proceed to Mix
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-accent/10 border border-accent/20">
              <Icon name="Info" size={20} color="var(--color-accent)" />
              <p className="text-sm">
                Import your beat, select a preset, and start recording your vocals across multiple
                channels. Each section supports lead, double, adlib, and extra vocal tracks.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <BeatImporter
                onBeatImport={handleBeatImport}
                beatInfo={beatInfo}
                isPlaying={isBeatPlaying}
                onPlayPause={handleBeatPlayPause}
              />

              <div className="lg:hidden">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {tabs?.map((tab) => (
                    <button
                      key={tab?.id}
                      onClick={() => setActiveTab(tab?.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-studio flex-shrink-0 ${
                        activeTab === tab?.id
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-card text-foreground border border-border'
                      }`}
                    >
                      <Icon name={tab?.icon} size={16} />
                      <span className="text-sm font-medium">{tab?.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="lg:hidden">
                  {activeTab === 'verse1' && (
                    <VocalChannel
                      title="Verse 1"
                      channels={verse1Channels}
                      onRecord={handleRecord}
                      onPlayback={handlePlayback}
                      onDelete={handleDelete}
                      disabled={!beatInfo}
                    />
                  )}
                  {activeTab === 'verse2' && (
                    <VocalChannel
                      title="Verse 2"
                      channels={verse2Channels}
                      onRecord={handleRecord}
                      onPlayback={handlePlayback}
                      onDelete={handleDelete}
                      disabled={!beatInfo}
                    />
                  )}
                  {activeTab === 'verse3' && (
                    <VocalChannel
                      title="Verse 3"
                      channels={verse3Channels}
                      onRecord={handleRecord}
                      onPlayback={handlePlayback}
                      onDelete={handleDelete}
                      disabled={!beatInfo}
                    />
                  )}
                  {activeTab === 'hook' && (
                    <VocalChannel
                      title="Hook"
                      channels={hookChannels}
                      onRecord={handleRecord}
                      onPlayback={handlePlayback}
                      onDelete={handleDelete}
                      disabled={!beatInfo}
                    />
                  )}
                </div>

                <div className="hidden lg:block space-y-4">
                  <VocalChannel
                    title="Verse 1"
                    channels={verse1Channels}
                    onRecord={handleRecord}
                    onPlayback={handlePlayback}
                    onDelete={handleDelete}
                    disabled={!beatInfo}
                  />
                  <VocalChannel
                    title="Verse 2"
                    channels={verse2Channels}
                    onRecord={handleRecord}
                    onPlayback={handlePlayback}
                    onDelete={handleDelete}
                    disabled={!beatInfo}
                  />
                  <VocalChannel
                    title="Verse 3"
                    channels={verse3Channels}
                    onRecord={handleRecord}
                    onPlayback={handlePlayback}
                    onDelete={handleDelete}
                    disabled={!beatInfo}
                  />
                  <VocalChannel
                    title="Hook"
                    channels={hookChannels}
                    onRecord={handleRecord}
                    onPlayback={handlePlayback}
                    onDelete={handleDelete}
                    disabled={!beatInfo}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <PresetSelector 
                selectedPreset={selectedPreset} 
                onPresetChange={setSelectedPreset}
                disabled={!beatInfo}
              />
              <AutotuneControls
                enabled={autotuneEnabled}
                onToggle={setAutotuneEnabled}
                retuneSpeed={retuneSpeed}
                onRetuneSpeedChange={setRetuneSpeed}
                onSpeedChange={setRetuneSpeed}
                disabled={!beatInfo}
              />
              <DemoCounter />
              <DeviceSelector 
                onDeviceChange={handleDeviceChange}
                disabled={isRecording}
              />
              <MetronomeControl
                enabled={metronomeEnabled}
                bpm={beatInfo?.bpm || 120}
                onToggle={handleMetronomeToggle}
                disabled={isRecording}
              />
              <RecordingControls
                isRecording={isRecording}
                isBeatPlaying={isBeatPlaying}
                onBeatPlayPause={() => setIsBeatPlaying(!isBeatPlaying)}
                disabled={!beatInfo}
                onCountInChange={(value) => console.log('Count-in:', value)}
                onLatencyCalibrate={(latency) => console.log('Latency:', latency)}
                onNoiseGateChange={(value) => console.log('Noise gate:', value)}
              />
              <AudioMeter 
                isRecording={isRecording} 
                level={inputLevel}
              />
              <WaveformVisualizer 
                isRecording={isRecording}
                audioStream={mediaStreamRef?.current}
                onPunchInSelect={null}
                beatDuration={beatInfo?.duration || 180}
                existingRecordingDuration={0}
              />
              {(micPermissionError || recordingError) && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                  <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center flex-shrink-0">
                        <Icon name="AlertTriangle" size={24} color="var(--color-error)" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">
                          {micPermissionError ? 'Microphone Error' : 'Recording Error'}
                        </h3>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {micPermissionError || recordingError}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setMicPermissionError(null);
                          setRecordingError(null);
                        }}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        Dismiss
                      </Button>
                      {micPermissionError && (
                        <Button
                          onClick={() => {
                            setMicPermissionError(null);
                            setRecordingError(null);
                            initializeAudioContext(true);
                          }}
                          className="flex-1 bg-accent hover:bg-accent/90 text-white"
                        >
                          Retry Microphone Access
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {autoMixing && (
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 space-y-3">
                  <div className="flex items-start gap-3">
                    <Icon name="Loader" size={20} color="var(--color-accent)" className="animate-spin" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-accent mb-1">Auto-Mixing</h4>
                      <p className="text-xs text-accent/80">
                        Processing your recording with AI mixing... This will take a moment.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:hidden mt-6">
            <Button
              variant="default"
              size="lg"
              onClick={handleProceedToMix}
              iconName="ArrowRight"
              iconPosition="right"
              className="w-full"
            >
              Proceed to Mix
            </Button>
          </div>
        </div>
      </div>
      {showPunchInSelector && currentRecordingChannel && (
        <PunchInTimeline
          beatDuration={beatInfo?.duration || 180}
          existingRecordingDuration={
            (() => {
              const { channels } = getChannelState(currentRecordingChannel?.section);
              let channel = channels?.find((c) => c?.id === currentRecordingChannel?.channelId);
              return channel?.actualDuration || 0;
            })()
          }
          onPunchInSelect={startRecordingWithPunchIn}
          onCancel={() => {
            setShowPunchInSelector(false);
            setCurrentRecordingChannel(null);
          }}
        />
      )}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Save Session</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Session Title
              </label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e?.target?.value)}
                placeholder="Enter session title"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowSaveDialog(false)}
                disabled={saving}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSaveSession}
                disabled={saving}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="Loader" size={16} className="animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecordingStudio;