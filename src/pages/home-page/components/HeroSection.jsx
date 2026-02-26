import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const HeroSection = ({ onStartTrial }) => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 py-12 md:py-16 lg:py-24">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-amber-600/5 rounded-full blur-3xl"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
      </div>

      <div className="container-studio relative z-10">
        {/* Studio Brand Header */}
        <div className="flex flex-col items-center mb-10 md:mb-14">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden ring-2 ring-amber-500/40 shadow-lg" style={{ boxShadow: '0 0 30px rgba(245,158,11,0.2)' }}>
              <img
                src="/assets/images/JPEG_image-4055-9F47-20-0-1772030553207.jpeg"
                alt="MakingItMixProStudio logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs md:text-sm font-mono font-semibold tracking-[0.3em] uppercase text-amber-400/70">Making It</span>
              <h1
                className="text-2xl md:text-4xl font-black tracking-[0.15em] uppercase leading-none"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 30%, #ffffff 55%, #fbbf24 75%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.4))'
                }}
              >
                MIX PRO STUDIO
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/50"></div>
            <span className="text-xs font-mono tracking-[0.2em] uppercase text-gray-500">Professional Audio Recording</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/50"></div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="flex-1 text-center lg:text-left space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm md:text-base font-medium">
              <Icon name="Zap" size={16} />
              <span>Zero Latency Recording</span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-heading font-bold text-white leading-tight">
              Professional Audio Recording
              <span className="block mt-2" style={{
                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Made Simple</span>
            </h2>

            <p className="text-base md:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto lg:mx-0">
              Record, mix, and master studio-quality vocals with professional presets, automated processing, and zero latency. No expensive equipment needed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                variant="default"
                size="lg"
                iconName="Mic"
                iconPosition="left"
                onClick={onStartTrial}
                className="shadow-studio"
                style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#000', fontWeight: '700', border: 'none' }}
              >
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                iconName="Play"
                iconPosition="left"
                onClick={() => document.getElementById('how-to-guide')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-gray-600 text-gray-300 hover:border-amber-500/50 hover:text-amber-400"
              >
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Icon name="CheckCircle2" size={16} className="text-amber-400" />
                <span>3 Free Demos</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="CheckCircle2" size={16} className="text-amber-400" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="CheckCircle2" size={16} className="text-amber-400" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-2xl blur-2xl"></div>
              <div className="relative bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-700/60" style={{ boxShadow: '0 4px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-400">Recording Status</span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                      <span className="text-sm font-medium text-green-400">Ready</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-lg border border-gray-700/40">
                      <Icon name="Music" size={20} className="text-amber-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">Hip-Hop Preset</p>
                        <p className="text-xs text-gray-500">120 BPM • Key: C Minor</p>
                      </div>
                      <Icon name="ChevronRight" size={16} className="text-gray-600" />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-lg border border-gray-700/40">
                      <Icon name="Sliders" size={20} className="text-amber-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">Auto Mix &amp; Master</p>
                        <p className="text-xs text-gray-500">Professional Quality</p>
                      </div>
                      <Icon name="ChevronRight" size={16} className="text-gray-600" />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-lg border border-gray-700/40">
                      <Icon name="Download" size={20} className="text-amber-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">Export WAV/MP3</p>
                        <p className="text-xs text-gray-500">High Quality Audio</p>
                      </div>
                      <Icon name="ChevronRight" size={16} className="text-gray-600" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700/50">
                    <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
                      <span>Latency: &lt;10ms</span>
                      <span>Sample Rate: 48kHz</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;