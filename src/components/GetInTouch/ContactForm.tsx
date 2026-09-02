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
      
      {/* 1. Names */}
      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label>First name *</label>
          <input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} />
        </div>
        <div className={styles.fieldGroup}>
          <label>Surname *</label>
          <input type="text" name="surname" required value={formData.surname} onChange={handleInputChange} />
        </div>
      </div>

      {/* 2. Contact Details */}
      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label>Email *</label>
          <input type="email" name="email" required value={formData.email} onChange={handleInputChange} />
        </div>
        <div className={styles.fieldGroup}>
          <label>Phone</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} />
        </div>
      </div>

      {/* 3. Dropdown Selection */}
      <div className={styles.fieldGroup}>
        <label>How can we help?</label>
        <select name="helpReason" value={formData.helpReason} onChange={handleInputChange}>
          <option value="" disabled>Choose...</option>
          <option value="1">Modern workplace</option>
          <option value="2">Business applications</option>
          <option value="3">Copilot</option>
          <option value="4">Help and support</option>
        </select>
      </div>

      {/* 4. Textarea Message */}
      <div className={styles.fieldGroup}>
        <label>Message *</label>
        <textarea name="message" required rows={4} placeholder="Enter text..." value={formData.message} onChange={handleInputChange} />
      </div>

      {/* 5. Button Actions Row */}
      <div className={styles.actionsRow}>
        <button type="submit" className={styles.submitBtn}>
          Send message yo
        </button>
      </div>

    </form>
  </div>
)}
