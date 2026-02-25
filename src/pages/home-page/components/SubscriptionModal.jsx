import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const SubscriptionModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    agreeTerms: false
  });
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e?.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (modalRef?.current) {
        modalRef?.current?.focus();
      }
    } else {
      document.body.style.overflow = 'unset';
      setStep(1);
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        agreeTerms: false
      });
      setErrors({});
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e?.target === e?.currentTarget) {
      onClose();
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData?.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData?.password) {
      newErrors.password = 'Password is required';
    } else if (formData?.password?.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData?.password !== formData?.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData?.fullName) {
      newErrors.fullName = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData?.cardNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/?.test(formData?.cardNumber?.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Invalid card number';
    }

    if (!formData?.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/?.test(formData?.expiryDate)) {
      newErrors.expiryDate = 'Invalid format (MM/YY)';
    }

    if (!formData?.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/?.test(formData?.cvv)) {
      newErrors.cvv = 'Invalid CVV';
    }

    if (!formData?.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      onSuccess();
      onClose();
    }, 2000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors?.[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const formatCardNumber = (value) => {
    const cleaned = value?.replace(/\s/g, '');
    const chunks = cleaned?.match(/.{1,4}/g);
    return chunks ? chunks?.join(' ') : cleaned;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-background/95 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-card rounded-2xl shadow-studio-xl border border-border my-8"
        tabIndex={-1}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
              {step === 1 ? 'Create Account' : 'Payment Details'}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-studio"
              aria-label="Close"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`flex-1 h-1 rounded-full transition-studio ${
              step >= 1 ? 'bg-accent' : 'bg-muted'
            }`}></div>
            <div className={`flex-1 h-1 rounded-full transition-studio ${
              step >= 2 ? 'bg-accent' : 'bg-muted'
            }`}></div>
          </div>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                name="fullName"
                placeholder="John Doe"
                value={formData?.fullName}
                onChange={handleInputChange}
                error={errors?.fullName}
                required
              />

              <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="john@example.com"
                value={formData?.email}
                onChange={handleInputChange}
                error={errors?.email}
                required
              />

              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="Minimum 8 characters"
                value={formData?.password}
                onChange={handleInputChange}
                error={errors?.password}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                placeholder="Re-enter password"
                value={formData?.confirmPassword}
                onChange={handleInputChange}
                error={errors?.confirmPassword}
                required
              />

              <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                <div className="flex items-start gap-3">
                  <Icon name="Gift" size={20} className="text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Start with 3 Free Demos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      No credit card required for trial recordings
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="default"
                size="lg"
                fullWidth
                onClick={handleNext}
                iconName="ArrowRight"
                iconPosition="right"
              >
                Continue to Payment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Pro Subscription</span>
                  <span className="text-lg font-bold">$10.99/month</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Unlimited recordings • All features • Cancel anytime
                </p>
              </div>

              <Input
                label="Card Number"
                type="text"
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={formatCardNumber(formData?.cardNumber)}
                onChange={(e) => {
                  const cleaned = e?.target?.value?.replace(/\s/g, '');
                  if (cleaned?.length <= 16 && /^\d*$/?.test(cleaned)) {
                    handleInputChange({
                      target: { name: 'cardNumber', value: cleaned }
                    });
                  }
                }}
                error={errors?.cardNumber}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Expiry Date"
                  type="text"
                  name="expiryDate"
                  placeholder="MM/YY"
                  value={formData?.expiryDate}
                  onChange={(e) => {
                    let value = e?.target?.value?.replace(/\D/g, '');
                    if (value?.length >= 2) {
                      value = value?.slice(0, 2) + '/' + value?.slice(2, 4);
                    }
                    handleInputChange({
                      target: { name: 'expiryDate', value }
                    });
                  }}
                  error={errors?.expiryDate}
                  required
                />

                <Input
                  label="CVV"
                  type="text"
                  name="cvv"
                  placeholder="123"
                  value={formData?.cvv}
                  onChange={(e) => {
                    let value = e?.target?.value?.replace(/\D/g, '');
                    if (value?.length <= 4) {
                      handleInputChange({
                        target: { name: 'cvv', value }
                      });
                    }
                  }}
                  error={errors?.cvv}
                  required
                />
              </div>

              <Checkbox
                label="I agree to the Terms of Service and Privacy Policy"
                checked={formData?.agreeTerms}
                onChange={handleInputChange}
                name="agreeTerms"
                error={errors?.agreeTerms}
              />

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Icon name="Lock" size={14} className="text-success" />
                <span>Secured by Stripe • SSL Encrypted</span>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(1)}
                  iconName="ArrowLeft"
                  iconPosition="left"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleSubmit}
                  loading={loading}
                  iconName="CreditCard"
                  iconPosition="left"
                  className="flex-1"
                >
                  Subscribe
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;