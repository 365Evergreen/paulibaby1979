import React, { useState } from 'react';
import styles from './AdaptiveCardForm.module.css';

const POWER_AUTOMATE_URL = 
  'https://azure.com';

interface FormDataState {
  firstName: string;
  surname: string;
  email: string;
  phone: string;
  helpReason: string;
  message: string;
}

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormDataState>({
    firstName: '',
    surname: '',
    email: '',
    phone: '',
    helpReason: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    // Maps the native React keys to match the exact IDs Power Automate expects from your old payload
    const payloadForPowerAutomate = {
      "element-1784786382141-z2ppj4lw1": formData.firstName,
      "element-1784786389693-6gxd4po7t": formData.surname,
      "element-1784786400043-728vv6lh8": formData.email,
      "element-1784786405848-95bzce6n9": formData.phone,
      "element-1784786593713-xuctqkrsf": formData.helpReason,
      "element-1784786740130-xjke2zjoy": formData.message,
    };

    try {
      const response = await fetch(POWER_AUTOMATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadForPowerAutomate),
      });

      if (response.ok) {
        setStatus('success');
        // Clear form upon successful submission
        setFormData({ firstName: '', surname: '', email: '', phone: '', helpReason: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className={styles.cardContainer}>
      <form onSubmit={handleSubmit} className={styles.formElement}>
        
        {/* Row 1: Name Fields */}
        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label htmlFor="firstName">First name <span className={styles.required}>*</span></label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="surname">Surname <span className={styles.required}>*</span></label>
            <input
              type="text"
              id="surname"
              name="surname"
              required
              value={formData.surname}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Row 2: Contact Info Fields */}
        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label htmlFor="email">Email <span className={styles.required}>*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Selection Field */}
        <div className={styles.fieldGroup}>
          <label htmlFor="helpReason">How can we help?</label>
          <select
            id="helpReason"
            name="helpReason"
            value={formData.helpReason}
            onChange={handleInputChange}
          >
            <option value="" disabled>Choose...</option>
            <option value="1">Modern workplace</option>
            <option value="2">Business applications</option>
            <option value="3">Copilot</option>
            <option value="4">Help and support</option>
          </select>
        </div>

        {/* Message Textarea */}
        <div className={styles.fieldGroup}>
          <label htmlFor="message">Message <span className={styles.required}>*</span></label>
          <textarea
            id="message"
            name="message"
            required
            rows={4}
            placeholder="Enter text..."
            value={formData.message}
            onChange={handleInputChange}
          />
        </div>

        {/* Submit Action Container */}
        <div className={styles.actionsRow}>
          <button 
            type="submit" 
            disabled={status === 'submitting'} 
            className={styles.submitBtn}
          >
            {status === 'submitting' ? 'Sending...' : 'Send message yo'}
          </button>
        </div>

      </form>

      {/* Standardised Feedback Indicators */}
      {status !== 'idle' && status !== 'submitting' && (
        <div className={styles.statusBanner}>
          {status === 'success' && <p className={styles.successText}>Submitted successfully!</p>}
          {status === 'error' && <p className={styles.errorText}>An error occurred. Please try again.</p>}
        </div>
      )}
    </div>
  );
};
