import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const HeroSection = ({ onStartTrial }) => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-card to-background py-12 md:py-16 lg:py-24">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-accent rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-primary rounded-full blur-3xl"></div>
      </div>

      <div className="container-studio relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="flex-1 text-center lg:text-left space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full text-accent text-sm md:text-base font-medium">
              <Icon name="Zap" size={16} />
              <span>Zero Latency Recording</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-heading font-bold text-foreground leading-tight">
              Professional Audio Recording
              <span className="block text-accent mt-2">Made Simple</span>
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              Record, mix, and master studio-quality vocals with professional presets, automated processing, and zero latency. No expensive equipment needed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                variant="default"
                size="lg"
                iconName="Mic"
                iconPosition="left"
                onClick={onStartTrial}
                className="shadow-studio glow-amber"
              >
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                iconName="Play"
                iconPosition="left"
                onClick={() => document.getElementById('how-to-guide')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Icon name="CheckCircle2" size={16} className="text-success" />
                <span>3 Free Demos</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="CheckCircle2" size={16} className="text-success" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="CheckCircle2" size={16} className="text-success" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20 rounded-2xl blur-2xl"></div>
              <div className="relative bg-card rounded-2xl shadow-studio-xl p-6 md:p-8 border border-border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Recording Status</span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                      <span className="text-sm font-medium text-success">Ready</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Icon name="Music" size={20} className="text-accent" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Hip-Hop Preset</p>
                        <p className="text-xs text-muted-foreground">120 BPM • Key: C Minor</p>
                      </div>
                      <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Icon name="Sliders" size={20} className="text-secondary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Auto Mix & Master</p>
                        <p className="text-xs text-muted-foreground">Professional Quality</p>
                      </div>
                      <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Icon name="Download" size={20} className="text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Export WAV/MP3</p>
                        <p className="text-xs text-muted-foreground">High Quality Audio</p>
                      </div>
                      <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
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