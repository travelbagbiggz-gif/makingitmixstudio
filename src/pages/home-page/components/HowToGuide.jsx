import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const HowToGuide = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
  {
    id: 1,
    title: "Import Your Beat",
    description: "Upload your instrumental track and let our AI detect BPM and key automatically. Supports WAV, MP3, and AIFF formats.",
    icon: "Upload",
    image: "https://images.unsplash.com/photo-1669501391974-907566df6590",
    imageAlt: "Professional music producer uploading audio files to digital audio workstation with waveform display on computer screen in modern recording studio",
    features: [
    "Automatic BPM detection",
    "Key identification",
    "Multi-format support"]

  },
  {
    id: 2,
    title: "Record with Presets",
    description: "Choose from professional presets (Hip-Hop, R&B, Pop, Jazz) and record up to 4 vocal layers per section with zero latency.",
    icon: "Mic",
    image: "https://images.unsplash.com/photo-1636127740628-13bf7ce4f7ff",
    imageAlt: "Professional studio condenser microphone with pop filter in recording booth with soundproof foam panels and warm ambient lighting",
    features: [
    "Zero latency monitoring",
    "4 vocal layers per section",
    "Real-time autotune"]

  },
  {
    id: 3,
    title: "Auto Mix & Fine-Tune",
    description: "Our AI automatically mixes your recording, then fine-tune with professional controls for bass, mid, treble, reverb, and echo.",
    icon: "Sliders",
    image: "https://images.unsplash.com/photo-1723246425091-c9bf50b5ba1d",
    imageAlt: "Close-up view of professional audio mixing console with multiple channel faders and knobs in recording studio with LED meters glowing",
    features: [
    "Automated mixing",
    "EQ controls per channel",
    "Reverb & echo effects"]

  },
  {
    id: 4,
    title: "Master & Export",
    description: "Apply professional mastering with loudness targets for streaming, club, or loud playback. Export in WAV or MP3 format.",
    icon: "Download",
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1890d147b-1766943793333.png",
    imageAlt: "Professional audio engineer reviewing final mastered track on digital audio workstation with spectrum analyzer and loudness meters displayed on dual monitors",
    features: [
    "Professional mastering",
    "Multiple loudness targets",
    "WAV & MP3 export"]

  }];


  return (
    <section id="how-to-guide" className="py-12 md:py-16 lg:py-24 bg-background">
      <div className="container-studio">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full text-secondary text-sm md:text-base font-medium mb-4">
            <Icon name="BookOpen" size={16} />
            <span>How It Works</span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-4">
            From Recording to Release in 4 Simple Steps
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional audio production made accessible. No technical knowledge required.
          </p>
        </div>

        <div className="hidden lg:flex items-center justify-center gap-4 mb-12">
          {steps?.map((step, index) =>
          <React.Fragment key={step?.id}>
              <button
              onClick={() => setActiveStep(index)}
              className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-studio ${
              activeStep === index ?
              'bg-accent text-accent-foreground shadow-studio' :
              'bg-card text-muted-foreground hover:bg-muted'}`
              }>
              
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              activeStep === index ? 'bg-accent-foreground/10' : 'bg-muted'}`
              }>
                  <Icon name={step?.icon} size={16} />
                </div>
                <span className="font-medium">{step?.title}</span>
              </button>
              {index < steps?.length - 1 &&
            <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
            }
            </React.Fragment>
          )}
        </div>

        <div className="lg:hidden mb-8">
          <div className="flex overflow-x-auto gap-2 pb-4 snap-x snap-mandatory scrollbar-hide">
            {steps?.map((step, index) =>
            <button
              key={step?.id}
              onClick={() => setActiveStep(index)}
              className={`flex-shrink-0 snap-start px-4 py-2 rounded-lg transition-studio ${
              activeStep === index ?
              'bg-accent text-accent-foreground' :
              'bg-card text-muted-foreground'}`
              }>
              
                <div className="flex items-center gap-2">
                  <Icon name={step?.icon} size={16} />
                  <span className="text-sm font-medium whitespace-nowrap">{step?.title}</span>
                </div>
              </button>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-studio-lg overflow-hidden border border-border">
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="relative aspect-video lg:aspect-auto overflow-hidden">
              <Image
                src={steps?.[activeStep]?.image}
                alt={steps?.[activeStep]?.imageAlt}
                className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent lg:bg-gradient-to-r"></div>
              <div className="absolute bottom-4 left-4 right-4 lg:hidden">
                <div className="flex items-center gap-2 text-foreground">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <Icon name={steps?.[activeStep]?.icon} size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Step {activeStep + 1} of {steps?.length}</p>
                    <p className="font-medium">{steps?.[activeStep]?.title}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 lg:p-12 flex flex-col justify-center">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Icon name={steps?.[activeStep]?.icon} size={24} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-mono">Step {activeStep + 1} of {steps?.length}</p>
                    <h3 className="text-xl md:text-2xl font-heading font-bold text-foreground">
                      {steps?.[activeStep]?.title}
                    </h3>
                  </div>
                </div>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  {steps?.[activeStep]?.description}
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {steps?.[activeStep]?.features?.map((feature, index) =>
                <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="Check" size={12} className="text-success" />
                    </div>
                    <span className="text-sm md:text-base text-foreground">{feature}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                  disabled={activeStep === 0}
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center transition-studio hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-muted disabled:hover:text-current">
                  
                  <Icon name="ChevronLeft" size={20} />
                </button>
                <div className="flex-1 flex gap-2">
                  {steps?.map((_, index) =>
                  <button
                    key={index}
                    onClick={() => setActiveStep(index)}
                    className={`h-1 rounded-full transition-studio flex-1 ${
                    index === activeStep ? 'bg-accent' : 'bg-muted'}`
                    }
                    aria-label={`Go to step ${index + 1}`} />

                  )}
                </div>
                <button
                  onClick={() => setActiveStep((prev) => Math.min(steps?.length - 1, prev + 1))}
                  disabled={activeStep === steps?.length - 1}
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center transition-studio hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-muted disabled:hover:text-current">
                  
                  <Icon name="ChevronRight" size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

};

export default HowToGuide;